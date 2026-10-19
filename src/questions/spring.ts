import { buoyFig, springCombo, springFig } from '../diagrams/physics';
import { choice, facts, fmt, forGrades, int, numeric, oneOf, pick, type Entry, type Gen } from './helpers';

const FLOATS = ['木のつみ木', '発ぽうスチロール', 'ろうそく', '氷', 'コルクのせん', 'からのペットボトル'];
const SINKS = ['鉄のくぎ', '10円玉', 'ガラスのビー玉', '小石', 'ねん土のかたまり', 'アルミニウムはくをかたく丸めた玉'];

const lowerFloat: Gen = {
  id: 'spring-l-float',
  make: (rng) =>
    pick(rng, [
      () =>
        oneOf(rng, {
          text: '次のもののうち、水に入れるとうくものはどれですか。',
          yes: FLOATS,
          no: SINKS,
          explanation: '木・発ぽうスチロール・ろう・氷などは、同じ大きさの水より軽いので、水にうきます。鉄・ガラス・石などは、同じ大きさの水より重いので、しずみます。',
        }),
      () =>
        oneOf(rng, {
          text: '次のもののうち、水に入れるとしずむものはどれですか。',
          yes: SINKS,
          no: FLOATS,
          explanation: '鉄・銅・ガラス・石・ねん土などは、同じ大きさの水より重いので、水にしずみます。',
        }),
      () =>
        choice(rng, {
          text: 'かたまりのままでは水にしずむねん土を、水にうかせるには、どうすればよいですか。',
          correct: 'うすくのばして、おわんや船の形にする',
          wrong: ['小さくちぎって、丸める', '細長くのばして、ぼうの形にする', '強くにぎって、かたくする'],
          explanation: 'おわんや船の形にすると、たくさんの水をおしのけることができ、水から大きな上向きの力を受けてうきます。鉄でできた船がうくのも、同じしくみです。',
        }),
      () =>
        choice(rng, {
          text: 'ものが水にうくかしずむかは、何によって決まりますか。',
          correct: '同じ大きさ（体積）の水とくらべて、軽いか重いか',
          wrong: ['ものの大きさだけ', 'ものの色', 'ものの形だけ'],
          explanation: '同じ体積の水より軽いものは水にうき、重いものはしずみます。大きくても軽い木はうき、小さくても重い鉄のくぎはしずみます。',
        }),
    ])(),
};

const lowerRubber = facts('spring-l-rubber', [
  {
    q: 'わゴムを長くのばすほど、もとにもどろうとする力はどうなりますか。',
    a: '大きくなる',
    wrong: ['小さくなる', '変わらない', 'なくなる'],
    ex: 'ゴムは、のばされるともとにもどろうとします。長くのばすほど、その力は大きくなります。',
  },
  {
    q: 'ばねにおもりをつるしました。おもりを重いものにかえると、ばねののびはどうなりますか。',
    a: '大きくなる',
    wrong: ['小さくなる', '変わらない', 'ちぢむ'],
    ex: 'ばねは、つるすおもりが重いほど、よくのびます。ばねばかりは、この性質を利用して重さをはかります。',
  },
  {
    q: 'ばねにつるしたおもりをとりのぞくと、ばねはどうなりますか。',
    a: 'もとの長さにもどる',
    wrong: ['のびたままになる', 'さらにのびる', 'もとより短くなる'],
    ex: 'ばねやゴムには、力を加えると形が変わり、力をとりのぞくともとにもどる性質があります。',
  },
  {
    q: 'ものの重さをはかる道具のうち、ばねののびを利用しているものはどれですか。',
    a: 'ばねばかり',
    wrong: ['上皿てんびん', 'メスシリンダー', '温度計', '方位じしん'],
    ex: 'ばねばかりは、重いものほどばねが長くのびることを利用して、重さをはかります。上皿てんびんは、左右のつり合いを利用しています。',
  },
  {
    q: 'ばねばかりで重さをはかるとき、はじめにすることはどれですか。',
    a: '何もつるさないときに、目もりが0になっているかたしかめる',
    wrong: ['いちばん重いおもりをつるしておく', 'ばねを手で強くのばしておく', 'ばねばかりを横にねかせておく'],
    ex: 'ばねばかりは、何もつるさないときに目もりが0になっているかをたしかめてから使います。',
  },
  {
    q: 'ばねばかりの目もりを読むとき、目の位置はどうしますか。',
    a: 'はりと同じ高さで、正面から読む',
    wrong: ['上から見下ろして読む', '下から見上げて読む', 'ななめ横から読む'],
    ex: '目もりは、はりと同じ高さで、正面から読みます。上や下から見ると、ずれて読んでしまいます。',
  },
  {
    q: 'ゴムやばねのように、力を加えると形が変わり、力をなくすともとにもどる性質を何といいますか。',
    a: 'だん性',
    wrong: ['じ性', '電気を通す性質', 'とける性質'],
    ex: 'ゴムやばねは、のばしたりちぢめたりしても、力をなくすともとにもどります。この性質をだん性といいます。',
  },
]);

