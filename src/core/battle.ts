// --- 理科たいせん: きまり ---
// 2〜8 人が同じ部屋に入り、同じ問題を同時に見て、それぞれ 1 回だけ答える。答えた時点では正誤を出さず、
// 今いる人がみんな答えるか時間切れになったら、正解を出す。最後に、正解数 (正解率) が多い順、
// 同じなら答えるまでにかかった時間の合計が短い順に順位をつける。問題は部屋の学年 (3〜6 年生むけ) のジェネレーターから作る。
// 通信も画面もさわらない関数だけを置く (kanji-quiz の意味かるた たいせん と同じ形)。
//
// scienceBattles/{code}                 code = 0 で始まらない 5 けたの数
//   app: 'science-quiz', hostUid, createdAt, grade: 3..6, count: 5 | 10 | 20, version
//   cats: 出す分野 (CATEGORIES の順に 1 ビットずつ。ないときは全部)
//   round: 1, 2, …                       「もう一度」で 1 つふえる
//   seed, status: 'waiting' | 'playing' | 'finished', startAt
//   q: 出している問題 (0 から), qAt: その問題を出す時刻 (サーバーの時刻)
//   players/{seat}: { uid, name, joinedAt, online }      seat = 0..7
//   starts/{q}: その問題を出した時刻 (サーバーの時刻。答えるまでの時間を出すのに使う)
//   answers/{q}/{seat}: { choice: 0..3, round, at }       その人の答え (1 回だけ。at はサーバーの時刻)
import { toQuestion } from './daily';
import { CATEGORIES, CATEGORY_LABEL, GRADE, LEVELS, type Category, type Level, type Question } from './quiz';
import { GENERATORS } from '../questions';
import { hashString, rngFromString, shuffle, type Rng } from './rng';

export const MAX_PLAYERS = 8;
export const NAME_MAX = 10;
/** スタートから 1 問目まで */
export const COUNTDOWN_MS = 3000;
/** 正解と解説を見せてから、次の問題を出すまで */
export const REVEAL_MS = 5000;
/** これより古い部屋は、だれが上書きしてもよい (database.rules.json と同じ値) */
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
export const COUNTS = [5, 10, 20] as const;
export const GRADES = LEVELS.map((level) => GRADE[level]);
/**
 * 問題の作り方 (battleGame、乱数の使い方) や 1 問の時間を変えたら 1 つ上げる。
 * 古いページの人には、読みこみ直してもらう (ちがう問題を見たり、時間切れがずれたりするので)。
 * 2: 1 問の時間を 20 秒ふやした
 * 3: 出す分野をえらべるようにした
 * 4: 早おしをやめて、正解率と時間で順位をつけるようにした
 */
export const RULES_VERSION = 4;

/** 全部の分野 (cats の値) */
export const ALL_CATS = (1 << CATEGORIES.length) - 1;

/** 分野のならび → cats の値 */
export const catsOf = (categories: readonly Category[]): number => categories.reduce((bits, c) => bits | (1 << CATEGORIES.indexOf(c)), 0);

/** cats の値 → 分野のならび (CATEGORIES の順)。おかしな値なら全部 */
export function categoriesOf(cats: number | undefined): Category[] {
  const bits = Number.isInteger(cats) && cats! > 0 && cats! <= ALL_CATS ? cats! : ALL_CATS;
  return CATEGORIES.filter((_, i) => bits & (1 << i));
}

/** 出す分野を短く言う (「すべての分野」「てこ・輪軸・かっ車」「5つの分野」) */
export function catsLabel(cats: number | undefined): string {
  const list = categoriesOf(cats);
  if (list.length === CATEGORIES.length) return 'すべての分野';
  return list.length <= 3 ? list.map((c) => CATEGORY_LABEL[c]).join('・') : `${list.length}つの分野`;
}

export interface Player {
  uid: string;
  name: string;
  joinedAt?: number;
  online?: boolean;
}

export interface Answer {
  choice: number;
  round: number;
  at?: number;
}

export interface Room {
  app?: string;
  hostUid: string;
  createdAt?: number;
  grade: number;
  count: number;
  /** 出す分野 (ないときは全部) */
  cats?: number;
  version?: string;
  round: number;
  seed: string;
  status: 'waiting' | 'playing' | 'finished';
  startAt?: number;
  q?: number;
  qAt?: number;
  players: Record<string, Player>;
  /** 問題 (0 から) → その問題を出した時刻 */
  starts: Record<string, number>;
  /** 問題 (0 から) → 席 → 答え */
  answers: Record<string, Record<string, Answer>>;
}

