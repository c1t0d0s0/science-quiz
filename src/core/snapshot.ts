// ---- 手元の記録の形 ----

/** その日の途中経過。answers は、答えた順に、えらんだ選択肢の位置 */
export interface Progress {
  /** 問題の中身が変わっていないかを見分ける印 */
  sig: string;
  answers: number[];
  /** さいごに保存した時刻 (ミリ秒)。2 か所の記録を合わせるときに使う */
  at?: number;
}

/** 1 人分の記録の全部。ログインなしの記録も、ログイン中の人の記録も、この形であつかう */
export interface Snapshot {
  /** とき終えた 10 問の正解数。キーは「レベル:日付」(g3:2026-10-12 など) */
  done: Record<string, number>;
  /** 途中経過。キーは「日付:レベル」(2026-10-12:g3 など) */
  progress: Record<string, Progress>;
}

export function emptySnapshot(): Snapshot {
  return { done: {}, progress: {} };
}

/** 記録が 1 つでもあるか */
export function hasRecords(s: Snapshot): boolean {
  return Object.keys(s.done).length > 0 || Object.values(s.progress).some((p) => p.answers.length > 0);
}

// ---- Firestore に保存する形 (小学生向けの学習アプリで共通。Wordlynx と同じ) ----
//
//   users/{uid}                                その人の情報 (全アプリ共通)。名前やメールアドレスは入れない
//   users/{uid}/apps/{appId}                   アプリごとの記録のまとめ (AppDoc)
//   users/{uid}/apps/{appId}/progress/{itemId} 教材 1 つごとの途中経過 (ProgressDoc)
//
// このアプリの appId は "science-quiz"。Wordlynx ("wordlynx") とは別の場所に入るので、記録はまざらない。

export const SCHEMA = 1;
export const APP_ID = 'science-quiz';

export interface AppDoc {
  schema: number;
  updatedAt: number;
  /** その日の目標を達成した日 (YYYY-MM-DD)。このアプリでは、どれかの学年の 10 問をとき終えた日 */
  activeDays: string[];
  /** やりとげた教材の id。このアプリでは「レベル:日付」 */
  completed: string[];
  /** 手に入れたごほうび (このアプリでは使わない) */
  inventory: Record<string, { paid: number }>;
  /** 使ったポイント (このアプリでは使わない) */
  spent: Record<string, number>;
  /** アプリごとの設定。このアプリでは scores に「レベル:日付」ごとの正解数を入れる */
  settings: Record<string, unknown>;
}

export interface ProgressDoc {
  schema: number;
  updatedAt: number;
  status: 'playing' | 'done';
  /** 途中経過の中身。このアプリでは、問題の印と、えらんだ答え */
  data: Record<string, unknown>;
}

/** 「レベル:日付」の日付の部分 */
const dateOf = (key: string) => key.slice(key.indexOf(':') + 1);

export function toAppDoc(s: Snapshot, now: number): AppDoc {
  const keys = Object.keys(s.done).sort();
  return {
    schema: SCHEMA,
    updatedAt: now,
    activeDays: [...new Set(keys.map(dateOf))].sort(),
    completed: keys,
    inventory: {},
    spent: {},
    settings: { scores: Object.fromEntries(keys.map((k) => [k, s.done[k]])) },
  };
}

const validKey = (key: string) => /^[a-z0-9]+:\d{4}-\d{2}-\d{2}$/.test(key);
const validScore = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100;

/** Firestore から読んだものは形がくずれているかもしれないので、1 つずつ確かめながらもどす */
export function fromAppDoc(doc: Partial<AppDoc> | null | undefined): Snapshot {
  const s = emptySnapshot();
  if (!doc) return s;
  const scores = doc.settings?.scores;
  if (typeof scores === 'object' && scores !== null) {
    for (const [key, value] of Object.entries(scores)) if (validKey(key) && validScore(value)) s.done[key] = value;
  }
  return s;
}

/** 途中経過が、最後の問題まで答えてあるか (10 問) */
const finished = (p: Progress) => p.answers.length >= 10;

export function toProgressDoc(p: Progress, now: number): ProgressDoc {
  return {
    schema: SCHEMA,
    updatedAt: p.at ?? now,
    status: finished(p) ? 'done' : 'playing',
    data: { sig: p.sig, answers: p.answers },
  };
}

export function fromProgressDoc(doc: Partial<ProgressDoc> | null | undefined): Progress | null {
  const d = doc?.data;
  if (!d || typeof d.sig !== 'string' || !Array.isArray(d.answers)) return null;
  return {
    sig: d.sig,
    answers: d.answers.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < 4),
    at: typeof doc?.updatedAt === 'number' ? doc.updatedAt : undefined,
  };
}
