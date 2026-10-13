import { shuffle } from '../core/rng';
import { gasGraph, heatingFig, solubilityFig } from '../diagrams/graph';
import { fig, circle, line, rect, tag, text, polygon } from '../diagrams/svg';
import { choice, facts, fixed, forGrades, int, KANA, numeric, oneOf, pick, sample, type Entry, type Gen } from './helpers';

// ---------- 3・4 年むけ (どの学年に出すかは、ファイルの最後の一覧で決める) ----------

/** 同じ体積で重い順 */
const HEAVY = ['銅', '鉄', 'アルミニウム', '木', '発ぽうスチロール'];

const lowerWeight: Gen = {
  id: 'matter-l-weight',
  make: (rng) =>
    pick(rng, [
      () => {
        const g = pick(rng, [60, 80, 100, 120, 150]);
        const change = pick(rng, ['細長くのばして', '平たくつぶして', '小さく3つに分けて、全部いっしょに', '丸いボールの形にして']);
        return numeric(rng, {
          text: `${g}gのねん土があります。このねん土を${change}はかりにのせると、何gになりますか。`,
          correct: g,
          wrong: [g / 2, g * 2, g - 20, g + 20, g - 10],
          unit: 'g',
          explanation: `ものは、形を変えても、いくつかに分けても、全部の重さは変わりません。だから${g}gのままです。`,
        });
      },
      () => {
        const kg = pick(rng, [28, 30, 32, 35]);
        return numeric(rng, {
          text: `体重計に両足で立ってはかると${kg}kgでした。同じ体重計に、かた足で立ってはかると何kgになりますか。`,
          correct: kg,
          wrong: [kg / 2, kg * 2, kg - 5, kg + 5],
          unit: 'kg',
          explanation: `立ち方やしせいを変えても、重さは変わりません。かた足で立っても${kg}kgです。`,
        });
      },
    ])(),
};

const lowerMaterial: Gen = {
  id: 'matter-l-material',
  make: (rng) => {
    const items = sample(rng, HEAVY, 4);
    const heaviest = rng() < 0.5;
    const sorted = HEAVY.filter((m) => items.includes(m));
    const correct = heaviest ? sorted[0] : sorted[3];
    return choice(rng, {
      text: `同じ大きさ（体積）の、次の4つのもののうち、いちばん${heaviest ? '重い' : '軽い'}ものはどれですか。`,
      correct,
      wrong: items.filter((m) => m !== correct),
      explanation: `同じ体積でも、ものの種類によって重さはちがいます。重い順にならべると、${sorted.join(' → ')} です。`,
    });
  },
};

const ATTRACTED = ['鉄のくぎ', 'スチールかん', 'ゼムクリップ（鉄）', '鉄のはさみの刃', 'さ鉄'];
const NOT_ATTRACTED = ['アルミかん', '10円玉', '1円玉', 'ガラスのコップ', '木のわりばし', 'アルミニウムはく', '消しゴム'];

export const lowerMagnet: Gen = {
  id: 'matter-l-magnet',
  make: (rng) =>
    pick(rng, [
      () =>
        oneOf(rng, {
          text: '次のもののうち、じしゃくにつくものはどれですか。',
          yes: ATTRACTED,
          no: NOT_ATTRACTED,
          explanation: 'じしゃくにつくのは、鉄でできたものです。アルミニウムや銅（10円玉）は金属ですが、じしゃくにはつきません。',
        }),
      () =>
        oneOf(rng, {
          text: '次のもののうち、電気は通すが、じしゃくにはつかないものはどれですか。',
          yes: ['アルミかん', '10円玉', '1円玉', 'アルミニウムはく'],
          no: ['鉄のくぎ', 'スチールかん', 'ガラスのコップ', '木のわりばし', '消しゴム', 'ゼムクリップ（鉄）'],
          explanation: '金属はどれも電気を通しますが、じしゃくにつくのは鉄などの一部の金属だけです。アルミニウムや銅は、電気は通しますが、じしゃくにはつきません。',
        }),
      () =>
        choice(rng, {
          text: '2つのじしゃくのN極とN極を近づけると、どうなりますか。',
          correct: 'しりぞけ合う',
          wrong: ['引き合う', '何も起こらない', 'じしゃくの力がなくなる'],
          explanation: 'じしゃくは、同じ極どうし（N極とN極、S極とS極）はしりぞけ合い、ちがう極どうし（N極とS極）は引き合います。',
        }),
      () =>
        choice(rng, {
          text: 'ぼうじしゃくで、鉄を引きつける力がいちばん強いのはどこですか。',
          correct: '両はし（N極とS極）',
          wrong: ['まん中', 'N極だけ', 'どこも同じ'],
          explanation: 'じしゃくの両はしを極といい、鉄を引きつける力がいちばん強いところです。まん中は、ほとんど引きつけません。',
        }),
      () =>
        choice(rng, {
          text: 'じしゃくに鉄のくぎをしばらくつけておいてからはなすと、そのくぎはどうなりますか。',
          correct: 'じしゃくになり、ほかの鉄を引きつける',
          wrong: ['鉄ではなくなる', '重くなる', '電気を通さなくなる'],
          explanation: '鉄は、じしゃくにつけておくと、じしゃくの性質をもつようになります。N極とS極もできます。',
        }),
    ])(),
};

