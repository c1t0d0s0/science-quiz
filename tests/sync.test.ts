import { beforeEach, describe, expect, it } from 'vitest';
import { Sync, type AuthPort, type Remote, type SyncHooks } from '../src/cloud/sync';
import { dailyQuestions } from '../src/core/daily';
import { addDays, jstDate } from '../src/core/date';
import { mergeProgress, mergeSnapshots } from '../src/core/merge';
import { emptySnapshot, fromAppDoc, fromProgressDoc, toAppDoc, toProgressDoc, type Progress, type Snapshot } from '../src/core/snapshot';
import { CARDS } from '../src/data/cards';
import {
  balance,
  buyCard,
  currentStreak,
  currentUid,
  exportSnapshot,
  getCards,
  getStamps,
  importSnapshot,
  isDone,
  loadAnswers,
  onStorageChange,
  progressId,
  rememberedUid,
  saveAnswers,
  useStore,
} from '../src/core/storage';

// ---- 代用品 ----

/** 端末ごとの localStorage。current を入れかえると、別の端末になる */
let current = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => current.get(k) ?? null,
    setItem: (k: string, v: string) => void current.set(k, v),
    removeItem: (k: string) => void current.delete(k),
    key: (i: number) => [...current.keys()][i] ?? null,
    get length() {
      return current.size;
    },
  },
});

/** メモリ上の Firestore。fail を true にすると、通信できない状態になる */
class FakeCloud implements Remote {
  data = new Map<string, Snapshot>();
  fail = false;
  writes = 0;
  private check() {
    if (this.fail) throw new Error('offline');
  }
  private copy<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
  }
  async loadAll(uid: string) {
    this.check();
    const s = this.data.get(uid);
    return s ? this.copy(s) : null;
  }
  async loadSummary(uid: string) {
    this.check();
    const s = this.data.get(uid);
    return s ? { ...this.copy(s), progress: {} } : null;
  }
  async saveSummary(uid: string, snapshot: Snapshot) {
    this.check();
    this.writes++;
    const old = this.data.get(uid);
    this.data.set(uid, { ...this.copy(snapshot), progress: old?.progress ?? {} });
  }
  async saveProgress(uid: string, id: string, progress: Progress) {
    this.check();
    this.writes++;
    const s = this.data.get(uid) ?? emptySnapshot();
    s.progress[id] = this.copy(progress);
    this.data.set(uid, s);
  }
  async deleteProgress(uid: string, id: string) {
    this.check();
    this.writes++;
    delete this.data.get(uid)?.progress[id];
  }
}

class FakeAuth implements AuthPort {
  private cb: (uid: string | null) => void = () => {};
  nextUid = 'alice';
  onUser(cb: (uid: string | null) => void) {
    this.cb = cb;
  }
  /** ページを開いたときに、ログインの状態が分かる */
  resolve(uid: string | null) {
    this.cb(uid);
  }
  async signIn() {
    this.cb(this.nextUid);
  }
  async signOut() {
    this.cb(null);
  }
}

interface Device {
  storage: Map<string, string>;
  auth: FakeAuth;
  sync: Sync;
  asked: number;
  dataChanged: number;
  answer: boolean;
}

function makeDevice(cloud: FakeCloud): Device {
  const d = { storage: new Map<string, string>(), auth: new FakeAuth(), asked: 0, dataChanged: 0, answer: true } as Device;
  const hooks: SyncHooks = {
    onStatus: () => {},
    onData: () => void d.dataChanged++,
    askMigrate: () => {
      d.asked++;
      return d.answer;
    },
  };
  d.sync = new Sync(cloud, d.auth, hooks, { debounceMs: 60_000, retryMs: 60_000 });
  return d;
}

/** その端末を手に取る (localStorage と、記録の場所と、書きかえの知らせ先を切りかえる) */
function use(d: Device): void {
  current = d.storage;
  useStore(d.sync.uid);
  d.sync.attach();
}

const today = jstDate();
const questions = dailyQuestions(today, 'g3');
const allCorrect = questions.map((q) => q.answer);
const id = progressId(today, 'g3');

/** ログインして、最初の取りこみが終わるまで待つ */
async function signIn(d: Device): Promise<void> {
  use(d);
  d.sync.start();
  await d.sync.signIn();
  await d.sync.flush();
  use(d);
}

beforeEach(() => {
  current = new Map();
  useStore(null);
  onStorageChange(null);
});

