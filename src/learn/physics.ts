import { analyze, fracText, fracValue, type Mode } from '../diagrams/circuit';
import { circuitPlan, leverPlan, pendulumPlan } from './figs/physics';
import { clamp, type Guide } from './types';

// 物理: てこ (6 年)・ふりこ (5 年)・回路 (3・4 年)

const lever: Guide = {
  id: 'lever',
  field: '物理',
  grades: [6],
  name: 'てこのつり合い',
  lead: '左右におもりをつるして、てこがつり合うきまりを見つけよう。',
  plan: leverPlan,
  steps: [
    {
      title: '実験用てこ',
      text: 'まん中の「支点」でささえられたうでに、左右それぞれ1〜6の目もりがあります。目もりにおもりをつるして、うでがどうなるかを調べます。',
      parts: ['fulcrum', 'beam'],
      flows: [],
    },
    {
      title: 'うでをかたむけるはたらき',
      text: 'おもりは、うでをかたむけようとします。そのはたらきは、「おもりの重さ × 支点からのきょり（目もり）」で表せます。\n同じ重さでも、支点から遠いところにつるすほど、うでを大きくかたむけます。',
      parts: ['left', 'right'],
      flows: [],
    },
    {
      title: 'つり合うとき',
      text: '左の「重さ × きょり」と、右の「重さ × きょり」が等しいとき、うでは水平につり合います。\nはじめの図では、左が 30g × 4 ＝ 120、右が 40g × 3 ＝ 120 なので、つり合っています。',
      parts: ['left', 'right', 'beam'],
      flows: [],
    },
    {
      title: '大きい方にかたむく',
      text: '左右の「重さ × きょり」がちがうときは、大きい方へかたむきます。下のつまみで、おもりの重さやつるす目もりを変えて、たしかめてみよう。',
      parts: ['left', 'right'],
      flows: [],
    },
    {
      title: '身のまわりのてこ',
      text: 'くぎぬきやせんぬき、はさみも、てこのしくみを使っています。手で持つところ（力点）を支点から遠くするほど、小さい力で大きなはたらきをすることができます。',
      parts: ['fulcrum'],
      flows: [],
    },
  ],
  controls: [
    { kind: 'range', key: 'lw', label: '左のおもり', min: 10, max: 60, step: 10, value: 30, show: (v) => `${v}g` },
    { kind: 'range', key: 'ld', label: '左の目もり', min: 1, max: 6, step: 1, value: 4, show: (v) => String(v) },
    { kind: 'range', key: 'rw', label: '右のおもり', min: 10, max: 60, step: 10, value: 40, show: (v) => `${v}g` },
    { kind: 'range', key: 'rd', label: '右の目もり', min: 1, max: 6, step: 1, value: 3, show: (v) => String(v) },
  ],
  state: (v) => {
    const [lw, ld, rw, rd] = [v.lw, v.ld, v.rw, v.rd].map(Number);
    const left = lw * ld;
    const right = rw * rd;
    const tilt = left === right ? 0 : left > right ? -10 : 10;
    return {
      vars: { '--tilt': `${tilt}deg`, '--lx': `${-ld * 30}px`, '--rx': `${rd * 30}px` },
      labels: { lw: `${lw}g`, rw: `${rw}g` },
      readouts: [
        { label: '左 (重さ × きょり)', value: `${lw} × ${ld} ＝ ${left}` },
        { label: '右 (重さ × きょり)', value: `${rw} × ${rd} ＝ ${right}` },
        { label: 'てこは', value: left === right ? '水平につり合う' : left > right ? '左にかたむく' : '右にかたむく' },
      ],
    };
  },
  points: ['てこをかたむけるはたらきは「おもりの重さ × 支点からのきょり」', '左右のはたらきが等しいとき、てこは水平につり合う', '力点が支点から遠いほど、小さい力ですむ'],
  quiz: [
    {
      q: 'てこの左のうでの目もり2に60gのおもりをつるしました。右のうでの目もり3に何gのおもりをつるすと、水平につり合いますか。',
      a: '40g',
      wrong: ['20g', '60g', '90g', '30g'],
      ex: '左は 60 × 2 ＝ 120 です。右も □ × 3 ＝ 120 になればよいので、□ ＝ 40（g）です。',
    },
    {
      q: 'てこの左の目もり5に20g、右の目もり3に30gのおもりをつるしました。てこはどうなりますか。',
      a: '左にかたむく',
      wrong: ['右にかたむく', '水平につり合う', '回りつづける'],
      ex: '左は 20 × 5 ＝ 100、右は 30 × 3 ＝ 90 です。左の方が大きいので、左にかたむきます。',
    },
    {
      q: 'てこを使って、小さい力で重いものを持ち上げるには、どうすればよいですか。',
      a: '力点を支点から遠くし、作用点を支点に近くする',
      wrong: ['力点を支点に近くし、作用点を支点から遠くする', '力点と作用点を同じ位置にする', '支点を力点のすぐ横にする'],
      ex: '支点から力点までのきょりが長いほど、支点から作用点までのきょりが短いほど、小さい力ですみます。',
    },
  ],
};

