import { shuffle } from '../core/rng';
import { pendulumGrid } from '../diagrams/physics';
import { choice, facts, fixed, fmt, forGrades, int, KANA, numeric, pick, type Entry, type Gen } from './helpers';

const lowerWind: Gen = {
  id: 'motion-l-wind',
  make: (rng) =>
    pick(rng, [
      () => {
        const weak = int(rng, 1, 3);
        const strong = weak + int(rng, 2, 5);
        return numeric(rng, {
          text: `ほをつけた車に、送風機で風を当てて走らせました。弱い風のときは${weak}m、強い風のときは${strong}m進みました。強い風のときは、弱い風のときより何m長く進みましたか。`,
          correct: strong - weak,
          wrong: [strong, weak, strong + weak, strong - weak + 1, strong - weak + 2],
          unit: 'm',
          explanation: `${strong} − ${weak} ＝ ${strong - weak}（m）です。風が強いほど、ものを動かすはたらきは大きくなります。`,
        });
      },
      () =>
        choice(rng, {
          text: 'ほをつけた車に風を当てて走らせます。風を強くすると、車の進むきょりはどうなりますか。',
          correct: '長くなる',
          wrong: ['短くなる', '変わらない', '進まなくなる'],
          explanation: '風には、ものを動かすはたらきがあります。風が強いほど、そのはたらきは大きくなり、車は遠くまで進みます。',
        }),
      () =>
        choice(rng, {
          text: '同じ強さの風で、車をできるだけ遠くまで走らせるには、ほをどうすればよいですか。',
          correct: 'ほを大きくして、風をたくさん受けるようにする',
          wrong: ['ほを小さくして、風をあまり受けないようにする', 'ほを風と同じ向き（平行）にする', 'ほをはずす'],
          explanation: 'ほが大きいほど、たくさんの風を受けることができ、車を動かすはたらきが大きくなります。',
        }),
      () =>
        choice(rng, {
          text: '風の力を利用しているものはどれですか。',
          correct: '風力発電の風車',
          wrong: ['水力発電のダム', 'かい中電とう', 'ふりこ時計'],
          explanation: '風力発電は、風の力で風車を回して電気をつくります。ヨットや風りん、たこあげも、風の力を利用しています。',
        }),
    ])(),
};

const lowerRubber = facts('motion-l-rubber', [
  {
    q: 'わゴムの力で走る車があります。車を遠くまで走らせるには、ゴムをどうすればよいですか。',
    a: 'ゴムを長くのばしてから、手をはなす',
    wrong: ['ゴムを少しだけのばしてから、手をはなす', 'ゴムをのばさずに、手をはなす', 'ゴムを水でぬらす'],
    ex: 'ゴムは、長くのばすほど、もとにもどろうとする力が大きくなります。その力で、車は遠くまで走ります。',
  },
  {
    q: 'わゴムの力で走る車で、ゴムを1本から2本にふやして、同じ長さだけのばしました。車の進むきょりはどうなりますか。',
    a: '長くなる',
    wrong: ['短くなる', '変わらない', '進まなくなる'],
    ex: 'ゴムの本数をふやすと、もとにもどろうとする力が大きくなるので、車は遠くまで走ります。',
  },
  {
    q: 'わゴムの力で走る車を、3m先の線のところでちょうど止めたいと思います。どうすればよいですか。',
    a: 'ゴムをのばす長さを少しずつ変えて、ちょうどよい長さをさがす',
    wrong: ['ゴムをできるだけ長くのばす', '車を手で強くおす', '車に風を当てる'],
    ex: 'ゴムをのばす長さを変えると、車の進むきょりが変わります。のばす長さを調節すれば、ねらったところに止めることができます。',
  },
  {
    q: 'ねじったゴムがもとにもどろうとする力を利用して動くおもちゃはどれですか。',
    a: 'ゴム動力のプロペラ飛行機',
    wrong: ['じしゃくでつる魚つりゲーム', '豆電球のかい中電とう', '風で回るかざぐるま'],
    ex: 'ゴムは、のばしたときだけでなく、ねじったときも、もとにもどろうとします。その力でプロペラを回して飛びます。',
  },
  {
    q: 'わゴムの力で走る車で、ゴムを2本にふやしました。1本のときと同じきょりだけ走らせるには、どうすればよいですか。',
    a: 'ゴムをのばす長さを短くする',
    wrong: ['ゴムをのばす長さを長くする', 'ゴムを水でぬらす', 'ゴムを切って短くする'],
    ex: 'ゴムを2本にすると、もとにもどろうとする力が大きくなります。同じきょりだけ走らせるには、のばす長さを短くします。',
  },
  {
    q: 'わゴムの力で走る車で、ゴムをのばす長さを10cmから5cmにしました。車の進むきょりはどうなりますか。',
    a: '短くなる',
    wrong: ['長くなる', '変わらない', '後ろに進むようになる'],
    ex: 'ゴムをのばす長さが短いほど、もとにもどろうとする力は小さくなり、車の進むきょりは短くなります。',
  },
  {
    q: '身のまわりで、のばしたゴムがもとにもどろうとする力を利用しているものはどれですか。',
    a: 'ゴムでっぽう',
    wrong: ['方位じしん', '虫めがね', '温度計'],
    ex: 'ゴムでっぽうは、のばしたゴムがもとにもどろうとする力で、玉を飛ばします。',
  },
]);

