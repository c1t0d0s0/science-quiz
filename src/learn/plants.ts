import { germinationPlan, photosynthesisPlan, waterPathPlan } from './figs/plants';
import { clamp, round1, type Guide } from './types';

// 植物: 水の通り道 (6 年)・光合成 (6 年)・発芽の条件 (5 年)

const waterpath: Guide = {
  id: 'waterpath',
  field: '植物',
  grades: [6],
  name: '植物の水の通り道',
  lead: '根からすった水が、くきを通って葉から出ていくようすを見てみよう。',
  plan: waterPathPlan,
  steps: [
    {
      title: '根から水をすう',
      text: 'ホウセンカを根ごとほり上げ、根を色水につけておきます。植物は、根から水をすい上げます。',
      parts: ['roots'],
      flows: ['water'],
    },
    {
      title: 'くきの中の水の通り道',
      text: 'しばらくすると、色水がくきを上がっていきます。くきを切ってみると、水の通り道が色水でそまっているのがわかります。\n下のつまみで時間を進めてみよう。',
      parts: ['stem'],
      flows: ['water'],
      values: { h: 3, leaf: true, bag: false },
    },
    {
      title: '葉から出ていく (蒸散)',
      text: '葉まで運ばれた水は、葉の表面にある小さな穴「気こう」から、水蒸気になって空気中に出ていきます。これを「蒸散」といいます。',
      parts: ['leaves', 'stoma'],
      flows: ['water', 'vapor'],
    },
    {
      title: 'ふくろをかぶせると',
      text: '葉にふくろをかぶせておくと、ふくろの内がわが水てきでくもります。葉から水が出ていった証拠です。\n葉をとったくきにかぶせたふくろは、ほとんどくもりません。',
      parts: ['bag', 'leaves'],
      flows: ['vapor'],
      values: { h: 3, leaf: true, bag: true },
    },
    {
      title: '葉があるかないかでくらべる',
      text: '葉がある方が、色水が早くへります。根からすった水の多くは、葉から出ていくのです。切りかえで、葉のある・なしをくらべてみよう。',
      parts: ['leaves'],
      flows: ['water', 'vapor'],
    },
  ],
  controls: [
    { kind: 'range', key: 'h', label: '色水につけた時間', min: 0, max: 4, step: 1, value: 2, show: (v) => `${v}時間` },
    { kind: 'toggle', key: 'leaf', label: '葉', value: true, on: 'あり', off: 'とる' },
    { kind: 'toggle', key: 'bag', label: 'ふくろ', value: false, on: 'かぶせる', off: 'かぶせない' },
  ],
  state: (v) => {
    const h = Number(v.h);
    const leaf = v.leaf === true;
    // 葉があると、蒸散で水がたくさん出ていくので、早くすい上げる
    const perHour = leaf ? 2.5 : 0.5;
    const rise = clamp((h * (leaf ? 0.35 : 0.15)) / 1);
    const fog = v.bag === true ? clamp((h * (leaf ? 0.3 : 0.05)) / 1) : 0;
    return {
      vars: { '--rise': String(round1(rise)), '--fog': String(round1(fog)) },
      classes: { 'no-leaf': !leaf, bag: v.bag === true },
      speed: h === 0 ? 0 : leaf ? 0.8 : 0.3,
      readouts: [
        { label: 'へった色水', value: `約${round1(perHour * h)}mL`, meter: clamp((perHour * h) / 10) },
        { label: 'ふくろの内がわ', value: v.bag !== true ? 'ふくろなし' : fog >= 0.5 ? '水てきでくもっている' : fog > 0 ? '少しくもってきた' : 'くもっていない' },
      ],
    };
  },
  points: ['水は、根 → くき → 葉 と運ばれる', '葉の気こうから、水が水蒸気になって出ていく (蒸散)', '葉があると、水がたくさん出ていく'],
  quiz: [
    {
      q: '植物の葉から、水が水蒸気になって出ていくことを何といいますか。',
      a: '蒸散',
      wrong: ['光合成', '呼吸', 'ふっとう'],
      ex: '根からすい上げた水が、葉の気こうから水蒸気になって出ていくことを蒸散といいます。',
    },
    {
      q: '葉の表面にある、水蒸気が出ていく小さな穴を何といいますか。',
      a: '気こう',
      wrong: ['道管', '根毛', '肺ほう'],
      ex: '葉の表面には気こうという小さな穴がたくさんあり、ここから水蒸気が出ていきます。',
    },
    {
      q: '葉のついた枝と、葉をとった枝にふくろをかぶせました。ふくろの内がわがよくくもるのはどちらですか。',
      a: '葉のついた枝',
      wrong: ['葉をとった枝', 'どちらも同じ', 'どちらもくもらない'],
      ex: '水は、おもに葉から出ていくので、葉のついた枝にかぶせたふくろの方が、よくくもります。',
    },
  ],
};

