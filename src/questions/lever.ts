import { shuffle, type Rng } from '../core/rng';
import { beam, leverPoints, mobile, tickLever, wheelAxle } from '../diagrams/lever';
import { choice, facts, fixed, forGrades, int, KANA, numeric, oneOf, pick, type Entry, type Gen } from './helpers';

/** 重さ (10g きざみ) と目もり (1〜6) で、左右がつり合う組み合わせをえらぶ */
function balanced(rng: Rng): { w1: number; d1: number; w2: number; d2: number } {
  for (;;) {
    const d1 = int(rng, 1, 6);
    const d2 = int(rng, 1, 6);
    const w1 = int(rng, 1, 12) * 10;
    const w2 = (w1 * d1) / d2;
    if (d1 !== d2 && w2 % 10 === 0 && w2 <= 180) return { w1, d1, w2, d2 };
  }
}

// ---------- 3・4 年むけ (どの学年に出すかは、ファイルの最後の一覧で決める) ----------

const lowerBalance: Gen = {
  id: 'lever-l-balance',
  make: (rng) => {
    const { w1, d1, w2, d2 } = balanced(rng);
    return numeric(rng, {
      text: `図のように、てこの左のうでの目もり${d1}のところに${w1}gのおもりをつるしました。右のうでの目もり${d2}のところに何gのおもりをつるすと、てこは水平につり合いますか。`,
      svg: tickLever([{ pos: -d1, label: `${w1}g` }, { pos: d2, label: '？g' }]),
      correct: w2,
      wrong: [w1, (w1 * d2) / d1, w1 + (d1 - d2) * 10, w2 + 10, w2 - 10, w1 * d1].filter((v) => Number.isInteger(v)),
      unit: 'g',
      explanation: `てこは、左右の「おもりの重さ × 支点からのきょり（目もり）」が等しいときにつり合います。左は ${w1} × ${d1} ＝ ${w1 * d1}。右は □ × ${d2} ＝ ${w1 * d1} なので、□ ＝ ${w1 * d1} ÷ ${d2} ＝ ${w2}（g）です。`,
    });
  },
};

const lowerTilt: Gen = {
  id: 'lever-l-tilt',
  make: (rng) => {
    let w1 = 0;
    let d1 = 0;
    let w2 = 0;
    let d2 = 0;
    if (rng() < 0.3) {
      ({ w1, d1, w2, d2 } = balanced(rng));
    } else {
      do {
        w1 = int(rng, 1, 6) * 10;
        w2 = int(rng, 1, 6) * 10;
        d1 = int(rng, 1, 6);
        d2 = int(rng, 1, 6);
      } while (w1 * d1 === w2 * d2 || (w1 === w2 && d1 === d2));
    }
    const left = w1 * d1;
    const right = w2 * d2;
    const answer = left > right ? '左にかたむく' : left < right ? '右にかたむく' : '水平につり合う';
    return fixed({
      text: `図のように、てこの左のうでの目もり${d1}に${w1}g、右のうでの目もり${d2}に${w2}gのおもりをつるして、そっと手をはなしました。てこはどうなりますか。`,
      svg: tickLever([{ pos: -d1, label: `${w1}g` }, { pos: d2, label: `${w2}g` }]),
      choices: ['左にかたむく', '右にかたむく', '水平につり合う', 'これだけではわからない'],
      correct: answer,
      explanation: `てこをかたむけるはたらきは「おもりの重さ × 支点からのきょり（目もり）」で表せます。左は ${w1} × ${d1} ＝ ${left}、右は ${w2} × ${d2} ＝ ${right} です。${left === right ? '左右が等しいので、水平につり合います。' : `${left > right ? '左' : '右'}の方が大きいので、${answer.replace('く', 'きます')}。`}`,
    });
  },
};

const lowerPosition: Gen = {
  id: 'lever-l-position',
  make: (rng) => {
    const { w1, d1, w2, d2 } = balanced(rng);
    return fixed({
      text: `図のように、てこの左のうでの目もり${d1}のところに${w1}gのおもりをつるしました。${w2}gのおもり1個を右のうでにつるして水平につり合わせるには、目もりのいくつのところにつるせばよいですか。`,
      svg: tickLever([{ pos: -d1, label: `${w1}g` }]),
      choices: pickNumbers(rng, d2),
      correct: `目もり${d2}`,
      explanation: `左は ${w1} × ${d1} ＝ ${w1 * d1}。右も ${w2} × □ ＝ ${w1 * d1} になればよいので、□ ＝ ${w1 * d1} ÷ ${w2} ＝ ${d2}。目もり${d2}のところにつるします。`,
    });
  },
};

