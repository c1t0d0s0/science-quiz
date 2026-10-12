import { arrow, circle, fig, line, polygon, rect, text, weight } from './svg';

/** てこにつるすもの。pos は支点からの目もりの数 (左がマイナス、右がプラス) */
export interface Hang {
  pos: number;
  label: string;
}

/** となりどうしのおもりが重ならないよう、ひもの長さを 1 つおきに変える */
function strings<T extends { x: number; low?: boolean }>(items: T[], near: number): (T & { len: number })[] {
  const sorted = items.slice().sort((a, b) => a.x - b.x);
  let long = false;
  return sorted.map((item, i) => {
    // low のおもりは、支点の三角と重ならないよう、いつも長いひもでつるす
    long = item.low ? true : i > 0 && item.x - sorted[i - 1].x < near ? !long : false;
    return { ...item, len: long ? 64 : 26 };
  });
}

/**
 * まん中に支点があり、左右に 1〜6 の目もりがついたてこ。
 * 目もりは同じ間かくで、おもりは目もりの位置につるす。
 */
export function tickLever(hangs: Hang[]): string {
  const cx = 180;
  const gap = 25;
  const top = 50;
  const ticks = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];
  const side = (pos: number) => (pos < 0 ? '左' : '右');
  const alt = hangs.map((h) => `${side(h.pos)}の${Math.abs(h.pos)}の目もりに${h.label}`).join('、');
  return fig(
    360,
    176,
    `てこの図。支点はまん中。${alt}のおもりがつるしてある。`,
    rect(cx - gap * 6 - 8, top, gap * 12 + 16, 8, 'box'),
    ...ticks.map((t) => line(cx + t * gap, top, cx + t * gap, top + 8, 'ln thin') + text(cx + t * gap, top - 8, String(Math.abs(t)), { cls: 'small' })),
    polygon([[cx, top + 8], [cx - 12, top + 36], [cx + 12, top + 36]], 'fill-soft'),
    text(cx, top + 52, '支点', { cls: 'small' }),
    ...strings(hangs.map((h) => ({ ...h, x: cx + h.pos * gap, low: Math.abs(h.pos) === 1 })), 50).map(
      (h) => line(h.x, top + 8, h.x, top + 8 + h.len) + weight(h.x, top + 8 + h.len, h.label),
    ),
  );
}

export interface BeamOptions {
  /** 棒の長さ (cm) */
  length: number;
  /** 支点の位置 (左はしからの cm)。ばねばかりでつるすときは省く */
  fulcrum?: number;
  /** 下につるすおもり */
  hangs: { at: number; label: string }[];
  /** 上に引くばねばかり */
  pulls?: { at: number; label: string }[];
  /** 棒の上に書く長さ */
  dims: { from: number; to: number; label: string }[];
  alt: string;
}

/** 長さ (cm) を書きこんだ棒の図 */
export function beam(o: BeamOptions): string {
  const x = (cm: number) => 40 + (cm / o.length) * 280;
  const top = 78;
  return fig(
    360,
    196,
    o.alt,
    rect(x(0), top, 280, 8, 'box'),
    ...o.dims.map(
      (d) =>
        line(x(d.from), top - 16, x(d.from), top - 6, 'ln thin') +
        line(x(d.to), top - 16, x(d.to), top - 6, 'ln thin') +
        line(x(d.from), top - 11, x(d.to), top - 11, 'ln thin') +
        text((x(d.from) + x(d.to)) / 2, top - 17, d.label, { cls: 'small' }),
    ),
    ...(o.pulls ?? []).map(
      (p) =>
        line(x(p.at), top, x(p.at), top - 36) +
        rect(x(p.at) - 7, top - 62, 14, 26, 'fill-soft', 3) +
        line(x(p.at), top - 62, x(p.at), top - 72) +
        text(x(p.at) + (p.at > o.length / 2 ? -14 : 14), top - 45, p.label, { anchor: p.at > o.length / 2 ? 'end' : 'start', cls: 'small' }),
    ),
    o.fulcrum === undefined
      ? ''
      : polygon([[x(o.fulcrum), top + 8], [x(o.fulcrum) - 15, top + 40], [x(o.fulcrum) + 15, top + 40]], 'fill-soft') +
          text(x(o.fulcrum), top + 56, '支点', { cls: 'small' }),
    ...strings(o.hangs.map((h) => ({ ...h, x: x(h.at) })), 50).map(
      (h) => line(h.x, top + 8, h.x, top + 8 + h.len) + weight(h.x, top + 8 + h.len, h.label),
    ),
  );
}

