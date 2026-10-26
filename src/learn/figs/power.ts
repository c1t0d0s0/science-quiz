import { circle, ellipse, line, path, polygon, polyline, r, rect, text } from '../../diagrams/svg';
import { buildFig, bulb, planParts, spin, type Flow, type Part, type Plan } from './common';

// 発電所の図。動きの速さや明るさは CSS の変数 (--out・--dur・--rods・--tilt) で決める

export type PlantId = 'generator' | 'thermal' | 'hydro' | 'nuclear' | 'wind' | 'geothermal' | 'solar';

/** タービン。name は「タービン」か「水車」 */
function turbine(tx: number, ty: number, name: string): Part {
  const blades = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3;
    return path(`M${r(tx)} ${r(ty)}L${r(tx + 26 * Math.cos(a))} ${r(ty + 26 * Math.sin(a))}`, 'ln thick');
  }).join('');
  return {
    id: 'turbine',
    name,
    box: [tx - 38, ty - 38, 76, 76],
    anchor: [tx - 22, ty - 24],
    label: [tx, ty + 52],
    body: circle(tx, ty, 32, 'box') + spin(tx, ty, blades + circle(tx, ty, 6, 'ink')),
  };
}

/** 発電機。左はしの (x, y) にじくがつながる */
function generator(x: number, y: number, w = 70, h = 52): Part {
  const turns = Array.from({ length: 6 }, (_, i) => line(x + 12 + i * ((w - 24) / 5), y - h / 2 + 10, x + 12 + i * ((w - 24) / 5), y + h / 2 - 10, 'ln thin')).join('');
  return {
    id: 'generator',
    name: '発電機',
    box: [x - 4, y - h / 2 - 4, w + 8, h + 8],
    anchor: [x + w / 2, y - h / 2],
    label: [x + w / 2, y + h / 2 + 18],
    body: rect(x, y - h / 2, w, h, 'fill-mark', 6) + turns + line(x + 8, y, x + w - 8, y, 'ln'),
  };
}

/** 送電線と家。(gx, gy) から電気が来る。電気の流れもかえす */
function grid(gx: number, gy: number): { part: Part; flow: Flow } {
  const tower = gx + 44;
  const top = gy - 58;
  const house = gx + 98;
  const body =
    polyline([[tower - 16, gy + 58], [tower, top], [tower + 16, gy + 58]], 'ln') +
    line(tower - 11, gy + 30, tower + 11, gy + 30, 'ln thin') +
    line(tower - 6, gy, tower + 6, gy, 'ln thin') +
    line(tower - 14, top + 12, tower + 14, top + 12, 'ln') +
    polygon([[house - 30, gy + 14], [house, gy - 12], [house + 30, gy + 14]], 'fill-soft') +
    rect(house - 24, gy + 14, 48, 44, 'box') +
    bulb(house, gy + 34) +
    polyline([[gx, gy], [tower - 14, top + 12]], 'ln thin') +
    polyline([[tower + 14, top + 12], [house, gy - 2], [house, gy + 19]], 'ln thin');
  return {
    part: { id: 'grid', name: '送電線', box: [gx + 20, top - 6, 116, 128], anchor: [tower, top + 12], label: [tower - 4, gy + 76], body },
    flow: { id: 'electric', d: `M${gx} ${gy}L${tower - 14} ${top + 12}M${tower + 14} ${top + 12}L${house} ${gy - 2}V${gy + 19}` },
  };
}

/** タービン → 発電機 → 送電線 (火力・原子力・水力・地熱で同じ) */
function powerTrain(tx: number, ty: number, name = 'タービン'): { parts: Part[]; flows: Flow[]; shaft: string } {
  const g = grid(tx + 128, ty);
  return {
    parts: [turbine(tx, ty, name), generator(tx + 58, ty), g.part],
    flows: [g.flow],
    shaft: line(tx + 32, ty, tx + 58, ty, 'ln thick'),
  };
}

