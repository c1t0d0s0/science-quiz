import { arrow, circle, fig, line, rect, text, weight } from './svg';

const R = 18;

/** 天井 */
const ceiling = (x1: number, x2: number) =>
  line(x1, 14, x2, 14, 'ln thick') +
  Array.from({ length: Math.floor((x2 - x1) / 14) }, (_, i) => line(x1 + 8 + i * 14, 14, x1 + 14 + i * 14, 6, 'ln thin')).join('');

const wheel = (cx: number, cy: number) => circle(cx, cy, R, 'box') + circle(cx, cy, 2.5, 'ink');

/** 手で引く向きの矢印と、力の大きさ */
const pull = (x: number, y1: number, y2: number, label: string) =>
  arrow(x, y1, x, y2, 'ln red') + text(x + 8, (y1 + y2) / 2 + 5, label, { anchor: 'start', cls: 'small' });

/** 定かっ車 1 個。左におもり、右のひもを下に引く */
export function fixedPulley(load: string, force: string): string {
  return fig(
    300,
    190,
    `定かっ車の図。天井に固定したかっ車にひもをかけ、片方に${load}のおもりをつるし、もう片方を${force}の力で下に引いている。`,
    ceiling(80, 220),
    line(150, 14, 150, 52),
    line(132, 52, 132, 140),
    line(168, 52, 168, 96),
    wheel(150, 52),
    weight(132, 140, load),
    pull(168, 96, 150, force),
  );
}

/** 動かっ車 1 個。ひもの片方は天井、もう片方を上に引く */
export function movablePulley(load: string, force: string): string {
  return fig(
    300,
    200,
    `動かっ車の図。ひもの片方を天井に固定し、ひもにかけたかっ車に${load}のおもりをつるして、ひものもう片方を${force}の力で上に引いている。`,
    ceiling(80, 220),
    line(132, 14, 132, 112),
    line(168, 112, 168, 84),
    wheel(150, 112),
    line(150, 112, 150, 152),
    weight(150, 152, load),
    pull(168, 84, 40, force),
  );
}

/** 動かっ車 1 個と定かっ車 1 個の組み合わせ。ひもを下に引く */
export function comboPulley(load: string, force: string): string {
  return fig(
    300,
    210,
    `動かっ車と定かっ車を組み合わせた図。ひもの片方を天井に固定し、動かっ車、定かっ車の順にかけて、もう片方を${force}の力で下に引いている。動かっ車に${load}のおもりをつるしてある。`,
    ceiling(70, 230),
    line(100, 14, 100, 122),
    line(136, 122, 136, 52),
    line(154, 14, 154, 52),
    line(172, 52, 172, 104),
    wheel(118, 122),
    wheel(154, 52),
    line(118, 122, 118, 160),
    weight(118, 160, load),
    pull(172, 104, 160, force),
  );
}

/** 動かっ車を n 個、だんだんにつないだ図。いちばん上のひもを上に引く */
export function cascadePulley(n: number, load: string, force: string): string {
  const bottom = 80 + n * 46;
  const wheels = Array.from({ length: n }, (_, i) => ({ x: 100 + i * R, y: bottom - i * 46 }));
  const last = wheels[n - 1];
  return fig(
    300,
    bottom + 76,
    `動かっ車を${n}個つないだ図。いちばん下の動かっ車に${load}のおもりをつるす。それぞれのひもは片方を天井に固定し、もう片方で1つ上の動かっ車をつるしている。いちばん上のひもを${force}の力で上に引く。`,
    ceiling(60, 240),
    ...wheels.map((w, i) => line(w.x - R, 14, w.x - R, w.y) + (i < n - 1 ? line(w.x + R, w.y, w.x + R, wheels[i + 1].y) : '')),
    ...wheels.map((w) => wheel(w.x, w.y)),
    line(wheels[0].x, wheels[0].y, wheels[0].x, bottom + 36),
    weight(wheels[0].x, bottom + 36, load),
    pull(last.x + R, last.y, 40, force),
  );
}

/** 何本ものひもで下のかっ車のまとまりをささえる、組み合わせかっ車 (かんたんにした図) */
export function tacklePulley(strands: number, load: string, force: string): string {
  const xs = Array.from({ length: strands }, (_, i) => 150 + (i - (strands - 1) / 2) * 16);
  return fig(
    300,
    230,
    `組み合わせかっ車の図。上のかっ車のまとまりは天井に固定してある。下のかっ車のまとまりは${strands}本のひもでささえられ、${load}のおもりがつるしてある。ひものはしを${force}の力で引く。`,
    ceiling(70, 230),
    line(150, 14, 150, 40),
    ...xs.map((x) => line(x, 58, x, 132)),
    rect(108, 40, 84, 20, 'fill-soft', 10),
    rect(108, 130, 84, 20, 'fill-soft', 10),
    text(98, 55, '定かっ車', { anchor: 'end', cls: 'small' }),
    text(98, 145, '動かっ車', { anchor: 'end', cls: 'small' }),
    line(150, 150, 150, 178),
    weight(150, 178, load),
    line(192, 50, 214, 50),
    pull(214, 50, 112, force),
  );
}
