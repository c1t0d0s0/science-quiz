import { shuffle } from '../core/rng';
import { moonFig, moonOrbitFig, moonRow, northSkyFig, orionFig, PHASE_NAME, shadowFig, type Phase } from '../diagrams/sky';
import { choice, facts, fixed, forGrades, int, KANA, numeric, oneOf, pick, type Entry, type Gen } from './helpers';

const DIRS = ['東', '西', '南', '北'] as const;

// ---------- 3・4 年むけ (どの学年に出すかは、ファイルの最後の一覧で決める) ----------

const lowerShadow: Gen = {
  id: 'space-l-shadow',
  make: (rng) => {
    // 太陽は東 → 南 → 西と動き、かげはその反対がわにできる
    const cases = [
      { when: '朝（日がのぼってすぐ）', sun: '東', shadow: '西' },
      { when: '正午ごろ', sun: '南', shadow: '北' },
      { when: '夕方（日がしずむ前）', sun: '西', shadow: '東' },
    ];
    const c = pick(rng, cases);
    return pick(rng, [
      () =>
        fixed({
          text: `図は、晴れた日に地面に立てた棒とそのかげを、真上から見たものです。このとき、太陽はどの方位にありますか。`,
          svg: shadowFig(c.shadow),
          choices: DIRS,
          correct: c.sun,
          explanation: `かげは、太陽の反対がわにできます。かげが${c.shadow}にのびているので、太陽は${c.sun}にあります。これは${c.when}のようすです。`,
        }),
      () =>
        fixed({
          text: `晴れた日の${c.when}に、地面に棒を立てました。棒のかげは、どの方位にのびますか。`,
          choices: DIRS,
          correct: c.shadow,
          explanation: `${c.when}の太陽は${c.sun}の空にあります。かげは太陽の反対がわにできるので、${c.shadow}にのびます。`,
        }),
    ])();
  },
};

const lowerSun = facts('space-l-sun', [
  {
    q: '晴れた日に、地面に立てた棒のかげの長さを朝から夕方まで調べました。かげがいちばん短くなるのはいつごろですか。',
    a: '正午ごろ',
    wrong: ['午前8時ごろ', '午後3時ごろ', '夕方5時ごろ'],
    ex: '正午ごろ、太陽は南の空のいちばん高いところにきます（南中）。太陽が高いほど、かげは短くなります。',
  },
  {
    q: '太陽は、1日のうちにどのように動いて見えますか。',
    a: '東からのぼり、南の空を通って、西にしずむ',
    wrong: ['西からのぼり、南の空を通って、東にしずむ', '東からのぼり、北の空を通って、西にしずむ', '南からのぼり、東の空を通って、北にしずむ'],
    ex: '太陽は東からのぼり、南の空の高いところを通って、西にしずみます。かげは、太陽と反対に西 → 北 → 東へと動きます。',
  },
  {
    q: '時間がたつと、かげの向きが変わるのはなぜですか。',
    a: '太陽の位置が変わるから',
    wrong: ['地面の温度が変わるから', '風の向きが変わるから', '棒の長さが変わるから'],
    ex: 'かげは太陽の反対がわにできます。太陽の位置が東 → 南 → 西と変わるので、かげの向きも変わります。',
  },
  {
    q: '晴れた日の午前10時と正午に、日なたの地面の温度をはかりました。温度が高いのはどちらですか。',
    a: '正午',
    wrong: ['午前10時', 'どちらも同じ', '日によって決まっていない'],
    ex: '地面は日光であたためられます。日光が当たる時間が長くなるほど地面はあたたまるので、午前10時より正午の方が温度が高くなります。',
  },
  {
    q: '日なたの地面と日かげの地面をくらべたとき、日なたの地面のようすとして正しいものはどれですか。',
    a: 'あたたかく、かわいている',
    wrong: ['つめたく、しめっている', 'あたたかく、しめっている', 'つめたく、かわいている'],
    ex: '日なたの地面は日光であたためられるので、あたたかく、かわいています。日かげの地面は、つめたく、しめっています。',
  },
]);