const lowerVolume: Gen = {
  id: 'matter-l-volume',
  make: (rng) => {
    const water = pick(rng, [40, 50, 60, 70]);
    const stone = pick(rng, [10, 15, 20, 25, 30]);
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `水が${water}mL入っているメスシリンダーに石をしずめると、水面の目もりは${water + stone}mLになりました。石のかさ（体積）は、水何mL分ですか。`,
          correct: stone,
          wrong: [water + stone, water, stone + 10, stone * 2, stone + 5],
          unit: 'mL',
          explanation: `石をしずめると、石のかさの分だけ水面が上がります。${water + stone} − ${water} ＝ ${stone}（mL）です。`,
        }),
      () =>
        numeric(rng, {
          text: `重さ${water}gの入れ物に、${stone * 10}gの水を入れました。全体の重さは何gになりますか。`,
          correct: water + stone * 10,
          wrong: [stone * 10, stone * 10 - water, water + stone * 10 + 10, water + stone * 10 - 10, (water + stone * 10) * 2],
          unit: 'g',
          explanation: `ものの重さは、合わせると足し算になります。${water} ＋ ${stone * 10} ＝ ${water + stone * 10}（g）です。`,
        }),
      () =>
        choice(rng, {
          text: `${stone * 10}gのさとうを、${water * 10}gの水に全部とかしました。さとう水の重さはどうなりますか。`,
          correct: `${stone * 10 + water * 10}gになる`,
          wrong: [`${water * 10}gのまま変わらない`, `${water * 10}gより少し軽くなる`, `${stone * 10 + water * 10}gより重くなる`],
          explanation: `さとうは水にとけて見えなくなっても、なくなったわけではありません。重さは ${water * 10} ＋ ${stone * 10} ＝ ${stone * 10 + water * 10}（g）です。`,
        }),
    ])();
  },
};

const lowerAir = facts('matter-l-air', [
  {
    q: '注しゃ器に空気をとじこめて、ピストンをおしました。空気の体積はどうなりますか。',
    a: '小さくなる',
    wrong: ['大きくなる', '変わらない', 'なくなる'],
    ex: 'とじこめた空気は、おされると体積が小さくなります（おしちぢめられます）。手をはなすと、もとの体積にもどります。',
  },
  {
    q: '注しゃ器に水をとじこめて、ピストンをおしました。水の体積はどうなりますか。',
    a: '変わらない',
    wrong: ['小さくなる', '大きくなる', '半分になる'],
    ex: 'とじこめた水は、おしても体積が変わりません。空気はおしちぢめることができますが、水はおしちぢめることができません。',
  },
  {
    q: '注しゃ器にとじこめた空気を強くおしていくと、手ごたえ（おし返す力）はどうなりますか。',
    a: 'おしちぢめるほど、大きくなる',
    wrong: ['おしちぢめるほど、小さくなる', 'ずっと変わらない', 'とちゅうでなくなる'],
    ex: 'とじこめた空気は、おしちぢめられて体積が小さくなるほど、もとにもどろうとしておし返す力が大きくなります。',
  },
  {
    q: '空気でっぽうで、前の玉が飛び出すのはなぜですか。',
    a: 'おしちぢめられた空気が、もとにもどろうとして玉をおすから',
    wrong: ['後ろの玉が、前の玉に直接ぶつかるから', 'つつの中の空気がなくなるから', '前の玉が軽くなるから'],
    ex: 'おしぼうで後ろの玉をおすと、中の空気がおしちぢめられます。その空気がもとにもどろうとする力で、前の玉が飛び出します。',
  },
  {
    q: '注しゃ器に空気と水を半分ずつ入れて、ピストンをおしました。体積が小さくなるのはどれですか。',
    a: '空気だけ',
    wrong: ['水だけ', '空気と水の両方', 'どちらも小さくならない'],
    ex: '空気はおしちぢめられますが、水はおしちぢめられません。だから、体積が小さくなるのは空気だけです。',
  },
]);

export const lowerExpand = facts('matter-l-expand', [
  {
    q: '空気・水・金属をそれぞれあたためたとき、体積の変わり方がいちばん大きいものはどれですか。',
    a: '空気',
    wrong: ['水', '金属', 'どれも同じ'],
    ex: 'あたためたときの体積の変わり方は、空気 → 水 → 金属の順に大きいです。空気はとても大きく変わり、金属の変化はごくわずかです。',
  },
  {
    q: '金属の輪をぎりぎり通りぬける金属の玉があります。この玉を熱すると、輪を通りますか。',
    a: '玉の体積が大きくなるので、通らなくなる',
    wrong: ['玉の体積が小さくなるので、らくに通る', '体積は変わらないので、同じように通る', '玉がとけて通る'],
    ex: '金属も、あたためると体積が大きくなり、冷やすと小さくなります。熱した玉は大きくなって輪を通らなくなります。',
  },
  {
    q: 'へこんだピンポン玉を湯の中に入れると、もとの形にもどりました。それはなぜですか。',
    a: '中の空気があたためられて、体積が大きくなったから',
    wrong: ['中の空気が冷やされて、体積が小さくなったから', 'ピンポン玉が水をすったから', '湯におされたから'],
    ex: '空気はあたためられると体積が大きくなります。ピンポン玉の中の空気がふくらんで、へこみを内がわからおしもどします。',
  },
  {
    q: '線路のレールのつなぎ目には、少しすきまがあけてあります。それはなぜですか。',
    a: '夏にレールがあたためられてのびても、曲がらないようにするため',
    wrong: ['冬にレールがのびても、曲がらないようにするため', '雨水を流すため', '電車の音を小さくするため'],
    ex: '金属はあたためられると体積が大きくなり、長さものびます。夏にレールがのびてもおし合って曲がらないよう、すきまがあけてあります。',
  },
  {
    q: '水を冷やして氷にすると、体積はどうなりますか。',
    a: '大きくなる',
    wrong: ['小さくなる', '変わらない', '半分になる'],
    ex: '水は氷になると、体積が約1.1倍に大きくなります。重さは変わらないので、氷は水にうきます。',
  },
  {
    q: '試験管に水を入れて湯であたためると、水面の高さはどうなりますか。',
    a: '少し上がる',
    wrong: ['少し下がる', '変わらない', '大きく下がる'],
    ex: '水もあたためると体積が大きくなるので、水面は少し上がります。ただし、空気にくらべると変わり方は小さいです。',
  },
]);

