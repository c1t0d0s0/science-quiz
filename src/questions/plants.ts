import { shuffle } from '../core/rng';
import { flowerFig, plantFig } from '../diagrams/biology';
import { choice, facts, fixed, forGrades, int, KANA, numeric, oneOf, pick, type Entry, type Gen } from './helpers';
import { upperMicroscope } from './tools';

// ---------- 3・4 年むけ (どの学年に出すかは、ファイルの最後の一覧で決める) ----------

const PARTS = [
  { key: 'root', name: '根', role: '土の中の水や養分をとり入れる', ex: '根は土の中に広がって、水や養分をとり入れ、からだをささえます。' },
  { key: 'stem', name: 'くき', role: '根からとり入れた水を、葉や花まで運ぶ', ex: 'くきは水や養分の通り道で、葉や花をささえています。' },
  { key: 'leaf', name: '葉', role: '日光を受けて、養分をつくる', ex: '葉は日光を受けて、成長に必要な養分（でんぷん）をつくります。' },
  { key: 'flower', name: '花', role: 'やがて実になり、たねをつくる', ex: '花がさいたあとに実ができ、その中にたねができます。' },
] as const;

const lowerParts: Gen = {
  id: 'plants-l-parts',
  make: (rng) => {
    const letters = shuffle(KANA.slice(0, 4), rng);
    const labels = { flower: letters[0], leaf: letters[1], stem: letters[2], root: letters[3] };
    const part = pick(rng, PARTS);
    return fixed({
      text: `図は、ある植物のからだのつくりです。「${part.role}」はたらきをしている部分は、ア〜エのどれですか。`,
      svg: plantFig(labels),
      choices: KANA.slice(0, 4),
      correct: labels[part.key],
      explanation: `答えは「${part.name}」の ${labels[part.key]} です。${part.ex}`,
    });
  },
};

const SEASON_FLOWERS: Record<string, string[]> = {
  春: ['サクラ', 'タンポポ', 'チューリップ', 'アブラナ'],
  夏: ['ヒマワリ', 'アサガオ', 'ヘチマ', 'ホウセンカ'],
  秋: ['コスモス', 'ヒガンバナ', 'キク', 'キンモクセイ'],
  冬: ['サザンカ', 'スイセン'],
};

const lowerSeason: Gen = {
  id: 'plants-l-season',
  make: (rng) => {
    const season = pick(rng, Object.keys(SEASON_FLOWERS));
    const others = Object.keys(SEASON_FLOWERS).filter((s) => s !== season);
    const correct = pick(rng, SEASON_FLOWERS[season]);
    return choice(rng, {
      text: `次の植物のうち、ふつう${season}に花がさくものはどれですか。`,
      correct,
      wrong: others.map((s) => pick(rng, SEASON_FLOWERS[s])),
      explanation: `${correct}は${season}に花がさきます。${others.map((s) => `${s}は${SEASON_FLOWERS[s].slice(0, 2).join('・')}`).join('、')}などがさきます。`,
    });
  },
};

const lowerHechima = facts('plants-l-hechima', [
  {
    q: 'ヘチマのようすを1年間かんさつしました。夏のころのようすとして正しいものはどれですか。',
    a: 'くきがぐんぐんのびて葉がしげり、花がさく',
    wrong: ['たねから芽が出て、子葉が開く', '実が大きくなり、やがて茶色くなってかれていく', '葉もくきもかれて、たねだけが残っている'],
    ex: 'ヘチマは気温が高い夏にいちばんよく成長し、花をさかせます。春は芽が出るころ、秋は実がじゅくすころ、冬はかれてたねだけが残ります。',
  },
  {
    q: 'ヘチマのようすを1年間かんさつしました。秋のころのようすとして正しいものはどれですか。',
    a: '実が大きくなり、やがて茶色くなってかれていく',
    wrong: ['たねから芽が出て、子葉が開く', 'くきがぐんぐんのびて葉がしげり、花がさきはじめる', '土の中の根だけが生きていて、春を待っている'],
    ex: '秋になるとヘチマの実は大きくなってじゅくし、葉やくきはかれていきます。ヘチマはたねで冬をこすので、根も冬にはかれてしまいます。',
  },
  {
    q: 'ヘチマのくきは、1年のうちでいつごろいちばんよくのびますか。',
    a: '気温が高い夏',
    wrong: ['あたたかくなりはじめた春', 'すずしくなってきた秋', '気温が低い冬'],
    ex: '植物は、気温が高くなるとよく成長します。ヘチマのくきは夏にいちばんよくのびます。',
  },
  {
    q: 'ヘチマは、冬をどのようなすがたですごしますか。',
    a: 'たねのすがたですごす',
    wrong: ['葉を落とし、えだに芽をつけてすごす', '葉を地面に広げてすごす', '土の中のくきや根だけですごす'],
    ex: 'ヘチマは秋にかれてしまい、たねのすがたで冬をこします。サクラはえだの芽（冬芽）、タンポポは地面に広げた葉で冬をこします。',
  },
]);

