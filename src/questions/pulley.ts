import { cascadePulley, comboPulley, fixedPulley, movablePulley, tacklePulley } from '../diagrams/pulley';
import { facts, forGrades, int, numeric, pick, type Entry, type Gen } from './helpers';

const NOTE = 'かっ車とひもの重さ、まさつは考えないものとします。';

// ---------- 3・4 年むけ (どの学年に出すかは、ファイルの最後の一覧で決める) ----------

const lowerFixed: Gen = {
  id: 'pulley-l-fixed',
  make: (rng) => {
    const w = int(rng, 2, 12) * 10;
    return numeric(rng, {
      text: `図のように、定かっ車を使って${w}gのおもりを持ち上げます。ひもを何gの力で引けばよいですか。${NOTE}`,
      svg: fixedPulley(`${w}g`, '？g'),
      correct: w,
      wrong: [w / 2, w * 2, w + 10, w - 10],
      unit: 'g',
      explanation: `定かっ車は、力の向きを変えるだけで、力の大きさは変わりません。だから、おもりと同じ${w}gの力で引きます。`,
    });
  },
};

const lowerMovable: Gen = {
  id: 'pulley-l-movable',
  make: (rng) => {
    const w = int(rng, 2, 12) * 20;
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `図のように、動かっ車を使って${w}gのおもりを持ち上げます。ひもを何gの力で引けばよいですか。${NOTE}`,
          svg: movablePulley(`${w}g`, '？g'),
          correct: w / 2,
          wrong: [w, w * 2, w / 4, w / 2 + 10],
          unit: 'g',
          explanation: `動かっ車は、2本のひもでおもりをささえるので、引く力はおもりの重さの半分になります。${w} ÷ 2 ＝ ${w / 2}（g）です。`,
        }),
      () =>
        numeric(rng, {
          text: `図のように、動かっ車を使っておもりを持ち上げます。ひもを${w / 2}gの力で引くと、ちょうど持ち上げることができました。おもりの重さは何gですか。${NOTE}`,
          svg: movablePulley('？g', `${w / 2}g`),
          correct: w,
          wrong: [w / 2, w / 4, w * 2, w + 20],
          unit: 'g',
          explanation: `動かっ車では、引く力はおもりの重さの半分ですみます。${w / 2}gの力で引いたので、おもりは ${w / 2} × 2 ＝ ${w}（g）です。`,
        }),
    ])();
  },
};

const lowerLength: Gen = {
  id: 'pulley-l-length',
  make: (rng) => {
    const h = pick(rng, [10, 15, 20, 30, 40]);
    const w = int(rng, 2, 10) * 20;
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `図のように、動かっ車を使って${w}gのおもりを${h}cm持ち上げます。ひもを何cm引けばよいですか。`,
          svg: movablePulley(`${w}g`, '引く'),
          correct: h * 2,
          wrong: [h, h / 2, h * 3, h * 4],
          unit: 'cm',
          explanation: `動かっ車は、力が半分ですむかわりに、ひもを引く長さは2倍になります。${h} × 2 ＝ ${h * 2}（cm）です。`,
        }),
      () =>
        numeric(rng, {
          text: `図のように、定かっ車を使って${w}gのおもりを${h}cm持ち上げます。ひもを何cm引けばよいですか。`,
          svg: fixedPulley(`${w}g`, '引く'),
          correct: h,
          wrong: [h * 2, h / 2, h * 3, h + 10],
          unit: 'cm',
          explanation: `定かっ車は、力の向きを変えるだけです。ひもを引いた長さだけおもりが上がるので、${h}cm引きます。`,
        }),
    ])();
  },
};

