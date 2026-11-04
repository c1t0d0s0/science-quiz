import { describe, expect, it } from 'vitest';
import * as Battle from '../src/core/battle';
import type { Room } from '../src/core/battle';
import { CATEGORIES, FIELDS, LEVELS, type Question } from '../src/core/quiz';
import { rngFromString } from '../src/core/rng';

const room = (over: Partial<Room> = {}): Room => ({
  hostUid: 'h',
  grade: 4,
  count: 5,
  round: 1,
  seed: 'abc',
  status: 'playing',
  players: {
    0: { uid: 'h', name: 'あおい', joinedAt: 1, online: true },
    1: { uid: 'k', name: 'けんた', joinedAt: 2, online: true },
    2: { uid: 'm', name: 'みさき', joinedAt: 3, online: false },
  },
  starts: { 0: 100_000, 1: 200_000, 2: 300_000 },
  answers: {},
  ...over,
});

/** 正解の位置だけを決めた問題 (4 年生むけ・図なしなので、1 問の時間は 40 秒) */
const questions = (answers: number[]) => answers.map((answer) => ({ answer, text: 'a', choices: ['a', 'b', 'c', 'd'] }) as unknown as Question);

/** 答え。at は問題を出してから何ミリ秒後か */
const ans = (q: number, choice: number, after: number, round = 1) => ({ choice, round, at: room().starts[q] + after });

describe('出す分野', () => {
  it('分野のならびと cats の値は、行き来できる', () => {
    expect(Battle.categoriesOf(Battle.ALL_CATS)).toEqual([...CATEGORIES]);
    for (const f of FIELDS) expect(Battle.categoriesOf(Battle.catsOf(f.categories))).toEqual([...f.categories]);
    // ない・おかしな値は全部
    for (const bad of [undefined, 0, -1, 1.5, Battle.ALL_CATS + 1]) expect(Battle.categoriesOf(bad)).toEqual([...CATEGORIES]);
  });

  it('短い言い方', () => {
    expect(Battle.catsLabel(undefined)).toBe('すべての分野');
    expect(Battle.catsLabel(Battle.catsOf(['lever', 'pulley']))).toBe('てこ・輪軸・かっ車');
    expect(Battle.catsLabel(Battle.catsOf(['plants', 'animals', 'body', 'eco']))).toBe('4つの分野');
  });

  it('えらんだ分野の問題だけを、分野が 1 つでも決めた数だけ出す', () => {
    for (const level of LEVELS) {
      for (const c of CATEGORIES) {
        const qs = Battle.battleQuestions(level, 20, rngFromString(`${level}:${c}`), [c]);
        expect(qs, `${level} ${c}`).toHaveLength(20);
        expect(qs.every((q) => q.category === c)).toBe(true);
        expect(new Set(qs.map((q) => `${q.text}|${q.choices[q.answer]}`)).size).toBe(20);
      }
    }
  });

  it('部屋の分野で問題を作る (分野がない部屋は全部)', () => {
    const only = Battle.catsOf(['spring', 'motion']);
    const qs = Battle.makeGame(room({ count: 10, cats: only }));
    expect(qs.every((q) => q.category === 'spring' || q.category === 'motion')).toBe(true);
    expect(Battle.makeGame(room({ cats: Battle.ALL_CATS }))).toEqual(Battle.makeGame(room()));
  });
});

describe('たいせんの問題', () => {
  it('同じ種なら、どの端末でも同じ問題になる', () => {
    const a = Battle.makeGame(room());
    expect(Battle.makeGame(room())).toEqual(a);
    expect(Battle.makeGame(room({ round: 2 }))).not.toEqual(a);
    expect(Battle.makeGame(room({ seed: 'xyz' }))).not.toEqual(a);
    expect(a).toHaveLength(5);
  });

  it('部屋の学年のジェネレーターから、決めた数だけ、ちがう問題を出す', () => {
    for (const level of LEVELS) {
      for (const count of Battle.COUNTS) {
        for (let s = 0; s < 20; s++) {
          const qs = Battle.battleQuestions(level, count, rngFromString(`${level}:${count}:${s}`));
          expect(qs).toHaveLength(count);
          expect(new Set(qs.map((q) => q.text)).size).toBe(count);
          // 同じジェネレーターは 1 回だけ
          expect(new Set(qs.map((q) => q.id)).size).toBe(count);
          // 16 問までは、分野も重ならない
          expect(new Set(qs.map((q) => q.category)).size).toBe(Math.min(count, 16));
          for (const q of qs) {
            expect(q.choices).toHaveLength(4);
            expect(q.answer).toBeGreaterThanOrEqual(0);
            expect(q.answer).toBeLessThan(4);
          }
        }
      }
    }
  });

  it('学年のレベルが部屋の grade に合う', () => {
    expect(Battle.levelOf({ grade: 3 })).toBe('g3');
    expect(Battle.levelOf({ grade: 6 })).toBe('g6');
    expect(Battle.GRADES).toEqual([3, 4, 5, 6]);
    // 3・4 年生むけはふりがなつき、5・6 年生むけはなし
    const low = Battle.makeGame(room({ grade: 3, count: 20 }));
    const high = Battle.makeGame(room({ grade: 6, count: 20 }));
    expect(low.some((q) => /\([ぁ-ん]+\)/.test(q.text))).toBe(true);
    expect(high).not.toEqual(low);
  });

  it('時間は、5・6 年生むけと図のある問題が長い', () => {
    expect(Battle.timeLimit('g3', { text: 'a' })).toBe(40);
    expect(Battle.timeLimit('g6', { text: 'a' })).toBe(50);
    expect(Battle.timeLimit('g6', { text: 'a', svg: '<svg/>' })).toBe(60);
  });

  it('作りかたが変わったか見分ける印', () => {
    expect(Battle.dataVersion()).toMatch(/^s\d+-[0-9a-f]{8}$/);
    expect(Battle.dataVersion()).toBe(Battle.dataVersion());
  });
});