const lowerWinter = facts('plants-l-winter', [
  {
    q: 'サクラは、冬をどのようなすがたですごしますか。',
    a: '葉を落とし、えだに芽をつけてすごす',
    wrong: ['たねだけを残して、全体がかれる', '葉を地面に広げてすごす', '緑色の葉をたくさんつけたまますごす'],
    ex: 'サクラは秋に葉を落とし、えだについた冬芽で冬をこします。春になると、この芽から花や葉が出てきます。',
  },
  {
    q: 'タンポポは、冬をどのようなすがたですごしますか。',
    a: '葉を地面にぴったり広げてすごす',
    wrong: ['たねだけを残して、全体がかれる', 'えだに芽をつけてすごす', 'くきを高くのばして花をさかせる'],
    ex: 'タンポポは、葉を地面に広げたすがた（ロゼット）で冬をこします。風をさけ、日光をたくさん受けることができます。',
  },
  {
    q: '次の植物のうち、冬にはかれてしまい、たねで冬をこすものはどれですか。',
    a: 'アサガオ',
    wrong: ['サクラ', 'タンポポ', 'イチョウ', 'ツバキ'],
    ex: 'アサガオやヘチマ、ヒマワリは、秋にかれてたねで冬をこします。サクラやイチョウは冬芽で、タンポポは地面に広げた葉で冬をこします。',
  },
]);

const lowerSprout = facts('plants-l-sprout', [
  {
    q: 'ホウセンカやヒマワリのたねをまいたあと、さいしょに出てくる葉を何といいますか。',
    a: '子葉',
    wrong: ['本葉', '冬芽', 'つぼみ', 'がく'],
    ex: 'たねからさいしょに出てくる葉を子葉といいます。そのあとに出てくる葉は本葉といい、子葉とは形がちがいます。',
  },
  {
    q: 'ホウセンカのたねをまくと、子葉は何まい出てきますか。',
    a: '2まい',
    wrong: ['1まい', '3まい', '4まい'],
    ex: 'ホウセンカ、ヒマワリ、アサガオの子葉は2まいです。',
  },
  {
    q: 'ヒマワリが育つじゅんばんとして正しいものはどれですか。',
    a: 'たね → 子葉 → 本葉 → 花 → 実（たね）',
    wrong: ['たね → 本葉 → 子葉 → 花 → 実（たね）', 'たね → 花 → 子葉 → 本葉 → 実（たね）', 'たね → 子葉 → 花 → 本葉 → 実（たね）'],
    ex: 'たねから子葉が出て、次に本葉が出ます。くきがのびて葉がふえ、花がさいたあとに実ができて、たねができます。',
  },
  {
    q: '植物のからだは、どれも同じ3つの部分からできています。その3つとはどれですか。',
    a: '根・くき・葉',
    wrong: ['根・花・実', 'くき・花・たね', '葉・花・実'],
    ex: '植物のからだは、根・くき・葉の3つの部分からできています。葉はくきについていて、根はくきの下からのびています。',
  },
]);

const SEPARATE = ['ヘチマ', 'カボチャ', 'キュウリ', 'ツルレイシ（ゴーヤ）'];
const TOGETHER = ['アサガオ', 'ホウセンカ', 'サクラ', 'アブラナ', 'チューリップ', 'タンポポ'];

