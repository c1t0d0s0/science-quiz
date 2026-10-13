import { beforeEach, describe, expect, it } from 'vitest';
import { dailyQuestions } from '../src/core/daily';
import { addDays } from '../src/core/date';
import {
  MONTH_POINTS,
  PERFECT_BONUS,
  QUIZ_POINTS,
  WEEK_POINTS,
  currentRun,
  earnedPoints,
  monthView,
  quizPoints,
  rewardFor,
  runLengths,
} from '../src/core/rewards';
import { balance, buyCard, earnedTotal, getCards, getStamps, importSnapshot, onStorageChange, saveAnswers, useStore } from '../src/core/storage';
import { CARDS } from '../src/data/cards';
import { cardSvg, shibaFace } from '../src/ui/shiba';
import { assertWellFormed } from './helpers';

let store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  },
});

beforeEach(() => {
  store = new Map();
  useStore(null);
  onStorageChange(null);
});

const days = (from: string, n: number) => Array.from({ length: n }, (_, i) => addDays(from, i));

/** その日・その学年の 10 問を、正解数が correct になるようにとき終える */
function finish(date: string, level: 'g3' | 'g4' | 'g5' | 'g6', correct = 10) {
  const questions = dailyQuestions(date, level);
  const answers = questions.map((q, i) => (i < correct ? q.answer : (q.answer + 1) % 4));
  return saveAnswers(date, level, questions, answers);
}

describe('ポイントの計算', () => {
  it('7 日連続するたびに 1000pt', () => {
    expect(earnedPoints(days('2026-10-01', 6)).total).toBe(0);
    expect(earnedPoints(days('2026-10-01', 7)).total).toBe(WEEK_POINTS);
    expect(earnedPoints(days('2026-10-01', 14)).total).toBe(WEEK_POINTS * 2);
  });

  it('とぎれたら数え直す', () => {
    const stamps = [...days('2026-10-01', 6), ...days('2026-10-08', 6)];
    expect(runLengths(stamps)).toEqual([6, 6]);
    expect(earnedPoints(stamps).total).toBe(0);
  });

  it('1 か月すべてそろうと +5000pt', () => {
    const november = days('2026-11-01', 30);
    expect(earnedPoints(november).months).toEqual(['2026-11']);
    expect(earnedPoints(november).total).toBe(WEEK_POINTS * 4 + MONTH_POINTS);
    expect(earnedPoints(november.slice(1)).months).toEqual([]);
    expect(monthView(november, '2026-11').every(Boolean)).toBe(true);
  });

  it('つづいている日数は、今日がまだでも、きのうまで続いていれば数える', () => {
    const stamps = days('2026-10-01', 3);
    expect(currentRun(stamps, '2026-10-03')).toBe(3);
    expect(currentRun(stamps, '2026-10-04')).toBe(3);
    expect(currentRun(stamps, '2026-10-05')).toBe(0);
  });

  it('スタンプを足したときにもらえる分', () => {
    const six = days('2026-10-01', 6);
    expect(rewardFor(six, '2026-10-07')).toEqual({ added: true, run: 7, weekPoints: WEEK_POINTS, monthPoints: 0 });
    expect(rewardFor(six, '2026-10-06').added).toBe(false);
  });

  it('10 問をとき終えると 20pt、全問正解なら +10pt', () => {
    expect(quizPoints(0)).toBe(QUIZ_POINTS);
    expect(quizPoints(9)).toBe(QUIZ_POINTS);
    expect(quizPoints(10)).toBe(QUIZ_POINTS + PERFECT_BONUS);
  });
});