describe('部屋のきまり', () => {
  it('コード・なまえ・席', () => {
    expect(Battle.parseCode('１２３４５')).toBe('12345');
    expect(Battle.parseCode('12-345')).toBe('12345');
    expect(Battle.parseCode('01234')).toBeNull();
    expect(Battle.parseCode('1234')).toBeNull();
    expect(Battle.makeCode(() => 0)).toBe('10000');
    expect(Battle.makeCode(() => 0.99999)).toBe('99999');
    expect(Battle.cleanName('  あ\u0000い  う\u2028えおかきくけこさし ')).toBe('あい うえおかきくけ');
    expect(Battle.freeSeat(room())).toBe('3');
    expect(Battle.seatOf(room(), 'k')).toBe('1');
    expect(Battle.seatOf(room(), 'x')).toBeNull();
  });

  it('今いる人がみんな答えたら、その問題はおしまい', () => {
    expect(Battle.settled(room(), 0)).toBe(false);
    expect(Battle.settled(room({ answers: { 0: { 0: ans(0, 1, 1000) } } }), 0)).toBe(false);
    expect(Battle.settled(room({ answers: { 0: { 0: ans(0, 1, 1000), 1: ans(0, 2, 2000) } } }), 0)).toBe(true);
    // いない人 (みさき) は待たない。前の回の答えは数えない
    expect(Battle.settled(room({ answers: { 0: { 0: ans(0, 1, 1000), 1: ans(0, 2, 2000, 0) } } }), 0)).toBe(false);
    expect(Battle.answeredCount(room({ answers: { 0: { 0: ans(0, 1, 1000), 2: ans(0, 1, 1000) } } }), 0)).toEqual({ done: 1, here: 2 });
  });

  it('答えるまでの時間: 制限時間が上限で、答えなかった問題は制限時間', () => {
    const r = room({ answers: { 0: { 0: ans(0, 1, 12_345) }, 1: { 0: ans(1, 1, 99_000) } } });
    expect(Battle.answerTime(r, 0, '0', 40_000)).toBe(12_345);
    expect(Battle.answerTime(r, 1, '0', 40_000)).toBe(40_000);
    expect(Battle.answerTime(r, 2, '0', 40_000)).toBe(40_000);
    // 前の回の答えは数えない
    expect(Battle.answerTime(room({ answers: { 0: { 0: ans(0, 1, 5000, 0) } } }), 0, '0', 40_000)).toBe(40_000);
  });

  it('順位: 正解数が多い順、同じなら時間の合計が短い順。出た人は順位なしで最後', () => {
    const qs = questions([1, 2, 3]);
    const rows = Battle.standings(
      room({
        answers: {
          // あおい: 2 問正解・合計 10+20+40 秒、けんた: 2 問正解・合計 5+5+40 秒、みさき (出た): 3 問正解
          0: { 0: ans(0, 1, 10_000), 1: ans(0, 1, 5000), 2: ans(0, 1, 1000) },
          1: { 0: ans(1, 2, 20_000), 1: ans(1, 2, 5000), 2: ans(1, 2, 1000) },
          2: { 2: ans(2, 3, 1000) },
        },
      }),
      qs,
    );
    expect(rows.map((r) => [r.name, r.correct, r.time, r.rank])).toEqual([
      ['けんた', 2, 50_000, 1],
      ['あおい', 2, 70_000, 2],
      ['みさき', 3, 3000, null],
    ]);
    expect(rows[0].rate).toBeCloseTo(2 / 3);
    expect(rows[0].right).toEqual([0, 1]);
  });

  it('正解数も時間も同じなら同じ順位', () => {
    const rows = Battle.standings(room({ answers: { 0: { 0: ans(0, 1, 3000), 1: ans(0, 1, 3000) } } }), questions([1]));
    expect(rows.filter((r) => r.online).map((r) => r.rank)).toEqual([1, 1]);
  });

  it('正解率と時間の書き方', () => {
    expect(Battle.rateText(0.8)).toBe('80%');
    expect(Battle.rateText(2 / 3)).toBe('67%');
    expect(Battle.timeText(45_230)).toBe('45.2秒');
    expect(Battle.timeText(83_000)).toBe('1分23秒');
  });
});
