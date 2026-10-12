import { arrow, circle, fig, group, line, path, polyline, r, tag, text } from './svg';

/** 月の形。waning は、明け方に見える、左がわが細く光る月 */
export type Phase = 'new' | 'crescent' | 'first' | 'full' | 'last' | 'waning';

export const PHASE_NAME: Record<Phase, string> = {
  new: '新月',
  crescent: '三日月',
  first: '上弦の月',
  full: '満月',
  last: '下弦の月',
  waning: '左がわが細く光る月',
};

const PHASE_ALT: Record<Phase, string> = {
  new: '全体が暗い月',
  crescent: '右がわが細く光っている月',
  first: '右半分が光っている月',
  full: '全体が丸く光っている月',
  last: '左半分が光っている月',
  waning: '左がわが細く光っている月',
};

/** 月 1 つ (中心 0,0、半径 R) */
function moonBody(phase: Phase, R: number): string {
  const half = `M0 ${-R}A${R} ${R} 0 0 1 0 ${R}`;
  const lit =
    phase === 'full'
      ? circle(0, 0, R, 'lit')
      : phase === 'new'
        ? ''
        : phase === 'first' || phase === 'last'
          ? path(`${half}Z`, 'lit')
          : path(`${half}A${r(R * 0.62)} ${R} 0 0 0 0 ${-R}Z`, 'lit');
  const flip = phase === 'last' || phase === 'waning';
  return circle(0, 0, R, 'shade') + (flip ? `<g transform="scale(-1 1)">${lit}</g>` : lit) + circle(0, 0, R, 'ln thin');
}

/** 月を 1 つ大きくかく */
export function moonFig(phase: Phase): string {
  return fig(170, 150, `月の図。${PHASE_ALT[phase]}。`, group(85, 75, moonBody(phase, 58)));
}

/** 月を横にならべ、下に記号をつける */
export function moonRow(phases: Phase[], labels: readonly string[]): string {
  const alt = phases.map((p, i) => `${labels[i]}は${PHASE_ALT[p]}`).join('、');
  return fig(
    340,
    126,
    `月の図が${phases.length}つ。${alt}。`,
    ...phases.map((p, i) => group(44 + i * 84, 46, moonBody(p, 34)) + tag(44 + i * 84, 104, labels[i])),
  );
}

const DIRS: Record<string, [number, number]> = { 北: [0, -1], 南: [0, 1], 東: [1, 0], 西: [-1, 0] };

/** 地面に立てた棒とそのかげを、真上から見た図。shadow はかげがのびている方位 */
export function shadowFig(shadow: string): string {
  const c = 110;
  const [dx, dy] = DIRS[shadow];
  return fig(
    220,
    220,
    `地面に立てた棒を真上から見た図。上が北、右が東。棒のかげは${shadow}にのびている。`,
    line(c, 26, c, 194, 'ln thin dash'),
    line(26, c, 194, c, 'ln thin dash'),
    ...Object.entries(DIRS).map(([name, [x, y]]) => text(c + x * 98, c + y * 98 + 5, name, { cls: 'small' })),
    line(c, c, c + dx * 62, c + dy * 62, 'shadow'),
    circle(c, c, 6, 'ink'),
    text(c + 12 - dx * 4, c - 12, '棒', { anchor: 'start', cls: 'small' }),
  );
}

/** オリオン座 (南の空に見えるときの向き)。labels は 4 つの星につける記号 */
export function orionFig(labels: { betelgeuse: string; bellatrix: string; rigel: string; saiph: string }): string {
  const star = { betelgeuse: [82, 44], bellatrix: [158, 52], saiph: [92, 170], rigel: [170, 160] } as const;
  const belt: [number, number][] = [[112, 112], [126, 106], [140, 100]];
  const outline: [number, number][] = [[...star.betelgeuse], belt[0], [...star.saiph], [...star.rigel], belt[2], [...star.bellatrix], [...star.betelgeuse]];
  const side = { betelgeuse: -26, saiph: -26, bellatrix: 26, rigel: 26 };
  return fig(
    260,
    214,
    `オリオン座の図。左上の星が${labels.betelgeuse}、右上の星が${labels.bellatrix}、左下の星が${labels.saiph}、右下の星が${labels.rigel}。まん中に3つの星がならんでいる。`,
    polyline(outline, 'ln thin dash'),
    polyline(belt, 'ln thin dash'),
    ...belt.map(([x, y]) => circle(x, y, 3.5, 'ink')),
    ...(Object.keys(star) as (keyof typeof star)[]).map(
      (k) => circle(star[k][0], star[k][1], 6, 'ink') + tag(star[k][0] + side[k], star[k][1], labels[k]),
    ),
  );
}

