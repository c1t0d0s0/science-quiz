import { shuffle } from '../core/rng';
import {
  analyze,
  circuitFig,
  circuitGrid,
  describe,
  fracText,
  fracValue,
  mixedCircuitFig,
  wiringGrid,
  type Circuit,
  type Frac,
  type Wiring,
} from '../diagrams/circuit';
import { choice, facts, fixed, forGrades, KANA, numeric, oneOf, pick, sample, type Entry, type Fact, type Gen } from './helpers';
import { lowerGalvano } from './tools';

const one: Circuit = { cells: 1, cellMode: 's', bulbs: 1, bulbMode: 's' };
const cells = (n: number, mode: 's' | 'p'): Circuit => ({ ...one, cells: n, cellMode: mode });
const bulbs = (n: number, mode: 's' | 'p'): Circuit => ({ ...one, bulbs: n, bulbMode: mode });

// ---------- 3・4 年むけ (どの学年に出すかは、ファイルの最後の一覧で決める) ----------

const lowerWiring: Gen = {
  id: 'bulbs-l-wiring',
  make: (rng) => {
    const kinds = shuffle<Wiring>(['ok', 'side', 'side2', 'open'], rng);
    const list = kinds.map((kind) => ({ kind, flip: rng() < 0.5 }));
    const correct = KANA[kinds.indexOf('ok')];
    return fixed({
      text: '乾電池と豆電球を、図のア〜エのように導線でつなぎました。豆電球に明かりがつくものはどれですか。',
      svg: wiringGrid(list, KANA.slice(0, 4)),
      choices: KANA.slice(0, 4),
      correct,
      explanation: `答えは ${correct} です。乾電池の＋極 → 豆電球 → －極と、1つの輪のように電気の通り道（回路）がつながると、明かりがつきます。導線が乾電池の横の面についていたり、とちゅうで切れていたりすると、明かりはつきません。`,
    });
  },
};

const CONDUCTS = ['鉄のくぎ', 'アルミニウムはく', '10円玉', '1円玉', 'はり金', '金属のスプーン', 'ゼムクリップ（鉄）'];
const INSULATES = ['ガラスのコップ', '紙', '木のわりばし', 'プラスチックのじょうぎ', '消しゴム', 'ペットボトル', 'ぬの'];

const lowerConduct: Gen = {
  id: 'bulbs-l-conduct',
  make: (rng) =>
    pick(rng, [
      () =>
        oneOf(rng, {
          text: '乾電池と豆電球をつないだ回路のとちゅうに、次のものをはさみました。豆電球に明かりがつくものはどれですか。',
          yes: CONDUCTS,
          no: INSULATES,
          explanation: '鉄・銅・アルミニウムなどの金属は電気を通します。ガラス・紙・木・プラスチック・ゴムなどは電気を通しません。',
        }),
      () =>
        oneOf(rng, {
          text: '乾電池と豆電球をつないだ回路のとちゅうに、次のものをはさみました。豆電球に明かりがつかないものはどれですか。',
          yes: INSULATES,
          no: CONDUCTS,
          explanation: 'ガラス・紙・木・プラスチック・ゴムなどは電気を通しません。鉄・銅・アルミニウムなどの金属は電気を通します。',
        }),
      () =>
        choice(rng, {
          text: '色がぬってあるスチールかん（鉄のかん）を回路のとちゅうにはさんでも、豆電球の明かりはつきませんでした。明かりをつけるには、どうすればよいですか。',
          correct: '紙やすりで色のついた部分をけずり、そこに導線をつける',
          wrong: ['かんを水でぬらす', 'かんをあたためる', 'かんを逆さまにする'],
          explanation: 'かんの表面にぬってある色（とりょう）は電気を通しません。けずって金属の部分を出すと、電気が通るようになります。',
        }),
    ])(),
};