const lowerKinds = facts('pulley-l-kinds', [
  {
    q: '定かっ車を使うと、どんなよいことがありますか。',
    a: '力の向きを変えることができる',
    wrong: ['引く力が半分ですむ', 'ひもを引く長さが半分ですむ', 'おもりが軽くなる'],
    ex: '定かっ車は、ひもを下に引くとおもりが上がるように、力の向きを変えることができます。力の大きさや、ひもを引く長さは変わりません。',
  },
  {
    q: '動かっ車を使うと、どんなよいことがありますか。',
    a: '引く力が、おもりの重さの半分ですむ',
    wrong: ['ひもを引く長さが半分ですむ', '力の向きを自由に変えられる', 'おもりの重さの2倍の力が出せる'],
    ex: '動かっ車は、おもりを2本のひもでささえるので、引く力は半分ですみます。そのかわり、ひもを引く長さは2倍になります。',
  },
  {
    q: '旗をあげるポールのてっぺんについているかっ車は、どんなはたらきをしていますか。',
    a: 'ひもを下に引くと旗が上がるように、力の向きを変える',
    wrong: ['旗を軽くする', '引く力を半分にする', 'ひもを引く長さを半分にする'],
    ex: 'ポールのてっぺんのかっ車は、位置が動かない定かっ車です。ひもを下に引く力を、旗を上に上げる力に変えています。',
  },
  {
    q: 'おもりといっしょに上下に動くかっ車を何といいますか。',
    a: '動かっ車',
    wrong: ['定かっ車', '輪じく', 'ふりこ'],
    ex: 'おもりといっしょに動くかっ車を動かっ車、天じょうなどに固定されて動かないかっ車を定かっ車といいます。',
  },
  {
    q: '動かっ車でおもりを持ち上げるとき、定かっ車を使うときとくらべて、ひもを引く長さはどうなりますか。',
    a: '2倍になる',
    wrong: ['半分になる', '同じ', '4倍になる'],
    ex: '動かっ車は、引く力が半分ですむかわりに、ひもを引く長さは2倍になります。',
  },
  {
    q: '井戸のつるべ（ロープの先にバケツをつけたもの）では、上の方に固定したかっ車が使われています。このかっ車は何ですか。',
    a: '定かっ車',
    wrong: ['動かっ車', '輪じく', 'てんびん'],
    ex: '固定されていて動かないかっ車を定かっ車といいます。力の向きを変えて、ロープを下に引くことでバケツを持ち上げられます。',
  },
  {
    q: '定かっ車を使っておもりを持ち上げるとき、ひもを引く力の大きさは、おもりの重さとくらべてどうですか。',
    a: '同じ',
    wrong: ['半分', '2倍', '4分の1'],
    ex: '定かっ車は力の向きを変えるだけなので、引く力の大きさはおもりの重さと同じです。',
  },
]);

const lowerCombo: Gen = {
  id: 'pulley-l-combo',
  make: (rng) => {
    const w = int(rng, 2, 12) * 20;
    return numeric(rng, {
      text: `図のように、動かっ車と定かっ車を組み合わせて、${w}gのおもりを持ち上げます。ひもを下向きに何gの力で引けばよいですか。${NOTE}`,
      svg: comboPulley(`${w}g`, '？g'),
      correct: w / 2,
      wrong: [w, w * 2, w / 4, w / 2 + 10],
      unit: 'g',
      explanation: `動かっ車で力が半分になり、定かっ車は力の向きを変えるだけです。だから ${w} ÷ 2 ＝ ${w / 2}（g）の力で、下向きに引けばよいことになります。`,
    });
  },
};

// ---------- 5・6 年むけ ----------

