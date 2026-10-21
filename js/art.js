// One illustration system. Legacy emoji remain storage keys, never platform artwork.
const POSITIONS = {
  "hello": [
    "greetings-art",
    36,
    56,
    254,
    248,
    1254,
    1254
  ],
  "goodbye": [
    "greetings-art",
    336,
    49,
    276,
    260,
    1254,
    1254
  ],
  "yes": [
    "greetings-art",
    668,
    42,
    230,
    255,
    1254,
    1254
  ],
  "no": [
    "greetings-art",
    960,
    55,
    263,
    242,
    1254,
    1254
  ],
  "please": [
    "greetings-art",
    53,
    337,
    233,
    290,
    1254,
    1254
  ],
  "thank-you": [
    "greetings-art",
    358,
    345,
    254,
    275,
    1254,
    1254
  ],
  "friend": [
    "greetings-art",
    612,
    380,
    328,
    234,
    1254,
    1254
  ],
  "teacher": [
    "greetings-art",
    959,
    358,
    282,
    259,
    1254,
    1254
  ],
  "paint": [
    "greetings-art",
    59,
    691,
    232,
    226,
    1254,
    1254
  ],
  "brush": [
    "greetings-art",
    362,
    656,
    241,
    281,
    1254,
    1254
  ],
  "pencil": [
    "greetings-art",
    669,
    657,
    239,
    266,
    1254,
    1254
  ],
  "crayon": [
    "greetings-art",
    978,
    662,
    234,
    254,
    1254,
    1254
  ],
  "paper": [
    "greetings-art",
    33,
    964,
    274,
    253,
    1254,
    1254
  ],
  "picture": [
    "greetings-art",
    342,
    937,
    270,
    273,
    1254,
    1254
  ],
  "scissors": [
    "greetings-art",
    643,
    955,
    275,
    267,
    1254,
    1254
  ],
  "artist": [
    "greetings-art",
    951,
    937,
    289,
    290,
    1254,
    1254
  ],
  "rainbow": [
    "nature",
    14,
    103,
    304,
    213,
    1254,
    1254
  ],
  "draw": [
    "nature",
    333,
    45,
    283,
    298,
    1254,
    1254
  ],
  "sun": [
    "nature",
    643,
    44,
    287,
    289,
    1254,
    1254
  ],
  "house": [
    "nature",
    945,
    71,
    299,
    258,
    1254,
    1254
  ],
  "tree": [
    "nature",
    33,
    349,
    271,
    303,
    1254,
    1254
  ],
  "flower": [
    "nature",
    355,
    367,
    233,
    285,
    1254,
    1254
  ],
  "grass": [
    "nature",
    644,
    435,
    273,
    196,
    1254,
    1254
  ],
  "cloud": [
    "nature",
    942,
    410,
    300,
    209,
    1254,
    1254
  ],
  "star": [
    "nature",
    22,
    693,
    285,
    234,
    1254,
    1254
  ],
  "moon": [
    "nature",
    373,
    682,
    216,
    247,
    1254,
    1254
  ],
  "heart": [
    "nature",
    649,
    686,
    267,
    233,
    1254,
    1254
  ],
  "door": [
    "nature",
    992,
    666,
    212,
    258,
    1254,
    1254
  ],
  "window": [
    "nature",
    42,
    966,
    276,
    247,
    1254,
    1254
  ],
  "roof": [
    "nature",
    318,
    1003,
    309,
    194,
    1254,
    1254
  ],
  "cat": [
    "nature",
    649,
    943,
    264,
    279,
    1254,
    1254
  ],
  "dog": [
    "nature",
    957,
    953,
    280,
    277,
    1254,
    1254
  ],
  "fish": [
    "animals-family",
    40,
    70,
    261,
    200,
    1254,
    1254
  ],
  "bird": [
    "animals-family",
    333,
    46,
    277,
    237,
    1254,
    1254
  ],
  "frog": [
    "animals-family",
    666,
    46,
    256,
    249,
    1254,
    1254
  ],
  "duck": [
    "animals-family",
    989,
    41,
    215,
    256,
    1254,
    1254
  ],
  "horse": [
    "animals-family",
    24,
    323,
    286,
    286,
    1254,
    1254
  ],
  "mouse": [
    "animals-family",
    351,
    352,
    293,
    246,
    1254,
    1254
  ],
  "rabbit": [
    "animals-family",
    693,
    318,
    226,
    288,
    1254,
    1254
  ],
  "bear": [
    "animals-family",
    974,
    326,
    249,
    280,
    1254,
    1254
  ],
  "butterfly": [
    "animals-family",
    37,
    670,
    274,
    220,
    1254,
    1254
  ],
  "mummy": [
    "animals-family",
    409,
    620,
    151,
    298,
    1254,
    1254
  ],
  "daddy": [
    "animals-family",
    711,
    619,
    146,
    300,
    1254,
    1254
  ],
  "sister": [
    "animals-family",
    995,
    639,
    216,
    276,
    1254,
    1254
  ],
  "brother": [
    "animals-family",
    109,
    931,
    142,
    295,
    1254,
    1254
  ],
  "grandma": [
    "animals-family",
    413,
    929,
    146,
    300,
    1254,
    1254
  ],
  "grandpa": [
    "animals-family",
    708,
    926,
    155,
    302,
    1254,
    1254
  ],
  "baby": [
    "animals-family",
    981,
    984,
    223,
    230,
    1254,
    1254
  ],
  "family": [
    "body-aikido",
    35,
    55,
    284,
    299,
    1254,
    1254
  ],
  "head": [
    "body-aikido",
    356,
    68,
    254,
    258,
    1254,
    1254
  ],
  "eyes": [
    "body-aikido",
    661,
    116,
    236,
    181,
    1254,
    1254
  ],
  "ears": [
    "body-aikido",
    941,
    120,
    294,
    179,
    1254,
    1254
  ],
  "nose": [
    "body-aikido",
    73,
    403,
    214,
    207,
    1254,
    1254
  ],
  "mouth": [
    "body-aikido",
    353,
    416,
    246,
    185,
    1254,
    1254
  ],
  "hands": [
    "body-aikido",
    636,
    390,
    294,
    215,
    1254,
    1254
  ],
  "arms": [
    "body-aikido",
    943,
    399,
    288,
    227,
    1254,
    1254
  ],
  "legs": [
    "body-aikido",
    40,
    647,
    264,
    248,
    1254,
    1254
  ],
  "feet": [
    "body-aikido",
    350,
    698,
    276,
    179,
    1254,
    1254
  ],
  "aikido": [
    "body-aikido",
    707,
    631,
    146,
    274,
    1254,
    1254
  ],
  "bow": [
    "body-aikido",
    990,
    653,
    215,
    251,
    1254,
    1254
  ],
  "stand-up": [
    "body-aikido",
    78,
    910,
    203,
    302,
    1254,
    1254
  ],
  "sit-down": [
    "body-aikido",
    370,
    924,
    207,
    278,
    1254,
    1254
  ],
  "turn-around": [
    "body-aikido",
    652,
    916,
    249,
    295,
    1254,
    1254
  ],
  "roll": [
    "body-aikido",
    930,
    968,
    296,
    234,
    1254,
    1254
  ],
  "left": [
    "actions-toys",
    34,
    81,
    259,
    212,
    1254,
    1254
  ],
  "right": [
    "actions-toys",
    352,
    88,
    254,
    201,
    1254,
    1254
  ],
  "strong": [
    "actions-toys",
    660,
    30,
    240,
    265,
    1254,
    1254
  ],
  "sing": [
    "actions-toys",
    946,
    46,
    294,
    249,
    1254,
    1254
  ],
  "dance": [
    "actions-toys",
    27,
    316,
    273,
    327,
    1254,
    1254
  ],
  "jump": [
    "actions-toys",
    343,
    317,
    247,
    320,
    1254,
    1254
  ],
  "run": [
    "actions-toys",
    633,
    295,
    302,
    348,
    1254,
    1254
  ],
  "swim": [
    "actions-toys",
    935,
    295,
    309,
    325,
    1254,
    1254
  ],
  "climb": [
    "actions-toys",
    30,
    654,
    295,
    282,
    1254,
    1254
  ],
  "read": [
    "actions-toys",
    355,
    653,
    240,
    283,
    1254,
    1254
  ],
  "fly": [
    "actions-toys",
    636,
    679,
    299,
    252,
    1254,
    1254
  ],
  "ball": [
    "actions-toys",
    972,
    676,
    245,
    247,
    1254,
    1254
  ],
  "doll": [
    "actions-toys",
    18,
    948,
    289,
    280,
    1254,
    1254
  ],
  "teddy-bear": [
    "actions-toys",
    348,
    940,
    255,
    282,
    1254,
    1254
  ],
  "car": [
    "actions-toys",
    630,
    993,
    295,
    201,
    1254,
    1254
  ],
  "kite": [
    "actions-toys",
    961,
    940,
    280,
    303,
    1254,
    1254
  ],
  "balloon": [
    "food-alphabet",
    61,
    42,
    202,
    286,
    1254,
    1254
  ],
  "apple": [
    "food-alphabet",
    349,
    47,
    242,
    269,
    1254,
    1254
  ],
  "banana": [
    "food-alphabet",
    643,
    43,
    271,
    272,
    1254,
    1254
  ],
  "cake": [
    "food-alphabet",
    959,
    41,
    266,
    285,
    1254,
    1254
  ],
  "ice-cream": [
    "food-alphabet",
    57,
    328,
    198,
    301,
    1254,
    1254
  ],
  "milk": [
    "food-alphabet",
    340,
    397,
    260,
    218,
    1254,
    1254
  ],
  "juice": [
    "food-alphabet",
    686,
    338,
    187,
    286,
    1254,
    1254
  ],
  "pizza": [
    "food-alphabet",
    951,
    355,
    280,
    269,
    1254,
    1254
  ],
  "biscuit": [
    "food-alphabet",
    38,
    629,
    242,
    269,
    1254,
    1254
  ],
  "queen": [
    "food-alphabet",
    342,
    629,
    253,
    289,
    1254,
    1254
  ],
  "umbrella": [
    "food-alphabet",
    632,
    643,
    293,
    276,
    1254,
    1254
  ],
  "violin": [
    "food-alphabet",
    959,
    633,
    264,
    296,
    1254,
    1254
  ],
  "fox": [
    "food-alphabet",
    33,
    932,
    282,
    287,
    1254,
    1254
  ],
  "zebra": [
    "food-alphabet",
    337,
    935,
    287,
    285,
    1254,
    1254
  ],
  "plane": [
    "food-alphabet",
    632,
    980,
    296,
    219,
    1254,
    1254
  ],
  "book": [
    "food-alphabet",
    950,
    986,
    286,
    209,
    1254,
    1254
  ],
  "unicorn": [
    "stickers",
    21,
    32,
    307,
    305,
    1254,
    1254
  ],
  "panda": [
    "stickers",
    364,
    43,
    263,
    289,
    1254,
    1254
  ],
  "strawberry": [
    "stickers",
    664,
    53,
    239,
    279,
    1254,
    1254
  ],
  "ribbon": [
    "stickers",
    953,
    81,
    281,
    254,
    1254,
    1254
  ],
  "dolphin": [
    "stickers",
    26,
    379,
    302,
    274,
    1254,
    1254
  ],
  "sunflower": [
    "stickers",
    365,
    348,
    259,
    308,
    1254,
    1254
  ],
  "lollipop": [
    "stickers",
    686,
    346,
    213,
    310,
    1254,
    1254
  ],
  "ladybird": [
    "stickers",
    957,
    403,
    276,
    237,
    1254,
    1254
  ],
  "octopus": [
    "stickers",
    9,
    663,
    335,
    272,
    1254,
    1254
  ],
  "owl": [
    "stickers",
    364,
    671,
    256,
    264,
    1254,
    1254
  ],
  "cupcake": [
    "stickers",
    669,
    666,
    232,
    267,
    1254,
    1254
  ],
  "turtle": [
    "stickers",
    942,
    698,
    301,
    231,
    1254,
    1254
  ],
  "dinosaur": [
    "stickers",
    31,
    935,
    311,
    286,
    1254,
    1254
  ],
  "backpack": [
    "stickers",
    362,
    945,
    265,
    277,
    1254,
    1254
  ],
  "palette": [
    "stickers",
    659,
    960,
    259,
    247,
    1254,
    1254
  ],
  "alphabet": [
    "stickers",
    943,
    952,
    294,
    265,
    1254,
    1254
  ],
  "speaker": [
    "interface",
    25,
    80,
    312,
    249,
    1254,
    1254
  ],
  "ear": [
    "interface",
    368,
    58,
    237,
    265,
    1254,
    1254
  ],
  "trophy": [
    "interface",
    634,
    60,
    295,
    272,
    1254,
    1254
  ],
  "dice": [
    "interface",
    969,
    82,
    250,
    250,
    1254,
    1254
  ],
  "search": [
    "interface",
    32,
    374,
    269,
    269,
    1254,
    1254
  ],
  "bulb": [
    "interface",
    341,
    354,
    277,
    289,
    1254,
    1254
  ],
  "lock": [
    "interface",
    675,
    387,
    210,
    251,
    1254,
    1254
  ],
  "save": [
    "interface",
    960,
    401,
    269,
    227,
    1254,
    1254
  ],
  "download": [
    "interface",
    44,
    703,
    246,
    221,
    1254,
    1254
  ],
  "upload": [
    "interface",
    357,
    691,
    246,
    229,
    1254,
    1254
  ],
  "repeat": [
    "interface",
    672,
    685,
    244,
    241,
    1254,
    1254
  ],
  "question": [
    "interface",
    1014,
    662,
    191,
    271,
    1254,
    1254
  ],
  "eraser": [
    "interface",
    38,
    971,
    275,
    234,
    1254,
    1254
  ],
  "check": [
    "interface",
    347,
    979,
    275,
    225,
    1254,
    1254
  ],
  "settings": [
    "interface",
    656,
    969,
    258,
    248,
    1254,
    1254
  ],
  "smile": [
    "interface",
    954,
    953,
    264,
    251,
    1254,
    1254
  ]
};
const WORDS = {
  "hello": "hello",
  "goodbye": "goodbye",
  "yes": "yes",
  "no": "no",
  "please": "please",
  "thank you": "thank-you",
  "friend": "friend",
  "teacher": "teacher",
  "paint": "paint",
  "brush": "brush",
  "pencil": "pencil",
  "crayon": "crayon",
  "paper": "paper",
  "picture": "picture",
  "scissors": "scissors",
  "artist": "artist",
  "rainbow": "rainbow",
  "draw": "draw",
  "sun": "sun",
  "house": "house",
  "tree": "tree",
  "flower": "flower",
  "grass": "grass",
  "cloud": "cloud",
  "star": "star",
  "moon": "moon",
  "heart": "heart",
  "door": "door",
  "window": "window",
  "roof": "roof",
  "cat": "cat",
  "dog": "dog",
  "fish": "fish",
  "bird": "bird",
  "frog": "frog",
  "duck": "duck",
  "horse": "horse",
  "mouse": "mouse",
  "rabbit": "rabbit",
  "bear": "bear",
  "butterfly": "butterfly",
  "mummy": "mummy",
  "daddy": "daddy",
  "sister": "sister",
  "brother": "brother",
  "grandma": "grandma",
  "grandpa": "grandpa",
  "baby": "baby",
  "family": "family",
  "head": "head",
  "eyes": "eyes",
  "ears": "ears",
  "nose": "nose",
  "mouth": "mouth",
  "hands": "hands",
  "arms": "arms",
  "legs": "legs",
  "feet": "feet",
  "aikido": "aikido",
  "bow": "bow",
  "stand up": "stand-up",
  "sit down": "sit-down",
  "turn around": "turn-around",
  "roll": "roll",
  "left": "left",
  "right": "right",
  "strong": "strong",
  "sing": "sing",
  "dance": "dance",
  "jump": "jump",
  "run": "run",
  "swim": "swim",
  "climb": "climb",
  "read": "read",
  "fly": "fly",
  "ball": "ball",
  "doll": "doll",
  "teddy bear": "teddy-bear",
  "car": "car",
  "kite": "kite",
  "balloon": "balloon",
  "apple": "apple",
  "banana": "banana",
  "cake": "cake",
  "ice cream": "ice-cream",
  "milk": "milk",
  "juice": "juice",
  "pizza": "pizza",
  "biscuit": "biscuit"
};
const LEGACY = {
  "👋": "hello",
  "🙋‍♀": "goodbye",
  "✅": "yes",
  "❌": "no",
  "🙏": "please",
  "💐": "thank-you",
  "🤝": "friend",
  "👩‍🏫": "teacher",
  "🎨": "palette",
  "🖌": "brush",
  "✏": "pencil",
  "🖍": "crayon",
  "📄": "paper",
  "🖼": "picture",
  "✂": "scissors",
  "🧑‍🎨": "artist",
  "🌈": "rainbow",
  "✍": "draw",
  "☀": "sun",
  "🏠": "house",
  "🌳": "tree",
  "🌸": "flower",
  "🌿": "grass",
  "☁": "cloud",
  "⭐": "star",
  "🌙": "moon",
  "❤": "heart",
  "🚪": "door",
  "🪟": "window",
  "🔺": "roof",
  "🐱": "cat",
  "🐶": "dog",
  "🐟": "fish",
  "🐦": "bird",
  "🐸": "frog",
  "🦆": "duck",
  "🐴": "horse",
  "🐭": "mouse",
  "🐰": "rabbit",
  "🐻": "bear",
  "🦋": "butterfly",
  "👩": "mummy",
  "👨": "daddy",
  "👧": "sister",
  "👦": "brother",
  "👵": "grandma",
  "👴": "grandpa",
  "👶": "baby",
  "👨‍👩‍👧": "family",
  "🙂": "head",
  "👀": "eyes",
  "👂": "ear",
  "👃": "nose",
  "👄": "mouth",
  "🙌": "hands",
  "💪": "strong",
  "🦵": "legs",
  "🦶": "feet",
  "🥋": "aikido",
  "🙇‍♀": "bow",
  "🧍‍♀": "stand-up",
  "🧎‍♀": "sit-down",
  "🔄": "turn-around",
  "🤸‍♀": "roll",
  "⬅": "left",
  "➡": "right",
  "🎤": "sing",
  "💃": "dance",
  "🦘": "jump",
  "🏃‍♀": "run",
  "🏊‍♀": "swim",
  "🧗‍♀": "climb",
  "📖": "read",
  "🕊": "fly",
  "⚽": "ball",
  "🪆": "doll",
  "🧸": "teddy-bear",
  "🚗": "car",
  "🪁": "kite",
  "🎈": "balloon",
  "🍎": "apple",
  "🍌": "banana",
  "🎂": "cake",
  "🍦": "ice-cream",
  "🥛": "milk",
  "🧃": "juice",
  "🍕": "pizza",
  "🍪": "biscuit",
  "🌟": "star",
  "🏆": "trophy",
  "🎉": "star",
  "📒": "book",
  "📚": "book",
  "🔤": "alphabet",
  "🔢": "numbers",
  "🎲": "dice",
  "🔊": "speaker",
  "🔒": "lock",
  "🔁": "repeat",
  "😊": "smile",
  "💡": "bulb",
  "🔎": "search",
  "🔍": "search",
  "💾": "save",
  "🧽": "eraser",
  "❔": "question",
  "❓": "question",
  "🆕": "star",
  "📌": "paper",
  "⬇": "download",
  "⬆": "upload",
  "✓": "check",
  "✔": "check",
  "🦄": "unicorn",
  "🐼": "panda",
  "🍓": "strawberry",
  "🎀": "ribbon",
  "🐬": "dolphin",
  "🌻": "sunflower",
  "🦊": "fox",
  "🍭": "lollipop",
  "🐞": "ladybird",
  "🐙": "octopus",
  "🦉": "owl",
  "🧁": "cupcake",
  "🐢": "turtle",
  "💛": "heart",
  "🌞": "sun",
  "👸": "queen",
  "☂": "umbrella",
  "🎻": "violin",
  "🦓": "zebra",
  "🟠": "orange",
  "🟡": "yellow"
};
const TOPICS = { hello: 'hello', colours: 'palette', art: 'brush', picture: 'sun', numbers: 'numbers', animals: 'cat', family: 'family', body: 'hands', aikido: 'aikido', ican: 'dance', toys: 'teddy-bear', food: 'apple' };
const COLORS = { red: '#FF4D4F', blue: '#3A86FF', yellow: '#FFD23F', green: '#3BB273', orange: '#FF9F1C', purple: '#8E5CF7', pink: '#FF70A6', brown: '#A0522D', black: '#292D32', white: '#FFFFFF', grey: '#9CA3AF' };
const escape = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const normalize = (value) => String(value || '').replace(/[\uFE0E\uFE0F]/g, '');
const SYMBOL = /\p{Extended_Pictographic}(?:[\uFE0E\uFE0F])?(?:[\u{1F3FB}-\u{1F3FF}])?(?:\u200D\p{Extended_Pictographic}(?:[\uFE0E\uFE0F])?(?:[\u{1F3FB}-\u{1F3FF}])?)*|[✓✔]/gu;

