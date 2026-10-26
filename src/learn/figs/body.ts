import { arrow, circle, ellipse, line, path, rect, text } from '../../diagrams/svg';
import { moving, type Plan } from './common';

// 人体の図 (血液のめぐり・消化・呼吸)

/** 名前を書いた器官の四角 */
const organ = (x: number, y: number, w: number, h: number, cls = 'fill-soft') => rect(x, y, w, h, cls, 10);

/** 血液のめぐり。心臓は --beat の間かくで打つ */
export function bloodPlan(): Plan {
  return {
    width: 380,
    height: 420,
    alt: '血液のめぐりの図。心臓から送り出された血液は、肺へ行って酸素をとり入れ、心臓にもどってから全身へ送られる。全身で酸素をわたし、二酸化炭素や不要なものを受けとって、心臓にもどる。小腸では養分を、じん臓では不要なものをこしとる。',
    back: '',
    parts: [
      { id: 'lungs', name: '肺', box: [116, 26, 148, 76], anchor: [130, 64], label: [190, 70], body: organ(124, 34, 132, 60) },
      {
        id: 'heart',
        name: '心臓',
        box: [140, 150, 100, 92],
        anchor: [160, 200],
        label: [244, 236, 'start'],
        body: moving('beat', 'transform-origin:190px 196px', path('M190 236C160 214 146 198 146 180C146 164 160 156 172 160C180 162 186 168 190 174C194 168 200 162 208 160C220 156 234 164 234 180C234 198 220 214 190 236Z', 'flame')),
      },
      { id: 'smallint', name: '小腸', box: [50, 272, 110, 56], anchor: [66, 300], label: [105, 306], body: organ(56, 278, 98, 44) },
      { id: 'kidney', name: 'じん臓', box: [220, 272, 110, 56], anchor: [314, 300], label: [275, 306], body: organ(226, 278, 98, 44) },
      { id: 'body', name: '全身', box: [110, 350, 160, 56], anchor: [126, 378], label: [190, 384], body: organ(116, 356, 148, 44) },
    ],
    flows: [
      // 心臓 → 肺 (二酸化炭素の多い血液)、肺 → 心臓 (酸素の多い血液)
      { id: 'blue', d: 'M176 158V94', pipe: true },
      { id: 'red', d: 'M204 94V158', pipe: true },
      // 心臓 → 全身・じん臓・小腸 (酸素の多い血液)
      { id: 'red', d: 'M234 196H350V378H264', pipe: true },
      { id: 'red', d: 'M350 300H324', pipe: true },
      { id: 'red', d: 'M350 250H30V300H56', pipe: true },
      // 全身・じん臓・小腸 → 心臓 (二酸化炭素の多い血液)
      { id: 'blue', d: 'M116 378H14V210H146', pipe: true },
      { id: 'blue', d: 'M226 300H190V250', pipe: true },
      { id: 'blue', d: 'M154 300H178V250', pipe: true },
    ],
  };
}

/** 食べ物の通り道 (口 → こう門)。offset-path に使う */
const ROUTE = 'M190 64V138C190 150 196 156 206 160C232 170 236 196 214 206C196 214 184 214 176 220L218 228L160 240L218 252L160 264L218 276L176 286H138V214H252V320H200V352';

/** 消化。食べ物 (bolus) は --pos で通り道を進む */
export function digestionPlan(): Plan {
  return {
    width: 380,
    height: 390,
    alt: '消化管の図。口から入った食べ物は、食道・胃・小腸・大腸を通って、こう門から出される。とちゅうで消化液によって消化され、小腸で養分が、大腸で水分が吸収される。',
    back: circle(190, 40, 30, 'box') + path('M120 120Q190 90 260 120V360Q190 380 120 360Z', 'body-outline'),
    parts: [
      { id: 'mouth', name: '口', box: [166, 46, 48, 30], anchor: [190, 60], label: [232, 64, 'start'], body: path('M178 58Q190 68 202 58', 'ln') },
      { id: 'esophagus', name: '食道', box: [176, 74, 28, 70], anchor: [190, 100], label: [214, 108, 'start'], body: '' },
      { id: 'stomach', name: '胃', box: [190, 146, 62, 70], anchor: [236, 170], label: [262, 186, 'start'], body: path('M200 150C240 152 248 196 222 208C204 216 188 214 178 220', 'organ-line') },
      { id: 'liver', name: 'かん臓', box: [112, 136, 76, 56], anchor: [130, 160], label: [100, 160, 'end'], body: path('M118 150Q150 136 184 150Q178 182 140 186Q120 182 118 150Z', 'fill-soft') },
      { id: 'smallint', name: '小腸', box: [152, 222, 76, 70], anchor: [200, 250], label: [190, 306], body: '' },
      { id: 'largeint', name: '大腸', box: [126, 204, 138, 126], anchor: [252, 300], label: [282, 280, 'start'], body: '' },
      { id: 'anus', name: 'こう門', box: [180, 334, 40, 30], anchor: [200, 352], label: [226, 360, 'start'], body: circle(200, 352, 3, 'ink') },
    ],
    flows: [{ id: 'food', d: ROUTE, pipe: true }],
    front: `<circle class="bolus" r="8" cx="0" cy="0" style="offset-path:path('${ROUTE}');offset-distance:var(--pos, 0%)"/>`,
  };
}

/** 呼吸。肺は --dur の間かくでふくらむ。figure のクラス exhale ではく息 */
export function breathingPlan(): Plan {
  return {
    width: 440,
    height: 330,
    alt: '呼吸のしくみの図。鼻や口からすいこんだ空気は、気管を通って肺に入る。肺の中の小さなふくろ (肺ほう) で、空気中の酸素が血液にとり入れられ、血液中の二酸化炭素が出される。',
    back: circle(130, 40, 28, 'box') + line(30, 290, 230, 290, 'ln thin'),
    parts: [
      { id: 'nose', name: '鼻・口', box: [100, 20, 60, 44], anchor: [130, 44], label: [172, 36, 'start'], body: circle(130, 48, 3, 'ink') },
      { id: 'trachea', name: '気管', box: [118, 68, 24, 72], anchor: [130, 100], label: [150, 104, 'start'], body: rect(124, 68, 12, 80, 'box', 4) },
      {
        id: 'lungs',
        name: '肺',
        box: [34, 128, 192, 156],
        anchor: [70, 200],
        label: [130, 300],
        body: moving('breathe', 'transform-origin:130px 140px', ellipse(84, 206, 46, 70, 'fill-soft') + ellipse(176, 206, 46, 70, 'fill-soft') + path('M130 146L100 166M130 146L160 166', 'ln')),
      },
      {
        id: 'alveolus',
        name: '肺ほう',
        box: [262, 96, 166, 170],
        anchor: [300, 120],
        label: [344, 290],
        body: circle(344, 180, 54, 'box') + path('M300 228Q344 252 390 228', 'vessel') + text(344, 186, '空気', { cls: 'small' }) + line(226, 190, 290, 180, 'ln thin dash'),
      },
    ],
    flows: [
      { id: 'air', d: 'M130 20V150', pipe: true },
      { id: 'o2', d: 'M330 200L326 236' },
      { id: 'co2', d: 'M362 236L366 200' },
    ],
    front:
      text(298, 254, '血液', { cls: 'tiny' }) +
      text(310, 214, '酸素', { cls: 'tiny o2-label' }) +
      text(384, 214, '二酸化炭素', { cls: 'tiny co2-label' }) +
      arrow(330, 200, 326, 236, 'ln thin o2-arrow') +
      arrow(362, 236, 366, 200, 'ln thin co2-arrow'),
  };
}
