import { GENERATORS } from '../questions';
import { addRuby } from '../questions/ruby';
import { dayNumber } from './date';
import { CATEGORY_RING, DAILY_COUNT, withFurigana, type Category, type Level, type Question } from './quiz';
import { rngFromString, shuffle } from './rng';

/**
 * その日に出す分野 (10 個。重なりはない)。分野の輪から、日ごとに 10 個ずつ順に取っていく。
 * 輪は 16 個なので、つづく 8 日間でどの分野もちょうど 5 回ずつ回ってくる。
 */
export function dailyCategories(date: string): Category[] {
  const n = dayNumber(date);
  const size = CATEGORY_RING.length;
  return Array.from({ length: DAILY_COUNT }, (_, i) => CATEGORY_RING[(((n * DAILY_COUNT + i) % size) + size) % size]);
}

/** その日・そのレベルの 10 問。同じ日付とレベルなら、いつ・どの端末で作っても同じになる */
export function dailyQuestions(date: string, level: Level): Question[] {
  const rng = rngFromString(`${date}:${level}`);
  const ruby = withFurigana(level) ? addRuby : (s: string) => s;
  const questions: Question[] = dailyCategories(date).map((category) => {
    // その分野のジェネレーターの中から、その日の 1 つをえらぶ
    const gen = shuffle(GENERATORS[level][category], rng)[0];
    // 問題ごとに乱数を分ける (ジェネレーターを足しても、ほかの問題の中身が変わらない)
    const q = gen.make(rngFromString(`${date}:${level}:${gen.id}`));
    return {
      id: gen.id,
      category,
      text: ruby(q.text),
      svg: q.svg,
      choices: q.choices.map(ruby),
      answer: q.answer,
      explanation: ruby(q.explanation),
    };
  });
  return shuffle(questions, rng);
}
