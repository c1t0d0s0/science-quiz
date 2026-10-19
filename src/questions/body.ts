import { shuffle } from '../core/rng';
import { eyeFig } from '../diagrams/anatomy';
import { lowerBones, upperBirth, upperBreath, upperDigestion, upperHeart } from './animals';
import { choice, facts, fixed, fmt, forGrades, int, KANA, numeric, oneOf, pick, type Entry, type Gen } from './helpers';

const SENSES = [
  { what: '明るさや色、形', where: '目' },
  { what: '音', where: '耳' },
  { what: 'におい', where: '鼻' },
  { what: 'あまい・からいなどの味', where: 'した' },
  { what: '手ざわりや、あたたかさ・つめたさ', where: '皮ふ' },
];

const lowerSenses: Gen = {
  id: 'body-l-senses',
  make: (rng) => {
    const s = pick(rng, SENSES);
    const explanation = `${s.what}は${s.where}で感じとります。目・耳・鼻・した・皮ふで感じたことは、脳に伝わります。`;
    return rng() < 0.5
      ? choice(rng, { text: `「${s.what}」を感じとるのは、からだのどこですか。`, correct: s.where, wrong: SENSES.map((x) => x.where), explanation })
      : choice(rng, { text: `からだのうち、「${s.where}」で感じとるものはどれですか。`, correct: s.what, wrong: SENSES.map((x) => x.what), explanation });
  },
};

const lowerPulse = facts('body-l-pulse', [
  {
    q: '走ったあとの脈はく（手首で感じる「どきどき」）は、走る前とくらべてどうなりますか。',
    a: '速くなる',
    wrong: ['おそくなる', '変わらない', '止まる'],
    ex: '運動をすると、からだがたくさんの酸素や養分を必要とするので、心臓が速く動き、脈はくも速くなります。',
  },
  {
    q: '走ったあとの呼吸（息をすったりはいたりすること）は、走る前とくらべてどうなりますか。',
    a: '回数がふえて、あらくなる',
    wrong: ['回数がへって、ゆっくりになる', '変わらない', '息をしなくなる'],
    ex: '運動をすると、からだがたくさんの酸素を必要とするので、呼吸の回数がふえます。',
  },
  {
    q: '手首に指を当てると感じる「どきどき」は、からだの何の動きが伝わったものですか。',
    a: '心臓',
    wrong: ['肺', '胃', '筋肉', '骨'],
    ex: '心臓がのびちぢみして血液を送り出す動きが、血管を伝わって手首などで感じられます。これを脈はくといいます。',
  },
  {
    q: '暑いときや運動をしたときに、あせをかくのはなぜですか。',
    a: 'からだの温度を下げるため',
    wrong: ['からだの温度を上げるため', 'からだを重くするため', '皮ふをかたくするため'],
    ex: 'あせがかわくとき、からだの熱をうばっていきます。そのおかげで、体温が上がりすぎないようになっています。',
  },
  {
    q: '息を大きくすいこんだとき、むねはどうなりますか。',
    a: 'ふくらむ',
    wrong: ['へこむ', '変わらない', 'かたくなる'],
    ex: '息をすうと、むねの中にある肺に空気が入るので、むねがふくらみます。はくと、もとにもどります。',
  },
  {
    q: 'からだの中で、血液を全身に送り出すポンプのはたらきをしているものはどれですか。',
    a: '心臓',
    wrong: ['肺', '胃', '脳'],
    ex: '心臓は、ちぢんだりゆるんだりして、血液を全身に送り出しています。手首で感じる脈はくは、この動きが血管を伝わったものです。',
  },
  {
    q: '鼻や口からすいこんだ空気は、からだの中のどこに入りますか。',
    a: '肺',
    wrong: ['胃', '心臓', '腸'],
    ex: 'すいこんだ空気は、気管を通って肺に入ります。肺で、空気中の酸素が血液にとり入れられます。',
  },
]);