/** 正解の目もりと、ほかの目もり 3 つを、小さい順にならべる */
function pickNumbers(rng: Rng, answer: number): string[] {
  const others = shuffle([1, 2, 3, 4, 5, 6].filter((n) => n !== answer), rng).slice(0, 3);
  return [answer, ...others].sort((a, b) => a - b).map((n) => `目もり${n}`);
}

const POINTS = [
  { key: 'fulcrum', name: '支点', q: '棒をささえている「支点」' },
  { key: 'effort', name: '力点', q: '力を加えている「力点」' },
  { key: 'load', name: '作用点', q: 'ものに力がはたらく「作用点」' },
] as const;

const lowerPoints: Gen = {
  id: 'lever-l-points',
  make: (rng) => {
    const letters = shuffle(KANA.slice(0, 4), rng);
    const labels = { load: letters[0], mid: letters[1], fulcrum: letters[2], effort: letters[3] };
    const p = pick(rng, POINTS);
    return fixed({
      text: `図のように、棒を使って重い荷物を持ち上げます。${p.q}は、ア〜エのどれですか。`,
      svg: leverPoints(labels),
      choices: KANA.slice(0, 4),
      correct: labels[p.key],
      explanation: `答えは ${labels[p.key]} です。てこには、棒をささえる「支点」（${labels.fulcrum}）、力を加える「力点」（${labels.effort}）、ものに力がはたらく「作用点」（${labels.load}）の3つの点があります。`,
    });
  },
};

const FULCRUM_MID = ['はさみ', 'くぎぬき', 'ペンチ', 'シーソー', 'バール'];
const LOAD_MID = ['せんぬき', '空きかんつぶし器', '穴あけパンチ', 'くるみわり器'];
const EFFORT_MID = ['ピンセット', 'トング', '糸切りばさみ（にぎりばさみ）', 'パンばさみ'];

const lowerTools: Gen = {
  id: 'lever-l-tools',
  make: (rng) => {
    const v = pick(rng, [
      { q: '支点が、力点と作用点の間にある道具', yes: FULCRUM_MID, no: [...LOAD_MID, ...EFFORT_MID] },
      { q: '作用点が、支点と力点の間にある道具', yes: LOAD_MID, no: [...FULCRUM_MID, ...EFFORT_MID] },
      { q: '力点が、支点と作用点の間にある道具', yes: EFFORT_MID, no: [...FULCRUM_MID, ...LOAD_MID] },
    ]);
    return oneOf(rng, {
      text: `次のうち、${v.q}はどれですか。`,
      yes: v.yes,
      no: v.no,
      explanation: `支点が間にあるのは、${FULCRUM_MID.slice(0, 3).join('・')}など。作用点が間にあるのは、${LOAD_MID.slice(0, 3).join('・')}など。力点が間にあるのは、${EFFORT_MID.slice(0, 2).join('・')}などで、小さい力で細かい作業ができます。`,
    });
  },
};

