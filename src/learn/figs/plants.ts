import { circle, ellipse, line, path, rect, text } from '../../diagrams/svg';
import { moving, type Plan } from './common';

// 植物の図 (水の通り道・光合成・発芽)

const leafShape = (x: number, y: number, a: number, s = 1) =>
  `<path class="leaf" transform="translate(${x} ${y}) rotate(${a}) scale(${s})" d="M0 0C10 -14 34 -16 48 0C34 16 10 14 0 0Z"/>`;

/** 水の通り道。--rise (0〜1) で色水がくきを上がり、--fog (0〜1) でふくろの内がわがくもる。クラス no-leaf・bag */
export function waterPathPlan(): Plan {
  const leaves = leafShape(120, 100, -150) + leafShape(120, 84, -30) + leafShape(120, 130, -20, 0.9) + leafShape(120, 140, -160, 0.9);
  return {
    width: 440,
    height: 300,
    alt: '植物の水の通り道の図。根をつけたまま色水に入れると、色水が根からくきを通って葉まで上がる。葉の表面にある気こうから、水が水蒸気になって出ていく (蒸散)。葉にふくろをかぶせると、内がわに水てきがつく。',
    back: path('M80 200V276Q80 286 90 286H150Q160 286 160 276V200', 'ln') + rect(82, 230, 76, 54, 'dye'),
    parts: [
      { id: 'roots', name: '根', box: [92, 214, 56, 50], anchor: [120, 240], label: [180, 250, 'start'], body: path('M120 214L104 252M120 214L120 260M120 214L136 250M112 232L98 240M128 232L142 240', 'ln thin') },
      {
        id: 'stem',
        name: 'くき',
        box: [108, 80, 24, 136],
        anchor: [120, 180],
        label: [140, 190, 'start'],
        body: rect(116, 80, 8, 136, 'box', 3) + `<rect class="dye" x="117" y="80" width="6" height="136" style="transform-origin:120px 216px;transform:scaleY(var(--rise, 0.6))"/>`,
      },
      { id: 'leaves', name: '葉', box: [64, 40, 116, 120], anchor: [80, 100], label: [60, 60, 'end'], body: `<g class="leaves">${leaves}</g>` },
      {
        id: 'bag',
        name: 'ふくろ',
        box: [56, 30, 132, 134],
        anchor: [176, 60],
        label: [196, 46, 'start'],
        body: `<g class="only-bag">${path('M64 160Q60 40 120 34Q180 40 176 160', 'bag')}<g class="fog">${[[86, 70], [150, 76], [100, 120], [160, 130], [78, 110]].map(([x, y]) => circle(x, y, 3, 'drop')).join('')}</g></g>`,
      },
      {
        id: 'stoma',
        name: '気こう',
        box: [262, 40, 160, 150],
        anchor: [342, 80],
        label: [342, 206],
        body:
          circle(342, 116, 64, 'leaf-zoom') +
          ellipse(342, 116, 18, 26, 'box') +
          ellipse(342, 116, 5, 18, 'ink') +
          line(170, 96, 278, 104, 'ln thin dash') +
          text(342, 36, '葉の表面 (けんび鏡)', { cls: 'tiny' }),
      },
    ],
    flows: [
      { id: 'water', d: 'M120 270V90' },
      { id: 'vapor', d: 'M342 96V44M120 70Q100 40 60 26M130 76Q160 40 200 30' },
    ],
  };
}

/** 光合成。クラス dark (日光なし)・foil (アルミはく)・tested (ヨウ素液で調べた) */
export function photosynthesisPlan(): Plan {
  const leaf = 'M80 190C110 110 230 90 320 150C240 230 120 240 80 190Z';
  return {
    width: 420,
    height: 280,
    alt: '光合成の図。日光に当てた葉では、でんぷんができる。葉の一部をアルミはくでおおうと、おおったところにはでんぷんができない。ヨウ素液をつけると、でんぷんのあるところが青むらさき色になる。',
    back: `<clipPath id="leaf-clip"><path d="${leaf}"/></clipPath>` + line(80, 190, 40, 250, 'ln'),
    parts: [
      {
        id: 'sun',
        name: '日光',
        box: [16, 10, 70, 70],
        anchor: [50, 44],
        label: [100, 34, 'start'],
        body: `<g class="sun">${circle(50, 44, 22, 'fill-mark')}</g>`,
      },
      {
        id: 'leaf',
        name: '葉',
        box: [74, 96, 254, 146],
        anchor: [130, 190],
        label: [200, 262],
        body:
          `<path class="leaf" d="${leaf}"/>` +
          `<g clip-path="url(#leaf-clip)"><rect class="starch" x="60" y="80" width="280" height="180"/><rect class="no-starch" x="220" y="80" width="120" height="180"/></g>` +
          path('M80 190Q200 160 320 150', 'ln thin'),
      },
      {
        id: 'foil',
        name: 'アルミはく',
        box: [214, 100, 116, 140],
        anchor: [270, 150],
        label: [350, 210, 'start'],
        body: `<g class="only-foil"><g clip-path="url(#leaf-clip)">${rect(220, 80, 120, 180, 'foil')}</g></g>`,
      },
    ],
    flows: [{ id: 'light', d: 'M76 64L150 140M64 80L120 150M94 54L190 120' }],
  };
}

