import { describe, expect, it } from 'vitest';
import { rngFromString } from '../src/core/rng';
import { buildFig, planFlows, planParts } from '../src/learn/figs/common';
import { plantParts } from '../src/learn/figs/power';
import { parseLearnHash } from '../src/learn/href';
import { GUIDES } from '../src/learn/index';
import { PLANTS } from '../src/learn/power';
import { digestStage } from '../src/learn/body';
import { period } from '../src/learn/physics';
import { initialValues, type Guide, type Values } from '../src/learn/types';
import { analyze, fracText } from '../src/diagrams/circuit';
import { upperEnergy, upperFigure, upperHow, upperMerit } from '../src/questions/power';

/** 操作の値の組み合わせ (つまみは、はし・まん中・はじめの値、切りかえは全部) */
export function* combinations(g: Guide): Generator<Values> {
  const choices = g.controls.map((c) => {
    if (c.kind === 'range') return [...new Set([c.min, c.max, c.value, c.min + Math.round((c.max - c.min) / c.step / 2) * c.step])];
    if (c.kind === 'toggle') return [true, false];
    return c.options.map((o) => o.value);
  });
  const walk = function* (i: number, acc: Values): Generator<Values> {
    if (i === g.controls.length) {
      yield { ...acc };
      return;
    }
    for (const v of choices[i]) yield* walk(i + 1, { ...acc, [g.controls[i].key]: v });
  };
  yield* walk(0, {});
}

describe('図で学ぶしくみ', () => {
  it('解説の id が重ならない', () => {
    expect(new Set(GUIDES.map((g) => g.id)).size).toBe(GUIDES.length);
  });

  it('ステップで光らせる部品と動かす流れは、どれも図の中にある', () => {
    for (const g of GUIDES) {
      const plan = g.plan();
      const svg = buildFig(plan);
      const parts = planParts(plan).map((x) => x.id);
      const flows = planFlows(plan);
      for (const s of g.steps) {
        for (const id of s.parts) {
          expect(parts, `${g.id} ${s.title}`).toContain(id);
          expect(svg).toContain(`data-part="${id}"`);
        }
        for (const id of s.flows) {
          expect(flows, `${g.id} ${s.title}`).toContain(id);
          expect(svg).toContain(`data-flow="${id}"`);
        }
      }
    }
  });

  it('どの操作の値でも、図のようすと表示がこわれない', () => {
    for (const g of GUIDES) {
      expect(g.controls.length, g.id).toBeGreaterThan(0);
      for (const v of combinations(g)) {
        const s = g.state(v);
        expect(s.readouts.length, g.id).toBeGreaterThan(0);
        for (const r of s.readouts) {
          expect(`${r.label}${r.value}`, `${g.id} ${JSON.stringify(v)}`).not.toMatch(/NaN|undefined|Infinity/);
          if (r.meter !== undefined) {
            expect(r.meter).toBeGreaterThanOrEqual(0);
            expect(r.meter).toBeLessThanOrEqual(1);
          }
        }
        for (const x of Object.values(s.vars ?? {})) expect(x, g.id).not.toMatch(/NaN|undefined|Infinity/);
        if (s.speed !== undefined) expect(s.speed >= 0 && s.speed <= 1, g.id).toBe(true);
      }
    }
  });

  it('たしかめ問題は 3 問ずつで、正解がまちがいの中にない', () => {
    for (const g of GUIDES) {
      expect(g.quiz.length, g.id).toBe(3);
      for (const f of g.quiz) expect(f.wrong, f.q).not.toContain(f.a);
    }
  });

  it('URL を読む (前の #/power も同じ)', () => {
    expect(parseLearnHash('#/learn')).toEqual({ id: null, step: 0 });
    expect(parseLearnHash('#/learn/lever')).toEqual({ id: 'lever', step: 0 });
    expect(parseLearnHash('#/learn/lever/2')).toEqual({ id: 'lever', step: 1 });
    expect(parseLearnHash('#/power')).toEqual({ id: null, step: 0 });
    expect(parseLearnHash('#/power/thermal/3')).toEqual({ id: 'thermal', step: 2 });
    expect(parseLearnHash('#/cards')).toBeNull();
  });
});

