/** lower = 3・4 年むけ、upper = 5・6 年むけ */
export type Level = 'lower' | 'upper';
export const LEVELS: readonly Level[] = ['lower', 'upper'];

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
