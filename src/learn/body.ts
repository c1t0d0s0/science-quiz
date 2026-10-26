import { bloodPlan, breathingPlan, digestionPlan } from './figs/body';
import { clamp, type Guide } from './types';

// 人体 (6 年): 血液のめぐり・消化と吸収・呼吸

const ACTIVITY = [
  { value: 'rest', label: 'じっとしている', pulse: 70 },
  { value: 'walk', label: '歩く', pulse: 100 },
  { value: 'run', label: '走る', pulse: 140 },
];

const blood: Guide = {
  id: 'blood',
  field: '人体',
  grades: [6],
  name: '血液のめぐり',
  lead: '心臓から送り出された血液が、肺や全身をどのようにめぐっているかを見てみよう。',
  plan: bloodPlan,
  steps: [
    {
      title: '心臓はポンプ',
      text: '心臓は、ちぢんだりゆるんだりして、血液を全身に送り出すポンプです。この動きを「はく動」といい、手首などで感じる「脈はく」は、はく動が血管を伝わったものです。',
      parts: ['heart'],
      flows: [],
    },
    {
      title: '肺で酸素をとり入れる',
      text: '心臓から肺へ送られた血液は、肺で二酸化炭素を出し、酸素をとり入れます。酸素を多くふくんだ血液は、また心臓にもどります。\n図では、酸素の多い血液を赤、二酸化炭素の多い血液を青で表しています。',
      parts: ['heart', 'lungs'],
      flows: ['red', 'blue'],
    },
    {
      title: '全身へ酸素と養分を運ぶ',
      text: '心臓から全身へ送り出された血液は、からだのすみずみまで酸素や養分を運びます。そのかわりに、からだでできた二酸化炭素や不要なものを受けとって、心臓にもどります。',
      parts: ['heart', 'body'],
      flows: ['red', 'blue'],
    },
    {
      title: '小腸とじん臓',
      text: '小腸では、消化された養分が血液にとり入れられます。じん臓では、血液の中の不要なものがこしとられ、にょうになります。',
      parts: ['smallint', 'kidney'],
      flows: ['red', 'blue'],
    },
    {
      title: '運動すると速くなる',
      text: '運動すると、からだはたくさんの酸素や養分を必要とします。そのため、心臓のはく動が速くなり、たくさんの血液を送り出します。下で運動の強さを変えてみよう。\n1回のはく動で送り出す血液は、おとなで約70mLです。',
      parts: ['heart'],
      flows: ['red', 'blue'],
      values: { act: 'run' },
    },
  ],
  controls: [{ kind: 'select', key: 'act', label: '運動の強さ', value: 'rest', options: ACTIVITY.map(({ value, label }) => ({ value, label })) }],
  state: (v) => {
    const pulse = ACTIVITY.find((a) => a.value === v.act)?.pulse ?? 70;
    return {
      vars: { '--beat': `${(60 / pulse).toFixed(2)}s` },
      speed: clamp((pulse - 40) / 100),
      readouts: [
        { label: '1分間の脈はく', value: `約${pulse}回`, meter: clamp(pulse / 160) },
        { label: '1分間に送り出す血液', value: `約${((pulse * 70) / 1000).toFixed(1)}L` },
      ],
    };
  },
  points: ['心臓 → 肺 → 心臓 → 全身 → 心臓 の順に、血液がめぐる', '肺で酸素をとり入れ、二酸化炭素を出す', '小腸で養分を、じん臓で不要なものをこしとる'],
  quiz: [
    {
      q: '肺から心臓にもどる血液は、どんな血液ですか。',
      a: '酸素を多くふくむ血液',
      wrong: ['二酸化炭素を多くふくむ血液', '養分だけをふくむ血液', '何もふくまない血液'],
      ex: '肺で二酸化炭素を出し、酸素をとり入れた血液が、心臓にもどってきます。',
    },
    {
      q: '血液の中の不要なものをこしとって、にょうをつくるところはどこですか。',
      a: 'じん臓',
      wrong: ['肺', '胃', '心臓'],
      ex: 'じん臓は、血液の中の不要なものや余分な水をこしとって、にょうをつくります。',
    },
    {
      q: '運動すると、脈はくが速くなるのはなぜですか。',
      a: 'からだがたくさんの酸素や養分を必要とするから',
      wrong: ['血液がへってしまうから', '心臓が休むから', '肺が小さくなるから'],
      ex: '運動すると、からだがたくさんの酸素や養分を使うので、心臓が速く動いて、たくさんの血液を送り出します。',
    },
  ],
};