const lowerFlowers: Gen = {
  id: 'plants-l-flowers',
  make: (rng) =>
    pick(rng, [
      () =>
        oneOf(rng, {
          text: '次の植物のうち、「おばな」と「めばな」の2しゅるいの花がさくものはどれですか。',
          yes: SEPARATE,
          no: TOGETHER,
          explanation: `${SEPARATE.join('、')}などは、おばなとめばなが別々にさきます。実になるのは、めばなです。`,
        }),
      () =>
        choice(rng, {
          text: 'ヘチマには、おばなとめばながさきます。やがて実になるのはどちらですか。',
          correct: 'めばな',
          wrong: ['おばな', 'おばなとめばなの両方', 'どちらも実にならない'],
          explanation: '実になるのはめばなです。めばなのつけ根には、小さな実のようなふくらみがあります。おばなは花粉を出します。',
        }),
      () =>
        choice(rng, {
          text: 'ヘチマのおばなとめばなを見分けるには、どこを見ればよいですか。',
          correct: '花のつけ根に、小さな実のようなふくらみがあるかどうか',
          wrong: ['花びらの色が黄色かどうか', '花びらが5つに分かれているかどうか', '花が朝にさくかどうか'],
          explanation: 'めばなのつけ根には、小さな実のようなふくらみがあります。おばなにはふくらみがなく、花粉を出すおしべがあります。',
        }),
    ])(),
};

// ---------- 5・6 年むけ ----------

const upperSprout: Gen = {
  id: 'plants-u-sprout',
  make: (rng) => {
    // 発芽に必要なのは、水・空気・適当な温度の 3 つ。1 つだけ条件がそろうものを作る
    const light = () => pick(rng, ['明るい所', '暗い所']);
    const setups = shuffle(
      [
        { water: 'しめらせただっし綿の上', temp: '25℃', light: pick(rng, ['暗い所', '暗い所', '明るい所']), ok: true },
        { water: 'かわいただっし綿の上', temp: '25℃', light: light(), ok: false },
        { water: '種子が完全にしずむ深さの水の中', temp: '25℃', light: light(), ok: false },
        { water: 'しめらせただっし綿の上', temp: '5℃（冷ぞう庫の中）', light: '暗い所', ok: false },
      ],
      rng,
    );
    const correct = KANA[setups.findIndex((s) => s.ok)];
    return fixed({
      text:
        'インゲンマメの種子を、次のア〜エの条件に置きました。発芽するものはどれですか。\n' +
        setups.map((s, i) => `${KANA[i]}：${s.water}・${s.temp}・${s.light}`).join('\n'),
      choices: KANA.slice(0, 4),
      correct,
      explanation: `答えは ${correct} です。発芽に必要な条件は「水」「空気」「適当な温度」の3つです。水にしずめると空気が足りず、冷ぞう庫の中では温度が低すぎます。光や肥料は発芽には必要ありません。`,
    });
  },
};

const WITH_ENDOSPERM = ['イネ', 'トウモロコシ', 'カキ', 'ムギ'];
const NO_ENDOSPERM = ['インゲンマメ', 'ダイズ', 'アサガオ', 'ヘチマ', 'アブラナ', 'ヒマワリ', 'クリ'];

const upperSeed: Gen = {
  id: 'plants-u-seed',
  make: (rng) =>
    pick(rng, [
      () =>
        oneOf(rng, {
          text: '次の植物のうち、発芽のための養分を「はい乳」にたくわえている種子をつくるものはどれですか。',
          yes: WITH_ENDOSPERM,
          no: NO_ENDOSPERM,
          explanation: `${WITH_ENDOSPERM.join('、')}などは、はい乳に養分をたくわえています（有はい乳種子）。インゲンマメやアサガオなどは、子葉に養分をたくわえています（無はい乳種子）。`,
        }),
      () =>
        oneOf(rng, {
          text: '次の植物のうち、発芽のための養分を「子葉」にたくわえている種子をつくるものはどれですか。',
          yes: NO_ENDOSPERM,
          no: WITH_ENDOSPERM,
          explanation: `${NO_ENDOSPERM.slice(0, 5).join('、')}などは、子葉に養分をたくわえています（無はい乳種子）。イネ、トウモロコシ、カキなどは、はい乳にたくわえています。`,
        }),
      () =>
        choice(rng, {
          text: '発芽してしばらくたったインゲンマメの子葉を切り、ヨウ素液をつけました。発芽前の種子の子葉とくらべると、色の変化はどうなりますか。',
          correct: '発芽前より色の変化が小さい（うすい）',
          wrong: ['発芽前より色の変化が大きい（こい）', '発芽前とまったく同じ', '赤色に変わる'],
          explanation: '子葉にたくわえられていたでんぷんは、発芽と成長のために使われます。そのため、発芽後の子葉はしぼみ、ヨウ素液につけてもあまり青むらさき色になりません。',
        }),
    ])(),
};