const lowerJoints = facts('body-l-joints', [
  {
    q: '次のうち、関節があって曲げることができるところはどれですか。',
    a: 'ひじ',
    wrong: ['ひじと手首の間', 'ひざと足首の間', 'かたとひじの間'],
    ex: 'ひじ、ひざ、手首、指のつけ根などには関節があり、そこで曲げることができます。骨のとちゅうでは曲がりません。',
  },
  {
    q: '筋肉のはしは、細くじょうぶなすじになって骨についています。このすじを何といいますか。',
    a: 'けん',
    wrong: ['関節', 'なん骨', '血管', '神経'],
    ex: '筋肉の両はしは「けん」になって、関節をまたいで別々の骨についています。かかとの上のアキレスけんが有名です。',
  },
  {
    q: 'せなかのまん中を通っている骨（せぼね）の、おもなはたらきはどれですか。',
    a: 'からだをささえる',
    wrong: ['食べ物をこなす', '血液を送り出す', '空気をとり入れる'],
    ex: 'せぼねは、たくさんの短い骨がつながってできていて、からだをささえています。少しずつ曲げることもできます。',
  },
  {
    q: 'からだを動かすことができるのは、何のはたらきですか。',
    a: '筋肉がちぢんだりゆるんだりして、骨を動かす',
    wrong: ['骨が自分でのびたりちぢんだりする', '関節が自分で回る', '皮ふが骨を引っぱる'],
    ex: '骨は自分では動けません。骨についた筋肉がちぢんだりゆるんだりすることで、関節のところで骨が動きます。',
  },
  {
    q: 'ウサギやイヌなどの動物のからだにも、ヒトと同じようにあるものはどれですか。',
    a: '骨・筋肉・関節',
    wrong: ['骨だけ', '筋肉だけ', 'どれもない'],
    ex: 'ほかの動物にも骨・筋肉・関節があり、ヒトと同じしくみでからだを動かしています。',
  },
  {
    q: 'ひじやひざで、からだを曲げることができるのは、そこに何があるからですか。',
    a: '関節',
    wrong: ['けん', 'つめ', '血管'],
    ex: '骨と骨のつなぎ目を関節といいます。関節のあるところで、からだを曲げることができます。',
  },
  {
    q: 'おとなのからだには、骨がおよそ何本ありますか。',
    a: '約200本',
    wrong: ['約20本', '約50本', '約2000本'],
    ex: 'おとなのからだには、約200本の骨があります。大きさや形は、場所によっていろいろです。',
  },
]);

const EYE_PARTS = [
  { key: 'lens', name: 'レンズ（水しょう体）', q: '光を折り曲げて、もうまくの上に像を結ぶ部分' },
  { key: 'retina', name: 'もうまく', q: '像がうつり、光のしげきを受けとる部分' },
  { key: 'iris', name: 'こうさい', q: 'ひとみの大きさを変えて、目に入る光の量を調節する部分' },
  { key: 'nerve', name: '視神経', q: '光のしげきを信号として脳に伝える部分' },
] as const;

const upperEye: Gen = {
  id: 'body-u-eye',
  make: (rng) =>
    pick(rng, [
      () => {
        const letters = shuffle(KANA.slice(0, 4), rng);
        const labels = { lens: letters[0], retina: letters[1], iris: letters[2], nerve: letters[3] };
        const part = pick(rng, EYE_PARTS);
        return fixed({
          text: `図は、ヒトの目のつくりを表しています。「${part.q}」は、ア〜エのどれですか。`,
          svg: eyeFig(labels),
          choices: KANA.slice(0, 4),
          correct: labels[part.key],
          explanation: `答えは「${part.name}」の ${labels[part.key]} です。光は、こうさいで量を調節され、レンズで折れ曲がって、もうまくに像を結びます。そのしげきが視神経を通って脳に伝わります。`,
        });
      },
      () =>
        choice(rng, {
          text: '暗い部屋から明るい外に出たとき、目のひとみの大きさはどうなりますか。',
          correct: '小さくなる',
          wrong: ['大きくなる', '変わらない', '左右でちがう大きさになる'],
          explanation: '明るい所では、こうさいがのびてひとみが小さくなり、目に入る光の量をへらします。暗い所では、ひとみが大きくなります。',
        }),
      () =>
        choice(rng, {
          text: '耳で、空気のしん動（音）を最初に受けとってふるえるまくを何といいますか。',
          correct: 'こまく',
          wrong: ['もうまく', '耳小骨', 'うずまき管', '半きかん'],
          explanation: '音はこまくをふるわせ、そのしん動が耳小骨で大きくされて、うずまき管に伝わります。うずまき管でしげきが信号に変わり、神経を通って脳に伝わります。',
        }),
      () =>
        choice(rng, {
          text: '耳の中で、音のしん動を信号に変えて神経に伝えるはたらきをしている部分はどれですか。',
          correct: 'うずまき管',
          wrong: ['こまく', '耳小骨', '耳たぶ', 'こうさい'],
          explanation: '音のしん動は、こまく → 耳小骨 → うずまき管の順に伝わります。うずまき管の中の液体がふるえ、そのしげきが信号に変わります。',
        }),
    ])(),
};