export function art(name, size = '', label = '') {
  name = normalize(name);
  name = LEGACY[name] || name;
  if (name === 'numbers') return `<span class=\"paper-art sketch-art drawn-numbers ${size}\" aria-hidden=\"true\">1<span>2</span>3</span>`;
  if (Object.hasOwn(COLORS, name)) return colorArt(COLORS[name], size, label);
  const [sheet, x, y, width, height, atlasWidth, atlasHeight] = POSITIONS[name] || POSITIONS.question;
  const extent = Math.max(width, height) / .92;
  const style = `width:${width / extent * 100}%;height:${height / extent * 100}%;background-image:url('assets/doodles/${sheet}.webp');background-size:${atlasWidth / width * 100}% ${atlasHeight / height * 100}%;background-position:${x / (atlasWidth - width) * 100}% ${y / (atlasHeight - height) * 100}%`;
  return `<span class="paper-art sketch-art ${size}" ${label ? `role="img" aria-label="${escape(label)}"` : 'aria-hidden="true"'}><span class="sketch-ink" style="${style}"></span></span>`;
}

export function colorArt(color, size = '', label = '') {
  // The exact lesson color stays visible; blue sketch marks only outline its edge.
  return `<svg class=\"drawn-color ${size}\" viewBox=\"0 0 100 90\" ${label ? `role=\"img\" aria-label=\"${escape(label)}\"` : 'aria-hidden=\"true\"'}><path d=\"M12 29 Q8 12 33 12 Q55 3 77 17 Q94 26 88 52 Q88 77 63 79 Q34 89 15 67 Q3 53 12 29Z\" fill=\"${escape(color)}\" stroke=\"#126c9a\" stroke-width=\"2.3\"/><path d=\"M16 31 22 21 M14 40 31 17 M14 51 39 16 M18 63 26 52 M29 73 37 63 M55 77 68 65 M76 67 83 55\" stroke=\"#126c9a\" opacity=\".3\" fill=\"none\" stroke-width=\"1.3\"/></svg>`;
}

