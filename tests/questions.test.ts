import { describe, expect, it } from 'vitest';
import { CATEGORIES, LEVELS } from '../src/core/quiz';
import { rngFromString } from '../src/core/rng';
import { analyze, fracValue, type Circuit } from '../src/diagrams/circuit';
import { GENERATORS } from '../src/questions';
import type { Gen } from '../src/questions/helpers';
import { addRuby } from '../src/questions/ruby';
import { assertValid } from './helpers';

// いくつかの学年に出すジェネレーターは、1 回だけ数える
const ALL: Gen[] = [...new Set(LEVELS.flatMap((level) => CATEGORIES.flatMap((c) => GENERATORS[level][c])))];
const byId = (id: string) => ALL.find((g) => g.id === id)!;
const RUNS = 300;

/** ジェネレーターを何度も動かして、作った問題と正解の選択肢をわたす */
function each(id: string, check: (text: string, correct: string, alt: string) => void): void {
  for (let i = 0; i < RUNS; i++) {
    const q = byId(id).make(rngFromString(`${id}:${i}`));
    check(q.text, q.choices[q.answer], q.svg?.match(/aria-label="([^"]+)"/)?.[1] ?? '');
  }
}

/** 文の中の数を、出てくる順に取り出す */
const numbers = (s: string) => (s.match(/\d+(\.\d+)?/g) ?? []).map(Number);

describe('問題のジェネレーター', () => {
  it('どの学年にも、カテゴリーごとに 3 つ以上ある (1 日に 2 問まで出す)', () => {
    for (const level of LEVELS) for (const c of CATEGORIES) expect(GENERATORS[level][c].length, `${level} ${c}`).toBeGreaterThanOrEqual(3);
    expect(new Set(ALL.map((g) => g.id)).size).toBe(ALL.length);
  });

  it('どのジェネレーターも、どんな乱数でも正しい形の問題を作る', () => {
    for (const gen of ALL) {
      const seen = new Set<string>();
      for (let i = 0; i < RUNS; i++) {
        const q = gen.make(rngFromString(`${gen.id}:${i}`));
        assertValid(q, `${gen.id} #${i}`);
        seen.add(q.text + q.choices.join('/') + (q.svg ?? ''));
      }
      // 毎日同じ問題にならないよう、いくつかの出し方がある
      expect(seen.size, gen.id).toBeGreaterThanOrEqual(3);
    }
  });
});