const REFLEX = ['熱いやかんにさわって、思わず手を引っこめた', 'ひざの下をたたかれて、足がはね上がった', '目の前に虫が飛んできて、思わず目をとじた', '食べ物を口に入れると、だ液が出てきた'];
const CONSCIOUS = ['信号が青になったのを見て、歩き出した', '名前をよばれて、ふり向いた', 'ボールが飛んできたのを見て、手でとった', '目覚まし時計の音を聞いて、止めた'];

const upperNerve: Gen = {
  id: 'body-u-nerve',
  make: (rng) =>
    pick(rng, [
      () =>
        oneOf(rng, {
          text: '次のうち、考える前に（無意識に）起こる反応（反射）はどれですか。',
          yes: REFLEX,
          no: CONSCIOUS,
          explanation: 'しげきに対して無意識に起こる反応を反射といいます。信号が脳に伝わる前に、せきずいなどから命令が出るので、すばやく反応でき、からだを守るのに役立ちます。',
        }),
      () =>
        oneOf(rng, {
          text: '次のうち、脳で考えてから行う反応（反射ではないもの）はどれですか。',
          yes: CONSCIOUS,
          no: REFLEX,
          explanation: '見たり聞いたりしたことを脳で判断してから行う反応は、反射ではありません。反射は、脳で考える前に起こります。',
        }),
      () =>
        choice(rng, {
          text: '熱いものにさわって思わず手を引っこめるとき、「手を引っこめろ」という命令を出しているのはどこですか。',
          correct: 'せきずい',
          wrong: ['脳', '心臓', '手の筋肉', '皮ふ'],
          explanation: '反射では、しげきの信号がせきずいに伝わると、せきずいから直接、筋肉に命令が出ます。脳を通らないので、反応が速くなります。「熱い」と感じるのは、そのあとです。',
        }),
      () =>
        choice(rng, {
          text: '手で受けとったしげきが伝わって、手を動かすまでの信号の道すじとして正しいものはどれですか（意識して行う反応の場合）。',
          correct: '皮ふ → 感覚神経 → せきずい → 脳 → せきずい → 運動神経 → 筋肉',
          wrong: [
            '皮ふ → 運動神経 → せきずい → 脳 → せきずい → 感覚神経 → 筋肉',
            '皮ふ → 感覚神経 → 脳 → 筋肉 → 運動神経 → せきずい',
            '皮ふ → 筋肉 → 感覚神経 → 脳 → 運動神経 → せきずい',
          ],
          explanation: '感覚器官で受けとったしげきは、感覚神経を通ってせきずい・脳へ伝わります。脳からの命令は、せきずいを通り、運動神経を通って筋肉に伝わります。',
        }),
      () =>
        choice(rng, {
          text: '脳やせきずいのように、判断や命令を行う神経のまとまりを何といいますか。',
          correct: '中すう神経',
          wrong: ['感覚神経', '運動神経', '末しょう神経'],
          explanation: '脳とせきずいを中すう神経、そこから全身に広がる感覚神経や運動神経などを末しょう神経といいます。',
        }),
    ])(),
};

const lowerPulseCount: Gen = {
  id: 'body-l-pulsecount',
  make: (rng) => {
    const sec = pick(rng, [10, 15, 20, 30]);
    const k = 60 / sec;
    const before = int(rng, 70, 90);
    // 走ったあとは、はかった回数から 1 分間の数を出す (割り切れるように)
    const afterCount = Math.round(before / k) + int(rng, 3, 8);
    const after = afterCount * k;
    return pick(rng, [
      () => {
        const count = Math.round(before / k);
        return numeric(rng, {
          text: `手首に指を当てて、${sec}秒間に脈はくが何回あるかを数えると、${count}回でした。この人の脈はくは、1分間に何回と考えられますか。`,
          correct: count * k,
          wrong: [count, count * (k + 1), count * (k - 1) || count * 2, count + 60, count * 10],
          unit: '回',
          explanation: `1分（60秒）は${sec}秒の ${60} ÷ ${sec} ＝ ${k}倍 です。1分間の脈はくは、${count} × ${k} ＝ ${count * k}（回）と考えられます。`,
        });
      },
      () =>
        numeric(rng, {
          text: `走る前の脈はくは1分間に${before}回でした。その場で走ったあと、すぐに${sec}秒間の脈はくを数えると、${afterCount}回でした。走ったあとの1分間の脈はくは、走る前より何回ふえましたか。`,
          correct: after - before,
          wrong: [after, afterCount, after - before + k, after - before - k, after - before + 10].filter((n) => n > 0),
          unit: '回',
          explanation: `走ったあとの1分間の脈はくは、${afterCount} × ${k} ＝ ${after}回です。走る前より ${after} − ${before} ＝ ${after - before}（回）ふえました。運動すると、からだがたくさんの酸素を必要とするので、心臓が速く動きます。`,
        }),
    ])();
  },
};