/** 部屋の学年のレベル (g3〜g6) */
export function levelOf(room: Pick<Room, 'grade'>): Level {
  return LEVELS.find((level) => GRADE[level] === room.grade) ?? 'g3';
}

export function freeSeat(room: Room): string | null {
  for (let i = 0; i < MAX_PLAYERS; i++) if (!room.players?.[i]) return String(i);
  return null;
}

export function seatOf(room: Room, uid: string): string | null {
  const found = Object.entries(room.players ?? {}).find(([, p]) => p.uid === uid);
  return found ? found[0] : null;
}

export function makeCode(random: () => number = Math.random): string {
  return String(10000 + Math.floor(random() * 90000));
}

/** 全角の数字・空白・ハイフンも受けつける */
export function parseCode(input: string): string | null {
  const s = String(input)
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
    .replace(/[\s\-ー－]/g, '');
  return /^[1-9]\d{4}$/.test(s) ? s : null;
}

export function makeSeed(random: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 10; i++) s += Math.floor(random() * 36).toString(36);
  return s;
}

/** 制御文字をのぞき、空白は 1 つにまとめ、NAME_MAX 文字まで */
export function cleanName(input: string): string {
  const s = String(input)
    .replace(/[\p{Cc}\p{Cf}\u2028\u2029]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return [...s].slice(0, NAME_MAX).join('');
}

/**
 * その回の問題。同じ学年・数・分野・種なら、どの端末で作っても同じになる。
 * えらんだ分野をまぜた順に 1 問ずつ出し (分野が少なければ何周もする)、分野の中のジェネレーターは、
 * 全部を 1 回ずつ使い終わるまで同じものを使わない。同じ問題 (問題文と正解が同じもの) は 2 回出さない。
 */
export function battleQuestions(level: Level, count: number, rng: Rng, only: readonly Category[] = CATEGORIES): Question[] {
  const categories = shuffle(only.length > 0 ? only : CATEGORIES, rng);
  const used = new Set<string>();
  const texts = new Set<string>();
  const questions: Question[] = [];
  for (let i = 0; questions.length < count && i < count * 20; i++) {
    const category = categories[i % categories.length];
    const all = GENERATORS[level][category];
    // その分野のジェネレーターを全部使ったら、また 1 回ずつ使う
    if (all.every((g) => used.has(g.id))) all.forEach((g) => used.delete(g.id));
    const gens = all.filter((g) => !used.has(g.id));
    const gen = gens[Math.floor(rng() * gens.length)];
    used.add(gen.id);
    const q = toQuestion(level, category, gen, gen.make(rng));
    // 同じ問題文でも、正解がちがえば別の問題 (「昆虫のなかまはどれ」など)
    const key = `${q.text}|${q.choices[q.answer]}`;
    if (texts.has(key)) continue;
    texts.add(key);
    questions.push(q);
  }
  return questions;
}

/** 部屋の今の回の問題 */
export function makeGame(room: Pick<Room, 'grade' | 'count' | 'cats' | 'seed' | 'round'>): Question[] {
  return battleQuestions(levelOf(room), room.count, rngFromString(`${room.seed}:${room.round}`), categoriesOf(room.cats));
}

/**
 * 1 問の時間 (秒)。3・4 年生むけは短め、5・6 年生むけ (計算が多い) は長め。図があれば、図を読む時間を足す
 */
export function timeLimit(level: Level, q: Pick<Question, 'svg' | 'text'>): number {
  const base = GRADE[level] <= 4 ? 40 : 50;
  return base + (q.svg ? 10 : 0) + (q.text.length > 120 ? 5 : 0);
}

let version: string | null = null;
/**
 * 問題やその作り方が変わると変わる印。ちがう印のページどうしでは、ちがう問題を見てしまうので、
 * 部屋と印がちがう人には読みこみ直してもらう
 */
export function dataVersion(): string {
  if (!version) {
    const sample = LEVELS.flatMap((level) =>
      [0, 1, 2].map((n) => battleQuestions(level, 20, rngFromString(`version:${n}`)).map((q) => `${q.id}|${q.text}|${q.choices.join('/')}|${q.answer}`)),
    );
    const ids = LEVELS.map((level) => CATEGORIES.map((c) => GENERATORS[level][c].map((g) => g.id).join(',')).join(';'));
    version = `s${RULES_VERSION}-${hashString(JSON.stringify([ids, sample])).toString(16).padStart(8, '0')}`;
  }
  return version;
}

export interface SeatedPlayer extends Player {
  seat: string;
}

export function playersList(room: Room): SeatedPlayer[] {
  return Object.entries(room.players ?? {})
    .map(([seat, p]) => ({ seat, ...p }))
    .sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0));
}

