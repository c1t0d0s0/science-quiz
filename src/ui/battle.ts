// --- 理科たいせん: 画面 ---
// 入口 (なまえ・学年・問題の数・コード) → 待合室 (コード・QR コード・URL) → カウントダウン → 問題 → 結果。
// どの画面も Realtime Database の部屋を見て作る。次の問題へ進めるのはホストだけ。
// 開くときにはじめて読みこみ、Firebase のコードは、部屋を作るか入るときにはじめて読みこむ。
import { battleAvailable } from '../cloud/config';
import type { BattleNet, JoinResult } from '../cloud/battle-net';
import * as Battle from '../core/battle';
import type { Room } from '../core/battle';
import { CATEGORY_LABEL, type Question } from '../core/quiz';
import { learnHref } from '../learn/href';
import { figure, h, hanamaru, homeButton, mark, paragraphs, withRuby } from './dom';
import { LEVEL_LABEL } from './text';

const NAME_KEY = 'science-quiz:battle-name';
const SETTING_KEY = 'science-quiz:battle-setting';
const TICK_MS = 100;

const gradeLabel = (grade: number) => LEVEL_LABEL[Battle.levelOf({ grade })];

export const BATTLE_HOWTO = [
  '2〜8人で、同じ問題に同時にこたえます。いちばん早く正解をえらんだ人が、その問題をとれます。',
  'まちがえると「おてつき」で、その問題はお休み。とった問題が多い人の勝ち。同じ数なら、おてつきが少ない人が上です。',
  '部屋を作った人（ホスト）が、学年と問題の数をえらびます。3年生むけから6年生むけまで、学年のレベルに合わせた問題が出ます。',
  '部屋を作ったら、たいせんコードかQRコードを、ともだちに見せよう。',
];

const JOIN_ERRORS: Record<Exclude<JoinResult, 'ok'>, string> = {
  missing: 'その コードの 部屋は 見つからないよ。',
  started: 'その 部屋は もう はじまっているよ。',
  full: 'その 部屋は いっぱいだよ（8人まで）。',
  version: 'ページを 読みこみ直してから 入ってね（問題が 新しく なっているよ）。',
};

// ---- 今の状態 ----
let root: HTMLElement | null = null;
let net: BattleNet | null = null;
let code: string | null = null;
let room: Room | null = null;
let unwatch: (() => void) | null = null;
let busy = false;
let message = '';
let messageEl: HTMLElement | null = null;
let view: 'entry' | 'lobby' | 'playing' | 'result' = 'entry';
let setting = readSetting();
let qrFor = '';
let qrImg: HTMLImageElement | null = null;

// たいせん中
let game: { key: string; questions: Question[] } | null = null;
let shownQ = -1; // 画面に出している問題
let settledQ = -1; // 正解を見せた、さいごの問題
let advancedQ = -1; // ホスト: 次へ進めた、さいごの問題
let counting = false; // カウントダウンを出している
let locked = false; // この問題では、もうえらべない
const picks = new Map<number, number>(); // この回で自分がえらんだ答え
let tick: ReturnType<typeof setInterval> | undefined;
const g = {
  scores: null as HTMLElement | null,
  card: null as HTMLElement | null,
  timer: null as HTMLElement | null,
  buttons: [] as HTMLButtonElement[],
  feedback: null as HTMLElement | null,
};
let resultKey = '';
let standingsEl: HTMLElement | null = null;

const isHost = () => Boolean(room && net && room.hostUid === net.uid);
const mySeat = () => (net && code ? net.seatIn(code) : null);

function readName(): string {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* この端末には残らない。次もなまえを聞く */
  }
}

function readSetting(): { grade: number; count: number } {
  try {
    const s = JSON.parse(localStorage.getItem(SETTING_KEY) || 'null') as { grade?: number; count?: number } | null;
    const grade = Battle.GRADES.includes(Number(s?.grade)) ? Number(s?.grade) : 3;
    const count = (Battle.COUNTS as readonly number[]).includes(Number(s?.count)) ? Number(s?.count) : 10;
    return { grade, count };
  } catch {
    return { grade: 3, count: 10 };
  }
}