/** 発芽。クラス no-water・no-air (水にしずめる)・cold・dark・fert・sprout (発芽した) */
export function germinationPlan(): Plan {
  return {
    width: 420,
    height: 280,
    alt: 'インゲンマメの発芽の条件を調べる図。カップにだっし綿をしいて、たねを置く。水・空気・温度・日光・肥料の条件を変えて、発芽するかを調べる。',
    back:
      path('M110 120L124 250H256L270 120', 'ln') +
      `<g class="only-sink">${path('M112 136L124 250H256L268 136Z', 'water')}</g>` +
      `<g class="wet">${rect(122, 214, 136, 30, 'water')}</g>` +
      rect(122, 222, 136, 22, 'cotton'),
    parts: [
      {
        id: 'seed',
        name: 'たね (インゲンマメ)',
        box: [160, 186, 60, 44],
        anchor: [190, 212],
        label: [300, 230, 'start'],
        body: ellipse(190, 212, 20, 13, 'seed') + moving('sprout', 'transform-origin:190px 212px', path('M190 206V140', 'stem') + leafShape(190, 150, -160, 0.7) + leafShape(190, 150, -20, 0.7)),
      },
      { id: 'water', name: '水', box: [116, 206, 148, 44], anchor: [130, 230], label: [90, 236, 'end'], body: '' },
      // 温度・日光・肥料は、絵と「今の状態」の文字で表す (名前は書かない)
      {
        id: 'temp',
        name: '温度',
        box: [294, 26, 120, 76],
        anchor: [314, 60],
        label: [356, 104],
        ownText: true,
        body:
          rect(310, 34, 10, 50, 'box', 5) +
          circle(315, 88, 9, 'box') +
          `<g class="only-warm">${rect(312, 52, 6, 36, 'thermo-warm')}${circle(315, 88, 6, 'thermo-warm')}${text(330, 70, '20℃くらい', { anchor: 'start', cls: 'small' })}</g>` +
          `<g class="only-cold">${rect(312, 76, 6, 12, 'thermo-cold')}${circle(315, 88, 6, 'thermo-cold')}${text(330, 62, '冷ぞう庫', { anchor: 'start', cls: 'small' })}${text(330, 80, '(5℃)', { anchor: 'start', cls: 'small' })}</g>`,
      },
      {
        id: 'light',
        name: '日光',
        box: [14, 20, 104, 98],
        anchor: [60, 52],
        label: [60, 112],
        ownText: true,
        body:
          `<g class="only-light">${circle(60, 52, 20, 'fill-mark')}${[0, 1, 2, 3, 4, 5, 6, 7]
            .map((i) => {
              const a = (i * Math.PI) / 4;
              return line(60 + 25 * Math.cos(a), 52 + 25 * Math.sin(a), 60 + 31 * Math.cos(a), 52 + 31 * Math.sin(a), 'ln thin');
            })
            .join('')}${text(60, 106, '日光が当たる', { cls: 'small' })}</g>` +
          `<g class="only-dark">${rect(38, 32, 44, 40, 'ink-soft', 4)}${text(60, 106, '箱で暗くする', { cls: 'small' })}</g>`,
      },
      {
        id: 'fert',
        name: '肥料',
        box: [300, 122, 110, 84],
        anchor: [330, 150],
        label: [354, 200],
        ownText: true,
        body:
          `<g class="fert-bag">${path('M334 132H374L378 176H330Z', 'fill-soft')}${line(334, 140, 374, 140, 'ln thin')}${text(354, 162, '肥料', { cls: 'small' })}</g>` +
          `<g class="only-fert">${text(354, 198, '肥料あり', { cls: 'small' })}${[150, 172, 210, 232].map((x) => circle(x, 226, 3, 'granule')).join('')}</g>` +
          `<g class="only-nofert">${text(354, 198, '肥料なし', { cls: 'small' })}</g>`,
      },
    ],
    flows: [],
    front: `<g class="only-cover">${path('M100 112H280V256H100Z', 'cover')}</g>`,
  };
}