const STATES = ['氷だけ', '氷と水がまじっている', '水だけ', '水と水蒸気がまじっている（ふっとうしている）'];

export const lowerState: Gen = {
  id: 'matter-l-state',
  make: (rng) =>
    pick(rng, [
      () => {
        const letters = shuffle(KANA.slice(0, 4), rng);
        const i = int(rng, 0, 3);
        return fixed({
          text: `図は、氷を熱しつづけたときの、時間と温度の変化を表したグラフです。グラフの ${letters[i]} の部分では、どんなようすになっていますか。`,
          svg: heatingFig(letters),
          choices: STATES,
          correct: STATES[i],
          explanation: `氷は0℃でとけはじめ、全部とけるまで温度は0℃のままです。水は100℃でふっとうし、ふっとうしている間も温度は100℃のままです。${letters[i]} の部分は「${STATES[i]}」です。`,
        });
      },
      () =>
        choice(rng, {
          text: '水をあたためつづけると、およそ何℃でふっとうしますか。',
          correct: '100℃',
          wrong: ['0℃', '50℃', '80℃', '120℃'],
          explanation: '水は約100℃でふっとうします。ふっとうしている間は、熱しつづけても温度は100℃のまま変わりません。',
        }),
      () =>
        choice(rng, {
          text: '水がふっとうしているとき、水の中からさかんに出てくる大きなあわの正体は何ですか。',
          correct: '水蒸気',
          wrong: ['空気', '湯気', '酸素'],
          explanation: 'ふっとうしているときのあわは、水がすがたを変えた水蒸気です。水蒸気は気体で、目に見えません。',
        }),
      () =>
        choice(rng, {
          text: 'やかんの口から出る白い「湯気」の正体は何ですか。',
          correct: '小さな水のつぶ（液体）',
          wrong: ['水蒸気（気体）', '空気', '小さな氷のつぶ（固体）', 'けむり'],
          explanation: '水蒸気は目に見えません。水蒸気が空気中で冷やされて、小さな水のつぶになったものが湯気で、白く見えます。',
        }),
      () =>
        choice(rng, {
          text: '水が氷になりはじめる温度は何℃ですか。',
          correct: '0℃',
          wrong: ['−10℃', '4℃', '10℃', '100℃'],
          explanation: '水は0℃でこおりはじめ、全部がこおるまで温度は0℃のままです。全部こおると、温度は0℃より下がっていきます。',
        }),
    ])(),
};

/** 金属の棒の上に、ろうをつけた 3 つの点と、熱する点をかく */
function barFig(heat: number, points: { at: number; label: string }[]): string {
  const x = (cm: number) => 40 + cm * 26;
  return fig(
    340,
    130,
    `金属の棒の図。左はしから${heat}cmのところを下から熱している。${points.map((p) => `${p.label}は左はしから${p.at}cm`).join('、')}のところにろうがぬってある。`,
    rect(x(0), 50, 260, 10, 'box'),
    ...points.map((p) => circle(x(p.at), 46, 4, 'fill-mark') + tag(x(p.at), 24, p.label)),
    polygon([[x(heat), 66], [x(heat) - 8, 92], [x(heat) + 8, 92]], 'flame'),
    text(x(heat), 110, '熱する', { cls: 'small' }),
    ...[0, 2, 4, 6, 8, 10].map((cm) => line(x(cm), 60, x(cm), 64, 'ln thin')),
  );
}

export const lowerHeat: Gen = {
  id: 'matter-l-heat',
  make: (rng) =>
    pick(rng, [
      () => {
        // 熱したところから近い順に、ろうがとける
        let heat = 0;
        let at: number[] = [];
        for (;;) {
          heat = int(rng, 0, 10);
          at = sample(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9], 3).sort((a, b) => a - b);
          const d = at.map((p) => Math.abs(p - heat));
          if (new Set(d).size === 3 && !at.includes(heat)) break;
        }
        const labels = shuffle(KANA.slice(0, 3), rng);
        const points = at.map((p, i) => ({ at: p, label: labels[i] }));
        const order = points.slice().sort((a, b) => Math.abs(a.at - heat) - Math.abs(b.at - heat)).map((p) => p.label);
        const perms = ['アイウ', 'アウイ', 'イアウ', 'イウア', 'ウアイ', 'ウイア'].map((s) => s.split('').join(' → '));
        return choice(rng, {
          text: '図のように、金属の棒の3か所にろうをぬり、棒の一部を下から熱しました。ろうがとける順として正しいものはどれですか。',
          svg: barFig(heat, points),
          correct: order.join(' → '),
          wrong: perms,
          explanation: `金属は、熱したところから順に熱が伝わっていきます。熱したところに近い順にろうがとけるので、${order.join(' → ')} の順です。`,
        });
      },
      () =>
        choice(rng, {
          text: '試験管に水を入れ、水面に近い上の方だけを熱しました。試験管の底の方の水はどうなりますか。',
          correct: 'なかなかあたたまらない',
          wrong: ['上の方より先にあたたまる', '上の方と同時にあたたまる', 'すぐにふっとうする'],
          explanation: 'あたためられた水は上の方へ動きます。上を熱すると、あたたかい水は上にとどまったままなので、底の方はなかなかあたたまりません。',
        }),
      () =>
        choice(rng, {
          text: 'ビーカーに入れた水の底のはしを熱すると、水はどのようにあたたまっていきますか。',
          correct: 'あたためられた水が上へ動き、全体があたたまっていく',
          wrong: ['熱したところから、順に横へ伝わっていく', 'あたためられた水が底にたまりつづける', '水面だけがあたたまる'],
          explanation: '水や空気は、あたためられた部分が上へ動き、上にあった冷たい部分が下へ動くことで、全体があたたまります（対流）。',
        }),
      () =>
        choice(rng, {
          text: '冬に部屋をだんぼうであたためました。部屋の上の方と下の方では、どちらの空気の温度が高くなりますか。',
          correct: '上の方',
          wrong: ['下の方', 'どちらも同じ', 'まどの近くだけ高い'],
          explanation: 'あたためられた空気は軽くなって上へ動きます。そのため、部屋の上の方があたたかくなります。',
        }),
    ])(),
};

