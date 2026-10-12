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

  // #/quiz/lower は 3・4 年むけ、#/quiz/upper は 5・6 年むけ
  const match = location.hash.match(/^#\/quiz\/(lower|upper)$/);
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