const lowerBasics = facts('bulbs-l-basics', [
  {
    q: '乾電池の＋極、豆電球、乾電池の－極が、1つの輪のように導線でつながった電気の通り道を何といいますか。',
    a: '回路',
    wrong: ['電流', 'ソケット', 'スイッチ', 'フィラメント'],
    ex: '電気の通り道を回路といいます。回路が1つの輪のようにつながっているとき、電気が流れて豆電球に明かりがつきます。',
  },
  {
    q: '豆電球の中にあり、電気が流れると光る細い線を何といいますか。',
    a: 'フィラメント',
    wrong: ['ソケット', '導線', 'エナメル線', 'ガラス球'],
    ex: '豆電球の中の細い線をフィラメントといいます。電気が流れると、フィラメントが熱くなって光ります。',
  },
  {
    q: '回路は正しくつないであるのに、豆電球の明かりがつきません。まず調べることとして、あてはまらないものはどれですか。',
    a: '豆電球のガラスの色',
    wrong: ['豆電球がソケットにしっかり入っているか', '乾電池が古くなっていないか', '導線が乾電池の極からはなれていないか', 'フィラメントが切れていないか'],
    ex: '明かりがつかないときは、豆電球がゆるんでいないか、フィラメントが切れていないか、導線がはなれていないか、乾電池が古くないかを調べます。',
  },
  {
    q: 'ソケットを使わずに、豆電球と乾電池と導線1本で明かりをつけます。導線を乾電池の－極につないだとき、もう一方のはしは豆電球のどこにつけますか。豆電球の下の先は、乾電池の＋極につけてあります。',
    a: '豆電球の口金の横（ねじのところ）',
    wrong: ['豆電球のガラスのところ', '豆電球の下の先', 'どこにつけてもよい'],
    ex: '豆電球は、下の先と、口金の横（ねじのところ）が、中のフィラメントの両はしにつながっています。この2か所を通るように回路をつくると、明かりがつきます。',
  },
  {
    q: '導線は、銅の線のまわりをビニルでおおってあります。回路をつくるとき、導線のはしのビニルをむくのはなぜですか。',
    a: 'ビニルは電気を通さないから',
    wrong: ['ビニルは電気をよく通すから', '銅は電気を通さないから', '導線を軽くするため'],
    ex: 'ビニルは電気を通しません。中の銅の線を出して、乾電池や豆電球に直接つけると、電気が通ります。',
  },
  {
    q: '乾電池の、出っぱっている方の極を何といいますか。',
    a: '＋極',
    wrong: ['－極', 'N極', 'S極'],
    ex: '乾電池の出っぱっている方が＋極、平らな方が－極です。',
  },
  {
    q: 'スイッチを入れると豆電球に明かりがつき、切ると消えるのはなぜですか。',
    a: 'スイッチで、電気の通り道がつながったり切れたりするから',
    wrong: ['スイッチで、乾電池が新しくなったり古くなったりするから', 'スイッチで、豆電球があたたまったり冷えたりするから', 'スイッチで、導線が長くなったり短くなったりするから'],
    ex: 'スイッチを入れると回路が1つの輪につながって電気が流れ、明かりがつきます。スイッチを切ると、回路がとちゅうで切れるので、明かりは消えます。',
  },
]);

const lowerCompare: Gen = {
  id: 'bulbs-l-compare',
  make: (rng) => {
    const v = pick(rng, [
      { c: cells(2, 's'), a: '明るくなる', ex: '乾電池2個を直列つなぎにすると、回路に流れる電流が大きくなり、豆電球は明るくなります。' },
      { c: cells(2, 'p'), a: '同じ明るさ', ex: '乾電池2個を並列つなぎにしても、流れる電流の大きさは乾電池1個のときと変わりません。明るさは同じですが、乾電池は長持ちします。' },
      { c: bulbs(2, 's'), a: '暗くなる', ex: '豆電球2個を直列つなぎにすると、電流が流れにくくなり、1個のときより暗くなります。' },
      { c: bulbs(2, 'p'), a: '同じ明るさ', ex: '豆電球2個を並列つなぎにすると、それぞれの豆電球に乾電池1個・豆電球1個のときと同じ大きさの電流が流れるので、明るさは同じです。' },
    ]);
    return fixed({
      text: '図のように、乾電池と豆電球をつなぎました。豆電球1個の明るさは、乾電池1個に豆電球1個をつないだときとくらべてどうなりますか。',
      svg: circuitFig(v.c),
      choices: ['明るくなる', '同じ明るさ', '暗くなる', '明かりがつかない'],
      correct: v.a,
      explanation: `図は「${describe(v.c)}」の回路です。${v.ex}`,
    });
  },
};

const lowerName: Gen = {
  id: 'bulbs-l-name',
  make: (rng) => {
    const n = pick(rng, [2, 3]);
    const v = pick(rng, [
      { c: cells(n, 's'), a: '乾電池の直列つなぎ' },
      { c: cells(n, 'p'), a: '乾電池の並列つなぎ' },
      { c: bulbs(n, 's'), a: '豆電球の直列つなぎ' },
      { c: bulbs(n, 'p'), a: '豆電球の並列つなぎ' },
    ]);
    return fixed({
      text: '図は、乾電池と豆電球をつないだ回路を、記号を使って表したものです。このつなぎ方を何といいますか。',
      svg: circuitFig(v.c),
      choices: ['乾電池の直列つなぎ', '乾電池の並列つなぎ', '豆電球の直列つなぎ', '豆電球の並列つなぎ'],
      correct: v.a,
      explanation: `答えは「${v.a}」です。長い線と短い線の記号が乾電池、丸に×の記号が豆電球です。1本の道すじにならべるつなぎ方が直列つなぎ、道すじを分けてならべるつなぎ方が並列つなぎです。`,
    });
  },
};

