/** g3 = 3 年生むけ … g6 = 6 年生むけ */
export type Level = 'g3' | 'g4' | 'g5' | 'g6';
export const LEVELS: readonly Level[] = ['g3', 'g4', 'g5', 'g6'];

/** レベルの学年 (3〜6) */
export const GRADE: Record<Level, number> = { g3: 3, g4: 4, g5: 5, g6: 6 };

/** ふりがなをつけるレベル */
export const withFurigana = (level: Level) => GRADE[level] <= 4;

export type Category = 'plants' | 'animals' | 'space' | 'matter' | 'bulbs' | 'lever' | 'pulley';
export const CATEGORIES: readonly Category[] = ['plants', 'animals', 'space', 'matter', 'bulbs', 'lever', 'pulley'];

export const CATEGORY_LABEL: Record<Category, string> = {
  plants: '植物',
  animals: '動物',
  space: '天体',
  matter: '物質',
  bulbs: '電球の明るさ',
  lever: 'てこ・輪軸',
  pulley: 'かっ車',
};

/** 1 日に出す問題の数 */
export const DAILY_COUNT = 10;

export interface Question {
  /** どのジェネレーターが作ったか (テストと、同じ日に重ならないようにするために使う) */
  id: string;
  category: Category;
  /** 問題文。「漢字(かんじ)」と書くとふりがなになる。改行で段落を分ける */
  text: string;
  /** 図 (SVG)。図のない問題もある */
  svg?: string;
  choices: string[];
  /** 正解の位置 (choices の何番目か) */
  answer: number;
  explanation: string;
}