/** タービンを回した水蒸気を冷やして水にもどす復水器 (タービンの下) */
function condenser(tx: number, ty: number): Part {
  const top = ty + 60;
  return {
    id: 'condenser',
    name: '復水器',
    box: [tx - 42, top - 4, 84, 52],
    anchor: [tx - 30, top],
    label: [tx + 62, top + 30],
    body:
      rect(tx - 38, top, 76, 44, 'box', 4) +
      Array.from({ length: 3 }, (_, i) => path(`M${tx - 30} ${top + 12 + i * 10}q8 -6 15 0t15 0t15 0t15 0`, 'ln thin water-line')).join(''),
  };
}

function thermal(): Plan {
  const tx = 330;
  const ty = 150;
  const t = powerTrain(tx, ty);
  return {
    width: 600,
    height: 300,
    alt: '火力発電所の図。燃料をボイラーで燃やし、水を熱して水蒸気をつくる。水蒸気でタービンを回し、つながった発電機で電気をつくって、送電線で家に送る。タービンを回した水蒸気は、復水器で冷やして水にもどし、ボイラーにもどす。',
    back: line(0, 270, 600, 270, 'ln thin') + t.shaft,
    parts: [
      {
        id: 'fuel',
        name: '燃料',
        box: [10, 196, 82, 70],
        anchor: [30, 215],
        label: [51, 288],
        body: polygon([[16, 262], [34, 222], [52, 214], [72, 228], [86, 262]], 'ink-soft') + text(51, 248, '石炭など', { cls: 'tiny on-dark' }),
      },
      {
        id: 'boiler',
        name: 'ボイラー',
        box: [108, 64, 108, 202],
        anchor: [118, 120],
        label: [184, 60],
        body:
          rect(112, 70, 100, 192, 'box', 4) +
          polyline([[130, 180], [130, 96], [146, 96], [146, 180], [162, 180], [162, 96], [178, 96], [178, 180], [194, 180], [194, 96]], 'ln thin water-line') +
          `<g class="fire">${path('M128 250C120 232 134 222 136 206C146 220 150 232 146 250Z', 'flame')}${path('M152 250C144 228 160 216 162 196C174 214 178 232 172 250Z', 'flame')}${path('M178 250C172 234 184 224 186 210C196 222 198 236 194 250Z', 'flame')}</g>`,
      },
      {
        id: 'chimney',
        name: 'えんとつ',
        box: [116, 14, 30, 60],
        anchor: [131, 30],
        label: [92, 30],
        body: rect(122, 20, 18, 50, 'fill-soft'),
      },
      ...t.parts,
      condenser(tx, ty),
    ],
    flows: [
      { id: 'fuel', d: 'M88 236H110' },
      { id: 'smoke', d: 'M131 18Q140 4 170 2' },
      { id: 'steam', d: `M212 100H262V${ty}H${tx - 32}`, pipe: true },
      { id: 'steam', d: `M${tx} ${ty + 32}V${ty + 60}`, pipe: true },
      { id: 'water', d: `M${tx - 38} ${ty + 90}H230V240H212`, pipe: true },
      ...t.flows,
    ],
  };
}