// ---------- 5・6 年むけ ----------

const upperConcentration: Gen = {
  id: 'matter-u-concentration',
  make: (rng) => {
    const total = pick(rng, [100, 200, 300, 400, 500]);
    const pct = pick(rng, [4, 5, 8, 10, 12, 20]);
    const salt = (total * pct) / 100;
    const water = total - salt;
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `水${water}gに食塩${salt}gをとかして食塩水をつくりました。この食塩水のこさ（のう度）は何%ですか。`,
          correct: pct,
          wrong: [Math.round((salt / water) * 1000) / 10, pct * 2, pct / 2, pct + 2, pct + 5],
          unit: '%',
          explanation: `のう度（%）＝ とけているものの重さ ÷ 水よう液全体の重さ × 100 です。食塩水全体は ${water} ＋ ${salt} ＝ ${total}g なので、${salt} ÷ ${total} × 100 ＝ ${pct}（%）です。水の重さだけで割らないように注意しましょう。`,
        }),
      () =>
        numeric(rng, {
          text: `こさ（のう度）が${pct}%の食塩水が${total}gあります。この中にとけている食塩は何gですか。`,
          correct: salt,
          wrong: [salt * 2, salt / 2, pct, total / pct, salt + 5],
          unit: 'g',
          explanation: `とけている食塩の重さ ＝ 食塩水の重さ × のう度 ÷ 100 です。${total} × ${pct} ÷ 100 ＝ ${salt}（g）です。`,
        }),
      () => {
        // 水を加えて、ちょうど半分のこさにする
        return numeric(rng, {
          text: `こさ（のう度）が${pct}%の食塩水が${total}gあります。これに水を${total}g加えると、のう度は何%になりますか。`,
          correct: pct / 2,
          wrong: [pct, pct * 2, pct / 4, pct - 1, pct / 2 + 1],
          unit: '%',
          explanation: `とけている食塩は ${total} × ${pct} ÷ 100 ＝ ${salt}g で変わりません。食塩水全体は ${total} ＋ ${total} ＝ ${total * 2}g になるので、${salt} ÷ ${total * 2} × 100 ＝ ${pct / 2}（%）です。`,
        });
      },
    ])();
  },
};

const SOLUBLE = [
  { name: 'ホウ酸', values: [5, 9, 15, 24] },
  { name: 'ミョウバン', values: [6, 12, 25, 71] },
  { name: 'しょう酸カリウム', values: [32, 64, 109, 169] },
];
const TEMPS = [20, 40, 60, 80];

const upperSolubility: Gen = {
  id: 'matter-u-solubility',
  make: (rng) => {
    const s = pick(rng, SOLUBLE);
    const hi = int(rng, 1, 3);
    const lo = int(rng, 0, hi - 1);
    const water = pick(rng, [100, 200, 300]);
    const k = water / 100;
    const svg = solubilityFig(s.name, s.values);
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `図は、${s.name}が水100gにとける量と水の温度の関係を表したグラフです。${TEMPS[hi]}℃の水${water}gに${s.name}をとけるだけとかしました。この水よう液を${TEMPS[lo]}℃まで冷やすと、何gの${s.name}がとけきれなくなって出てきますか。`,
          svg,
          correct: (s.values[hi] - s.values[lo]) * k,
          wrong: [s.values[hi] - s.values[lo], s.values[lo] * k, s.values[hi] * k, (s.values[hi] + s.values[lo]) * k, (s.values[hi] - s.values[lo]) * (k + 1)],
          unit: 'g',
          explanation: `水100gにとける量は、${TEMPS[hi]}℃で${s.values[hi]}g、${TEMPS[lo]}℃で${s.values[lo]}gです。水100gあたり ${s.values[hi]} − ${s.values[lo]} ＝ ${s.values[hi] - s.values[lo]}g が出てきます。水は${water}gなので、${s.values[hi] - s.values[lo]} × ${k} ＝ ${(s.values[hi] - s.values[lo]) * k}（g）です。`,
        }),
      () =>
        numeric(rng, {
          text: `図は、${s.name}が水100gにとける量と水の温度の関係を表したグラフです。${TEMPS[hi]}℃の水${water}gには、${s.name}を何gまでとかすことができますか。`,
          svg,
          correct: s.values[hi] * k,
          wrong: [s.values[hi], s.values[lo] * k, s.values[hi] * (k + 1), s.values[hi] / 2, s.values[hi] * k + s.values[lo]],
          unit: 'g',
          explanation: `${TEMPS[hi]}℃の水100gには${s.values[hi]}gまでとけます。とける量は水の量に比例するので、水${water}gには ${s.values[hi]} × ${k} ＝ ${s.values[hi] * k}（g）までとけます。`,
        }),
    ])();
  },
};