function saveSetting(): void {
  try {
    localStorage.setItem(SETTING_KEY, JSON.stringify(setting));
  } catch {
    /* 無視 */
  }
}

function say(text: string): void {
  message = text;
  if (messageEl) messageEl.textContent = text;
}

function messageBox(): HTMLElement {
  messageEl = h('p', { class: 'battle-msg', 'aria-live': 'polite' }, message);
  return messageEl;
}

const setHash = (hash: string) => history.replaceState(null, '', hash);

function inviteUrl(roomCode: string): string {
  const url = new URL(location.href);
  url.search = '';
  url.hash = `#/battle/${roomCode}`;
  return url.href;
}

/** えらんでいるものに aria-pressed をつける、ボタンのならび */
function segmented(label: string, options: { value: number; text: string }[], current: number, onPick: (v: number) => void): HTMLElement {
  const buttons = options.map((o) =>
    h(
      'button',
      {
        type: 'button',
        class: 'battle-seg',
        'aria-pressed': String(o.value === current),
        onclick: () => {
          buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(options[i].value === o.value)));
          onPick(o.value);
        },
      },
      o.text,
    ),
  );
  return h('div', { class: 'battle-segs', role: 'group', 'aria-label': label }, ...buttons);
}

const gradeOptions = () => Battle.GRADES.map((grade) => ({ value: grade, text: gradeLabel(grade) }));
const countOptions = () => Battle.COUNTS.map((count) => ({ value: count, text: `${count}問` }));

function bar(meta = ''): HTMLElement {
  return h('div', { class: 'bar' }, homeButton(), h('h1', {}, '理科たいせん'), h('span', { class: 'bar-meta' }, meta));
}

async function connect(): Promise<BattleNet> {
  say('つないでいます…');
  const { connectBattle } = await import('../cloud/battle-net');
  net = await connectBattle();
  return net;
}

async function run(job: () => Promise<void>): Promise<void> {
  if (busy) return;
  busy = true;
  try {
    await job();
  } catch (e) {
    console.error('Battle failed', e);
    say('つながりませんでした。時間を おいて、もう一度 ためしてね。');
  } finally {
    busy = false;
  }
}

// ---- 入口 ----
function showEntry(prefill = ''): void {
  if (!root) return;
  view = 'entry';
  stopTick();
  if (!battleAvailable) {
    root.replaceChildren(
      h(
        'main',
        { class: 'result-page battle' },
        bar(),
        h('p', { class: 'battle-msg' }, 'このページでは、たいせんは つかえません。'),
        h('div', { class: 'result-actions' }, h('a', { class: 'btn btn-primary', href: '#/' }, 'ホームへ')),
      ),
    );
    return;
  }
  const nameInput = h('input', {
    type: 'text',
    id: 'battle-name',
    class: 'battle-input',
    maxlength: Battle.NAME_MAX,
    autocomplete: 'nickname',
    enterkeyhint: 'done',
    value: readName(),
    placeholder: `${Battle.NAME_MAX}文字まで`,
  });
  const codeInput = h('input', {
    type: 'text',
    id: 'battle-code',
    class: 'battle-input battle-code-input',
    inputmode: 'numeric',
    autocomplete: 'off',
    maxlength: 7,
    value: prefill,
    placeholder: '12345',
  });

  const takeName = (): string | null => {
    const name = Battle.cleanName(nameInput.value);
    if (!name) {
      say('なまえを 入れてね');
      nameInput.focus();
      return null;
    }
    nameInput.value = name;
    saveName(name);
    return name;
  };

  const create = () => {
    const name = takeName();
    if (!name) return;
    void run(async () => {
      const n = await connect();
      enter(await n.create(setting.grade, setting.count, name));
    });
  };

  const join = () => {
    const name = takeName();
    if (!name) return;
    const roomCode = Battle.parseCode(codeInput.value);
    if (!roomCode) {
      say('コードは 数字5けただよ');
      codeInput.focus();
      return;
    }
    void run(async () => {
      const n = await connect();
      const result = await n.join(roomCode, name);
      if (result === 'ok') enter(roomCode);
      else say(JOIN_ERRORS[result]);
    });
  };

  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') join();
  });

  root.replaceChildren(
    h(
      'main',
      { class: 'result-page battle' },
      bar(),
      h(
        'section',
        { class: 'battle-box' },
        h('label', { class: 'battle-label', for: 'battle-name' }, 'なまえ'),
        nameInput,
        h('p', { class: 'battle-hint' }, 'みんなに 見えるので、本名で なくても いいよ'),
      ),
      h(
        'section',
        { class: 'battle-box', 'aria-labelledby': 'battle-create' },
        h('h2', { id: 'battle-create' }, '部屋を作る'),
        h('p', { class: 'battle-label' }, '学年のレベル'),
        segmented('学年のレベル', gradeOptions(), setting.grade, (v) => {
          setting.grade = v;
          saveSetting();
        }),
        h('p', { class: 'battle-label' }, '問題の数'),
        segmented('問題の数', countOptions(), setting.count, (v) => {
          setting.count = v;
          saveSetting();
        }),
        h('div', { class: 'battle-actions' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: create }, '部屋を作る')),
      ),
      h(
        'section',
        { class: 'battle-box', 'aria-labelledby': 'battle-join' },
        h('h2', { id: 'battle-join' }, '部屋に入る'),
        h('label', { class: 'battle-label', for: 'battle-code' }, 'たいせんコード（数字5けた）'),
        h('div', { class: 'battle-row' }, codeInput, h('button', { type: 'button', class: 'btn btn-primary', onclick: join }, '入る')),
      ),
      messageBox(),
      h('details', { class: 'howto', open: true }, h('summary', {}, 'たいせんの あそびかた'), h('ul', {}, ...BATTLE_HOWTO.map((t) => h('li', {}, t)))),
    ),
  );

  // 招待の URL から来て、なまえも分かっていれば、そのまま入る
  if (prefill && nameInput.value) join();
  else if (prefill) nameInput.focus();
}