const LENGTHS = ['25', '50', '100', '200'];

/** ふりこの 1 往復の時間 (秒)。長さ (cm) だけで決まる */
export const period = (cm: number) => 2 * Math.PI * Math.sqrt(cm / 100 / 9.8);

const pendulum: Guide = {
  id: 'pendulum',
  field: '物理',
  grades: [5],
  name: 'ふりこのきまり',
  lead: '糸の長さ・おもりの重さ・ふれはばを変えて、1往復する時間が何で決まるかを調べよう。',
  plan: pendulumPlan,
  steps: [
    {
      title: 'ふりこと1往復',
      text: '糸におもりをつけて、支点からつるしたものを「ふりこ」といいます。\nおもりが、ふれはじめたはしから反対のはしまで行き、もとのはしにもどってくるまでを「1往復」といいます。',
      parts: ['pivot', 'string', 'bob'],
      flows: [],
    },
    {
      title: '糸の長さを変えてみよう',
      text: '下の「糸の長さ」を変えてみよう。糸が長いほど、ゆっくりふれて、1往復する時間が長くなります。\n長さを4倍にすると、1往復する時間は2倍になります。',
      parts: ['string'],
      flows: [],
    },
    {
      title: 'おもりの重さを変えても…',
      text: '今度は「おもりの重さ」だけを変えてみよう。重くしても軽くしても、1往復する時間は変わりません。',
      parts: ['bob'],
      flows: [],
    },
    {
      title: 'ふれはばを変えても…',
      text: '「ふれはば」だけを変えても、1往復する時間はほとんど変わりません。\nふりこが1往復する時間は、糸の長さ（支点からおもりの中心まで）だけで決まるのです。',
      parts: ['bob'],
      flows: [],
    },
    {
      title: '正しくはかるには',
      text: '1往復の時間は短くてはかりにくいので、10往復する時間をはかって10でわります。何回かはかって平均すると、より正しくなります。\n調べたい条件だけを変え、ほかの条件は同じにして実験することも大切です。',
      parts: ['pivot', 'bob'],
      flows: [],
    },
  ],
  controls: [
    { kind: 'select', key: 'len', label: '糸の長さ', value: '50', options: LENGTHS.map((l) => ({ value: l, label: `${l}cm` })) },
    { kind: 'select', key: 'g', label: 'おもりの重さ', value: '20', options: ['10', '20', '40'].map((g) => ({ value: g, label: `${g}g` })) },
    { kind: 'select', key: 'amp', label: 'ふれはば', value: '20', options: ['10', '20', '30'].map((a) => ({ value: a, label: `${a}°` })) },
  ],
  state: (v) => {
    const cm = Number(v.len);
    const t = period(cm);
    // 図の糸の長さ (100px が 1)。長いふりこも図に入るように、少しちぢめる
    const px = { 25: 60, 50: 110, 100: 180, 200: 260 }[cm] ?? 110;
    return {
      vars: {
        '--k': String(px / 100),
        '--bob': `${px}px`,
        '--m': String({ 10: 0.8, 20: 1, 40: 1.3 }[Number(v.g)] ?? 1),
        '--amp': `${Number(v.amp)}deg`,
        '--period': `${t.toFixed(2)}s`,
      },
      readouts: [
        { label: '1往復する時間', value: `約${t.toFixed(1)}秒` },
        { label: '10往復する時間', value: `約${(t * 10).toFixed(0)}秒` },
      ],
    };
  },
  points: ['ふりこが1往復する時間は、糸の長さだけで決まる', 'おもりの重さやふれはばを変えても、1往復する時間は変わらない', '糸が長いほど、1往復する時間は長い'],
  quiz: [
    {
      q: 'ふりこが1往復する時間を長くするには、どうすればよいですか。',
      a: '糸を長くする',
      wrong: ['おもりを重くする', 'ふれはばを大きくする', 'おもりを軽くする'],
      ex: 'ふりこが1往復する時間は、糸の長さだけで決まります。糸を長くすると、1往復する時間は長くなります。',
    },
    {
      q: 'ふりこのおもりを、20gから40gにかえました。1往復する時間はどうなりますか。',
      a: '変わらない',
      wrong: ['2倍になる', '半分になる', '4倍になる'],
      ex: 'おもりの重さを変えても、1往復する時間は変わりません。',
    },
    {
      q: 'ふりこが10往復する時間をはかると、14秒でした。このふりこが1往復する時間は何秒ですか。',
      a: '1.4秒',
      wrong: ['14秒', '140秒', '0.14秒'],
      ex: '10往復で14秒なので、1往復は 14 ÷ 10 ＝ 1.4（秒）です。',
    },
  ],
};

const MODES = [
  { value: '1', label: '1個' },
  { value: 's', label: '2個を直列' },
  { value: 'p', label: '2個を並列' },
];

/** 選んだつなぎ方 → 個数とつなぎ方 */
const parse = (v: string): { n: number; mode: Mode } => (v === '1' ? { n: 1, mode: 's' } : { n: 2, mode: v as Mode });

