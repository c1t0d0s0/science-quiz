import { GENERATORS } from '../questions';
import { addRuby } from '../questions/ruby';
import { dayNumber } from './date';
import { CATEGORIES, type Category, type Level, type Question } from './quiz';
import { rngFromString, shuffle } from './rng';

/**
 * その日に出すカテゴリー (10 個)。7 つのカテゴリーから 1 問ずつ出し、
 * のこりの 3 問は日ごとに順に送る (7 日でどのカテゴリーもちょうど 3 回ずつ回ってくる)。
 */
export function dailyCategories(date: string): Category[] {
  const n = dayNumber(date);
  const extra = [0, 1, 2].map((i) => CATEGORIES[(((n * 3 + i) % 7) + 7) % 7]);
  return [...CATEGORIES, ...extra];
}

/** その日・そのレベルの 10 問。同じ日付とレベルなら、いつ・どの端末で作っても同じになる */
export function dailyQuestions(date: string, level: Level): Question[] {
  const rng = rngFromString(`${date}:${level}`);
  const need = new Map<Category, number>();
  for (const c of dailyCategories(date)) need.set(c, (need.get(c) ?? 0) + 1);

  const questions: Question[] = [];
  for (const category of CATEGORIES) {
    // 同じ日に同じ種類の問題が重ならないよう、ジェネレーターをまぜてから先頭を使う
    const picked = shuffle(GENERATORS[level][category], rng).slice(0, need.get(category));
    for (const gen of picked) {
      // 問題ごとに乱数を分ける (ジェネレーターを足しても、ほかの問題の中身が変わらない)
      const q = gen.make(rngFromString(`${date}:${level}:${gen.id}`));
      const ruby = level === 'lower' ? addRuby : (s: string) => s;
      questions.push({
        id: gen.id,
        category,
        text: ruby(q.text),
        svg: q.svg,
        choices: q.choices.map(ruby),
        answer: q.answer,
        explanation: ruby(q.explanation),
      });
    }
  }
  return spread(shuffle(questions, rng));
}

/** 同じカテゴリーの問題がつづかないよう、できるだけ間をあける */
function spread(list: Question[]): Question[] {
  const out = list.slice();
  for (let i = 1; i < out.length; i++) {
    if (out[i].category !== out[i - 1].category) continue;
    const j = out.findIndex(
      (q, k) =>
        k > i &&
        q.category !== out[i - 1].category &&
        (k + 1 >= out.length || out[k + 1].category !== out[i].category) &&
        out[k - 1].category !== out[i].category,
    );
    if (j > 0) [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
