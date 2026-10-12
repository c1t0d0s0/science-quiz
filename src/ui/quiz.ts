import { dailyQuestions } from '../core/daily';
import { CATEGORY_LABEL, type Level, type Question } from '../core/quiz';
import { loadAnswers, saveAnswers } from '../core/storage';
import { figure, h, homeButton, mark, paragraphs, withRuby } from './dom';
import { renderResult } from './result';
import { LEVEL_LABEL } from './text';

/** 10 問のうち、どこまで進んだか。答えた問題には、まるかばつをつける */
function progress(questions: Question[], answers: number[], now: number): HTMLElement {
  return h(
    'ol',
    { class: 'steps', 'aria-label': `${questions.length}問中 ${now + 1}問目` },
    ...questions.map((q, i) =>
      i < answers.length
        ? h('li', { class: i === now ? 'step step-done step-now' : 'step step-done' }, mark(answers[i] === q.answer, 'mark mark-step'))
        : h('li', { class: i === now ? 'step step-now' : 'step' }, String(i + 1)),
    ),
  );
}

/**
 * 今日の 10 問をとく画面。もどり値は、画面をはなれるときのあとしまつ。
 * とき終えている日は、結果の画面を出す。
 */
export function renderQuiz(root: HTMLElement, level: Level, today: string): () => void {
  const questions = dailyQuestions(today, level);
  const answers = loadAnswers(today, level, questions);
  let onKey: ((e: KeyboardEvent) => void) | null = null;

  const show = (): void => {
    if (answers.length >= questions.length) {
      renderResult(root, level, questions, answers, false);
      return;
    }
    const index = answers.length;
    const q = questions[index];
    let answered = false;

    const feedback = h('div', { class: 'feedback', 'aria-live': 'polite' });
    const buttons = q.choices.map((c, i) => {
      const btn = h('button', { type: 'button', class: 'choice', onclick: () => answer(i) }, h('span', { class: 'choice-num', 'aria-hidden': 'true' }, String(i + 1)));
      btn.append(withRuby('span', 'choice-text', c));
      return btn;
    });

    const answer = (chosen: number): void => {
      if (answered) return;
      answered = true;
      const ok = chosen === q.answer;
      answers.push(chosen);
      saveAnswers(today, level, questions, answers);

      buttons.forEach((btn, i) => {
        btn.disabled = true;
        if (i === q.answer) btn.classList.add('choice-correct');
        if (i === chosen && !ok) btn.classList.add('choice-wrong');
      });
      buttons[q.answer].append(mark(true, 'mark mark-choice'));
      if (!ok) buttons[chosen].append(mark(false, 'mark mark-choice'));

      const last = answers.length >= questions.length;
      const next = h(
        'button',
        {
          type: 'button',
          class: 'btn btn-primary btn-next',
          onclick: () => {
            if (last) renderResult(root, level, questions, answers, true);
            else show();
            window.scrollTo(0, 0);
          },
        },
        last ? '結果を見る' : 'つぎの問題へ',
      );
      feedback.className = ok ? 'feedback feedback-ok' : 'feedback feedback-ng';
      feedback.replaceChildren(
        h('p', { class: 'feedback-title' }, ok ? '正解！' : 'ざんねん…'),
        ...(ok ? [] : [h('p', { class: 'feedback-answer' }, '正解は ', withRuby('b', '', q.choices[q.answer]))]),
        paragraphs('explain', q.explanation),
        h('div', { class: 'feedback-actions' }, next),
      );
      steps.replaceWith((steps = progress(questions, answers, index)));
      next.focus({ preventScroll: true });
      feedback.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    };

    // キーボードの 1〜4 でも答えられるようにする
    onKey = (e) => {
      const n = Number(e.key);
      if (!answered && n >= 1 && n <= q.choices.length && !e.metaKey && !e.ctrlKey && !e.altKey) answer(n - 1);
    };

    let steps = progress(questions, answers, index);
    root.replaceChildren(
      h(
        'main',
        { class: 'quiz' },
        h('div', { class: 'bar' }, homeButton(), h('h1', {}, '今日の10問'), h('span', { class: 'bar-meta' }, LEVEL_LABEL[level])),
        steps,
        h(
          'article',
          { class: 'card' },
          h(
            'header',
            { class: 'card-head' },
            h('span', { class: 'q-num' }, `${index + 1}問目`),
            h('span', { class: 'chip' }, CATEGORY_LABEL[q.category]),
          ),
          paragraphs('q-text', q.text),
          q.svg ? figure(q.svg) : null,
          h('div', { class: q.choices.some((c) => c.length > 14) ? 'choices choices-long' : 'choices' }, ...buttons),
          feedback,
        ),
      ),
    );
  };

  const keyHandler = (e: KeyboardEvent) => onKey?.(e);
  document.addEventListener('keydown', keyHandler);
  show();
  return () => document.removeEventListener('keydown', keyHandler);
}