const lowerStretch: Gen = {
  id: 'spring-l-stretch',
  make: (rng) => {
    const per = pick(rng, [1, 2, 3]); // 10g あたりののび (cm)
    const w0 = pick(rng, [10, 20]);
    const w = w0 * pick(rng, [2, 3, 4]);
    const s0 = (per * w0) / 10;
    const s = (per * w) / 10;
    const natural = 10;
    return numeric(rng, {
      text: `図のように、あるばねに${w0}gのおもりをつるすと、ばねは${s0}cmのびました。このばねに${w}gのおもりをつるすと、ばねは何cmのびますか。`,
      svg: springFig([
        { len: natural, note: 'もとの長さ' },
        { len: natural + s0, label: `${w0}g`, note: `${s0}cmのびる` },
        { len: natural + s, label: `${w}g`, note: '？cmのびる' },
      ]),
      correct: s,
      wrong: [s0, s + s0, s * 2, s0 + 1, s - 1, s + 2],
      unit: 'cm',
      explanation: `ばねののびは、つるしたおもりの重さに比例します。重さが ${w} ÷ ${w0} ＝ ${w / w0}倍 なので、のびも${w / w0}倍の ${s0} × ${w / w0} ＝ ${s}（cm）です。`,
    });
  },
};

const lowerLength: Gen = {
  id: 'spring-l-length',
  make: (rng) => {
    const natural = pick(rng, [8, 10, 12, 15]);
    const per = pick(rng, [1, 2]); // 10g あたりののび (cm)
    const w = pick(rng, [20, 30, 40, 50]);
    const total = natural + (per * w) / 10;
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `何もつるさないときの長さが${natural}cmで、10gのおもりをつるすごとに${per}cmずつのびるばねがあります。このばねに${w}gのおもりをつるすと、ばね全体の長さは何cmになりますか。`,
          correct: total,
          wrong: [(per * w) / 10, natural + per, total + natural, total - 2, total + 2],
          unit: 'cm',
          explanation: `のびは ${per} × ${w / 10} ＝ ${(per * w) / 10}cm です。ばね全体の長さは、もとの長さにのびを足して、${natural} ＋ ${(per * w) / 10} ＝ ${total}（cm）です。`,
        }),
      () =>
        numeric(rng, {
          text: `何もつるさないときの長さが${natural}cmで、10gのおもりをつるすごとに${per}cmずつのびるばねがあります。おもりをつるすと、ばね全体の長さが${total}cmになりました。つるしたおもりは何gですか。`,
          correct: w,
          wrong: [(total * 10) / per, w + 10, w - 10, w * 2, total],
          unit: 'g',
          explanation: `のびは ${total} − ${natural} ＝ ${total - natural}cm です。10gで${per}cmのびるので、${total - natural} ÷ ${per} × 10 ＝ ${w}（g）です。全体の長さではなく、のびで考えます。`,
        }),
    ])();
  },
};