const upperDissolve: Gen = {
  id: 'matter-u-dissolve',
  make: (rng) =>
    pick(rng, [
      () => {
        const water = pick(rng, [50, 100, 150, 200]);
        const salt = pick(rng, [5, 10, 15, 20]);
        return numeric(rng, {
          text: `水${water}gに食塩${salt}gを入れて、全部とかしました。できた食塩水の重さは何gですか。`,
          correct: water + salt,
          wrong: [water, water - salt, water + salt * 2, water + salt + 10, salt],
          unit: 'g',
          explanation: `とけて見えなくなっても、食塩はなくなっていません。水よう液の重さは、水の重さととかしたものの重さの和なので、${water} ＋ ${salt} ＝ ${water + salt}（g）です。`,
        });
      },
      () =>
        choice(rng, {
          text: '水の温度を上げたとき、とける量があまり変わらないものはどれですか。',
          correct: '食塩',
          wrong: ['ミョウバン', 'ホウ酸', 'しょう酸カリウム', 'さとう'],
          explanation: '食塩は、水の温度を上げてもとける量がほとんど変わりません。ミョウバンやホウ酸は、温度が高いほどたくさんとけます。',
        }),
      () =>
        choice(rng, {
          text: '食塩水から食塩の結しょうをとり出すには、どの方法がよいですか。',
          correct: '加熱して、水をじょう発させる',
          wrong: ['氷水で冷やす', 'ろ紙でろ過する', 'よくかきまぜる'],
          explanation: '食塩は温度によってとける量がほとんど変わらないので、冷やしてもあまり出てきません。水をじょう発させてとり出します。とけているものは、ろ紙を通りぬけます。',
        }),
      () =>
        choice(rng, {
          text: 'ろ過のしかたとして正しいものはどれですか。',
          correct: '液をガラスぼうに伝わらせて、少しずつ注ぐ',
          wrong: ['液をろうとに直接いきおいよく注ぐ', 'ろうとの先を、ビーカーのかべからはなしておく', 'ろ紙は、水でぬらさずにそのまま使う'],
          explanation: 'ろ過では、ろ紙を水でぬらしてろうとにぴったりつけ、液はガラスぼうに伝わらせて注ぎます。ろうとの先は、ビーカーのかべにつけておきます。',
        }),
      () =>
        choice(rng, {
          text: '決まった量の水にとけるものの量をふやすには、水の温度を上げるほかに、どんな方法がありますか。',
          correct: '水の量をふやす',
          wrong: ['長い時間かきまぜる', 'とかすものを細かくくだく', '入れ物を大きくする'],
          explanation: 'とける量は、水の量に比例します。かきまぜたり細かくしたりすると、とける速さは速くなりますが、とける量は変わりません。',
        }),
    ])(),
};

const SOLUTIONS = [
  { name: '塩酸', nature: '酸性', solute: '気体' },
  { name: '炭酸水', nature: '酸性', solute: '気体' },
  { name: 'す（食す）', nature: '酸性', solute: '液体' },
  { name: 'ホウ酸水', nature: '酸性', solute: '固体' },
  { name: '食塩水', nature: '中性', solute: '固体' },
  { name: 'さとう水', nature: '中性', solute: '固体' },
  { name: 'アルコール水', nature: '中性', solute: '液体' },
  { name: '水酸化ナトリウム水よう液', nature: 'アルカリ性', solute: '固体' },
  { name: '石灰水', nature: 'アルカリ性', solute: '固体' },
  { name: 'アンモニア水', nature: 'アルカリ性', solute: '気体' },
  { name: '重そう水', nature: 'アルカリ性', solute: '固体' },
];
const names = (test: (s: (typeof SOLUTIONS)[number]) => boolean) => SOLUTIONS.filter(test).map((s) => s.name);

const upperSolution: Gen = {
  id: 'matter-u-solution',
  make: (rng) => {
    const v = pick(rng, [
      { q: '青色リトマス紙を赤色に変える水よう液', nature: '酸性', ex: '青色リトマス紙を赤色に変えるのは酸性の水よう液です。' },
      { q: '赤色リトマス紙を青色に変える水よう液', nature: 'アルカリ性', ex: '赤色リトマス紙を青色に変えるのはアルカリ性の水よう液です。' },
      { q: 'リトマス紙の色を、赤色も青色も変えない水よう液', nature: '中性', ex: 'どちらのリトマス紙の色も変えないのは中性の水よう液です。' },
      { q: 'BTB液を加えると黄色になる水よう液', nature: '酸性', ex: 'BTB液は、酸性で黄色、中性で緑色、アルカリ性で青色になります。' },
      { q: 'BTB液を加えると青色になる水よう液', nature: 'アルカリ性', ex: 'BTB液は、酸性で黄色、中性で緑色、アルカリ性で青色になります。' },
      { q: 'BTB液を加えると緑色になる水よう液', nature: '中性', ex: 'BTB液は、酸性で黄色、中性で緑色、アルカリ性で青色になります。' },
      { q: 'フェノールフタレイン液を加えると赤色になる水よう液', nature: 'アルカリ性', ex: 'フェノールフタレイン液は、アルカリ性のときだけ赤色になります。' },
    ]);
    return oneOf(rng, {
      text: `次のうち、${v.q}はどれですか。`,
      yes: names((s) => s.nature === v.nature),
      no: names((s) => s.nature !== v.nature),
      explanation: `${v.ex}酸性は${names((s) => s.nature === '酸性').slice(0, 3).join('・')}など、中性は${names((s) => s.nature === '中性').slice(0, 2).join('・')}など、アルカリ性は${names((s) => s.nature === 'アルカリ性').slice(0, 3).join('・')}などです。`,
    });
  },
};