describe('スタンプとポイントの記録', () => {
  it('とき終えると、ポイントとその日のスタンプがもらえる', () => {
    const reward = finish('2026-10-13', 'g3', 7);
    expect(reward).toEqual({ points: 20, perfect: false, stamp: { added: true, run: 1, weekPoints: 0, monthPoints: 0 } });
    expect(getStamps()).toEqual(['2026-10-13']);
    expect(balance()).toBe(20);
  });

  it('とちゅうまででは、何ももらえない', () => {
    const questions = dailyQuestions('2026-10-13', 'g3');
    expect(saveAnswers('2026-10-13', 'g3', questions, [0, 1, 2])).toBeNull();
    expect(getStamps()).toEqual([]);
    expect(balance()).toBe(0);
  });

  it('同じ日に別の学年をとき終えると、ポイントはもらえるが、スタンプは 1 日 1 個', () => {
    finish('2026-10-13', 'g3');
    const second = finish('2026-10-13', 'g4', 5);
    expect(second?.points).toBe(20);
    expect(second?.stamp.added).toBe(false);
    expect(getStamps()).toEqual(['2026-10-13']);
    expect(balance()).toBe(30 + 20);
  });

  it('同じ日・同じ学年は、2 回目からは何ももらえない', () => {
    finish('2026-10-13', 'g3', 3);
    expect(finish('2026-10-13', 'g3', 10)).toBeNull();
    expect(balance()).toBe(20);
  });

  it('7 日目のスタンプで 1000pt たまる', () => {
    let last = null;
    for (const d of days('2026-10-01', 7)) last = finish(d, 'g5', 0);
    expect(last?.stamp).toEqual({ added: true, run: 7, weekPoints: WEEK_POINTS, monthPoints: 0 });
    expect(balance()).toBe(7 * 20 + WEEK_POINTS);
  });

  it('スタンプができる前にとき終えていた日も、スタンプとポイントになる', () => {
    importSnapshot({ done: { 'lower:2026-10-01': 8, 'g3:2026-10-02': 10 }, cards: [], progress: {} });
    expect(getStamps()).toEqual(['2026-10-01', '2026-10-02']);
    expect(earnedTotal()).toBe(20 + 30);
  });

  it('カードと交換するとポイントがへる。足りないときや、もう持っているときは交換できない', () => {
    finish('2026-10-13', 'g3');
    finish('2026-10-13', 'g4');
    expect(balance()).toBe(60);
    expect(buyCard(CARDS[1])).toBe(false);
    expect(buyCard(CARDS[0])).toBe(true);
    expect(buyCard(CARDS[0])).toBe(false);
    expect(getCards()).toEqual([{ id: 's01', paid: 40 }]);
    expect(balance()).toBe(20);
  });
});

describe('柴犬カード', () => {
  it('20 種類で、id と名前が重複しない', () => {
    expect(CARDS.length).toBe(20);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(20);
    expect(new Set(CARDS.map((c) => c.name)).size).toBe(20);
  });

  it('値段は安い順にだんだん高くなり、合計は 28,420pt', () => {
    for (let i = 1; i < CARDS.length; i++) expect(CARDS[i].price).toBeGreaterThan(CARDS[i - 1].price);
    expect(CARDS.reduce((sum, c) => sum + c.price, 0)).toBe(28420);
  });

  it('見た目がすべてちがい、絵が正しくかける', () => {
    expect(new Set(CARDS.map((c) => JSON.stringify([c.look, c.bg, c.frame]))).size).toBe(20);
    for (const card of CARDS) assertWellFormed(cardSvg(card));
    assertWellFormed(`<svg viewBox="0 0 120 110">${shibaFace()}</svg>`);
  });

  it('名前の漢字は 3 年生までに習うものだけ', () => {
    const allowed = '虫花白黒王様';
    for (const card of CARDS) for (const ch of card.name.match(/[一-龠]/g) ?? []) expect(allowed, card.name).toContain(ch);
  });

  it('毎日 1 つの学年をとき終える人は、はじめの 5 枚を 2 週間以内に手に入れられる', () => {
    // 1 日 20pt (全問正解でない日) と、7 日つづくたびの 1000pt
    const first5 = CARDS.slice(0, 5).reduce((sum, c) => sum + c.price, 0);
    expect(14 * QUIZ_POINTS + 2 * WEEK_POINTS).toBeGreaterThanOrEqual(first5);
  });
});
