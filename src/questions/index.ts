import type { Category, Level } from '../core/quiz';
import { ANIMALS } from './animals';
import { BULBS } from './bulbs';
import type { Gen } from './helpers';
import { LEVER } from './lever';
import { MATTER } from './matter';
import { PLANTS } from './plants';
import { PULLEY } from './pulley';
import { SPACE } from './space';

const SETS: Record<Category, Record<Level, Gen[]>> = {
  plants: PLANTS,
  animals: ANIMALS,
  space: SPACE,
  matter: MATTER,
  bulbs: BULBS,
  lever: LEVER,
  pulley: PULLEY,
};

/** レベル → カテゴリー → 問題のジェネレーター */
export const GENERATORS: Record<Level, Record<Category, Gen[]>> = {
  lower: Object.fromEntries(Object.entries(SETS).map(([c, set]) => [c, set.lower])) as Record<Category, Gen[]>,
  upper: Object.fromEntries(Object.entries(SETS).map(([c, set]) => [c, set.upper])) as Record<Category, Gen[]>,
};
