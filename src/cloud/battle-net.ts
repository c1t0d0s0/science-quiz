// --- 理科たいせん: Firebase Realtime Database とのやりとり ---
// たいせんで Firebase を使うのは、このファイルだけ (kanji-quiz の battle-net と同じ形)。
// たいせんの画面を開いて、はじめてつなぐときに読みこむ。
import { signInAnonymously } from 'firebase/auth';
import {
  connectDatabaseEmulator,
  get,
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  runTransaction,
  serverTimestamp,
  set,
  update,
  type OnDisconnect,
} from 'firebase/database';
import * as Battle from '../core/battle';
import type { Room } from '../core/battle';
import { firebaseApp } from './app';
import { firebaseConfig, useEmulator } from './config';

// このアプリの部屋 (同じ Firebase プロジェクトの kanjiBattles・mathBattles などとは分ける)
const ROOT = 'scienceBattles';

/** Realtime Database は席 (0..7) を配列で返すことがあるので、いつも { 席: 人 } の形にする */
export function normalizeRoom(val: unknown): Room | null {
  if (!val || typeof val !== 'object') return null;
  const raw = val as Record<string, unknown>;
  const players: Room['players'] = {};
  Object.entries((raw.players as Record<string, Room['players'][string]>) ?? {}).forEach(([seat, p]) => {
    if (p) players[seat] = p;
  });
  const faults: Room['faults'] = {};
  Object.entries((raw.faults as Record<string, Record<string, boolean>>) ?? {}).forEach(([q, seats]) => {
    if (seats) faults[q] = Object.fromEntries(Object.entries(seats).filter(([, v]) => v));
  });
  const takes: Room['takes'] = {};
  Object.entries((raw.takes as Record<string, Room['takes'][string]>) ?? {}).forEach(([q, take]) => {
    if (take) takes[q] = take;
  });
  return { ...(raw as unknown as Room), players, faults, takes };
}

export type JoinResult = 'ok' | 'missing' | 'started' | 'full' | 'version';

export interface BattleNet {
  uid: string;
  serverNow(): number;
  seatIn(code: string): string | null;
  create(grade: number, count: number, cats: number, name: string): Promise<string>;
  join(code: string, name: string): Promise<JoinResult>;
  watch(code: string, cb: (room: Room | null) => void): () => void;
  take(code: string, round: number, q: number): Promise<boolean>;
  fault(code: string, q: number): Promise<void>;
  start(code: string): Promise<void>;
  advance(code: string, q: number): Promise<void>;
  end(code: string): Promise<void>;
  rematch(code: string, round: number): Promise<void>;
  configure(code: string, grade: number, count: number, cats: number): Promise<void>;
  leave(code: string): Promise<void>;
}

let connecting: Promise<BattleNet> | null = null;

/** Google でログインしていなければ匿名でログインして、たいせんの API を返す */
export function connectBattle(): Promise<BattleNet> {
  if (!connecting) {
    connecting = open();
    connecting.catch(() => {
      connecting = null;
    });
  }
  return connecting;
}