const lowerBreathCount: Gen = {
  id: 'body-l-breathcount',
  make: (rng) => {
    const per = pick(rng, [12, 15, 16, 18, 20]); // 1 分間の呼吸の数
    const ml = pick(rng, [400, 500, 600]); // 1 回にすう空気 (mL)
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `じっとしているときに、15秒間に何回息をすうかを数えると、${per / 4}回でした。1分間では、何回息をすうと考えられますか。`,
          correct: per,
          wrong: [per / 4, per * 2, per / 2, per + 4, per + 15],
          unit: '回',
          explanation: `1分（60秒）は15秒の4倍なので、${per / 4} × 4 ＝ ${per}（回）と考えられます。`,
        }),
      () =>
        numeric(rng, {
          text: `ある人は、1回の呼吸で${ml}mLの空気をすいこみ、1分間に${per}回呼吸します。この人が1分間にすいこむ空気は何mLですか。`,
          correct: ml * per,
          wrong: [ml + per, ml * (per - 1), ml * (per + 1), ml * per * 2, ml * 10],
          unit: 'mL',
          explanation: `1回で${ml}mLを、1分間に${per}回すいこむので、${ml} × ${per} ＝ ${ml * per}（mL）です。`,
        }),
    ])();
  },
};

const upperOxygen: Gen = {
  id: 'body-u-oxygen',
  make: (rng) => {
    // すう空気の酸素は約 21%、はいた息では約 17% (体積の割合)
    const ml = pick(rng, [400, 500, 600]);
    const per = pick(rng, [12, 15, 16, 18, 20]);
    const out = pick(rng, [16, 17, 18]);
    const once = (ml * (21 - out)) / 100;
    const intro = `すいこむ空気には体積で21%、はき出す息には${out}%の酸素がふくまれているとします。ある人は、1回の呼吸で${ml}mLの空気をすいこみ、同じ体積の息をはき出します。`;
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `${intro}1回の呼吸で、からだにとり入れられる酸素は何mLですか。`,
          correct: once,
          wrong: [(ml * 21) / 100, (ml * out) / 100, ml * (21 - out), once * 2, once + 10],
          unit: 'mL',
          explanation: `すいこむ酸素は ${ml} × 0.21 ＝ ${fmt((ml * 21) / 100)}mL、はき出す酸素は ${ml} × ${fmt(out / 100)} ＝ ${fmt((ml * out) / 100)}mL です。その差 ${fmt(once)}mL が、肺で血液にとり入れられた酸素です。`,
        }),
      () =>
        numeric(rng, {
          text: `${intro}この人が1分間に${per}回呼吸するとき、1分間にからだにとり入れられる酸素は何mLですか。`,
          correct: once * per,
          wrong: [once, (ml * 21 * per) / 100, once * (per + 1), once * (per - 1), ml * per],
          unit: 'mL',
          explanation: `1回の呼吸でとり入れられる酸素は、${ml} × (0.21 − ${fmt(out / 100)}) ＝ ${fmt(once)}mL です。1分間では ${fmt(once)} × ${per} ＝ ${fmt(once * per)}（mL）です。`,
        }),
    ])();
  },
};

/** ジェネレーターと、それを出す学年 */
export const BODY: Entry[] = [
  forGrades(lowerSenses, 3),
  forGrades(lowerPulse, 3, 4),
  forGrades(lowerPulseCount, 3, 4),
  forGrades(lowerBreathCount, 3, 4),
  forGrades(lowerBones, 4),
  forGrades(lowerJoints, 4),
  forGrades(upperBirth, 5),
  forGrades(upperEye, 5, 6),
  forGrades(upperDigestion, 6),
  forGrades(upperHeart, 6),
  forGrades(upperBreath, 5, 6),
  forGrades(upperOxygen, 5, 6),
  forGrades(upperNerve, 6),
];
