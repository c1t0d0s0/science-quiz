import { dailyQuestions } from '../core/daily';
import { jstDate } from '../core/date';
import { CATEGORIES, CATEGORY_LABEL, LEVELS, type Level } from '../core/quiz';
import { currentStreak, isDone, loadAnswers, pruneOld, score } from '../core/storage';
import { h, hanamaru } from './dom';
import { dateLabel, HOWTO, LEVEL_LABEL, LEVEL_NOTE } from './text';

/** 右の列を出す画面のはば (styles.css の .home と同じ値) */
const WIDE = '(min-width: 64rem)';

/** 方眼ノートのマスに「理」「科」と書いた、タイトルのかざり */
function crest(): HTMLElement {
  const cells = ['', '理', '', '観', '科', '学', '', '察', ''];
  return h(
    'div',
    { class: 'crest', 'aria-hidden': 'true' },
    ...cells.map((ch, i) => (ch ? h('span', { class: i === 4 ? 'crest-cell crest-cross' : 'crest-cell' }, ch) : h('span'))),
  );
}

function levelCard(level: Level, today: string): HTMLElement {
  const questions = dailyQuestions(today, level);
  const answers = loadAnswers(today, level, questions);
  const done = isDone(today, level) && answers.length >= questions.length;
  const correct = score(questions, answers);
  const status = done
    ? `${questions.length}問中 ${correct}問 正解`
    : answers.length > 0
      ? `${answers.length}問目まで答えました`
      : `全部で${questions.length}問`;
  const action = done ? '見直す' : answers.length > 0 ? 'つづきから' : 'はじめる';
  return h(
    'section',
    { class: `daily level-${level}`, 'aria-labelledby': `level-${level}` },
    h(
      'div',
      { class: 'daily-text' },
      h('h2', { id: `level-${level}`, class: 'daily-level' }, LEVEL_LABEL[level]),
      h('p', { class: 'daily-note' }, LEVEL_NOTE[level]),
      h('p', { class: done ? 'daily-status daily-status-done' : 'daily-status' }, status),
    ),
    done && correct === questions.length ? hanamaru('hanamaru hanamaru-daily') : null,
    h('a', { class: 'btn btn-primary', href: `#/quiz/${level}` }, action),
  );
}

export function renderHome(root: HTMLElement): void {
  const today = jstDate();
  pruneOld(today);
  const streak = currentStreak(today);

  root.replaceChildren(
    h(
      'main',
      { class: 'home' },
      h(
        'div',
        { class: 'home-main' },
        h(
          'header',
          { class: 'hero' },
          crest(),
          h(
            'div',
            { class: 'hero-text' },
            h('h1', { class: 'brand' }, 'まいにち理科ノート'),
            h('p', { class: 'lead' }, '中学受験に出るような理科の問題を、毎日10問。'),
          ),
        ),
        h(
          'section',
          { class: 'today', 'aria-labelledby': 'today-title' },
          h('h2', { id: 'today-title' }, '今日の10問'),
          h('p', { class: 'daily-date' }, dateLabel(today)),
          h('p', { class: 'section-note' }, streak > 1 ? `${streak}日つづけて、とき終えています。その調子！` : '自分の学年をえらぼう。ほかの学年にちょうせんしてもOK。'),
        ),
        h('div', { class: 'levels' }, ...LEVELS.map((level) => levelCard(level, today))),
      ),
      h(
        'aside',
        { class: 'home-side' },
        h(
          'section',
          { class: 'fields', 'aria-labelledby': 'fields-title' },
          h('h2', { id: 'fields-title' }, '出題される分野'),
          h('ul', { class: 'chips' }, ...CATEGORIES.map((c) => h('li', { class: 'chip' }, CATEGORY_LABEL[c]))),
        ),
        h(
          'details',
          // 広い画面では場所があるので、はじめから開いておく
          { class: 'howto', open: matchMedia(WIDE).matches },
          h('summary', {}, 'あそびかた'),
          h('ul', {}, ...HOWTO.map((item) => h('li', {}, item))),
        ),
      ),
    ),
  );
}
