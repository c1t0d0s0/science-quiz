import { shuffle } from '../core/rng';
import { plantFig, plantParts, type PlantId } from '../diagrams/power';
import { PLANTS } from '../power/plants';
import { choice, fixed, KANA, oneOf, pick, type Draft, type Gen } from './helpers';

// 発電所の問題 (6 年生むけ)。どの問題にも、解説の画面へのリンク (learn) をつける。
// 「発電所のしくみ」の画面のたしかめ問題と、同じ問題もある

const withLearn = (id: PlantId, d: Draft): Draft => ({ ...d, learn: id });

const STATIONS = PLANTS.filter((p) => p.id !== 'generator');

/** 発電所のしくみ・よいところと課題 (解説のたしかめ問題と同じ) */
export const upperHow: Gen = {
  id: 'power-u-how',
  make: (rng) => {
    const plant = pick(rng, PLANTS);
    const f = pick(rng, plant.quiz);
    return withLearn(plant.id, choice(rng, { text: f.q, correct: f.a, wrong: f.wrong, explanation: f.ex }));
  },
};

/** 図の部品の名前を答える */
export const upperFigure: Gen = {
  id: 'power-u-figure',
  make: (rng) => {
    const plant = pick(rng, PLANTS);
    const parts = shuffle(plantParts(plant.id), rng).slice(0, 4);
    const labels = Object.fromEntries(parts.map((p, i) => [p.id, KANA[i]]));
    const target = pick(rng, parts);
    const where = plant.id === 'generator' ? '手回し発電機の中のようす' : `${plant.name}のしくみ`;
    return withLearn(
      plant.id,
      fixed({
        text: `図は、${where}を表したものです。図のア〜エのうち、「${target.name}」はどれですか。`,
        svg: plantFig(plant.id, labels),
        choices: KANA.slice(0, 4),
        correct: labels[target.id],
        explanation: `「${target.name}」は ${labels[target.id]} です。図のほかの記号は、${parts
          .filter((p) => p !== target)
          .map((p) => `${labels[p.id]} が「${p.name}」`)
          .join('、')}です。`,
      }),
    );
  },
};

const chain = (energy: readonly string[]) => energy.join(' → ');

/** エネルギーの変わり方 */
export const upperEnergy: Gen = {
  id: 'power-u-energy',
  make: (rng) => {
    const plant = pick(rng, STATIONS);
    const energy = plant.energy!;
    const others = STATIONS.filter((p) => p !== plant).map((p) => chain(p.energy!));
    // 順番を入れかえたものも、まちがいの候補にする
    const swapped = energy.length > 2 ? [chain([energy[1], energy[0], ...energy.slice(2)]), chain([...energy].reverse())] : [chain([...energy].reverse())];
    return withLearn(
      plant.id,
      choice(rng, {
        text: `${plant.name}で、エネルギーはどのように変わっていきますか。`,
        correct: chain(energy),
        wrong: [...swapped, ...others].filter((c) => c !== chain(energy)),
        explanation: `${plant.name}では、${chain(energy)} と変わっていきます。${plant.lead}`,
      }),
    );
  },
};

const NAME: Record<PlantId, string> = Object.fromEntries(PLANTS.map((p) => [p.id, p.name])) as Record<PlantId, string>;
const names = (ids: PlantId[]) => ids.map((id) => NAME[id]);
const ALL: PlantId[] = ['thermal', 'hydro', 'nuclear', 'wind', 'geothermal', 'solar'];
const except = (...ids: PlantId[]) => names(ALL.filter((id) => !ids.includes(id)));

/** skip は、どちらともいえないので、まちがいの選択肢にも入れない発電所 */
const MERITS: { text: string; yes: PlantId[]; skip?: PlantId[]; explanation: string }[] = [
  {
    text: '次の発電方法のうち、天気や時間によって発電量が大きく変わるものはどれですか。',
    yes: ['solar', 'wind'],
    // 水力も、雨が少ない年は発電量がへる
    skip: ['hydro'],
    explanation: '太陽光発電は夜や雨の日に、風力発電は風が弱いときに、発電量が大きくへります。火力・原子力・地熱は、天気に関係なく発電できます。',
  },
  {
    text: '次の発電方法のうち、発電するときに二酸化炭素をいちばん多く出すものはどれですか。',
    yes: ['thermal'],
    explanation: '火力発電は、石炭・石油・天然ガスを燃やすので、二酸化炭素を多く出します。水力・風力・太陽光は、発電するときに二酸化炭素を出しません。',
  },
  {
    text: '次の発電方法のうち、タービンや発電機を回さずに電気をつくるものはどれですか。',
    yes: ['solar'],
    explanation: '太陽光発電は、光電池（太陽電池）が光を直接電気に変えます。ほかの発電所は、どれも何かの力で発電機を回しています。',
  },
  {
    text: '次の発電方法のうち、火山の近くにつくられることが多いものはどれですか。',
    yes: ['geothermal'],
    explanation: '地熱発電は、地下のマグマの熱でできた蒸気を使うので、火山の近くにつくられます。',
  },
  {
    text: '次の発電方法のうち、使い終わった燃料の処分が大きな課題になっているものはどれですか。',
    yes: ['nuclear'],
    explanation: '原子力発電の使用ずみ燃料は、長い間放射線を出しつづけるので、安全に保管・処分する方法が課題です。',
  },
  {
    text: '次の発電方法のうち、大きなダムをつくって水をためるものはどれですか。',
    yes: ['hydro'],
    explanation: '水力発電は、ダムにためた水を高いところから流し落として、水車を回します。',
  },
  {
    text: '次の発電方法のうち、燃料を燃やしたり核分裂させたりした熱で、水蒸気をつくるものはどれですか。',
    yes: ['thermal', 'nuclear'],
    explanation: '火力発電は燃料を燃やした熱で、原子力発電はウラン燃料が核分裂するときの熱で、水を熱して水蒸気をつくり、タービンを回します。',
  },
];

/** 発電方法のよいところと課題 (環境の分野) */
export const upperMerit: Gen = {
  id: 'power-u-merit',
  make: (rng) => {
    const m = pick(rng, MERITS);
    const d = oneOf(rng, { text: m.text, yes: names(m.yes), no: except(...m.yes, ...(m.skip ?? [])), explanation: m.explanation });
    // 正解の発電所の解説へ
    const answer = m.yes.find((id) => NAME[id] === d.choices[d.answer])!;
    return withLearn(answer, d);
  },
};
