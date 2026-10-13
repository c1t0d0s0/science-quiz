import type { Background, Card, Item, Look } from '../data/cards';
import { h, hanamaruPoints } from './dom';

// 柴犬 (このアプリのキャラクター) と、柴犬カードの絵。
// 目や輪郭は、画面の明暗に関係なくこの色にする (文字色に合わせると暗い画面で白目になる)
const LINE = '#1c2a4a';
const RED = '#e8546a';
const YELLOW = '#ffd23f';

/** 色の指定があればその色、なければ CSS のクラス (暗い画面で少し色を落とす) を使う */
const paint = (color: string | undefined, cls: string) => (color ? `fill="${color}"` : `class="${cls}"`);

const sparkle = (cx: number, cy: number, r: number, fill = YELLOW) =>
  `<path fill="${fill}" d="M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z"/>`;

const EYE_Y = 69;
const EYE_X = [42, 78];

function eyes(look: Look): string {
  const open = (x: number) =>
    look.eyeColor
      ? `<ellipse cx="${x}" cy="${EYE_Y}" rx="7.5" ry="8.5" fill="${look.eyeColor}" stroke="${LINE}" stroke-width="1.6"/>` +
        `<ellipse cx="${x}" cy="${EYE_Y}" rx="3.3" ry="6.4" fill="${LINE}"/>` +
        `<circle cx="${x + 2.6}" cy="${EYE_Y - 3.6}" r="2" fill="#fff"/>`
      : `<ellipse cx="${x}" cy="${EYE_Y}" rx="7.5" ry="8.5" fill="${LINE}"/>` +
        `<circle cx="${x + 2.6}" cy="${EYE_Y - 3.6}" r="3.1" fill="#fff"/>` +
        `<circle cx="${x - 2.6}" cy="${EYE_Y + 3.6}" r="1.5" fill="#fff"/>`;
  const arc = (x: number, up: boolean) =>
    `<path fill="none" stroke="${LINE}" stroke-width="2.8" stroke-linecap="round" d="M${x - 7} ${EYE_Y + (up ? 2 : -1)}Q${x} ${EYE_Y + (up ? -8 : 7)} ${x + 7} ${EYE_Y + (up ? 2 : -1)}"/>`;
  const [l, r] = EYE_X;
  switch (look.eyes ?? 'open') {
    case 'wink':
      return open(l) + arc(r, true);
    case 'sleep':
      return arc(l, false) + arc(r, false);
    case 'happy':
      return arc(l, true) + arc(r, true);
    case 'sparkle':
      return open(l) + open(r) + sparkle(l - 11, EYE_Y - 12, 4.5) + sparkle(r + 11, EYE_Y - 12, 4.5);
    case 'brave':
      return (
        open(l) +
        open(r) +
        `<path fill="none" stroke="${LINE}" stroke-width="3" stroke-linecap="round" d="M33 56L50 60.5M87 56L70 60.5"/>`
      );
    default:
      return open(l) + open(r);
  }
}

function mouth(look: Look): string {
  // 柴犬の鼻は、黒くて大きい
  const nose = `<path fill="${LINE}" d="M53.5 78.6Q60 75.4 66.5 78.6Q64.6 85 60 85.6Q55.4 85 53.5 78.6Z"/><ellipse cx="58.2" cy="79.4" rx="1.6" ry="0.9" fill="#fff" opacity="0.7"/>`;
  const lines = `<path fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round" d="M60 85.6V88M60 88C58 92.5 52.5 92.5 51 89M60 88C62 92.5 67.5 92.5 69 89"/>`;
  switch (look.mouth ?? 'tongue') {
    case 'smile':
      return nose + lines;
    case 'open':
      return (
        `<path fill="#8a3b3b" stroke="${LINE}" stroke-width="2" stroke-linejoin="round" d="M51.5 89Q60 102.5 68.5 89Z"/>` +
        `<ellipse class="shiba-tongue" cx="60" cy="95.2" rx="4" ry="2.6"/>` +
        nose +
        `<path fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round" d="M60 85.6V89"/>`
      );
    default:
      return `<path class="shiba-tongue" d="M56.2 90.5Q60 99 63.8 90.5Z"/>` + nose + lines;
  }
}