/** 食べてからの時間 (時間) → 通り道のどこまで進んだか (%) */
const ROUTE_TIME: [number, number][] = [[0, 2], [1, 20], [3, 26], [4, 32], [8, 58], [10, 66], [23, 96], [24, 100]];

function routePos(hours: number): number {
  for (let i = 1; i < ROUTE_TIME.length; i++) {
    const [t0, p0] = ROUTE_TIME[i - 1];
    const [t1, p1] = ROUTE_TIME[i];
    if (hours <= t1) return p0 + ((p1 - p0) * (hours - t0)) / (t1 - t0);
  }
  return 100;
}

/** 食べてからの時間 → 食べ物がいるところと、そこでのはたらき */
export function digestStage(hours: number): { where: string; work: string } {
  if (hours < 1) return { where: '口', work: 'だ液がでんぷんを消化する' };
  if (hours < 4) return { where: '胃', work: '胃液がたんぱく質を消化する' };
  if (hours < 9) return { where: '小腸', work: 'すい液や腸の消化液で消化され、養分が吸収される' };
  if (hours < 24) return { where: '大腸', work: 'おもに水分が吸収される' };
  return { where: 'こう門', work: 'のこったものが、ふんとして出される' };
}

const digestion: Guide = {
  id: 'digestion',
  field: '人体',
  grades: [6],
  name: '消化と吸収',
  lead: '口から入った食べ物が、どこを通って、どのように消化されるかを追いかけよう。',
  plan: digestionPlan,
  steps: [
    {
      title: '口でかみくだく',
      text: '食べ物は、口の中で歯でかみくだかれ、だ液とまざります。だ液には、ごはんなどにふくまれる「でんぷん」を別のものに変えるはたらきがあります。\n食べ物を、からだに吸収されやすいものに変えることを「消化」といいます。',
      parts: ['mouth'],
      flows: ['food'],
      values: { h: 0 },
    },
    {
      title: '食道から胃へ',
      text: 'のみこんだ食べ物は、食道を通って胃に運ばれます。胃では、胃液によって、肉や魚にふくまれる「たんぱく質」が消化されます。',
      parts: ['esophagus', 'stomach'],
      flows: ['food'],
      values: { h: 2 },
    },
    {
      title: '小腸で吸収する',
      text: '小腸は、長さが6〜7mもある管です。すい液や小腸の消化液でさらに消化され、養分は小腸のかべから血液にとり入れられます（吸収）。\nとり入れた養分は、血液でかん臓に運ばれ、一部はたくわえられます。',
      parts: ['smallint', 'liver'],
      flows: ['food'],
      values: { h: 6 },
    },
    {
      title: '大腸で水分を吸収',
      text: '大腸では、おもに水分が吸収されます。のこったものは、ふんとして、こう門から出されます。\n口からこう門までの1本の通り道を「消化管」といいます。',
      parts: ['largeint', 'anus'],
      flows: ['food'],
      values: { h: 14 },
    },
    {
      title: '食べ物を追いかけよう',
      text: '下のつまみで、食べてからの時間を進めてみよう。食べ物が、今どこにあって、どんなはたらきを受けているかがわかります。',
      parts: [],
      flows: ['food'],
    },
  ],
  controls: [{ kind: 'range', key: 'h', label: '食べてからの時間', min: 0, max: 24, step: 1, value: 0, show: (v) => `${v}時間` }],
  state: (v) => {
    const hours = Number(v.h);
    const s = digestStage(hours);
    return {
      vars: { '--pos': `${routePos(hours).toFixed(1)}%` },
      readouts: [
        { label: '食べ物があるところ', value: s.where },
        { label: 'そこでのはたらき', value: s.work },
      ],
    };
  },
  points: ['口 → 食道 → 胃 → 小腸 → 大腸 → こう門 の順に通る', 'だ液はでんぷんを、胃液はたんぱく質を消化する', '養分はおもに小腸で吸収され、血液で全身に運ばれる'],
  quiz: [
    {
      q: '消化された養分は、おもにどこで吸収されますか。',
      a: '小腸',
      wrong: ['胃', '大腸', '食道'],
      ex: '消化された養分は、おもに小腸のかべから吸収され、血液にとり入れられます。',
    },
    {
      q: 'だ液には、どんなはたらきがありますか。',
      a: 'でんぷんを別のものに変える',
      wrong: ['たんぱく質を別のものに変える', '水分を吸収する', '養分をたくわえる'],
      ex: 'だ液は、ごはんなどにふくまれるでんぷんを、別のもの（糖）に変えます。',
    },
    {
      q: '食べ物が通る順として、正しいものはどれですか。',
      a: '口 → 食道 → 胃 → 小腸 → 大腸',
      wrong: ['口 → 胃 → 食道 → 小腸 → 大腸', '口 → 食道 → 胃 → 大腸 → 小腸', '口 → 食道 → 小腸 → 胃 → 大腸'],
      ex: '食べ物は、口 → 食道 → 胃 → 小腸 → 大腸 の順に通り、のこったものがこう門から出されます。',
    },
  ],
};