const circuit: Guide = {
  id: 'circuit',
  field: '物理',
  grades: [3, 4],
  ruby: true,
  name: '回路と豆電球の明るさ',
  lead: '乾電池や豆電球のつなぎ方を変えて、明るさがどう変わるか見てみよう。',
  plan: circuitPlan,
  steps: [
    {
      title: '電気の通り道 (回路)',
      text: '乾電池の＋極から出た電気は、導線を通って豆電球を光らせ、－極にもどります。この1つの輪になった電気の通り道を「回路」といいます。',
      parts: ['cells', 'bulbs', 'wire'],
      flows: ['electric'],
    },
    {
      title: 'スイッチを切ると',
      text: 'スイッチを切ると、回路がとちゅうで切れて、電気が流れなくなり、豆電球は消えます。下の切りかえでためしてみよう。',
      parts: ['switch'],
      flows: ['electric'],
    },
    {
      title: '乾電池を直列つなぎにする',
      text: '乾電池2個を、＋極と－極が次々につながるようにつなぐことを「直列つなぎ」といいます。回路に流れる電流が大きくなり、豆電球は明るくなります。\n乾電池2個を「並列つなぎ」にしたときは、乾電池1個のときと同じ明るさです。',
      parts: ['cells'],
      flows: ['electric'],
    },
    {
      title: '豆電球を直列・並列にする',
      text: '豆電球2個を1本の道につなぐ「直列つなぎ」では、1個ずつが暗くなります。道が分かれた「並列つなぎ」では、1個ずつが1個のときと同じ明るさです。',
      parts: ['bulbs'],
      flows: ['electric'],
    },
    {
      title: 'いろいろなつなぎ方',
      text: '乾電池と豆電球のつなぎ方を組み合わせて、明るさと電流の大きさをくらべてみよう。いちばん明るくなるのは、どのつなぎ方かな。',
      parts: ['cells', 'bulbs'],
      flows: ['electric'],
    },
  ],
  controls: [
    { kind: 'select', key: 'cells', label: '乾電池', value: '1', options: MODES },
    { kind: 'select', key: 'bulbs', label: '豆電球', value: '1', options: MODES },
    { kind: 'toggle', key: 'sw', label: 'スイッチ', value: true, on: '入れる', off: '切る' },
  ],
  state: (v) => {
    const c = parse(String(v.cells));
    const b = parse(String(v.bulbs));
    const on = v.sw === true;
    const a = analyze({ cells: c.n, cellMode: c.mode, bulbs: b.n, bulbMode: b.mode });
    const bright = on ? fracValue(a.perBulb) : 0;
    const total = on ? fracValue(a.total) : 0;
    return {
      // いちばん明るいとき (1 個の 2 倍) を 1 にする
      vars: { '--out': String(clamp(bright / 2) * 0.9 + (on ? 0.1 : 0)) },
      classes: { 'cells-s': v.cells === 's', 'cells-p': v.cells === 'p', 'bulbs-s': v.bulbs === 's', 'bulbs-p': v.bulbs === 'p', 'sw-off': !on },
      speed: clamp(total / 4),
      readouts: [
        { label: '豆電球1個の明るさ', value: on ? `1個のときの${fracText(a.perBulb)}倍` : '消えている', meter: clamp(bright / 2) },
        { label: '回路を流れる電流', value: on ? `1個のときの${fracText(a.total)}倍` : '流れない', meter: clamp(total / 4) },
      ],
    };
  },
  points: ['乾電池を直列つなぎにすると、電流が大きくなり、豆電球は明るくなる', '乾電池を並列つなぎにしても、明るさは1個のときと同じ (長持ちする)', '豆電球を直列つなぎにすると暗くなり、並列つなぎにすると1個のときと同じ明るさ'],
  quiz: [
    {
      q: '乾電池2個をどのようにつなぐと、豆電球がいちばん明るくなりますか。',
      a: '直列つなぎ',
      wrong: ['並列つなぎ', 'どちらも同じ', '＋極どうしをつなぐ'],
      ex: '乾電池を直列つなぎにすると、回路を流れる電流が大きくなり、豆電球は明るくなります。',
    },
    {
      q: '豆電球2個を並列つなぎにしました。豆電球1個の明るさは、豆電球1個だけをつないだときとくらべてどうですか。',
      a: '同じ',
      wrong: ['明るくなる', '暗くなる', '消える'],
      ex: '並列つなぎでは、それぞれの豆電球に、1個のときと同じ大きさの電流が流れるので、明るさは同じです。',
    },
    {
      q: 'スイッチを切ると、豆電球が消えるのはなぜですか。',
      a: '回路がとちゅうで切れて、電気が流れなくなるから',
      wrong: ['乾電池の電気がなくなるから', '豆電球がこわれるから', '電気が反対向きに流れるから'],
      ex: 'スイッチを切ると、電気の通り道（回路）がとちゅうで切れるので、電気が流れなくなり、豆電球は消えます。',
    },
  ],
};

export const PHYSICS: readonly Guide[] = [lever, pendulum, circuit];
