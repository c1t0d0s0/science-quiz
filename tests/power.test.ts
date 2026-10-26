import { describe, expect, it } from 'vitest';
import { rngFromString } from '../src/core/rng';
import { plantFig, plantFlows, plantParts } from '../src/diagrams/power';
import { parsePowerHash, PLANTS } from '../src/power/plants';
import { upperEnergy, upperFigure, upperHow, upperMerit } from '../src/questions/power';

describe('発電所のしくみ', () => {
  it('はじめに と 6 つの発電所がそろっている', () => {
    expect(PLANTS.map((p) => p.id)).toEqual(['generator', 'thermal', 'hydro', 'nuclear', 'wind', 'geothermal', 'solar']);
  });

  it('ステップで光らせる部品と動かす流れは、どれも図の中にある', () => {
    for (const p of PLANTS) {
      const svg = plantFig(p.id);
      const parts = plantParts(p.id).map((x) => x.id);
      const flows = plantFlows(p.id);
      for (const s of p.steps) {
        for (const id of s.parts) {
          expect(parts, `${p.id} ${s.title}`).toContain(id);
          expect(svg).toContain(`data-part="${id}"`);
        }
        for (const id of s.flows) {
          expect(flows, `${p.id} ${s.title}`).toContain(id);
          expect(svg).toContain(`data-flow="${id}"`);
        }
      }
    }
  });

  it('問題の図に使えるよう、どの図にも部品が 4 つ以上あり、名前が重ならない', () => {
    for (const p of PLANTS) {
      const names = plantParts(p.id).map((x) => x.name);
      expect(names.length, p.id).toBeGreaterThanOrEqual(4);
      expect(new Set(names).size, p.id).toBe(names.length);
    }
  });

  it('発電量は 0〜1 で、つまみを大きくすると多くなる (風力は強すぎると止める)', () => {
    for (const p of PLANTS) {
      const { min, max, step, value } = p.control;
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
      let before = -1;
      for (let v = min; v <= max; v += step) {
        const out = p.output(v);
        expect(out, `${p.id} ${v}`).toBeGreaterThanOrEqual(0);
        expect(out, `${p.id} ${v}`).toBeLessThanOrEqual(1);
        if (!(p.id === 'wind' && v > 25)) expect(out, `${p.id} ${v}`).toBeGreaterThanOrEqual(before);
        before = out;
      }
    }
    const wind = PLANTS.find((p) => p.id === 'wind')!;
    expect(wind.output(2)).toBe(0);
    expect(wind.output(30)).toBe(0);
    const solar = PLANTS.find((p) => p.id === 'solar')!;
    expect(solar.output(90)).toBe(1);
  });

  it('たしかめ問題は 3 問ずつで、正解がまちがいの中にない', () => {
    for (const p of PLANTS) {
      expect(p.quiz.length, p.id).toBe(3);
      for (const f of p.quiz) expect(f.wrong).not.toContain(f.a);
    }
  });

  it('URL からステップを読む (はんいの外は 1 ステップ目)', () => {
    expect(parsePowerHash('#/power/thermal')).toEqual({ id: 'thermal', step: 0 });
    expect(parsePowerHash('#/power/thermal/3')).toEqual({ id: 'thermal', step: 2 });
    expect(parsePowerHash('#/power/thermal/99')).toEqual({ id: 'thermal', step: 0 });
    expect(parsePowerHash('#/power/nothing')).toBeNull();
    expect(parsePowerHash('#/power')).toBeNull();
  });
});

describe('発電所の問題', () => {
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
      const plant = PLANTS.find((p) => p.id === q.learn)!;
      const part = plantParts(plant.id).find((p) => p.name === name)!;
      // 記号の丸は、その部品の data-part の中にかいてある
      const group = q.svg!.split('<g data-part=').find((g) => g.startsWith(`"${part.id}"`) && g.includes('class="tag"'))!;
      expect(group, q.text).toContain(`>${q.choices[q.answer]}</text>`);
    }
  });
});
