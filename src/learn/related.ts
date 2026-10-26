// 今日の10問のジェネレーター → 解説の下に「図でしくみを見る」で開く解説。
// メインの画面から使うので、解説のデータは読みこまない (id だけ)。発電所の問題は、ジェネレーターが自分で learn をつける

const RELATED: Record<string, string[]> = {
  lever: ['lever-l-balance', 'lever-l-tilt', 'lever-l-position', 'lever-l-rule', 'lever-l-seesaw', 'lever-l-points', 'lever-u-two', 'lever-u-fulcrum'],
  pendulum: ['motion-l-swing', 'motion-u-pendulum', 'motion-u-period', 'motion-u-length', 'motion-u-pendpair'],
  circuit: ['bulbs-l-wiring', 'bulbs-l-basics', 'bulbs-l-compare', 'bulbs-l-name', 'bulbs-l-remove', 'bulbs-u-current', 'bulbs-u-brightest', 'bulbs-u-life', 'bulbs-u-cell'],
  blood: ['animals-u-heart', 'body-l-pulse', 'body-l-pulsecount'],
  digestion: ['animals-u-digestion'],
  breathing: ['animals-u-breath', 'body-u-oxygen', 'body-l-breathcount'],
  heating: ['matter-l-heat', 'heat-u-transfer', 'heat-l-warm'],
  water: ['matter-l-state', 'heat-u-ice'],
  burning: ['matter-u-burn'],
  waterpath: ['plants-u-transpiration'],
  photosynthesis: ['plants-u-photosynthesis'],
  germination: ['plants-u-sprout'],
  generator: ['magnet-u-field'],
};

/** ジェネレーターの id → 解説の id */
export const LEARN_FOR: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(RELATED).flatMap(([guide, gens]) => gens.map((gen) => [gen, guide])),
);
