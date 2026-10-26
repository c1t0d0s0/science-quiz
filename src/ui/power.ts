import { rngFromString } from '../core/rng';
import { plantFig } from '../diagrams/power';
import { PLANTS, plantById, type Plant } from '../power/plants';
import { choice } from '../questions/helpers';
import { h, homeButton, mark, paragraphs, withRuby } from './dom';
import { shibaFace } from './shiba';

const TITLE = '発電所のしくみ';

/** 解説へのリンク (step は 0 から) */
export const powerHref = (id: string, step = 0) => (step > 0 ? `#/power/${id}/${step + 1}` : `#/power/${id}`);

/** ハカセ (柴犬) の顔 */
function hakase(): HTMLElement {
  const el = h('div', { class: 'hakase', 'aria-hidden': 'true' });
  el.innerHTML = `<svg viewBox="0 -6 120 116">${shibaFace({ items: ['doctor', 'glasses'] })}</svg>`;
  return el;
}

function figureOf(plant: Plant): HTMLElement {
  const el = h('div', { class: 'figure power-figure' });
  el.innerHTML = plantFig(plant.id);
  return el;
}

/** 一覧: はじめに + 6 つの発電所のカードと、くらべてみようの表 */
export function renderPowerList(root: HTMLElement): void {
  const rows = PLANTS.filter((p) => p.compare);
  root.replaceChildren(
    h(
      'main',
      { class: 'power-list' },
      h('div', { class: 'bar' }, homeButton(), h('h1', {}, TITLE)),
      h('p', { class: 'section-note' }, '6年生の「電気の利用」で学ぶ発電所が、どうやって電気をつくっているのかを、図を動かしながら見てみよう。'),
      h(
        'ul',
        { class: 'power-cards' },
        ...PLANTS.map((p) => {
          const thumb = h('div', { class: 'power-thumb', 'aria-hidden': 'true' });
          thumb.innerHTML = plantFig(p.id);
          return h('li', {}, h('a', { class: 'power-card', href: powerHref(p.id) }, thumb, h('h2', {}, p.name), h('p', {}, p.lead)));
        }),
      ),
      h(
        'section',
        { class: 'power-compare', 'aria-labelledby': 'compare-title' },
        h('h2', { id: 'compare-title' }, 'くらべてみよう'),
        h(
          'div',
          { class: 'table-wrap' },
          h(
            'table',
            {},
            h('thead', {}, h('tr', {}, ...['発電所', '燃料', '二酸化炭素', '天気のえいきょう'].map((s) => h('th', { scope: 'col' }, s)))),
            h(
              'tbody',
              {},
              ...rows.map((p) =>
                h(
                  'tr',
                  {},
                  h('th', { scope: 'row' }, h('a', { href: powerHref(p.id) }, p.name)),
                  h('td', {}, p.compare!.fuel),
                  h('td', {}, p.compare!.co2),
                  h('td', {}, p.compare!.weather),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

/** たしかめ問題 (答えても記録はしない) */
function checkQuiz(plant: Plant): HTMLElement {
  const rng = rngFromString(`power:${plant.id}`);
  const items = plant.quiz.map((f, n) => {
    const q = choice(rng, { text: f.q, correct: f.a, wrong: f.wrong, explanation: f.ex });
    const feedback = h('div', { class: 'feedback', 'aria-live': 'polite' });
    const buttons = q.choices.map((c, i) => {
      const btn = h('button', { type: 'button', class: 'choice', onclick: () => answer(i) }, h('span', { class: 'choice-num', 'aria-hidden': 'true' }, String(i + 1)));
      btn.append(withRuby('span', 'choice-text', c));
      return btn;
    });
    const answer = (chosen: number) => {
      const ok = chosen === q.answer;
      buttons.forEach((btn, i) => {
        btn.disabled = true;
        if (i === q.answer) btn.classList.add('choice-correct');
        if (i === chosen && !ok) btn.classList.add('choice-wrong');
      });
      buttons[q.answer].append(mark(true, 'mark mark-choice'));
      if (!ok) buttons[chosen].append(mark(false, 'mark mark-choice'));
      feedback.className = ok ? 'feedback feedback-ok' : 'feedback feedback-ng';
      feedback.replaceChildren(h('p', { class: 'feedback-title' }, ok ? '正解！' : 'ざんねん…'), paragraphs('explain', q.explanation));
    };
    return h(
      'article',
      { class: 'card power-check-item' },
      h('header', { class: 'card-head' }, h('span', { class: 'q-num' }, `${n + 1}問目`)),
      paragraphs('q-text', q.text),
      h('div', { class: q.choices.some((c) => c.length > 14) ? 'choices choices-long' : 'choices' }, ...buttons),
      feedback,
    );
  });
  return h('section', { class: 'power-check', id: 'check', 'aria-labelledby': 'check-title' }, h('h2', { id: 'check-title' }, 'たしかめ問題'), ...items);
}

/** 解説の画面。もどり値は、画面をはなれるときのあとしまつ */
export function renderPower(root: HTMLElement, plant: Plant, first: number): () => void {
  let step = first;
  let value = plant.control.value;

  const fig = figureOf(plant);
  const svg = fig.querySelector('svg')!;
  const parts = [...svg.querySelectorAll<SVGGElement>('[data-part]')];
  const flows = [...svg.querySelectorAll<SVGPathElement>('[data-flow]')];

  const meterBar = h('span', { class: 'meter-bar' });
  const meterNum = h('span', { class: 'meter-num' });
  const valueText = h('output', { class: 'control-value', for: 'power-control' });
  const slider = h('input', {
    type: 'range',
    id: 'power-control',
    min: plant.control.min,
    max: plant.control.max,
    step: plant.control.step,
    value,
    oninput: () => {
      value = Number(slider.value);
      update();
    },
  });

  const title = h('h2', { class: 'guide-title', id: 'guide-title' });
  const body = h('div', { class: 'guide-text' });
  const count = h('span', { class: 'guide-count' });
  const prev = h('button', { type: 'button', class: 'btn', onclick: () => go(step - 1) }, 'まえへ');
  const next = h('button', { type: 'button', class: 'btn btn-primary', onclick: () => go(step + 1) }, 'つぎへ');
  const dots = plant.steps.map((s, i) => h('button', { type: 'button', class: 'dot', 'aria-label': `${i + 1}. ${s.title}`, onclick: () => go(i) }));

  /** つまみの値に合わせて、回る速さ・明るさ・メーターを変える */
  function update(): void {
    const out = plant.output(value);
    const stage = fig;
    stage.style.setProperty('--out', String(out));
    // 発電量が多いほど速く回る (1 回転 0.6〜3 秒)
    stage.style.setProperty('--dur', `${(0.6 + 2.4 * (1 - out)).toFixed(2)}s`);
    for (const [k, v] of Object.entries(plant.vars?.(value) ?? {})) stage.style.setProperty(k, v);
    stage.classList.toggle('is-off', out === 0);
    valueText.textContent = plant.control.show(value);
    meterBar.style.width = `${Math.round(out * 100)}%`;
    meterNum.textContent = `${Math.round(out * 100)}%`;
  }

  /** ステップに合わせて、光らせる部品と動かす流れを変える */
  function show(): void {
    const s = plant.steps[step];
    parts.forEach((p) => p.classList.toggle('is-focus', s.parts.includes(p.dataset.part!)));
    flows.forEach((f) => f.classList.toggle('is-flow', s.flows.includes(f.dataset.flow!)));
    title.textContent = s.title;
    body.replaceChildren(paragraphs('', s.text));
    count.textContent = `${step + 1} / ${plant.steps.length}`;
    prev.disabled = step === 0;
    const last = step === plant.steps.length - 1;
    next.textContent = last ? 'たしかめ問題へ' : 'つぎへ';
    dots.forEach((d, i) => d.setAttribute('aria-current', i === step ? 'step' : 'false'));
    // 画面をかき直さずに、URL だけをそのステップにする (#/power/<id>/<step>)
    history.replaceState(null, '', powerHref(plant.id, step));
  }

  function go(n: number): void {
    if (n >= plant.steps.length) {
      document.getElementById('check')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      return;
    }
    step = Math.max(0, n);
    show();
  }

  const merits =
    plant.merits.length > 0
      ? h(
          'section',
          { class: 'power-points', 'aria-labelledby': 'points-title' },
          h('h2', { id: 'points-title' }, 'よいところと課題'),
          h('div', { class: 'points-grid' }, h('div', { class: 'points-good' }, h('h3', {}, 'よいところ'), h('ul', {}, ...plant.merits.map((m) => h('li', {}, m)))), h('div', { class: 'points-bad' }, h('h3', {}, '課題'), h('ul', {}, ...plant.issues.map((m) => h('li', {}, m))))),
        )
      : null;

  const energy = plant.energy
    ? h('ol', { class: 'energy', 'aria-label': 'エネルギーの変わり方' }, ...plant.energy.map((e) => h('li', {}, e)))
    : null;

  root.replaceChildren(
    h(
      'main',
      { class: 'power' },
      h('div', { class: 'bar' }, h('a', { class: 'back', href: '#/power' }, h('span', { 'aria-hidden': 'true' }, '‹'), '一覧'), h('h1', {}, plant.name), homeButton()),
      h(
        'nav',
        { class: 'power-tabs', 'aria-label': '発電所をえらぶ' },
        ...PLANTS.map((p) => h('a', { href: powerHref(p.id), class: 'chip', 'aria-current': p.id === plant.id ? 'page' : 'false' }, p.id === 'generator' ? 'はじめに' : p.name)),
      ),
      h(
        'div',
        { class: 'power-body' },
        h(
          'div',
          { class: 'power-stage' },
          fig,
          h(
            'div',
            { class: 'power-control' },
            h('label', { for: 'power-control' }, plant.control.label),
            slider,
            valueText,
            h('p', { class: 'meter' }, h('span', { class: 'meter-label' }, '発電量'), h('span', { class: 'meter-track' }, meterBar), meterNum),
          ),
        ),
        h(
          'section',
          { class: 'power-guide', 'aria-labelledby': 'guide-title' },
          h('div', { class: 'guide-head' }, hakase(), h('div', {}, count, title)),
          body,
          h('div', { class: 'guide-nav' }, prev, h('div', { class: 'dots' }, ...dots), next),
        ),
      ),
      energy ? h('section', { class: 'power-energy', 'aria-label': 'エネルギーの変わり方' }, h('h2', {}, 'エネルギーの変わり方'), energy) : null,
      merits,
      checkQuiz(plant),
    ),
  );

  update();
  show();

  // キーボードの ← → でもステップを動かせる (つまみを動かしているときはのぞく)
  const onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight' && step < plant.steps.length - 1) go(step + 1);
    if (e.key === 'ArrowLeft') go(step - 1);
  };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}

/** #/power/<id> の画面。id がわからなければ一覧 */
export function renderPowerPage(root: HTMLElement, id: string | null, step: number): (() => void) | null {
  const plant = id ? plantById(id) : undefined;
  if (!plant) {
    renderPowerList(root);
    return null;
  }
  return renderPower(root, plant, step);
}
