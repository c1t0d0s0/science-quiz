import type { Question } from '../core/quiz';
import { shuffle, type Rng } from '../core/rng';

/** ジェネレーターが返すもの (カテゴリーなどは、あとで daily.ts がつける) */
export type Draft = Pick<Question, 'text' | 'svg' | 'choices' | 'answer' | 'explanation'>;

export interface Gen {
  id: string;
  make: (rng: Rng) => Draft;
}

/** ジェネレーターと、それを出す学年 (3〜6) */
export interface Entry {
  gen: Gen;
  grades: readonly number[];
}

export const forGrades = (gen: Gen, ...grades: number[]): Entry => ({ gen, grades });

export const int = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
export const pick = <T>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)];
export const sample = <T>(rng: Rng, items: readonly T[], n: number): T[] => shuffle(items, rng).slice(0, n);

/** 図の中の記号 */
export const KANA = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ'] as const;

/** 小数第 2 位までの数を、よぶんな 0 をつけずに文字にする */
export function fmt(n: number): string {
  return String(Math.round(n * 100) / 100);
}

interface Base {
  text: string;
  svg?: string;
  explanation: string;
}

/** 正解 1 つと、まちがい 3 つをまぜて 4 択にする。まちがいの候補が多いときは、その中から 3 つえらぶ */
export function choice(rng: Rng, q: Base & { correct: string; wrong: readonly string[] }): Draft {
  const wrong = shuffle([...new Set(q.wrong)].filter((w) => w !== q.correct), rng).slice(0, 3);
  if (wrong.length < 3) throw new Error(`まちがいの選択肢が足りません: ${q.text}`);
  const choices = shuffle([q.correct, ...wrong], rng);
  return { text: q.text, svg: q.svg, choices, answer: choices.indexOf(q.correct), explanation: q.explanation };
}

/** 選択肢のならび順を変えない 4 択 (ア・イ・ウ・エ や、東・西・南・北 など) */
export function fixed(q: Base & { choices: readonly string[]; correct: string }): Draft {
  const answer = q.choices.indexOf(q.correct);
  if (answer < 0 || q.choices.length !== 4) throw new Error(`選択肢が正しくありません: ${q.text}`);
  return { text: q.text, svg: q.svg, choices: [...q.choices], answer, explanation: q.explanation };
}

/**
 * 数で答える問題。まちがいの候補 (よくある計算ちがいの答え) から 3 つえらび、小さい順にならべる。
 * 候補が足りないときは、正解の前後の数でおぎなう。
 */
export function numeric(
  rng: Rng,
  q: Base & { correct: number; wrong: readonly number[]; unit: string; show?: (n: number) => string },
): Draft {
  const key = (n: number) => Math.round(n * 100);
  const ok = (n: number) => Number.isFinite(n) && n > 0 && key(n) !== key(q.correct);
  const pool = new Map<number, number>();
  for (const w of q.wrong) if (ok(w)) pool.set(key(w), w);
  const step = Number.isInteger(q.correct) ? Math.max(1, Math.round(q.correct / 5)) : 0.5;
  for (const w of [q.correct * 2, q.correct / 2, q.correct + step, q.correct - step, q.correct + 2 * step, q.correct * 3]) {
    if (pool.size >= 3) break;
    if (ok(w)) pool.set(key(w), Math.round(w * 100) / 100);
  }
  const wrong = shuffle([...pool.values()], rng).slice(0, 3);
  const show = q.show ?? ((n: number) => `${fmt(n)}${q.unit}`);
  const values = [q.correct, ...wrong].sort((a, b) => a - b);
  return {
    text: q.text,
    svg: q.svg,
    choices: values.map(show),
    answer: values.indexOf(q.correct),
    explanation: q.explanation,
  };
}

/** 知識を問う問題の 1 つ分 */
export interface Fact {
  q: string;
  a: string;
  /** まちがいの選択肢 (3 つ以上) */
  wrong: readonly string[];
  ex: string;
  svg?: string;
}

/** いくつかの知識問題の中から、その日の 1 問をえらぶジェネレーター */
export function facts(id: string, list: readonly Fact[]): Gen {
  return {
    id,
    make: (rng) => {
      const f = pick(rng, list);
      return choice(rng, { text: f.q, svg: f.svg, correct: f.a, wrong: f.wrong, explanation: f.ex });
    },
  };
}

/**
 * 「あてはまるもの」を 1 つえらぶ問題。yes から正解を 1 つ、no からまちがいを 3 つ取る。
 */
export function oneOf(rng: Rng, q: Base & { yes: readonly string[]; no: readonly string[] }): Draft {
  return choice(rng, { ...q, correct: pick(rng, q.yes), wrong: sample(rng, q.no, 3) });
}