const upperHeavy: Gen = {
  id: 'pulley-u-heavy',
  make: (rng) => {
    const p = pick(rng, [20, 40, 60]);
    const w = int(rng, 3, 15) * 20;
    const f = (w + p) / 2;
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `図のように、重さ${p}gの動かっ車を使って、${w}gのおもりを持ち上げます。ひもを何gの力で引けばよいですか。ひもの重さとまさつは考えないものとします。`,
          svg: movablePulley(`${w}g`, '？g'),
          correct: f,
          wrong: [w / 2, w + p, w / 2 + p, w, (w - p) / 2],
          unit: 'g',
          explanation: `動かっ車の重さもいっしょに持ち上げることになります。（${w} ＋ ${p}）÷ 2 ＝ ${f}（g）です。`,
        }),
      () =>
        numeric(rng, {
          text: `図のように、重さ${p}gの動かっ車を使っておもりを持ち上げます。ひもを${f}gの力で引くと、ちょうど持ち上げることができました。おもりの重さは何gですか。ひもの重さとまさつは考えないものとします。`,
          svg: movablePulley('？g', `${f}g`),
          correct: w,
          wrong: [f * 2, f * 2 + p, f, f - p, w - p],
          unit: 'g',
          explanation: `ひも2本でささえているので、動かっ車とおもりの合計は ${f} × 2 ＝ ${f * 2}g です。動かっ車の重さ${p}gを引いて、おもりは ${f * 2} − ${p} ＝ ${w}（g）です。`,
        }),
    ])();
  },
};

const upperCascade: Gen = {
  id: 'pulley-u-cascade',
  make: (rng) => {
    const n = pick(rng, [2, 3]);
    const div = 2 ** n;
    const w = int(rng, 2, 10) * 40;
    const h = pick(rng, [5, 10, 20]);
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `図のように、動かっ車を${n}個組み合わせて、${w}gのおもりを持ち上げます。いちばん上のひもを何gの力で引けばよいですか。${NOTE}`,
          svg: cascadePulley(n, `${w}g`, '？g'),
          correct: w / div,
          wrong: [w / n, w / 2, w / (div * 2), w / (n + 1), w].filter((v) => Number.isInteger(v)),
          unit: 'g',
          explanation: `動かっ車を1個通るごとに、力は半分になります。${n}個あるので、${w} ${'÷ 2 '.repeat(n)}＝ ${w / div}（g）です。`,
        }),
      () =>
        numeric(rng, {
          text: `図のように、動かっ車を${n}個組み合わせて、${w}gのおもりを${h}cm持ち上げます。いちばん上のひもを何cm引けばよいですか。`,
          svg: cascadePulley(n, `${w}g`, '引く'),
          correct: h * div,
          wrong: [h * n, h * 2, h, h * div * 2, h * (n + 1)],
          unit: 'cm',
          explanation: `動かっ車を1個通るごとに、ひもを引く長さは2倍になります。${n}個あるので、${h} ${'× 2 '.repeat(n)}＝ ${h * div}（cm）です。力は${div}分の1ですみますが、引く長さは${div}倍になります。`,
        }),
    ])();
  },
};

const upperTackle: Gen = {
  id: 'pulley-u-tackle',
  make: (rng) => {
    const k = pick(rng, [3, 4, 5, 6]);
    const f = int(rng, 2, 12) * 10;
    const w = f * k;
    const h = pick(rng, [5, 10, 20]);
    const intro = `図のように、いくつかの定かっ車と動かっ車を1本のひもでつないだ組み合わせかっ車があります。下の動かっ車のまとまりは、${k}本のひもでささえられています。`;
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `${intro}${w}gのおもりを持ち上げるには、ひものはしを何gの力で引けばよいですか。${NOTE}`,
          svg: tacklePulley(k, `${w}g`, '？g'),
          correct: f,
          wrong: [w / 2, w, w / (k - 1), w / (k + 1), f / 2].filter((v) => Number.isInteger(v)),
          unit: 'g',
          explanation: `1本のひもには、どこでも同じ大きさの力がかかります。${k}本のひもでおもりをささえているので、1本あたり ${w} ÷ ${k} ＝ ${f}（g）です。`,
        }),
      () =>
        numeric(rng, {
          text: `${intro}おもりを${h}cm持ち上げるには、ひものはしを何cm引けばよいですか。`,
          svg: tacklePulley(k, `${w}g`, '引く'),
          correct: h * k,
          wrong: [h, h * 2, h * (k - 1), h * (k + 1), h * k * 2],
          unit: 'cm',
          explanation: `おもりを${h}cm上げるには、ささえている${k}本のひもがそれぞれ${h}cmずつ短くならなければなりません。だから、ひもを ${h} × ${k} ＝ ${h * k}（cm）引きます。`,
        }),
    ])();
  },
};

