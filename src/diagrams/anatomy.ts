import { ellipse, fig, line, path, pointer, text } from './svg';

/** ヒトの目を横から見た図。labels は レンズ (水しょう体)・もうまく・こうさい・視神経 の記号 */
export function eyeFig(labels: { lens: string; retina: string; iris: string; nerve: string }): string {
  return fig(
    320,
    214,
    `ヒトの目を横から切った図。左から光が入る。いちばん前で光の量を調節する部分が${labels.iris}、その後ろにあるレンズの形の部分が${labels.lens}、目のおくのかべにあるまくが${labels.retina}、目のおくから脳へのびているたばが${labels.nerve}。`,
    path('M92 62C74 78 74 132 92 148', 'ln'),
    path('M96 60A66 66 0 1 1 96 150', 'box'),
    path('M214 64A62 62 0 0 1 214 146', 'ln red'),
    ellipse(112, 105, 11, 26, 'fill-soft'),
    line(100, 66, 106, 82),
    line(100, 144, 106, 128),
    path('M220 100L262 92L262 118L220 110Z', 'fill-mark'),
    line(20, 105, 70, 105, 'ln thin dash'),
    text(34, 96, '光', { cls: 'small' }),
    pointer(70, 30, 102, 72, labels.iris),
    pointer(130, 190, 114, 118, labels.lens),
    pointer(214, 24, 206, 62, labels.retina),
    pointer(290, 150, 254, 108, labels.nerve),
  );
}
