import { arrow, circle, ellipse, fig, line, path, pointer, polygon, rect, text } from './svg';

/** 植物のからだ (花・葉・くき・根) に記号をつけた図 */
export function plantFig(labels: { flower: string; leaf: string; stem: string; root: string }): string {
  const petals = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3;
    return ellipse(120 + 17 * Math.cos(a), 44 + 17 * Math.sin(a), 10, 10, 'fill-mark');
  });
  return fig(
    250,
    236,
    `植物の図。いちばん上の花が${labels.flower}、くきから横に出ている葉が${labels.leaf}、まっすぐのびたくきが${labels.stem}、土の中の根が${labels.root}。`,
    line(120, 62, 120, 160),
    path('M120 120C96 96 70 98 58 112C76 126 100 126 120 120Z', 'fill-soft'),
    path('M120 100C144 76 170 78 182 92C164 106 140 106 120 100Z', 'fill-soft'),
    ...petals,
    circle(120, 44, 9, 'box'),
    line(20, 160, 230, 160, 'ln thin'),
    path('M120 160V218M120 172L96 196M120 172L146 198M120 190L104 214M120 190L136 212M96 196L84 202M146 198L158 204', 'ln'),
    pointer(200, 30, 144, 40, labels.flower),
    pointer(34, 84, 78, 110, labels.leaf),
    pointer(200, 138, 122, 138, labels.stem),
    pointer(40, 200, 100, 194, labels.root),
  );
}

/** こん虫のからだ (頭・むね・はら) に記号をつけた図。あしは 6 本ともむねから出ている */
export function insectFig(labels: { head: string; thorax: string; abdomen: string }): string {
  const leg = (x: number, tip: number, s: number) => path(`M${x} ${88 + s * 14}L${x + tip} ${88 + s * 44}L${x + tip * 1.6} ${88 + s * 62}`, 'ln');
  return fig(
    300,
    204,
    `こん虫を上から見た図。からだは3つに分かれていて、しょっかくのある左の部分が${labels.head}、6本のあしがついているまん中の部分が${labels.thorax}、右の大きな部分が${labels.abdomen}。`,
    ...[-1, 1].flatMap((s) => [leg(104, -16, s), leg(118, 0, s), leg(132, 16, s)]),
    path('M58 80L36 58M58 96L36 118', 'ln'),
    ellipse(200, 88, 56, 24, 'box'),
    ellipse(118, 88, 28, 19, 'fill-soft'),
    circle(70, 88, 18, 'box'),
    pointer(70, 180, 70, 92, labels.head),
    pointer(184, 180, 124, 92, labels.thorax),
    pointer(250, 180, 214, 94, labels.abdomen),
  );
}

/** 花をたてに切った図。花びら・がく・おしべ・めしべに記号をつける */
export function flowerFig(labels: { petal: string; sepal: string; stamen: string; pistil: string }): string {
  return fig(
    300,
    230,
    `花をたてに切った図。いちばん外がわで花のつけ根をささえている部分が${labels.sepal}、大きく広がった部分が${labels.petal}、先に花粉のふくろがある細い部分が${labels.stamen}、まん中にあり根もとがふくらんだ部分が${labels.pistil}。`,
    path('M132 186C92 170 62 120 58 60C92 80 124 130 140 180Z', 'fill-mark'),
    path('M168 186C208 170 238 120 242 60C208 80 176 130 160 180Z', 'fill-mark'),
    path('M134 190C114 186 98 172 92 152C112 160 128 172 140 186Z', 'fill-soft'),
    path('M166 190C186 186 202 172 208 152C188 160 172 172 160 186Z', 'fill-soft'),
    line(142, 184, 122, 96),
    ellipse(120, 90, 6, 10, 'box'),
    line(158, 184, 178, 96),
    ellipse(180, 90, 6, 10, 'box'),
    line(150, 160, 150, 70),
    ellipse(150, 172, 11, 16, 'box'),
    circle(150, 66, 6, 'box'),
    line(150, 188, 150, 222),
    pointer(40, 34, 78, 96, labels.petal),
    pointer(40, 196, 102, 164, labels.sepal),
    pointer(232, 30, 182, 86, labels.stamen),
    pointer(150, 24, 150, 62, labels.pistil),
  );
}

/** メダカの図。おすは、せびれに切れこみがあり、しりびれが平行四辺形に近い */
export function medakaFig(male: boolean): string {
  const dorsal: [number, number][] = male
    ? [[168, 52], [172, 30], [182, 28], [184, 38], [190, 30], [196, 34], [194, 54]]
    : [[170, 52], [176, 36], [190, 38], [192, 54]];
  const anal: [number, number][] = male
    ? [[132, 94], [138, 124], [194, 116], [192, 90]]
    : [[136, 94], [142, 116], [190, 92]];
  return fig(
    300,
    150,
    `メダカの図。せびれに切れこみが${male ? 'ある' : 'ない'}。しりびれは${male ? '平行四辺形に近い形で大きい' : '後ろにいくほどせまくなる三角形に近い形'}。`,
    polygon(dorsal, 'fill-soft'),
    polygon(anal, 'fill-soft'),
    polygon([[212, 72], [252, 46], [246, 72], [252, 98]], 'fill-soft'),
    ellipse(134, 72, 84, 26, 'box'),
    circle(74, 68, 7, 'box'),
    circle(74, 68, 3, 'ink'),
    path('M96 60C102 68 102 78 96 86', 'ln thin'),
    text(182, 18, 'せびれ', { cls: 'small' }),
    text(166, 142, 'しりびれ', { cls: 'small' }),
  );
}

/** 食べる・食べられるの関係。左の生き物が右の生き物に食べられる */
export function chainFig(names: string[]): string {
  const w = names.length === 4 ? 68 : 84;
  const gap = (344 - w * names.length) / (names.length - 1);
  return fig(
    360,
    84,
    `食べる・食べられるの関係の図。${names.join(' → ')} の順に、左の生き物が右の生き物に食べられる。`,
    ...names.map((name, i) => {
      const x = 8 + i * (w + gap);
      return (
        rect(x, 14, w, 34, 'box', 4) +
        text(x + w / 2, 36, name, { cls: names.length === 4 && name.length > 5 ? 'tiny' : 'small' }) +
        (i < names.length - 1 ? arrow(x + w + 4, 31, x + w + gap - 4, 31, 'ln red') : '')
      );
    }),
    text(180, 72, '矢印は「食べられるもの → 食べるもの」', { cls: 'small' }),
  );
}