const lowerMoon: Gen = {
  id: 'space-l-moon',
  make: (rng) =>
    pick(rng, [
      () => {
        const phases: Phase[] = shuffle<Phase>(['crescent', 'first', 'full', 'last'], rng);
        const target = pick(rng, phases);
        return fixed({
          text: `図のア〜エの月のうち、「${PHASE_NAME[target]}」はどれですか。`,
          svg: moonRow(phases, KANA.slice(0, 4)),
          choices: KANA.slice(0, 4),
          correct: KANA[phases.indexOf(target)],
          explanation: `答えは ${KANA[phases.indexOf(target)]} です。右がわが細く光るのが三日月、右半分が光るのが上弦の月、全体が丸く光るのが満月、左半分が光るのが下弦の月です。`,
        });
      },
      () =>
        choice(rng, {
          text: '月は、1日のうちにどのように動いて見えますか。',
          correct: '東からのぼり、南の空を通って、西にしずむ',
          wrong: ['西からのぼり、南の空を通って、東にしずむ', '東からのぼり、北の空を通って、西にしずむ', 'いつも同じ場所に見える'],
          explanation: '月も太陽と同じように、東からのぼり、南の空を通って、西にしずみます。',
        }),
      () =>
        choice(rng, {
          text: '夕方、太陽がしずむころに東の空からのぼってくる月は、どんな形をしていますか。',
          correct: '満月',
          wrong: ['三日月', '上弦の月（右半分が光る半月）', '下弦の月（左半分が光る半月）'],
          explanation: '満月は、太陽がしずむころに東からのぼり、真夜中に南の空にきて、明け方に西にしずみます。',
        }),
      () =>
        choice(rng, {
          text: '月がかがやいて見えるのはなぜですか。',
          correct: '太陽の光をはね返しているから',
          wrong: ['月が自分で光を出しているから', '地球の光をはね返しているから', '星の光が集まっているから'],
          explanation: '月は自分では光を出していません。太陽の光が当たっている部分が、明るく見えています。',
        }),
    ])(),
};

const SUMMER = ['ベガ', 'デネブ', 'アルタイル'];
const WINTER = ['ベテルギウス', 'シリウス', 'プロキオン'];
const STAR_HOME: Record<string, string> = {
  ベガ: 'こと座',
  デネブ: 'はくちょう座',
  アルタイル: 'わし座',
  ベテルギウス: 'オリオン座',
  シリウス: 'おおいぬ座',
  プロキオン: 'こいぬ座',
  アンタレス: 'さそり座',
  リゲル: 'オリオン座',
};

const lowerTriangle: Gen = {
  id: 'space-l-triangle',
  make: (rng) =>
    pick(rng, [
      () =>
        oneOf(rng, {
          text: '次の星のうち、「夏の大三角」をつくっている星はどれですか。',
          yes: SUMMER,
          no: [...WINTER, 'アンタレス', 'リゲル', '北極星'],
          explanation: '夏の大三角は、こと座のベガ、はくちょう座のデネブ、わし座のアルタイルの3つの星を結んだ形です。',
        }),
      () =>
        oneOf(rng, {
          text: '次の星のうち、「冬の大三角」をつくっている星はどれですか。',
          yes: WINTER,
          no: [...SUMMER, 'アンタレス', 'リゲル', '北極星'],
          explanation: '冬の大三角は、オリオン座のベテルギウス、おおいぬ座のシリウス、こいぬ座のプロキオンの3つの星を結んだ形です。',
        }),
      () => {
        const star = pick(rng, ['ベガ', 'デネブ', 'アルタイル', 'シリウス', 'プロキオン', 'アンタレス']);
        return choice(rng, {
          text: `「${star}」は、何という星座の星ですか。`,
          correct: STAR_HOME[star],
          wrong: Object.values(STAR_HOME).filter((home) => home !== STAR_HOME[star]),
          explanation: `${star}は${STAR_HOME[star]}の星です。夏の大三角は、ベガ（こと座）・デネブ（はくちょう座）・アルタイル（わし座）、冬の大三角は、ベテルギウス（オリオン座）・シリウス（おおいぬ座）・プロキオン（こいぬ座）です。`,
        });
      },
    ])(),
};