const lowerSlope = facts('motion-l-slope', [
  {
    q: 'しゃ面の上からボールを転がします。転がしはじめる位置を高くすると、しゃ面の下でのボールの速さはどうなりますか。',
    a: '速くなる',
    wrong: ['おそくなる', '変わらない', '止まる'],
    ex: '高いところから転がすほど、しゃ面の下での速さは速くなります。',
  },
  {
    q: 'しゃ面を転がり落ちたボールを、下に置いた木ぎれに当てます。木ぎれを遠くまで動かすには、どうすればよいですか。',
    a: 'ボールを、より高いところから転がす',
    wrong: ['ボールを、より低いところから転がす', 'ボールを軽いものにかえる', '木ぎれを重いものにかえる'],
    ex: '高いところから転がしたボールほど速くなり、ものを動かすはたらきが大きくなります。ボールを重くしても、はたらきは大きくなります。',
  },
  {
    q: '同じ高さから、重いボールと軽いボールを転がして、下に置いた木ぎれに当てました。木ぎれを遠くまで動かすのはどちらですか。',
    a: '重いボール',
    wrong: ['軽いボール', 'どちらも同じ', 'どちらも動かせない'],
    ex: '同じ速さなら、重いものほど、ほかのものを動かすはたらきが大きくなります。',
  },
  {
    q: 'しゃ面を転がるボールの速さは、転がりはじめてから下に着くまでの間に、どう変わりますか。',
    a: 'だんだん速くなる',
    wrong: ['だんだんおそくなる', 'ずっと同じ速さ', 'とちゅうで止まる'],
    ex: 'しゃ面を下るボールは、だんだん速くなっていきます。しゃ面の下で、いちばん速くなります。',
  },
  {
    q: 'しゃ面を転がしたボールを木ぎれに当てる実験で、ボールの重さによるちがいを調べます。同じにしておく条件はどれですか。',
    a: 'ボールを転がしはじめる高さ',
    wrong: ['ボールの重さ', '木ぎれが動いたきょり', '実験の結果'],
    ex: 'ボールの重さによるちがいを調べるときは、重さだけを変えて、転がしはじめる高さや木ぎれなど、ほかの条件は同じにします。',
  },
  {
    q: 'しゃ面を転がり落ちたボールが、平らなゆかを転がって、やがて止まりました。止まるのはなぜですか。',
    a: 'ゆかとの間のまさつなどで、だんだんおそくなるから',
    wrong: ['ボールが軽くなるから', 'ボールが冷えるから', 'ボールがつかれるから'],
    ex: '転がるボールには、ゆかとの間で動きをさまたげる力（まさつ）などがはたらくので、だんだんおそくなって止まります。',
  },
  {
    q: 'ボウリングで、ピンをたくさんたおすには、どんなボールをどのように転がすとよいですか。',
    a: '重いボールを速く転がす',
    wrong: ['軽いボールをゆっくり転がす', '重いボールをゆっくり転がす', '軽いボールを転がさずに置く'],
    ex: '動いているものが、ほかのものを動かすはたらきは、重いほど、また速いほど大きくなります。',
  },
]);

