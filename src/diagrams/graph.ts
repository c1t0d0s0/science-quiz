import { circle, fig, line, polyline, tag, text } from './svg';

/**
 * 氷を熱していったときの、時間と温度のグラフ。
 * labels は、氷の温度が上がる部分・0℃ でたいらな部分・水の温度が上がる部分・100℃ でたいらな部分 の記号。
 */
export function heatingFig(labels: readonly string[]): string {
  const x0 = 50;
  const y0 = 180; // -20℃
  const y = (t: number) => y0 - ((t + 20) / 140) * 150;
  const pts: [number, number][] = [[x0, y(-20)], [x0 + 34, y(0)], [x0 + 92, y(0)], [x0 + 176, y(100)], [x0 + 250, y(100)]];
  const mid = (i: number): [number, number] => [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
  const offset: [number, number][] = [[18, 8], [0, -18], [-18, -12], [0, -18]];
  return fig(
    330,
    220,
    `氷を熱したときの時間と温度のグラフ。はじめは温度が上がり(${labels[0]})、0℃で温度が変わらなくなり(${labels[1]})、その後また上がり(${labels[2]})、100℃でふたたび変わらなくなる(${labels[3]})。`,
    line(x0, 16, x0, y0 + 10, 'ln thin'),
    line(x0, y(0), 316, y(0), 'ln thin'),
    line(x0, y(100), 316, y(100), 'ln thin dash'),
    text(x0 - 8, y(0) + 5, '0', { anchor: 'end', cls: 'small' }),
    text(x0 - 8, y(100) + 5, '100', { anchor: 'end', cls: 'small' }),
    text(x0 - 4, 12, '温度(℃)', { anchor: 'start', cls: 'small' }),
    text(316, y0 + 26, '熱した時間', { anchor: 'end', cls: 'small' }),
    line(x0, y0 + 10, 316, y0 + 10, 'ln thin'),
    polyline(pts, 'ln red'),
    ...labels.map((label, i) => tag(mid(i)[0] + offset[i][0], mid(i)[1] + offset[i][1], label)),
  );
}

/** 水 100g にとける量のグラフ。values は 20・40・60・80℃ でとける量 (g) */
export function solubilityFig(name: string, values: readonly number[]): string {
  const temps = [20, 40, 60, 80];
  const x0 = 54;
  const y0 = 184;
  const max = values[3] * 1.18;
  const x = (t: number) => x0 + ((t - 10) / 80) * 250;
  const y = (v: number) => y0 - (v / max) * 150;
  const pts = temps.map((t, i): [number, number] => [x(t), y(values[i])]);
  return fig(
    330,
    228,
    `${name}が水100gにとける量のグラフ。${temps.map((t, i) => `${t}℃で${values[i]}g`).join('、')}。`,
    line(x0, 20, x0, y0, 'ln thin'),
    line(x0, y0, 316, y0, 'ln thin'),
    text(x0 - 6, 14, '水100gにとける量(g)', { anchor: 'start', cls: 'small' }),
    text(316, y0 + 34, '水の温度(℃)', { anchor: 'end', cls: 'small' }),
    ...temps.map((t) => line(x(t), y0, x(t), y0 + 5, 'ln thin') + text(x(t), y0 + 19, String(t), { cls: 'small' })),
    polyline(pts, 'ln red'),
    ...pts.map(([px, py], i) => circle(px, py, 4, 'ink') + text(px - 6, py - 9, String(values[i]), { anchor: 'end' })),
  );
}

