import { arrow, circle, fig, line, path, pointer, polyline, rect, tag, text } from './svg';

/**
 * 1 日の気温の変化のグラフ。values は 午前6時から2時間ごと (6・8・…・18時) の気温。
 * 2 本目からは点線でかく。
 */
export function tempGraph(lines: { label: string; values: readonly number[] }[]): string {
  const hours = [6, 8, 10, 12, 14, 16, 18];
  const x0 = 46;
  const y0 = 176;
  const x = (h: number) => x0 + ((h - 6) / 12) * 250;
  const y = (t: number) => y0 - ((t - 5) / 25) * 150;
  const hourLabel = (h: number) => (h < 12 ? `午前${h}` : h === 12 ? '正午' : `午後${h - 12}`);
  return fig(
    330,
    222,
    `1日の気温の変化のグラフ。${lines.map((l) => `${l.label}は、${hours.map((h, i) => `${h}時に${l.values[i]}℃`).join('、')}`).join('。')}。`,
    line(x0, 16, x0, y0, 'ln thin'),
    line(x0, y0, 312, y0, 'ln thin'),
    ...[10, 15, 20, 25, 30].map((t) => line(x0, y(t), 312, y(t), 'ln thin dash') + text(x0 - 6, y(t) + 5, String(t), { anchor: 'end', cls: 'small' })),
    text(x0 - 4, 12, '気温(℃)', { anchor: 'start', cls: 'small' }),
    ...hours.filter((h) => h % 6 === 0).map((h) => line(x(h), y0, x(h), y0 + 5, 'ln thin') + text(x(h), y0 + 19, hourLabel(h), { cls: 'small' })),
    text(312, y0 + 38, '時こく(時)', { anchor: 'end', cls: 'small' }),
    ...lines.map((l, i) => {
      const pts = hours.map((h, k): [number, number] => [x(h), y(l.values[k])]);
      // 記号は、線のいちばん高いところの少し上につける
      const top = pts.reduce((a, b) => (b[1] < a[1] ? b : a));
      return polyline(pts, i === 0 ? 'ln red' : 'ln') + pts.map(([px, py]) => circle(px, py, 3, 'ink')).join('') + tag(top[0] + (i === 0 ? 0 : 60), top[1] - 16, l.label);
    }),
  );
}

/** 曲がって流れる川を上から見た図。labels は 外がわ・まん中・内がわ の地点の記号 */
export function riverFig(labels: { outer: string; middle: string; inner: string }): string {
  const cx = 170;
  const cy = 36;
  const band = (r: number) => `M${cx - r} ${cy}A${r} ${r} 0 0 0 ${cx + r} ${cy}`;
  return fig(
    340,
    214,
    `曲がって流れる川を上から見た図。川は大きく曲がっている。曲がりの外がわの岸に近い地点が${labels.outer}、川のまん中の地点が${labels.middle}、曲がりの内がわの岸に近い地点が${labels.inner}。`,
    path(`M${cx - 134} ${cy}A134 134 0 0 0 ${cx + 134} ${cy}L${cx + 70} ${cy}A70 70 0 0 1 ${cx - 70} ${cy}Z`, 'water'),
    path(band(134), 'ln'),
    path(band(70), 'ln'),
    arrow(cx - 102, cy - 22, cx - 102, cy + 8, 'ln red'),
    text(cx - 102, cy - 26, '流れ', { cls: 'small' }),
    pointer(cx, cy + 162, cx, cy + 124, labels.outer),
    pointer(cx + 44, cy + 28, cx + 30, cy + 96, labels.middle),
    pointer(cx - 20, cy + 26, cx - 8, cy + 78, labels.inner),
    text(cx, cy - 12, '内がわ', { cls: 'small' }),
    text(cx + 118, cy + 150, '外がわ', { cls: 'small' }),
  );
}

/** 地層の柱状図 (上から順)。labels は、それぞれの層につける記号 */
export function strataFig(layers: readonly string[], labels: readonly string[]): string {
  const h = 34;
  const cls: Record<string, string> = { れき: 'fill-soft', 砂: 'box', どろ: 'fill-mark', 火山灰: 'shade' };
  return fig(
    260,
    layers.length * h + 44,
    `地層のようすを表した図。上から順に、${layers.map((name, i) => `${labels[i]}は${name}の層`).join('、')}。`,
    text(130, 16, '地表', { cls: 'small' }),
    ...layers.map(
      (name, i) => rect(70, 24 + i * h, 120, h, cls[name] ?? 'box') + text(130, 24 + i * h + 22, name, { cls: 'small' }) + tag(214, 24 + i * h + h / 2, labels[i]),
    ),
  );
}

/** 火山の形 3 つ。order は左からならべる形 (0 = 平たい形、1 = 円すい形、2 = ドーム形)、labels は左からの記号 */
export function volcanoFig(order: readonly number[], labels: readonly string[]): string {
  const shapes = [
    'M8 78C40 66 62 62 78 62C94 62 114 66 148 78Z',
    'M20 78C48 66 64 44 72 26L84 26C92 44 108 66 136 78Z',
    'M44 78C46 52 56 34 78 34C100 34 110 52 112 78Z',
  ];
  const alt = ['平たく広がった形', '円すいの形', 'もり上がったドームの形'];
  return fig(
    468,
    126,
    `火山の形が3つ。${labels.map((l, i) => `${l}は${alt[order[i]]}`).join('、')}。`,
    ...order.map((shape, i) => `<g transform="translate(${i * 156} 0)">${path(shapes[shape], 'fill-soft')}${line(4, 78, 152, 78, 'ln thin')}${tag(78, 104, labels[i])}</g>`),
  );
}

