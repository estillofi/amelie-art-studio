import { INK_ART } from './ink-regions.js';

// Keep the previous geometry to display saved artwork without changing the child's picture.
const D = 'class="deco"';
export const CLASSIC_PICTURES = [
  {
    id: 'house', en: 'My house', ru: 'Мой дом', icon: '🏠',
    svg: `
      <g class="rg" data-w="grass"><path d="M0 273 Q49 258 93 269 T190 267 T320 264 L320 320 0 320Z"/></g>
      <g class="rg" data-w="sun"><circle cx="58" cy="57" r="27"/></g>
      <g ${D}><path d="m58 16 2-11 m25 21 9-10 M98 53l12-1 M89 81l9 9 M58 96l1 12 M25 84l-9 9 M16 55l-11 2 M25 27l-8-8" fill="none"/><path d="M47 53q3-7 6 0m9 0q3-7 6 0M48 64q12 13 22-2" fill="none"/></g>
      <g class="rg" data-w="cloud"><path d="M202 72q-18 4-18-11t19-13q5-25 29-17 12-20 30-3 23-7 27 15 19 1 20 15 0 14-17 14Z"/></g>
      <g class="rg" data-w="roof"><path d="M86 161 117 137 171 91 227 137 252 164 198 158 139 161Z"/></g>
      <g class="rg" data-w="house"><path d="m100 160 140-1-2 108-139 1Z"/></g>
      <g class="rg" data-w="door"><path d="M153 268 154 215q14-22 31 0l2 53Z"/></g>
      <g class="rg" data-w="window"><path d="m111 177 32-2 2 29-33 1Zm84-2 33 3-2 28-32-2Z"/></g>
      <g ${D}><path d="m126 176 1 29m-15-15 32 1m67-14-1 28m-15-15 32 2M113 139l14 4 10-12m-1-7 12 5 11-13m10-13 14 21 12-2" fill="none"/><circle cx="178" cy="239" r="2" fill="#126c9a"/><path d="m43 255 2-81 8-1-1 84" fill="#dca34c"/></g>
      <g class="rg" data-w="tree"><path d="m48 124-22 37 14-4-21 32 16-3-22 34 30-5 33 5-19-32 14 4-20-34 14 5Z"/></g>
      <g ${D}><path d="m33 165 13-17m-18 39 22-24m-21 43 24-28m234 81 1-48m-1 31-12-10m14 19 11-10" fill="none"/></g>
      <g class="rg" data-w="flower"><path d="M287 214q-16 12-17-4-17-4-6-15-5-16 11-15 8-18 18-4 18-4 15 12 16 8 3 18-5 16-24 8Z"/></g>
      <g ${D}><circle cx="287" cy="195" r="7" fill="#f8d44a"/><path d="m4 292 12-12m9 19 11-12m22 14 8-13m31 17 10-14m99 13 10-16m22 16 12-11m35 10 8-12" fill="none"/></g>`,
  },
  {
    id: 'pets', en: 'My pets', ru: 'Мои питомцы', icon: '🐱',
    svg: `
      <g class="rg" data-w="bird"><path d="M33 74q-7-33 22-39 28-10 39 17 8 25-18 32-17 9-32-2l-17 9Z"/></g>
      <g ${D}><path d="m94 52 15 8-16 6M45 60q14-7 31 8-16 9-27-1m1 16-2 13m20-11 3 12" fill="none"/><circle cx="79" cy="52" r="3" fill="#126c9a"/></g>
      <g class="rg" data-w="fish"><path d="M200 76q30-36 80-3-24 40-77 16l-28 20 4-29-4-20Z"/></g>
      <g ${D}><circle cx="260" cy="75" r="3" fill="#126c9a"/><path d="M237 60q-13 17 0 34m-28-21 14 7-13 6" fill="none"/></g>
      <g class="rg" data-w="cat"><path d="M61 241q-4-49 43-57 53-2 66 51l-10 40-30-1-10-17-8 18-38-1Z"/><path d="m75 139 1-41 31 22 19-2 29-27-2 48q21 42-13 60-35 17-66-9-25-21 1-51Z"/><path d="M165 239q48-10 24-45" fill="none"/></g>
      <g ${D}><path d="m87 144 5 8m39-8-3 8m-25 10 11 1-6 6Zm5 7q-8 13-17 6m17-6q10 13 18 5m-60-21 23 4m-24 9 22-3m62-13-20 5m21 8-22-2m-44 64 5 20m37-20-2 19" fill="none"/></g>
      <g class="rg" data-w="heart"><path d="M210 158q5-20 23-8 10-19 27-4 19 18-19 44-11-5-27-17Z"/></g>
      <g class="rg" data-w="ball"><path d="M217 251q-2-29 30-34 32-3 39 28 4 30-28 35-32 4-41-29Z"/></g>
      <g ${D}><path d="m223 231q26 9 54-3m-57 29q31 8 63-5m-34-34q-13 24 0 60" fill="none"/></g>`,
  },
  {
    id: 'night', en: 'Good night', ru: 'Спокойной ночи', icon: '🌙',
    svg: `
      <g class="rg" data-w="moon"><path d="M96 28q-48 12-45 56 1 48 48 53 30 3 47-24-41 12-54-19-14-30 4-66Z"/></g>
      <g ${D}><path d="m79 79 1 7m-4 12q8 8 17 0m-29-33 6-13m-11 31 7-12m-5 32 7-13m0 25 6-13" fill="none"/></g>
      <g class="rg" data-w="star"><path d="m224 24 10 22 25 2-19 17 6 25-22-13-22 11 6-24-18-18 25-2Zm57 75 7 16 16 1-12 11 4 16-15-8-14 7 3-16-11-12 16-1Zm-118 0 5 12 14 1-11 9 3 13-11-7-11 6 3-12-10-10 13-1Z"/></g>
      <g ${D}><path d="m217 58 1 4m15-4-1 4m-14 5q6 6 11-1" fill="none"/></g>
      <g class="rg" data-w="cloud"><path d="M31 194q-20 4-19-13-1-18 19-17 4-25 28-18 16-15 31 5 23-3 23 16 16 8 5 22Z"/></g>
      <g class="rg" data-w="grass"><path d="M0 281q55-19 111-7 38 12 83 2 66-16 126-2v46H0Z"/></g>
      <g class="rg" data-w="roof"><path d="m165 202 65-55 65 57-38-5-54 2Z"/></g>
      <g class="rg" data-w="house"><path d="m180 201 101 1-2 77-99-1Z"/></g>
      <g class="rg" data-w="window"><path d="m194 215 29-1 1 27-29-1Zm43 0 29 2-2 26-27-2Z"/></g>
      <g ${D}><path d="m207 215 1 25m-13-13 28 1m28-11-1 24m-12-13 26 2m-79-33 14-1m12-11 11-1m11 1 12 5m-33 69 1-16q9-9 18 1l1 15" fill="none"/></g>
      <g class="rg" data-w="heart"><path d="M115 238q1-15 17-10 8-15 21-5 18 17-12 36-24-5-26-21Z"/></g>
      <g ${D}><path d="m15 296 9-12m13 16 11-12m20 15 9-13m18 14 10-14m39 13 10-13m116 12 10-11m17 11 10-13" fill="none"/></g>`,
  },
];

