import { circle, fig, group, line, polyline, rect, scale, tag, text } from './svg';

/** s = 直列つなぎ、p = 並列つなぎ */
export type Mode = 's' | 'p';

/** 乾電池と豆電球を、それぞれ直列か並列にまとめてつないだ回路 */
export interface Circuit {
  cells: number;
  cellMode: Mode;
  bulbs: number;
  bulbMode: Mode;
}

/** 分数 (n / d) */
export interface Frac {
  n: number;
  d: number;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export function frac(n: number, d = 1): Frac {
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

export const fracValue = (f: Frac) => f.n / f.d;

/** 「2」「2分の1」のように書く */
export const fracText = (f: Frac) => (f.d === 1 ? String(f.n) : `${f.d}分の${f.n}`);

/**
 * 乾電池 1 個に豆電球 1 個をつないだときの電流を 1 としたときの、それぞれの電流。
 * (乾電池 1 個の電圧を 1、豆電球 1 個の抵抗を 1 と考える)
 */
export function analyze(c: Circuit): { perBulb: Frac; total: Frac; perCell: Frac } {
  const volt = c.cellMode === 's' ? c.cells : 1;
  const perBulb = c.bulbMode === 's' ? frac(volt, c.bulbs) : frac(volt);
  const total = c.bulbMode === 's' ? frac(volt, c.bulbs) : frac(volt * c.bulbs);
  const perCell = c.cellMode === 's' ? total : frac(total.n, total.d * c.cells);
  return { perBulb, total, perCell };
}

/** 回路をことばで言う (「乾電池 2 個を直列、豆電球 1 個」など) */
export function describe(c: Circuit): string {
  const part = (name: string, n: number, mode: Mode) =>
    n === 1 ? `${name}1個` : `${name}${n}個を${mode === 's' ? '直列' : '並列'}つなぎ`;
  return `${part('乾電池', c.cells, c.cellMode)}、${part('豆電球', c.bulbs, c.bulbMode)}`;
}

const LEFT = 18;
const RIGHT = 152;
const TOP = 46;
const BOTTOM = 116;
const CX = (LEFT + RIGHT) / 2;

/** 乾電池の記号。長い線が + 極 */
const cell = (x: number, y: number) =>
  rect(x - 4, y - 4, 8, 8, 'mask') + line(x - 4, y - 12, x - 4, y + 12, 'ln') + line(x + 4, y - 6, x + 4, y + 6, 'ln thick');

/** 豆電球の記号 */
const bulb = (x: number, y: number) =>
  circle(x, y, 10, 'box') + line(x - 7, y - 7, x + 7, y + 7, 'ln thin') + line(x - 7, y + 7, x + 7, y - 7, 'ln thin');

/** 同じ部品を、1 本の導線の上に直列または並列にならべる */
function parts(draw: (x: number, y: number) => string, count: number, mode: Mode, y: number): string {
  if (count === 1 || mode === 's') {
    const gap = count === 3 ? 36 : 40;
    return Array.from({ length: count }, (_, i) => draw(CX + (i - (count - 1) / 2) * gap, y)).join('');
  }
  const half = 30;
  const rows = Array.from({ length: count }, (_, i) => y + (i - (count - 1) / 2) * 26);
  return (
    rect(CX - half, y - 4, half * 2, 8, 'mask') +
    line(CX - half, rows[0], CX - half, rows[count - 1]) +
    line(CX + half, rows[0], CX + half, rows[count - 1]) +
    rows.map((ry) => line(CX - half, ry, CX + half, ry) + draw(CX, ry)).join('')
  );
}

/** 回路図 1 つ分 (170 × 162 の中にかく)。上の導線に乾電池、下の導線に豆電球をならべる */
export function circuitBody(c: Circuit): string {
  return (
    rect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP, 'ln') +
    parts(cell, c.cells, c.cellMode, TOP) +
    parts(bulb, c.bulbs, c.bulbMode, BOTTOM)
  );
}

/** 回路図を 1 つ、大きくかく */
export function circuitFig(c: Circuit): string {
  return fig(272, 259, `回路図。${describe(c)}。`, scale(1.6, circuitBody(c)));
}

/** 回路図を 2 × 2 にならべてかく。左上から順に labels の記号をつける */
export function circuitGrid(list: Circuit[], labels: readonly string[]): string {
  const alt = list.map((c, i) => `${labels[i]}は${describe(c)}`).join('。');
  return fig(
    340,
    324,
    `4つの回路図。${alt}。`,
    ...list.map((c, i) => group((i % 2) * 170, Math.floor(i / 2) * 162, circuitBody(c), tag(16, 16, labels[i]))),
  );
}

/**
 * 豆電球 A と、並列につないだ豆電球 B・C を、直列につないだ回路。
 * A に流れる電流は 3 分の 2、B と C は 3 分の 1 ずつ (乾電池 1 個・豆電球 1 個のときを 1 として)。
 */
export function mixedCircuitFig(): string {
  const a = 56;
  const pair = 112;
  const half = 26;
  const rows = [BOTTOM - 20, BOTTOM + 20];
  return fig(
    272,
    259,
    '回路図。乾電池1個に、豆電球Aと、並列つなぎにした豆電球B・Cが直列につながっている。',
    scale(
      1.6,
      rect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP, 'ln'),
      cell(CX, TOP),
      bulb(a, BOTTOM),
      text(a, BOTTOM - 16, 'A', { cls: 'small' }),
      rect(pair - half, BOTTOM - 4, half * 2, 8, 'mask'),
      line(pair - half, rows[0], pair - half, rows[1]),
      line(pair + half, rows[0], pair + half, rows[1]),
      ...rows.map((y) => line(pair - half, y, pair + half, y) + bulb(pair, y)),
      text(pair, rows[0] - 15, 'B', { cls: 'small' }),
      text(pair, rows[1] + 24, 'C', { cls: 'small' }),
    ),
  );
}