const lowerOrion: Gen = {
  id: 'space-l-orion',
  make: (rng) => {
    const letters = shuffle(KANA.slice(0, 4), rng);
    const labels = { betelgeuse: letters[0], bellatrix: letters[1], rigel: letters[2], saiph: letters[3] };
    const star = pick(rng, [
      { key: 'betelgeuse', name: 'ベテルギウス', color: '赤い', where: '左上' },
      { key: 'rigel', name: 'リゲル', color: '青白い', where: '右下' },
    ] as const);
    return fixed({
      text: `図は、冬の夜に南の空に見えるオリオン座です。${star.color}色の1等星「${star.name}」は、ア〜エのどれですか。`,
      svg: orionFig(labels),
      choices: KANA.slice(0, 4),
      correct: labels[star.key],
      explanation: `答えは ${labels[star.key]} です。オリオン座が南の空にあるとき、左上に赤いベテルギウス、右下に青白いリゲルが見えます。まん中には3つの星（三つ星）がならんでいます。`,
    });
  },
};

const RED_STARS = ['アンタレス', 'ベテルギウス'];
const WHITE_STARS = ['リゲル', 'シリウス', 'スピカ', 'ベガ', 'デネブ', 'アルタイル'];

const lowerColor: Gen = {
  id: 'space-l-color',
  make: (rng) =>
    pick(rng, [
      () =>
        oneOf(rng, {
          text: '次の星のうち、赤っぽい色に見える星はどれですか。',
          yes: RED_STARS,
          no: WHITE_STARS,
          explanation: 'さそり座のアンタレスと、オリオン座のベテルギウスは、赤っぽく見える1等星です。星の色のちがいは、星の表面の温度のちがいによるものです。',
        }),
      () =>
        choice(rng, {
          text: '星の明るさは「等星」で表します。次のうち、いちばん明るい星はどれですか。',
          correct: '1等星',
          wrong: ['2等星', '3等星', '6等星'],
          explanation: '星は明るい順に1等星、2等星、3等星…と分けられています。数字が小さいほど明るい星です。',
        }),
      () =>
        choice(rng, {
          text: '夏の夜、南の空の低いところに見える、赤い星アンタレスをふくむ星座はどれですか。',
          correct: 'さそり座',
          wrong: ['オリオン座', 'こと座', 'はくちょう座', 'おおいぬ座'],
          explanation: 'さそり座は夏の南の空の低いところに見える、S字の形をした星座です。赤い1等星アンタレスがあります。',
        }),
    ])(),
};

const lowerStars = facts('space-l-stars', [
  {
    q: '時間がたつと、星座の位置と星のならび方はどうなりますか。',
    a: '位置は変わるが、ならび方は変わらない',
    wrong: ['位置もならび方も変わる', '位置は変わらないが、ならび方は変わる', '位置もならび方も変わらない'],
    ex: '星は時間がたつと見える位置が変わりますが、星どうしのならび方は変わりません。だから、星座の形はいつも同じです。',
  },
  {
    q: '北の空で、時間がたってもほとんど位置が変わらない星はどれですか。',
    a: '北極星',
    wrong: ['シリウス', 'ベガ', 'アンタレス', 'ベテルギウス'],
    ex: '北極星は、ほぼ真北にあって、時間がたってもほとんど動きません。北の空の星は、北極星を中心に回っているように見えます。',
  },
  {
    q: 'ひしゃくの形にならんだ7つの星「北斗七星」は、何という星座の一部ですか。',
    a: 'おおぐま座',
    wrong: ['こぐま座', 'カシオペヤ座', 'オリオン座', 'はくちょう座'],
    ex: '北斗七星は、おおぐま座のこしからしっぽにあたる部分です。北極星は、こぐま座の星です。',
  },
  {
    q: '北の空に見える、アルファベットの「W」の形にならんだ星座はどれですか。',
    a: 'カシオペヤ座',
    wrong: ['おおぐま座', 'こぐま座', 'さそり座', 'こと座'],
    ex: 'カシオペヤ座は、5つの星がWの形にならんだ星座です。北斗七星とともに、北極星を見つける手がかりになります。',
  },
  {
    q: '星座早見を使って南の空の星を調べるとき、星座早見の「南」の文字はどちらに向けて持ちますか。',
    a: '下にして持つ',
    wrong: ['上にして持つ', '右にして持つ', '左にして持つ'],
    ex: '星座早見は、調べたい方位の文字を下にして持ち、頭の上にかざして使います。',
  },
]);

