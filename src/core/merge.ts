import type { Progress, Snapshot } from './snapshot';

// 2 か所にある記録 (たとえば、この端末と Firestore) を 1 つに合わせる。
// どの関数も、同じものを 2 回合わせても変わらず、a と b を入れかえても同じ結果になる。
// そのため、何回やっても・どの順でやっても、記録がこわれたり二重にふえたりしない。

/** 決め手がないときに、いつも同じほうをえらぶための比べ方 */
const pickStable = <T>(a: T, b: T): T => (JSON.stringify(a) <= JSON.stringify(b) ? a : b);

/** 途中経過: 先まで答えているほう。同じところまでなら、あとから保存したほう */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const base = ((): Progress => {
    // 問題そのものが作り直されているときは、新しく保存されたほう
    if (a.sig === b.sig && a.answers.length !== b.answers.length) return a.answers.length > b.answers.length ? a : b;
    if ((a.at ?? 0) !== (b.at ?? 0)) return (a.at ?? 0) > (b.at ?? 0) ? a : b;
    return pickStable(a, b);
  })();
  const merged: Progress = { ...base };
  if (a.sig === b.sig) {
    const at = Math.max(a.at ?? 0, b.at ?? 0);
    if (at > 0) merged.at = at;
  }
  return merged;
}

/** とき終えた記録: 両方を合わせる。同じ日・同じ学年が両方にあれば、正解数の多いほう */
export function mergeDone(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) out[key] = Math.max(a[key] ?? 0, b[key] ?? 0);
  return out;
}

export function mergeSnapshots(a: Snapshot, b: Snapshot): Snapshot {
  const progress: Record<string, Progress> = {};
  for (const id of [...new Set([...Object.keys(a.progress), ...Object.keys(b.progress)])].sort()) {
    const pa = a.progress[id];
    const pb = b.progress[id];
    progress[id] = pa && pb ? mergeProgress(pa, pb) : (pa ?? pb);
  }
  return { done: mergeDone(a.done, b.done), progress };
}

/** 記録の中身が同じか (ならび順のちがいは気にしない) */
export function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

export function sameSummary(a: Snapshot, b: Snapshot): boolean {
  return JSON.stringify({ ...canonical(a), progress: null }) === JSON.stringify({ ...canonical(b), progress: null });
}

function canonical(s: Snapshot): Snapshot {
  return mergeSnapshots(s, s);
}