export function wordArt(word, size = '') {
  if (word.color) return colorArt(word.color, size, word.ru);
  if (word.num) return `<span class=\"num sketch-number ${size}\" role=\"img\" aria-label=\"${escape(word.ru)}\">${Number(word.num)}</span>`;
  const key = Object.hasOwn(WORDS, word.en) ? WORDS[word.en] : POSITIONS[word.en] ? word.en : String(word.pic || '').startsWith('sketch:') ? word.pic.slice(7) : LEGACY[normalize(word.pic)];
  return art(key || 'question', size, word.ru);
}
export const topicArt = (topic, size = '') => art(TOPICS[topic.id] || 'book', size);
export const symbolArt = (symbol, size = 'symbol-art') => art(LEGACY[normalize(symbol)] || symbol, size);

// Upgrade stored legacy sticker keys and inline symbols, including dynamic game rounds.
// No stored profile, reward, topic or word record is rewritten.
export function renderSymbols(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement || node.parentElement.closest('script,style,svg,textarea,.sketch-art')) continue;
    SYMBOL.lastIndex = 0;
    if (SYMBOL.test(node.textContent)) nodes.push(node);
  }
  for (const node of nodes) {
    if (node.parentElement.closest('option')) { node.textContent = node.textContent.replace(SYMBOL, '').trim(); continue; }
    const fragment = document.createDocumentFragment();
    let previous = 0;
    SYMBOL.lastIndex = 0;
    for (const match of node.textContent.matchAll(SYMBOL)) {
      fragment.append(document.createTextNode(node.textContent.slice(previous, match.index)));
      const template = document.createElement('template');
      template.innerHTML = symbolArt(match[0]);
      fragment.append(template.content);
      previous = match.index + match[0].length;
    }
    fragment.append(document.createTextNode(node.textContent.slice(previous)));
    node.replaceWith(fragment);
  }
}