const lowerSwing = facts('motion-l-swing', [
  {
    q: '糸におもりをつけてつるし、左右にふれるようにしたものを何といいますか。',
    a: 'ふりこ',
    wrong: ['てこ', 'かっ車', 'ばね', 'てんびん'],
    ex: '糸やぼうにおもりをつけて、左右にふれるようにしたものをふりこといいます。ブランコやメトロノームも、ふりこのなかまです。',
  },
  {
    q: 'ふりこの「1往復」とは、どんな動きのことですか。',
    a: 'はしから反対のはしまで行き、もとのはしにもどってくるまで',
    wrong: ['はしから反対のはしまで行くまで', 'はしから、まん中にくるまで', 'ふりこが止まるまで'],
    ex: 'おもりが、ふれはじめたはしから反対のはしまで行き、もとのはしにもどってくるまでが1往復です。',
  },
  {
    q: 'ふりこの糸を長くすると、ふれ方はどうなりますか。',
    a: 'ゆっくりふれるようになる',
    wrong: ['速くふれるようになる', '変わらない', 'ふれなくなる'],
    ex: 'ふりこは、糸が長いほどゆっくりふれ、短いほど速くふれます。',
  },
  {
    q: 'ふりこのおもりがいちばん速く動いているのは、どこを通るときですか。',
    a: 'いちばん低いところ（まん中）',
    wrong: ['いちばん高いところ（はし）', 'はしとまん中の間', 'どこでも同じ速さ'],
    ex: 'ふりこのおもりは、はしではいっしゅん止まり、いちばん低いまん中でいちばん速くなります。',
  },
  {
    q: 'ふりこのしくみを利用している道具はどれですか。',
    a: 'メトロノーム',
    wrong: ['ばねばかり', '方位じしん', '虫めがね', 'せんぬき'],
    ex: 'メトロノームは、おもりの位置を変えることで、ふれる速さを変えています。ふりこ時計も、ふりこが同じ時間でふれることを利用しています。',
  },
  {
    q: 'ふりこが1往復する時間を正しくはかるには、どうすればよいですか。',
    a: '10往復する時間を何回かはかって平均し、10でわる',
    wrong: ['1往復の時間を1回だけはかる', 'ふれはばを大きくしたり小さくしたりしながらはかる', 'おもりを手でおしながらはかる'],
    ex: '1往復の時間は短くてはかりにくいので、10往復の時間をはかって10でわります。何回かはかって平均すると、より正しくなります。',
  },
  {
    q: 'ふりこのおもりを重いものにかえると、1往復する時間はどうなりますか。',
    a: '変わらない',
    wrong: ['長くなる', '短くなる', 'ふれなくなる'],
    ex: 'ふりこが1往復する時間は、ふりこの長さで決まります。おもりの重さやふれはばを変えても変わりません。',
  },
]);