const upperCeiling: Gen = {
  id: 'pulley-u-ceiling',
  make: (rng) => {
    const w = int(rng, 2, 12) * 20;
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `図のように、定かっ車を使って${w}gのおもりをつるし、ひもを下に引いて静止させています。このとき、定かっ車をつるしている天じょうには、何gの力がかかっていますか。${NOTE}`,
          svg: fixedPulley(`${w}g`, '引く'),
          correct: w * 2,
          wrong: [w, w / 2, w * 3, w * 4],
          unit: 'g',
          explanation: `ひもを引く力は、おもりと同じ${w}gです。定かっ車は、おもりの${w}gと、引く力の${w}gの両方で下に引かれるので、天じょうには ${w} ＋ ${w} ＝ ${w * 2}（g）の力がかかります。`,
        }),
      () =>
        numeric(rng, {
          text: `図のように、動かっ車を使って${w}gのおもりをつるし、ひもを上に引いて静止させています。このとき、ひもを固定している天じょうには、何gの力がかかっていますか。${NOTE}`,
          svg: movablePulley(`${w}g`, '引く'),
          correct: w / 2,
          wrong: [w, w * 2, w / 4, w / 2 + 20],
          unit: 'g',
          explanation: `動かっ車のおもりは、2本のひもで半分ずつささえられています。手で引いている方に ${w / 2}g、天じょうに固定した方にも ${w / 2}g の力がかかります。`,
        }),
    ])();
  },
};

const upperComboHeavy: Gen = {
  id: 'pulley-u-combo',
  make: (rng) => {
    const p = pick(rng, [20, 40]);
    const w = int(rng, 3, 15) * 20;
    const h = pick(rng, [10, 15, 20, 30]);
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `図のように、重さ${p}gの動かっ車と定かっ車を組み合わせて、${w}gのおもりを持ち上げます。ひもを下向きに何gの力で引けばよいですか。ひもの重さとまさつは考えないものとします。`,
          svg: comboPulley(`${w}g`, '？g'),
          correct: (w + p) / 2,
          wrong: [w / 2, w + p, w, w / 2 + p, (w + p) / 4],
          unit: 'g',
          explanation: `動かっ車とおもりの合計 ${w} ＋ ${p} ＝ ${w + p}g を、2本のひもでささえます。定かっ車は力の向きを変えるだけなので、${w + p} ÷ 2 ＝ ${(w + p) / 2}（g）です。`,
        }),
      () =>
        numeric(rng, {
          text: `図のように、動かっ車と定かっ車を組み合わせて、ひもを下向きに${h * 2}cm引きました。おもりは何cm上がりますか。`,
          svg: comboPulley(`${w}g`, '引く'),
          correct: h,
          wrong: [h * 2, h * 4, h / 2, h + 10],
          unit: 'cm',
          explanation: `動かっ車では、おもりが上がる長さは、ひもを引いた長さの半分です。定かっ車は長さを変えません。${h * 2} ÷ 2 ＝ ${h}（cm）です。`,
        }),
    ])();
  },
};