const lowerRemove: Gen = {
  id: 'bulbs-l-remove',
  make: (rng) => {
    const v = pick(rng, [
      { c: bulbs(2, 's'), what: '豆電球を1個ソケットからはずす', a: '消える', ex: '直列つなぎでは電気の通り道が1本しかないので、1個はずすと回路が切れて、のこりの豆電球も消えます。' },
      { c: bulbs(2, 'p'), what: '豆電球を1個ソケットからはずす', a: 'ついたままで、明るさも変わらない', ex: '並列つなぎでは電気の通り道が分かれているので、1個はずしても、のこりの豆電球には同じように電流が流れます。' },
      { c: cells(2, 's'), what: '乾電池を1個はずす（はずしたところはつながない）', a: '消える', ex: '乾電池の直列つなぎでは、1個はずすと回路が切れてしまうので、豆電球は消えます。' },
      { c: cells(2, 'p'), what: '乾電池を1個はずす（はずしたところはつながない）', a: 'ついたままで、明るさも変わらない', ex: '乾電池の並列つなぎでは、1個はずしても、のこりの乾電池から電流が流れます。明るさは乾電池1個のときと同じです。' },
      { c: bulbs(2, 's'), what: '豆電球を1個ソケットごととりのぞき、とりのぞいたところを導線でつなぐ', a: 'ついたままで、前より明るくなる', ex: '直列つなぎの豆電球が2個から1個になると、回路に流れる電流が大きくなるので、のこりの豆電球は前より明るくなります。' },
      { c: cells(2, 's'), what: '乾電池を1個とりのぞき、とりのぞいたところを導線でつなぐ', a: 'ついたままで、前より暗くなる', ex: '直列つなぎの乾電池が2個から1個になると、回路に流れる電流が小さくなるので、豆電球は前より暗くなります。' },
    ]);
    return fixed({
      text: `図の回路で、${v.what}と、${v.c.bulbs === 2 ? 'のこりの豆電球' : '豆電球'}はどうなりますか。`,
      svg: circuitFig(v.c),
      choices: ['消える', 'ついたままで、明るさも変わらない', 'ついたままで、前より明るくなる', 'ついたままで、前より暗くなる'],
      correct: v.a,
      explanation: `図は「${describe(v.c)}」の回路です。${v.ex}`,
    });
  },
};

const lowerMotor = facts('bulbs-l-motor', [
  {
    q: '乾電池にモーターをつないで回しました。乾電池の向きを反対にすると、モーターはどうなりますか。',
    a: '反対向きに回る',
    wrong: ['同じ向きに、速く回る', '同じ向きに、おそく回る', '回らなくなる'],
    ex: '乾電池の向きを反対にすると、電流の向きが反対になり、モーターの回る向きも反対になります。',
  },
  {
    q: '回路を流れる電流の向きとして正しいものはどれですか。',
    a: '乾電池の＋極から出て、－極へ流れる',
    wrong: ['乾電池の－極から出て、＋極へ流れる', '＋極と－極の両方から出て、豆電球でぶつかる', '流れる向きは決まっていない'],
    ex: '電流は、乾電池の＋極から出て、豆電球やモーターを通り、－極へ流れます。',
  },
  {
    q: '乾電池2個とモーターでプロペラカーをつくります。いちばん速く走るつなぎ方はどれですか。',
    a: '乾電池2個を直列つなぎにする',
    wrong: ['乾電池2個を並列つなぎにする', '乾電池を1個だけ使う', 'どのつなぎ方でも同じ'],
    ex: '乾電池2個を直列つなぎにすると、電流が大きくなり、モーターは速く回ります。並列つなぎでは、速さは乾電池1個のときと同じです。',
  },
  {
    q: '乾電池2個を並列つなぎにしたとき、乾電池1個のときとくらべたちがいとして正しいものはどれですか。',
    a: '明るさは同じだが、長い時間つけていられる',
    wrong: ['明るくなり、長い時間つけていられる', '明るくなるが、つけていられる時間は短くなる', '暗くなり、つけていられる時間も短くなる'],
    ex: '乾電池の並列つなぎでは、豆電球に流れる電流は乾電池1個のときと同じなので明るさは変わりませんが、乾電池は長持ちします。',
  },
  {
    q: '電流の向きと大きさを調べるときに使う道具はどれですか。',
    a: '検流計',
    wrong: ['温度計', '方位じしん', '上皿てんびん', 'ばねばかり'],
    ex: '検流計は、はりのふれる向きで電流の向きを、ふれる大きさで電流の大きさを調べることができます。',
  },
  {
    q: '光電池にモーターをつなぎました。モーターを速く回すには、どうすればよいですか。',
    a: '光電池に当たる光を強くする',
    wrong: ['光電池に当たる光を弱くする', '光電池を紙でおおう', '光電池を日かげに置く'],
    ex: '光電池は、光が当たると電気をつくります。当たる光が強いほど、大きな電流が流れます。',
  },
  {
    q: '光電池にモーターをつないで回しています。光電池に当たる光を手でさえぎると、モーターはどうなりますか。',
    a: 'おそくなったり、止まったりする',
    wrong: ['速く回るようになる', '反対向きに回りだす', 'まったく変わらない'],
    ex: '光電池は、光が当たると電気をつくります。光をさえぎると、つくる電気がへるので、モーターはおそくなったり止まったりします。',
  },
]);

