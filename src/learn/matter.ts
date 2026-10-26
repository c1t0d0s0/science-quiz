import { burningPlan, heatingPlan, waterPlan } from './figs/matter';
import { clamp, round1, type Guide } from './types';

// 熱・物質: もののあたたまり方 (4 年)・水のすがた (4 年)・ものの燃え方 (6 年)

const heating: Guide = {
  id: 'heating',
  field: '熱・物質',
  grades: [4],
  ruby: true,
  name: 'もののあたたまり方',
  lead: '金属・水・空気が、どのようにあたたまっていくかをくらべよう。',
  plan: heatingPlan,
  steps: [
    {
      title: '金属のあたたまり方',
      text: '金属の板の一部を熱すると、熱したところから近い順に、だんだんまわりへあたたまっていきます。\n図では、あたたかいところほど赤く表しています。下のつまみで、熱する時間を進めてみよう。',
      parts: ['metal'],
      flows: ['heat'],
    },
    {
      title: '熱する場所を変えても',
      text: '板のまん中を熱しても、はしを熱しても、熱したところから近い順にあたたまります。金属では、熱は上にも下にも横にも伝わります。',
      parts: ['metal'],
      flows: ['heat'],
    },
    {
      title: '水のあたたまり方',
      text: '水を下から熱すると、あたためられた水が上へ動き、上にあった冷たい水が下へ動きます。この動きをくり返して、水は上の方から順にあたたまっていきます。',
      parts: ['water'],
      flows: ['convection'],
    },
    {
      title: '空気のあたたまり方',
      text: '空気も水と同じように、あたためられた空気が上へ動いて、上の方から順にあたたまります。\nストーブをつけた部屋では、天じょうの近くの方が、ゆかの近くよりあたたかくなります。',
      parts: ['air'],
      flows: ['convection'],
    },
    {
      title: 'くらべてみよう',
      text: '金属は「熱したところから順に」、水と空気は「あたためられたものが動いて、上から順に」あたたまります。時間を進めて、3つのちがいをたしかめよう。',
      parts: ['metal', 'water', 'air'],
      flows: ['heat', 'convection'],
    },
  ],
  controls: [
    { kind: 'range', key: 't', label: '熱した時間', min: 0, max: 4, step: 1, value: 2, show: (v) => `${v}分` },
    { kind: 'select', key: 'place', label: '板の熱する場所', value: 'edge', options: [{ value: 'edge', label: 'はし' }, { value: 'mid', label: 'まん中' }] },
  ],
  state: (v) => {
    const t = Number(v.t) / 4;
    return {
      vars: { '--t': String(t) },
      classes: { 'heat-mid': v.place === 'mid' },
      speed: t === 0 ? 0 : 0.5,
      readouts: [
        { label: '金属の板', value: t === 0 ? 'まだあたたまっていない' : t < 1 ? '熱したところから近い順に、あたたまっている' : '全体があたたまった', meter: t },
        { label: '水と空気', value: t === 0 ? 'まだあたたまっていない' : t < 1 ? '上の方から順に、あたたまっている' : '全体があたたまった', meter: t },
      ],
    };
  },
  points: ['金属は、熱したところから近い順にあたたまる', '水や空気は、あたためられたものが上へ動き、上の方から順にあたたまる', 'あたたかい空気は上に、冷たい空気は下にたまりやすい'],
  quiz: [
    {
      q: '水を入れたビーカーの底を熱すると、水はどのようにあたたまりますか。',
      a: 'あたためられた水が上へ動き、上の方から順にあたたまる',
      wrong: ['熱したところに近い、下の方から順にあたたまる', '全体が同時にあたたまる', '横の方から順にあたたまる'],
      ex: 'あたためられた水は上へ動き、冷たい水が下へ動きます。このくり返しで、上の方から順にあたたまります。',
    },
    {
      q: '金属の板のまん中を熱しました。どのようにあたたまりますか。',
      a: '熱したところから近い順に、まわりへ広がるようにあたたまる',
      wrong: ['上の方から順にあたたまる', '板のはしから順にあたたまる', '全体が同時にあたたまる'],
      ex: '金属は、熱したところから近い順にあたたまります。熱は、上にも下にも横にも伝わります。',
    },
    {
      q: 'ストーブをつけた部屋で、いちばんあたたかいのはどこですか。',
      a: '天じょうの近く',
      wrong: ['ゆかの近く', 'かべの近く', 'どこも同じ'],
      ex: 'あたためられた空気は上へ動くので、部屋の上の方（天じょうの近く）があたたかくなります。',
    },
  ],
};