// ---------- 5・6 年むけ ----------

const upperAltitude: Gen = {
  id: 'space-u-altitude',
  make: (rng) => {
    const lat = pick(rng, [33, 34, 35, 36, 38, 40, 43]);
    const base = 90 - lat;
    const season = pick(rng, [
      { name: '春分の日', value: base, how: `90 − ${lat} ＝ ${base}` },
      { name: '秋分の日', value: base, how: `90 − ${lat} ＝ ${base}` },
      { name: '夏至の日', value: base + 23.4, how: `90 − ${lat} ＋ 23.4 ＝ ${Math.round((base + 23.4) * 10) / 10}` },
      { name: '冬至の日', value: base - 23.4, how: `90 − ${lat} − 23.4 ＝ ${Math.round((base - 23.4) * 10) / 10}` },
    ]);
    return numeric(rng, {
      text: `北緯${lat}度の地点で、${season.name}の太陽の南中高度は何度ですか。ただし、地球の地じくは、公転面に垂直な方向から23.4度かたむいているものとします。`,
      correct: season.value,
      wrong: [base, base + 23.4, base - 23.4, lat + 23.4, lat].filter((v) => v !== season.value),
      unit: '度',
      explanation: `南中高度は、春分・秋分の日は「90 − 緯度」、夏至の日は「90 − 緯度 ＋ 23.4」、冬至の日は「90 − 緯度 − 23.4」で求められます。${season.how}（度）です。`,
    });
  },
};

const upperDaily: Gen = {
  id: 'space-u-daily',
  make: (rng) =>
    pick(rng, [
      () => {
        const hours = pick(rng, [2, 4]);
        const start = pick(rng, [20, 40, 70, 110, 140, 160]);
        const turns = shuffle([30, 60, -30, -60], rng);
        const marks = turns.map((turn, i) => ({ turn, label: KANA[i] }));
        const from = pick(rng, [7, 8, 9]);
        return fixed({
          text: `図は、北の空の星の動きを表しています。午後${from}時に A の位置に見えた星は、午後${from + hours}時にはア〜エのどの位置に見えますか。図の点は、北極星を中心に30度ずつはなれています。`,
          svg: northSkyFig(start, marks),
          choices: KANA.slice(0, 4),
          correct: KANA[turns.indexOf(hours * 15)],
          explanation: `北の空の星は、北極星を中心に、1時間に15度ずつ反時計回りに動いて見えます。${hours}時間では 15 × ${hours} ＝ ${hours * 15}度 動くので、答えは ${KANA[turns.indexOf(hours * 15)]} です。`,
        });
      },
      () => {
        const hours = int(rng, 2, 5);
        return numeric(rng, {
          text: `ある星が南の空に見えました。この星は、${hours}時間後には、はじめの位置から何度動いて見えますか。`,
          correct: hours * 15,
          wrong: [hours * 30, hours * 10, hours * 15 + 15, hours * 15 - 15, hours * 24],
          unit: '度',
          explanation: `地球は1日（24時間）に1回転（360度）するので、星は1時間に 360 ÷ 24 ＝ 15度ずつ動いて見えます。15 × ${hours} ＝ ${hours * 15}（度）です。`,
        });
      },
      () =>
        choice(rng, {
          text: '星が1日のうちに東から西へ動いて見えるのはなぜですか。',
          correct: '地球が西から東へ自転しているから',
          wrong: ['地球が東から西へ自転しているから', '地球が太陽のまわりを公転しているから', '星が地球のまわりを回っているから'],
          explanation: '地球は西から東へ1日に1回、自転しています。そのため、太陽や星は東から西へ動いて見えます（日周運動）。',
        }),
    ])(),
};