/**
 * とう明半球を真東から見た図。太陽の通り道 3 本 (夏至・春分と秋分・冬至) を、左 (南) へかたむいた線でかく。
 * labels は、いちばん高く上がる線から順の記号。
 */
export function sunPathFig(labels: readonly string[]): string {
  const cx = 170;
  const base = 172;
  const R = 130;
  const ends: [number, number, number][] = [
    [48, 131.1, 45.9],
    [0, 95.4, 65.5],
    [-48, 66.7, 93.1],
  ];
  return fig(
    340,
    214,
    `とう明半球を真東から見た図。左が南、右が北。太陽の通り道が3本、南へかたむいてならんでいる。いちばん北よりから出て、いちばん高く上がるのが${labels[0]}、まん中が${labels[1]}、いちばん南よりで低いのが${labels[2]}。`,
    path(`M${cx - R} ${base}A${R} ${R} 0 0 1 ${cx + R} ${base}`, 'ln thin'),
    line(cx - R - 14, base, cx + R + 14, base, 'ln'),
    ...ends.map(([d, ex, ey], i) => line(cx + d, base, ex, ey, 'ln red') + tag(ex - 14, ey - 12, labels[i])),
    circle(cx, base, 3, 'ink'),
    text(cx - R - 2, base + 20, '南', { cls: 'small' }),
    text(cx + R + 2, base + 20, '北', { cls: 'small' }),
    text(cx, base + 20, '観測者', { cls: 'small' }),
  );
}

/** ハザードマップで、ある地点が入っている区域 */
export type FloodZone = 'deep' | 'shallow' | 'safe';
export const FLOOD_ZONE_LABEL: Record<FloodZone, string> = { deep: '3m以上', shallow: '0.5〜3m', safe: '浸水しない' };

/**
 * 洪水のハザードマップ (上から見た図)。川にそって、浸水が深い区域・浅い区域・浸水しない高台がならぶ。
 * riverLeft で川を左右どちらにかくか、labels でそれぞれの区域に置く地点の記号、ys でその高さを決める。
 */
export function hazardFig(riverLeft: boolean, labels: Record<FloodZone, string>, ys: Record<FloodZone, number>): string {
  const width = 340;
  const top = 12;
  const h = 150;
  // 左から 川・深い区域・浅い区域・高台 のはば (riverLeft でないときは、左右を入れかえる)
  const spans: [string, number, number][] = [
    ['river', 20, 60],
    ['deep', 60, 140],
    ['shallow', 140, 230],
    ['safe', 230, 320],
  ];
  const x = (a: number, b: number): [number, number] => (riverLeft ? [a, b] : [width - b, width - a]);
  const zone = (name: string): [number, number] => x(...(spans.find((s) => s[0] === name)!.slice(1) as [number, number]));
  const fill = (name: FloodZone, left: number, w: number, y: number, hh: number) =>
    name === 'deep' ? rect(left, y, w, hh, 'water') + rect(left, y, w, hh, 'water') : name === 'shallow' ? rect(left, y, w, hh, 'water') : rect(left, y, w, hh, 'box');
  const [rl, rr] = zone('river');
  const [sl, sr] = zone('safe');
  const hill = (sl + sr) / 2;
  const legendX = [82, 160, 246];
  const legend = (['deep', 'shallow', 'safe'] as const).map((z, i) => fill(z, legendX[i], 18, 182, 14) + text(legendX[i] + 24, 194, FLOOD_ZONE_LABEL[z], { anchor: 'start', cls: 'tiny' }));
  const side = riverLeft ? '左' : '右';
  return fig(
    width,
    206,
    `洪水のハザードマップ。図の${side}はしを、川がたてに流れている。川に近い区域は浸水の深さが3m以上、その外がわは0.5〜3m、いちばんはなれた高台は浸水しないと予想されている。${labels.deep}は3m以上の区域、${labels.shallow}は0.5〜3mの区域、${labels.safe}は高台にある。`,
    ...(['deep', 'shallow', 'safe'] as const).map((z) => {
      const [a, b] = zone(z);
      return fill(z, a, b - a, top, h);
    }),
    rect(rl, top, rr - rl, h, 'box'),
    arrow((rl + rr) / 2, top + 30, (rl + rr) / 2, top + 110, 'ln red'),
    text((rl + rr) / 2, top + 132, '川', { cls: 'small' }),
    // 高台の等高線
    path(`M${hill - 34} ${top + h / 2}a34 46 0 1 0 68 0a34 46 0 1 0 -68 0`, 'ln thin'),
    path(`M${hill - 18} ${top + h / 2}a18 26 0 1 0 36 0a18 26 0 1 0 -36 0`, 'ln thin'),
    text(hill, top + 16, '高台', { cls: 'tiny' }),
    ...(['deep', 'shallow', 'safe'] as const).map((z) => {
      const [a, b] = zone(z);
      return tag((a + b) / 2, top + ys[z], labels[z]);
    }),
    ...legend,
    text(20, 194, '浸水の深さ', { anchor: 'start', cls: 'tiny' }),
  );
}