const photosynthesis: Guide = {
  id: 'photosynthesis',
  field: '植物',
  grades: [6],
  name: '葉ででんぷんをつくる',
  lead: '日光に当てた葉に、でんぷんができるかをヨウ素液で調べよう。',
  plan: photosynthesisPlan,
  steps: [
    {
      title: '葉に日光を当てる',
      text: '前の日の夕方からアルミはくでおおっておいた葉を使います（夜の間に、葉のでんぷんがなくなるようにするため）。朝、アルミはくをはずして、葉に日光を当てます。',
      parts: ['sun', 'leaf'],
      flows: ['light'],
      values: { sun: true, foil: false, test: false },
    },
    {
      title: 'ヨウ素液で調べる',
      text: '数時間後に葉をとり、湯につけてやわらかくしてから、ヨウ素液をつけます。でんぷんがあると、ヨウ素液は青むらさき色に変わります。\n下の切りかえで「ヨウ素液」を「つける」にしてみよう。',
      parts: ['leaf'],
      flows: ['light'],
      values: { sun: true, foil: false, test: true },
    },
    {
      title: '日光に当てないと',
      text: '日光に当てずにおいた葉では、ヨウ素液の色は変わりません。でんぷんができていないのです。切りかえで「日光」を「当てない」にしてくらべよう。',
      parts: ['sun', 'leaf'],
      flows: [],
      values: { sun: false, foil: false, test: true },
    },
    {
      title: '一部をおおうと',
      text: '葉の一部をアルミはくでおおって日光に当てると、おおったところだけ、ヨウ素液の色が変わりません。日光が当たったところにだけ、でんぷんができるのです。',
      parts: ['foil', 'leaf'],
      flows: ['light'],
      values: { sun: true, foil: true, test: true },
    },
    {
      title: '植物は自分で養分をつくる',
      text: '植物は、日光を受けて、葉で自分の養分（でんぷん）をつくっています。このはたらきを「光合成」といいます。光合成では、二酸化炭素と水を使い、酸素を出します。',
      parts: ['sun', 'leaf'],
      flows: ['light'],
    },
  ],
  controls: [
    { kind: 'toggle', key: 'sun', label: '日光', value: true, on: '当てる', off: '当てない' },
    { kind: 'toggle', key: 'foil', label: 'アルミはく', value: false, on: '一部をおおう', off: 'おおわない' },
    { kind: 'toggle', key: 'test', label: 'ヨウ素液', value: false, on: 'つける', off: 'つけない' },
  ],
  state: (v) => {
    const sun = v.sun === true;
    const foil = v.foil === true;
    const test = v.test === true;
    const color = (starch: boolean) => (!test ? 'まだ調べていない' : starch ? '青むらさき色 (でんぷんがある)' : '変わらない (でんぷんがない)');
    return {
      classes: { dark: !sun, foil, tested: test },
      readouts: [
        { label: '日光が当たったところ', value: color(sun) },
        ...(foil ? [{ label: 'おおったところ', value: color(false) }] : []),
      ],
    };
  },
  points: ['日光が当たった葉では、でんぷんができる', 'でんぷんがあると、ヨウ素液が青むらさき色になる', '植物は、日光を受けて自分で養分をつくる (光合成)'],
  quiz: [
    {
      q: 'でんぷんがあるかどうかを調べるときに使う液はどれですか。',
      a: 'ヨウ素液',
      wrong: ['石灰水', 'BTB液', '食塩水'],
      ex: 'でんぷんがあると、ヨウ素液は青むらさき色に変わります。',
    },
    {
      q: '葉の一部をアルミはくでおおって日光に当て、ヨウ素液で調べました。色が変わらないのはどこですか。',
      a: 'アルミはくでおおったところ',
      wrong: ['日光が当たったところ', '葉全体', '葉のふちだけ'],
      ex: 'アルミはくでおおったところには日光が当たらないので、でんぷんができず、ヨウ素液の色は変わりません。',
    },
    {
      q: '植物が日光を受けて、葉で養分をつくるはたらきを何といいますか。',
      a: '光合成',
      wrong: ['蒸散', '呼吸', '消化'],
      ex: '植物が日光を受けて、葉ででんぷんなどの養分をつくるはたらきを光合成といいます。',
    },
  ],
};

/** 発芽の条件。水・空気・ちょうどよい温度の 3 つがそろうと発芽する */
export function germinates(c: { water: boolean; air: boolean; warm: boolean }): boolean {
  return c.water && c.air && c.warm;
}