const lowerRule = facts('lever-l-rule', [
  {
    q: 'てこで重いものを持ち上げます。できるだけ小さい力で持ち上げるには、力点（手で持つところ）をどこにすればよいですか。',
    a: '支点からできるだけ遠いところ',
    wrong: ['支点にできるだけ近いところ', '作用点のすぐとなり', 'どこを持っても同じ'],
    ex: '支点から力点までのきょりが長いほど、小さい力でものを持ち上げることができます。',
  },
  {
    q: 'てこで重いものを持ち上げます。できるだけ小さい力で持ち上げるには、作用点（荷物の位置）をどこにすればよいですか。',
    a: '支点にできるだけ近いところ',
    wrong: ['支点からできるだけ遠いところ', '力点のすぐとなり', 'どこにしても同じ'],
    ex: '支点から作用点までのきょりが短いほど、小さい力でものを持ち上げることができます。',
  },
  {
    q: 'くぎぬきで、くぎをぬきます。小さい力でぬくには、えのどこを持てばよいですか。',
    a: 'えのはしの方（くぎから遠いところ）',
    wrong: ['えのまん中', 'くぎに近いところ', 'どこを持っても同じ'],
    ex: 'くぎぬきは、支点が間にあるてこです。支点から力点までを長くすると、小さい力でくぎをぬくことができます。',
  },
  {
    q: 'はさみであつい紙を切ります。小さい力で切るには、はのどこで切ればよいですか。',
    a: 'はの根もと（支点に近いところ）',
    wrong: ['はの先（支点から遠いところ）', 'はのまん中', 'どこで切っても同じ'],
    ex: 'はさみの支点は、ねじのところです。作用点（紙を切るところ）が支点に近いほど、小さい力で切ることができます。',
  },
  {
    q: 'てこの左右のうでが水平につり合うのは、どんなときですか。',
    a: '左右の「おもりの重さ × 支点からのきょり」が等しいとき',
    wrong: ['左右のおもりの重さが、いつも等しいとき', '左右の「おもりの重さ ＋ 支点からのきょり」が等しいとき', '左右の支点からのきょりが、いつも等しいとき'],
    ex: 'てこをかたむけるはたらきは「おもりの重さ × 支点からのきょり」で表せます。これが左右で等しいとき、てこは水平につり合います。',
  },
]);

const lowerSeesaw: Gen = {
  id: 'lever-l-seesaw',
  make: (rng) =>
    pick(rng, [
      () => {
        const kg = pick(rng, [20, 24, 25, 30]);
        const d = pick(rng, [1, 2, 3]);
        return numeric(rng, {
          text: `シーソーの左がわの、まん中（支点）から${d}mのところに、体重${kg}kgの人がすわりました。同じ体重${kg}kgの人が右がわにすわってつり合わせるには、支点から何mのところにすわればよいですか。`,
          correct: d,
          wrong: [d * 2, d / 2, d + 1, d + 2],
          unit: 'm',
          explanation: `同じ重さどうしは、支点から同じきょりのところでつり合います。だから${d}mのところです。`,
        });
      },
      () =>
        choice(rng, {
          text: '体重の重い人と軽い人がシーソーに乗ります。つり合わせるには、どうすればよいですか。',
          correct: '重い人が、まん中（支点）の近くにすわる',
          wrong: ['軽い人が、まん中（支点）の近くにすわる', '2人とも、いちばんはしにすわる', 'どこにすわっても、つり合わない'],
          explanation: '支点から遠いほど、シーソーをかたむけるはたらきは大きくなります。重い人が支点の近くに、軽い人が遠くにすわると、つり合います。',
        }),
      () =>
        choice(rng, {
          text: '同じ体重の2人が、シーソーのまん中（支点）から同じきょりのところにすわっています。左の人だけが、まん中に近づくと、シーソーはどうなりますか。',
          correct: '右が下がる',
          wrong: ['左が下がる', 'つり合ったまま', '左右にゆれつづける'],
          explanation: '支点に近づくと、かたむけるはたらきは小さくなります。左の人のはたらきが小さくなるので、右が下がります。',
        }),
      () =>
        choice(rng, {
          text: 'てんびんの左右の皿に同じ重さのものをのせると、てんびんはどうなりますか。',
          correct: '水平につり合う',
          wrong: ['左が下がる', '右が下がる', '大きいものをのせた方が下がる'],
          explanation: 'てんびんは、支点から左右の皿までのきょりが同じなので、左右の重さが同じとき水平につり合います。大きさではなく、重さで決まります。',
        }),
    ])(),
};

// ---------- 5・6 年むけ ----------

