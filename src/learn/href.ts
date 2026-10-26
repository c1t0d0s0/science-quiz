// 解説の URL。メインの画面 (ホーム・問題) からも使うので、解説のデータは読みこまない

/** 解説へのリンク (step は 0 から) */
export const learnHref = (id: string, step = 0) => (step > 0 ? `#/learn/${id}/${step + 1}` : `#/learn/${id}`);

/**
 * #/learn (一覧) と #/learn/<id>/<step> を読む。step は 0 から (ステップの数をこえていないかは、画面でたしかめる)。
 * 前の #/power/<id>/<step> も同じように読む
 */
export function parseLearnHash(hash: string): { id: string | null; step: number } | null {
  const m = hash.match(/^#\/(?:learn|power)(?:\/([a-z]+)(?:\/(\d+))?)?\/?$/);
  if (!m) return null;
  return { id: m[1] ?? null, step: Math.max(0, Number(m[2] ?? 1) - 1) };
}