const breathing: Guide = {
  id: 'breathing',
  field: '人体',
  grades: [6],
  name: '呼吸のしくみ',
  lead: 'すった空気が肺でどうなり、はく息とどこがちがうのかをたしかめよう。',
  plan: breathingPlan,
  steps: [
    {
      title: '空気の通り道',
      text: '鼻や口からすいこんだ空気は、「気管」という管を通って、左右の肺に入ります。',
      parts: ['nose', 'trachea', 'lungs'],
      flows: ['air'],
    },
    {
      title: '肺ほう',
      text: '肺の中では、気管が細かく分かれ、その先に「肺ほう」という小さなふくろがたくさんついています。肺ほうのまわりには、細い血管があみの目のように広がっています。',
      parts: ['alveolus'],
      flows: [],
    },
    {
      title: '酸素と二酸化炭素のこうかん',
      text: '肺ほうでは、空気中の酸素が血液にとり入れられ、血液の中の二酸化炭素が空気中に出されます。この血液が心臓にもどり、全身に送られます。',
      parts: ['alveolus'],
      flows: ['o2', 'co2'],
    },
    {
      title: 'すう空気とはく息',
      text: 'はく息は、すう空気とくらべて、酸素が少なく、二酸化炭素が多くなっています。下の切りかえで、くらべてみよう。\nはく息にも酸素はまだ残っています。人工呼吸ができるのは、このためです。',
      parts: ['lungs'],
      flows: ['air'],
      values: { inhale: false },
    },
    {
      title: '運動すると呼吸もふえる',
      text: '運動すると、からだがたくさんの酸素を使うので、呼吸の回数がふえ、1回の量も大きくなります。',
      parts: ['lungs', 'trachea'],
      flows: ['air', 'o2', 'co2'],
      values: { rate: 'run' },
    },
  ],
  controls: [
    { kind: 'toggle', key: 'inhale', label: 'くらべる空気', value: true, on: 'すう空気', off: 'はく息' },
    { kind: 'select', key: 'rate', label: 'からだのようす', value: 'rest', options: [{ value: 'rest', label: 'じっとしている' }, { value: 'run', label: '運動したあと' }] },
  ],
  state: (v) => {
    const exhale = v.inhale === false;
    const per = v.rate === 'run' ? 40 : 15;
    return {
      classes: { exhale },
      speed: clamp(per / 40),
      readouts: [
        { label: '酸素', value: exhale ? '約17%' : '約21%', meter: (exhale ? 17 : 21) / 25 },
        { label: '二酸化炭素', value: exhale ? '約4%' : '約0.04%', meter: exhale ? 4 / 25 : 0.04 / 25 },
        { label: '1分間の呼吸', value: `約${per}回` },
      ],
    };
  },
  points: ['空気は 鼻・口 → 気管 → 肺 の順に入る', '肺ほうで、酸素を血液にとり入れ、二酸化炭素を出す', 'はく息は、すう空気より酸素が少なく、二酸化炭素が多い'],
  quiz: [
    {
      q: '肺の中にたくさんある小さなふくろを何といいますか。',
      a: '肺ほう',
      wrong: ['気管', '心臓', 'じん臓'],
      ex: '肺の中には肺ほうという小さなふくろがたくさんあり、ここで酸素と二酸化炭素のこうかんが行われます。',
    },
    {
      q: 'はく息を、すう空気とくらべたとき、正しいものはどれですか。',
      a: '酸素が少なく、二酸化炭素が多い',
      wrong: ['酸素が多く、二酸化炭素が少ない', '酸素も二酸化炭素もふくまれていない', 'すう空気とまったく同じ'],
      ex: 'からだが酸素を使い、二酸化炭素を出すので、はく息はすう空気より酸素が少なく、二酸化炭素が多くなります。',
    },
    {
      q: 'はく息に、酸素はふくまれていますか。',
      a: 'すう空気より少ないが、まだふくまれている',
      wrong: ['まったくふくまれていない', 'すう空気より多くふくまれている', 'すう空気と同じだけふくまれている'],
      ex: 'はく息にも約17%の酸素がふくまれています。すう空気（約21%）より少ないですが、なくなるわけではありません。',
    },
  ],
};

export const BODY_GUIDES: readonly Guide[] = [blood, digestion, breathing];
