import { CATEGORIES, GRADE, LEVELS, type Category, type Level } from '../core/quiz';
import { ANIMALS } from './animals';
import { BODY } from './body';
import { BULBS } from './bulbs';
import { EARTH } from './earth';
import { ECO } from './eco';
import { HEAT } from './heat';
import type { Entry, Gen } from './helpers';
import { LEVER } from './lever';
import { LIGHT } from './light';
import { MAGNET } from './magnet';
import { MATTER } from './matter';
import { MOTION } from './motion';
import { PLANTS } from './plants';
import { PULLEY } from './pulley';
import { SPACE } from './space';
import { SPRING } from './spring';
import { WEATHER } from './weather';

const SETS: Record<Category, Entry[]> = {
  plants: PLANTS,
  animals: ANIMALS,
  body: BODY,
  eco: ECO,
  space: SPACE,
  weather: WEATHER,
  earth: EARTH,
  matter: MATTER,
  heat: HEAT,
  bulbs: BULBS,
  magnet: MAGNET,
  lever: LEVER,
  pulley: PULLEY,
  spring: SPRING,
  motion: MOTION,
  light: LIGHT,
};

const forLevel = (level: Level) =>
  Object.fromEntries(
    CATEGORIES.map((c) => [c, SETS[c].filter((e) => e.grades.includes(GRADE[level])).map((e) => e.gen)]),
  ) as Record<Category, Gen[]>;

/** レベル (学年) → 分野 → 問題のジェネレーター */
export const GENERATORS = Object.fromEntries(LEVELS.map((level) => [level, forLevel(level)])) as Record<Level, Record<Category, Gen[]>>;
