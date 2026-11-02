// --- 理科たいせん: きまり ---
// 2〜8 人が同じ部屋に入り、同じ問題を同時に見て、いちばん早く正解をえらんだ人がその問題をとる。
// まちがえた人 (おてつき) は、その問題はお休み。問題は部屋の学年 (3〜6 年生むけ) のジェネレーターから作る。
// 通信も画面もさわらない関数だけを置く (kanji-quiz の意味かるた たいせん と同じ形)。
//
// scienceBattles/{code}                 code = 0 で始まらない 5 けたの数
//   app: 'science-quiz', hostUid, createdAt, grade: 3..6, count: 5 | 10 | 20, version
//   round: 1, 2, …                       「もう一度」で 1 つふえる
//   seed, status: 'waiting' | 'playing' | 'finished', startAt
//   q: 出している問題 (0 から), qAt: その問題を出す時刻 (サーバーの時刻)
//   players/{seat}: { uid, name, joinedAt, online }      seat = 0..7
//   takes/{q}: { seat, round, at }                       いちばん早く正解した人
//   faults/{q}/{seat}: true                              おてつき
import { toQuestion } from './daily';
import { CATEGORIES, GRADE, LEVELS, type Level, type Question } from './quiz';
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
 */
export const RULES_VERSION = 2;

export interface Player {
  uid: string;
  name: string;
  joinedAt?: number;
  online?: boolean;
}

export interface Take {
  seat: string;
  round: number;
  at?: number;
}

export interface Room {
  app?: string;
  hostUid: string;
  createdAt?: number;
  grade: number;
  count: number;
  version?: string;
  round: number;
  seed: string;
  status: 'waiting' | 'playing' | 'finished';
  startAt?: number;
  q?: number;
  qAt?: number;
  players: Record<string, Player>;
  takes: Record<string, Take>;
  faults: Record<string, Record<string, boolean>>;
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
 * その回の問題。同じ学年・数・種なら、どの端末で作っても同じになる。
 * 16 の分野をまぜた順に 1 問ずつ出し (20 問なら 2 周目に入る)、分野の中のジェネレーターはつづけて同じものを使わない。
 */
export function battleQuestions(level: Level, count: number, rng: Rng): Question[] {
  const categories = shuffle(CATEGORIES, rng);
  const used = new Set<string>();
  const texts = new Set<string>();
  const questions: Question[] = [];
  for (let i = 0; questions.length < count && i < count * 4; i++) {
    const category = categories[i % categories.length];
    const gens = GENERATORS[level][category].filter((g) => !used.has(g.id));
    if (gens.length === 0) continue;
    const gen = gens[Math.floor(rng() * gens.length)];
    used.add(gen.id);
    const q = toQuestion(level, category, gen, gen.make(rng));
    if (texts.has(q.text)) continue;
    texts.add(q.text);
    questions.push(q);
  }
  return questions;
}

/** 部屋の今の回の問題 */
export function makeGame(room: Pick<Room, 'grade' | 'count' | 'seed' | 'round'>): Question[] {
  return battleQuestions(levelOf(room), room.count, rngFromString(`${room.seed}:${room.round}`));
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

/** この回の、q 問目をとった人。まだなら null */
export function takeOf(room: Room, q: number): Take | null {
  const take = room.takes?.[q];
  return take && take.round === room.round ? take : null;
}

export const faulted = (room: Room, q: number, seat: string | null) => seat !== null && room.faults?.[q]?.[seat] === true;

/** q 問目が終わったか: だれかがとった、または、今いる人がみんなおてつきした */
export function settled(room: Room, q: number): boolean {
  if (takeOf(room, q)) return true;
  const here = playersList(room).filter((p) => p.online);
  return here.length > 0 && here.every((p) => faulted(room, q, p.seat));
}

export interface Standing {
  seat: string;
  uid: string;
  name: string;
  online: boolean;
  /** とった問題の数 */
  points: number;
  faults: number;
  /** とった問題 (0 から) */
  taken: number[];
  rank: number | null;
}

/**
 * 順位表。とった数が多い順、同じならおてつきが少ない順 (どちらも同じなら同じ順位)。
 * 部屋を出た人は、順位をつけずに最後にならべる
 */
export function standings(room: Room): Standing[] {
  const rows: Standing[] = playersList(room).map((p) => ({
    seat: p.seat,
    uid: p.uid,
    name: p.name,
    online: Boolean(p.online),
    points: 0,
    faults: 0,
    taken: [],
    rank: null,
  }));
  const bySeat = new Map(rows.map((row) => [row.seat, row]));
  for (let q = 0; q < room.count; q++) {
    const take = takeOf(room, q);
    const row = take && bySeat.get(take.seat);
    if (row) {
      row.points++;
      row.taken.push(q);
    }
    Object.keys(room.faults?.[q] ?? {}).forEach((seat) => {
      const faultRow = bySeat.get(seat);
      if (faultRow && faulted(room, q, seat)) faultRow.faults++;
    });
  }
  rows.sort((a, b) => Number(b.online) - Number(a.online) || b.points - a.points || a.faults - b.faults);
  let prev: Standing | null = null;
  rows.forEach((row, i) => {
    if (!row.online) return;
    row.rank = prev && prev.points === row.points && prev.faults === row.faults ? prev.rank : i + 1;
    prev = row;
  });
  return rows;
}