const clock = (h: number) => {
  const hour = ((h % 24) + 24) % 24;
  if (hour === 0) return '午前0時（真夜中）';
  if (hour === 12) return '正午';
  return hour < 12 ? `午前${hour}時` : `午後${hour - 12}時`;
};

const upperYearly: Gen = {
  id: 'space-u-yearly',
  make: (rng) => {
    const months = int(rng, 1, 2);
    const start = pick(rng, [22, 23, 24, 25, 26]);
    const answer = start - months * 2;
    return choice(rng, {
      text: `ある日の${clock(start)}に、オリオン座が真南に見えました（南中しました）。${months}か月後、オリオン座が南中するのは何時ごろですか。`,
      correct: clock(answer),
      wrong: [clock(answer + 1), clock(answer - 1), clock(start + months * 2), clock(answer - 2), clock(start)],
      explanation: `地球が太陽のまわりを公転しているので、同じ星が同じ位置に見える時刻は、1か月に約2時間ずつ早くなります。${months}か月では 2 × ${months} ＝ ${months * 2}時間 早くなるので、${clock(answer)}ごろです。`,
    });
  },
};

const MOON_TIMES: { phase: Phase; rise: number; south: number; set: number }[] = [
  { phase: 'first', rise: 12, south: 18, set: 0 },
  { phase: 'full', rise: 18, south: 0, set: 6 },
  { phase: 'last', rise: 0, south: 6, set: 12 },
];

const upperMoonTime: Gen = {
  id: 'space-u-moontime',
  make: (rng) => {
    const m = pick(rng, MOON_TIMES);
    const ask = pick(rng, [
      { what: '南中する', hour: m.south },
      { what: '東の地平線からのぼる', hour: m.rise },
      { what: '西の地平線にしずむ', hour: m.set },
    ]);
    return fixed({
      text: `図のような月（${PHASE_NAME[m.phase]}）が${ask.what}のは、何時ごろですか。`,
      svg: moonFig(m.phase),
      choices: [clock(0), clock(6), clock(12), clock(18)],
      correct: clock(ask.hour),
      explanation: `${PHASE_NAME[m.phase]}は、${clock(m.rise)}ごろに東からのぼり、${clock(m.south)}ごろに南中して、${clock(m.set)}ごろに西にしずみます。上弦の月は夕方、満月は真夜中、下弦の月は明け方に南中します。`,
    });
  },
};

const upperOrbit: Gen = {
  id: 'space-u-orbit',
  make: (rng) => {
    const sunRight = rng() < 0.5;
    const order = ['新月', '上弦の月', '満月', '下弦の月'];
    const letters = shuffle(KANA.slice(0, 4), rng);
    const target = int(rng, 0, 3);
    return fixed({
      text: `図は、地球の北極の上から見た、太陽の光と、地球のまわりを回る月の位置を表しています。地球から見て「${order[target]}」に見えるのは、月がア〜エのどの位置にあるときですか。`,
      svg: moonOrbitFig(sunRight, letters),
      choices: KANA.slice(0, 4),
      correct: letters[target],
      explanation: `答えは ${letters[target]} です。月が太陽と同じ方向にあるときが新月、太陽と反対がわにあるときが満月です。月は反時計回りに回るので、新月から4分の1回った位置が上弦の月、満月からさらに4分の1回った位置が下弦の月です。`,
    });
  },
};