function enter(roomCode: string): void {
  code = roomCode;
  room = null;
  game = null;
  resultKey = '';
  say('');
  setHash(`#/battle/${roomCode}`);
  void renderInvite(roomCode);
  unwatch = net!.watch(roomCode, onRoom);
}

/** 部屋を出る (ホストが出ると、部屋ごとなくなる) */
async function leave(): Promise<void> {
  const left = code;
  stop();
  if (left && net) await net.leave(left).catch(() => {});
}

async function leaveRoom(): Promise<void> {
  await leave();
  setHash('#/battle');
  say('');
  showEntry();
}

function stop(): void {
  unwatch?.();
  unwatch = null;
  code = null;
  room = null;
  game = null;
  stopTick();
}

// ---- 待合室 ----
async function renderInvite(roomCode: string): Promise<void> {
  if (qrFor === roomCode) return;
  qrFor = roomCode;
  qrImg = null;
  try {
    const QRCode = (await import('qrcode')).default;
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    const url = await QRCode.toDataURL(inviteUrl(roomCode), {
      margin: 1,
      width: 240,
      color: dark ? { dark: '#eef1e4', light: '#1d2f28' } : { dark: '#1c2a4a', light: '#fdfdfa' },
    });
    if (qrFor !== roomCode) return;
    qrImg = h('img', { class: 'battle-qr', src: url, width: 240, height: 240, alt: 'たいせんに入る QRコード' });
    if (room?.status === 'waiting') renderLobby(room);
  } catch {
    // QR コードがなくても、コードと URL で入れる
  }
}