const upperTranspiration: Gen = {
  id: 'plants-u-transpiration',
  make: (rng) => {
    const stem = int(rng, 1, 3);
    const front = int(rng, 2, 5);
    const back = int(rng, 8, 15);
    const a = front + back + stem;
    const b = back + stem; // 葉の表にワセリン
    const c = front + stem; // 葉の裏にワセリン
    const target = pick(rng, [
      { name: '葉の裏', value: back, how: `A − C ＝ ${a} − ${c} ＝ ${back}`, why: 'A と C のちがいは、葉の裏から水が出るかどうかだけ' },
      { name: '葉の表', value: front, how: `A − B ＝ ${a} − ${b} ＝ ${front}`, why: 'A と B のちがいは、葉の表から水が出るかどうかだけ' },
      { name: 'くき', value: stem, how: `B ＋ C − A ＝ ${b} ＋ ${c} − ${a} ＝ ${stem}`, why: 'B は「裏＋くき」、C は「表＋くき」、A は「表＋裏＋くき」' },
    ]);
    return numeric(rng, {
      text:
        '葉の大きさと数が同じ枝を3本用意し、水の入った試験管にさして、水面に油をうかべました。数時間後、へった水の量は次のようになりました。\n' +
        `A：何もしない枝 … ${a}cm³\n` +
        `B：葉の表にワセリンをぬった枝 … ${b}cm³\n` +
        `C：葉の裏にワセリンをぬった枝 … ${c}cm³\n` +
        `${target.name}から出ていった水の量は何cm³ですか。`,
      correct: target.value,
      wrong: [stem, front, back, a - stem, b, c].filter((v) => v !== target.value),
      unit: 'cm³',
      explanation: `${target.why}なので、${target.how}（cm³）です。ワセリンをぬった面からは水が出ていきません。葉の裏には気孔が多いので、裏からの蒸散がいちばん多くなります。`,
    });
  },
};

const FLOWER_PARTS = [
  { key: 'pistil', name: 'めしべ', q: '先に花粉がつき、根もとがふくらんで実になる部分' },
  { key: 'stamen', name: 'おしべ', q: '花粉をつくる部分' },
  { key: 'petal', name: '花びら', q: '色や形で虫を引きよせる部分' },
  { key: 'sepal', name: 'がく', q: '花のいちばん外がわにあり、つぼみのときに中を守っている部分' },
] as const;

const upperFlower: Gen = {
  id: 'plants-u-flower',
  make: (rng) => {
    const letters = shuffle(KANA.slice(0, 4), rng);
    const labels = { petal: letters[0], sepal: letters[1], stamen: letters[2], pistil: letters[3] };
    const part = pick(rng, FLOWER_PARTS);
    return fixed({
      text: `図は、ある花をたてに切ったようすです。「${part.q}」は、ア〜エのどれですか。`,
      svg: flowerFig(labels),
      choices: KANA.slice(0, 4),
      correct: labels[part.key],
      explanation: `答えは「${part.name}」の ${labels[part.key]} です。花は外がわから、がく・花びら・おしべ・めしべの順にならんでいます。`,
    });
  },
};