// ---------- 5・6 年むけ ----------

const ALL: Circuit[] = [];
for (const c of [1, 2, 3]) {
  for (const cm of ['s', 'p'] as const) {
    if (c === 1 && cm === 'p') continue;
    for (const b of [1, 2, 3]) {
      for (const bm of ['s', 'p'] as const) {
        if (b === 1 && bm === 'p') continue;
        ALL.push({ cells: c, cellMode: cm, bulbs: b, bulbMode: bm });
      }
    }
  }
}

const FRACS: Frac[] = [
  { n: 1, d: 3 },
  { n: 1, d: 2 },
  { n: 2, d: 3 },
  { n: 1, d: 1 },
  { n: 3, d: 2 },
  { n: 2, d: 1 },
  { n: 3, d: 1 },
  { n: 4, d: 1 },
  { n: 6, d: 1 },
  { n: 9, d: 1 },
];

/** 分数で答える問題。選択肢は小さい順にならべる */
function fracQuestion(rng: () => number, text: string, svg: string, answer: Frac, explanation: string) {
  const others = sample(rng, FRACS.filter((f) => fracValue(f) !== fracValue(answer)), 3);
  const choices = [answer, ...others].sort((a, b) => fracValue(a) - fracValue(b)).map(fracText);
  return fixed({ text, svg, choices, correct: fracText(answer), explanation });
}

const why = (c: Circuit) => {
  const volt = c.cellMode === 's' ? `乾電池${c.cells}個の直列つなぎなので、電流を流そうとするはたらきは${c.cells}倍` : `乾電池が${c.cells}個でも並列つなぎなので、電流を流そうとするはたらきは1個のときと同じ`;
  const load =
    c.bulbs === 1
      ? ''
      : c.bulbMode === 's'
        ? `豆電球${c.bulbs}個の直列つなぎなので、電流の流れにくさは${c.bulbs}倍になります。`
        : `豆電球${c.bulbs}個の並列つなぎなので、どの豆電球にも、豆電球1個だけをつないだときと同じ大きさの電流が流れます。`;
  return `${c.cells === 1 ? '乾電池は1個です。' : `${volt}です。`}${load}`;
};

const upperCurrent: Gen = {
  id: 'bulbs-u-current',
  make: (rng) => {
    const c = pick(rng, ALL.filter((x) => x.cells + x.bulbs > 2));
    const a = analyze(c);
    return fracQuestion(
      rng,
      '図の回路で、豆電球1個に流れる電流の大きさは、乾電池1個に豆電球1個をつないだときを1とすると、いくつになりますか。乾電池と豆電球はすべて同じものとします。',
      circuitFig(c),
      a.perBulb,
      `図は「${describe(c)}」の回路です。${why(c)}豆電球1個に流れる電流は ${fracText(a.perBulb)} です。`,
    );
  },
};

const upperCell: Gen = {
  id: 'bulbs-u-cell',
  make: (rng) => {
    const c = pick(rng, ALL.filter((x) => (x.bulbs > 1 && x.bulbMode === 'p') || (x.cells > 1 && x.cellMode === 'p')));
    const a = analyze(c);
    return fracQuestion(
      rng,
      '図の回路で、乾電池1個に流れる電流の大きさは、乾電池1個に豆電球1個をつないだときを1とすると、いくつになりますか。乾電池と豆電球はすべて同じものとします。',
      circuitFig(c),
      a.perCell,
      `図は「${describe(c)}」の回路です。豆電球1個に流れる電流は ${fracText(a.perBulb)} で、回路全体に流れる電流は ${fracText(a.total)} です。${
        c.cells > 1 && c.cellMode === 'p' ? `乾電池${c.cells}個の並列つなぎでは、全体の電流を${c.cells}個で分け合うので、` : ''
      }乾電池1個に流れる電流は ${fracText(a.perCell)} です。`,
    );
  },
};

/** 4 つの回路をえらび、value がいちばん大きい (または小さい) ものが 1 つだけになるようにする */
function fourCircuits(rng: () => number, value: (c: Circuit) => number, largest: boolean): { list: Circuit[]; best: number } {
  for (;;) {
    const list = sample(rng, ALL, 4);
    const values = list.map(value);
    const target = largest ? Math.max(...values) : Math.min(...values);
    if (values.filter((v) => v === target).length === 1) return { list, best: values.indexOf(target) };
  }
}