function renderLobby(r: Room): void {
  if (!root || !code) return;
  view = 'lobby';
  const roomCode = code;
  const seat = mySeat();
  const players = Battle.playersList(r);
  const here = players.filter((p) => p.online).length;
  const host = isHost();
  const url = inviteUrl(roomCode);
  const urlInput = h('input', { type: 'text', class: 'battle-input battle-url', readonly: true, value: url, 'aria-label': '招待の URL' });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      say('URLを コピーしたよ');
    } catch {
      urlInput.select();
    }
  };

  const settingBox = host
    ? h(
        'div',
        { class: 'battle-setting' },
        h('p', { class: 'battle-label' }, '学年のレベル'),
        segmented('学年のレベル', gradeOptions(), r.grade, (v) => {
          setting.grade = v;
          saveSetting();
          void net?.configure(roomCode, v, r.count).catch((e) => console.error(e));
        }),
        h('p', { class: 'battle-label' }, '問題の数'),
        segmented('問題の数', countOptions(), r.count, (v) => {
          setting.count = v;
          saveSetting();
          void net?.configure(roomCode, r.grade, v).catch((e) => console.error(e));
        }),
      )
    : h('p', { class: 'battle-setting-text' }, `${gradeLabel(r.grade)}・${r.count}問`);

  const startButton = h(
    'button',
    {
      type: 'button',
      class: 'btn btn-primary btn-next',
      disabled: here < 2,
      onclick: () => {
        if (!net || !code) return;
        startButton.disabled = true;
        net.start(code).catch((e) => {
          console.error(e);
          startButton.disabled = false;
        });
      },
    },
    'スタート！',
  );

  if (host) say(here < 2 ? 'ともだちが 入るのを まってね。コードか QRコードを 見せよう！' : 'みんな そろったら スタート！');
  else say('ホストが スタートするのを まってね');

  root.replaceChildren(
    h(
      'main',
      { class: 'result-page battle' },
      bar(`${gradeLabel(r.grade)}・${r.count}問`),
      h(
        'section',
        { class: 'battle-box battle-invite' },
        h('p', { class: 'battle-label' }, 'たいせんコード'),
        h('p', { class: 'battle-code' }, roomCode),
        qrImg,
        h('div', { class: 'battle-row' }, urlInput, h('button', { type: 'button', class: 'btn', onclick: () => void copy() }, 'コピー')),
      ),
      h('section', { class: 'battle-box' }, h('h2', {}, '問題'), settingBox),
      h(
        'section',
        { class: 'battle-box' },
        h('h2', {}, `入っている人（${here}人）`),
        h(
          'ul',
          { class: 'battle-players' },
          ...players.map((p) =>
            h(
              'li',
              { class: `battle-player${p.online ? '' : ' is-away'}${p.seat === seat ? ' is-me' : ''}` },
              h('span', { class: 'battle-player-name' }, p.name),
              p.uid === r.hostUid ? h('span', { class: 'chip chip-small' }, 'ホスト') : null,
              p.seat === seat ? h('span', { class: 'chip chip-small chip-today' }, 'あなた') : null,
              p.online ? null : h('span', { class: 'battle-away' }, 'いない'),
            ),
          ),
        ),
      ),
      messageBox(),
      h(
        'div',
        { class: 'result-actions' },
        h('button', { type: 'button', class: 'btn', onclick: () => void leaveRoom() }, '部屋を出る'),
        host ? startButton : null,
      ),
    ),
  );
}

// ---- 部屋を見る ----
function onRoom(next: Room | null): void {
  if (!code || !root) return;
  if (!next) {
    stop();
    setHash('#/battle');
    showEntry();
    say('部屋が なくなりました（ホストが 出たよ）');
    return;
  }
  room = next;
  if (room.status === 'playing') {
    startGame(room);
    renderScores(room);
    step();
    return;
  }
  stopTick();
  if (room.status === 'waiting') renderLobby(room);
  else renderResult(room);
}

function startGame(r: Room): void {
  const key = `${r.round}:${r.seed}`;
  if (game && game.key === key && view === 'playing') return;
  game = { key, questions: Battle.makeGame(r) };
  shownQ = -1;
  settledQ = -1;
  advancedQ = -1;
  counting = false;
  locked = false;
  picks.clear();
  view = 'playing';
  g.scores = h('ol', { class: 'battle-scores', 'aria-label': 'とった問題の数' });
  g.card = h('article', { class: 'card battle-card' });
  g.timer = h('span', { class: 'battle-timer', 'aria-label': 'のこり時間' });
  const quit = h(
    'button',
    {
      type: 'button',
      class: 'back home-btn',
      onclick: () => {
        if (confirm('たいせんを ぬけますか？')) location.hash = '#/';
      },
    },
    h('span', { 'aria-hidden': 'true' }, '‹'),
    'ぬける',
  );
  root!.replaceChildren(
    h(
      'main',
      { class: 'quiz battle' },
      h('div', { class: 'bar' }, quit, h('h1', {}, '理科たいせん'), h('span', { class: 'bar-meta' }, `${gradeLabel(r.grade)}・${game.questions.length}問`)),
      g.scores,
      g.card,
    ),
  );
  stopTick();
  tick = setInterval(step, TICK_MS);
}