const region = (word, shapes) => `<g class="rg" data-w="${word}">${shapes}</g>`;
const ink = (shapes) => `<g class="deco">${shapes}</g>`;
const eyes = (x, y) => `<path d="m${x} ${y}q4-8 8 0m12 0q4-8 8 0m-23 10q9 11 18 0" fill="none"/>`;
const sun = (x, y, radius = 23) => region('sun', `<circle cx="${x}" cy="${y}" r="${radius}"/>`) + ink(`<path d="m${x} ${y-radius-8}v-9m0 ${2*radius+25}v9m${-radius-16} ${-radius-16}h-9m${2*radius+41} 0h9" fill="none"/>${eyes(x-13,y-4)}`);
const cloud = () => region('cloud', '<path d="M27 81q-17-3-12-18 3-11 16-10 2-19 20-16 13-16 27-2 20-2 21 17 19 3 13 20-3 12-23 11Z"/>');

// Generated colour studies are translated into closed, independently tappable SVG regions.
export const ADVENTURE_PICTURES = [
  {
    id: 'dino-garden', en: 'Dinosaur garden', ru: 'Сад динозавра', profile: 'amelie', preview: 0,
    labels: { dinosaur: 'динозавр', tree: 'дерево', sun: 'солнце', flower: 'цветок', cloud: 'облако', grass: 'трава' },
    svg: region('grass', '<path d="M6 285q53-13 94-4 48 9 96-2 57-12 118 4v28H6Z"/>') + cloud() + sun(264,52) +
      region('tree', '<path d="m51 104-26 44 16-4-28 47 19-4-27 51 38-5-2 45h21l-2-45 37 6-26-49 18 4-27-48 16 6Z"/>') +
      region('dinosaur', '<path d="M94 263q26-7 36-32 10-20 31-28l-1-73q-39 5-48-22-14-38 17-53 30-15 49 11 12 14 15 41l17 93q36 3 46 36l15 34 33 8q-17 14-52 4l-8-19-3 23-28 1-4-32-12 31-29 1 1-36q-23 27-65 21Z"/>') +
      region('flower', '<path d="M273 197q-24 7-23-11-17-10-3-22-2-18 16-15 12-18 23-1 21-2 20 17 17 10 4 24-3 18-22 13Z"/><path d="m274 207-2 59q-24-2-30-24 23-2 30 16l2-21q23-24 34-19-4 24-33 29Z"/>') +
      ink('<path d="m40 155 15-23m-27 62 28-31m-31 56 34-34m-1 55 1 22m78-18 5 20m47-17 6 19m40-19 6 20M141 91q4-8 9-1m14-2q5-9 9-1m-28 15q14 13 24-2" fill="none"/><circle cx="176" cy="133" r="5" fill="#126c9a"/><circle cx="185" cy="163" r="6" fill="#126c9a"/><circle cx="200" cy="222" r="7" fill="#126c9a"/><circle cx="272" cy="176" r="8" fill="none"/>'),
  },
  {
    id: 'cat-dojo', en: 'Kitten at aikido', ru: 'Котёнок на айкидо', profile: 'amelie', preview: 1,
    labels: { cat: 'котёнок', kimono: 'кимоно', belt: 'пояс', mat: 'коврик', ball: 'мяч', star: 'звезда' },
    svg: region('mat', '<path d="m45 256 232 1 33 49-300-1Z"/>') +
      region('star', '<path d="m50 27 9 22 25 3-20 15 5 26-21-15-21 14 6-25L14 50l26-1Z"/>') +
      region('cat', '<path d="M106 221q-40-15-35-55 5-22 24-14 16 8 3 21-12-4-8-11-19 13 18 29Z"/><path d="m112 79-7-39 34 23 33-1 34-28-2 44q31 15 30 46-1 41-63 49-50 4-69-26-22-38 10-69Z"/><path d="m115 243 29 13-4 25-45-2q-8-19 20-36Zm67 12 27-13q28 19 18 37l-44 2Z"/><path d="M109 182q-32-25-42-7-7 17 25 31Zm114-3q22-27 34-9 11 18-17 33Z"/>') +
      region('kimono', '<path d="m137 170 31 10 27-11 45 16-13 29-20-7 7 52-90 2 4-53-26 9-16-32Z"/>') +
      region('belt', '<path d="m124 221 87-1 2 17-88 2Zm39 10-6 42 14 1 8-38 10 34 14-4-15-39Z"/>') +
      region('ball', '<path d="M247 236q-1-25 23-28 28-2 29 26 2 27-25 29-24 1-27-27Z"/>') +
      ink('<path d="m119 82 4-24 18 17m45-1 10-23-1 29m-60 32q6-13 13 0m29-1q6-13 13-1m-34 17 12 1-6 7Zm6 9q-10 15-18 3m18-3q7 16 18 3M106 120l22 4m-23 8 24-1m80-13-19 6m24 9-24-1m-48 42 40 48m21-48-21 26m67 22q23 17 37 13" fill="none"/>'),
  },
  {
    id: 'art-studio', en: 'Little artist', ru: 'Маленький художник', profile: 'amelie', preview: 2,
    labels: { palette: 'палитра', brush: 'кисть', pencil: 'карандаш', book: 'альбом', sun: 'солнце' },
    svg: sun(270,48) +
      region('palette', '<path d="M34 169Q3 136 31 91 51 54 99 65q47 12 48 46 1 25-25 27-21-2-17 14 6 25-16 33-31 11-55-16Z"/>') +
      region('book', '<path d="M39 241q47-15 91 5 45-20 100-7l5 62q-58-14-104 1-44-14-96-2Z"/>') +
      region('brush', '<path d="m138 214 91-99 15 12-96 96-21 9Z"/><path d="m226 115 16-23 17 15-17 22Z"/><path d="M242 94q-5-27 39-37 0 30-22 51Z"/>') +
      region('pencil', '<path d="m54 211 112-57 11 21-112 56-26-1Z"/>') +
      ink('<path d="m130 247 1 53m-82-43 55 3m-58 10 57 1m-58 12 49 2m52-29 60-3m-60 18 58-3m-56 18 53-2m-78-93 8 17m-62 4 8 17m164-101 16 13m-11-29 19-18" fill="none"/><circle cx="59" cy="103" r="12" fill="none"/><circle cx="94" cy="91" r="11" fill="none"/><circle cx="40" cy="137" r="12" fill="none"/><ellipse cx="81" cy="156" rx="13" ry="10" fill="none"/>'),
  },
  {
    id: 'paper-boat', en: 'Sail away!', ru: 'В путь на кораблике', profile: 'amelie', preview: 3,
    labels: { boat: 'кораблик', sail: 'парус', water: 'вода', fish: 'рыбка', sun: 'солнце', cloud: 'облако' },
    svg: region('water', '<path d="M5 244q21-15 41 0t41 0 41 0 41 0 41 0 41 0 63 0v68H5Z"/>') + cloud() + sun(271,59) +
      region('sail', '<path d="m145 77-94 112 92-4Zm10-5 76 116-75-3Z"/>') +
      region('boat', '<path d="m28 200 218-2q-13 51-57 65l-104-1q-42-22-57-62Z"/>') +
      region('fish', '<path d="M214 266q27-33 63-6l27-19-3 28 5 24-27-12q-31 26-65-15Z"/>') +
      ink('<path d="m149 63 2 139m0-137 36 12-35 16m-118 118 204-2m-219 73q17-9 33 0t34 0m16 20q17-10 34 0t31 0m76-44q-9 12 0 24m21-18-7 8 9 4" fill="none"/><circle cx="80" cy="223" r="9" fill="none"/><circle cx="135" cy="225" r="9" fill="none"/><circle cx="190" cy="222" r="9" fill="none"/><circle cx="234" cy="264" r="3" fill="#126c9a"/>'),
  },
  {
    id: 'bunny-picnic', en: 'Bunny picnic', ru: 'Пикник с зайцем', profile: 'amelie', preview: 4,
    labels: { rabbit: 'заяц', carrot: 'морковка', strawberry: 'клубника', cup: 'чашка', butterfly: 'бабочка', grass: 'трава' },
    svg: region('grass', '<path d="M15 282q39-13 79-2 63 8 104-2 55-8 106 7v26H15Z"/>') +
      region('rabbit', '<path d="M125 109q-15-84 6-91 23-5 21 82l13 1q27-78 50-63 17 18-31 78 23 15 19 45-1 27-26 36 27 30 15 62 21 24-8 30l-77-1q-27-6-9-28-17-38 14-65-27-8-28-34-2-32 41-52Z"/>') +
      region('carrot', '<path d="M66 208q-28-24-34 5-3 27 67 62-10-44-33-67Z"/><path d="m47 207-22-28q11-15 21 11-2-30 10-29 13 9-1 35 16-24 24-14 6 14-20 26Z"/>') +
      region('strawberry', '<path d="M229 198q22-15 39 5 17 25-31 62-35-32-27-51 4-10 19-16Z"/><path d="m232 198-11-13 16 4 9-16 5 19 15-2-8 15Z"/>') +
      region('cup', '<path d="m230 269 44-1-4 37-33-1Zm44 3q23-9 22 9-1 20-24 15l1-11q13 3 13-4 1-8-12-1Z"/>') +
      region('butterfly', '<path d="M51 82q-34-40-34-9-2 17 20 20-30 12-15 27 17 13 31-20 15 34 31 17 8-18-15-24 25-4 20-26-10-25-34 14Z"/>') +
      ink('<path d="m127 42 5 44m61-28-22 39m-53 42q5-10 11 0m23 0q5-10 11 0m-28 11 10 1-5 6Zm5 8q-7 12-15 2m15-2q7 13 16 3m-41 58q18 27 27 6m3-4q12 22 28-5M51 82l2 24m-4-28-7-12m12 12 7-13m-29 168 10-9m7 23 10-9m6 23 10-8m155-29 2 5m13-6 2 5m-10 6 2 4m-93 36 2 9m20-10 2 10" fill="none"/>'),
  },
  {
    id: 'space-friends', en: 'Hello, space!', ru: 'Привет, космос!', profile: 'amelie', preview: 5,
    labels: { rocket: 'ракета', flame: 'пламя', window: 'иллюминатор', moon: 'луна', star: 'звезда', planet: 'планета' },
    svg: region('star', '<path d="m58 24 13 29 31 1-24 21 7 30-28-16-25 16 6-31-23-21 30-3Z"/>') +
      region('moon', '<path d="M269 24q-42-4-53 28-11 40 26 53 29 9 48-16-33 4-38-18-8-21 17-47Z"/>') +
      region('planet', '<path d="M214 229q33-30 61 0 31 37-3 63-34 26-61-6-25-29 3-57Z"/>') +
      region('flame', '<path d="m129 210-34 79-1-39-22 25 6-43-25 16 29-55Z"/>') +
      region('rocket', '<path d="M95 142q-34 0-46 50l43-19 19 30-1 43q45-8 46-47 39-15 49-53 14-42 12-74-70 6-101 48Z"/>') +
      region('window', '<path d="M135 130q15-20 34-4 18 18 1 35-16 15-32-1-13-12-3-30Z"/>') +
      ink('<path d="m190 81 21 24m-92 16 62 50m-84-15 45 42m-51-13 24 27m105-157 1 6m11 12q7 9 15 1m-197-11 2 5m14-6 1 5m-17 8q8 8 16-1M199 263q-31 25 6 20 50-5 91-50 20-25-18-7" fill="none"/><circle cx="230" cy="239" r="6" fill="none"/><circle cx="262" cy="278" r="7" fill="none"/>'),
  },
];