async function open(): Promise<BattleNet> {
  if (!firebaseConfig?.databaseURL) throw new Error('Realtime Database is not configured');
  const { app, auth } = firebaseApp(firebaseConfig, useEmulator);
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
  const uid = auth.currentUser!.uid;
  const d = getDatabase(app);
  if (useEmulator) connectDatabaseEmulator(d, '127.0.0.1', 9000);
  const roomRef = (code: string) => ref(d, `${ROOT}/${code}`);
  const seatRef = (code: string, seat: string) => ref(d, `${ROOT}/${code}/players/${seat}`);

  let offset = 0;
  onValue(ref(d, '.info/serverTimeOffset'), (snap) => {
    offset = Number(snap.val()) || 0;
  });
  const serverNow = () => Date.now() + offset;

  // 部屋ごとの自分の席。つなぎ直したらまた「いる」にし、タブをとじたら「いない」にする
  const mySeat = new Map<string, string>();
  const disconnects = new Map<string, OnDisconnect>();
  onValue(ref(d, '.info/connected'), (snap) => {
    if (snap.val() !== true) return;
    mySeat.forEach((seat, code) => void markOnline(code, seat));
  });

  async function markOnline(code: string, seat: string) {
    const r = ref(d, `${ROOT}/${code}/players/${seat}/online`);
    const od = onDisconnect(r);
    disconnects.set(code, od);
    await od.set(false);
    await set(r, true).catch(() => {});
  }

  const freshPlayer = (name: string) => ({ uid, name, joinedAt: serverNow(), online: true });

  return {
    uid,
    serverNow,
    seatIn: (code) => mySeat.get(code) ?? null,

    // 部屋を作って、自分がすわる。もどり値は たいせんコード
    async create(grade, count, cats, name) {
      for (let tries = 0; tries < 20; tries++) {
        const code = Battle.makeCode();
        const room = {
          app: 'science-quiz',
          hostUid: uid,
          createdAt: serverTimestamp(),
          grade,
          count,
          cats,
          version: Battle.dataVersion(),
          round: 1,
          seed: '',
          status: 'waiting',
          players: { 0: freshPlayer(name) },
        };
        // 使われていない番号 (または 1 日より前の部屋) だけ
        const now = serverNow();
        const result = await runTransaction(
          roomRef(code),
          (current) => (current && current.createdAt >= now - Battle.ROOM_TTL_MS ? undefined : room),
          { applyLocally: false },
        );
        if (!result.committed) continue;
        mySeat.set(code, '0');
        await markOnline(code, '0');
        return code;
      }
      throw new Error('たいせんコードを作れませんでした');
    },

    // 部屋に入る (もう入っている部屋なら、同じ席にもどる)
    async join(code, name) {
      for (let tries = 0; tries < 10; tries++) {
        const room = normalizeRoom((await get(roomRef(code))).val());
        if (!room) return 'missing';
        if (room.version !== Battle.dataVersion()) return 'version';
        const mine = Battle.seatOf(room, uid);
        if (mine) {
          mySeat.set(code, mine);
          await update(seatRef(code, mine), { name });
          await markOnline(code, mine);
          return 'ok';
        }
        if (room.status !== 'waiting') return 'started';
        const seat = Battle.freeSeat(room);
        if (!seat) return 'full';
        try {
          await set(seatRef(code, seat), freshPlayer(name));
          mySeat.set(code, seat);
          await markOnline(code, seat);
          return 'ok';
        } catch {
          // ほぼ同時に、ほかの人が同じ席にすわった。別の席をさがす
        }
      }
      return 'full';
    },

    // 部屋を見つづける。部屋がなくなったら null。もどり値は、見るのをやめる関数
    watch(code, cb) {
      return onValue(roomRef(code), (snap) => cb(normalizeRoom(snap.val())), () => cb(null));
    },

    // q 問目をとる (ほかの人のほうが早ければとれない)。とれたら true
    async take(code, round, q) {
      const seat = mySeat.get(code);
      if (!seat) return false;
      const result = await runTransaction(
        ref(d, `${ROOT}/${code}/takes/${q}`),
        (current) => (current ? undefined : { seat, round, at: serverTimestamp() }),
        { applyLocally: false },
      ).catch(() => null);
      const take = result?.snapshot.val();
      return Boolean(result?.committed && take && take.seat === seat);
    },

    // q 問目でおてつき
    async fault(code, q) {
      const seat = mySeat.get(code);
      if (seat) await set(ref(d, `${ROOT}/${code}/faults/${q}/${seat}`), true).catch(() => {});
    },

    // ホストだけ: 新しい問題で、カウントダウンから始める
    async start(code) {
      const startAt = serverNow() + Battle.COUNTDOWN_MS;
      await update(roomRef(code), { seed: Battle.makeSeed(), status: 'playing', startAt, q: 0, qAt: startAt, takes: null, faults: null });
    },

    // ホストだけ: 正解を見せたあとで、次の問題へ
    async advance(code, q) {
      await update(roomRef(code), { q, qAt: serverNow() + Battle.REVEAL_MS });
    },

    // ホストだけ: この回はおしまい
    async end(code) {
      await set(ref(d, `${ROOT}/${code}/status`), 'finished');
    },

    // ホストだけ: 同じ部屋の待合室にもどる
    async rematch(code, round) {
      await update(roomRef(code), { round: round + 1, status: 'waiting', seed: '', takes: null, faults: null });
    },

    // ホストだけ: 待合室で、学年・問題の数・分野を変える
    async configure(code, grade, count, cats) {
      await update(roomRef(code), { grade, count, cats });
    },

    // 部屋を出る。ホストが出たら部屋ごとなくなる
    async leave(code) {
      const seat = mySeat.get(code);
      mySeat.delete(code);
      await disconnects.get(code)?.cancel().catch(() => {});
      disconnects.delete(code);
      const room = normalizeRoom((await get(roomRef(code)).catch(() => null))?.val());
      if (!room) return;
      if (room.hostUid === uid) {
        await remove(roomRef(code)).catch(() => {});
      } else if (seat && room.players?.[seat]?.uid === uid) {
        // 待っている間なら席をあける。たいせん中なら、とった問題は順位表に残す
        if (room.status === 'waiting') await remove(seatRef(code, seat)).catch(() => {});
        else await update(seatRef(code, seat), { online: false }).catch(() => {});
      }
    },
  };
}