// 計算問題の正解を、ジェネレーターとは別の式でたしかめる
describe('計算問題の検算', () => {
  it('てこ: 左右の「重さ × きょり」が等しい', () => {
    each('lever-l-balance', (text, correct) => {
      const [d1, w1, d2] = numbers(text);
      expect(w1 * d1).toBe(numbers(correct)[0] * d2);
    });
    each('lever-l-position', (text, correct) => {
      const [d1, w1, w2] = numbers(text);
      expect(w1 * d1).toBe(w2 * numbers(correct)[0]);
    });
    each('lever-u-two', (text, correct) => {
      const [db, wb, da, wa, d] = numbers(text);
      expect(wb * db + wa * da).toBe(numbers(correct)[0] * d);
    });
  });

  it('てこ: かたむく向きは、大きい方', () => {
    each('lever-l-tilt', (text, correct) => {
      const [d1, w1, d2, w2] = numbers(text);
      const diff = w1 * d1 - w2 * d2;
      expect(correct).toBe(diff > 0 ? '左にかたむく' : diff < 0 ? '右にかたむく' : '水平につり合う');
    });
  });

  it('棒の重さ: 支点のまわりで、おもりと棒の重さがつり合う', () => {
    each('lever-u-barweight', (text, correct) => {
      const [length, bar, a] = numbers(text);
      expect(numbers(correct)[0] * a).toBe(bar * (length / 2 - a));
    });
  });

  it('ばねばかり 2 つ: 合計がおもりの重さで、左はしのまわりでつり合う', () => {
    each('lever-u-scales', (text, correct) => {
      const [length, x, w] = numbers(text);
      const value = numbers(correct)[0];
      const right = text.includes('ばねばかりBは') ? value : w - value;
      expect(right * length).toBe(w * x);
    });
  });

  it('モビール: 上下の棒がどちらもつり合う', () => {
    // 長さは図に書いてあるので、図の説明から数を読む
    each('lever-u-mobile', (_text, correct, alt) => {
      const [, upL, upR, lowL, lowR, b] = numbers(alt);
      const a = (b * lowR) / lowL;
      expect(a * lowL).toBe(b * lowR);
      expect((a + b) * upL).toBe(numbers(correct)[0] * upR);
    });
  });

  it('輪じく: 力は半径の逆の比、長さは半径の比', () => {
    each('lever-u-wheel', (text, correct) => {
      const [wheel, axle, load, up] = numbers(text);
      if (text.includes('何gの力')) expect(numbers(correct)[0] * wheel).toBe(load * axle);
      else expect(numbers(correct)[0] * axle).toBe(up * wheel);
    });
  });

  it('かっ車: ささえるひもの本数で割る', () => {
    each('pulley-u-heavy', (text, correct) => {
      const [p, a] = numbers(text);
      const value = numbers(correct)[0];
      // 引く力 × 2 = おもり + 動かっ車
      if (text.includes('何gの力')) expect(value * 2).toBe(a + p);
      else expect(a * 2).toBe(value + p);
    });
    each('pulley-u-tackle', (text, correct) => {
      const [, k, a] = numbers(text);
      expect(numbers(correct)[0]).toBe(text.includes('何gの力') ? a / k : a * k);
    });
    each('pulley-u-cascade', (text, correct) => {
      const [n, w, h] = numbers(text);
      expect(numbers(correct)[0]).toBe(text.includes('何gの力') ? w / 2 ** n : h * 2 ** n);
    });
  });

  it('こさ: 食塩 ÷ 食塩水 × 100', () => {
    each('matter-u-concentration', (text, correct) => {
      const n = numbers(text);
      const value = numbers(correct)[0];
      if (text.startsWith('水')) expect(value).toBeCloseTo((n[1] / (n[0] + n[1])) * 100, 6);
      else if (text.includes('とけている食塩は')) expect(value).toBeCloseTo((n[1] * n[0]) / 100, 6);
      else expect(value).toBeCloseTo(((n[1] * n[0]) / 100 / (n[1] + n[2])) * 100, 6);
    });
  });

  it('金属の燃焼: 重さの比で酸素が結びつく', () => {
    each('matter-u-burn', (text, correct) => {
      if (!text.includes('重さの比')) return;
      const [m, o, before] = numbers(text);
      const oxygen = (before * o) / m;
      expect(numbers(correct)[0]).toBeCloseTo(text.includes('結びついた酸素は') ? oxygen : before + oxygen, 6);
    });
  });

  it('南中高度: 90 − 緯度 に、夏至は +23.4、冬至は −23.4', () => {
    each('space-u-altitude', (text, correct) => {
      const lat = numbers(text)[0];
      const shift = text.includes('夏至') ? 23.4 : text.includes('冬至') ? -23.4 : 0;
      expect(numbers(correct)[0]).toBeCloseTo(90 - lat + shift, 6);
    });
  });

  it('回路: 乾電池が出す電力と、豆電球が使う電力が等しい', () => {
    for (const cells of [1, 2, 3]) {
      for (const cellMode of ['s', 'p'] as const) {
        for (const bulbs of [1, 2, 3]) {
          for (const bulbMode of ['s', 'p'] as const) {
            const c: Circuit = { cells, cellMode, bulbs, bulbMode };
            const a = analyze(c);
            const volt = cellMode === 's' ? cells : 1;
            // 電力 = 電圧 × 電流。豆電球 1 個の抵抗を 1 とすると、豆電球の電力は 電流 × 電流
            expect(volt * fracValue(a.total)).toBeCloseTo(bulbs * fracValue(a.perBulb) ** 2, 9);
            // 乾電池 1 個に流れる電流を集めると、全体の電流になる
            expect(fracValue(a.perCell) * (cellMode === 'p' ? cells : 1)).toBeCloseTo(fracValue(a.total), 9);
          }
        }
      }
    }
  });
});

describe('ふりがな', () => {
  it('言葉ごとに、最初の 1 回だけつける', () => {
    expect(addRuby('支点から力点まで。支点は')).toBe('支点(してん)から力点(りきてん)まで。支点は');
  });

  it('ほかの漢字につづく言葉や、すでにふりがなのある言葉には、つけない', () => {
    expect(addRuby('背骨と骨')).toBe('背骨と骨(ほね)');
    expect(addRuby('豆電球(まめでんきゅう)')).toBe('豆電球(まめでんきゅう)');
    expect(addRuby('定かっ車と動かっ車')).toBe('定(てい)かっ車と動(どう)かっ車');
  });
});