/** この回の、その人の q 問目の答え。まだなら null */
export function answerOf(room: Room, q: number, seat: string | null): Answer | null {
  const answer = seat === null ? undefined : room.answers?.[q]?.[seat];
  return answer && answer.round === room.round ? answer : null;
}

/** q 問目に、今いる人のうち何人が答えたか */
export function answeredCount(room: Room, q: number): { done: number; here: number } {
  const here = playersList(room).filter((p) => p.online);
  return { done: here.filter((p) => answerOf(room, q, p.seat)).length, here: here.length };
}

/** q 問目が終わったか: 今いる人がみんな答えた (時間切れは画面の方で見る) */
export function settled(room: Room, q: number): boolean {
  const { done, here } = answeredCount(room, q);
  return here > 0 && done === here;
}

/**
 * q 問目に答えるまでにかかった時間 (ミリ秒)。問題を出した時刻から答えた時刻まで。
 * 制限時間 (limitMs) より長いときや、答えていないときは、制限時間にする
 */
export function answerTime(room: Room, q: number, seat: string, limitMs: number): number {
  const answer = answerOf(room, q, seat);
  const start = room.starts?.[q];
  if (!answer || answer.at === undefined || start === undefined) return limitMs;
  return Math.min(limitMs, Math.max(0, answer.at - start));
}

export interface Standing {
  seat: string;
  uid: string;
  name: string;
  online: boolean;
  /** 正解した問題の数 */
  correct: number;
  /** 正解率 (0〜1) */
  rate: number;
  /** 答えるまでにかかった時間の合計 (ミリ秒。答えなかった問題は制限時間) */
  time: number;
  /** 正解した問題 (0 から) */
  right: number[];
  rank: number | null;
}

/**
 * 順位表。正解数が多い順 (= 正解率が高い順)、同じなら時間の合計が短い順 (どちらも同じなら同じ順位)。
 * 部屋を出た人は、順位をつけずに最後にならべる。questions は、この回の問題 (makeGame の結果)
 */
export function standings(room: Room, questions: Question[]): Standing[] {
  const level = levelOf(room);
  const rows: Standing[] = playersList(room).map((p) => {
    const right = questions.flatMap((question, q) => (answerOf(room, q, p.seat)?.choice === question.answer ? [q] : []));
    const time = questions.reduce((sum, question, q) => sum + answerTime(room, q, p.seat, timeLimit(level, question) * 1000), 0);
    return {
      seat: p.seat,
      uid: p.uid,
      name: p.name,
      online: Boolean(p.online),
      correct: right.length,
      rate: questions.length > 0 ? right.length / questions.length : 0,
      time,
      right,
      rank: null,
    };
  });
  rows.sort((a, b) => Number(b.online) - Number(a.online) || b.correct - a.correct || a.time - b.time);
  let prev: Standing | null = null;
  rows.forEach((row, i) => {
    if (!row.online) return;
    row.rank = prev && prev.correct === row.correct && prev.time === row.time ? prev.rank : i + 1;
    prev = row;
  });
  return rows;
}

/** 正解率の書き方 (「80%」) */
export const rateText = (rate: number) => `${Math.round(rate * 100)}%`;

/** 時間の書き方 (「1分23秒」「45.2秒」)。1 分より短いときは 0.1 秒まで */
export function timeText(ms: number): string {
  const sec = ms / 1000;
  if (sec < 60) return `${(Math.floor(sec * 10) / 10).toFixed(1)}秒`;
  const whole = Math.floor(sec);
  return `${Math.floor(whole / 60)}分${whole % 60}秒`;
}