const upperSolute: Gen = {
  id: 'matter-u-solute',
  make: (rng) =>
    pick(rng, [
      () =>
        oneOf(rng, {
          text: '次のうち、気体がとけている水よう液はどれですか。',
          yes: names((s) => s.solute === '気体'),
          no: names((s) => s.solute === '固体'),
          explanation: '塩酸には塩化水素、炭酸水には二酸化炭素、アンモニア水にはアンモニアという気体がとけています。',
        }),
      () =>
        oneOf(rng, {
          text: '次の水よう液を少量とって加熱し、水をじょう発させました。あとに白い固体が残るものはどれですか。',
          yes: ['食塩水', '水酸化ナトリウム水よう液', '石灰水', '重そう水', 'ホウ酸水'],
          no: ['塩酸', '炭酸水', 'アンモニア水', 'アルコール水'],
          explanation: '固体がとけている水よう液は、水をじょう発させると固体が残ります。気体や液体がとけている塩酸・炭酸水・アンモニア水・アルコール水は、何も残りません。',
        }),
      () =>
        oneOf(rng, {
          text: '次の水よう液を少量とって加熱し、水をじょう発させました。あとに何も残らないものはどれですか。',
          yes: ['塩酸', '炭酸水', 'アンモニア水'],
          no: ['食塩水', '水酸化ナトリウム水よう液', '石灰水', '重そう水', 'ホウ酸水'],
          explanation: '気体がとけている塩酸・炭酸水・アンモニア水は、加熱するととけていた気体が空気中に出ていき、何も残りません。',
        }),
      () =>
        choice(rng, {
          text: '「水よう液」の説明として正しいものはどれですか。',
          correct: 'とうめいで、とけたものが全体に同じこさで広がっている',
          wrong: ['色がついているものは水よう液ではない', '時間がたつと、とけたものが下にしずんでくる', 'とけたものの重さは、とかす前よりへっている'],
          explanation: '水よう液は、色がついていてもとうめいで、どの部分も同じこさです。時間がたってもとけたものは出てきません。とかす前後で全体の重さは変わりません。',
        }),
    ])(),
};

const GASES = [
  { make: '二酸化マンガンに、うすい過酸化水素水（オキシドール）を加える', gas: '酸素' },
  { make: '石灰石に、うすい塩酸を加える', gas: '二酸化炭素' },
  { make: '貝がらや卵のからに、うすい塩酸を加える', gas: '二酸化炭素' },
  { make: '鉄やあえんに、うすい塩酸を加える', gas: '水素' },
  { make: 'アルミニウムに、水酸化ナトリウム水よう液を加える', gas: '水素' },
];
const GAS_NAMES = ['酸素', '二酸化炭素', '水素', 'ちっ素', 'アンモニア'];

const upperGas: Gen = {
  id: 'matter-u-gas',
  make: (rng) =>
    pick(rng, [
      () => {
        const g = pick(rng, GASES);
        return choice(rng, {
          text: `「${g.make}」と発生する気体はどれですか。`,
          correct: g.gas,
          wrong: GAS_NAMES.filter((n) => n !== g.gas),
          explanation: `発生するのは${g.gas}です。酸素は二酸化マンガン＋過酸化水素水、二酸化炭素は石灰石＋塩酸、水素は鉄・あえん・アルミニウムなどの金属＋塩酸で発生します。`,
        });
      },
      () => {
        const v = pick(rng, [
          { q: '石灰水に通すと、石灰水が白くにごる気体', a: '二酸化炭素', ex: '二酸化炭素を石灰水に通すと、白くにごります。二酸化炭素は空気の約1.5倍の重さで、水に少しとけます。' },
          { q: 'ものを燃やすはたらきがある気体', a: '酸素', ex: '酸素には、ものを燃やすはたらき（助燃性）があります。酸素そのものは燃えません。' },
          { q: 'いちばん軽く、火をつけると音を立てて燃えて水ができる気体', a: '水素', ex: '水素はすべての気体の中でいちばん軽く、燃えると水ができます。' },
          { q: '空気中に体積で約78%ふくまれている気体', a: 'ちっ素', ex: '空気は、体積で約78%がちっ素、約21%が酸素で、二酸化炭素は約0.04%です。' },
          { q: '鼻をさすにおいがあり、水にとてもよくとけてアルカリ性をしめす気体', a: 'アンモニア', ex: 'アンモニアは、鼻をさすにおいがあり、水にとてもよくとけます。空気より軽いので、上方置かんで集めます。' },
        ]);
        return choice(rng, {
          text: `次のうち、${v.q}はどれですか。`,
          correct: v.a,
          wrong: GAS_NAMES.filter((n) => n !== v.a),
          explanation: v.ex,
        });
      },
      () => {
        const v = pick(rng, [
          { gas: '酸素', a: '水上置かん', ex: '酸素は水にとけにくいので、水上置かんで集めます。' },
          { gas: '水素', a: '水上置かん', ex: '水素は水にとけにくいので、水上置かんで集めます。' },
          { gas: 'アンモニア', a: '上方置かん', ex: 'アンモニアは水にとてもよくとけ、空気より軽いので、上方置かんで集めます。' },
        ]);
        return choice(rng, {
          text: `${v.gas}を集めるのに、いちばんよい方法はどれですか。`,
          correct: v.a,
          wrong: ['水上置かん', '上方置かん', '下方置かん', 'ろ過'],
          explanation: `${v.ex}水にとけにくい気体は水上置かん、水にとけやすく空気より軽い気体は上方置かん、水にとけやすく空気より重い気体は下方置かんで集めます。`,
        });
      },
    ])(),
};

