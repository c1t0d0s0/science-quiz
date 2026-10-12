import './styles.css';
import { jstDate } from './core/date';
import type { Level } from './core/quiz';
import { renderHome } from './ui/home';
import { renderQuiz } from './ui/quiz';

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
  else renderHome(app);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
// 画面を開いたまま日付が変わっていたら、もどってきたときにホームを新しい日の問題にする
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && shownDate !== jstDate() && !location.hash.startsWith('#/quiz/')) route();
});
route();
