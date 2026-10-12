import { CATEGORIES, GRADE, LEVELS, type Category, type Level } from '../core/quiz';
import { ANIMALS } from './animals';
import { BULBS } from './bulbs';
import type { Entry, Gen } from './helpers';
import { LEVER } from './lever';
import { MATTER } from './matter';
import { PLANTS } from './plants';
import { PULLEY } from './pulley';
import { SPACE } from './space';

const SETS: Record<Category, Entry[]> = {
  plants: PLANTS,
  animals: ANIMALS,
  space: SPACE,
  matter: MATTER,
  bulbs: BULBS,
  lever: LEVER,
  pulley: PULLEY,
};

const forLevel = (level: Level) =>
  Object.fromEntries(
    CATEGORIES.map((c) => [c, SETS[c].filter((e) => e.grades.includes(GRADE[level])).map((e) => e.gen)]),
  ) as Record<Category, Gen[]>;

/** レベル (学年) → カテゴリー → 問題のジェネレーター */
export const GENERATORS = Object.fromEntries(LEVELS.map((level) => [level, forLevel(level)])) as Record<Level, Record<Category, Gen[]>>;