describe('記録を合わせる', () => {
  const a: Snapshot = { done: { 'g3:2026-10-10': 7, 'g4:2026-10-11': 9 }, cards: [{ id: 's01', paid: 40 }, { id: 's03', paid: 300 }], progress: { x: { sig: 's', answers: [0, 1], at: 5 } } };
  const b: Snapshot = { done: { 'g3:2026-10-10': 8, 'g5:2026-10-12': 10 }, cards: [{ id: 's02', paid: 80 }, { id: 's03', paid: 250 }], progress: { x: { sig: 's', answers: [0, 1, 2], at: 3 }, y: { sig: 't', answers: [], at: 1 } } };

  it('入れかえても、くり返しても、同じ結果になる', () => {
    const ab = mergeSnapshots(a, b);
    expect(mergeSnapshots(b, a)).toEqual(ab);
    expect(mergeSnapshots(ab, a)).toEqual(ab);
    expect(mergeSnapshots(ab, ab)).toEqual(ab);
  });

  it('とき終えた記録は両方を合わせ、同じ日は正解数の多いほう。途中経過は先まで答えたほう', () => {
    const ab = mergeSnapshots(a, b);
    expect(ab.done).toEqual({ 'g3:2026-10-10': 8, 'g4:2026-10-11': 9, 'g5:2026-10-12': 10 });
    expect(ab.progress.x.answers).toEqual([0, 1, 2]);
    expect(ab.progress.x.at).toBe(5);
    // カードは両方を合わせ、同じカードは払った額の小さいほう
    expect(ab.cards).toEqual([{ id: 's01', paid: 40 }, { id: 's02', paid: 80 }, { id: 's03', paid: 250 }]);
  });

  it('問題が作り直されていたら、あとから保存した途中経過を使う', () => {
    const older: Progress = { sig: 'old', answers: [0, 1, 2, 3], at: 1 };
    const newer: Progress = { sig: 'new', answers: [1], at: 2 };
    expect(mergeProgress(older, newer)).toEqual(newer);
    expect(mergeProgress(newer, older)).toEqual(newer);
  });

  it('Firestore の形にして、もどしても変わらない', () => {
    const doc = toAppDoc(a, 123);
    expect(doc.activeDays).toEqual(['2026-10-10', '2026-10-11']);
    expect(doc.completed).toEqual(['g3:2026-10-10', 'g4:2026-10-11']);
    expect(fromAppDoc(doc).done).toEqual(a.done);
    expect(doc.inventory).toEqual({ s01: { paid: 40 }, s03: { paid: 300 } });
    expect(fromAppDoc(doc).cards).toEqual(a.cards);
    expect(fromProgressDoc(toProgressDoc(a.progress.x, 0))).toEqual(a.progress.x);
    // 形のくずれたものは受けつけない
    expect(fromAppDoc({ settings: { scores: { bad: 3, 'g3:2026-10-10': 'x', 'g4:2026-10-11': 5 } } }).done).toEqual({ 'g4:2026-10-11': 5 });
    expect(fromProgressDoc({ data: { sig: 1 } })).toBeNull();
  });
});

describe('手元の記録の出し入れ', () => {
  it('取り出して入れ直しても、同じ記録になる', () => {
    saveAnswers(today, 'g3', questions, allCorrect);
    saveAnswers(today, 'g5', dailyQuestions(today, 'g5'), [0, 1]);
    const s = exportSnapshot();
    expect(s.done).toEqual({ [`g3:${today}`]: 10 });
    expect(Object.keys(s.progress).sort()).toEqual([id, progressId(today, 'g5')].sort());
    current = new Map();
    importSnapshot(s);
    expect(exportSnapshot()).toEqual(s);
    expect(isDone(today, 'g3')).toBe(true);
    expect(loadAnswers(today, 'g3', questions)).toEqual(allCorrect);
  });
});