describe('発電所', () => {
  it('はじめに と 6 つの発電所がそろっている', () => {
    expect(PLANTS.map((p) => p.id)).toEqual(['generator', 'thermal', 'hydro', 'nuclear', 'wind', 'geothermal', 'solar']);
  });

  it('問題の図に使えるよう、どの図にも部品が 4 つ以上あり、名前が重ならない', () => {
    for (const p of PLANTS) {
      const names = plantParts(p.id).map((x) => x.name);
      expect(names.length, p.id).toBeGreaterThanOrEqual(4);
      expect(new Set(names).size, p.id).toBe(names.length);
    }
  });

  it('発電量は、つまみを大きくすると多くなる (風力は強すぎると止める、太陽光は垂直がいちばん)', () => {
    for (const p of PLANTS) {
      const c = p.controls[0];
      if (c.kind !== 'range') throw new Error(p.id);
      let before = -1;
      for (let v = c.min; v <= c.max; v += c.step) {
        const out = p.output(v);
        if (!(p.id === 'wind' && v > 25)) expect(out, `${p.id} ${v}`).toBeGreaterThanOrEqual(before);
        before = out;
      }
    }
    const wind = PLANTS.find((p) => p.id === 'wind')!;
    expect(wind.output(2)).toBe(0);
    expect(wind.output(30)).toBe(0);
    expect(PLANTS.find((p) => p.id === 'solar')!.output(90)).toBe(1);
  });

  it('どの問題にも、解説へのリンクがつく', () => {
    for (const gen of [upperHow, upperFigure, upperEnergy, upperMerit]) {
      for (let i = 0; i < 200; i++) {
        const q = gen.make(rngFromString(`${gen.id}:${i}`));
        expect(PLANTS.map((p) => p.id), gen.id).toContain(q.learn);
      }
    }
  });

  it('図の問題: 正解の記号は、聞いている部品についている', () => {
    for (let i = 0; i < 200; i++) {
      const q = upperFigure.make(rngFromString(`fig:${i}`));
      const name = q.text.match(/「(.+?)」はどれ/)![1];
      const part = plantParts(PLANTS.find((p) => p.id === q.learn)!.id).find((p) => p.name === name)!;
      const group = q.svg!.split('<g data-part=').find((g) => g.startsWith(`"${part.id}"`) && g.includes('class="tag"'))!;
      expect(group, q.text).toContain(`>${q.choices[q.answer]}</text>`);
    }
  });
});

const guide = (id: string) => GUIDES.find((g) => g.id === id)!;
const readout = (id: string, v: Values, label: string) => guide(id).state({ ...initialValues(guide(id)), ...v }).readouts.find((r) => r.label === label)!.value;

describe('物理の解説の検算', () => {
  it('てこ: 左右の「重さ × きょり」が等しいときだけ水平', () => {
    for (const lw of [10, 20, 30, 40, 50, 60])
      for (const ld of [1, 2, 3, 4, 5, 6])
        for (const rw of [10, 30, 60])
          for (const rd of [1, 3, 6]) {
            const s = guide('lever').state({ lw, ld, rw, rd });
            const expected = lw * ld === rw * rd ? '0deg' : lw * ld > rw * rd ? '-10deg' : '10deg';
            expect(s.vars!['--tilt'], `${lw} ${ld} ${rw} ${rd}`).toBe(expected);
          }
  });

  it('ふりこ: 1 往復の時間は糸の長さだけで決まり、長さ 4 倍で 2 倍', () => {
    const t = (len: string, g: string, amp: string) => readout('pendulum', { len, g, amp }, '1往復する時間');
    expect(t('50', '10', '10')).toBe(t('50', '40', '30'));
    expect(period(100)).toBeCloseTo(period(25) * 2);
    expect(period(100)).toBeCloseTo(2.0, 1);
  });

  it('回路: 明るさは analyze と同じで、スイッチを切ると消える', () => {
    for (const cells of ['1', 's', 'p'])
      for (const bulbs of ['1', 's', 'p']) {
        const n = (v: string) => (v === '1' ? 1 : 2);
        const mode = (v: string) => (v === 'p' ? 'p' : 's') as 's' | 'p';
        const a = analyze({ cells: n(cells), cellMode: mode(cells), bulbs: n(bulbs), bulbMode: mode(bulbs) });
        expect(readout('circuit', { cells, bulbs, sw: true }, '豆電球1個の明るさ')).toBe(`1個のときの${fracText(a.perBulb)}倍`);
        expect(readout('circuit', { cells, bulbs, sw: false }, '豆電球1個の明るさ')).toBe('消えている');
      }
  });
});

describe('人体の解説の検算', () => {
  it('消化: 時間がたつと、口 → 胃 → 小腸 → 大腸 → こう門 の順に進む', () => {
    const order = ['口', '胃', '小腸', '大腸', 'こう門'];
    let last = 0;
    for (let h = 0; h <= 24; h++) {
      const i = order.indexOf(digestStage(h).where);
      expect(i, `${h}時間`).toBeGreaterThanOrEqual(last);
      last = i;
    }
    expect(last).toBe(order.length - 1);
  });

  it('呼吸: はく息は、すう空気より酸素が少なく、二酸化炭素が多い', () => {
    expect(readout('breathing', { inhale: true }, '酸素')).toBe('約21%');
    expect(readout('breathing', { inhale: false }, '酸素')).toBe('約17%');
    expect(readout('breathing', { inhale: false }, '二酸化炭素')).toBe('約4%');
  });

  it('血液: 運動すると脈はくが速くなる', () => {
    const n = (act: string) => Number(readout('blood', { act }, '1分間の脈はく').match(/\d+/)![0]);
    expect(n('rest')).toBeLessThan(n('walk'));
    expect(n('walk')).toBeLessThan(n('run'));
  });
});
