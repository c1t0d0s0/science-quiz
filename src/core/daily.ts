import { GENERATORS } from '../questions';
import type { Draft, Gen } from '../questions/helpers';
import { addRuby } from '../questions/ruby';
import { dayNumber } from './date';
import { CATEGORY_RING, DAILY_COUNT, withFurigana, type Category, type Level, type Question } from './quiz';
import { rngFromString, shuffle } from './rng';

/** 1 つのデッキに入れる問題の数の上限と、デッキを作るときにためす回数の上限 */
const DECK_SIZE = 12;
const DECK_TRIES = 30;

/** 作ったデッキと、最初のデッキの大きさ (何度も作らないように覚えておく) */
const decks = new Map<string, Draft[]>();
const deckSizes = new Map<string, number>();

const mod =(a: number, m: number) => ((a % m) + m) % m;

/**
 * その日の i 番目の分野と、それがその分野の何回目か。
 * 分野の輪から、日ごとに 10 個ずつ順に取っていく。通し番号 t の分野は輪の t mod 16 番目で、その分野の floor(t / 16) 回目になる。
 */
function slot(date: string, i: number): { category: Category; turn: number } {
  const t = dayNumber(date) * DAILY_COUNT + i;
  return { category: CATEGORY_RING[mod(t, CATEGORY_RING.length)], turn: Math.floor(t / CATEGORY_RING.length) };
}

/**
 * その日に出す分野 (10 個。重なりはない)。
 * 輪は 16 個なので、つづく 8 日間でどの分野もちょうど 5 回ずつ回ってくる。
 */
export function dailyCategories(date: string): Category[] {
  return Array.from({ length: DAILY_COUNT }, (_, i) => slot(date, i).category);
}

/** その学年・分野のジェネレーターを、周回 c でならべる順 */
function round(level: Level, category: Category, c: number): Gen[] {
  const gens = GENERATORS[level][category];
  // 2 個以下なら、まぜずに交互に出す (入れかえると、前の周回の最後まで変わってしまう)
  return gens.length <= 2 ? gens.slice() : shuffle(gens, rngFromString(`${level}:${category}:${c}`));
}

/**
 * その分野の turn 回目に出すジェネレーターと、それが何回目か。
 * L 個のジェネレーターを周回ごとにまぜて、1 つずつ順に出す (どれも L 回に 1 回出る)。
 * 前の周回の最後と同じものが最初に来たら、2 番目と入れかえる (同じものがつづけて出ない)。
 * 3 個以上なら、入れかえても最後は変わらないので、前の周回は入れかえる前の並びとくらべればよい。
 */
function pickGen(level: Level, category: Category, turn: number): { gen: Gen; uses: number } {
  const size = GENERATORS[level][category].length;
  const c = Math.floor(turn / size);
  const order = round(level, category, c);
  if (size > 1 && order[0] === round(level, category, c - 1)[size - 1]) [order[0], order[1]] = [order[1], order[0]];
  return { gen: order[mod(turn, size)], uses: c };
}

/**
 * ジェネレーターの uses 回目の問題。
 * ちがう問題を最大 12 個作って 1 つのデッキにし、まぜた順に 1 つずつ出す。デッキを出し終わるまで、同じ問題は出ない。
 * 知識問題はデッキに全部が入り、計算問題はデッキごとに新しい数になる。
 */
function draw(level: Level, gen: Gen, uses: number): Draft {
  const key = (d: Draft) => `${d.text}|${d.svg ?? ''}|${d.choices[d.answer]}`;
  const deckOf = (n: number) => {
    const cached = decks.get(`${level}:${gen.id}:${n}`);
    if (cached) return cached;
    const deck = new Map<string, Draft>();
    for (let s = 0; s < DECK_TRIES && deck.size < DECK_SIZE; s++) {
      const d = gen.make(rngFromString(`${level}:${gen.id}:${n}:${s}`));
      if (!deck.has(key(d))) deck.set(key(d), d);
    }
    const list = shuffle([...deck.values()], rngFromString(`${level}:${gen.id}:deck:${n}`));
    if (decks.size >= 2000) decks.clear();
    decks.set(`${level}:${gen.id}:${n}`, list);
    return list;
  };
  // デッキの大きさはジェネレーターによってちがうが、同じジェネレーターならどのデッキもほぼ同じ。最初のデッキの大きさで区切る
  const id = `${level}:${gen.id}`;
  const size = deckSizes.get(id) ?? deckSizes.set(id, deckOf(0).length).get(id)!;
  const deck = deckOf(Math.floor(uses / size));
  return deck[mod(uses, size) % deck.length];
}

/**
 * その日・そのレベルの 10 問。同じ日付とレベルなら、いつ・どの端末で作っても同じになる。
 * ジェネレーターを足すと、その分野の出す順番が変わる (前の日の問題も変わる)。
 */
export function dailyQuestions(date: string, level: Level): Question[] {
  const rng = rngFromString(`${date}:${level}`);
  const ruby = withFurigana(level) ? addRuby : (s: string) => s;
  const questions: Question[] = Array.from({ length: DAILY_COUNT }, (_, i) => {
    const { category, turn } = slot(date, i);
    const { gen, uses } = pickGen(level, category, turn);
    const q = draw(level, gen, uses);
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
