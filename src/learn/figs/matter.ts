import { circle, line, path, polyline, rect, text } from '../../diagrams/svg';
import { liveText, moving, type Plan } from './common';

// 熱・物質の図 (もののあたたまり方・水のすがた・ものの燃え方)

/** --t (0〜1) がふえると、i 番目 (0 から) の部分が順にあたたまる (赤くなる) */
const warm = (i: number, n: number) => `opacity:clamp(0, calc(var(--t, 0.5) * ${n} - ${i}), 0.85)`;

const flame = (x: number, y: number, s = 1) => path(`M${x} ${y}C${x - 7 * s} ${y - 10 * s} ${x - 3 * s} ${y - 18 * s} ${x} ${y - 26 * s}C${x + 3 * s} ${y - 18 * s} ${x + 7 * s} ${y - 10 * s} ${x} ${y}Z`, 'flame');

/** もののあたたまり方。金属の板・水・空気をならべる。figure のクラス heat-mid で、板のまん中を熱する */
export function heatingPlan(): Plan {
  const rings = (cx: number, cy: number) =>
    [80, 60, 40, 20].map((radius, k) => `<circle class="heat" cx="${cx}" cy="${cy}" r="${radius}" style="${warm(3 - k, 4)}"/>`).join('');
  const bands = (x: number, y: number, w: number, h: number) =>
    // 上の方から順にあたたまる
    [0, 1, 2, 3].map((j) => `<rect class="heat" x="${x}" y="${y + (j * h) / 4}" width="${w}" height="${h / 4}" style="${warm(j, 4)}"/>`).join('');
  return {
    width: 500,
    height: 270,
    alt: 'もののあたたまり方の図。金属の板は、熱したところから近い順にあたたまる。水と空気は、あたためられた部分が上へ動き、上の方から順にあたたまる。',
    back: `<clipPath id="plate-clip"><rect x="20" y="70" width="130" height="130"/></clipPath>`,
    parts: [
      {
        id: 'metal',
        name: '金属の板',
        box: [12, 62, 146, 190],
        anchor: [30, 80],
        label: [85, 60],
        body:
          rect(20, 70, 130, 130, 'fill-soft') +
          `<g clip-path="url(#plate-clip)"><g class="only-edge">${rings(30, 190)}</g><g class="only-mid">${rings(85, 135)}</g></g>` +
          rect(20, 70, 130, 130, 'ln') +
          `<g class="only-edge">${flame(30, 240)}</g><g class="only-mid">${flame(85, 240)}</g>`,
      },
      {
        id: 'water',
        name: '水',
        box: [182, 52, 136, 200],
        anchor: [200, 80],
        label: [250, 44],
        body: rect(195, 70, 110, 130, 'water') + bands(195, 70, 110, 130) + path('M195 60V200H305V60', 'ln') + flame(225, 240),
      },
      {
        id: 'air',
        name: '空気 (部屋)',
        box: [342, 52, 146, 200],
        anchor: [360, 80],
        label: [415, 44],
        body: rect(350, 70, 130, 130, 'box') + bands(350, 70, 130, 130) + rect(358, 178, 40, 22, 'fill-mark', 3) + text(378, 194, 'ストーブ', { cls: 'tiny' }),
      },
    ],
    flows: [
      { id: 'heat', d: 'M30 190L140 80' },
      { id: 'convection', d: 'M225 190V90H285V190H225' },
      { id: 'convection', d: 'M378 176V86H470V190H404' },
    ],
  };
}