const upperBurn: Gen = {
  id: 'matter-u-burn',
  make: (rng) =>
    pick(rng, [
      () => {
        // 銅 : 酸素 = 4 : 1、マグネシウム : 酸素 = 3 : 2 (重さの比)。小数の計算ちがいをさけるため、0.1g を 1 として数える
        const metal = pick(rng, [
          { name: '銅', oxide: '酸化銅', m: 4, o: 1 },
          { name: 'マグネシウム', oxide: '酸化マグネシウム', m: 3, o: 2 },
        ]);
        const unit = pick(rng, [2, 3, 4, 5, 6, 8, 10]);
        const before = (metal.m * unit) / 10;
        const oxygen = (metal.o * unit) / 10;
        const after = ((metal.m + metal.o) * unit) / 10;
        const askOxygen = rng() < 0.4;
        return numeric(rng, {
          text: `${metal.name}の粉を空気中で十分に加熱すると、${metal.name}と酸素が ${metal.m}：${metal.o} の重さの比で結びついて、${metal.oxide}になります。${before}gの${metal.name}の粉を十分に加熱したとき、${askOxygen ? '結びついた酸素' : `できる${metal.oxide}`}は何gですか。`,
          correct: askOxygen ? oxygen : after,
          wrong: [oxygen, after, before, before * 2, after + 0.5, before / 2].filter((v) => v !== (askOxygen ? oxygen : after)),
          unit: 'g',
          explanation: `結びつく酸素は ${before} × ${metal.o} ÷ ${metal.m} ＝ ${oxygen}g です。${askOxygen ? '' : `できる${metal.oxide}は ${before} ＋ ${oxygen} ＝ ${after}g です。`}金属は、燃えると結びついた酸素の分だけ重くなります。`,
        });
      },
      () => {
        const v = pick(rng, [
          { q: 'いちばん温度が高い部分', a: '外えん（いちばん外がわ）', ex: '外えんは空気（酸素）と十分にふれて完全に燃えているので、いちばん温度が高くなります。' },
          { q: 'いちばん明るくかがやいている部分', a: '内えん（外えんの内がわ）', ex: '内えんでは、すす（炭素のつぶ）が熱せられて光るので、いちばん明るく見えます。' },
          { q: 'いちばん温度が低い部分', a: 'えん心（しんのまわり）', ex: 'えん心は、ろうの気体がまだ燃えていない部分で、いちばん温度が低く、暗く見えます。' },
        ]);
        return choice(rng, {
          text: `ろうそくのほのおのうち、${v.q}はどこですか。`,
          correct: v.a,
          wrong: ['外えん（いちばん外がわ）', '内えん（外えんの内がわ）', 'えん心（しんのまわり）', 'しんの先より下のろうの部分'],
          explanation: `${v.ex}ほのおは外がわから、外えん・内えん・えん心の3つの部分に分かれています。`,
        });
      },
      () =>
        choice(rng, {
          text: 'ふたをした集気びんの中でろうそくを燃やすと、やがて火が消えました。火が消えたあとのびんの中の気体について、正しいものはどれですか。',
          correct: '酸素がへって二酸化炭素がふえたが、酸素はまだ残っている',
          wrong: ['酸素がすべてなくなり、二酸化炭素だけになった', 'ちっ素がすべて二酸化炭素に変わった', '酸素も二酸化炭素もふえた'],
          explanation: 'ろうそくが燃えると、酸素は約21%から約17%にへり、二酸化炭素は約3%にふえます。酸素がなくなるのではなく、少なくなると火が消えます。ちっ素の量は変わりません。',
        }),
      () =>
        choice(rng, {
          text: 'スチールウール（鉄）を燃やしたあとの集気びんに石灰水を入れてふりました。石灰水はどうなりますか。',
          correct: '変化しない',
          wrong: ['白くにごる', '青色になる', '赤色になる'],
          explanation: '鉄は炭素をふくまないので、燃えても二酸化炭素は発生しません。だから石灰水は白くにごりません。木やろうそくは炭素をふくむので、燃えると二酸化炭素が発生します。',
        }),
    ])(),
};

const upperNeutral: Gen = {
  id: 'matter-u-neutral',
  make: (rng) => {
    const [acid, alkali] = pick(rng, [[10, 10], [10, 15], [10, 20], [20, 10], [20, 30], [10, 5]]);
    const times = pick(rng, [2, 3, 4]);
    const needed = alkali * times;
    return pick(rng, [
      () =>
        numeric(rng, {
          text: `ある塩酸A ${acid}cm³に、ある水酸化ナトリウム水よう液B を${alkali}cm³加えると、ちょうど中性になりました。同じ塩酸A ${acid * times}cm³をちょうど中性にするには、水酸化ナトリウム水よう液B は何cm³必要ですか。`,
          correct: needed,
          wrong: [acid * times, alkali, alkali + acid * times - acid, needed + alkali, needed / 2, alkali * (times + 2)],
          unit: 'cm³',
          explanation: `ちょうど中和する体積の比は、A：B ＝ ${acid}：${alkali} でいつも同じです。A が${times}倍の${acid * times}cm³になると、B も${times}倍必要なので、${alkali} × ${times} ＝ ${needed}（cm³）です。`,
        }),
      () => {
        const delta = pick(rng, [-1, 0, 1]);
        const added = needed + delta * alkali;
        const color = delta < 0 ? '黄色' : delta === 0 ? '緑色' : '青色';
        const state = delta < 0 ? '塩酸があまって酸性' : delta === 0 ? 'ちょうど中和して中性' : '水酸化ナトリウム水よう液があまってアルカリ性';
        return fixed({
          text: `ある塩酸A ${acid}cm³に、ある水酸化ナトリウム水よう液B を${alkali}cm³加えると、ちょうど中性になりました。BTB液を加えた塩酸A ${acid * times}cm³に、水酸化ナトリウム水よう液B を${added}cm³加えると、液は何色になりますか。`,
          choices: ['黄色', '緑色', '青色', '赤色'],
          correct: color,
          explanation: `塩酸A ${acid * times}cm³をちょうど中性にするには、B が ${alkali} × ${times} ＝ ${needed}cm³必要です。加えた B は${added}cm³なので、${state}になります。BTB液は酸性で黄色、中性で緑色、アルカリ性で青色なので、${color}です。`,
        });
      },
    ])();
  },
};