export const ART_VERSION = 'ink-v2';
export const PICTURES = [...CLASSIC_PICTURES.map((p, preview) => ({ ...p, preview, study: 'familiar' })), ...ADVENTURE_PICTURES].map((p) => ({
  ...p, legacySvg: p.svg, svg: INK_ART[p.id].svg, ink: INK_ART[p.id], artVersion: ART_VERSION,
  labels: { ...p.labels, blanket: 'плед', grass: 'трава', door: 'дверь' },
}));
export const PICTURE_IDS = PICTURES.map((p) => p.id);
export const pictureForProfile = (id, profile) => PICTURES.find((p) => p.id === id && (!p.profile || p.profile === profile));
export const availablePictures = (profile) => PICTURES.filter((p) => !p.profile || p.profile === profile);

let drawingSerial = 0;
function legacySvgOf(pic, fills = {}) {
  const id = `crayon-${++drawingSerial}`;
  const grain = [...pic.svg.matchAll(/<g class="rg" data-w="\w+">([\s\S]*?)<\/g>/g)].map((match) => `<g class="crayon-grain" fill="url(#${id})">${match[1]}</g>`).join('');
  const decorations = [...pic.svg.matchAll(/<g class="deco">([\s\S]*?)<\/g>/g)].map((m) => m[0]).join('');
  const shapes = pic.svg.replace(/<g class="deco">[\s\S]*?<\/g>/g, '');
  const regions = shapes.replace(/<g class="rg" data-w="(\w+)">/g, (m, word) => `<g class="rg" data-w="${word}" role="button" tabindex="0" aria-label="${word}" fill="${fills[word] || '#fffdf7'}">`);
  return `<svg class="legacy-colouring" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${pic.en}">
    <defs><pattern id="${id}" width="43" height="41" patternUnits="userSpaceOnUse"><path d="M2 15q4-3 8-10m7 5 7-5M28 17l8-8M4 36l9-9m9 9 5-9M32 37l7-5M18 24l7-7" stroke="#126c9a" stroke-width=".7" opacity=".1" fill="none"/><path d="M4 22 14 9m-2 30 7-11m11-4 10-8M24 7l5-5M31 39l9-12" stroke="#fffdf7" stroke-width="1.4" opacity=".38" fill="none"/></pattern><filter id="${id}-pencil" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="7" result="paper"/><feDisplacementMap in="SourceGraphic" in2="paper" scale=".8" xChannelSelector="R" yChannelSelector="G"/></filter></defs>
    <style>.legacy-colouring .rg *{stroke:#126c9a;stroke-width:2.8;stroke-linejoin:round;stroke-linecap:round}.legacy-colouring .deco,.legacy-colouring .crayon-grain{pointer-events:none}.legacy-colouring .deco *{stroke:#126c9a;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.legacy-colouring .crayon-grain *{stroke:none}.legacy-colouring .rg:focus{outline:none;filter:drop-shadow(0 0 2px #126c9a)}</style>
    <g filter="url(#${id}-pencil)">${regions}${grain}${decorations}</g></svg>`;
}