const hm = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 12 && m === 0) return '正午';
  return `${h < 12 ? '午前' : '午後'}${h < 12 ? h : h - 12}時${m === 0 ? '' : `${m}分`}`;
};

const upperNoon: Gen = {
  id: 'space-u-noon',
  make: (rng) =>
    pick(rng, [
      () => {
        const noon = pick(rng, [11 * 60 + 40, 11 * 60 + 50, 12 * 60, 12 * 60 + 10]);
        const half = pick(rng, [290, 310, 330, 370, 410, 430]);
        return numeric(rng, {
          text: `ある日、ある地点の日の出の時刻は${hm(noon - half)}、日の入りの時刻は${hm(noon + half)}でした。この日、この地点で太陽が南中した時刻は何時何分ですか。`,
          correct: noon,
          wrong: [noon + 10, noon - 10, noon + 20, noon - 20, noon + 30],
          unit: '',
          show: hm,
          explanation: `太陽が南中する時刻は、日の出と日の入りのちょうどまん中です。昼の長さは ${Math.floor(half / 30)}時間${(half * 2) % 60 === 0 ? '' : `${(half * 2) % 60}分`}なので、その半分の ${Math.floor(half / 60)}時間${half % 60}分を日の出の時刻に足して、${hm(noon)}です。`,
        });
      },
      () => {
        const lon = pick(rng, [130, 131, 137, 138, 140, 141, 143]);
        const noon = 12 * 60 - (lon - 135) * 4;
        return numeric(rng, {
          text: `東経135度の兵庫県明石市で、太陽が正午（午後0時）に南中した日がありました。同じ日、東経${lon}度の地点で太陽が南中するのは何時何分ですか。`,
          correct: noon,
          wrong: [12 * 60 + (lon - 135) * 4, noon + 4, noon - 4, 12 * 60 - (lon - 135), 12 * 60 + (lon - 135)],
          unit: '',
          show: hm,
          explanation: `地球は24時間で360度回るので、経度1度あたり 24 × 60 ÷ 360 ＝ 4分 のずれになります。東にある地点ほど早く南中します。経度の差は${Math.abs(lon - 135)}度なので、4 × ${Math.abs(lon - 135)} ＝ ${Math.abs(lon - 135) * 4}分 ${lon > 135 ? '早い' : 'おそい'}、${hm(noon)}です。`,
        });
      },
    ])(),
};

const upperSeasons = facts('space-u-seasons', [
  {
    q: '日本で、夏至の日の太陽は、どの方位からのぼりますか。',
    a: '真東より北よりの方位',
    wrong: ['真東', '真東より南よりの方位', '真北'],
    ex: '夏至の日の太陽は、真東より北よりからのぼり、真西より北よりにしずみます。冬至の日は、真東より南よりからのぼります。',
  },
  {
    q: '日本で、1年のうち昼の長さがいちばん短い日はどれですか。',
    a: '冬至の日',
    wrong: ['夏至の日', '春分の日', '秋分の日'],
    ex: '冬至の日（12月22日ごろ）は、太陽の南中高度がいちばん低く、昼の長さがいちばん短くなります。',
  },
  {
    q: '太陽が真東からのぼり、真西にしずむ日はどれですか。',
    a: '春分の日と秋分の日',
    wrong: ['夏至の日と冬至の日', '夏至の日だけ', '毎日'],
    ex: '春分の日と秋分の日は、太陽が真東からのぼって真西にしずみ、昼と夜の長さがほぼ同じになります。',
  },
  {
    q: '季節によって、太陽の南中高度や昼の長さが変わるのはなぜですか。',
    a: '地球が地じくをかたむけたまま、太陽のまわりを公転しているから',
    wrong: ['地球と太陽のきょりが、季節によって大きく変わるから', '地球が自転する速さが、季節によって変わるから', '太陽の出す光の強さが、季節によって変わるから'],
    ex: '地球は、地じくを公転面に垂直な方向から約23.4度かたむけたまま公転しています。そのため、季節によって太陽の光の当たり方が変わります。',
  },
  {
    q: '1日のうちで、気温がいちばん高くなるのは、ふつう何時ごろですか。',
    a: '午後2時ごろ',
    wrong: ['正午ごろ', '午前10時ごろ', '午後5時ごろ'],
    ex: '太陽の高さは正午ごろにいちばん高くなりますが、太陽が地面をあたため、地面が空気をあたためるのに時間がかかるので、気温は午後2時ごろにいちばん高くなります。',
  },
]);