const upperPendulum: Gen = {
  id: 'motion-u-pendulum',
  make: (rng) =>
    pick(rng, [
      () => {
        // 1 往復の時間は、ふりこの長さだけで決まる
        const lens = shuffle([25, 50, 75, 100], rng);
        const list = lens.map((len) => ({ len, g: pick(rng, [20, 40, 60]), deg: pick(rng, [10, 20, 30]) }));
        const longest = rng() < 0.5;
        const target = longest ? Math.max(...lens) : Math.min(...lens);
        const answer = KANA[lens.indexOf(target)];
        return fixed({
          text: `図のア〜エのふりこのうち、1往復する時間がいちばん${longest ? '長い' : '短い'}ものはどれですか。`,
          svg: pendulumGrid(list, KANA.slice(0, 4)),
          choices: KANA.slice(0, 4),
          correct: answer,
          explanation: `ふりこが1往復する時間は、ふりこの長さだけで決まり、おもりの重さやふれはばには関係しません。長いほど時間は長くなるので、長さ${target}cmの ${answer} です。`,
        });
      },
      () => {
        const v = pick(rng, [
          { change: 'おもりの重さを2倍にする', a: '変わらない' },
          { change: 'ふれはばを2倍にする', a: '変わらない' },
          { change: 'ふりこの長さを長くする', a: '長くなる' },
          { change: 'ふりこの長さを短くする', a: '短くなる' },
        ]);
        return fixed({
          text: `ふりこの条件のうち、ほかは変えずに「${v.change}」と、1往復する時間はどうなりますか。`,
          choices: ['長くなる', '短くなる', '変わらない', '止まってしまう'],
          correct: v.a,
          explanation: 'ふりこが1往復する時間は、ふりこの長さだけで決まります。長くすると時間は長くなり、短くすると短くなります。おもりの重さやふれはばを変えても、変わりません。',
        });
      },
      () =>
        choice(rng, {
          text: 'ふりこの「おもりの重さ」と1往復する時間の関係を調べます。実験のしかたとして正しいものはどれですか。',
          correct: 'おもりの重さだけを変え、ふりこの長さとふれはばは同じにする',
          wrong: ['おもりの重さと、ふりこの長さを同時に変える', 'おもりの重さ・長さ・ふれはばを、すべて変える', 'おもりの重さは変えずに、ふりこの長さだけを変える'],
          explanation: '調べたい条件を1つだけ変え、ほかの条件は同じにしてくらべます。そうしないと、どの条件のせいで結果が変わったのかがわかりません。',
        }),
      () =>
        choice(rng, {
          text: 'ふりこのおもりを2個にふやすとき、1往復する時間を変えないようにするには、どのようにつるせばよいですか。',
          correct: '2個を、同じ高さにならべてつるす',
          wrong: ['2個を、たてにつなげてつるす', '1個を糸のとちゅうに、もう1個を糸の先につるす', 'どのようにつるしても同じ'],
          explanation: 'おもりをたてにつなぐと、おもり全体の中心が下がって、ふりこの長さが長くなってしまいます。ふりこの長さは、支点からおもりの中心までの長さです。',
        }),
    ])(),
};

const upperPeriod: Gen = {
  id: 'motion-u-period',
  make: (rng) => {
    const base = int(rng, 10, 22) * 10 + pick(rng, [0, 2, 4, 6, 8]); // 10 往復の時間の平均 (0.1 秒きざみ)
    const trials = shuffle([base - 2, base, base + 2], rng).map((t) => t / 10);
    const average = base / 10;
    return numeric(rng, {
      text: `ふりこが10往復する時間を3回はかったところ、${trials.map((t) => `${fmt(t)}秒`).join('、')}でした。この結果から、ふりこが1往復する時間の平均は何秒と考えられますか。`,
      correct: base / 100,
      wrong: [average, base / 1000, (base + 2) / 100, (base - 2) / 100, base / 300, (base * 3) / 100],
      unit: '秒',
      explanation: `10往復の時間の平均は（${trials.map((t) => fmt(t)).join(' ＋ ')}）÷ 3 ＝ ${fmt(average)}秒 です。1往復の時間は ${fmt(average)} ÷ 10 ＝ ${fmt(base / 100)}（秒）です。1往復の時間は短くて正確にはかりにくいので、10往復の時間を何回かはかって平均をとります。`,
    });
  },
};

const upperLength: Gen = {
  id: 'motion-u-length',
  make: (rng) => {
    const [len, sec] = pick(rng, [[25, 1], [50, 1.4], [100, 2]]);
    const k = pick(rng, [2, 3]);
    const intro = 'ふりこの長さを4倍にすると、1往復する時間は2倍になり、長さを9倍にすると、時間は3倍になります。';
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `${intro}長さ${len}cmのふりこが1往復する時間は${fmt(sec)}秒でした。長さ${len * k * k}cmのふりこが1往復する時間は何秒ですか。`,
          correct: sec * k,
          wrong: [sec * k * k, sec, sec * (k + 1), sec * k + 1, (sec * k) / 2],
          unit: '秒',
          explanation: `長さは ${len * k * k} ÷ ${len} ＝ ${k * k}倍 です。長さが${k * k}倍になると、時間は${k}倍になるので、${fmt(sec)} × ${k} ＝ ${fmt(sec * k)}（秒）です。`,
        }),
      () =>
        numeric(rng, {
          text: `${intro}長さ${len}cmのふりこが1往復する時間は${fmt(sec)}秒でした。1往復する時間を${fmt(sec * k)}秒にするには、ふりこの長さを何cmにすればよいですか。`,
          correct: len * k * k,
          wrong: [len * k, len * (k + 1), len * k * k * 2, len * (k * k + 1), len * k * k - len],
          unit: 'cm',
          explanation: `時間を ${fmt(sec * k)} ÷ ${fmt(sec)} ＝ ${k}倍 にするには、長さを ${k} × ${k} ＝ ${k * k}倍 にします。${len} × ${k * k} ＝ ${len * k * k}（cm）です。`,
        }),
    ])();
  },
};

