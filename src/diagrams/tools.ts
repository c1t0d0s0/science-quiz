import { circle, fig, line, path, rect, text } from './svg';

/** 温度計の一部を大きくした図。lo から lo + 20 ℃ までの目もりで、液の先が value をさす */
export function thermometerFig(lo: number, value: number): string {
  const px = 8;
  const top = 24;
  const bottom = top + 20 * px;
  const y = (t: number) => bottom - (t - lo) * px;
  const cx = 150;
  const ticks = Array.from({ length: 21 }, (_, i) => {
    const t = lo + i;
    const len = t % 10 === 0 ? 16 : t % 5 === 0 ? 11 : 6;
    return line(cx + 8, y(t), cx + 8 + len, y(t), 'ln thin') + (t % 10 === 0 ? text(cx + 44, y(t) + 5, `${t}`, { cls: 'small' }) : '');
  });
  return fig(
    300,
    bottom + 56,
    `温度計の一部を大きくした図。目もりは1℃ごとで、${lo}℃、${lo + 10}℃、${lo + 20}℃に数字がある。赤い液の先は、${lo}℃の目もりから${value - lo}目もり上にある。`,
    rect(cx - 8, top - 12, 16, bottom - top + 40, 'box', 8),
    rect(cx - 2.5, y(value), 5, bottom + 28 - y(value), 'flame'),
    circle(cx, bottom + 34, 12, 'flame'),
    ...ticks,
    text(cx + 66, top - 4, '（℃）', { anchor: 'start', cls: 'small' }),
  );
}

/** メスシリンダーの一部を大きくした図。base から base + 20 mL までの目もりで、水面のいちばん低いところが value */
export function cylinderFig(base: number, value: number): string {
  const px = 8;
  const top = 20;
  const bottom = top + 20 * px;
  const y = (v: number) => bottom - (v - base) * px;
  const left = 110;
  const right = 190;
  const ticks = Array.from({ length: 21 }, (_, i) => {
    const v = base + i;
    const len = v % 10 === 0 ? 30 : v % 5 === 0 ? 20 : 10;
    return line(left, y(v), left + len, y(v), 'ln thin') + (v % 10 === 0 ? text(left - 10, y(v) + 5, `${v}`, { anchor: 'end', cls: 'small' }) : '');
  });
  // 水面は、かべの近くで 1 目もりほど持ち上がる
  const s = y(value);
  const lift = px * 1.2;
  const surface = `M${left},${s - lift} Q${left + 6},${s} ${(left + right) / 2},${s} Q${right - 6},${s} ${right},${s - lift}`;
  return fig(
    300,
    bottom + 30,
    `メスシリンダーの一部を大きくした図。目もりは1mLごとで、${base}mL、${base + 10}mL、${base + 20}mLに数字がある。水面はかべの近くで少し持ち上がっていて、水面のいちばん低いところは、${base}mLの目もりから${value - base}目もり上にある。`,
    path(`${surface} L${right},${bottom + 20} L${left},${bottom + 20} Z`, 'water'),
    path(surface, 'ln'),
    line(left, top - 10, left, bottom + 20),
    line(right, top - 10, right, bottom + 20),
    ...ticks,
    text(right + 14, top + 4, '（mL）', { anchor: 'start', cls: 'small' }),
  );
}

/** 電流計の −たんし */
export const AMMETER_TERMINALS = ['50mA', '500mA', '5A'] as const;
export type AmmeterTerminal = (typeof AMMETER_TERMINALS)[number];

/** 電流計の図。針は 0〜5 の目もりの needle をさし、導線は + たんしと terminal の −たんしにつながっている */
export function ammeterFig(needle: number, terminal: AmmeterTerminal): string {
  const cx = 150;
  const cy = 150;
  const radius = 110;
  // 0 が左 (150°)、5 が右 (30°)
  const at = (v: number, rr: number): [number, number] => {
    const a = ((150 - (v / 5) * 120) * Math.PI) / 180;
    return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)];
  };
  const ticks = Array.from({ length: 51 }, (_, i) => {
    const v = i / 10;
    const len = i % 10 === 0 ? 14 : i % 5 === 0 ? 10 : 6;
    const [x1, y1] = at(v, radius);
    const [x2, y2] = at(v, radius - len);
    let s = line(x1, y1, x2, y2, 'ln thin');
    if (i % 10 === 0) {
      const [tx, ty] = at(v, radius - 28);
      s += text(tx, ty + 5, `${v}`, { cls: 'small' });
    }
    return s;
  });
  const [nx, ny] = at(needle, radius - 4);
  const posts: { x: number; label: string; on: boolean }[] = [
    { x: 60, label: '＋', on: true },
    ...AMMETER_TERMINALS.map((t, i) => ({ x: 130 + i * 60, label: t, on: t === terminal })),
  ];
  return fig(
    300,
    238,
    `電流計の図。目もりには0から5までの数字があり、1目もりは0.1。針は${needle}の目もりをさしている。導線は＋たんしと、${terminal}の−たんしにつながっている。`,
    rect(14, 14, 272, 174, 'box', 10),
    ...ticks,
    line(cx, cy, nx, ny, 'ln red'),
    circle(cx, cy, 4, 'ink'),
    ...posts.map(
      (p) =>
        text(p.x, 180, p.label, { cls: 'tiny' }) +
        (p.on ? line(p.x, 206, p.x, 238) : '') +
        circle(p.x, 206, 7, p.on ? 'fill-mark' : 'box'),
    ),
  );
}