const ITEMS: Record<Item, string> = {
  ribbon:
    `<g transform="translate(87 31) rotate(18)" stroke="${LINE}" stroke-width="2" stroke-linejoin="round" fill="${RED}">` +
    `<path d="M0 0L-14 -8.5V8.5Z"/><path d="M0 0L14 -8.5V8.5Z"/><circle r="4"/></g>`,
  glasses:
    `<g fill="rgba(255,255,255,0.3)" stroke="${LINE}" stroke-width="2.6">` +
    `<circle cx="42" cy="69" r="11.5"/><circle cx="78" cy="69" r="11.5"/>` +
    `<path fill="none" stroke-linecap="round" d="M53.5 67.5Q60 63.5 66.5 67.5M30.5 67L21 63M89.5 67L99 63"/></g>`,
  pencil:
    `<g transform="rotate(30 97 34)" stroke="${LINE}" stroke-width="2" stroke-linejoin="round">` +
    `<rect x="93" y="12" width="8" height="6" fill="#f7a3b0"/><rect x="93" y="18" width="8" height="26" fill="${YELLOW}"/>` +
    `<path fill="#f6e0b5" d="M93 44H101L97 54Z"/><path fill="${LINE}" stroke="none" d="M95.4 50H98.6L97 54Z"/></g>`,
  hat:
    `<g stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round">` +
    `<ellipse cx="60" cy="31" rx="43" ry="7.5" fill="#f0d27a"/>` +
    `<path fill="#f5dc8e" d="M37 30C37 6 83 6 83 30Q60 36 37 30Z"/>` +
    `<path fill="${RED}" d="M37.2 24Q60 19 82.8 24L83 30Q60 36 37 30Z"/></g>`,
  scarf:
    `<g fill="${RED}" stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round">` +
    `<path d="M73 110L79 129L90 125L85 107Z"/><path d="M25 97Q60 113 95 97L97 107Q60 125 23 107Z"/></g>` +
    `<path fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8" d="M38 107Q60 115 82 107"/>`,
  flower:
    `<g transform="translate(88 31)" stroke="${LINE}" stroke-width="1.6">` +
    [0, 72, 144, 216, 288].map((a) => `<circle r="5.4" cx="0" cy="-6.6" fill="#ff9fb5" transform="rotate(${a})"/>`).join('') +
    `<circle r="4" fill="${YELLOW}"/></g>`,
  flask:
    `<g transform="translate(88 96) rotate(-10)" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round">` +
    `<path fill="#eaf6ff" d="M-5 -22H5V-8L15 12Q16 16 12 16H-12Q-16 16 -15 12L-5 -8Z"/>` +
    `<path fill="#6cc0e8" stroke="none" d="M-9.5 1H9.5L14 11.5Q14.6 14.4 11.6 14.4H-11.6Q-14.6 14.4 -14 11.5Z"/>` +
    `<path fill="none" d="M-7.5 -22H7.5"/></g>` +
    `<g fill="#fff" stroke="${LINE}" stroke-width="1.2"><circle cx="91" cy="71" r="2.6"/><circle cx="97" cy="63" r="1.9"/></g>`,
  headband:
    `<g stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round" fill="#fff">` +
    `<path d="M97 52L112 44L110 53L114 60L98 58Z"/><path d="M21 50Q60 33 99 50L99.5 59Q60 42 20.5 59Z"/></g>` +
    `<circle cx="60" cy="44.5" r="4.4" fill="#d63c2c"/>`,
  magnifier:
    `<g transform="translate(93 96)" stroke="${LINE}" stroke-linejoin="round" stroke-linecap="round">` +
    `<path stroke-width="7" d="M7.5 7.5L19 19"/><path stroke="#b9793c" stroke-width="3.6" d="M7.5 7.5L19 19"/>` +
    `<circle r="11" fill="rgba(215,238,250,0.85)" stroke-width="3"/>` +
    `<path fill="none" stroke="#fff" stroke-width="2" d="M-6 -3Q-4 -7 0 -7.5"/></g>`,
  cap:
    `<g stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round">` +
    `<path fill="#2f55a8" d="M38 33C24 33 11 37 6 44C24 45 46 41 62 35Z"/>` +
    `<path fill="#3f6fd1" d="M35 34C35 8 85 8 85 34Q60 28 35 34Z"/></g>` +
    `<circle cx="60" cy="13.5" r="2.6" fill="#fff" stroke="${LINE}" stroke-width="1.5"/>` +
    `<path fill="none" stroke="#fff" stroke-width="1.6" opacity="0.7" d="M60 16V30"/>`,
  bulb:
    `<g transform="translate(60 9)" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">` +
    `<path fill="${YELLOW}" d="M0 -14C-9 -14 -13 -7 -13 -1C-13 4 -9 7 -7 11H7C9 7 13 4 13 -1C13 -7 9 -14 0 -14Z"/>` +
    `<rect x="-6" y="11" width="12" height="7" rx="2" fill="#c9d2dc"/>` +
    `<path fill="none" stroke-width="1.6" d="M-4 2L0 6L4 2"/></g>` +
    `<path fill="none" stroke="${YELLOW}" stroke-width="2.6" stroke-linecap="round" d="M34 4L28 -1M86 4L92 -1M60 -9V-13M40 -6L37 -11M80 -6L83 -11"/>`,
  sprout:
    `<g transform="translate(60 27)" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">` +
    `<path fill="none" d="M0 2V-10"/>` +
    `<path fill="#7fca6a" d="M0 -10C-4 -20 -15 -21 -19 -17C-15 -10 -6 -8 0 -10Z"/>` +
    `<path fill="#9bd97f" d="M0 -10C4 -22 16 -23 20 -19C16 -11 6 -8 0 -10Z"/></g>`,
  doctor:
    `<g stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">` +
    `<path fill="#2f3a66" d="M37 31C37 22 83 22 83 31Q60 37 37 31Z"/>` +
    `<path fill="#3d4b85" d="M60 4L106 18L60 32L14 18Z"/>` +
    `<path fill="none" stroke="${YELLOW}" d="M60 18L96 23V38"/></g>` +
    `<path fill="${YELLOW}" stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round" d="M92.5 38H99.5L98.5 48H93.5Z"/>`,
  crown:
    `<path fill="${YELLOW}" stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round" d="M38 32L35 8L49 20L60 2L71 20L85 8L82 32Q60 26 38 32Z"/>` +
    `<circle cx="60" cy="21" r="3.6" fill="#d63c2c" stroke="${LINE}" stroke-width="1.4"/>` +
    `<circle cx="45.5" cy="24" r="2.6" fill="#4a90e2" stroke="${LINE}" stroke-width="1.2"/>` +
    `<circle cx="74.5" cy="24" r="2.6" fill="#3fb37f" stroke="${LINE}" stroke-width="1.2"/>`,
  zzz:
    `<g fill="#fff" font-family="sans-serif" font-weight="700">` +
    `<text x="90" y="34" font-size="13">z</text><text x="99" y="22" font-size="16">z</text><text x="110" y="8" font-size="19">z</text></g>`,
};

