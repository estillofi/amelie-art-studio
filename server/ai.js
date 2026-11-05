import Anthropic from '@anthropic-ai/sdk';
import { randomBytes } from 'node:crypto';
import { REGION_WORD } from '../js/data-model.js';

// Claude labels the numbered regions of a parent's colouring page. The browser traces the picture;
// only the line drawing with numbers reaches the API (no photo of the child, no name, no progress).
export const AI_MODEL = 'claude-opus-5-5';
// Priced at Claude Opus 5 rates ($5 / $25 per MTok) so a server-side fallback can never exceed the cap.
const RATE = { input: 5 / 1e6, output: 25 / 1e6 };
const MAX_TOKENS = 6000;
const MAX_IMAGE = 2_000_000; // base64 characters

const SYSTEM = `You label colouring pages for a children's English app. The child is eight, a beginner (CEFR pre-A1), and speaks Russian.
The image is a line drawing. Red numbers mark the regions a child can colour.
For every number you are given, name what that region shows with one simple concrete English noun a young child knows, such as sun, roof, cat, sky, grass, hat, flower, background. Lowercase, no articles, at most two words.
Prefer words from the vocabulary list when one fits. Several regions may share a word (two windows are both "window").
If a region is a meaningless fragment, or you cannot tell what it is, return an empty string for both en and ru.
Give the Russian translation in the nominative case.
Suggest a natural colour for the region from the colour list, or an empty string if any colour works.
Also give the picture a short title: two to four English words and its Russian translation.`;

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['title_en', 'title_ru', 'regions'],
  properties: {
    title_en: { type: 'string' }, title_ru: { type: 'string' },
    regions: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['n', 'en', 'ru', 'colour'],
      properties: { n: { type: 'integer' }, en: { type: 'string' }, ru: { type: 'string' }, colour: { type: 'string' } } } },
  },
};

const fail = (message, status) => Object.assign(new Error(message), { status });
const month = (date) => date.toISOString().slice(0, 7);
const cost = (input, output) => input * RATE.input + output * RATE.output;
const cleanRu = (v) => (typeof v === 'string' ? v.trim().replace(/[<>\u0000-\u001f]/g, '').slice(0, 40) : '');
function cleanEn(v) {
  const word = (typeof v === 'string' ? v : '').trim().toLowerCase().replace(/^(?:the|a|an)\s+/, '').replace(/\s+/g, ' ');
  return word.length <= 30 && REGION_WORD.test(word) ? word : '';
}

// Bill the larger of the top-level usage and the sum over fallback hops: never under-count.
function usageOf(response) {
  const u = response.usage || {};
  let input = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
  let output = u.output_tokens || 0;
  if (Array.isArray(u.iterations) && u.iterations.length) {
    input = Math.max(input, u.iterations.reduce((s, x) => s + (x.input_tokens || 0) + (x.cache_creation_input_tokens || 0) + (x.cache_read_input_tokens || 0), 0));
    output = Math.max(output, u.iterations.reduce((s, x) => s + (x.output_tokens || 0), 0));
  }
  return { input, output };
}

