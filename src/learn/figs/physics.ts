import { circle, line, polygon, rect, text } from '../../diagrams/svg';
import { liveText, moving, type Plan } from './common';

// 物理の図 (てこ・ふりこ・回路)

/** てこ。--tilt でうでがかたむき、--lx / --rx でおもりが左右に動く。おもりの重さは labels の lw / rw */
export function leverPlan(): Plan {
  const cx = 240;
  const y = 147;
  const ticks = [1, 2, 3, 4, 5, 6]
    .flatMap((k) => [cx - k * 30, cx + k * 30])
    .map((x) => line(x, y - 5, x, y + 5, 'ln thin'))
    .join('');
  const nums = [1, 2, 3, 4, 5, 6].flatMap((k) => [text(cx - k * 30, y - 10, String(k), { cls: 'tiny' }), text(cx + k * 30, y - 10, String(k), { cls: 'tiny' })]).join('');
  /** つるしたおもり。うでがかたむいても、まっすぐ下にさがる */
  const weight = (side: 'l' | 'r') =>
    moving(
      'slide',
      `transform:translateX(var(--${side}x, ${side === 'l' ? -120 : 120}px))`,
      moving('hang', `transform-origin:${cx}px ${y + 5}px;transform:rotate(calc(-1 * var(--tilt, 0deg)))`, line(cx, y + 5, cx, y + 48, 'ln') + rect(cx - 20, y + 48, 40, 28, 'fill-mark', 3) + liveText(cx, y + 67, `${side}w`, side === 'l' ? '30g' : '40g', 'tiny')),
    );
  return {
    width: 480,
    height: 250,
    alt: '実験用てこの図。まん中の支点でささえられたうでに、左右 1〜6 の目もりがある。左右の目もりにおもりをつるすと、うでがかたむいたり、水平につり合ったりする。',
    back: rect(200, 228, 80, 8, 'fill-soft') + line(240, 190, 240, 228, 'ln thick'),
    parts: [
      {
        id: 'fulcrum',
        name: '支点',
        box: [216, 138, 48, 56],
        anchor: [240, 160],
        label: [282, 186, 'start'],
        body: polygon([[240, y + 4], [226, 190], [254, 190]], 'box'),
      },
      {
        id: 'beam',
        name: 'うで',
        box: [50, 124, 380, 40],
        anchor: [90, 147],
        label: [60, 120],
        body: moving('tilt', `transform-origin:${cx}px ${y}px;transform:rotate(var(--tilt, 0deg))`, rect(54, y - 5, 372, 10, 'box', 3) + ticks + nums + circle(cx, y, 4, 'ink')),
      },
      {
        id: 'left',
        name: '左のおもり',
        box: [44, 150, 190, 90],
        anchor: [120, 210],
        label: [24, 240, 'start'],
        body: moving('tilt', `transform-origin:${cx}px ${y}px;transform:rotate(var(--tilt, 0deg))`, weight('l')),
      },
      {
        id: 'right',
        name: '右のおもり',
        box: [246, 150, 190, 90],
        anchor: [360, 210],
        label: [456, 240, 'end'],
        body: moving('tilt', `transform-origin:${cx}px ${y}px;transform:rotate(var(--tilt, 0deg))`, weight('r')),
      },
    ],
    flows: [],
  };
}

/** ふりこ。--k で糸ののび (100px が 1)、--bob でおもりの位置、--m でおもりの大きさ、--amp でふれはば、--period で 1 往復の時間 */
export function pendulumPlan(): Plan {
  const px = 200;
  const py = 24;
  const swing = moving(
    'swing',
    `transform-origin:${px}px ${py}px`,
    `<line class="ln" x1="${px}" y1="${py}" x2="${px}" y2="${py + 100}" style="transform-origin:${px}px ${py}px;transform:scaleY(var(--k, 1.1))"/>` +
      moving('bob', 'transform:translateY(var(--bob, 110px))', `<circle class="fill-mark" cx="${px}" cy="${py}" r="12" style="transform-origin:${px}px ${py}px;transform:scale(var(--m, 1))"/>`),
  );
  return {
    width: 400,
    height: 320,
    alt: 'ふりこの図。天井の支点から糸でおもりをつるし、左右にふれる。糸の長さ・おもりの重さ・ふれはばを変えられる。',
    back: line(110, py - 6, 290, py - 6, 'ln thick') + line(px, py, px, 310, 'ln thin dash'),
    parts: [
      { id: 'pivot', name: '支点', box: [176, 6, 48, 34], anchor: [px, py], label: [236, 30, 'start'], body: circle(px, py, 5, 'ink') },
      { id: 'string', name: '糸', box: [184, 30, 32, 250], anchor: [px, 80], label: [130, 100], body: '' },
      { id: 'bob', name: 'おもり', box: [150, 60, 100, 250], anchor: [px, 140], label: [300, 290, 'start'], body: swing },
    ],
    flows: [],
  };
}

