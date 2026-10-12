import { addDays } from './date';
import type { Level, Question } from './quiz';

const PREFIX = 'science-quiz:v1:';

// localStorage が使えない環境 (プライベートブラウズなど) でも遊べるよう、失敗は無視する
function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* 無視 */
  }
}

/** その日の途中経過。answers は、答えた順に、えらんだ選択肢の位置 */
export interface Progress {
  /** 問題の中身が変わっていないかを見分ける印 */
  sig: string;
  answers: number[];
}

/** 保存した途中経過が、今の問題のものかを見分けるための印 */
export function signature(questions: Question[]): string {
  return questions.map((q) => `${q.id}:${q.answer}:${q.choices.length}`).join('|');
}

const progressKey = (date: string, level: Level) => `progress:${date}:${level}`;

/** その日の途中経過。問題が変わっていたら (アプリの更新など)、はじめからにする */
export function loadAnswers(date: string, level: Level, questions: Question[]): number[] {
  const saved = read<Progress>(progressKey(date, level));
  if (!saved || saved.sig !== signature(questions) || !Array.isArray(saved.answers)) return [];
  return saved.answers.filter((a) => Number.isInteger(a)).slice(0, questions.length);
}

export function saveAnswers(date: string, level: Level, questions: Question[], answers: number[]): void {
  write(progressKey(date, level), { sig: signature(questions), answers } satisfies Progress);
  if (answers.length >= questions.length) {
    const done = read<Record<string, number>>(`done:${level}`) ?? {};
    done[date] = score(questions, answers);
    write(`done:${level}`, done);
  }
}

export const score = (questions: Question[], answers: number[]) => answers.filter((a, i) => a === questions[i]?.answer).length;

/** その日の問題を全部とき終えたか */
export function isDone(date: string, level: Level): boolean {
  return (read<Record<string, number>>(`done:${level}`) ?? {})[date] !== undefined;
}

/** 今日までつづけて、毎日 (どちらかのレベルを) とき終えた日数。今日がまだなら、きのうまでを数える */
export function currentStreak(today: string): number {
  const lower = read<Record<string, number>>('done:lower') ?? {};
  const upper = read<Record<string, number>>('done:upper') ?? {};
  const played = (d: string) => lower[d] !== undefined || upper[d] !== undefined;
  let day = played(today) ? today : addDays(today, -1);
  let n = 0;
  while (played(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

/** 前の日までの途中経過は、もう使わないので消す */
export function pruneOld(today: string): void {
  try {
    const stale: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${PREFIX}progress:`) && !key.startsWith(`${PREFIX}progress:${today}:`)) stale.push(key);
    }
    stale.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* 無視 */
  }
}