const upperTwo: Gen = {
  id: 'lever-u-two',
  make: (rng) => {
    for (;;) {
      const [da, db] = shuffle([1, 2, 3, 4, 5, 6], rng).slice(0, 2).sort((x, y) => x - y);
      const wa = int(rng, 1, 6) * 10;
      const wb = int(rng, 1, 6) * 10;
      const d = int(rng, 1, 6);
      const moment = wa * da + wb * db;
      const w = moment / d;
      if (w % 10 !== 0 || w > 200) continue;
      return numeric(rng, {
        text: `図のように、てこの左のうでの目もり${db}に${wb}g、目もり${da}に${wa}gのおもりをつるしました。右のうでの目もり${d}に何gのおもりをつるすと、てこは水平につり合いますか。`,
        svg: tickLever([{ pos: -db, label: `${wb}g` }, { pos: -da, label: `${wa}g` }, { pos: d, label: '？g' }]),
        correct: w,
        wrong: [wa + wb, (wb * db) / d, (wa * da) / d, w + 10, w - 10, w + 20].filter((v) => Number.isInteger(v)),
        unit: 'g',
        explanation: `左のうでをかたむけるはたらきは、${wb} × ${db} ＋ ${wa} × ${da} ＝ ${moment}。右は □ × ${d} ＝ ${moment} なので、□ ＝ ${moment} ÷ ${d} ＝ ${w}（g）です。`,
      });
    }
  },
};

const upperBarWeight: Gen = {
  id: 'lever-u-barweight',
  make: (rng) => {
    for (;;) {
      const length = pick(rng, [60, 80, 100]);
      const a = pick(rng, [10, 20, 25, 30, 40]);
      const bar = int(rng, 2, 12) * 10;
      const arm = length / 2 - a;
      const w = (bar * arm) / a;
      if (arm <= 0 || !Number.isInteger(w) || w > 300) continue;
      return numeric(rng, {
        text: `長さ${length}cm、重さ${bar}gの、太さが一様な棒があります。図のように、左はしから${a}cmのところを支点にして、左はしにおもりをつるすと、棒は水平につり合いました。おもりの重さは何gですか。`,
        svg: beam({
          length,
          fulcrum: a,
          hangs: [{ at: 0, label: '？g' }],
          dims: [{ from: 0, to: a, label: `${a}cm` }, { from: a, to: length, label: `${length - a}cm` }],
          alt: `長さ${length}cmの棒の図。左はしから${a}cmのところに支点があり、左はしに重さのわからないおもりがつるしてある。`,
        }),
        correct: w,
        wrong: [bar, (bar * (length - a)) / a, (bar * a) / arm, bar / 2, w + 10, w * 2].filter((v) => Number.isInteger(v)),
        unit: 'g',
        explanation: `太さが一様な棒の重さは、棒のまん中（左はしから${length / 2}cm）に全部かかっていると考えます。支点からまん中までは ${length / 2} − ${a} ＝ ${arm}cm なので、棒が右にかたむけるはたらきは ${bar} × ${arm} ＝ ${bar * arm}。左は □ × ${a} ＝ ${bar * arm} より、□ ＝ ${w}（g）です。`,
      });
    }
  },
};

const upperScales: Gen = {
  id: 'lever-u-scales',
  make: (rng) => {
    for (;;) {
      const length = pick(rng, [50, 60, 80, 100]);
      const x = pick(rng, [10, 20, 30, 40, 60, 70]);
      const w = int(rng, 2, 15) * 10;
      const right = (w * x) / length;
      const left = w - right;
      if (x >= length || x === length / 2 || right % 5 !== 0) continue;
      const askLeft = rng() < 0.5;
      return numeric(rng, {
        text: `図のように、長さ${length}cmの軽い棒の両はしをばねばかりA・Bでつるし、左はしから${x}cmのところに${w}gのおもりをつるしたところ、棒は水平になりました。ばねばかり${askLeft ? 'A' : 'B'}は何gをしめしますか。棒の重さは考えないものとします。`,
        svg: beam({
          length,
          hangs: [{ at: x, label: `${w}g` }],
          pulls: [{ at: 0, label: 'A' }, { at: length, label: 'B' }],
          dims: [{ from: 0, to: x, label: `${x}cm` }, { from: x, to: length, label: `${length - x}cm` }],
          alt: `長さ${length}cmの棒の両はしを、ばねばかりA（左）とB（右）でつるした図。左はしから${x}cmのところに${w}gのおもりがつるしてある。`,
        }),
        correct: askLeft ? left : right,
        wrong: [left, right, w / 2, w, (w * x) / (length - x)].filter((v) => v !== (askLeft ? left : right) && Number.isInteger(v)),
        unit: 'g',
        explanation: `2つのばねばかりのしめす値の合計は、おもりの重さ${w}gと等しくなります。おもりに近い方に大きな力がかかり、その比は、おもりからのきょりの逆の比になります。A：B ＝ ${length - x}：${x} なので、A ＝ ${w} × ${length - x} ÷ ${length} ＝ ${left}g、B ＝ ${w} × ${x} ÷ ${length} ＝ ${right}g です。`,
      });
    }
  },
};

