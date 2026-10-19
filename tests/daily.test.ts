import { describe, expect, it } from 'vitest';
import { dailyCategories, dailyQuestions } from '../src/core/daily';
import { addDays, dayNumber, jstDate } from '../src/core/date';
import { CATEGORIES, CATEGORY_RING, DAILY_COUNT, FIELDS, LEVELS, type Level } from '../src/core/quiz';
import { assertValid } from './helpers';

const START = '2026-10-01';
const DAYS = 400;
/** 30 日以内に同じ問題が出る割合の上限 */
const MAX_REPEAT: Record<Level, number> = { g3: 0.65, g4: 0.55, g5: 0.2, g6: 0.1 };

describe('今日の 10 問', () => {
  it('どの日も 10 問で、分野が重ならない', () => {
    for (const level of LEVELS) {
      for (let i = 0; i < DAYS; i++) {
        const date = addDays(START, i);
        const qs = dailyQuestions(date, level);
        expect(qs.length, date).toBe(DAILY_COUNT);
        expect(new Set(qs.map((q) => q.category)).size, date).toBe(DAILY_COUNT);
        // その日に出すと決めた分野と合っている
        expect(qs.map((q) => q.category).sort()).toEqual(dailyCategories(date).slice().sort());
        // 4 つの系統 (生物・地学・化学・物理) が、毎日すべて入っている
        for (const f of FIELDS) expect(qs.some((q) => f.categories.includes(q.category)), `${date} ${f.name}`).toBe(true);
        qs.forEach((q) => assertValid(q, `${date} ${level} ${q.id}`));
      }
    }
  });

  it('分野の輪には、16 の分野が 1 回ずつ入っている', () => {
    expect([...CATEGORY_RING].sort()).toEqual([...CATEGORIES].sort());
    expect(CATEGORIES.length).toBe(16);
  });

  it('つづく 8 日間で、どの分野もちょうど 5 問ずつ出る', () => {
    for (let i = 0; i < 60; i++) {
      const count = new Map<string, number>();
      for (let d = 0; d < 8; d++) {
        for (const c of dailyCategories(addDays(START, i + d))) count.set(c, (count.get(c) ?? 0) + 1);
      }
      for (const c of CATEGORIES) expect(count.get(c), `${addDays(START, i)} ${c}`).toBe(5);
    }
  });

  it('同じ日・同じレベルなら、何度作っても同じ問題になる', () => {
    for (const level of LEVELS) {
      for (let i = 0; i < 60; i++) {
        const date = addDays(START, i);
        expect(dailyQuestions(date, level)).toEqual(dailyQuestions(date, level));
      }
    }
  });

  it('日付やレベルが変わると、問題が変わる', () => {
    const key = (date: string, level: Level) => JSON.stringify(dailyQuestions(date, level).map((q) => [q.id, q.text, q.choices]));
    for (let i = 0; i < 60; i++) {
      const date = addDays(START, i);
      for (const level of LEVELS) expect(key(date, level)).not.toBe(key(addDays(date, 1), level));
      // どの学年どうしも、ちがう問題になる
      expect(new Set(LEVELS.map((level) => key(date, level))).size).toBe(LEVELS.length);
    }
  });

  it('同じ分野で、同じジェネレーターがつづけて出ない', () => {
    for (const level of LEVELS) {
      const last = new Map<string, string>();
      for (let i = 0; i < DAYS; i++) {
        const date = addDays(START, i);
        for (const q of dailyQuestions(date, level)) {
          expect(last.get(q.category), `${date} ${level} ${q.category}`).not.toBe(q.id);
          last.set(q.category, q.id);
        }
      }
    }
  });

  it('30 日以内に、まったく同じ問題はあまり出ない', () => {
    for (const level of LEVELS) {
      const seen = new Map<string, number>();
      let repeated = 0;
      let total = 0;
      for (let i = 0; i < 120; i++) {
        for (const q of dailyQuestions(addDays(START, i), level)) {
          const key = `${q.text}|${q.svg ?? ''}|${q.choices[q.answer]}`;
          if (i >= 30) {
            total++;
            if ((seen.get(key) ?? -Infinity) >= i - 30) repeated++;
          }
          seen.set(key, i);
        }
      }
      expect(repeated / total, level).toBeLessThanOrEqual(MAX_REPEAT[level]);
    }
  });

  it('3 年生むけには、ふりがながつく', () => {
    const texts = Array.from({ length: 30 }, (_, i) => dailyQuestions(addDays(START, i), 'g3').map((q) => q.text + q.explanation)).flat().join('');
    expect(texts).toMatch(/豆電球\(まめでんきゅう\)/);
    expect(texts).toMatch(/支点\(してん\)/);
  });
});

describe('日付', () => {
  it('日本時間の午前 0 時に日付が変わる', () => {
    expect(jstDate(new Date('2026-10-12T14:59:59Z'))).toBe('2026-10-12');
    expect(jstDate(new Date('2026-10-12T15:00:00Z'))).toBe('2026-10-13');
  });

  it('日数は 1 日ごとに 1 ずつふえる', () => {
    expect(dayNumber('2026-10-13') - dayNumber('2026-10-12')).toBe(1);
    expect(dayNumber('2027-01-01') - dayNumber('2026-12-31')).toBe(1);
  });
});