function nuclear(): Plan {
  const tx = 330;
  const ty = 150;
  const t = powerTrain(tx, ty);
  const fuelRods = Array.from({ length: 5 }, (_, i) => rect(124 + i * 16, 178, 9, 62, 'fill-mark', 2)).join('');
  const controlRods = Array.from({ length: 4 }, (_, i) => rect(136 + i * 16, 112, 5, 70, 'ink')).join('');
  return {
    width: 600,
    height: 300,
    alt: '原子力発電所の図。原子炉の中でウラン燃料が核分裂するときの熱で水を熱し、水蒸気をつくる。水蒸気でタービンを回し、発電機で電気をつくる。制御棒を出し入れして、核分裂の量を調節する。',
    back: line(0, 270, 600, 270, 'ln thin') + t.shaft,
    parts: [
      {
        id: 'vessel',
        name: '原子炉',
        box: [96, 50, 132, 220],
        anchor: [104, 140],
        label: [160, 46],
        body: path('M102 266V120Q102 58 162 58Q222 58 222 120V266Z', 'box') + rect(112, 150, 100, 108, 'water') + circle(162, 210, 44, 'glow'),
      },
      {
        id: 'fuelrods',
        name: '燃料（ウラン）',
        box: [118, 174, 82, 72],
        anchor: [196, 214],
        label: [50, 222],
        body: fuelRods,
      },
      {
        id: 'rods',
        name: '制御棒',
        box: [130, 96, 64, 70],
        anchor: [184, 110],
        label: [64, 112],
        body: `<g class="rods">${controlRods}${line(132, 112, 194, 112, 'ln')}</g>`,
      },
      ...t.parts,
      condenser(tx, ty),
    ],
    flows: [
      { id: 'steam', d: `M218 100H262V${ty}H${tx - 32}`, pipe: true },
      { id: 'steam', d: `M${tx} ${ty + 32}V${ty + 60}`, pipe: true },
      { id: 'water', d: `M${tx - 38} ${ty + 90}H240V240H222`, pipe: true },
      ...t.flows,
    ],
  };
}

function hydro(): Plan {
  const tx = 330;
  const ty = 200;
  const t = powerTrain(tx, ty, '水車');
  return {
    width: 600,
    height: 300,
    alt: '水力発電所の図。ダムにためた水を、高いところから管で流し落とし、その力で水車を回す。水車につながった発電機で電気をつくり、送電線で家に送る。水車を回した水は川へ流れていく。',
    back:
      polygon([[0, 92], [148, 92], [148, 262], [0, 196]], 'water') +
      polygon([[0, 196], [148, 262], [148, 270], [0, 270]], 'fill-soft') +
      text(80, 120, 'ダム湖', { cls: 'small' }) +
      line(0, 270, 600, 270, 'ln thin') +
      path(`M${tx} ${ty + 32}V${ty + 56}H${tx + 110}`, 'pipe-track') +
      t.shaft,
    parts: [
      {
        id: 'dam',
        name: 'ダム',
        box: [142, 64, 64, 210],
        anchor: [160, 84],
        label: [196, 56],
        body: polygon([[148, 70], [170, 70], [202, 268], [148, 268]], 'box'),
      },
      {
        id: 'gate',
        name: '水門',
        box: [140, 128, 34, 38],
        anchor: [157, 134],
        label: [118, 152],
        body: rect(148, 132, 18, 30, 'fill-mark', 2),
      },
      ...t.parts,
    ],
    flows: [
      { id: 'water', d: `M166 148L${tx - 30} ${ty - 10}`, pipe: true },
      { id: 'water', d: `M${tx} ${ty + 32}V${ty + 56}H${tx + 110}` },
      ...t.flows,
    ],
  };
}