const upperFulcrum: Gen = {
  id: 'lever-u-fulcrum',
  make: (rng) => {
    const { w1, d1, w2, d2 } = balanced(rng);
    return numeric(rng, {
      text: `図のように、てこの左のうでの目もり${d1}に${w1}g、右のうでの目もり${d2}におもりをつるしたところ、てこは水平につり合いました。このとき、支点が棒をささえている力は何gですか。棒の重さは考えないものとします。`,
      svg: tickLever([{ pos: -d1, label: `${w1}g` }, { pos: d2, label: '？g' }]),
      correct: w1 + w2,
      wrong: [w2, w1, w1 * 2, Math.abs(w1 - w2), w1 + w2 + 10, w1 * d1],
      unit: 'g',
      explanation: `まず右のおもりを求めます。${w1} × ${d1} ＝ □ × ${d2} より、□ ＝ ${w2}g。支点には、つるしたおもりの重さの合計がかかるので、${w1} ＋ ${w2} ＝ ${w1 + w2}（g）です。`,
    });
  },
};

const upperWheel: Gen = {
  id: 'lever-u-wheel',
  make: (rng) => {
    for (;;) {
      const axle = pick(rng, [2, 3, 4, 5, 6]);
      const wheel = axle * pick(rng, [2, 3, 4, 5]);
      if (wheel > 24) continue;
      const load = int(rng, 3, 24) * 10;
      const force = (load * axle) / wheel;
      if (!Number.isInteger(force)) continue;
      const ratio = wheel / axle;
      return pick(rng, [
        () =>
          numeric(rng, {
            text: `図のような輪じく（輪の半径${wheel}cm、じくの半径${axle}cm）があります。じくにまいたひもに${load}gのおもりをつるしました。輪にまいたひもを何gの力で引くと、つり合いますか。`,
            svg: wheelAxle({ wheel, axle, load: `${load}g`, force: '？g' }),
            correct: force,
            wrong: [load * ratio, load, load / 2, force + 10, force * 2].filter((v) => Number.isInteger(v)),
            unit: 'g',
            explanation: `輪じくは、じくの中心を支点とするてこと同じです。「おもりの重さ × じくの半径 ＝ 引く力 × 輪の半径」なので、${load} × ${axle} ＝ □ × ${wheel}。□ ＝ ${load * axle} ÷ ${wheel} ＝ ${force}（g）です。`,
          }),
        () => {
          const up = pick(rng, [5, 10, 20]);
          return numeric(rng, {
            text: `図のような輪じく（輪の半径${wheel}cm、じくの半径${axle}cm）で、じくにつるした${load}gのおもりを${up}cm持ち上げます。輪にまいたひもを何cm引けばよいですか。`,
            svg: wheelAxle({ wheel, axle, load: `${load}g`, force: '引く' }),
            correct: up * ratio,
            wrong: [up, up / ratio, up * ratio * 2, up * (ratio + 1), up + wheel].filter((v) => Number.isInteger(v)),
            unit: 'cm',
            explanation: `輪とじくはいっしょに回るので、ひもの動く長さは半径に比例します。輪の半径はじくの ${wheel} ÷ ${axle} ＝ ${ratio}倍 なので、${up} × ${ratio} ＝ ${up * ratio}（cm）引きます。力は${ratio}分の1ですみますが、引く長さは${ratio}倍になります。`,
          });
        },
      ])();
    }
  },
};