const upperMetal = facts('matter-u-metal', [
  {
    q: '次の金属のうち、うすい塩酸に入れても、とけないものはどれですか。',
    a: '銅',
    wrong: ['鉄', 'アルミニウム', 'あえん', 'マグネシウム'],
    ex: '鉄・アルミニウム・あえん・マグネシウムは、塩酸にとけて水素を発生します。銅や金、銀は塩酸にとけません。',
  },
  {
    q: '次の金属のうち、うすい塩酸にも、水酸化ナトリウム水よう液にも、とけて水素を発生するものはどれですか。',
    a: 'アルミニウム',
    wrong: ['鉄', '銅', 'マグネシウム'],
    ex: 'アルミニウムは、塩酸にも水酸化ナトリウム水よう液にもとけて、水素を発生します。鉄やマグネシウムは塩酸にはとけますが、水酸化ナトリウム水よう液にはとけません。',
  },
  {
    q: 'うすい塩酸にアルミニウムをとかした液を加熱して、水をじょう発させると、白い固体が残りました。この固体について正しいものはどれですか。',
    a: 'もとのアルミニウムとは別のものである',
    wrong: ['もとのアルミニウムと同じものである', '塩酸にとけていた気体が固まったものである', '食塩である'],
    ex: '残った白い固体（塩化アルミニウム）は、アルミニウムが塩酸と反応してできた別のものです。金属のつやがなく、塩酸に入れてもあわを出さずにとけます。',
  },
  {
    q: '次の金属のうち、じ石につくものはどれですか。',
    a: '鉄',
    wrong: ['銅', 'アルミニウム', '金', '銀'],
    ex: 'じ石につくのは、鉄・ニッケル・コバルトなど一部の金属だけです。銅やアルミニウムは、電気は通しますが、じ石にはつきません。',
  },
  {
    q: '金属に共通する性質として、あてはまらないものはどれですか。',
    a: 'じ石につく',
    wrong: ['電気をよく通す', '熱をよく伝える', 'みがくと光る（金属こうたくがある）', 'たたくとうすく広がる'],
    ex: '金属に共通する性質は、電気をよく通す、熱をよく伝える、みがくと光る、たたくと広がり引っぱるとのびる、です。じ石につくのは鉄など一部の金属だけです。',
  },
]);

const upperGasGraph: Gen = {
  id: 'matter-u-gasgraph',
  make: (rng) => {
    // 石灰石 1g あたり rate cm³ の二酸化炭素が出る。塩酸がなくなる石灰石の量が bend
    const rate = pick(rng, [200, 240]);
    const bend = pick(rng, [2, 3, 4]);
    const acid = pick(rng, [20, 30, 50]);
    const max = rate * bend;
    const svg = gasGraph({
      xLabel: '石灰石の重さ(g)',
      yLabel: '発生した気体の体積(cm³)',
      bendX: bend,
      maxY: max,
      xs: [1, 2, 3, 4, 5, 6],
      ys: Array.from({ length: bend + 1 }, (_, i) => rate * (i + 1)),
    });
    const intro = `図は、うすい塩酸${acid}cm³に、いろいろな重さの石灰石を加えたときに発生した二酸化炭素の体積を表したグラフです。`;
    return pick(rng, [
      () => {
        const x = bend + pick(rng, [1, 2]);
        return numeric(rng, {
          text: `${intro}この塩酸${acid}cm³に石灰石を${x}g加えると、石灰石は何gとけ残りますか。`,
          svg,
          correct: x - bend,
          wrong: [x, bend, x - bend + 1, x + bend, 0.5],
          unit: 'g',
          explanation: `グラフが折れ曲がっている${bend}gのところで、塩酸がすべて反応してなくなります。それより多く加えた石灰石はとけ残るので、${x} − ${bend} ＝ ${x - bend}（g）です。`,
        });
      },
      () => {
        const x = bend + pick(rng, [1, 2]);
        return numeric(rng, {
          text: `${intro}この塩酸${acid}cm³に石灰石を${x}g加えると、二酸化炭素は何cm³発生しますか。`,
          svg,
          correct: max,
          wrong: [rate * x, rate, max / 2, rate * (x - bend), max + rate * 2].filter((v) => v !== max),
          unit: 'cm³',
          explanation: `塩酸${acid}cm³とちょうど反応する石灰石は${bend}gで、そのとき${max}cm³の二酸化炭素が発生します。石灰石をそれより多く加えても、塩酸がもうないので、発生する量は${max}cm³のままです。`,
        });
      },
      () => {
        const x = bend + pick(rng, [1, 2]);
        const got = rate * Math.min(x, bend * 2);
        return numeric(rng, {
          text: `${intro}同じこさの塩酸を2倍の${acid * 2}cm³にして、石灰石を${x}g加えると、二酸化炭素は何cm³発生しますか。`,
          svg,
          correct: got,
          wrong: [max, max * 2, rate * bend * 2 + rate, rate, got / 2, rate * (x + 1)].filter((v) => v !== got),
          unit: 'cm³',
          explanation: `塩酸が2倍になると、ちょうど反応する石灰石も2倍の${bend * 2}gになります。加えた石灰石${x}gは${x <= bend * 2 ? 'すべて反応する' : `そのうち${bend * 2}gだけが反応する`}ので、${rate} × ${Math.min(x, bend * 2)} ＝ ${got}（cm³）です。`,
        });
      },
      () =>
        numeric(rng, {
          text: `${intro}石灰石1gがすべて反応すると、二酸化炭素は何cm³発生しますか。`,
          svg,
          correct: rate,
          wrong: [max, rate / 2, rate * 2, rate + 100, max / (bend + 1)].filter((v) => v !== rate),
          unit: 'cm³',
          explanation: `グラフがまっすぐふえている部分を読みます。石灰石${bend}gで${max}cm³なので、1gあたり ${max} ÷ ${bend} ＝ ${rate}（cm³）です。`,
        }),
    ])();
  },
};

/** ジェネレーターと、それを出す学年 */
export const MATTER: Entry[] = [
  forGrades(lowerWeight, 3),
  forGrades(lowerVolume, 3),
  forGrades(lowerMaterial, 3, 4),
  forGrades(lowerAir, 4),
  forGrades(upperConcentration, 5),
  forGrades(upperSolubility, 5),
  forGrades(upperDissolve, 5),
  forGrades(upperSolute, 5, 6),
  forGrades(upperSolution, 6),
  forGrades(upperGas, 6),
  forGrades(upperBurn, 6),
  forGrades(upperNeutral, 6),
  forGrades(upperMetal, 6),
  forGrades(upperGasGraph, 6),
];