function geothermal(): Plan {
  const tx = 330;
  const ty = 140;
  const t = powerTrain(tx, ty);
  return {
    width: 600,
    height: 330,
    alt: '地熱発電所の図。地下深くのマグマの熱で、地下水が熱くなっている。井戸から蒸気をとり出してタービンを回し、発電機で電気をつくる。タービンを回した蒸気は復水器で水にもどし、別の井戸で地下へもどす。',
    back: rect(0, 150, 300, 180, 'fill-soft') + line(0, 150, 600, 150, 'ln thin') + t.shaft,
    parts: [
      {
        id: 'magma',
        name: 'マグマ',
        box: [10, 288, 220, 42],
        anchor: [60, 306],
        label: [120, 318],
        body: ellipse(120, 330, 110, 36, 'flame'),
      },
      {
        id: 'hotwater',
        name: '熱い地下水',
        box: [34, 218, 196, 44],
        anchor: [52, 240],
        label: [150, 278],
        body: ellipse(132, 240, 96, 18, 'water') + ellipse(132, 240, 96, 18, 'ln thin'),
      },
      {
        id: 'well',
        name: '蒸気をとり出す井戸',
        box: [88, 98, 24, 146],
        anchor: [100, 180],
        label: [100, 92],
        body: rect(94, 104, 12, 136, 'box'),
      },
      {
        id: 'return',
        name: '水をもどす井戸',
        box: [192, 172, 24, 72],
        anchor: [204, 200],
        label: [204, 168],
        body: rect(198, 178, 12, 62, 'box'),
      },
      ...t.parts,
      condenser(tx, ty),
    ],
    flows: [
      { id: 'steam', d: `M100 240V104H262V${ty}H${tx - 32}`, pipe: true },
      { id: 'steam', d: `M${tx} ${ty + 32}V${ty + 60}`, pipe: true },
      { id: 'water', d: `M${tx - 38} ${ty + 90}H204V240`, pipe: true },
      ...t.flows,
    ],
  };
}

function wind(): Plan {
  const hx = 145;
  const hy = 89;
  const blades = [0, 120, 240]
    .map((deg) => {
      const a = ((deg - 90) * Math.PI) / 180;
      const ex = hx + 66 * Math.cos(a);
      const ey = hy + 66 * Math.sin(a);
      const nx = -Math.sin(a) * 7;
      const ny = Math.cos(a) * 7;
      return polygon([[hx, hy], [hx + nx + (ex - hx) * 0.3, hy + ny + (ey - hy) * 0.3], [ex, ey]], 'box');
    })
    .join('');
  const g = grid(300, 200);
  return {
    width: 440,
    height: 300,
    alt: '風力発電の図。風で羽根が回る。羽根の回転を増速機で速くして、発電機を回して電気をつくる。電気は塔の中を通り、送電線で家に送る。',
    // 増速機と発電機は、羽根のうしろの箱 (ナセル) の中にある
    back: line(0, 280, 440, 280, 'ln thin') + rect(150, 75, 84, 30, 'box', 6),
    parts: [
      {
        id: 'tower',
        name: 'タワー（塔）',
        box: [134, 100, 34, 182],
        anchor: [151, 200],
        label: [110, 250],
        body: polygon([[140, 280], [162, 280], [157, 104], [145, 104]], 'fill-soft'),
      },
      {
        id: 'gear',
        name: '増速機',
        box: [166, 70, 30, 34],
        anchor: [181, 74],
        label: [181, 62],
        body: rect(169, 79, 24, 20, 'fill-soft', 3) + circle(177, 89, 4, 'ln thin') + circle(186, 89, 3, 'ln thin'),
      },
      generator(198, 89, 30, 24),
      {
        id: 'blades',
        name: '羽根（ブレード）',
        box: [76, 20, 138, 138],
        anchor: [118, 50],
        label: [70, 170],
        body: spin(hx, hy, blades) + circle(hx, hy, 8, 'ink'),
      },
      g.part,
    ],
    flows: [
      { id: 'wind', d: 'M4 56H58M4 90H58M4 124H58' },
      { id: 'electric', d: 'M213 101V112H151V280H300V200' },
      g.flow,
    ],
  };
}