/** 温度 → 水のすがた */
export function waterState(t: number): { cls: string; name: string; note: string } {
  if (t < 0) return { cls: 'ice', name: '氷 (固体)', note: '水が氷になると、体積がふえる' };
  if (t === 0) return { cls: 'melt', name: '氷と水がまじっている', note: '全部がとけ終わるまで、温度は0℃のまま' };
  if (t < 100) return { cls: 'liquid', name: '水 (液体)', note: 'あたためると、体積が少しふえる' };
  if (t === 100) return { cls: 'boil', name: 'ふっとうしている', note: '中から水蒸気のあわが出る。全部が水蒸気になるまで、温度は100℃のまま' };
  return { cls: 'gas', name: '水蒸気 (気体)', note: '水蒸気は目に見えない。体積がとても大きくなる' };
}

/** 温度 → グラフの上の点 (加熱した時間の割合) */
function graphPoint(t: number): [number, number] {
  const k = t < 0 ? 0.12 * ((t + 20) / 20) : t === 0 ? 0.22 : t < 100 ? 0.32 + (t / 100) * 0.23 : t === 100 ? 0.715 : 0.88 + ((t - 100) / 20) * 0.12;
  return [250 + k * 170, 230 - ((t + 20) / 140) * 180];
}

const water: Guide = {
  id: 'water',
  field: '熱・物質',
  grades: [4],
  ruby: true,
  name: '水のすがたと温度',
  lead: '水を冷やしたり、あたためたりしたときのすがたの変わり方を見てみよう。',
  plan: waterPlan,
  steps: [
    {
      title: '水を冷やすと',
      text: '水を冷やしていくと、0℃でこおりはじめ、氷になります。氷になると、体積がふえます。\n下のつまみで温度を下げてみよう。',
      parts: ['beaker'],
      flows: [],
    },
    {
      title: 'とけている間は0℃',
      text: '氷をあたためると、0℃でとけはじめます。全部がとけて水になるまで、温度は0℃のまま変わりません。',
      parts: ['beaker', 'graph'],
      flows: [],
    },
    {
      title: '水をあたためると',
      text: '水をあたためると、温度が上がっていき、約100℃でふっとうします。ふっとうしているとき、水の中から出てくるあわは「水蒸気」です。',
      parts: ['beaker'],
      flows: [],
    },
    {
      title: 'ふっとうしている間は100℃',
      text: 'ふっとうしている間は、熱しつづけても温度は約100℃のまま変わりません。\n水蒸気は目に見えません。湯気が白く見えるのは、水蒸気が冷やされて、小さな水のつぶにもどったものです。',
      parts: ['beaker', 'graph'],
      flows: [],
    },
    {
      title: '3つのすがた',
      text: '水は、温度によって、氷（固体）・水（液体）・水蒸気（気体）とすがたを変えます。つまみで温度を変えて、グラフのどこにいるかをたしかめよう。',
      parts: ['graph'],
      flows: [],
    },
  ],
  controls: [{ kind: 'range', key: 'temp', label: '温度', min: -20, max: 120, step: 10, value: 20, show: (v) => `${v}℃` }],
  state: (v) => {
    const t = Number(v.temp);
    const s = waterState(t);
    const [mx, my] = graphPoint(t);
    return {
      vars: { '--mx': `${round1(mx)}px`, '--my': `${round1(my)}px` },
      classes: { [s.cls]: true },
      labels: { state: s.name },
      readouts: [
        { label: 'すがた', value: s.name },
        { label: 'ポイント', value: s.note },
      ],
    };
  },
  points: ['水は0℃で氷になり、約100℃でふっとうする', 'とけている間・ふっとうしている間は、温度が変わらない', '湯気は水のつぶ、水蒸気は目に見えない'],
  quiz: [
    {
      q: '水がふっとうしているとき、水の中から出てくるあわは何ですか。',
      a: '水蒸気',
      wrong: ['空気', '酸素', '湯気'],
      ex: 'ふっとうしているときのあわは、水が気体になった水蒸気です。',
    },
    {
      q: '氷をあたためつづけました。氷がとけている間、温度はどうなりますか。',
      a: '0℃のまま変わらない',
      wrong: ['どんどん上がる', 'どんどん下がる', '100℃になる'],
      ex: '氷がとけている間は、全部がとけ終わるまで、温度は0℃のままです。',
    },
    {
      q: '水を冷やして氷にすると、体積はどうなりますか。',
      a: 'ふえる',
      wrong: ['へる', '変わらない', 'なくなる'],
      ex: '水は氷になると、体積がふえます。冬に水道管がこおってはれつすることがあるのは、このためです。',
    },
  ],
};

/** ふたと下のすき間と時間 → ほのおの大きさ (0〜1) */
export function flameSize(lid: boolean, gap: boolean, sec: number): number {
  if (!lid && gap) return 1;
  if (!lid) return 0.8;
  // ふたをすると、中の酸素がへって、やがて消える (すき間があると少し長く燃える)
  const life = gap ? 20 : 10;
  return clamp(1 - sec / life);
}