const upperCombo: Gen = {
  id: 'spring-u-combo',
  make: (rng) => {
    const per = pick(rng, [1, 2]); // 10g あたりののび (cm)
    const w = pick(rng, [20, 40, 60, 80]);
    const single = (per * w) / 10;
    const intro = `10gのおもりをつるすと${per}cmのびるばねが2本あります。ばねや棒の重さは考えないものとします。`;
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `${intro}図のように、2本をたてに1列につなぎ、下に${w}gのおもりをつるしました。2本のばねののびの合計は何cmですか。`,
          svg: springCombo('series', `${w}g`),
          correct: single * 2,
          wrong: [single, single / 2, single * 4, single + per, single * 2 + per],
          unit: 'cm',
          explanation: `たてにつないだばねには、どちらにも${w}gの力がかかります。1本ののびは ${per} × ${w / 10} ＝ ${single}cm なので、合計は ${single} × 2 ＝ ${single * 2}（cm）です。`,
        }),
      () =>
        numeric(rng, {
          text: `${intro}図のように、2本を横にならべ、下のはしを軽い棒でつないで、棒のまん中に${w}gのおもりをつるしました。ばね1本ののびは何cmですか。`,
          svg: springCombo('parallel', `${w}g`),
          correct: single / 2,
          wrong: [single, single * 2, single / 4, single / 2 + per, single + per],
          unit: 'cm',
          explanation: `横にならべたばねは、おもりの重さを半分ずつささえます。1本にかかる力は ${w} ÷ 2 ＝ ${w / 2}g なので、のびは ${per} × ${w / 20} ＝ ${single / 2}（cm）です。`,
        }),
    ])();
  },
};

/** 1cm³ あたりの重さ (g) */
const MATERIALS = [
  { name: '木', d: 0.5 },
  { name: 'ろう', d: 0.9 },
  { name: 'ゴム', d: 1.5 },
  { name: 'ガラス', d: 2.5 },
  { name: '鉄', d: 8 },
];

const upperDensity: Gen = {
  id: 'spring-u-density',
  make: (rng) => {
    const m = pick(rng, MATERIALS);
    const v = pick(rng, [10, 20, 40, 50, 100]);
    const g = m.d * v;
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `ある物体の体積は${v}cm³、重さは${g}gでした。この物体の1cm³あたりの重さ（密度）は何gですか。`,
          correct: m.d,
          wrong: [v / g, g * v, m.d * 10, m.d / 10, m.d + 1, m.d * 2],
          unit: 'g',
          explanation: `1cm³あたりの重さ（密度）＝ 重さ ÷ 体積 です。${g} ÷ ${v} ＝ ${m.d}（g）です。水の密度は1cm³あたり1gなので、この物体は水に${m.d < 1 ? 'うきます' : 'しずみます'}。`,
        }),
      () =>
        choice(rng, {
          text: `ある物体の体積は${v}cm³、重さは${g}gでした。水1cm³の重さを1gとすると、この物体を水に入れたとき、どうなりますか。`,
          correct: m.d < 1 ? `1cm³あたり${m.d}gで、水より軽いので、うく` : `1cm³あたり${m.d}gで、水より重いので、しずむ`,
          wrong: [
            m.d < 1 ? `1cm³あたり${m.d}gで、水より軽いので、しずむ` : `1cm³あたり${m.d}gで、水より重いので、うく`,
            `重さが${g}gもあるので、かならずしずむ`,
            `体積が${v}cm³もあるので、かならずうく`,
            '重さと体積だけではわからない',
          ],
          explanation: `1cm³あたりの重さは ${g} ÷ ${v} ＝ ${m.d}g です。水（1cm³あたり1g）より${m.d < 1 ? '軽いので、水にうきます' : '重いので、水にしずみます'}。うくかしずむかは、重さや体積だけでは決まらず、1cm³あたりの重さで決まります。`,
        }),
      () =>
        numeric(rng, {
          text: `1cm³あたりの重さが${m.d}gの${m.name}があります。この${m.name}${v}cm³の重さは何gですか。`,
          correct: g,
          wrong: [v / m.d, g * 2, g / 2, v, g + 10],
          unit: 'g',
          explanation: `重さ ＝ 1cm³あたりの重さ × 体積 です。${m.d} × ${v} ＝ ${g}（g）です。`,
        }),
    ])();
  },
};