const germination: Guide = {
  id: 'germination',
  field: '植物',
  grades: [5],
  name: '発芽の条件',
  lead: '水・空気・温度・日光・肥料のどれが、たねの発芽に必要かを調べよう。',
  plan: germinationPlan,
  steps: [
    {
      title: '発芽の条件を調べる',
      text: 'インゲンマメのたねを、だっし綿をしいたカップに置いて、発芽するかを調べます。調べたい条件だけを変え、ほかの条件は同じにしてくらべます。',
      parts: ['seed'],
      flows: [],
      values: { water: true, air: true, warm: true, light: true, fert: false },
    },
    {
      title: '水は必要',
      text: 'だっし綿を水でしめらせたものは発芽し、かわいたままのものは発芽しません。発芽には水が必要です。切りかえでたしかめよう。',
      parts: ['water', 'seed'],
      flows: [],
      values: { water: false, air: true, warm: true },
    },
    {
      title: '空気も必要',
      text: 'たねを水の中にしずめてしまうと、発芽しません。たねが空気にふれていないからです。発芽には空気も必要です。',
      parts: ['seed', 'water'],
      flows: [],
      values: { water: true, air: false, warm: true },
    },
    {
      title: 'ちょうどよい温度',
      text: '冷ぞう庫の中（約5℃）に入れたものは発芽しません。発芽には、ちょうどよい温度が必要です。\n冷ぞう庫の中は暗いので、くらべるもう一方には、箱をかぶせて暗くしておきます。',
      parts: ['temp'],
      flows: [],
      values: { water: true, air: true, warm: false, light: false },
    },
    {
      title: '日光や肥料はなくてもよい',
      text: '箱をかぶせて暗くしても、肥料がなくても、水・空気・ちょうどよい温度がそろえば発芽します。たねの中（子葉）に養分がたくわえられているからです。\nただし、発芽したあとに大きく成長するには、日光と肥料が必要です。',
      parts: ['light', 'fert', 'seed'],
      flows: [],
      values: { water: true, air: true, warm: true, light: false, fert: false },
    },
  ],
  controls: [
    { kind: 'toggle', key: 'water', label: '水', value: true, on: 'あたえる', off: 'あたえない' },
    { kind: 'toggle', key: 'air', label: '空気', value: true, on: 'ふれている', off: '水にしずめる' },
    { kind: 'toggle', key: 'warm', label: '温度', value: true, on: '20℃くらい', off: '冷ぞう庫 (5℃)' },
    { kind: 'toggle', key: 'light', label: '日光', value: true, on: '当てる', off: '箱で暗くする' },
    { kind: 'toggle', key: 'fert', label: '肥料', value: false, on: 'あたえる', off: 'あたえない' },
  ],
  state: (v) => {
    const air = v.air === true;
    // 水にしずめるときは、水はある
    const water = v.water === true || !air;
    const warm = v.warm === true;
    const ok = germinates({ water, air, warm });
    const missing = [!water && '水', !air && '空気', !warm && 'ちょうどよい温度'].filter(Boolean);
    return {
      classes: { 'no-water': !water, 'no-air': !air, cold: !warm, dark: v.light !== true, fert: v.fert === true, sprout: ok },
      readouts: [
        { label: '発芽', value: ok ? '発芽する' : '発芽しない' },
        { label: '足りない条件', value: missing.length ? missing.join('・') : 'なし' },
      ],
    };
  },
  points: ['発芽には、水・空気・ちょうどよい温度が必要', '日光や肥料はなくても発芽する (子葉の養分を使う)', '調べたい条件だけを変えて、ほかの条件は同じにする'],
  quiz: [
    {
      q: 'インゲンマメのたねの発芽に必要な条件の組み合わせはどれですか。',
      a: '水・空気・ちょうどよい温度',
      wrong: ['水・日光・肥料', '空気・日光・土', '水・肥料・ちょうどよい温度'],
      ex: '発芽には、水・空気・ちょうどよい温度の3つが必要です。日光や肥料はなくても発芽します。',
    },
    {
      q: 'たねを水の中にしずめておくと、発芽しないのはなぜですか。',
      a: '空気にふれていないから',
      wrong: ['水が多すぎて、たねがとけるから', '日光が当たらないから', '肥料がないから'],
      ex: '発芽には空気が必要です。水の中にしずめると、たねが空気にふれないので発芽しません。',
    },
    {
      q: '日光や肥料がなくても、たねが発芽できるのはなぜですか。',
      a: 'たねの中に養分がたくわえられているから',
      wrong: ['水だけで養分をつくれるから', '空気から養分をとり入れるから', '土から養分をすうから'],
      ex: 'インゲンマメのたねは、子葉に養分（でんぷん）をたくわえていて、それを使って発芽します。',
    },
  ],
};

export const PLANT_GUIDES: readonly Guide[] = [waterpath, photosynthesis, germination];