const upperPlanets = facts('space-u-planets', [
  {
    q: '「よいの明星」とよばれる金星は、いつ、どの方位の空に見えますか。',
    a: '夕方、西の空',
    wrong: ['夕方、東の空', '明け方、東の空', '真夜中、南の空'],
    ex: '金星は地球より内がわを回っているので、夕方の西の空（よいの明星）か、明け方の東の空（明けの明星）にしか見えません。真夜中には見えません。',
  },
  {
    q: '「明けの明星」とよばれる金星は、いつ、どの方位の空に見えますか。',
    a: '明け方、東の空',
    wrong: ['明け方、西の空', '夕方、西の空', '真夜中、南の空'],
    ex: '金星は、明け方の東の空（明けの明星）か、夕方の西の空（よいの明星）に見えます。真夜中には見えません。',
  },
  {
    q: '日食が起こるとき、太陽・月・地球はどのような順にならんでいますか。',
    a: '太陽 － 月 － 地球',
    wrong: ['太陽 － 地球 － 月', '月 － 太陽 － 地球', '地球 － 太陽 － 月'],
    ex: '日食は、月が太陽をかくす現象で、太陽 － 月 － 地球の順に一直線にならぶ新月のときに起こります。',
  },
  {
    q: '月食が起こるのは、月がどの形のときですか。',
    a: '満月',
    wrong: ['新月', '上弦の月', '下弦の月', '三日月'],
    ex: '月食は、月が地球のかげに入る現象で、太陽 － 地球 － 月の順に一直線にならぶ満月のときに起こります。',
  },
  {
    q: '1等星の明るさは、6等星の明るさの何倍ですか。',
    a: '100倍',
    wrong: ['5倍', '6倍', '10倍', '1000倍'],
    ex: '1等星は6等星の100倍の明るさです。等級が1つちがうと、明るさは約2.5倍ちがいます。',
  },
  {
    q: '星の色は表面の温度によってちがいます。次のうち、表面の温度がいちばん高い星の色はどれですか。',
    a: '青白色',
    wrong: ['赤色', 'オレンジ色', '黄色'],
    ex: '星の表面の温度は、青白色 → 白色 → 黄色 → オレンジ色 → 赤色の順に低くなります。リゲルやスピカは青白く、アンタレスやベテルギウスは赤い星です。',
  },
  {
    q: '月の満ち欠けは、およそ何日でもとの形にもどりますか。',
    a: '約29.5日',
    wrong: ['約7日', '約15日', '約27.3日', '約365日'],
    ex: '新月から次の新月までは約29.5日です。月が地球のまわりを1回公転するのは約27.3日ですが、その間に地球も公転しているので、満ち欠けの周期は少し長くなります。',
  },
]);

/** ジェネレーターと、それを出す学年 */
export const SPACE: Entry[] = [
  forGrades(lowerShadow, 3),
  forGrades(lowerSun, 3),
  forGrades(lowerMoon, 3, 4),
  forGrades(lowerTriangle, 4),
  forGrades(lowerOrion, 4),
  forGrades(lowerColor, 4),
  forGrades(lowerStars, 4),
  forGrades(upperDaily, 5),
  forGrades(upperSeasons, 5),
  forGrades(upperYearly, 5, 6),
  forGrades(upperNoon, 5, 6),
  forGrades(upperAltitude, 6),
  forGrades(upperMoonTime, 6),
  forGrades(upperOrbit, 6),
  forGrades(upperPlanets, 6),
];