/**
 * 柴犬の顔 (たて 110 × よこ 120 の中にかく)。ぴんと立った三角の耳、白いほおと口もと、
 * まゆの丸いもようが目じるし。
 */
export function shibaFace(look: Look = {}): string {
  const items = look.items ?? [];
  return (
    `<g stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">` +
    // 耳
    `<path ${paint(look.fur, 'shiba-fur')} d="M25 52C19 38 20 22 27 9C39 14 49 24 54 37ZM95 52C101 38 100 22 93 9C81 14 71 24 66 37Z"/>` +
    // 頭 (ほおがふっくらしている)
    `<path ${paint(look.fur, 'shiba-fur')} d="M60 28C35 28 17 43 16 64C15 74 11 78 9 84C16 86 22 91 29 97C38 104 49 107 60 107C71 107 82 104 91 97C98 91 104 86 111 84C109 78 105 74 104 64C103 43 85 28 60 28Z"/></g>` +
    `<path ${paint(look.pink, 'shiba-pink')} d="M29 42C27 33 28 25 31 18C38 22 43 28 46 35ZM91 42C93 33 92 25 89 18C82 22 77 28 74 35Z"/>` +
    // 白いほおと口もと
    `<path ${paint(look.light, 'shiba-light')} d="M17 79C22 68 33 64 44 70C48 73 51 71 52 66C54 58 66 58 68 66C69 71 72 73 76 70C87 64 98 68 103 79C105 82 107 83 109 84C103 87 98 91 91 96.5C82 103 71 105.5 60 105.5C49 105.5 38 103 29 96.5C22 91 17 87 11 84C13 83 15 82 17 79Z"/>` +
    // まゆの丸いもよう
    `<ellipse ${paint(look.brow ?? look.light, 'shiba-light')} cx="42" cy="54.5" rx="5.2" ry="3.4" transform="rotate(-12 42 54.5)"/>` +
    `<ellipse ${paint(look.brow ?? look.light, 'shiba-light')} cx="78" cy="54.5" rx="5.2" ry="3.4" transform="rotate(12 78 54.5)"/>` +
    `<ellipse ${paint(look.pink, 'shiba-pink')} cx="27" cy="83" rx="6.5" ry="4" opacity="0.7"/>` +
    `<ellipse ${paint(look.pink, 'shiba-pink')} cx="93" cy="83" rx="6.5" ry="4" opacity="0.7"/>` +
    eyes(look) +
    mouth(look) +
    items.map((item) => ITEMS[item]).join('')
  );
}