function stopTick(): void {
  clearInterval(tick);
  tick = undefined;
}

function renderScores(r: Room): void {
  if (!g.scores) return;
  const seat = mySeat();
  g.scores.replaceChildren(
    ...Battle.standings(r).map((row) =>
      h(
        'li',
        { class: `battle-score${row.seat === seat ? ' is-me' : ''}${row.online ? '' : ' is-away'}` },
        h('span', { class: 'battle-score-name' }, row.name),
        h('b', { class: 'battle-score-num' }, String(row.points)),
      ),
    ),
  );
}

/** TICK_MS ごとと、部屋が変わるたびに動く */
function step(): void {
  if (!room || room.status !== 'playing' || !game || !net || !code || !g.card) return;
  const now = net.serverNow();
  const startAt = room.startAt ?? 0;
  if (now < startAt) {
    const left = String(Math.ceil((startAt - now) / 1000));
    if (!counting) {
      counting = true;
      g.card.replaceChildren(
        h('p', { class: 'battle-count', 'aria-live': 'polite' }, left),
        h('p', { class: 'battle-count-note' }, 'まもなく スタート！ 早く 正解した人が、その問題を とれるよ'),
      );
    }
    const el = g.card.querySelector('.battle-count');
    if (el && el.textContent !== left) el.textContent = left;
    return;
  }
  const q = room.q ?? 0;
  // 前の問題の正解を見せ終わるまで、次の問題は出さない
  if (now < (room.qAt ?? 0)) return;
  const item = game.questions[q];
  if (!item) return;
  if (shownQ !== q) showQuestion(room, q);

  const level = Battle.levelOf(room);
  const qAt = room.qAt ?? 0;
  const limit = Battle.timeLimit(level, item) * 1000;
  if (settledQ !== q) {
    const left = Math.max(0, Math.ceil((qAt + limit - now) / 1000));
    if (g.timer) {
      const text = String(left);
      if (g.timer.textContent !== text) g.timer.textContent = text;
      g.timer.classList.toggle('is-low', left <= 5);
    }
    if (Battle.settled(room, q) || now >= qAt + limit) reveal(room, q);
  }
  if (isHost() && settledQ === q && advancedQ !== q) {
    advancedQ = q;
    const roomCode = code;
    if (q + 1 < game.questions.length) net.advance(roomCode, q + 1).catch((e) => console.error(e));
    else
      setTimeout(() => {
        if (code === roomCode && net) net.end(roomCode).catch((e) => console.error(e));
      }, Battle.REVEAL_MS);
  }
}

function showQuestion(r: Room, q: number): void {
  const card = g.card;
  const timer = g.timer;
  if (!game || !card || !timer) return;
  const item = game.questions[q];
  shownQ = q;
  counting = false;
  locked = false;
  g.buttons = item.choices.map((c, i) => {
    const btn = h('button', { type: 'button', class: 'choice', onclick: () => pick(i) }, h('span', { class: 'choice-num', 'aria-hidden': 'true' }, String(i + 1)));
    btn.append(withRuby('span', 'choice-text', c));
    return btn;
  });
  const box = h('div', { class: 'feedback', 'aria-live': 'polite' });
  g.feedback = box;
  timer.textContent = '';
  timer.classList.remove('is-low');
  card.replaceChildren(
    h(
      'header',
      { class: 'card-head' },
      h('span', { class: 'q-num' }, `${q + 1}問目`),
      h('span', { class: 'battle-of' }, `/ ${game.questions.length}問`),
      h('span', { class: 'chip' }, CATEGORY_LABEL[item.category]),
      timer,
    ),
    paragraphs('q-text', item.text),
    ...(item.svg ? [figure(item.svg)] : []),
    h('div', { class: item.choices.some((c) => c.length > 14) ? 'choices choices-long' : 'choices' }, ...g.buttons),
    box,
  );
  window.scrollTo(0, 0);
  // 読みこみ直したとき: おてつきした問題は、お休みのまま
  if (Battle.faulted(r, q, mySeat())) {
    locked = true;
    g.buttons.forEach((b) => (b.disabled = true));
    feedback('おてつき！ この問題は お休み', 'feedback feedback-ng');
  }
}