/**
 * 北の空の星の動き。北極星を中心に、星 A と、30°ずつはなれた位置の記号をかく。
 * start は星 A の位置 (度。右が 0、反時計回りにふえる)。marks は A から何度反時計回りに回った位置か。
 */
export function northSkyFig(start: number, marks: { turn: number; label: string }[]): string {
  const cx = 160;
  const cy = 124;
  const R = 92;
  const at = (deg: number, radius = R): [number, number] => [cx + radius * Math.cos((deg * Math.PI) / 180), cy - radius * Math.sin((deg * Math.PI) / 180)];
  const [ax, ay] = at(start);
  const [lx, ly] = at(start, R + 22);
  return fig(
    320,
    262,
    `北の空の図。北極星を中心にした円の上に星Aがある。Aから反時計回りに${marks
      .filter((m) => m.turn > 0)
      .map((m) => `${m.turn}度の位置が${m.label}`)
      .join('、')}。Aから時計回りに${marks
      .filter((m) => m.turn < 0)
      .map((m) => `${-m.turn}度の位置が${m.label}`)
      .join('、')}。`,
    circle(cx, cy, R, 'ln thin dash'),
    circle(cx, cy, 4, 'ink'),
    text(cx, cy + 20, '北極星', { cls: 'small' }),
    ...marks.map((m) => {
      const [x, y] = at(start + m.turn);
      const [tx, ty] = at(start + m.turn, R + 20);
      return line(cx, cy, x, y, 'ln thin dash') + circle(x, y, 3, 'ink') + tag(tx, ty, m.label);
    }),
    line(cx, cy, ax, ay, 'ln thin'),
    circle(ax, ay, 6, 'lit'),
    text(lx, ly + 5, 'A', {}),
    line(20, 250, 300, 250, 'ln thin'),
    text(cx, 246, '北の地平線', { cls: 'small' }),
  );
}

/**
 * 地球のまわりを回る月を、北極の上から見た図。
 * sunRight なら太陽の光は右から来る。labels は、太陽の方向から反時計回りに 0°・90°・180°・270° の位置の記号。
 */
export function moonOrbitFig(sunRight: boolean, labels: readonly string[]): string {
  const cx = sunRight ? 150 : 210;
  const cy = 124;
  const R = 78;
  const sun = sunRight ? 0 : 180;
  const rayX = sunRight ? 340 : 20;
  const dir = sunRight ? -1 : 1;
  const moons = [0, 90, 180, 270].map((e, i) => {
    const a = ((sun + e) * Math.PI) / 180;
    const x = cx + R * Math.cos(a);
    const y = cy - R * Math.sin(a);
    // 太陽がわの半分が光っている
    const half = sunRight ? 'M0 -11A11 11 0 0 1 0 11Z' : 'M0 -11A11 11 0 0 0 0 11Z';
    return (
      group(x, y, circle(0, 0, 11, 'shade'), path(half, 'lit'), circle(0, 0, 11, 'ln thin')) +
      tag(cx + (R + 28) * Math.cos(a), cy - (R + 28) * Math.sin(a), labels[i])
    );
  });
  return fig(
    360,
    248,
    `地球のまわりを回る月を北極の上から見た図。太陽の光は${sunRight ? '右' : '左'}から来る。月は反時計回りに回る。太陽と地球の間の位置が${labels[0]}、そこから反時計回りに4分の1回った位置が${labels[1]}、地球をはさんで太陽の反対がわが${labels[2]}、さらに4分の1回った位置が${labels[3]}。`,
    circle(cx, cy, R, 'ln thin dash'),
    circle(cx, cy, 17, 'fill-soft'),
    text(cx, cy + 5, '地球', { cls: 'small' }),
    ...moons,
    ...[-50, 0, 50].map((dy) => arrow(rayX, cy + dy, rayX + dir * 36, cy + dy, 'ln red')),
    text(rayX + dir * 18, cy - 66, '太陽の光', { cls: 'small' }),
    // 月が回る向き (反時計回り)
    path(`M${cx + 34} ${cy - 36}A50 50 0 0 0 ${cx - 34} ${cy - 36}`, 'ln thin'),
    polyline([[cx - 26, cy - 44], [cx - 34, cy - 36], [cx - 24, cy - 32]], 'ln thin'),
  );
}