/** 水のすがた。figure のクラス ice / melt / boil / gas (どれもなければ水)。--mx・--my はグラフの上の今の点 */
export function waterPlan(): Plan {
  // グラフ: 横は加熱した時間、たては温度 (-20〜120℃)
  const gx = (k: number) => 250 + k * 170;
  const gy = (t: number) => 230 - ((t + 20) / 140) * 180;
  const curve = polyline(
    [
      [gx(0), gy(-20)],
      [gx(0.12), gy(0)],
      [gx(0.32), gy(0)],
      [gx(0.55), gy(100)],
      [gx(0.88), gy(100)],
      [gx(1), gy(120)],
    ],
    'ln',
  );
  const bubbles = [[70, 190], [96, 172], [124, 196], [150, 180], [84, 150]].map(([x, y]) => circle(x, y, 5, 'ln thin')).join('');
  const steam = [70, 110, 150].map((x) => path(`M${x} 70q-8 -12 0 -24t0 -24`, 'ln thin dash')).join('');
  return {
    width: 440,
    height: 270,
    alt: '水を冷やしたりあたためたりしたときのようすの図。0℃で氷になり、100℃でふっとうして水蒸気になる。右は、氷をあたためたときの温度の変わり方のグラフ。',
    back:
      line(250, gy(-20), 250, 40, 'ln thin') +
      line(250, 230, 430, 230, 'ln thin') +
      [0, 100].map((t) => line(246, gy(t), 430, gy(t), 'ln thin dash') + text(240, gy(t) + 4, `${t}℃`, { anchor: 'end', cls: 'tiny' })).join('') +
      text(340, 254, '熱した時間 →', { cls: 'tiny' }),
    parts: [
      {
        id: 'beaker',
        name: 'ビーカー',
        box: [30, 80, 160, 150],
        anchor: [40, 110],
        label: [110, 250],
        body:
          `<g class="w-ice">${rect(50, 120, 120, 100, 'ice')}${line(90, 120, 90, 220, 'ln thin')}${line(130, 120, 130, 220, 'ln thin')}</g>` +
          `<g class="w-water">${rect(40, 150, 140, 70, 'water')}</g>` +
          `<g class="w-bub">${bubbles}</g>` +
          `<g class="w-steam">${steam}</g>` +
          path('M36 100V222H184V100', 'ln'),
      },
      {
        id: 'graph',
        name: '温度の変わり方',
        box: [236, 30, 200, 214],
        anchor: [330, 120],
        label: [340, 26],
        body: curve + moving('marker', 'transform:translate(var(--mx, 0px), var(--my, 0px))', circle(0, 0, 7, 'fill-mark')),
      },
    ],
    flows: [],
    front: liveText(110, 76, 'state', '水 (液体)'),
  };
}

/** ものの燃え方。figure のクラス lid (ふた)・gap (下のすき間)・out (火が消えた)。--flame でほのおの大きさ */
export function burningPlan(): Plan {
  return {
    width: 420,
    height: 300,
    alt: 'ものの燃え方の図。ねん土の上に立てたろうそくに火をつけ、底のないびんをかぶせる。びんのふたや、下のすき間のあるなしで、燃え方が変わる。線こうのけむりで、空気の動きを見る。',
    back: rect(60, 250, 200, 30, 'fill-soft', 4) + text(160, 270, 'ねん土', { cls: 'tiny' }),
    parts: [
      {
        id: 'jar',
        name: 'びん',
        box: [74, 58, 172, 200],
        anchor: [90, 120],
        label: [300, 160, 'start'],
        body: path('M90 250V100Q90 80 120 74V62H200V74Q230 80 230 100V250', 'glass'),
      },
      {
        id: 'lid',
        name: 'ふた',
        box: [108, 40, 104, 30],
        anchor: [160, 54],
        label: [228, 52, 'start'],
        body: `<g class="only-lid">${rect(114, 48, 92, 14, 'fill-mark', 3)}</g>`,
      },
      {
        id: 'candle',
        name: 'ろうそく',
        box: [136, 146, 48, 108],
        anchor: [160, 200],
        label: [300, 214, 'start'],
        body: rect(150, 180, 20, 70, 'box', 2) + moving('fire', 'transform-origin:160px 180px;transform:scale(var(--flame, 1))', path('M160 180C150 168 154 156 160 146C166 156 170 168 160 180Z', 'flame')),
      },
      {
        id: 'gap',
        name: '下のすき間',
        box: [64, 236, 52, 28],
        anchor: [90, 250],
        label: [40, 296, 'start'],
        body: `<g class="only-gap">${rect(80, 244, 22, 10, 'mask')}${line(80, 250, 102, 250, 'ln thin dash')}</g>`,
      },
    ],
    flows: [
      // 下から入って上から出る / 上から入って上から出る
      { id: 'smoke-bottom', d: 'M40 248H96V200Q120 160 140 120Q150 90 150 50V20' },
      { id: 'smoke-top', d: 'M200 20V60Q206 110 196 140Q180 150 176 120V60V20' },
    ],
  };
}