function feedback(title: string, cls: string): void {
  if (!g.feedback) return;
  g.feedback.className = cls;
  g.feedback.replaceChildren(h('p', { class: 'feedback-title' }, title));
}

function pick(index: number): void {
  if (locked || !room || !net || !code || !game || shownQ !== room.q || settledQ === shownQ) return;
  const q = shownQ;
  const item = game.questions[q];
  locked = true;
  picks.set(q, index);
  g.buttons.forEach((b) => (b.disabled = true));
  if (index === item.answer) {
    g.buttons[index].classList.add('choice-picked');
    feedback('せいかい！ とれたかな…', 'feedback');
    net.take(code, room.round, q).catch((e) => console.error(e));
    return;
  }
  g.buttons[index].classList.add('choice-wrong');
  g.buttons[index].append(mark(false, 'mark mark-choice'));
  feedback('おてつき！ この問題は お休み', 'feedback feedback-ng');
  void net.fault(code, q);
}

function reveal(r: Room, q: number): void {
  if (!game || !g.feedback) return;
  settledQ = q;
  locked = true;
  const item = game.questions[q];
  g.buttons.forEach((b) => (b.disabled = true));
  g.buttons[item.answer].classList.remove('choice-picked');
  g.buttons[item.answer].classList.add('choice-correct');
  g.buttons[item.answer].append(mark(true, 'mark mark-choice'));
  const take = Battle.takeOf(r, q);
  const mine = Boolean(take && take.seat === mySeat());
  const taker = take && r.players[take.seat];
  const title = mine ? 'とった！' : taker ? `${taker.name}さんが とった！` : 'だれも とれなかった…';
  g.feedback.className = mine ? 'feedback feedback-ok' : 'feedback feedback-ng';
  g.feedback.replaceChildren(
    h('p', { class: 'feedback-title' }, title),
    h('p', { class: 'feedback-answer' }, '正解は ', withRuby('b', '', item.choices[item.answer])),
    paragraphs('explain', item.explanation),
  );
  if (g.timer) {
    g.timer.textContent = '';
    g.timer.classList.remove('is-low');
  }
  g.feedback.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function onKey(e: KeyboardEvent): void {
  if (view !== 'playing' || e.metaKey || e.ctrlKey || e.altKey) return;
  const n = Number(e.key);
  if (n >= 1 && n <= g.buttons.length) pick(n - 1);
}

// ---- 結果 ----
function standingsList(r: Room): HTMLElement {
  const seat = mySeat();
  return h(
    'ol',
    { class: 'battle-standings' },
    ...Battle.standings(r).map((row) =>
      h(
        'li',
        { class: `battle-standing${row.seat === seat ? ' is-me' : ''}${row.online ? '' : ' is-away'}${row.rank === 1 ? ' is-top' : ''}` },
        h('span', { class: 'battle-rank' }, row.rank ? `${row.rank}位` : '—'),
        h('span', { class: 'battle-standing-name' }, row.name, row.seat === seat ? h('span', { class: 'sr-only' }, '（あなた）') : null),
        h('span', { class: 'battle-standing-num' }, h('b', {}, String(row.points)), '問'),
        h('span', { class: 'battle-standing-faults' }, `おてつき ${row.faults}`),
      ),
    ),
  );
}

function reviewItem(r: Room, q: Question, index: number): HTMLElement {
  const take = Battle.takeOf(r, index);
  const seat = mySeat();
  const mine = Boolean(take && take.seat === seat);
  const taker = take && r.players[take.seat];
  const chosen = picks.get(index);
  const wrong = chosen !== undefined && chosen !== q.answer;
  return h(
    'details',
    { class: mine ? 'review review-ok' : 'review review-ng', open: wrong },
    h(
      'summary',
      { class: 'review-head' },
      take ? mark(mine, 'mark mark-small') : null,
      h('span', { class: 'review-num' }, `${index + 1}問目`),
      h('span', { class: 'chip chip-small' }, CATEGORY_LABEL[q.category]),
      h('span', { class: 'review-result' }, mine ? 'とった' : taker ? `${taker.name}さん` : 'だれも とれなかった'),
    ),
    h(
      'div',
      { class: 'review-body' },
      paragraphs('q-text', q.text),
      q.svg ? figure(q.svg) : null,
      h(
        'dl',
        { class: 'review-answers' },
        ...(wrong ? [h('dt', {}, 'あなたの答え'), withRuby('dd', 'review-yours', q.choices[chosen])] : []),
        h('dt', {}, '正解'),
        withRuby('dd', 'review-correct', q.choices[q.answer]),
      ),
      paragraphs('explain', q.explanation),
      q.learn ? h('p', { class: 'learn-more' }, h('a', { href: learnHref(q.learn), target: '_blank', rel: 'noopener' }, '図でしくみを見る ›')) : null,
    ),
  );
}

function renderResult(r: Room): void {
  if (!root || !code) return;
  const key = `${code}:${r.round}:${r.seed}`;
  // 同じ回の結果を出しているなら、順位表だけをかき直す (開いた解説はそのまま)
  if (view === 'result' && resultKey === key && standingsEl) {
    const next = standingsList(r);
    standingsEl.replaceWith(next);
    standingsEl = next;
    return;
  }
  view = 'result';
  resultKey = key;
  const questions = game && game.key === `${r.round}:${r.seed}` ? game.questions : r.seed ? Battle.makeGame(r) : [];
  const rows = Battle.standings(r);
  const me = rows.find((row) => row.seat === mySeat());
  const title = !me ? 'たいせん おわり！' : me.rank === 1 ? 'ゆうしょう！ おめでとう！' : me.points > 0 ? `${me.rank}位！ よく がんばったね` : 'おつかれさま！ 次は とれるかな';
  standingsEl = standingsList(r);
  const host = isHost();
  say(host ? '' : 'ホストが「もう一度」を おすと、待合室に もどるよ');
  root.replaceChildren(
    h(
      'main',
      { class: 'result-page result-fresh battle' },
      bar(`${gradeLabel(r.grade)}・${questions.length}問`),
      h(
        'section',
        { class: 'result-head' },
        me?.rank === 1 ? hanamaru() : null,
        h(
          'div',
          {},
          h('h2', { class: 'result-title' }, title),
          me ? h('p', { class: 'result-score' }, `${questions.length}問中 `, h('b', {}, String(me.points)), '問 とった') : null,
        ),
      ),
      h('section', { 'aria-labelledby': 'battle-rank-title' }, h('h2', { id: 'battle-rank-title' }, '順位'), standingsEl),
      messageBox(),
      h(
        'div',
        { class: 'result-actions' },
        h('button', { type: 'button', class: 'btn', onclick: () => void leaveRoom() }, '部屋を出る'),
        host
          ? h(
              'button',
              {
                type: 'button',
                class: 'btn btn-primary',
                onclick: (e: Event) => {
                  if (!net || !code || !room) return;
                  (e.currentTarget as HTMLButtonElement).disabled = true;
                  net.rematch(code, room.round).catch((err) => console.error(err));
                },
              },
              'もう一度',
            )
          : null,
      ),
      h(
        'section',
        { 'aria-labelledby': 'battle-review-title' },
        h('h2', { id: 'battle-review-title' }, '問題の見直し'),
        h('p', { class: 'section-note' }, '問題をおすと、解説を開いたりとじたりできます。'),
        h('div', { class: 'review-list' }, ...questions.map((q, i) => reviewItem(r, q, i))),
      ),
    ),
  );
  window.scrollTo(0, 0);
}

/**
 * #/battle (入口) と #/battle/12345 (招待の URL) の画面。もどり値は、画面をはなれるときのあとしまつ (部屋を出る)
 */
export function renderBattle(el: HTMLElement, prefill: string | null): () => void {
  root = el;
  say('');
  showEntry(prefill ?? '');
  document.addEventListener('keydown', onKey);
  return () => {
    document.removeEventListener('keydown', onKey);
    root = null;
    messageEl = null;
    void leave();
  };
}