/** 乾電池と豆電球を導線でつないだ絵のつなぎ方 */
export type Wiring = 'ok' | 'side' | 'side2' | 'open';

const WIRING_ALT: Record<Wiring, string> = {
  ok: '2本の導線が、乾電池の+極と-極につながっている',
  side: '1本の導線は-極に、もう1本は乾電池の横の面につながっている',
  side2: '1本の導線は+極に、もう1本は乾電池の横の面につながっている',
  open: '1本の導線は極につながっているが、もう1本はどこにもつながっていない',
};

/** 乾電池と豆電球の絵 1 つ分 (170 × 130)。flip で乾電池の向きを左右反対にする */
function wiringBody(kind: Wiring, flip: boolean): string {
  const bodyL = 42;
  const bodyR = 128;
  const y = 100;
  // 出っぱりのある方が + 極
  const cap = flip ? rect(bodyL - 6, y - 5, 6, 10, 'box') : rect(bodyR, y - 5, 6, 10, 'box');
  const endL = flip ? bodyL - 6 : bodyL;
  const endR = flip ? bodyR : bodyR + 6;
  const toLeft: [number, number][] = [[79, 50], [79, 62], [22, 62], [22, y], [endL, y]];
  const toRight: [number, number][] = [[91, 50], [91, 62], [148, 62], [148, y], [endR, y]];
  const wires: Record<Wiring, [number, number][][]> = {
    ok: [toLeft, toRight],
    side: [toLeft, [[91, 50], [91, 88]]],
    side2: [[[79, 50], [79, 88]], toRight],
    open: [toLeft, [[91, 50], [91, 62], [124, 62]]],
  };
  return (
    wires[kind].map((w) => polyline(w, 'ln')).join('') +
    circle(85, 24, 15, 'box') +
    polyline([[79, 30], [82, 20], [85, 28], [88, 20], [91, 30]], 'ln thin') +
    rect(77, 37, 16, 13, 'fill-soft') +
    rect(bodyL, y - 12, bodyR - bodyL, 24, 'box', 3) +
    cap +
    text(flip ? bodyL + 12 : bodyR - 12, y + 5, '+', { cls: 'small' }) +
    text(flip ? bodyR - 12 : bodyL + 12, y + 5, '−', { cls: 'small' })
  );
}

/** 乾電池と豆電球のつなぎ方の絵を 2 × 2 にならべる */
export function wiringGrid(list: { kind: Wiring; flip: boolean }[], labels: readonly string[]): string {
  const alt = list.map((w, i) => `${labels[i]}は、${WIRING_ALT[w.kind]}`).join('。');
  return fig(
    340,
    260,
    `乾電池と豆電球のつなぎ方の絵が4つ。${alt}。`,
    ...list.map((w, i) => group((i % 2) * 170, Math.floor(i / 2) * 130, wiringBody(w.kind, w.flip), tag(16, 16, labels[i]))),
  );
}
