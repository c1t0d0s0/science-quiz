import { arrow, circle, ellipse, fig, group, line, path, polyline, rect, tag, text, weight } from './svg';

/** 天井 (はば w) */
const ceiling = (x: number, w: number) =>
  line(x, 12, x + w, 12, 'ln thick') + Array.from({ length: Math.floor(w / 12) }, (_, i) => line(x + 6 + i * 12, 12, x + 11 + i * 12, 5, 'ln thin')).join('');

/** ばね (x の位置に、y1 から y2 まで) */
function coil(x: number, y1: number, y2: number): string {
  const turns = 7;
  const step = (y2 - y1 - 12) / (turns * 2);
  const pts: [number, number][] = [[x, y1], [x, y1 + 6]];
  for (let i = 0; i < turns * 2; i++) pts.push([x + (i % 2 === 0 ? 9 : -9), y1 + 6 + step * (i + 0.5)]);
  pts.push([x, y2 - 6], [x, y2]);
  return polyline(pts, 'ln');
}

/** ばねを横にならべた図。len はばねの長さ (cm)、label はつるしたおもり (なければ何もつるさない) */
export function springFig(items: { len: number; label?: string; note: string }[]): string {
  const max = Math.max(...items.map((s) => s.len));
  const px = (cm: number) => 40 + (cm / max) * 90;
  const gap = 110;
  const width = Math.max(300, items.length * gap + 20);
  const x0 = (width - (items.length - 1) * gap) / 2;
  return fig(
    width,
    214,
    `ばねの図。${items.map((s) => `${s.label ? `${s.label}のおもりをつるしたばね` : '何もつるしていないばね'}は${s.note}`).join('、')}。`,
    ceiling(x0 - 50, (items.length - 1) * gap + 100),
    ...items.map((s, i) => {
      const x = x0 + i * gap;
      const end = 12 + px(s.len);
      return coil(x, 12, end) + (s.label ? weight(x, end, s.label) : '') + text(x, 204, s.note, { cls: 'small' });
    }),
  );
}

/** ばね 2 本を、たてにつなぐ (series) か、横にならべて (parallel) おもりをつるした図 */
export function springCombo(kind: 'series' | 'parallel', label: string): string {
  if (kind === 'series') {
    return fig(
      300,
      230,
      `同じばね2本を、たてに1列につないで、下に${label}のおもりをつるした図。`,
      ceiling(100, 100),
      coil(150, 12, 86),
      circle(150, 90, 3, 'ink'),
      coil(150, 94, 168),
      weight(150, 168, label),
    );
  }
  return fig(
    300,
    190,
    `同じばね2本を横にならべて天井からつるし、2本の下のはしを軽い棒でつないで、棒のまん中に${label}のおもりをつるした図。`,
    ceiling(90, 120),
    coil(120, 12, 96),
    coil(180, 12, 96),
    rect(106, 96, 88, 6, 'box'),
    line(150, 102, 150, 126),
    weight(150, 126, label),
  );
}

/** ばねばかりにつるした物体。water が true なら、水に全部しずめてある */
export function buoyFig(o: { scale: string; object: string; water: boolean }): string {
  return fig(
    300,
    226,
    `ばねばかりに${o.object}の物体をつるした図。${o.water ? '物体は、ビーカーの水の中に全部しずめてあり、底にはついていない。' : '物体は空気中にある。'}ばねばかりの目もりは${o.scale}。`,
    line(150, 6, 150, 20),
    rect(136, 20, 28, 50, 'fill-soft', 4),
    text(172, 50, o.scale, { anchor: 'start', cls: 'small' }),
    line(150, 70, 150, 136),
    o.water ? rect(92, 112, 116, 96, 'water') : '',
    path('M92 96V208H208V96', 'ln'),
    o.water ? line(92, 112, 208, 112, 'ln thin') : '',
    rect(128, 136, 44, 36, 'box', 3),
    text(150, 159, o.object, { cls: 'small' }),
    text(216, 200, o.water ? '水' : '空気中', { anchor: 'start', cls: 'small' }),
  );
}

/** ふりこを 2 × 2 にならべた図。糸の長さ・おもりの重さ・ふれはばを書きこむ */
export function pendulumGrid(list: { len: number; g: number; deg: number }[], labels: readonly string[]): string {
  const max = Math.max(...list.map((p) => p.len));
  return fig(
    392,
    268,
    `ふりこの図が${list.length}つ。${list.map((p, i) => `${labels[i]}は糸の長さ${p.len}cm、おもり${p.g}g、ふれはば${p.deg}度`).join('。')}。`,
    ...list.map((p, i) => {
      const L = 34 + (p.len / max) * 70;
      const a = (p.deg * Math.PI) / 180;
      const bx = 52 + L * Math.sin(a);
      const by = 12 + L * Math.cos(a);
      return group(
        (i % 2) * 196,
        Math.floor(i / 2) * 134,
        ceiling(22, 60),
        line(52, 12, 52, 12 + L, 'ln thin dash'),
        line(52, 12, bx, by),
        circle(bx, by, 5 + p.g / 20, 'fill-mark'),
        tag(14, 30, labels[i]),
        text(108, 52, `長さ ${p.len}cm`, { anchor: 'start', cls: 'small' }),
        text(108, 72, `おもり ${p.g}g`, { anchor: 'start', cls: 'small' }),
        text(108, 92, `ふれはば ${p.deg}度`, { anchor: 'start', cls: 'small' }),
      );
    }),
  );
}