/** ホームの柴犬 */
export function shiba(): HTMLElement {
  const el = h('div', { class: 'shiba' });
  el.innerHTML = `<svg viewBox="0 -6 120 116" role="img" aria-label="しばいぬのキャラクター">${shibaFace()}</svg>`;
  return el;
}

// ---- カードの絵柄 (たて 156 × よこ 120) ----

const W = 120;
const H = 156;
const circles = (points: number[][], fill: string) =>
  points.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
const fillRect = (fill: string) => `<rect width="${W}" height="${H}" fill="${fill}"/>`;

function background(bg: Background): string {
  switch (bg) {
    case 'dots': {
      const dots: number[][] = [];
      for (let y = 0; y < 11; y++) for (let x = 0; x < 9; x++) dots.push([x * 15 + (y % 2) * 7.5, y * 15 + 6, 3.2]);
      return fillRect('#fff5c2') + circles(dots, '#ffe36e');
    }
    case 'grid': {
      let d = '';
      for (let x = 12; x < W; x += 12) d += `M${x} 0V${H}`;
      for (let y = 12; y < H; y += 12) d += `M0 ${y}H${W}`;
      return fillRect('#f3faf6') + `<path d="${d}" stroke="#b9dccf" stroke-width="1" fill="none"/>`;
    }
    case 'night':
      return (
        fillRect('#27305a') +
        `<circle cx="24" cy="24" r="11" fill="#ffe58a"/><circle cx="29" cy="20.5" r="10" fill="#27305a"/>` +
        circles([[52, 14, 1.4], [76, 26, 1.1], [14, 60, 1.2], [108, 52, 1.5], [100, 140, 1.3], [16, 132, 1.5], [62, 148, 1.1]], '#fff') +
        sparkle(90, 16, 4, '#ffe58a') +
        sparkle(106, 100, 3, '#ffe58a')
      );
    case 'pink':
      return fillRect('#ffe4ea') + circles([[18, 22, 13], [102, 34, 9], [96, 132, 16], [14, 120, 8], [60, 10, 6]], '#ffd0da');
    case 'sky':
      return (
        fillRect('#cdeaf8') +
        `<circle cx="98" cy="22" r="11" fill="${YELLOW}"/>` +
        `<g fill="#fff"><ellipse cx="26" cy="22" rx="15" ry="6.5"/><ellipse cx="34" cy="17" rx="9" ry="6"/>` +
        `<ellipse cx="92" cy="142" rx="17" ry="6.5"/><ellipse cx="20" cy="136" rx="12" ry="5"/></g>`
      );
    case 'snow':
      return (
        fillRect('#dcecf5') +
        `<ellipse cx="60" cy="160" rx="90" ry="22" fill="#fff"/>` +
        circles([[16, 16, 2.6], [44, 10, 1.8], [78, 20, 2.4], [104, 12, 1.9], [10, 58, 2], [110, 66, 2.6], [20, 104, 1.8], [102, 112, 2.2], [60, 24, 1.6]], '#fff')
      );
    case 'sakura': {
      const petals = [[16, 18, 20], [42, 10, -30], [86, 16, 50], [106, 34, -10], [10, 70, 70], [112, 86, 30], [18, 128, -40], [98, 138, 15], [58, 146, -60], [70, 28, 80]];
      return (
        fillRect('#fdeaf0') +
        petals.map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#f7a8bd" transform="rotate(${a} ${x} ${y})"/>`).join('')
      );
    }
    case 'leaves': {
      const leaves = [[14, 20, 30], [44, 10, -40], [92, 18, 60], [108, 46, -20], [8, 74, 80], [112, 96, 20], [16, 130, -50], [100, 142, 35], [58, 148, -70]];
      return (
        fillRect('#eef7e6') +
        leaves.map(([x, y, a]) => `<path fill="#a9d68d" d="M${x} ${y - 7}Q${x + 6} ${y} ${x} ${y + 7}Q${x - 6} ${y} ${x} ${y - 7}Z" transform="rotate(${a} ${x} ${y})"/>`).join('')
      );
    }
    case 'hanamaru':
      return (
        fillRect('#fdfdfa') +
        `<polyline points="${hanamaruPoints()}" fill="none" stroke="#d63c2c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.38" transform="translate(-10 4) scale(1.4)"/>`
      );
    case 'stars':
      return (
        fillRect('#33285c') +
        [[16, 18, 6], [100, 14, 4.5], [108, 70, 5], [10, 84, 4], [20, 140, 5], [98, 140, 6.5], [60, 12, 3]].map(([x, y, r]) => sparkle(x, y, r)).join('') +
        circles([[40, 20, 1.2], [84, 30, 1], [112, 112, 1.3], [8, 116, 1.1]], '#fff')
      );
    case 'rainbow':
      return (
        fillRect('#eaf6ff') +
        ['#f2666c', '#f7a23b', '#ffd93b', '#69c56e', '#4aa3e8', '#8b6fd6']
          .map((c, i) => `<circle cx="60" cy="150" r="${112 - i * 9}" fill="none" stroke="${c}" stroke-width="9"/>`)
          .join('') +
        `<circle cx="60" cy="150" r="53.5" fill="#eaf6ff"/>`
      );
    case 'gold': {
      let rays = '';
      for (let i = 0; i < 12; i++) rays += `<path d="M60 84L${60 - 14} -40L${60 + 14} -40Z" fill="#f2d56a" transform="rotate(${i * 30} 60 84)"/>`;
      return fillRect('#f8e9ad') + rays + sparkle(16, 20, 6, '#fff') + sparkle(104, 28, 4.5, '#fff') + sparkle(102, 136, 6, '#fff') + sparkle(18, 132, 4, '#fff');
    }
    default:
      return fillRect('#fdfdfa') + `<rect x="8" y="8" width="104" height="140" rx="4" fill="none" stroke="#c5ddd3" stroke-width="1.2"/>`;
  }
}

