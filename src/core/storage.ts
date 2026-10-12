import { addDays } from './date';
import type { Level, Question } from './quiz';
import { emptySnapshot, type Progress, type Snapshot } from './snapshot';

export type { Progress } from './snapshot';

// 記録を置く場所。ログインしていない人の記録は今までどおり GUEST_PREFIX の下。
// ログイン中の人の記録 (Firestore の写し) は、人ごとに別の場所に置き、ログアウトしたら消す。
const GUEST_PREFIX = 'science-quiz:v1:';
const userPrefix = (uid: string) => `science-quiz:u:${uid}:`;
const ACTIVE_UID_KEY = 'science-quiz:auth-uid';

let prefix = GUEST_PREFIX;
let listener: ((key: string) => void) | null = null;
let muted = false;

/** 読み書きする記録を切りかえる。uid が null ならログインなしの記録 */
export function useStore(uid: string | null): void {
  prefix = uid ? userPrefix(uid) : GUEST_PREFIX;
}

/** 今、読み書きしているのがだれの記録か。ログインなしの記録なら null */
export function currentUid(): string | null {
  return prefix === GUEST_PREFIX ? null : prefix.slice('science-quiz:u:'.length, -1);
}

/** この端末で、さいごにログインしていた人。次に開いたとき、通信を待たずにその人の写しを出すために使う */
export function rememberedUid(): string | null {
  try {
    return localStorage.getItem(ACTIVE_UID_KEY);
  } catch {
    return null;
  }
}

export function rememberUid(uid: string | null): void {
  try {
    if (uid) localStorage.setItem(ACTIVE_UID_KEY, uid);
    else localStorage.removeItem(ACTIVE_UID_KEY);
  } catch {
    /* 無視 */
  }
}

/** 記録が書きかわったら知らせてもらう (Firestore に送るため)。key は「done:g3」「progress:2026-10-12:g3」など */
export function onStorageChange(cb: ((key: string) => void) | null): void {
  listener = cb;
}

// localStorage が使えない環境 (プライベートブラウズなど) でも遊べるよう、失敗は無視する
function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(prefix + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(prefix + key, JSON.stringify(value));
  } catch {
    /* 保存できなくても続行 */
  }
  if (!muted) listener?.(key);
}

/** 今の場所にあるキーの一覧 (prefix をのぞいた形) */
function keys(at: string = prefix): string[] {
  const out: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(at)) out.push(key.slice(at.length));
    }
  } catch {
    /* 無視 */
  }
  return out;
}

function removeKey(fullKey: string): void {
  try {
    localStorage.removeItem(fullKey);
  } catch {
    /* 無視 */
  }
}

/** 保存した途中経過が、今の問題のものかを見分けるための印 */
export function signature(questions: Question[]): string {
  return questions.map((q) => `${q.id}:${q.answer}:${q.choices.length}`).join('|');
}

/** 途中経過の id (Firestore でも同じ id を使う) */
export const progressId = (date: string, level: Level) => `${date}:${level}`;

/** その日の途中経過。問題が変わっていたら (アプリの更新など)、はじめからにする */
export function loadAnswers(date: string, level: Level, questions: Question[]): number[] {
  const saved = read<Progress>(`progress:${progressId(date, level)}`);
  if (!saved || saved.sig !== signature(questions) || !Array.isArray(saved.answers)) return [];
  return saved.answers.filter((a) => Number.isInteger(a)).slice(0, questions.length);
}

export function saveAnswers(date: string, level: Level, questions: Question[], answers: number[]): void {
  write(`progress:${progressId(date, level)}`, { sig: signature(questions), answers, at: Date.now() } satisfies Progress);
  if (answers.length >= questions.length) {
    const done = readDone(level);
    const points = score(questions, answers);
    if (done[date] !== points) write(`done:${level}`, { ...done, [date]: points });
  }
}

export const score = (questions: Question[], answers: number[]) => answers.filter((a, i) => a === questions[i]?.answer).length;

/** そのレベルの、とき終えた日と正解数 */
function readDone(level: string): Record<string, number> {
  const saved = read<Record<string, number>>(`done:${level}`);
  const out: Record<string, number> = {};
  for (const [date, points] of Object.entries(saved ?? {})) if (typeof points === 'number') out[date] = points;
  return out;
}

/** 記録のあるレベルの一覧 (レベルが 2 つだったころの lower・upper もふくむ) */
const doneLevels = () => keys().filter((k) => k.startsWith('done:')).map((k) => k.slice('done:'.length));

/** その日の問題を全部とき終えたか */
export function isDone(date: string, level: Level): boolean {
  return readDone(level)[date] !== undefined;
}

/** 今日までつづけて、毎日 (どれかの学年を) とき終えた日数。今日がまだなら、きのうまでを数える */
export function currentStreak(today: string): number {
  const records = doneLevels().map(readDone);
  const played = (d: string) => records.some((r) => r[d] !== undefined);
  let day = played(today) ? today : addDays(today, -1);
  let n = 0;
  while (played(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

/** 途中経過のうち、前の日までのものかどうか (もう使わないので消してよい) */
export function isStale(id: string, today: string): boolean {
  return !id.startsWith(`${today}:`);
}

/** 前の日までの途中経過は、もう使わないので消す */
export function pruneOld(today: string): void {
  for (const key of keys()) {
    if (key.startsWith('progress:') && isStale(key.slice('progress:'.length), today)) removeKey(prefix + key);
  }
}

// ---- 記録をまるごと出し入れする (ログイン・Firestore との同期で使う) ----

/** 今の場所にある記録を、まるごと取り出す */
export function exportSnapshot(): Snapshot {
  const s = emptySnapshot();
  for (const level of doneLevels().sort()) {
    for (const [date, points] of Object.entries(readDone(level))) s.done[`${level}:${date}`] = points;
  }
  for (const key of keys()) {
    if (!key.startsWith('progress:')) continue;
    const p = read<Progress>(key);
    if (p && typeof p.sig === 'string' && Array.isArray(p.answers)) s.progress[key.slice('progress:'.length)] = p;
  }
  return s;
}

/**
 * 今の場所の記録を、わたされた内容に入れかえる。
 * Firestore から取りこんだ結果を書くためのものなので、「書きかわった」という知らせは出さない。
 * keepProgress が true のときは、途中経過にはさわらない。
 */
export function importSnapshot(s: Snapshot, opts: { keepProgress?: boolean } = {}): void {
  muted = true;
  try {
    const byLevel: Record<string, Record<string, number>> = {};
    for (const [key, points] of Object.entries(s.done)) {
      const at = key.indexOf(':');
      (byLevel[key.slice(0, at)] ??= {})[key.slice(at + 1)] = points;
    }
    for (const level of doneLevels()) if (!(level in byLevel)) removeKey(`${prefix}done:${level}`);
    for (const [level, done] of Object.entries(byLevel)) write(`done:${level}`, done);
    if (!opts.keepProgress) {
      for (const key of keys()) {
        if (key.startsWith('progress:') && !(key.slice('progress:'.length) in s.progress)) removeKey(prefix + key);
      }
      for (const [id, p] of Object.entries(s.progress)) write(`progress:${id}`, p);
    }
  } finally {
    muted = false;
  }
}

/** その人の記録 (uid が null ならログインなしの記録) を、この端末から消す */
export function clearStore(uid: string | null): void {
  const at = uid ? userPrefix(uid) : GUEST_PREFIX;
  for (const key of keys(at)) removeKey(at + key);
}
