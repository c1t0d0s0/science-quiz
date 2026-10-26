import { circle, fig, path, r, rect, tag, text } from '../../diagrams/svg';

// しくみの解説の図。部品には data-part、流れ (水蒸気・水・電気・血液など) には data-flow をつける。
// 解説の画面では、styles.css の .learn-figure の中で、部品を光らせたり、回したり、流したりする。
// 動きの速さや明るさは、画面が CSS の変数 (--out・--dur など) で決める。問題の図では動かない

export interface Part {
  id: string;
  name: string;
  /** 光らせるときの四角 [x, y, はば, 高さ] */
  box: [number, number, number, number];
  /** 問題の図で、記号の丸から指す点 */
  anchor: [number, number];
  /** 名前を書く位置。anchor をつけると、文字のそろえ方 (start / end) を変えられる */
  label: [number, number, string?];
  body: string;
}

export interface Flow {
  id: string;
  d: string;
  /** 管 (パイプ) の中を流れるもの */
  pipe?: boolean;
}

export interface Plan {
  width: number;
  height: number;
  alt: string;
  /** 部品より下にかくもの (地面・水など) */
  back: string;
  parts: Part[];
  flows: Flow[];
  /** いちばん上にかくもの (かざり・文字など) */
  front?: string;
}

/** 回る部品。(x, y) を中心に回す */
export const spin = (x: number, y: number, body: string) => `<g class="spin" style="transform-origin:${r(x)}px ${r(y)}px">${body}</g>`;

/** 電球と、そのまわりの光 (明るさは --out) */
export const bulb = (x: number, y: number) => circle(x, y, 16, 'glow') + circle(x, y, 9, 'box') + path(`M${x - 4} ${y + 9}V${y + 15}H${x + 4}V${y + 9}`, 'ln thin');

/** 図の部品の id と名前 */
export const planParts = (plan: Plan) => plan.parts.map((p) => ({ id: p.id, name: p.name }));

/** 図の流れの id */
export const planFlows = (plan: Plan) => [...new Set(plan.flows.map((f) => f.id))];

/**
 * 図を SVG にする。labels を指定すると、部品の名前のかわりに記号の丸をつける (問題の図)。
 * そのときは、どの部品の名前も書かない
 */
export function buildFig(plan: Plan, labels?: Record<string, string>): string {
  // 光らせる四角は、ほかの部品にかぶらないよう、部品より下にまとめてかく (地面や水はすけて見える)
  const highlights = plan.parts.map((p) => `<g data-part="${p.id}">${rect(...p.box, 'hl', 8)}</g>`);
  const parts = plan.parts.map((p) => {
    const name = labels ? '' : text(p.label[0], p.label[1], p.name, { cls: 'small part-name', anchor: p.label[2] });
    const mark = labels?.[p.id] ? tag(p.anchor[0], p.anchor[1], labels[p.id]) : '';
    return `<g data-part="${p.id}">${p.body}${name}${mark}</g>`;
  });
  const flows = plan.flows.map((f) => (f.pipe ? path(f.d, 'pipe-track') : '') + `<path class="flow flow-${f.id}" data-flow="${f.id}" d="${f.d}"/>`);
  return fig(plan.width, plan.height, plan.alt, plan.back, ...highlights, ...flows, ...parts, plan.front ?? '');
}