const upperBuoyancy: Gen = {
  id: 'spring-u-buoyancy',
  make: (rng) => {
    const v = pick(rng, [20, 30, 40, 50, 80, 100]);
    const w = v + int(rng, 2, 20) * 10;
    const intro = '水1cm³の重さを1gとします。';
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `${intro}空気中でばねばかりにつるすと${w}gをしめす、体積${v}cm³の物体があります。図のように、この物体を水の中に全部しずめると、ばねばかりは何gをしめしますか。`,
          svg: buoyFig({ scale: '？g', object: `${v}cm³`, water: true }),
          correct: w - v,
          wrong: [w, v, w + v, w - v / 2, w - v - 10, w - v + 10],
          unit: 'g',
          explanation: `水中の物体は、おしのけた水の重さと同じ大きさの上向きの力（ふ力）を受けます。おしのけた水は${v}cm³で${v}gなので、ふ力は${v}gです。ばねばかりは ${w} − ${v} ＝ ${w - v}（g）をしめします。`,
        }),
      () =>
        numeric(rng, {
          text: `${intro}ある物体をばねばかりにつるすと、空気中では${w}gをしめしました。図のように、水の中に全部しずめると${w - v}gをしめしました。この物体の体積は何cm³ですか。`,
          svg: buoyFig({ scale: `${w - v}g`, object: '？cm³', water: true }),
          correct: v,
          wrong: [w, w - v, w + (w - v), v / 2, v + 10, v * 2].filter((x) => x !== v),
          unit: 'cm³',
          explanation: `ばねばかりのしめす値がへった分が、ふ力の大きさです。${w} − ${w - v} ＝ ${v}g。ふ力は、おしのけた水の重さと等しいので、おしのけた水は${v}cm³、つまり物体の体積は${v}（cm³）です。`,
        }),
      () =>
        numeric(rng, {
          text: `${intro}体積${v}cm³の物体を、水の中に全部しずめました。この物体が水から受ける上向きの力（ふ力）は何gですか。物体の重さは${w}gです。`,
          correct: v,
          wrong: [w, w - v, w + v, v / 2, v + 10, v * 2].filter((x) => x !== v),
          unit: 'g',
          explanation: `ふ力の大きさは、物体がおしのけた水の重さと等しくなります。おしのけた水は${v}cm³なので、ふ力は${v}（g）です。物体の重さには関係しません。`,
        }),
    ])();
  },
};