const upperMobile: Gen = {
  id: 'lever-u-mobile',
  make: (rng) => {
    for (;;) {
      const lowL = pick(rng, [5, 10, 15, 20]);
      const lowR = pick(rng, [5, 10, 15, 20]);
      const b = int(rng, 1, 9) * 10;
      const a = (b * lowR) / lowL;
      const upL = pick(rng, [10, 15, 20, 30]);
      const upR = pick(rng, [10, 15, 20, 30, 40]);
      const c = ((a + b) * upL) / upR;
      if (lowL === lowR || upL === upR || a % 10 !== 0 || c % 10 !== 0 || c > 300) continue;
      return numeric(rng, {
        text: `図のように、軽い棒と糸を使って2だんのモビールをつくったところ、どの棒も水平につり合いました。右はしのおもりCは何gですか。棒と糸の重さは考えないものとします。`,
        svg: mobile({ upL, upR, lowL, lowR, a: 'A', b: `${b}g`, c: 'C' }),
        correct: c,
        wrong: [a, a + b, (a * upL) / upR, (b * upL) / upR, c + 10, c * 2].filter((v) => Number.isInteger(v)),
        unit: 'g',
        explanation: `まず下の棒を考えます。A × ${lowL} ＝ ${b} × ${lowR} より、A ＝ ${a}g。下の棒全体の重さ ${a} ＋ ${b} ＝ ${a + b}g が、上の棒の左はしにかかります。上の棒は ${a + b} × ${upL} ＝ C × ${upR} より、C ＝ ${(a + b) * upL} ÷ ${upR} ＝ ${c}（g）です。`,
      });
    }
  },
};

const upperTypes = facts('lever-u-types', [
  {
    q: 'ピンセットのように、力点が支点と作用点の間にあるてこの特ちょうはどれですか。',
    a: '作用点にはたらく力は、加えた力より小さくなる',
    wrong: ['作用点にはたらく力は、加えた力より大きくなる', '作用点にはたらく力は、加えた力といつも同じになる', '力点を動かしたきょりより、作用点が動くきょりの方が小さい'],
    ex: '力点が間にあるてこでは、支点から力点までのきょりの方が短いので、作用点にはたらく力は加えた力より小さくなります。そのかわり、細かい作業がしやすくなります。',
  },
  {
    q: 'せんぬきのように、作用点が支点と力点の間にあるてこの特ちょうはどれですか。',
    a: '作用点にはたらく力は、加えた力よりいつも大きくなる',
    wrong: ['作用点にはたらく力は、加えた力よりいつも小さくなる', '作用点にはたらく力は、加えた力といつも同じになる', '力の向きを変えるだけで、大きさは変わらない'],
    ex: '作用点が間にあるてこでは、支点から力点までのきょりの方がいつも長いので、小さい力で大きな力を出すことができます。',
  },
  {
    q: 'ドライバーでねじを回すとき、にぎるところ（え）が太いドライバーの方が小さい力で回せます。これは何のしくみを利用していますか。',
    a: '輪じく',
    wrong: ['かっ車', 'ふりこ', 'ばね'],
    ex: 'ドライバーは輪じくの一種です。太いえ（輪）を回すと、細いじくに大きな力がはたらきます。水道のじゃ口や自動車のハンドルも輪じくを利用しています。',
  },
  {
    q: '次のうち、輪じくのしくみを利用している道具はどれですか。',
    a: 'ドアノブ',
    wrong: ['ピンセット', 'せんぬき', 'くぎぬき', 'シーソー'],
    ex: 'ドアノブ、ドライバー、水道のじゃ口、自動車のハンドルなどは、大きな輪を回して小さなじくに大きな力をはたらかせる輪じくです。',
  },
  {
    q: 'てこを使うと小さい力で重いものを持ち上げられますが、そのとき力点を動かすきょりはどうなりますか。',
    a: '作用点が動くきょりより長くなる',
    wrong: ['作用点が動くきょりより短くなる', '作用点が動くきょりと同じになる', 'きょりは関係がない'],
    ex: '力が小さくてすむかわりに、動かすきょりは長くなります。「力 × 動かすきょり」（仕事の量）は、道具を使っても変わりません。',
  },
]);

/** ジェネレーターと、それを出す学年 */
export const LEVER: Entry[] = [
  forGrades(lowerPoints, 3),
  forGrades(lowerSeesaw, 3),
  forGrades(lowerTilt, 3, 4),
  forGrades(lowerRule, 3, 4),
  forGrades(lowerBalance, 4),
  forGrades(lowerPosition, 4),
  forGrades(lowerTools, 4),
  forGrades(upperTwo, 5),
  forGrades(upperFulcrum, 5),
  forGrades(upperWheel, 5, 6),
  forGrades(upperTypes, 5, 6),
  forGrades(upperBarWeight, 6),
  forGrades(upperScales, 6),
  forGrades(upperMobile, 6),
];