const upperPollination = facts('plants-u-pollination', [
  {
    q: 'おしべでつくられた花粉が、めしべの先（柱頭）につくことを何といいますか。',
    a: '受粉',
    wrong: ['受精', '発芽', '蒸散', '光合成'],
    ex: '花粉がめしべの柱頭につくことを受粉といいます。受粉すると、めしべのもとの部分（子房）が実になり、中のはいしゅが種子になります。',
  },
  {
    q: '受粉したあと、成長して「実」になるのは、めしべのどの部分ですか。',
    a: '子房',
    wrong: ['柱頭', 'はいしゅ', 'やく', 'がく'],
    ex: 'めしべのもとのふくらんだ部分を子房といい、受粉後に実になります。子房の中のはいしゅは種子になります。',
  },
  {
    q: 'アサガオのつぼみのおしべを全部とりのぞき、ふくろをかぶせておきました。花がさいても何もしなかった場合、実はどうなりますか。',
    a: '受粉しないので、実はできない',
    wrong: ['おしべがなくても、ふつうに実ができる', 'ふつうより大きな実ができる', 'たねのない実ができる'],
    ex: '実ができるには受粉が必要です。おしべをとり、ふくろをかぶせると花粉がめしべにつかないので、実はできません。',
  },
  {
    q: '花粉が風で運ばれる花（風ばい花）の特ちょうとして正しいものはどれですか。',
    a: '花びらが目立たず、軽い花粉をたくさんつくる',
    wrong: ['花びらが大きく、あまいみつを出す', '花粉がねばねばしていて、虫のからだにつきやすい', '強いかおりで虫を引きよせる'],
    ex: 'マツ、スギ、イネ、トウモロコシなどは風で花粉を運びます。虫を引きよせる必要がないので花は目立たず、軽くてさらさらした花粉をたくさんつくります。',
  },
]);

const MONOCOT = ['イネ', 'トウモロコシ', 'ユリ', 'ツユクサ', 'チューリップ', 'ススキ', 'ムギ'];
const DICOT = ['アサガオ', 'アブラナ', 'タンポポ', 'ヒマワリ', 'サクラ', 'ヘチマ', 'エンドウ', 'ホウセンカ'];

const upperClass: Gen = {
  id: 'plants-u-class',
  make: (rng) => {
    const v = pick(rng, [
      { q: '子葉が1まいの植物（単子葉類）', yes: MONOCOT, no: DICOT },
      { q: '葉のすじ（葉脈）が平行になっている植物', yes: MONOCOT, no: DICOT },
      { q: '根がひげ根になっている植物', yes: MONOCOT, no: DICOT },
      { q: '子葉が2まいの植物（双子葉類）', yes: DICOT, no: MONOCOT },
      { q: '葉のすじ（葉脈）があみの目のようになっている植物', yes: DICOT, no: MONOCOT },
      { q: '根が、太い主根とそこから出る側根からできている植物', yes: DICOT, no: MONOCOT },
    ]);
    return oneOf(rng, {
      text: `次のうち、${v.q}はどれですか。`,
      yes: v.yes,
      no: v.no,
      explanation:
        '単子葉類（イネ、トウモロコシ、ユリ、ツユクサなど）は、子葉が1まい・葉脈が平行・ひげ根です。双子葉類（アサガオ、アブラナ、タンポポなど）は、子葉が2まい・葉脈があみ目状・主根と側根です。',
    });
  },
};

const GAMOPETALOUS = ['アサガオ', 'タンポポ', 'ヒマワリ', 'ツツジ', 'ヘチマ', 'カボチャ', 'キク'];
const POLYPETALOUS = ['サクラ', 'アブラナ', 'エンドウ', 'ホウセンカ', 'バラ', 'ウメ'];

const upperPetal: Gen = {
  id: 'plants-u-petal',
  make: (rng) =>
    pick(rng, [
      () =>
        oneOf(rng, {
          text: '次のうち、花びらが根もとでくっついている花（合弁花）をさかせる植物はどれですか。',
          yes: GAMOPETALOUS,
          no: POLYPETALOUS,
          explanation: `${GAMOPETALOUS.slice(0, 5).join('、')}などは、花びらがくっついている合弁花です。サクラ、アブラナ、エンドウなどは、花びらが1まいずつはなれている離弁花です。`,
        }),
      () =>
        oneOf(rng, {
          text: '次のうち、花びらが1まいずつはなれている花（離弁花）をさかせる植物はどれですか。',
          yes: POLYPETALOUS,
          no: GAMOPETALOUS,
          explanation: `${POLYPETALOUS.slice(0, 4).join('、')}などは、花びらが1まいずつはなれている離弁花です。アサガオ、タンポポ、ツツジなどは、花びらがくっついている合弁花です。`,
        }),
      () =>
        oneOf(rng, {
          text: '次のうち、花粉がおもに風で運ばれる植物はどれですか。',
          yes: ['マツ', 'スギ', 'イネ', 'トウモロコシ', 'ススキ'],
          no: ['アブラナ', 'サクラ', 'ヒマワリ', 'ツツジ', 'カボチャ', 'リンゴ'],
          explanation: 'マツ、スギ、イネ、トウモロコシ、ススキなどは、風で花粉が運ばれる風ばい花です。アブラナやサクラなどは、虫が花粉を運ぶ虫ばい花です。',
        }),
    ])(),
};