const upperSpeed: Gen = {
  id: 'motion-u-speed',
  make: (rng) =>
    pick(rng, [
      () => {
        const v = pick(rng, [2, 3, 4, 5, 6, 8]);
        const t = pick(rng, [4, 5, 10, 20]);
        return numeric(rng, {
          text: `ある台車が、${v * t}mを${t}秒で進みました。この台車の速さは、秒速何mですか。`,
          correct: v,
          wrong: [v * t, t, v * t * t, v + t, v * 2],
          unit: 'm',
          show: (n) => `秒速${fmt(n)}m`,
          explanation: `速さ ＝ 進んだきょり ÷ かかった時間 です。${v * t} ÷ ${t} ＝ ${v} なので、秒速${v}mです。`,
        });
      },
      () => {
        const v = pick(rng, [5, 10, 15, 20, 25]);
        return numeric(rng, {
          text: `秒速${v}mで進む自動車の速さは、時速何kmですか。`,
          correct: v * 3.6,
          wrong: [v * 60, v * 6, v / 3.6, v * 36, v * 3.6 + 10].map((x) => Math.round(x * 10) / 10),
          unit: 'km',
          show: (n) => `時速${fmt(n)}km`,
          explanation: `1時間は3600秒なので、1時間に進むきょりは ${v} × 3600 ＝ ${v * 3600}m ＝ ${fmt(v * 3.6)}km です。秒速（m）を3.6倍すると、時速（km）になります。`,
        });
      },
      () => {
        const v = pick(rng, [2, 3, 4, 5]);
        const t = pick(rng, [6, 8, 12, 15]);
        return numeric(rng, {
          text: `秒速${v}mで進みつづける台車は、${t}秒間に何m進みますか。`,
          correct: v * t,
          wrong: [v + t, t / v, v * t * 2, v * t + v, v * t - t].filter((x) => Number.isInteger(x)),
          unit: 'm',
          explanation: `進むきょり ＝ 速さ × 時間 です。${v} × ${t} ＝ ${v * t}（m）です。`,
        });
      },
    ])(),
};

const upperCollide = facts('motion-u-collide', [
  {
    q: 'しゃ面から転がした球を、水平な面に置いた木ぎれに当てて、木ぎれの動いたきょりを調べます。球を転がす高さを2倍にすると、木ぎれの動くきょりはどうなりますか。',
    a: '長くなる',
    wrong: ['短くなる', '変わらない', '動かなくなる'],
    ex: '高いところにある球ほど、下に着いたときの速さが速く、ものを動かすはたらき（エネルギー）が大きくなります。',
  },
  {
    q: '同じ高さから、重さのちがう球をしゃ面で転がしました。しゃ面の下に着いたときの速さはどうなりますか。まさつや空気のていこうは考えません。',
    a: '重さがちがっても、同じ速さになる',
    wrong: ['重い球の方が速い', '軽い球の方が速い', '重い球は止まる'],
    ex: 'しゃ面の下での速さは、転がしはじめた高さだけで決まり、球の重さには関係しません。ただし、木ぎれなどを動かすはたらきは、重い球の方が大きくなります。',
  },
  {
    q: '同じ高さから球を転がすとき、しゃ面のかたむきを急にすると、しゃ面の下に着いたときの速さはどうなりますか。まさつは考えません。',
    a: '変わらない',
    wrong: ['速くなる', 'おそくなる', '半分になる'],
    ex: 'しゃ面の下での速さは、転がしはじめた高さで決まります。かたむきを急にすると、下に着くまでの時間は短くなりますが、下での速さは同じです。',
  },
  {
    q: 'ふりこのおもりの速さがいちばん速くなるのは、どこを通るときですか。',
    a: 'いちばん低いところ',
    wrong: ['いちばん高いところ', 'はしとまん中のちょうど間', 'どこでも同じ'],
    ex: 'おもりは、高いところにあるときにたくわえていたエネルギーが、低くなるにつれて速さに変わります。いちばん低いところで、いちばん速くなります。',
  },
  {
    q: '水平な面をすべっている物体が、やがて止まるのはなぜですか。',
    a: '面との間に、動きをさまたげるまさつの力がはたらくから',
    wrong: ['物体が軽くなるから', '重力がなくなるから', '物体がつかれるから'],
    ex: '物体と面の間には、動きをさまたげる向きにまさつの力がはたらきます。まさつや空気のていこうがなければ、物体は同じ速さで動きつづけます。',
  },
  {
    q: 'しゃ面から転がした球を木ぎれに当てる実験で、木ぎれの動くきょりを大きくする方法として、正しくないものはどれですか。',
    a: 'しゃ面のかたむきだけを急にして、同じ高さから転がす',
    wrong: ['球を重いものにかえる', '球を転がす高さを高くする', '高さを高くし、球も重くする'],
    ex: '木ぎれを動かすはたらきは、球が重いほど、また球を転がす高さが高い（速い）ほど大きくなります。高さが同じなら、かたむきを変えても球の速さは変わりません。',
  },
  {
    q: 'ジェットコースターが、いちばん低いところでいちばん速くなるのはなぜですか。',
    a: '高いところにあったときのはたらきが、下りるにつれて速さに変わるから',
    wrong: ['低いところほど、空気がうすいから', '低いところほど、レールが軽いから', 'いちばん低いところで、エンジンが動くから'],
    ex: '高いところにあるものは、ほかのものを動かすはたらき（エネルギー）をもっています。下りるにつれて、それが速さに変わっていきます。',
  },
]);