function solar(): Plan {
  const g = grid(300, 200);
  const cells = Array.from({ length: 5 }, (_, i) => line(130 + i * 24, 178, 130 + i * 24, 202, 'ln thin')).join('');
  return {
    width: 440,
    height: 300,
    alt: '太陽光発電の図。太陽の光が光電池（太陽電池）のパネルに当たると、光が直接電気に変わる。タービンや発電機は使わない。電気はパワーコンディショナを通って、送電線で家に送る。',
    back: line(0, 280, 440, 280, 'ln thin') + line(190, 202, 190, 280, 'ln'),
    parts: [
      {
        id: 'sun',
        name: '太陽',
        box: [18, 18, 64, 64],
        anchor: [50, 50],
        label: [104, 30],
        body: circle(50, 50, 24, 'fill-mark') + Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return line(50 + 29 * Math.cos(a), 50 + 29 * Math.sin(a), 50 + 36 * Math.cos(a), 50 + 36 * Math.sin(a), 'ln thin');
        }).join(''),
      },
      {
        id: 'panel',
        name: '光電池（太陽電池）',
        box: [108, 130, 164, 120],
        anchor: [120, 190],
        label: [92, 268],
        body: `<g class="panel">${rect(118, 178, 144, 24, 'fill-soft', 2)}${cells}</g>`,
      },
      {
        id: 'inverter',
        name: 'パワーコンディショナ',
        box: [226, 236, 64, 40],
        anchor: [258, 240],
        label: [258, 296],
        body: rect(230, 240, 56, 32, 'box', 4) + text(258, 261, '交流に', { cls: 'tiny' }),
      },
      g.part,
    ],
    flows: [
      { id: 'light', d: 'M76 76L150 150M60 92L126 158M92 60L166 134' },
      { id: 'electric', d: 'M190 250H230M286 256H300V200' },
      g.flow,
    ],
  };
}

function handGenerator(): Plan {
  const winds = Array.from({ length: 9 }, (_, i) => line(128 + i * 8, 108, 128 + i * 8, 120, 'ln thin') + line(128 + i * 8, 170, 128 + i * 8, 182, 'ln thin')).join('');
  return {
    width: 380,
    height: 260,
    alt: '手回し発電機の中のようす。ハンドルを回すと、中のじしゃくがコイルの中で回り、コイルに電流が流れて電球が光る。',
    back: rect(90, 86, 150, 118, 'box', 10) + line(40, 145, 112, 145, 'ln thick'),
    parts: [
      {
        id: 'handle',
        name: 'ハンドル',
        box: [14, 90, 60, 110],
        anchor: [44, 112],
        label: [44, 226],
        body: spin(44, 145, line(44, 145, 44, 108, 'ln thick') + circle(44, 104, 7, 'fill-mark') + circle(44, 145, 6, 'ink')),
      },
      {
        id: 'coil',
        name: 'コイル',
        box: [118, 102, 96, 86],
        anchor: [208, 114],
        label: [166, 82],
        body: rect(122, 108, 88, 74, 'ln') + winds,
      },
      {
        id: 'magnet',
        name: 'じしゃく',
        box: [132, 128, 68, 34],
        anchor: [140, 145],
        label: [166, 222],
        body: spin(166, 145, rect(136, 135, 30, 20, 'flame') + rect(166, 135, 30, 20, 'fill-soft') + text(151, 150, 'N', { cls: 'tiny on-dark' }) + text(181, 150, 'S', { cls: 'tiny' })),
      },
      {
        id: 'bulb',
        name: '電球',
        box: [290, 108, 60, 66],
        anchor: [320, 116],
        label: [320, 196],
        body: bulb(320, 132) + line(304, 150, 314, 150, 'ln thin') + line(326, 150, 336, 150, 'ln thin'),
      },
    ],
    flows: [{ id: 'electric', d: 'M240 120H300V132M240 170H320V150' }],
  };
}

/** 発電所の図の組み立て方 */
export const PLANS: Record<PlantId, () => Plan> = {
  generator: handGenerator,
  thermal,
  hydro,
  nuclear,
  wind,
  geothermal,
  solar,
};

/** 発電所の図 (問題の図でも使う) */
export const plantFig = (id: PlantId, labels?: Record<string, string>) => buildFig(PLANS[id](), labels);

/** 図の部品の id と名前 */
export const plantParts = (id: PlantId) => planParts(PLANS[id]());
