/** g3 = 3 年生むけ … g6 = 6 年生むけ */
export type Level = 'g3' | 'g4' | 'g5' | 'g6';
export const LEVELS: readonly Level[] = ['g3', 'g4', 'g5', 'g6'];

/** レベルの学年 (3〜6) */
export const GRADE: Record<Level, number> = { g3: 3, g4: 4, g5: 5, g6: 6 };

/** ふりがなをつけるレベル */
export const withFurigana = (level: Level) => GRADE[level] <= 4;

export type Category =
  | 'plants'
  | 'animals'
  | 'body'
  | 'eco'
  | 'space'
  | 'weather'
  | 'earth'
  | 'matter'
  | 'heat'
  | 'bulbs'
  | 'magnet'
  | 'lever'
  | 'pulley'
  | 'spring'
  | 'motion'
  | 'light';

/** 分野を、生物・地学・化学・物理の 4 つの系統に分けたもの (画面にならべる順) */
export const FIELDS: readonly { name: string; categories: readonly Category[] }[] = [
  { name: '生物', categories: ['plants', 'animals', 'body', 'eco'] },
  { name: '地学', categories: ['space', 'weather', 'earth'] },
  { name: '化学', categories: ['matter', 'heat'] },
  { name: '物理', categories: ['bulbs', 'magnet', 'lever', 'pulley', 'spring', 'motion', 'light'] },
];

export const CATEGORIES: readonly Category[] = FIELDS.flatMap((f) => f.categories);

/**
 * 日ごとに出す分野を決めるための輪。ここから毎日 10 個つづけて取る (のこりの 6 個が、その日は出ない分野)。
 * 化学の 2 つは正反対の位置に、地学の 3 つは 5〜6 個おきに置いてあるので、
 * どこから取っても、生物・地学・化学・物理の 4 つの系統がかならず入る。
 */
export const CATEGORY_RING: readonly Category[] = [
  'matter', 'plants', 'weather', 'bulbs',
  'lever', 'animals', 'magnet', 'earth',
  'heat', 'pulley', 'body', 'spring',
  'motion', 'space', 'eco', 'light',
];

export const CATEGORY_LABEL: Record<Category, string> = {
  plants: '植物',
  animals: '動物',
  body: '人体',
  eco: '環境',
  space: '天体',
  weather: '気象',
  earth: '大地',
  matter: '物質',
  heat: '熱',
  bulbs: '電球の明るさ',
  magnet: '電磁石・発熱',
  lever: 'てこ・輪軸',
  pulley: 'かっ車',
  spring: 'ばね・浮力',
  motion: 'ふりこ・運動',
  light: '光・音',
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