const upperBrightest: Gen = {
  id: 'bulbs-u-brightest',
  make: (rng) => {
    const largest = rng() < 0.6;
    const { list, best } = fourCircuits(rng, (c) => fracValue(analyze(c).perBulb), largest);
    return fixed({
      text: `図のア〜エの回路のうち、豆電球1個の明るさがいちばん${largest ? '明るい' : '暗い'}ものはどれですか。乾電池と豆電球はすべて同じものとします。`,
      svg: circuitGrid(list, KANA.slice(0, 4)),
      choices: KANA.slice(0, 4),
      correct: KANA[best],
      explanation: `乾電池1個・豆電球1個のときを1とすると、豆電球1個に流れる電流は、${list.map((c, i) => `${KANA[i]} が ${fracText(analyze(c).perBulb)}`).join('、')} です。流れる電流が大きいほど明るいので、答えは ${KANA[best]} です。`,
    });
  },
};

const upperLife: Gen = {
  id: 'bulbs-u-life',
  make: (rng) => {
    const longest = rng() < 0.6;
    const { list, best } = fourCircuits(rng, (c) => fracValue(analyze(c).perCell), !longest);
    return fixed({
      text: `図のア〜エの回路のうち、乾電池がいちばん${longest ? '長持ちする' : '早く使えなくなる'}ものはどれですか。乾電池と豆電球はすべて同じものとします。`,
      svg: circuitGrid(list, KANA.slice(0, 4)),
      choices: KANA.slice(0, 4),
      correct: KANA[best],
      explanation: `乾電池1個に流れる電流が小さいほど、乾電池は長持ちします。乾電池1個・豆電球1個のときを1とすると、乾電池1個に流れる電流は、${list.map((c, i) => `${KANA[i]} が ${fracText(analyze(c).perCell)}`).join('、')} です。だから答えは ${KANA[best]} です。`,
    });
  },
};

const upperMixed: Gen = {
  id: 'bulbs-u-mixed',
  make: (rng) => {
    const svg = mixedCircuitFig();
    const intro = '図のように、同じ豆電球A・B・Cと乾電池をつなぎました。';
    return pick(rng, [
      () =>
        choice(rng, {
          text: `${intro}3つの豆電球の明るさについて、正しいものはどれですか。`,
          svg,
          correct: 'Aがいちばん明るく、BとCは同じ明るさ',
          wrong: ['3つとも同じ明るさ', 'BとCが同じ明るさで、Aがいちばん暗い', 'Aがいちばん明るく、次にB、Cがいちばん暗い'],
          explanation: 'Aを流れた電流が、BとCに半分ずつ分かれて流れます。だから、Aがいちばん明るく、BとCはAより暗い同じ明るさになります。',
        }),
      () =>
        choice(rng, {
          text: `${intro}豆電球Bをソケットからはずすと、豆電球Cの明るさは、はずす前とくらべてどうなりますか。`,
          svg,
          correct: '明るくなる',
          wrong: ['暗くなる', '変わらない', '消える'],
          explanation: 'はずす前、Cに流れる電流は（乾電池1個・豆電球1個のときを1として）3分の1です。Bをはずすと、AとCの直列つなぎになり、Cに流れる電流は2分の1にふえます。だからCは明るくなります。',
        }),
      () =>
        choice(rng, {
          text: `${intro}豆電球Bをソケットからはずすと、豆電球Aの明るさは、はずす前とくらべてどうなりますか。`,
          svg,
          correct: '暗くなる',
          wrong: ['明るくなる', '変わらない', '消える'],
          explanation: 'はずす前、Aに流れる電流は（乾電池1個・豆電球1個のときを1として）3分の2です。Bをはずすと、AとCの直列つなぎになり、Aに流れる電流は2分の1にへります。だからAは暗くなります。',
        }),
      () =>
        choice(rng, {
          text: `${intro}豆電球Aをソケットからはずすと、豆電球BとCはどうなりますか。`,
          svg,
          correct: 'BもCも消える',
          wrong: ['BもCも明るくなる', 'BもCも明るさは変わらない', 'Bだけが消える'],
          explanation: 'Aは、乾電池とB・Cをつなぐ1本道のとちゅうにあります。Aをはずすと回路が切れてしまうので、BもCも消えます。',
        }),
    ])();
  },
};