const upperPhotosynthesis = facts('plants-u-photosynthesis', [
  {
    q: '植物が日光を受けて、でんぷんなどの養分をつくるはたらきを何といいますか。',
    a: '光合成',
    wrong: ['呼吸', '蒸散', '受粉', '発芽'],
    ex: '光合成は、葉の緑色の部分（葉緑体）で、水と二酸化炭素を材料に、光のエネルギーを使ってでんぷんと酸素をつくるはたらきです。',
  },
  {
    q: '光合成の材料になるものの組み合わせはどれですか。',
    a: '水と二酸化炭素',
    wrong: ['水と酸素', '酸素と二酸化炭素', 'でんぷんと酸素', 'ちっ素と水'],
    ex: '光合成では、根からすい上げた水と、気孔からとり入れた二酸化炭素を材料にして、でんぷんと酸素をつくります。',
  },
  {
    q: '前の日の夕方から葉の一部をアルミニウムはくでおおい、次の日に日光を十分に当てました。この葉をヨウ素液につけると、どうなりますか。',
    a: 'おおわなかった部分だけが青むらさき色になる',
    wrong: ['おおった部分だけが青むらさき色になる', '葉全体が青むらさき色になる', '葉のどこも色が変わらない'],
    ex: '日光が当たった部分だけで光合成が行われ、でんぷんができます。ヨウ素液はでんぷんがあると青むらさき色になります。',
  },
  {
    q: '葉のでんぷんを調べるとき、葉をあたためたエタノールにつけるのはなぜですか。',
    a: '葉の緑色をぬいて、ヨウ素液の色の変化を見やすくするため',
    wrong: ['葉のでんぷんをふやすため', '葉をやわらかくして、ヨウ素液をしみこみやすくするため', '葉についた細きんをころすため'],
    ex: 'エタノールは葉の緑色の成分（葉緑素）をとかし出します。葉が白っぽくなるので、ヨウ素液による色の変化が見やすくなります。',
  },
  {
    q: '植物の呼吸について、正しく説明しているものはどれですか。',
    a: '昼も夜も、一日中行っている',
    wrong: ['夜だけ行っている', '昼だけ行っている', '植物は呼吸をしない'],
    ex: '植物も動物と同じように、一日中呼吸をして酸素をとり入れ、二酸化炭素を出しています。昼は光合成の方がさかんなので、全体としては酸素を出しています。',
  },
  {
    q: '葉の表面にあり、水蒸気を出したり、酸素や二酸化炭素を出し入れしたりする小さなあなを何といいますか。',
    a: '気孔',
    wrong: ['道管', '師管', '葉緑体', '柱頭'],
    ex: '気孔は、三日月形の2つの細ぼう（孔辺細ぼう）にかこまれたすきまで、ふつう葉の裏に多くあります。',
  },
]);

/** ジェネレーターと、それを出す学年 */
export const PLANTS: Entry[] = [
  forGrades(lowerParts, 3),
  forGrades(lowerSprout, 3),
  forGrades(lowerSeason, 3, 4),
  forGrades(lowerHechima, 4),
  forGrades(lowerWinter, 4),
  forGrades(lowerFlowers, 4, 5),
  forGrades(upperSprout, 5),
  forGrades(upperSeed, 5),
  forGrades(upperFlower, 5),
  forGrades(upperPollination, 5),
  forGrades(upperMicroscope, 5, 6),
  forGrades(upperClass, 5, 6),
  forGrades(upperTranspiration, 6),
  forGrades(upperPetal, 6),
  forGrades(upperPhotosynthesis, 6),
];