const lowerRubberDistance: Gen = {
  id: 'motion-l-rubberdist',
  make: (rng) => {
    const step = pick(rng, [5, 10]); // のばす長さのきざみ (cm)
    const per = pick(rng, [1, 2, 3]); // step cm のばすごとに進むきょり (m)
    const k = pick(rng, [3, 4]);
    const intro = `わゴムの力で走る車で、ゴムをのばす長さを変えて、進むきょりを調べました。ゴムを${step}cmのばすと${per}m、${step * 2}cmのばすと${per * 2}m進みました。のばす長さと進むきょりが、このきまりのとおりにふえるとします。`;
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `${intro}ゴムを${step * k}cmのばすと、車は何m進みますか。`,
          correct: per * k,
          wrong: [per * 2, per * (k + 1), per * (k - 1), step * k, per * k * 2],
          unit: 'm',
          explanation: `ゴムを${step}cmのばすごとに、進むきょりが${per}mずつふえています。${step * k}cmは${step}cmの${k}倍なので、${per} × ${k} ＝ ${per * k}（m）進みます。`,
        }),
      () =>
        numeric(rng, {
          text: `${intro}車を${per * k}m進ませるには、ゴムを何cmのばせばよいですか。`,
          correct: step * k,
          wrong: [step * 2, step * (k + 1), step * (k - 1), per * k, step * k * 2],
          unit: 'cm',
          explanation: `${step}cmのばすごとに${per}m進みます。${per * k}mは${per}mの${k}倍なので、${step} × ${k} ＝ ${step * k}（cm）のばします。`,
        }),
    ])();
  },
};

const lowerWindTable: Gen = {
  id: 'motion-l-windtable',
  make: (rng) => {
    const weak = int(rng, 1, 3);
    const mid = weak + int(rng, 1, 3);
    const strong = mid + int(rng, 1, 3);
    const runs = shuffle(
      [
        { name: '弱い風', m: weak },
        { name: '中くらいの風', m: mid },
        { name: '強い風', m: strong },
      ],
      rng,
    );
    const target = pick(rng, [runs.find((r) => r.name === '強い風')!, runs.find((r) => r.name === '弱い風')!]);
    const answer = KANA[runs.indexOf(target)];
    return fixed({
      text: `ほをつけた同じ車に、送風機で「弱い風」「中くらいの風」「強い風」を1回ずつ当てて走らせ、進んだきょりをはかりました。どの回にどの風を当てたかは、記録をわすれてしまいました。\n${runs.map((r, i) => `・${KANA[i]}の回　${r.m}m`).join('\n')}\n「${target.name}」を当てたのは、どの回だと考えられますか。`,
      choices: [...KANA.slice(0, 3), 'これだけではわからない'],
      correct: answer,
      explanation: `風が強いほど、車を動かすはたらきが大きくなり、車は遠くまで進みます。${target.name === '強い風' ? 'いちばん遠くまで進んだ' : 'いちばん短いきょりしか進まなかった'}${answer}（${target.m}m）が「${target.name}」です。`,
    });
  },
};