/** てこの 3 つの点 (支点・力点・作用点) を記号でたずねる図。labels は 左から 作用点・棒のとちゅう・支点・力点 の記号 */
export function leverPoints(labels: { load: string; mid: string; fulcrum: string; effort: string }): string {
  const top = 112;
  const tagAt = (x: number, y: number, label: string) => circle(x, y, 11, 'tag') + text(x, y + 5, label, { cls: 'tag-text' });
  return fig(
    360,
    196,
    `てこの図。左はしの${labels.load}に荷物がのり、${labels.fulcrum}で棒をささえ、右はしの${labels.effort}を手でおし下げている。${labels.mid}は荷物と${labels.fulcrum}の間の棒の上。`,
    // 支点が左によっているので、右はし (力点) が上がった形にかく
    polygon([[40, top + 14], [44, top + 22], [324, top - 44], [320, top - 52]], 'box'),
    polygon([[130, top], [112, top + 40], [148, top + 40]], 'fill-soft'),
    rect(34, top - 24, 40, 36, 'fill-mark', 3),
    text(54, top, '荷物', { cls: 'small' }),
    arrow(316, top - 96, 316, top - 58, 'ln red'),
    text(316, top - 102, '手でおす', { cls: 'small' }),
    tagAt(54, top + 44, labels.load),
    tagAt(88, top + 44, labels.mid),
    line(88, top + 33, 88, top + 12, 'ln thin'),
    line(54, top + 33, 54, top + 20, 'ln thin'),
    tagAt(130, top + 58, labels.fulcrum),
    tagAt(338, top - 30, labels.effort),
    line(329, top - 37, 322, top - 46, 'ln thin'),
  );
}

/** 輪軸の図。輪 (大きい円) のひもを引き、軸 (小さい円) のひもにおもりをつるす */
export function wheelAxle(o: { wheel: number; axle: number; load: string; force: string }): string {
  const cx = 150;
  const cy = 82;
  const big = 62;
  const small = Math.max(16, Math.round((big * o.axle) / o.wheel));
  return fig(
    300,
    226,
    `輪軸の図。輪の半径は${o.wheel}cm、軸の半径は${o.axle}cm。軸のひもに${o.load}のおもりをつるし、輪のひもを${o.force}の力で下に引いている。`,
    circle(cx, cy, big, 'box'),
    circle(cx, cy, small, 'fill-soft'),
    circle(cx, cy, 2.5, 'ink'),
    line(cx - small, cy, cx - small, 170),
    weight(cx - small, 170, o.load),
    arrow(cx + big, cy, cx + big, 186, 'ln red'),
    text(cx + big, 204, o.force, { cls: 'small' }),
    line(cx, cy, cx + big * 0.64, cy - big * 0.77, 'ln thin'),
    text(cx + big + 6, cy - big + 6, `輪 ${o.wheel}cm`, { anchor: 'start', cls: 'small' }),
    line(cx, cy, cx - small * 0.7, cy - small * 0.7, 'ln thin'),
    text(cx - big - 6, cy - big + 6, `軸 ${o.axle}cm`, { anchor: 'end', cls: 'small' }),
  );
}

/**
 * 2 だんのモビール。上の棒の左はしに下の棒をつるし、右はしにおもりをつるす。
 * 長さの文字が正しい値で、絵の長さはおおよそ。
 */
export function mobile(o: { upL: number; upR: number; lowL: number; lowR: number; a: string; b: string; c: string }): string {
  const px = (cm: number) => 30 + cm * 2.5;
  const pivot = 205;
  const upY = 44;
  const lowY = 104;
  const left = pivot - px(o.upL);
  const right = pivot + px(o.upR);
  const lowLeft = left - px(o.lowL);
  const lowRight = left + px(o.lowR);
  const len = (x1: number, x2: number, y: number, cm: number) => text((x1 + x2) / 2, y - 7, `${cm}cm`, { cls: 'small' });
  return fig(
    360,
    196,
    `2だんのモビールの図。上の棒は、つるした点から左に${o.upL}cm、右に${o.upR}cm。左はしに下の棒をつるし、右はしに${o.c}のおもりをつるす。下の棒は、つるした点から左に${o.lowL}cm、右に${o.lowR}cm で、左はしに${o.a}、右はしに${o.b}のおもりをつるす。`,
    line(pivot, 8, pivot, upY),
    line(pivot - 26, 8, pivot + 26, 8, 'ln thick'),
    rect(left, upY, right - left, 6, 'box'),
    len(left, pivot, upY, o.upL),
    len(pivot, right, upY, o.upR),
    line(right, upY + 6, right, upY + 34),
    weight(right, upY + 34, o.c),
    line(left, upY + 6, left, lowY),
    rect(lowLeft, lowY, lowRight - lowLeft, 6, 'box'),
    len(lowLeft, left, lowY, o.lowL),
    len(left, lowRight, lowY, o.lowR),
    line(lowLeft, lowY + 6, lowLeft, lowY + 34),
    weight(lowLeft, lowY + 34, o.a),
    line(lowRight, lowY + 6, lowRight, lowY + 34),
    weight(lowRight, lowY + 34, o.b),
  );
}
