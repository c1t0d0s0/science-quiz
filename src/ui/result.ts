import { CATEGORIES, CATEGORY_LABEL, LEVELS, type Level, type Question } from '../core/quiz';
import { balance, score, type FinishReward } from '../core/storage';
import { figure, h, hanamaru, homeButton, mark, paragraphs, withRuby } from './dom';
import { LEVEL_LABEL, resultNote, resultTitle, REWARD } from './text';

/** 見直し用の 1 問分。まちがえた問題は、はじめから開いておく */
function reviewItem(q: Question, chosen: number, index: number): HTMLElement {
  const ok = chosen === q.answer;
  const head = h(
    'summary',
    { class: 'review-head' },
    mark(ok, 'mark mark-small'),
    h('span', { class: 'review-num' }, `${index + 1}問目`),
    h('span', { class: 'chip chip-small' }, CATEGORY_LABEL[q.category]),
    h('span', { class: 'review-result' }, ok ? '正解' : 'まちがい'),
  );
  return h(
    'details',
    { class: ok ? 'review review-ok' : 'review review-ng', open: !ok },
    head,
    h(
      'div',
      { class: 'review-body' },
      paragraphs('q-text', q.text),
      q.svg ? figure(q.svg) : null,
      h(
        'dl',
        { class: 'review-answers' },
        ...(ok ? [] : [h('dt', {}, 'あなたの答え'), withRuby('dd', 'review-yours', q.choices[chosen])]),
        h('dt', {}, '正解'),
        withRuby('dd', 'review-correct', q.choices[q.answer]),
      ),
      paragraphs('explain', q.explanation),
    ),
  );
}

/** 10 問とき終えたあとの画面。得点、分野ごとの正誤、全部の問題の見直し */
export function renderResult(
  root: HTMLElement,
  level: Level,
  questions: Question[],
  answers: number[],
  celebrate: boolean,
  got: { reward: FinishReward | null; month: number } = { reward: null, month: 0 },
): void {
  // とき終えた直後は、もらえたポイントとスタンプを知らせる
  const t = REWARD;
  const reward = got.reward;
  const rewardBox = reward
    ? h(
        'section',
        { class: 'result-stamp', 'aria-label': t.pointsLabel },
        h('p', { class: 'result-reward' }, t.rewardQuiz(reward.points, reward.perfect)),
        reward.stamp.added ? h('p', { class: 'result-stamp-title' }, t.stampDone) : null,
        reward.stamp.weekPoints > 0 ? h('p', { class: 'result-reward' }, t.rewardWeek(reward.stamp.run)) : null,
        reward.stamp.monthPoints > 0 ? h('p', { class: 'result-reward' }, t.rewardMonth(got.month)) : null,
        h('p', { class: 'result-balance' }, `${t.pointsLabel} ${t.points(balance())}`),
        h('div', { class: 'reward-buttons' }, h('a', { class: 'btn', href: '#/stamps' }, t.seeStamps), h('a', { class: 'btn', href: '#/cards' }, t.cardsTitle)),
      )
    : null;

  const correct = score(questions, answers);
  const total = questions.length;
  // 1 つ上の学年 (6 年生むけなら、1 つ下) の問題にもさそう
  const other: Level = LEVELS[LEVELS.indexOf(level) + 1] ?? LEVELS[LEVELS.indexOf(level) - 1];

  // その日に出た分野だけを、いつもの順でならべる
  const byCategory = CATEGORIES.filter((c) => questions.some((q) => q.category === c)).map((c) => {
    const marks = questions.map((q, i) => ({ q, ok: answers[i] === q.answer })).filter((x) => x.q.category === c);
    return h(
      'li',
      { class: 'field-row' },
      h('span', { class: 'field-name' }, CATEGORY_LABEL[c]),
      h('span', { class: 'field-marks' }, ...marks.map((m) => mark(m.ok, 'mark mark-small'))),
      h('span', { class: 'field-score' }, `${marks.filter((m) => m.ok).length} / ${marks.length}`),
    );
  });

  root.replaceChildren(
    h(
      'main',
      { class: celebrate ? 'result-page result-fresh' : 'result-page' },
      h('div', { class: 'bar' }, homeButton(), h('h1', {}, '今日の結果'), h('span', { class: 'bar-meta' }, LEVEL_LABEL[level])),
      h(
        'section',
        { class: 'result-head' },
        correct === total ? hanamaru() : null,
        h(
          'div',
          {},
          h('h2', { class: 'result-title' }, resultTitle(correct, total)),
          h('p', { class: 'result-score' }, `${total}問中 `, h('b', {}, String(correct)), '問 正解'),
          h('p', { class: 'result-sub' }, resultNote(correct, total)),
        ),
      ),
      rewardBox,
      h('section', { class: 'fields-result', 'aria-labelledby': 'by-field' }, h('h2', { id: 'by-field' }, '分野ごとの結果'), h('ul', {}, ...byCategory)),
      h(
        'section',
        { 'aria-labelledby': 'review-title' },
        h('h2', { id: 'review-title' }, '問題の見直し'),
        h('p', { class: 'section-note' }, '問題をおすと、解説を開いたりとじたりできます。'),
        h('div', { class: 'review-list' }, ...questions.map((q, i) => reviewItem(q, answers[i], i))),
      ),
      h(
        'div',
        { class: 'result-actions' },
        h('a', { class: 'btn', href: `#/quiz/${other}` }, `${LEVEL_LABEL[other]}にちょうせん`),
        h('a', { class: 'btn btn-primary', href: '#/' }, 'ホームへ'),
      ),
    ),
  );
}
