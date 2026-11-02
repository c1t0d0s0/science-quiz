import { describe, expect, it } from 'vitest';
import * as Battle from '../src/core/battle';
import type { Room } from '../src/core/battle';
import { LEVELS } from '../src/core/quiz';
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
  takes: {},
  faults: {},
  ...over,
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

  it('だれかがとるか、今いる人がみんなおてつきしたら、その問題はおしまい', () => {
    expect(Battle.settled(room(), 0)).toBe(false);
    expect(Battle.settled(room({ takes: { 0: { seat: '1', round: 1 } } }), 0)).toBe(true);
    // 前の回にとったものは数えない
    expect(Battle.settled(room({ takes: { 0: { seat: '1', round: 0 } } }), 0)).toBe(false);
    // いない人 (みさき) のおてつきは待たない
    expect(Battle.settled(room({ faults: { 0: { 0: true } } }), 0)).toBe(false);
    expect(Battle.settled(room({ faults: { 0: { 0: true, 1: true } } }), 0)).toBe(true);
  });

  it('順位: とった数が多い順、同じならおてつきが少ない順。出た人は順位なしで最後', () => {
    const rows = Battle.standings(
      room({
        takes: { 0: { seat: '1', round: 1 }, 1: { seat: '0', round: 1 }, 2: { seat: '1', round: 1 }, 3: { seat: '2', round: 1 } },
        faults: { 3: { 1: true }, 4: { 0: true } },
      }),
    );
    expect(rows.map((r) => [r.name, r.points, r.faults, r.rank])).toEqual([
      ['けんた', 2, 1, 1],
      ['あおい', 1, 1, 2],
      ['みさき', 1, 0, null],
    ]);
    expect(rows[0].taken).toEqual([0, 2]);
  });

  it('同じ数・同じおてつきなら同じ順位', () => {
    const rows = Battle.standings(room({ takes: { 0: { seat: '1', round: 1 }, 1: { seat: '0', round: 1 } } }));
    expect(rows.filter((r) => r.online).map((r) => r.rank)).toEqual([1, 1]);
  });
});