export const upperDevices = facts('bulbs-u-devices', [
  {
    q: '乾電池の＋極と－極を、豆電球などを通さずに導線だけでつないだ回路を何といいますか。',
    a: 'ショート回路',
    wrong: ['直列回路', '並列回路', '中和回路'],
    ex: '導線だけで＋極と－極をつなぐと、とても大きな電流が流れて、導線や乾電池が熱くなります。きけんなので、してはいけません。',
  },
  {
    q: '豆電球と発光ダイオード（LED）を、同じ明るさで光らせたときのちがいとして正しいものはどれですか。',
    a: '発光ダイオードの方が、少ない電気で長く光る',
    wrong: ['豆電球の方が、少ない電気で長く光る', '使う電気の量は同じである', '発光ダイオードの方が、熱くなりやすい'],
    ex: '発光ダイオードは、電気を光に変える効率がよく、豆電球より少ない電気で光ります。豆電球は、電気の多くが熱に変わってしまいます。',
  },
  {
    q: '発光ダイオード（LED）を乾電池につなぐときに、注意しなければならないことはどれですか。',
    a: '＋極と－極を決まった向きにつながないと光らない',
    wrong: ['どちらの向きにつないでも同じように光る', '必ず水の中で使う', '乾電池を3個以上並列つなぎにしないと光らない'],
    ex: '発光ダイオードは、決まった向きに電流が流れたときだけ光ります。長いあしを＋極がわにつなぎます。',
  },
  {
    q: '手回し発電機に豆電球をつないでハンドルを回しました。ハンドルを速く回すと、豆電球はどうなりますか。',
    a: '明るくなる',
    wrong: ['暗くなる', '変わらない', '消える'],
    ex: '手回し発電機は、ハンドルを速く回すほど大きな電流が流れるので、豆電球は明るくなります。',
  },
  {
    q: '手回し発電機にモーターをつないで回しました。ハンドルを逆向きに回すと、どうなりますか。',
    a: '電流の向きが逆になり、モーターが逆向きに回る',
    wrong: ['電流の向きは変わらず、モーターは同じ向きに回る', '電流が流れなくなる', '電流が2倍になる'],
    ex: '手回し発電機のハンドルを逆向きに回すと、電流の向きも逆になります。',
  },
  {
    q: '電気をたくわえることができる器具はどれですか。',
    a: 'コンデンサー',
    wrong: ['発光ダイオード', '豆電球', '電熱線', '検流計'],
    ex: 'コンデンサーは電気をたくわえることができます。手回し発電機でつくった電気をためて、あとで使うことができます。',
  },
  {
    q: '同じ長さで太さのちがう2本の電熱線に、同じ乾電池をそれぞれつなぎました。発熱について正しいものはどれですか。',
    a: '太い電熱線の方が、大きな電流が流れてよく発熱する',
    wrong: ['細い電熱線の方が、大きな電流が流れてよく発熱する', '太さがちがっても、発熱は同じである', '太い電熱線には電流が流れない'],
    ex: '電熱線は太いほど電流が流れやすくなります。同じ乾電池につなぐと、太い電熱線の方が大きな電流が流れて、よく発熱します。',
  },
]);

// ---------- 電気の利用: センサーとプログラム、電気の効率的な使い方 ----------

/** センサーで調べることと、それを使う器具 */
const SENSORS = [
  { sensor: '明るさセンサー', use: 'まわりが暗くなると、自動で明かりがつく街灯' },
  { sensor: '人感センサー', use: '人が近づくと、自動で明かりがつくろうかの照明' },
  { sensor: '温度センサー', use: '部屋が設定した温度になると、自動で運転を弱めるエアコン' },
  { sensor: 'しつ度センサー', use: '部屋の空気がかわくと、自動で運転を始める加しつ器' },
];

/**
 * センサーを 2 つ使って器具を動かすプログラム。a・b は、それぞれのセンサーで調べる条件で、
 * [器具を動かすとき, 動かさないとき] の順。場面は「a のどちらか、b のどちらか」で 4 つある。
 */
const PROGRAMS = [
  { sensors: '人感センサーと明るさセンサー', act: '明かりをつける', stop: '明かりを消す', a: ['人がいる', '人がいない'], b: ['まわりが暗い', 'まわりが明るい'] },
  { sensors: '人感センサーと温度センサー', act: '冷ぼうを運転する', stop: '冷ぼうを止める', a: ['人がいる', '人がいない'], b: ['室温が28℃以上', '室温が28℃より低い'] },
  { sensors: 'しつ度センサーと雨センサー', act: 'ポンプで花だんに水をまく', stop: 'ポンプを止める', a: ['土がかわいている', '土がしめっている'], b: ['雨がふっていない', '雨がふっている'] },
] as const;