/** 乾電池の記号 (長い線が ＋極) */
const cellSym = (x: number, y: number) => rect(x - 5, y - 6, 10, 12, 'mask') + line(x - 4, y - 13, x - 4, y + 13, 'ln') + line(x + 4, y - 7, x + 4, y + 7, 'ln thick');

/** 豆電球の記号と、そのまわりの光 (明るさは --out) */
const bulbSym = (x: number, y: number) =>
  circle(x, y, 18, 'glow') + circle(x, y, 10, 'box') + line(x - 7, y - 7, x + 7, y + 7, 'ln thin') + line(x - 7, y + 7, x + 7, y - 7, 'ln thin');

const only = (cls: string, body: string) => `<g class="only-${cls}">${body}</g>`;

/** 回路。figure のクラス (c1・cs・cp / b1・bs・bp / sw-off) で、つなぎ方を切りかえる */
export function circuitPlan(): Plan {
  const l = 150;
  const r = 270;
  const top = 50;
  const bottom = 210;
  const cells =
    only('c1', line(l, bottom, r, bottom) + cellSym(210, bottom)) +
    only('cs', line(l, bottom, r, bottom) + cellSym(188, bottom) + cellSym(232, bottom)) +
    only('cp', line(l, bottom - 16, l, bottom + 16) + line(r, bottom - 16, r, bottom + 16) + line(l, bottom - 16, r, bottom - 16) + line(l, bottom + 16, r, bottom + 16) + cellSym(210, bottom - 16) + cellSym(210, bottom + 16));
  const bulbs =
    only('b1', line(l, top, r, top) + bulbSym(210, top)) +
    only('bs', line(l, top, r, top) + bulbSym(182, top) + bulbSym(238, top)) +
    only('bp', line(l, top - 22, l, top + 22) + line(r, top - 22, r, top + 22) + line(l, top - 22, r, top - 22) + line(l, top + 22, r, top + 22) + bulbSym(210, top - 22) + bulbSym(210, top + 22));
  return {
    width: 420,
    height: 260,
    alt: '乾電池と豆電球とスイッチを導線でつないだ回路の図。乾電池や豆電球を、1個・直列つなぎ・並列つなぎに切りかえられる。',
    back:
      line(60, top, l, top) +
      line(r, top, 360, top) +
      line(60, bottom, l, bottom) +
      line(r, bottom, 360, bottom) +
      line(60, top, 60, bottom) +
      line(360, top, 360, 112) +
      line(360, 150, 360, bottom),
    parts: [
      { id: 'cells', name: '乾電池', box: [140, 182, 140, 56], anchor: [210, 196], label: [210, 252], body: cells },
      { id: 'bulbs', name: '豆電球', box: [140, 14, 140, 74], anchor: [210, 36], label: [300, 30, 'start'], body: bulbs },
      {
        id: 'switch',
        name: 'スイッチ',
        box: [344, 100, 56, 60],
        anchor: [360, 130],
        label: [392, 172, 'middle'],
        body: circle(360, 112, 3, 'ink') + circle(360, 150, 3, 'ink') + only('on', line(360, 112, 360, 150, 'ln')) + only('off', line(360, 150, 386, 120, 'ln')),
      },
      { id: 'wire', name: '導線', box: [46, 40, 28, 180], anchor: [60, 130], label: [40, 134, 'end'], body: '' },
    ],
    flows: [{ id: 'electric', d: `M${l} ${bottom}H60V${top}H360V${bottom}H${r}` }],
  };
}