const upperWork = facts('pulley-u-work', [
  {
    q: '動かっ車を使うと、引く力は半分になりますが、ひもを引く長さは2倍になります。このように、道具を使っても「力 × 動かしたきょり」が変わらないことを何といいますか。',
    a: '仕事の原理',
    wrong: ['てこの原理', '作用・反作用', 'かん性の法則'],
    ex: '道具を使うと力を小さくできますが、そのぶん動かすきょりが長くなり、「力 × きょり」（仕事の量）は変わりません。これを仕事の原理といいます。',
  },
  {
    q: '同じおもりを同じ高さまで持ち上げます。「定かっ車1個」を使う場合と「動かっ車1個」を使う場合をくらべたとき、正しいものはどれですか。かっ車の重さとまさつは考えません。',
    a: '動かっ車の方が、力は半分で、ひもを引く長さは2倍になる',
    wrong: ['動かっ車の方が、力も、ひもを引く長さも半分になる', '定かっ車の方が、力は半分で、ひもを引く長さは2倍になる', 'どちらも、力もひもを引く長さも同じになる'],
    ex: '定かっ車は力も長さも変わりません。動かっ車は力が半分、引く長さが2倍になります。「力 × 長さ」はどちらも同じです。',
  },
  {
    q: '1本のひもを、いくつかのかっ車にかけて使うとき、そのひもにかかる力の大きさについて正しいものはどれですか。まさつは考えません。',
    a: 'ひものどの部分にも、同じ大きさの力がかかっている',
    wrong: ['手で引くところに近いほど、大きな力がかかっている', 'おもりに近いほど、大きな力がかかっている', 'かっ車を通るたびに、力は半分になる'],
    ex: '1本のつながったひもには、どの部分にも同じ大きさの力がかかります。かっ車の問題は、「何本のひもでささえているか」を数えると解くことができます。',
  },
  {
    q: 'クレーン車のフックの部分には、動かっ車がいくつも使われています。それはなぜですか。',
    a: '小さい力で、重いものをつり上げるため',
    wrong: ['ものを速くつり上げるため', 'ワイヤーを短くするため', '力の向きを変えるため'],
    ex: '動かっ車をたくさん使うと、つり上げる力を何分の1にもへらすことができます。そのかわり、ワイヤーをまき取る長さは長くなります。',
  },
  {
    q: '動かっ車1個を使って、200gのおもりを10cm持ち上げます。ひもを引く力と、ひもを引く長さの組み合わせとして正しいものはどれですか。かっ車の重さとまさつは考えません。',
    a: '100gの力で20cm引く',
    wrong: ['100gの力で10cm引く', '200gの力で20cm引く', '200gの力で10cm引く'],
    ex: '動かっ車を使うと、引く力は半分の100gになりますが、ひもを引く長さは2倍の20cmになります。100 × 20 ＝ 200 × 10 となり、仕事の原理が成り立っています。',
  },
  {
    q: 'てこ・かっ車・輪じくなどの道具について、正しく説明しているものはどれですか。',
    a: '力を小さくすると、そのぶん動かすきょりが長くなる',
    wrong: ['力を小さくし、動かすきょりも短くできる', '力の大きさも、動かすきょりも変わらない', '道具を使うと、ものの重さが軽くなる'],
    ex: '道具を使って力を小さくすると、そのぶん力を加えて動かすきょりが長くなります。「力 × きょり」は、道具を使っても使わなくても変わりません（仕事の原理）。',
  },
  {
    q: '次のうち、かっ車を利用しているものはどれですか。',
    a: '旗をあげるポールのてっぺんの車',
    wrong: ['せんぬき', 'ピンセット', 'ドアノブ'],
    ex: 'ポールのてっぺんには定かっ車がついていて、ひもを下に引くと旗が上がります。せんぬきとピンセットはてこ、ドアノブは輪じくを利用しています。',
  },
]);

/** ジェネレーターと、それを出す学年 */
export const PULLEY: Entry[] = [
  forGrades(lowerFixed, 3),
  forGrades(lowerKinds, 3, 4),
  forGrades(lowerMovable, 3, 4),
  forGrades(lowerCombo, 4),
  forGrades(lowerLength, 3, 4, 5),
  forGrades(upperHeavy, 5, 6),
  forGrades(upperComboHeavy, 5),
  forGrades(upperWork, 5, 6),
  forGrades(upperCascade, 6),
  forGrades(upperTackle, 6),
  forGrades(upperCeiling, 6),
];