const upperPressure: Gen = {
  id: 'spring-u-pressure',
  make: (rng) =>
    pick(rng, [
      () => {
        const v = pick(rng, [100, 200, 300, 500]);
        const w = (v * pick(rng, [4, 5, 6, 8])) / 10;
        return numeric(rng, {
          text: `水1cm³の重さを1gとします。体積${v}cm³、重さ${w}gの木を水に入れると、木は水面にうかんで静止しました。このとき、木の水面より下にある部分の体積は何cm³ですか。`,
          correct: w,
          wrong: [v, v - w, w / 2, v / 2, w + 20].filter((x) => x !== w),
          unit: 'cm³',
          explanation: `うかんで静止しているとき、ふ力は木の重さ${w}gとつり合っています。ふ力は、おしのけた水の重さなので、おしのけた水は${w}g、つまり${w}cm³です。水面より下にある部分の体積は${w}（cm³）です。`,
        });
      },
      () =>
        choice(rng, {
          text: '水の中の物体にはたらく水の圧力（水圧）は、深さによってどう変わりますか。',
          correct: '深いところほど、大きくなる',
          wrong: ['深いところほど、小さくなる', '深さに関係なく、同じ', '水面でいちばん大きい'],
          explanation: '水圧は、その上にある水の重さによって生じるので、深いところほど大きくなります。深海にしずめた発ぽうスチロールのカップが小さくちぢむのは、そのためです。',
        }),
      () =>
        choice(rng, {
          text: '水を入れた容器の横に、上・中・下の3つの同じ大きさのあなをあけました。水がいちばんいきおいよく飛び出すのは、どのあなですか。',
          correct: 'いちばん下のあな',
          wrong: ['いちばん上のあな', 'まん中のあな', 'どれも同じ'],
          explanation: '水圧は深いところほど大きいので、いちばん下のあなから、水がいちばんいきおいよく飛び出します。',
        }),
      () =>
        choice(rng, {
          text: '水の中の物体に、水圧はどの向きからはたらきますか。',
          correct: 'あらゆる向きから、面に垂直にはたらく',
          wrong: ['上からだけはたらく', '下からだけはたらく', '横からだけはたらく'],
          explanation: '水圧は、あらゆる向きからはたらきます。物体の下の面の方が深いので、下からおす力の方が上からおす力より大きく、その差がふ力になります。',
        }),
      () =>
        choice(rng, {
          text: '水に全部しずんでいる物体を、さらに深いところまでしずめました。物体が受けるふ力の大きさはどうなりますか。',
          correct: '変わらない',
          wrong: ['大きくなる', '小さくなる', 'なくなる'],
          explanation: 'ふ力の大きさは、おしのけた水の重さで決まります。全部しずんでいれば、おしのけた水の量は深さによらず同じなので、ふ力は変わりません。',
        }),
    ])(),
};

const lowerBuoy: Gen = {
  id: 'spring-l-buoy',
  make: (rng) => {
    const air = int(rng, 6, 30) * 10;
    const up = int(rng, 1, air / 10 - 2) * 10;
    const inWater = air - up;
    const intro = `ばねばかりにおもりをつるすと、空気中では${air}gをさしました。このおもりを、ばねばかりにつるしたまま水の中に全部しずめると`;
    const why = '水の中のものは、水から上向きの力（ふ力）を受けます。そのぶん、ばねばかりの目もりは小さくなります。';
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `${intro}、${inWater}gをさしました。おもりが水から受けた上向きの力は、何g分ですか。`,
          svg: buoyFig({ scale: `${inWater}g`, object: 'おもり', water: true }),
          correct: up,
          wrong: [air, inWater, air + inWater, up + 10, up - 10],
          unit: 'g',
          explanation: `${why}へった分が上向きの力なので、${air} − ${inWater} ＝ ${up}（g分）です。`,
        }),
      () =>
        numeric(rng, {
          text: `${intro}、おもりは水から${up}g分の上向きの力を受けました。このとき、ばねばかりは何gをさしますか。`,
          svg: buoyFig({ scale: '？g', object: 'おもり', water: true }),
          correct: inWater,
          wrong: [air, up, air + up, inWater + 10, inWater - 10],
          unit: 'g',
          explanation: `${why}目もりは ${air} − ${up} ＝ ${inWater}（g）になります。`,
        }),
    ])();
  },
};