const lowerSlopeTable: Gen = {
  id: 'motion-l-slopetable',
  make: (rng) => {
    const h = pick(rng, [5, 10]); // 高さのきざみ (cm)
    const d = pick(rng, [3, 4, 5, 6]); // h cm 高くするごとに木ぎれが動くきょり (cm)
    const k = pick(rng, [3, 4]);
    return numeric(rng, {
      text: `しゃ面の上からボールを転がして、しゃ面の下に置いた木ぎれに当てました。ボールを転がす高さを変えて、木ぎれが動いたきょりを調べると、次のようになりました。\n・高さ${h}cm　${d}cm\n・高さ${h * 2}cm　${d * 2}cm\n同じボールと木ぎれで、高さ${h * k}cmから転がすと、木ぎれはおよそ何cm動くと考えられますか。`,
      correct: d * k,
      wrong: [d * 2, d * (k + 1), d * (k - 1), h * k, d * k * 2],
      unit: 'cm',
      explanation: `高さを${h}cm高くするごとに、木ぎれの動くきょりが${d}cmずつふえています。高いところから転がすほどボールは速くなり、ものを動かすはたらきが大きくなります。高さ${h * k}cmは${h}cmの${k}倍なので、${d} × ${k} ＝ ${d * k}（cm）くらい動くと考えられます。`,
    });
  },
};

const VARS = [
  { key: 'len', name: 'ふりこの長さ', values: [25, 50, 100] },
  { key: 'g', name: 'おもりの重さ', values: [20, 40, 60] },
  { key: 'deg', name: 'ふれはば', values: [10, 20, 30] },
] as const;

const upperPendulumPair: Gen = {
  id: 'motion-u-pendpair',
  make: (rng) => {
    // ア〜エのうち、調べたい条件だけがちがう 2 つは 1 組だけになるようにする
    const [target, other1, other2] = shuffle(VARS, rng);
    type P = { len: number; g: number; deg: number };
    const base = Object.fromEntries(VARS.map((v) => [v.key, pick(rng, v.values)])) as P;
    const change = (p: P, v: (typeof VARS)[number]): P => ({ ...p, [v.key]: pick(rng, v.values.filter((x) => x !== p[v.key])) });
    const a = base;
    const b = change(base, target);
    const c = change(base, other1);
    const d = change(change(base, target), other2);
    const list = shuffle([a, b, c, d], rng);
    const name = (p: P) => KANA[list.indexOf(p)];
    const pair = (p: P, q: P) => [name(p), name(q)].sort().join('と');
    const correct = pair(a, b);
    const wrong = [pair(a, c), pair(a, d), pair(b, c), pair(b, d), pair(c, d)];
    return choice(rng, {
      text: `「${target.name}」と、ふりこが1往復する時間の関係を調べます。図のア〜エのふりこのうち、どれとどれをくらべればよいですか。`,
      svg: pendulumGrid(list, KANA.slice(0, 4)),
      correct,
      wrong,
      explanation: `調べたい条件（${target.name}）だけをちがえて、ほかの条件（${other1.name}と${other2.name}）は同じにした2つをくらべます。${correct.replace('と', ' と ')} は、${target.name}だけがちがっています。`,
    });
  },
};

/** ジェネレーターと、それを出す学年 */
export const MOTION: Entry[] = [
  forGrades(lowerWind, 3),
  forGrades(lowerRubber, 3),
  forGrades(lowerRubberDistance, 3, 4),
  forGrades(lowerWindTable, 3),
  forGrades(lowerSlope, 4),
  forGrades(lowerSwing, 4),
  forGrades(lowerSlopeTable, 4, 5),
  forGrades(upperPendulum, 5, 6),
  forGrades(upperPendulumPair, 5, 6),
  forGrades(upperPeriod, 5),
  forGrades(upperLength, 6),
  forGrades(upperSpeed, 6),
  forGrades(upperCollide, 6),
];
