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
  it('どの学年にも、分野ごとに 2 つ以上ある (同じ分野が回ってきたとき、ちがう問題を出せる)', () => {
    for (const level of LEVELS) for (const c of CATEGORIES) expect(GENERATORS[level][c].length, `${level} ${c}`).toBeGreaterThanOrEqual(2);
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

// 新しく足した分野の計算問題
describe('計算問題の検算 (地学・物理・熱)', () => {
  const value = (correct: string) => numbers(correct)[0];

  it('ばね: のびは重さに比例し、全体の長さは もとの長さ + のび', () => {
    each('spring-l-stretch', (text, correct) => {
      const [w0, s0, w] = numbers(text);
      expect(value(correct) * w0).toBe(s0 * w);
    });
    each('spring-l-length', (text, correct) => {
      const [natural, , per, last] = numbers(text);
      if (text.includes('全体の長さが')) expect(value(correct)).toBe(((last - natural) / per) * 10);
      else expect(value(correct)).toBe(natural + (per * last) / 10);
    });
    each('spring-u-combo', (text, correct) => {
      const per = numbers(text)[1];
      const w = Number(text.match(/に(\d+)gのおもりをつるしました/)![1]);
      const single = (per * w) / 10;
      expect(value(correct)).toBe(text.includes('たてに1列') ? single * 2 : single / 2);
    });
  });

  it('浮力: おしのけた水の重さの分だけ軽くなる', () => {
    each('spring-u-buoyancy', (text, correct) => {
      const [, , a, b] = numbers(text);
      if (text.includes('ばねばかりは何gをしめしますか')) expect(value(correct)).toBe(a - b);
      else if (text.includes('体積は何cm³')) expect(value(correct)).toBe(a - b);
      else expect(value(correct)).toBe(a);
    });
    each('spring-u-pressure', (text, correct) => {
      if (!text.includes('水面より下')) return;
      const [, , , weight] = numbers(text);
      expect(value(correct)).toBe(weight);
    });
  });

  it('密度: 重さ ÷ 体積', () => {
    each('spring-u-density', (text, correct) => {
      const n = numbers(text);
      if (text.includes('（密度）は何g')) expect(value(correct)).toBeCloseTo(n[1] / n[0], 6);
      else if (text.includes('の重さは何g')) expect(value(correct)).toBeCloseTo(n[1] * n[2], 6);
    });
  });

  it('熱量: 水の重さ × 上がった温度', () => {
    each('heat-u-calorie', (text, correct) => {
      const n = numbers(text);
      if (text.startsWith('水1g')) expect(value(correct)).toBe(n[4] * (n[5] - n[3]));
      else if (text.startsWith('水100g')) expect(value(correct) * n[3]).toBe(n[2] * 100);
      else expect(value(correct) * 4).toBe(n[2] * n[3]);
    });
    each('heat-u-mix', (text, correct) => {
      const [t1, m1, t2, m2] = numbers(text);
      const t = value(correct);
      // 冷たい水が受けとった熱と、熱い水が失った熱が等しい
      expect(m1 * (t - t1)).toBe(m2 * (t2 - t));
    });
    each('heat-u-ice', (text, correct) => {
      const n = numbers(text);
      const g = n[8];
      const t = n[9];
      expect(value(correct)).toBe(g * 80 + g * t);
    });
  });

  it('電熱線: 上がる温度は時間に比例し、水の量に反比例する', () => {
    each('magnet-u-heater', (text, correct) => {
      if (!text.includes('何℃上がりますか')) return;
      const [, , rise, minutes, water] = numbers(text);
      expect(value(correct)).toBe((rise * (minutes / 5)) / (water / 100));
    });
  });

  it('気体の発生量: 塩酸がなくなるまでは石灰石に比例する', () => {
    each('matter-u-gasgraph', (text, correct, alt) => {
      const m = alt.match(/が(\d+)までは.*ふえて(\d+)になる/)!;
      const bend = Number(m[1]);
      const max = Number(m[2]);
      const rate = max / bend;
      const n = numbers(text);
      if (text.includes('とけ残りますか')) expect(value(correct)).toBe(n[2] - bend);
      else if (text.includes('2倍の')) expect(value(correct)).toBe(rate * Math.min(n[3], bend * 2));
      else if (text.includes('石灰石1gが')) expect(value(correct)).toBe(rate);
      else expect(value(correct)).toBe(rate * Math.min(n[2], bend));
    });
  });

  it('しつ度: ふくまれている量 ÷ 最大の量 × 100', () => {
    each('weather-u-humidity', (text, correct) => {
      const n = numbers(text);
      if (text.includes('しつ度は何%')) expect(value(correct)).toBe((n[3] / n[1]) * 100);
      else if (text.includes('何gの水蒸気')) expect(value(correct)).toBe((n[1] * n[2]) / 100);
    });
  });

  it('地震: 初期び動けいぞく時間は、2 つの波がとどく時間の差で、きょりに比例する', () => {
    each('earth-u-quake', (text, correct) => {
      const n = numbers(text);
      if (text.includes('は何秒ですか')) expect(value(correct)).toBe(n[2] / n[1] - n[2] / n[0]);
      else if (text.includes('何kmはなれていますか')) expect(value(correct)).toBe(n[0] * (n[2] / n[1]));
    });
  });

  it('防災: ハザードマップの区域と、緊急地震速報からゆれがとどくまでの時間', () => {
    each('earth-u-hazard', (text, correct, alt) => {
      const zone = (name: string) => alt.match(new RegExp(`(.)は${name}`))![1];
      if (text.includes('いちばん深く')) expect(correct).toBe(zone('3m以上の区域'));
      else if (text.includes('いちばん安全')) expect(correct).toBe(zone('高台'));
      else if (text.includes('0.5〜3mになると')) expect(correct).toBe(zone('0.5〜3mの区域'));
      else expect(alt).toMatch(new RegExp(`${text.match(/(.)の地点では/)![1]}は${correct}の区域`));
    });
    each('earth-u-disaster', (text, correct) => {
      if (!text.includes('緊急地震速報')) return;
      const [, s, t, d] = numbers(text);
      expect(value(correct)).toBe(d / s - t);
    });
  });

  it('海風・陸風: 昼は海から陸へ、夜は陸から海へ (上空は反対)', () => {
    each('weather-u-breeze', (text, correct, alt) => {
      const day = alt.includes('の昼に');
      const seaWest = alt.includes('西がわが海');
      const [from, to] = day ? ['海', '陸'] : ['陸', '海'];
      if (text.includes('上空では')) expect(correct).toBe(`${to}から${from}へ動く`);
      else if (text.includes('風向き')) expect(correct).toBe((from === '海') === seaWest ? '西' : '東');
      else if (text.includes('何といいますか')) expect(correct).toBe(day ? '海風' : '陸風');
      else expect(correct).toBe(`${from}から${to}へふく`);
    });
  });

  it('音: きょり = 速さ × 時間 (はね返るときは往復)', () => {
    each('light-u-sound', (text, correct) => {
      if (!text.includes('きょりは何m')) return;
      const [t, speed] = numbers(text);
      expect(value(correct)).toBe(speed * t);
    });
    each('light-u-echo', (text, correct) => {
      const [a, b] = numbers(text);
      if (text.includes('岸ぺき')) expect(value(correct) * b).toBe(a * 2);
      else expect(value(correct) * 2).toBe(a * b);
    });
  });

  it('光: 反しゃ角は入しゃ角と等しい', () => {
    each('light-l-reflect', (text, correct) => {
      const [a] = numbers(text);
      expect(value(correct)).toBe(text.includes('入ってくる光と、はね返った光との間') ? a * 2 : a);
    });
  });

  it('速さ: きょり ÷ 時間', () => {
    each('motion-u-speed', (text, correct) => {
      const [a, b] = numbers(text);
      if (text.includes('秒速何m')) expect(value(correct)).toBe(a / b);
      else if (text.includes('時速何km')) expect(value(correct)).toBeCloseTo((a * 3600) / 1000, 6);
      else expect(value(correct)).toBe(a * b);
    });
  });

  it('ふりこ: 平均の出し方と、長さと時間の関係', () => {
    each('motion-u-period', (text, correct) => {
      const [, , t1, t2, t3] = numbers(text);
      expect(value(correct)).toBeCloseTo((t1 + t2 + t3) / 3 / 10, 6);
    });
    each('motion-u-length', (text, correct) => {
      const n = numbers(text).slice(5);
      // n = [長さ, 1, 時間, …]。時間は、長さの平方根に比例する
      if (text.includes('何秒ですか')) expect(value(correct)).toBeCloseTo(n[2] * Math.sqrt(n[3] / n[0]), 6);
      else expect(value(correct)).toBeCloseTo(n[0] * (n[4] / n[2]) ** 2, 6);
    });
    each('motion-u-pendulum', (text, correct, alt) => {
      if (!alt) return;
      const lens = [...alt.matchAll(/(.)は糸の長さ(\d+)cm/g)].map((m) => ({ label: m[1], len: Number(m[2]) }));
      const sorted = lens.slice().sort((a, b) => a.len - b.len);
      expect(correct).toBe(text.includes('長い') ? sorted[3].label : sorted[0].label);
    });
  });

  it('実験器具: 目もりの読み、ふえた体積、けんび鏡の倍率', () => {
    // 図の説明 (aria-label) の「a の目もりから b 目もり上」を、1 目もり = 1 で読む
    const reading = (alt: string) => {
      const m = alt.match(/(\d+)(?:℃|mL)の目もりから(\d+)目もり上/)!;
      return Number(m[1]) + Number(m[2]);
    };
    each('tools-l-thermometer', (_, correct, alt) => expect(value(correct)).toBe(reading(alt)));
    each('tools-u-cylinder', (text, correct, alt) => {
      const n = numbers(text);
      if (alt) expect(value(correct)).toBe(reading(alt));
      else if (text.includes('小石の体積')) expect(value(correct)).toBe(n[1] - n[0]);
    });
    each('tools-u-microscope', (text, correct) => {
      const n = numbers(text);
      if (text.includes('このときの倍率')) expect(value(correct)).toBe(n[0] * n[1]);
      else if (text.includes('何こならんで')) expect(value(correct)).toBe((n[1] * n[0]) / n[2]);
    });
  });

  it('電流計: 針のさす目もり × (つないだ −たんし ÷ 5)', () => {
    const full: Record<string, number> = { '50mA': 50, '500mA': 500, '5A': 5000 };
    each('tools-u-ammeter', (_, correct, alt) => {
      if (!alt) return;
      const m = alt.match(/針は([\d.]+)の目もり.*、(\d+m?A)の−たんし/)!;
      expect(value(correct)).toBeCloseTo((Number(m[1]) * full[m[2]]) / 5, 6);
    });
  });

  it('電磁石: 答えは、まき数も乾電池の数も、ほかに負けていない', () => {
    each('magnet-u-strength', (text, correct, alt) => {
      const list = [...alt.matchAll(/(.)は、コイルが(\d+)回まきで、乾電池(\d+)個/g)].map((m) => ({ label: m[1], turns: Number(m[2]), cells: Number(m[3]) }));
      const best = list.find((p) => p.label === correct)!;
      const strongest = text.includes('強い');
      for (const p of list) {
        if (strongest) expect(p.turns <= best.turns && p.cells <= best.cells).toBe(true);
        else expect(p.turns >= best.turns && p.cells >= best.cells).toBe(true);
      }
    });
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