const FRAMES = {
  plain: `<rect x="1.5" y="1.5" width="117" height="153" rx="7" fill="none" stroke="#6aa893" stroke-width="3"/>`,
  silver:
    `<rect x="2.5" y="2.5" width="115" height="151" rx="6.5" fill="none" stroke="#aeb8c4" stroke-width="5"/>` +
    `<rect x="5.5" y="5.5" width="109" height="145" rx="4.5" fill="none" stroke="#f1f4f7" stroke-width="1.2"/>`,
  gold:
    `<rect x="2.5" y="2.5" width="115" height="151" rx="6.5" fill="none" stroke="#d9a520" stroke-width="5"/>` +
    `<rect x="5.5" y="5.5" width="109" height="145" rx="4.5" fill="none" stroke="#fff3c4" stroke-width="1.2"/>`,
};

let clipSeq = 0;

/** 表向きのカードの絵 */
export function cardSvg(card: Card): string {
  const clip = `card-clip-${clipSeq++}`;
  return (
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${card.name}">` +
    `<clipPath id="${clip}"><rect width="${W}" height="${H}" rx="8"/></clipPath>` +
    `<g clip-path="url(#${clip})">${background(card.bg)}` +
    `<g transform="translate(9 40) scale(0.85)">${shibaFace({ fur: '#e0a05a', light: '#fff8ea', pink: '#f4b3a2', ...card.look })}</g>` +
    `</g>${FRAMES[card.frame]}</svg>`
  );
}