describe('ログインと同期', () => {
  it('ログインしなければ、Firestore には何も送らない', async () => {
    const cloud = new FakeCloud();
    const d = makeDevice(cloud);
    use(d);
    d.sync.start();
    d.auth.resolve(null);
    await d.sync.flush();
    saveAnswers(today, 'g3', questions, allCorrect);
    await d.sync.flush();
    expect(d.sync.status).toBe('signed-out');
    expect(cloud.writes).toBe(0);
    expect(isDone(today, 'g3')).toBe(true);
  });

  it('ログインしたとき、端末の記録をアカウントにうつせる', async () => {
    const cloud = new FakeCloud();
    const d = makeDevice(cloud);
    use(d);
    saveAnswers(today, 'g3', questions, allCorrect);
    await signIn(d);
    expect(d.asked).toBe(1);
    expect(currentUid()).toBe('alice');
    expect(rememberedUid()).toBe('alice');
    expect(d.sync.status).toBe('synced');
    expect(cloud.data.get('alice')?.done).toEqual({ [`g3:${today}`]: 10 });
    expect(cloud.data.get('alice')?.progress[id].answers).toEqual(allCorrect);
    expect(isDone(today, 'g3')).toBe(true);
    // うつした記録は、ログインなしの場所からは消える (二重にうつらないように)
    useStore(null);
    expect(exportSnapshot()).toEqual(emptySnapshot());
  });

  it('うつさないとえらんだら、端末の記録はそのままで、アカウントには入らない', async () => {
    const cloud = new FakeCloud();
    const d = makeDevice(cloud);
    d.answer = false;
    use(d);
    saveAnswers(today, 'g3', questions, allCorrect);
    await signIn(d);
    expect(isDone(today, 'g3')).toBe(false);
    expect(cloud.data.get('alice')?.done ?? {}).toEqual({});
    await d.sync.signOut();
    use(d);
    expect(isDone(today, 'g3')).toBe(true);
  });

  it('別の端末でログインすると、同じ記録でつづけられる', async () => {
    const cloud = new FakeCloud();
    const a = makeDevice(cloud);
    await signIn(a);
    saveAnswers(today, 'g3', questions, allCorrect.slice(0, 4));
    await a.sync.flush();

    const b = makeDevice(cloud);
    await signIn(b);
    expect(b.asked).toBe(0);
    expect(loadAnswers(today, 'g3', questions)).toEqual(allCorrect.slice(0, 4));
    expect(b.dataChanged).toBeGreaterThan(0);
    // 別の端末でつづきをとき終える
    saveAnswers(today, 'g3', questions, allCorrect);
    await b.sync.flush();
    expect(cloud.data.get('alice')?.done).toEqual({ [`g3:${today}`]: 10 });
    expect(currentStreak(today)).toBe(1);
  });

  it('2 台で別々にといた記録は、どちらも残る', async () => {
    const cloud = new FakeCloud();
    cloud.data.set('alice', { done: { [`g4:${addDays(today, -1)}`]: 6 }, cards: [], progress: {} });
    const a = makeDevice(cloud);
    await signIn(a);
    saveAnswers(today, 'g3', questions, allCorrect);
    await a.sync.flush();
    expect(cloud.data.get('alice')?.done).toEqual({ [`g4:${addDays(today, -1)}`]: 6, [`g3:${today}`]: 10 });
    expect(currentStreak(today)).toBe(2);
  });

  it('送れなかった変更は、つながったときに送る', async () => {
    const cloud = new FakeCloud();
    const d = makeDevice(cloud);
    await signIn(d);
    cloud.fail = true;
    saveAnswers(today, 'g3', questions, allCorrect);
    await d.sync.flush();
    expect(d.sync.status).toBe('offline');
    expect(d.sync.hasPending()).toBe(true);
    expect(await d.sync.signOut()).toBe('unsynced');
    cloud.fail = false;
    await d.sync.flush();
    expect(d.sync.status).toBe('synced');
    expect(cloud.data.get('alice')?.done).toEqual({ [`g3:${today}`]: 10 });
  });

  it('ログアウトすると、その人の写しは端末から消え、ログインなしの記録にもどる', async () => {
    const cloud = new FakeCloud();
    const d = makeDevice(cloud);
    await signIn(d);
    saveAnswers(today, 'g3', questions, allCorrect);
    expect(await d.sync.signOut()).toBe('ok');
    use(d);
    expect(currentUid()).toBeNull();
    expect(rememberedUid()).toBeNull();
    expect(isDone(today, 'g3')).toBe(false);
    expect([...d.storage.keys()].filter((k) => k.includes(':u:'))).toEqual([]);
    // アカウントの記録は Firestore に残っている
    expect(cloud.data.get('alice')?.done).toEqual({ [`g3:${today}`]: 10 });
  });

  it('交換したカードも、別の端末に引きつがれる', async () => {
    const cloud = new FakeCloud();
    const a = makeDevice(cloud);
    await signIn(a);
    saveAnswers(today, 'g3', questions, allCorrect);
    saveAnswers(today, 'g4', dailyQuestions(today, 'g4'), [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(balance()).toBeGreaterThanOrEqual(50);
    expect(buyCard(CARDS[0])).toBe(true);
    await a.sync.flush();
    expect(cloud.data.get('alice')?.cards).toEqual([{ id: CARDS[0].id, paid: CARDS[0].price }]);

    const b = makeDevice(cloud);
    await signIn(b);
    expect(getCards()).toEqual([{ id: CARDS[0].id, paid: CARDS[0].price }]);
    expect(getStamps()).toEqual([today]);
  });

  it('前の日までの途中経過は、Firestore からも消す', async () => {
    const cloud = new FakeCloud();
    const old = progressId(addDays(today, -1), 'g3');
    cloud.data.set('alice', { done: {}, cards: [], progress: { [old]: { sig: 's', answers: [0], at: 1 } } });
    const d = makeDevice(cloud);
    await signIn(d);
    expect(cloud.data.get('alice')?.progress[old]).toBeUndefined();
    expect(exportSnapshot().progress[old]).toBeUndefined();
  });
});
