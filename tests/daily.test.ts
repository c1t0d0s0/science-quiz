import { describe, expect, it } from 'vitest';
import { dailyCategories, dailyQuestions } from '../src/core/daily';
import { addDays, dayNumber, jstDate } from '../src/core/date';
import { CATEGORIES, DAILY_COUNT, LEVELS } from '../src/core/quiz';
import { assertValid } from './helpers';

const START = '2026-10-01';
const DAYS = 400;

describe('今日の 10 問', () => {
  it('どの日も 10 問で、7 つのカテゴリーがすべて入っている', () => {
    for (const level of LEVELS) {
      for (let i = 0; i < DAYS; i++) {
        const date = addDays(START, i);
        const qs = dailyQuestions(date, level);
        expect(qs.length, date).toBe(DAILY_COUNT);
        for (const c of CATEGORIES) expect(qs.some((q) => q.category === c), `${date} ${c}`).toBe(true);
        // その日に出すと決めたカテゴリーの数と合っている
        expect(qs.map((q) => q.category).sort()).toEqual(dailyCategories(date).slice().sort());
        // 同じ種類の問題が 1 日に 2 回出ない
        expect(new Set(qs.map((q) => q.id)).size, date).toBe(DAILY_COUNT);
        qs.forEach((q) => assertValid(q, `${date} ${level} ${q.id}`));
      }
    }
  });

  it('つづく 7 日間で、どのカテゴリーもちょうど 10 問ずつ出る', () => {
    for (let i = 0; i < 60; i++) {
      const count = new Map<string, number>();
      for (let d = 0; d < 7; d++) {
        for (const c of dailyCategories(addDays(START, i + d))) count.set(c, (count.get(c) ?? 0) + 1);
      }
      for (const c of CATEGORIES) expect(count.get(c), `${addDays(START, i)} ${c}`).toBe(10);
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
    const key = (date: string, level: 'lower' | 'upper') => JSON.stringify(dailyQuestions(date, level).map((q) => [q.id, q.text, q.choices]));
    for (let i = 0; i < 60; i++) {
      const date = addDays(START, i);
      expect(key(date, 'lower')).not.toBe(key(addDays(date, 1), 'lower'));
      expect(key(date, 'upper')).not.toBe(key(addDays(date, 1), 'upper'));
      expect(key(date, 'lower')).not.toBe(key(date, 'upper'));
    }
  });

  it('3・4 年むけには、ふりがながつく', () => {
    const texts = Array.from({ length: 30 }, (_, i) => dailyQuestions(addDays(START, i), 'lower').map((q) => q.text + q.explanation)).flat().join('');
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