// The visible lines are the generated illustration itself. Paintable masks follow its enclosed areas.
export function svgOf(pic, fills = {}, version = ART_VERSION) {
  if (version !== ART_VERSION) return legacySvgOf({ ...pic, svg: pic.legacySvg }, fills);
  const a = pic.ink;
  const id = `wax-${++drawingSerial}`;
  const regions = a.svg.replace(/<g class="rg" data-w="(\w+)">([\s\S]*?)<\/g>/g, (_, word, shapes) => {
    const paths = shapes.replace(/<path data-part="(\w+)"([^>]+)\/>/g, (shape, part, attributes) => {
      const colour = fills[part] || fills[word];
      const d = attributes.match(/ d="([^"]+)"/)[1];
      return `<path data-part="${part}"${attributes} fill="${colour || '#fffdf7'}"/><path class="crayon-grain" data-texture="${part}" d="${d}" fill-rule="evenodd" fill="url(#${id})" opacity="${colour ? '.55' : '0'}"/>`;
    });
    return `<g class="rg" data-w="${word}" role="button" tabindex="0" aria-label="${word}" fill="${fills[word] || '#fffdf7'}">${paths}</g>`;
  });
  return `<svg class="illustrated-colouring" viewBox="0 0 ${a.width} ${a.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${pic.en}">
    <defs><pattern id="${id}" width="83" height="79" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)"><path d="m2 18 14-11m-4 31 23-20m-8 36 29-24m-20 46 34-26M58 18 77 3M2 73l18-15m46-17 15-14" fill="none" stroke="#fffdf7" stroke-width="1.5" stroke-linecap="round" opacity=".9"/><path d="m22 9 7-6m18 18 12-8m-49 39 8-6m44 26 11-9m-30-7 4-4" stroke="#fffdf7" stroke-width=".7" opacity=".8"/></pattern></defs>
    <style>.illustrated-colouring .rg{cursor:pointer}.illustrated-colouring .crayon-grain,.illustrated-colouring .original-ink{pointer-events:none}.illustrated-colouring .rg:focus-visible{outline:none;filter:drop-shadow(0 0 2px #126c9a)}.illustrated-colouring .original-ink{mix-blend-mode:multiply}</style>
    ${regions}<image class="original-ink" href="assets/colouring/ink/${a.sheet}.webp" x="${-a.x}" y="${-a.y}" width="${a.sheetWidth}" height="${a.sheetHeight}"/>
  </svg>`;
}