export function decorate(root) {
  renderSymbols(root);
  const selector = '.welcome,.school-section,.card,.step,.tile,.opt,.w,.note,.canvas,.cel-card';
  const surfaces = [...root.querySelectorAll(selector)];
  if (root.matches?.(selector)) surfaces.unshift(root);
  for (const surface of surfaces) {
    if (surface.querySelector(':scope > .material-shadow')) continue;
    const material = document.createElement('span');
    material.className = 'material-layer'; material.setAttribute('aria-hidden', 'true');
    const shadow = document.createElement('span');
    shadow.className = 'material-shadow'; shadow.setAttribute('aria-hidden', 'true');
    shadow.append(material); surface.classList.add('paper-surface'); surface.prepend(shadow);
  }
}

export function observeArt(root = document.body) {
  decorate(root);
  const observer = new MutationObserver((records) => {
    const roots = new Set();
    for (const record of records) {
      if (record.type === 'characterData') roots.add(record.target.parentElement);
      else for (const node of record.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE) roots.add(node.parentElement);
        else if (node.nodeType === Node.ELEMENT_NODE && !node.matches('.material-layer,.material-shadow,.sketch-art')) roots.add(node);
      }
    }
    for (const node of roots) if (node?.isConnected && !node.closest('svg,.sketch-art')) decorate(node);
  });
  observer.observe(root, {childList:true, subtree:true, characterData:true});
  return () => observer.disconnect();
}