const burning: Guide = {
  id: 'burning',
  field: '熱・物質',
  grades: [6],
  name: 'ものの燃え方と空気',
  lead: 'びんの中のろうそくが燃えつづけるには、何が必要かを調べよう。',
  plan: burningPlan,
  steps: [
    {
      title: 'びんの中でろうそくを燃やす',
      text: 'ねん土に立てたろうそくに火をつけ、底のないびんをかぶせます。びんの上と下のようすを変えて、燃え方をくらべます。',
      parts: ['jar', 'candle'],
      flows: [],
    },
    {
      title: '下にすき間があると',
      text: 'びんの下にすき間があり、上が開いていると、ろうそくはよく燃えつづけます。線こうのけむりを近づけると、けむりは下のすき間から入り、上から出ていきます。新しい空気が、つぎつぎに入れかわるからです。',
      parts: ['gap', 'jar'],
      flows: ['smoke-bottom'],
    },
    {
      title: 'ふたをすると',
      text: 'びんにふたをすると、空気が入れかわらないので、ろうそくの火はやがて消えます。下の切りかえで「ふた」をして、時間を進めてみよう。',
      parts: ['lid', 'candle'],
      flows: [],
    },
    {
      title: '燃えたあとの空気',
      text: 'ものが燃えると、空気の中の酸素の一部が使われて、二酸化炭素ができます。火が消えたあとのびんの中にも、酸素はまだ約17%残っています。\n二酸化炭素ができたことは、石灰水が白くにごることでたしかめられます。',
      parts: ['jar'],
      flows: [],
    },
    {
      title: 'いろいろためそう',
      text: 'ふたと下のすき間を切りかえて、ろうそくが燃えつづけるのはどんなときかをたしかめよう。',
      parts: ['lid', 'gap', 'candle'],
      flows: ['smoke-bottom', 'smoke-top'],
    },
  ],
  controls: [
    { kind: 'toggle', key: 'lid', label: 'びんのふた', value: false, on: 'する', off: 'しない' },
    { kind: 'toggle', key: 'gap', label: '下のすき間', value: true, on: 'あり', off: 'なし' },
    { kind: 'range', key: 'sec', label: '火をつけてからの時間', min: 0, max: 30, step: 5, value: 10, show: (v) => `${v}秒` },
  ],
  state: (v) => {
    const lid = v.lid === true;
    const gap = v.gap === true;
    const size = flameSize(lid, gap, Number(v.sec));
    // 燃えた分だけ、酸素がへって二酸化炭素がふえる (ふたがないときは入れかわる)
    const used = lid ? 1 - size : 0;
    return {
      vars: { '--flame': String(round1(0.15 + size * 0.85)) },
      classes: { lid, gap, out: size === 0 },
      readouts: [
        { label: 'ろうそくの火', value: size === 0 ? '消えた' : size >= 1 ? 'よく燃えている' : size >= 0.8 ? '燃えている' : '弱くなってきた', meter: size },
        { label: 'びんの中の酸素', value: `約${Math.round(21 - used * 4)}%` },
        { label: 'びんの中の二酸化炭素', value: used === 0 ? '約0.04%' : `約${round1(used * 3)}%` },
      ],
    };
  },
  points: ['ものが燃えつづけるには、新しい空気 (酸素) が入れかわることが必要', 'ものが燃えると、酸素の一部が使われ、二酸化炭素ができる', '二酸化炭素は、石灰水を白くにごらせる'],
  quiz: [
    {
      q: 'びんの中でろうそくをよく燃やしつづけるには、どうすればよいですか。',
      a: 'びんの下にすき間をつくり、上を開けておく',
      wrong: ['びんの上にふたをする', 'びんの下のすき間をふさぐ', 'びんを水でぬらす'],
      ex: '下にすき間があり上が開いていると、新しい空気が下から入り、上から出ていくので、よく燃えつづけます。',
    },
    {
      q: 'ろうそくが燃えたあとのびんの中の空気について、正しいものはどれですか。',
      a: '酸素がへり、二酸化炭素がふえている',
      wrong: ['酸素がふえ、二酸化炭素がへっている', '酸素がすべてなくなっている', 'ちっ素がすべてなくなっている'],
      ex: 'ものが燃えると、酸素の一部が使われて二酸化炭素ができます。酸素は、なくなるわけではなく、約17%残っています。',
    },
    {
      q: '二酸化炭素があることを調べるのに使うものはどれですか。',
      a: '石灰水',
      wrong: ['ヨウ素液', 'リトマス紙', '食塩水'],
      ex: '二酸化炭素は、石灰水を白くにごらせます。',
    },
  ],
};

export const MATTER_GUIDES: readonly Guide[] = [heating, water, burning];