export const upperSensor: Gen = {
  id: 'bulbs-u-sensor',
  make: (rng) =>
    pick(rng, [
      () => {
        const pg = pick(rng, PROGRAMS);
        // 「かつ」で動かす形と、「または」で止める形がある。どちらでも、動くのは両方の条件がそろう場面だけ
        const and = pick(rng, [true, false]);
        const scenes = shuffle([0, 1, 2, 3], rng).map((n) => ({ a: n >> 1, b: n & 1 }));
        const answer = scenes.findIndex((sc) => sc.a === 0 && sc.b === 0);
        const scene = (sc: (typeof scenes)[number]) => `${pg.a[sc.a]}、${pg.b[sc.b]}`;
        const rule = and
          ? `もし「${pg.a[0]}」かつ「${pg.b[0]}」なら${pg.act}。そうでなければ${pg.stop}。`
          : `もし「${pg.a[1]}」または「${pg.b[1]}」なら${pg.stop}。そうでなければ${pg.act}。`;
        return fixed({
          text: `${pg.sensors}を使って、次のプログラムをつくりました。\n「${rule}」\n次のア〜エの場面のうち、「${pg.act}」のはどれですか。\n${scenes.map((sc, i) => `${KANA[i]}：${scene(sc)}`).join('\n')}`,
          choices: KANA.slice(0, 4),
          correct: KANA[answer],
          explanation: and
            ? `「かつ」は、2つの条件が両方ともあてはまるときだけです。「${pg.a[0]}」と「${pg.b[0]}」の両方にあてはまるのは ${KANA[answer]} だけです。`
            : `「または」は、どちらか1つでもあてはまれば${pg.stop}という意味です。「${pg.a[1]}」にも「${pg.b[1]}」にもあてはまらないのは ${KANA[answer]}（${scene(scenes[answer])}）だけなので、「${pg.act}」のは ${KANA[answer]} のときだけです。`,
        });
      },
      () => {
        const onSec = pick(rng, [2, 3, 4, 5]);
        const offSec = pick(rng, [1, 2, 3]);
        const times = pick(rng, [3, 4, 5, 6, 10]);
        const total = (onSec + offSec) * times;
        const askOn = pick(rng, [true, false]);
        return numeric(rng, {
          text: `ボタンをおすと、「発光ダイオードを${onSec}秒間つけて、${offSec}秒間消す」ことを${times}回くり返すプログラムをつくりました。ボタンをおしてからプログラムが終わるまでに、${askOn ? '発光ダイオードがついている時間は合わせて' : 'かかる時間は'}何秒ですか。`,
          correct: askOn ? onSec * times : total,
          wrong: askOn ? [total, onSec + times, offSec * times, onSec * (times - 1)] : [onSec * times, (onSec + offSec) * (times - 1), onSec + offSec + times, offSec * times],
          unit: '秒',
          explanation: askOn
            ? `1回のくり返しで${onSec}秒ついているので、${times}回で ${onSec} × ${times} ＝ ${onSec * times}（秒）です。`
            : `1回のくり返しは ${onSec} ＋ ${offSec} ＝ ${onSec + offSec}秒なので、${times}回で ${onSec + offSec} × ${times} ＝ ${total}（秒）です。`,
        });
      },
      () => {
        const s = pick(rng, SENSORS);
        return choice(rng, {
          text: `「${s.use}」には、おもにどのセンサーが使われていますか。`,
          correct: s.sensor,
          wrong: SENSORS.map((x) => x.sensor),
          explanation: `${s.sensor}が、まわりのようすを調べて、その結果に合わせて電気の流れを自動で切りかえています。${SENSORS.map((x) => `${x.sensor}は「${x.use}」`).join('、')}などに使われています。`,
        });
      },
      () =>
        choice(rng, {
          text: '電気の流れを、センサーとプログラムで自動で切りかえる利点として、もっともふさわしいものはどれですか。',
          correct: '必要なときだけ電気を使うので、むだな電気を使わずにすむ',
          wrong: ['電気をたくさん使うほど、明るさがいつも同じになる', '電気をつくる量がふえる', '電気が流れなくても、明かりがつくようになる'],
          explanation: 'センサーでまわりのようすを調べ、プログラムで「必要なときだけ電気を流す」ようにすると、つけっぱなしのような、むだな電気の使い方をへらすことができます。',
        }),
    ])(),
};

const SAVING_FACTS: readonly Fact[] = [
  {
    q: '豆電球（白熱電球）が、発光ダイオードより多くの電気を使うのはなぜですか。',
    a: '電気の多くが、光ではなく熱に変わってしまうから',
    wrong: ['電気の多くが、音に変わってしまうから', '豆電球は電気をたくわえておくから', '豆電球には電流が流れにくいから'],
    ex: '豆電球は、フィラメントが熱くなって光るので、電気の多くが熱に変わります。発光ダイオードは熱くなりにくく、電気を効率よく光に変えます。',
  },
  {
    q: '発電・蓄電・電気の利用の流れとして、正しいものはどれですか。',
    a: '光電池で電気をつくり、コンデンサーにためて、発光ダイオードで光に変える',
    wrong: ['発光ダイオードで電気をつくり、光電池にためて、コンデンサーで光に変える', 'コンデンサーで電気をつくり、発光ダイオードにためて、光電池で光に変える', '豆電球で電気をつくり、モーターにためて、光電池で音に変える'],
    ex: '光電池や手回し発電機で電気をつくり（発電）、コンデンサーや充電池にためて（蓄電）、発光ダイオードやモーターなどで光や運動に変えて使います（利用）。',
  },
  {
    q: '電気を効率よく使うための工夫として、ふさわしくないものはどれですか。',
    a: 'だれもいない部屋の明かりを、つけたままにしておく',
    wrong: ['白熱電球を、発光ダイオードの電球にとりかえる', '人感センサーで、人がいるときだけ明かりがつくようにする', '使わない電気製品のプラグを、コンセントからぬいておく'],
    ex: 'だれもいない部屋の明かりは、むだな電気です。発光ダイオードの電球やセンサーを使ったり、使わない電気製品のプラグをぬいて待機電力をへらしたりすると、電気を効率よく使えます。',
  },
  {
    q: '電気製品を使っていなくても、コンセントにつないでいるだけで使われる電気を何といいますか。',
    a: '待機電力',
    wrong: ['発電', '蓄電', '静電気'],
    ex: 'テレビなどは、使っていないときも、すぐに動けるように少しずつ電気を使っています。これを待機電力といいます。プラグをぬいたり、スイッチつきのタップを使ったりするとへらせます。',
  },
];