const upperTable: Gen = {
  id: 'spring-u-table',
  make: (rng) => {
    // A は短くてよくのび、B は長くてのびにくい。どこかで同じ長さになる
    for (;;) {
      const pb = pick(rng, [1, 1.5, 2]);
      const pa = pb + pick(rng, [0.5, 1, 1.5, 2]);
      const a0 = int(rng, 8, 15);
      const b0 = a0 + int(rng, 2, 8);
      const same = ((b0 - a0) / (pa - pb)) * 10;
      const ws = pick(rng, [[20, 40], [10, 30], [30, 50]]);
      // 表にある重さで同じ長さになると、計算しなくても答えがわかってしまう
      if (!Number.isInteger(same / 10) || same > 120 || ws.includes(same)) continue;
      const len = (n: number, p: number, g: number) => n + (p * g) / 10;
      const table = ws.map((g) => `・${g}gのとき　A ${fmt(len(a0, pa, g))}cm、B ${fmt(len(b0, pb, g))}cm`).join('\n');
      const intro = `ばねAとばねBに、いろいろな重さのおもりをつるして、ばね全体の長さをはかりました。\n${table}`;
      const [g1, g2] = ws;
      const perA = `Aは、${g2 - g1}gふえると ${fmt(len(a0, pa, g2))} − ${fmt(len(a0, pa, g1))} ＝ ${fmt((pa * (g2 - g1)) / 10)}cm のびるので、10gで${fmt(pa)}cmのびます。`;
      return pick(rng, [
        () =>
          numeric(rng, {
            text: `${intro}\nばねAの、何もつるさないときの長さは何cmですか。`,
            correct: a0,
            wrong: [len(a0, pa, g1), b0, a0 - pa, a0 + pa, len(a0, pa, g1) - pa],
            unit: 'cm',
            explanation: `${perA}${g1}gでは ${fmt((pa * g1) / 10)}cm のびているので、もとの長さは ${fmt(len(a0, pa, g1))} − ${fmt((pa * g1) / 10)} ＝ ${a0}（cm）です。`,
          }),
        () => {
          const g = pick(rng, [60, 70, 80, 100]);
          return numeric(rng, {
            text: `${intro}\nばねAに${g}gのおもりをつるすと、ばね全体の長さは何cmになりますか。`,
            correct: len(a0, pa, g),
            wrong: [(pa * g) / 10, len(b0, pb, g), len(a0, pa, g) + pa, len(a0, pa, g) - pa, len(a0, pa, g2) * 2],
            unit: 'cm',
            explanation: `${perA}もとの長さは ${fmt(len(a0, pa, g1))} − ${fmt((pa * g1) / 10)} ＝ ${a0}cm です。${g}gでは ${fmt(pa)} × ${g / 10} ＝ ${fmt((pa * g) / 10)}cm のびるので、${a0} ＋ ${fmt((pa * g) / 10)} ＝ ${fmt(len(a0, pa, g))}（cm）です。`,
          });
        },
        () =>
          numeric(rng, {
            text: `${intro}\nばねAとばねBに同じ重さのおもりをつるして、2本の長さが同じになるのは、何gのおもりをつるしたときですか。`,
            correct: same,
            wrong: [same + 10, same - 10, same * 2, same / 2, same + 20],
            unit: 'g',
            explanation: `表から、Aはもとの長さ${a0}cmで10gごとに${fmt(pa)}cm、Bはもとの長さ${b0}cmで10gごとに${fmt(pb)}cmのびます。長さの差 ${b0 - a0}cm は、10gごとに ${fmt(pa)} − ${fmt(pb)} ＝ ${fmt(pa - pb)}cm ずつちぢまるので、${b0 - a0} ÷ ${fmt(pa - pb)} × 10 ＝ ${same}（g）で同じ長さになります。`,
          }),
      ])();
    }
  },
};

/** ジェネレーターと、それを出す学年 */
export const SPRING: Entry[] = [
  forGrades(lowerFloat, 3),
  forGrades(lowerRubber, 3),
  forGrades(lowerStretch, 3, 4),
  forGrades(lowerLength, 4),
  forGrades(lowerBuoy, 3, 4, 5),
  forGrades(upperCombo, 4, 5),
  forGrades(upperDensity, 5, 6),
  forGrades(upperTable, 5, 6),
  forGrades(upperBuoyancy, 6),
  forGrades(upperPressure, 6),
];

