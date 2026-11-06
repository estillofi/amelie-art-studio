// Hand-drawn vector doodles for the Spotlight 2 word list words that the generated atlases do not cover yet.
// Same look as the atlases: blue ink lines, soft crayon fills, a little wobble. viewBox 0 0 100 100.
const room = '<path d="M12 46 50 16 88 46"/><path d="M18 42V88H82V42" fill="#FFF6D6"/>';
const face = (fill, mouth, extra = '') => `<circle cx="50" cy="50" r="36" fill="${fill}"/><circle cx="38" cy="42" r="4" fill="#126c9a"/><circle cx="62" cy="42" r="4" fill="#126c9a"/><path d="${mouth}"/>${extra}`;

export const SVG_DOODLES = {
  pen: '<path d="M28 78 70 22l10 8-42 56-12 4Z" fill="#9CC9FF"/><path d="m70 22 6-7 10 8-6 7M26 90l4-8M36 66l30-40"/>',
  workbook: '<rect x="26" y="14" width="54" height="72" rx="5" fill="#B9E4C9"/><path d="M18 24h14M18 36h14M18 48h14M18 60h14M18 72h14M42 32h28M42 44h28M42 56h20"/>',
  bed: '<path d="M12 58h76v12H12Z" fill="#E0A96D"/><path d="M12 70V36M88 70V50M16 70v12M84 70v12"/><path d="M16 58V48q0-6 6-6h14q6 0 6 6v10Z" fill="#FFFFFF"/><path d="M42 58v-6q0-4 4-4h38q4 0 4 4v6Z" fill="#B9A3FF"/>',
  chair: '<path d="M30 14h40v32H30Z" fill="#FFC48A"/><path d="M24 58h52v9H24Z" fill="#E0A96D"/><path d="M30 46v12M70 46v12M28 67v21M72 67v21M36 26h28M36 36h28"/>',
  table: '<path d="M10 46h80v10H10Z" fill="#E0A96D"/><path d="M18 56v32M82 56v32"/><path d="M42 46V34q8-10 16 0v12Z" fill="#9CC9FF"/><path d="M46 28q-6-10 4-14 0 8 6 10" fill="#FF70A6"/>',
  radio: '<rect x="14" y="38" width="72" height="44" rx="9" fill="#FFB3CF"/><circle cx="36" cy="60" r="12" fill="#FFFFFF"/><circle cx="36" cy="60" r="4"/><path d="M58 52h18M58 60h18M58 68h12M28 38 66 16"/>',
  kitchen: `${room}<path d="M30 60h40v28H30Z" fill="#D9D9D9"/><circle cx="42" cy="68" r="4"/><circle cx="58" cy="68" r="4"/><path d="M36 50h28v10H36Z" fill="#FF9F1C"/><path d="M44 44q3-5 0-10M56 44q3-5 0-10"/>`,
  bedroom: `${room}<path d="M26 66h48v10H26Z" fill="#B9A3FF"/><path d="M26 82V60M74 82V68M30 66v-6h12v6" fill="#FFFFFF"/><path d="M64 30q-8 2-7 10 2 7 10 6-6-2-6-8 0-5 3-8Z" fill="#FFD23F"/>`,
  bathroom: `${room}<path d="M26 64h48v6q0 14-14 14H40q-14 0-14-14Z" fill="#9CC9FF"/><path d="M32 64V52q0-6 6-6"/><circle cx="46" cy="56" r="3"/><circle cx="56" cy="52" r="4"/><circle cx="64" cy="58" r="2.5"/>`,
  'living-room': `${room}<path d="M28 66q0-8 8-8h28q8 0 8 8v6H28Z" fill="#FF70A6"/><path d="M22 66h8v18h-8ZM70 66h8v18h-8Z" fill="#FF70A6"/><path d="M30 72h40v12H30Z" fill="#FFB3CF"/><path d="M46 34h10v12H46Z" fill="#FFD23F"/>`,
  garden: '<path d="M8 88h84"/><path d="M14 88V52l7-7 7 7v36M36 88V52l7-7 7 7v36M58 88V52l7-7 7 7v36" fill="#FFE1A8"/><path d="M84 88V60"/><circle cx="84" cy="54" r="7" fill="#FF70A6"/><path d="M8 66h80M8 78h80"/><path d="M22 88V70M64 88V72"/><circle cx="22" cy="66" r="6" fill="#FFD23F"/><circle cx="64" cy="68" r="6" fill="#B9A3FF"/>',
  bath: '<path d="M12 50h76v8q0 22-22 22H34q-22 0-22-22Z" fill="#9CC9FF"/><path d="m24 80-4 9M76 80l4 9M18 50V26q0-8 8-8t8 8"/><circle cx="42" cy="40" r="6" fill="#FFFFFF"/><circle cx="58" cy="36" r="8" fill="#FFFFFF"/><circle cx="72" cy="42" r="5" fill="#FFFFFF"/>',
  birthday: '<path d="M18 56h64v30H18Z" fill="#FFB3CF"/><path d="M18 68q8 7 16 0t16 0 16 0 16 0M34 56V42M50 56V38M66 56V42"/><path d="M34 42q-5-6 0-12 5 6 0 12M50 38q-5-6 0-12 5 6 0 12M66 42q-5-6 0-12 5 6 0 12" fill="#FFD23F"/>',
  candle: '<path d="M40 42h20v46H40Z" fill="#FFFFFF"/><path d="M50 42V32M40 54q10 5 20 0"/><path d="M50 32q-9-10 0-22 9 12 0 22" fill="#FFD23F"/><path d="M28 88h44"/>',
  party: '<path d="M8 20q42 18 84 0"/><path d="m16 23 6 14 6-12M36 29l6 14 6-13M56 29l6 14 6-13M76 24l5 13 6-14" fill="#FF70A6"/><path d="m36 88 14-40 14 40Z" fill="#B9A3FF"/><circle cx="50" cy="46" r="4" fill="#FFD23F"/><path d="m40 74 10 6 10-6"/>',
  happy: face('#FFD23F', 'M32 58q18 20 36 0'),
  sad: face('#9CC9FF', 'M34 70q16-14 32 0', '<path d="M64 52q5 8 0 13-5-5 0-13" fill="#FFFFFF"/>'),
  chocolate: '<path d="M24 18h52v66H24Z" fill="#A0522D"/><path d="M24 40h52M24 62h52M50 18v66"/><path d="M24 70 76 52v32H24Z" fill="#E6E6E6"/>',
  burger: '<path d="M16 46q0-26 34-26t34 26Z" fill="#FFC48A"/><path d="M14 52q36 10 72 0" stroke="#3BB273" stroke-width="6"/><path d="M16 58h68v10H16Z" fill="#A0522D"/><path d="M16 74h68q0 12-14 12H30q-14 0-14-12Z" fill="#FFC48A"/><path d="M36 32h.1M50 28h.1M62 34h.1" stroke-width="5"/>',
  sandwich: '<path d="M14 66 50 18l36 48Z" fill="#FFE1A8"/><path d="M14 66h72v14H14Z" fill="#FFE1A8"/><path d="M16 66q11-8 22 0t22 0 24 0" stroke="#3BB273" stroke-width="5"/><path d="M22 58 50 24l28 34"/>',
  chips: '<path d="M34 46 30 14M42 46l-2-34M50 46V12M58 46l2-32M66 46l4-30" stroke="#E8B10C" stroke-width="7"/><path d="M28 44h44l-6 44H34Z" fill="#FF4D4F"/><path d="M40 62q10 6 20 0"/>',
  eat: '<circle cx="54" cy="56" r="30" fill="#FFFFFF"/><circle cx="54" cy="56" r="18"/><path d="M12 18v26q0 6 5 6t5-6V18M17 50v38M94 18q-10 0-10 14 0 10 10 10v46"/><circle cx="48" cy="52" r="5" fill="#FF4D4F"/>',
};

export function svgDoodle(name, size = '', label = '') {
  return `<span class="paper-art sketch-art svg-doodle ${size}" ${label ? `role="img" aria-label="${label.replace(/[<>"&]/g, '')}"` : 'aria-hidden="true"'}><svg viewBox="0 0 100 100" fill="none" stroke="#126c9a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${SVG_DOODLES[name]}</svg></span>`;
}