export const upperSaving: Gen = {
  id: 'bulbs-u-saving',
  make: (rng) =>
    pick(rng, [
      () => {
        const turns = pick(rng, [20, 30, 50]);
        const bulb = pick(rng, [10, 12, 15, 20]);
        const k = pick(rng, [4, 5, 6, 8]);
        const led = bulb * k;
        return numeric(rng, {
          text: `手回し発電機のハンドルを同じ速さで${turns}回回して、コンデンサーに電気をためました。この電気で豆電球を光らせると${bulb}秒、発光ダイオードを光らせると${led}秒光りつづけました。発光ダイオードは、豆電球の何倍の時間光りましたか。`,
          correct: k,
          wrong: [k - 1, k + 1, k + 2, k * 2],
          unit: '倍',
          explanation: `${led} ÷ ${bulb} ＝ ${k}（倍）です。同じ量の電気で、発光ダイオードの方が長く光るのは、豆電球のように電気の多くを熱に変えてしまわず、効率よく光に変えているからです。`,
        });
      },
      () => {
        const k = pick(rng, [4, 5, 6]);
        const hours = pick(rng, [2, 3, 4, 5]);
        return numeric(rng, {
          text: `ある発光ダイオードの電球は、同じ明るさの白熱電球にくらべて、使う電気の量が${k}分の1です。白熱電球を${hours}時間つけたときと同じ量の電気で、この発光ダイオードの電球は何時間つけられますか。`,
          correct: hours * k,
          wrong: [hours, hours + k, hours / k, hours * k * 2],
          unit: '時間',
          explanation: `使う電気の量が${k}分の1なので、同じ量の電気で${k}倍の時間つけられます。${hours} × ${k} ＝ ${hours * k}（時間）です。`,
        });
      },
      () => {
        const f = pick(rng, SAVING_FACTS);
        return choice(rng, { text: f.q, correct: f.a, wrong: f.wrong, explanation: f.ex });
      },
    ])(),
};


const lowerPair: Gen = {
  id: 'bulbs-l-pair',
  make: (rng) => {
    // 2 つを 1 列につないではさむので、両方が電気を通すときだけ明かりがつく
    const [a, b] = pick(rng, [
      () => sample(rng, CONDUCTS, 2),
      () => shuffle([pick(rng, CONDUCTS), pick(rng, INSULATES)], rng),
      () => sample(rng, INSULATES, 2),
    ])();
    const ok = CONDUCTS.includes(a) && CONDUCTS.includes(b);
    const bad = [a, b].filter((x) => !CONDUCTS.includes(x));
    return fixed({
      text: `乾電池と豆電球をつないだ回路のとちゅうを切って、「${a}」と「${b}」を1列にならべてつなぎ、間にはさみました。豆電球の明かりはつきますか。`,
      choices: ['つく', 'つかない', 'はじめだけつく', 'これだけではわからない'],
      correct: ok ? 'つく' : 'つかない',
      explanation: ok
        ? `${a}も${b}も金属なので、電気を通します。電気の通り道（回路）が1つの輪になるので、明かりがつきます。`
        : `${bad.join('と')}は電気を通さないので、そこで電気の通り道が切れてしまい、明かりはつきません。1列につないだときは、全部が電気を通すものでないと明かりはつきません。`,
    });
  },
};

/** ジェネレーターと、それを出す学年 */
export const BULBS: Entry[] = [
  forGrades(lowerWiring, 3),
  forGrades(lowerConduct, 3),
  forGrades(lowerBasics, 3),
  forGrades(lowerPair, 3),
  forGrades(lowerCompare, 4),
  forGrades(lowerName, 4),
  forGrades(lowerMotor, 4),
  forGrades(lowerGalvano, 4),
  forGrades(lowerRemove, 4, 5),
  forGrades(upperCurrent, 5, 6),
  forGrades(upperBrightest, 5, 6),
  forGrades(upperLife, 5, 6),
  forGrades(upperCell, 6),
  forGrades(upperMixed, 6),
  forGrades(upperSensor, 6),
  forGrades(upperSaving, 6),
];