/** かがみで光がはね返る図。angle は、かがみに垂直な線と入ってくる光の間の角度。ask はたずねる角につける文字 */
export function mirrorFig(angle: number, known: string, ask: string): string {
  const cx = 170;
  const y = 170;
  const a = (angle * Math.PI) / 180;
  const R = 128;
  const inX = cx - R * Math.sin(a);
  const outX = cx + R * Math.sin(a);
  const top = y - R * Math.cos(a);
  return fig(
    340,
    206,
    `かがみで光がはね返る図。かがみに垂直な線と、入ってくる光との間の角度は${known}。垂直な線と、はね返った光との間の角度が${ask}。`,
    line(40, y, 300, y, 'ln thick'),
    ...Array.from({ length: 13 }, (_, i) => line(48 + i * 20, y, 40 + i * 20, y + 9, 'ln thin')),
    line(cx, y, cx, 28, 'ln thin dash'),
    arrow(inX, top, (inX + cx) / 2, (top + y) / 2, 'ln red'),
    line((inX + cx) / 2, (top + y) / 2, cx, y, 'ln red'),
    arrow(cx, y, (outX + cx) / 2, (top + y) / 2, 'ln red'),
    line((outX + cx) / 2, (top + y) / 2, outX, top, 'ln red'),
    // 角度の文字は、垂直な線と光の間のまん中に置く
    text(cx - 64 * Math.sin(a / 2), y - 64 * Math.cos(a / 2) + 5, known, { cls: 'small' }),
    text(cx + 64 * Math.sin(a / 2), y - 64 * Math.cos(a / 2) + 5, ask, { cls: 'small' }),
    text(292, y + 26, 'かがみ', { anchor: 'end', cls: 'small' }),
    text(Math.max(48, inX), Math.max(14, top - 8), '入ってくる光', { cls: 'small' }),
  );
}

/** とつレンズと、物体 (ろうそく) の位置の図。pos は、レンズからのきょりが しょう点きょりの何倍か */
export function lensFig(pos: number): string {
  const cx = 200;
  const y = 100;
  const f = 44;
  const ox = cx - f * pos;
  return fig(
    360,
    196,
    `とつレンズの図。レンズの左右に、しょう点と、しょう点きょりの2倍の点がある。物体は、レンズの左がわの、しょう点きょりの${pos}倍の位置にある。`,
    line(16, y, 344, y, 'ln thin'),
    ellipse(cx, y, 10, 62, 'fill-soft'),
    ...[-2, -1, 1, 2].map((k) => circle(cx + k * f, y, 3, 'ink') + text(cx + k * f, y + 20, Math.abs(k) === 1 ? 'しょう点' : '2倍', { cls: 'tiny' })),
    arrow(ox, y, ox, y - 40, 'ln red'),
    text(ox, y - 48, '物体', { cls: 'small' }),
    text(cx, 26, 'とつレンズ', { cls: 'small' }),
    text(cx + f * 1.5, 180, 'スクリーンを置くがわ', { cls: 'small' }),
  );
}

/** 音の波形を 4 つならべた図。amp はふれはば (1〜3)、waves は同じ時間の中の波の数 */
export function waveGrid(list: { amp: number; waves: number }[], labels: readonly string[]): string {
  const w = 150;
  const h = 96;
  return fig(
    340,
    232,
    `オシロスコープで見た音の波の図が4つ。${list.map((p, i) => `${labels[i]}は、波の高さが${['小さく', '中くらいで', '大きく'][p.amp - 1]}、波の数が${p.waves}つ`).join('。')}。`,
    ...list.map((p, i) => {
      const pts: [number, number][] = [];
      for (let k = 0; k <= 60; k++) pts.push([10 + (k / 60) * (w - 20), h / 2 + 8 - p.amp * 11 * Math.sin((k / 60) * p.waves * 2 * Math.PI)]);
      return group(
        10 + (i % 2) * 170,
        6 + Math.floor(i / 2) * 114,
        rect(0, 8, w, h, 'box'),
        line(0, h / 2 + 8, w, h / 2 + 8, 'ln thin dash'),
        polyline(pts, 'ln red'),
        tag(14, 22, labels[i]),
      );
    }),
  );
}

/** 電磁石を 4 つならべた図。turns はコイルのまき数、cells は直列につないだ乾電池の数 */
export function coilGrid(list: { turns: number; cells: number }[], labels: readonly string[]): string {
  return fig(
    340,
    226,
    `電磁石の図が4つ。${list.map((p, i) => `${labels[i]}は、コイルが${p.turns}回まきで、乾電池${p.cells}個${p.cells > 1 ? 'を直列つなぎ' : ''}`).join('。')}。`,
    ...list.map((p, i) => {
      const n = p.turns / 10;
      const x0 = 80 - (n * 5) / 2;
      return group(
        (i % 2) * 170,
        Math.floor(i / 2) * 112,
        rect(30, 38, 100, 12, 'fill-soft', 3),
        ...Array.from({ length: n }, (_, k) => line(x0 + k * 5, 34, x0 + k * 5 + 4, 54, 'ln thin')),
        tag(16, 18, labels[i]),
        text(80, 78, `${p.turns}回まき`, { cls: 'small' }),
        text(80, 96, `乾電池${p.cells}個`, { cls: 'small' }),
      );
    }),
  );
}