export function openAI({ db, client = null, apiKey = process.env.ANTHROPIC_API_KEY, limit = Number(process.env.AI_MONTHLY_BUDGET_USD || 2), now = () => new Date() } = {}) {
  db.exec(`CREATE TABLE IF NOT EXISTS ai_usage (id TEXT PRIMARY KEY, month TEXT NOT NULL, kind TEXT NOT NULL, status TEXT NOT NULL,
    reserved REAL NOT NULL, cost REAL NOT NULL DEFAULT 0, model TEXT, input_tokens INTEGER, output_tokens INTEGER, ts INTEGER NOT NULL, note TEXT)`);
  const enabled = Boolean(client || apiKey);
  let api = client;
  let busy = false;
  // A pending reservation (also one left by a crash) counts in full until it is settled.
  const spent = (m) => db.prepare("SELECT COALESCE(SUM(CASE WHEN status='pending' THEN reserved ELSE cost END),0) AS v FROM ai_usage WHERE month=?").get(m).v;
  const round = (v) => Math.round(v * 10000) / 10000;

  const ai = {
    enabled,
    status() {
      const m = month(now()); const used = spent(m);
      return { enabled, model: AI_MODEL, month: m, spent: round(used), limit, remaining: round(Math.max(0, limit - used)) };
    },
    async labelPicture({ image, numbers, vocabulary = [], colours = [] }) {
      if (!enabled) throw fail('ИИ не подключён: на сервере нет ключа ANTHROPIC_API_KEY. Подпишите области вручную.', 503);
      const parsed = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/.exec(typeof image === 'string' ? image : '');
      if (!parsed || image.length > MAX_IMAGE) throw fail('Нужна картинка JPEG, PNG или WebP до 1,5 МБ', 400);
      if (!Array.isArray(numbers) || !numbers.length || numbers.length > 120 || !numbers.every((n) => Number.isSafeInteger(n) && n >= 1 && n <= 4000)) throw fail('Некорректный список областей', 400);
      if (busy) throw fail('Предыдущая картинка ещё подписывается. Подождите минуту.', 409);
      const m = month(now());
      // Upper bound: image tokens (≈ pixels / 750, under 1600 at our size) + text, and the full output allowance.
      const reserve = cost(1600 + 3000 + vocabulary.length * 3, MAX_TOKENS);
      if (spent(m) + reserve > limit) throw fail(`Месячный лимит ИИ ($${limit}) исчерпан. Подпишите области вручную или увеличьте AI_MONTHLY_BUDGET_USD.`, 402);
      busy = true;
      const id = randomBytes(8).toString('hex');
      db.prepare("INSERT INTO ai_usage(id,month,kind,status,reserved,ts) VALUES(?,?,'label-picture','pending',?,?)").run(id, m, reserve, Date.now());
      let response;
      try {
        api ||= new Anthropic({ apiKey, maxRetries: 1, timeout: 120000 });
        response = await api.beta.messages.create({
          model: AI_MODEL,
          max_tokens: MAX_TOKENS,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          thinking: { type: 'adaptive' },
          output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
          system: SYSTEM,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: parsed[1], data: parsed[2] } },
            { type: 'text', text: `Region numbers: ${numbers.join(', ')}\nVocabulary: ${vocabulary.join(', ') || '(none)'}\nColours: ${colours.join(', ') || '(any)'}` },
          ] }],
        });
      } catch (error) {
        db.prepare("UPDATE ai_usage SET status='failed', note=? WHERE id=?").run(String(error?.status || error?.name || 'error'), id);
        busy = false;
        if (error instanceof Anthropic.AuthenticationError) throw fail('Ключ ANTHROPIC_API_KEY не подходит. Проверьте его в настройках Railway.', 503);
        if (error instanceof Anthropic.RateLimitError) throw fail('ИИ сейчас перегружен. Попробуйте через минуту.', 429);
        if (error instanceof Anthropic.APIError) throw fail('ИИ не ответил. Попробуйте ещё раз или подпишите области вручную.', 502);
        throw fail('Не удалось связаться с ИИ. Попробуйте ещё раз.', 502);
      }
      const usage = usageOf(response);
      const price = cost(usage.input, usage.output);
      const settle = (status, note = null) => db.prepare('UPDATE ai_usage SET status=?, cost=?, model=?, input_tokens=?, output_tokens=?, note=? WHERE id=?').run(status, price, response.model || AI_MODEL, usage.input, usage.output, note, id);
      busy = false;
      if (response.stop_reason === 'refusal') { settle('refused', response.stop_details?.category || null); throw fail('ИИ отказался подписывать эту картинку. Подпишите области вручную.', 422); }
      if (response.stop_reason === 'max_tokens') { settle('truncated'); throw fail('ИИ не успел подписать все области. Попробуйте ещё раз.', 502); }
      const text = [...(response.content || [])].reverse().find((b) => b.type === 'text')?.text;
      let out;
      try { out = JSON.parse(text); } catch { settle('invalid'); throw fail('ИИ вернул непонятный ответ. Попробуйте ещё раз.', 502); }
      settle('done');
      const wanted = new Set(numbers);
      const colourSet = new Set(colours);
      const seen = new Set();
      const regions = (Array.isArray(out?.regions) ? out.regions : []).flatMap((r) => {
        if (!wanted.has(r?.n) || seen.has(r.n)) return [];
        seen.add(r.n);
        const en = cleanEn(r.en); const ru = cleanRu(r.ru);
        return [{ n: r.n, en: en && ru ? en : '', ru: en && ru ? ru : '', colour: colourSet.has(r.colour) ? r.colour : '' }];
      });
      return {
        title: { en: cleanRu(out?.title_en).slice(0, 40) || 'My picture', ru: cleanRu(out?.title_ru) || 'Моя картинка' },
        regions, cost: round(price), budget: ai.status(),
      };
    },
  };
  return ai;
}
