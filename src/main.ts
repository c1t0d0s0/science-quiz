import './styles.css';
import { restoreStore, startCloud } from './cloud';
import { jstDate } from './core/date';
import type { Level } from './core/quiz';
import { renderCards } from './ui/cards';
import { renderHome } from './ui/home';
import { renderQuiz } from './ui/quiz';
import { renderStamps } from './ui/stamps';
import { ACCOUNT } from './ui/text';

// 前にログインしていた人がいれば、通信を待たずに、この端末に残っているその人の写しで画面を出す
restoreStore();

const app = document.getElementById('app')!;
let cleanup: (() => void) | null = null;
let shownDate = jstDate();

function route(): void {
  cleanup?.();
  cleanup = null;
  shownDate = jstDate();

  // #/quiz/g3 は 3 年生むけ … #/quiz/g6 は 6 年生むけ
  const match = location.hash.match(/^#\/quiz\/(g[3-6])$/);
  if (match) cleanup = renderQuiz(app, match[1] as Level, shownDate);
  else if (location.hash === '#/cards') renderCards(app);
  else if (location.hash === '#/stamps') renderStamps(app);
  else renderHome(app);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
// 画面を開いたまま日付が変わっていたら、もどってきたときにホームを新しい日の問題にする
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && shownDate !== jstDate() && !location.hash.startsWith('#/quiz/')) route();

// 最初の画面を出してから、ログインと Firestore の準備をする (Firebase の設定がないビルドでは何もしない)
void startCloud({
  // ログインやほぞんの状態が変わった。状態を出しているのはホームだけ
  onStatus: () => {
    if (app.querySelector('.home')) renderHome(app);
  },
  // Firestore から取りこんで、手元の記録が変わった。今の画面をかき直す
  onData: () => route(),
  askMigrate: () => confirm(ACCOUNT.askMigrate),
});
});
route();

// 最初の画面を出してから、ログインと Firestore の準備をする (Firebase の設定がないビルドでは何もしない)
void startCloud({
  // ログインやほぞんの状態が変わった。状態を出しているのはホームだけ
  onStatus: () => {
    if (app.querySelector('.home')) renderHome(app);
  },
  // Firestore から取りこんで、手元の記録が変わった。今の画面をかき直す
  onData: () => route(),
  askMigrate: () => confirm(ACCOUNT.askMigrate),
});
