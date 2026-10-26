import { rngFromString } from '../core/rng';
import { buildFig } from '../learn/figs/common';
import { learnHref } from '../learn/href';
import { GUIDES, guideById } from '../learn/index';
import { FIELDS, initialValues, type Control, type Guide, type State, type Values } from '../learn/types';
import { choice } from '../questions/helpers';
import { addRuby } from '../questions/ruby';
import { h, homeButton, mark, paragraphs, withRuby } from './dom';
import { shibaFace } from './shiba';

const TITLE = '図で学ぶ しくみ';

/** ハカセ (柴犬) の顔 */
function hakase(): HTMLElement {
  const el = h('div', { class: 'hakase', 'aria-hidden': 'true' });
  el.innerHTML = `<svg viewBox="0 -6 120 116">${shibaFace({ items: ['doctor', 'glasses'] })}</svg>`;
  return el;
}

/** 解説の図。SVG はこのアプリの中で組み立てたもの */
function figureOf(guide: Guide): HTMLElement {
  const el = h('div', { class: 'figure learn-figure' });
  el.innerHTML = buildFig(guide.plan());
  return el;
}

const gradeLabel = (g: Guide) => `${g.grades.join('・')}年`;

/** 一覧: 系統ごとに解説のカードをならべる。発電所は、くらべてみようの表もつける */
export function renderLearnList(root: HTMLElement): void {
  const stations = GUIDES.filter((g) => g.compare);
  root.replaceChildren(
    h(
      'main',
      { class: 'learn-list' },
      h('div', { class: 'bar' }, homeButton(), h('h1', {}, TITLE)),
      h('p', { class: 'section-note' }, '教科書の文や図だけではわかりにくいしくみを、図を動かしながらたしかめよう。ステップごとにハカセが説明します。'),
      ...FIELDS.map((field) => {
        const guides = GUIDES.filter((g) => g.field === field);
        if (guides.length === 0) return null;
        return h(
          'section',
          { class: 'learn-field', 'aria-labelledby': `field-${field}` },
          h('h2', { id: `field-${field}` }, field),
          h(
            'ul',
            { class: 'learn-cards' },
            ...guides.map((g) => {
              const thumb = h('div', { class: 'learn-thumb', 'aria-hidden': 'true' });
              thumb.innerHTML = buildFig(g.plan());
              return h(
                'li',
                {},
                h('a', { class: 'learn-card', href: learnHref(g.id) }, thumb, h('h3', {}, g.name), h('p', {}, h('span', { class: 'chip chip-small' }, gradeLabel(g)), ' ', g.lead)),
              );
            }),
          ),
          field === '電気の利用' && stations.length > 0 ? compareTable(stations) : null,
        );
      }),
    ),
  );
}

function compareTable(stations: Guide[]): HTMLElement {
  return h(
    'div',
    { class: 'learn-compare' },
    h('h3', {}, '発電所をくらべてみよう'),
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
          ...stations.map((g) =>
            h('tr', {}, h('th', { scope: 'row' }, h('a', { href: learnHref(g.id) }, g.name)), h('td', {}, g.compare!.fuel), h('td', {}, g.compare!.co2), h('td', {}, g.compare!.weather)),
          ),
        ),
      ),
    ),
  );
}

/** たしかめ問題 (答えても記録はしない) */
function checkQuiz(guide: Guide, tx: (s: string) => string): HTMLElement {
  const rng = rngFromString(`learn:${guide.id}`);
  const items = guide.quiz.map((f, n) => {
    const q = choice(rng, { text: tx(f.q), correct: tx(f.a), wrong: f.wrong.map(tx), explanation: tx(f.ex) });
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
      { class: 'card learn-check-item' },
      h('header', { class: 'card-head' }, h('span', { class: 'q-num' }, `${n + 1}問目`)),
      paragraphs('q-text', q.text),
      h('div', { class: q.choices.some((c) => c.length > 14) ? 'choices choices-long' : 'choices' }, ...buttons),
      feedback,
    );
  });
  return h('section', { class: 'learn-check', id: 'check', 'aria-labelledby': 'check-title' }, h('h2', { id: 'check-title' }, 'たしかめ問題'), ...items);
}

/** 操作 1 つ分の入力。変わったら onChange をよぶ */
function controlInput(c: Control, values: Values, onChange: () => void): HTMLElement {
  const id = `ctl-${c.key}`;
  if (c.kind === 'range') {
    const out = h('output', { class: 'control-value', for: id }, c.show(Number(values[c.key])));
    const input = h('input', {
      type: 'range',
      id,
      min: c.min,
      max: c.max,
      step: c.step,
      value: Number(values[c.key]),
      oninput: () => {
        values[c.key] = Number(input.value);
        out.textContent = c.show(Number(input.value));
        onChange();
      },
    });
    return h('div', { class: 'control control-range' }, h('label', { for: id }, c.label), input, out);
  }
  if (c.kind === 'toggle') {
    const buttons = [true, false].map((v) =>
      h('button', {
        type: 'button',
        class: 'seg',
        'aria-pressed': String(values[c.key] === v),
        onclick: () => {
          values[c.key] = v;
          buttons.forEach((b, i) => b.setAttribute('aria-pressed', String((i === 0) === v)));
          onChange();
        },
      }, v ? c.on : c.off),
    );
    return h('div', { class: 'control control-seg', role: 'group', 'aria-label': c.label }, h('span', { class: 'control-label' }, c.label), h('div', { class: 'segs' }, ...buttons));
  }
  const buttons = c.options.map((o) =>
    h('button', {
      type: 'button',
      class: 'seg',
      'aria-pressed': String(values[c.key] === o.value),
      onclick: () => {
        values[c.key] = o.value;
        buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(c.options[i].value === o.value)));
        onChange();
      },
    }, o.label),
  );
  return h('div', { class: 'control control-seg', role: 'group', 'aria-label': c.label }, h('span', { class: 'control-label' }, c.label), h('div', { class: 'segs' }, ...buttons));
}

/** 解説の画面。もどり値は、画面をはなれるときのあとしまつ */
export function renderGuide(root: HTMLElement, guide: Guide, first: number): () => void {
  const tx = (s: string) => (guide.ruby ? addRuby(s) : s);
  let step = first >= 0 && first < guide.steps.length ? first : 0;
  const values = initialValues(guide);

  const fig = figureOf(guide);
  const svg = fig.querySelector('svg')!;
  const parts = [...svg.querySelectorAll<SVGGElement>('[data-part]')];
  const flows = [...svg.querySelectorAll<SVGPathElement>('[data-flow]')];
  const readouts = h('div', { class: 'readouts', 'aria-live': 'polite' });
  let shownClasses: string[] = [];

  /** 操作の値に合わせて、図のようすと表示を変える */
  function update(): void {
    const s: State = guide.state(values);
    for (const [k, v] of Object.entries(s.vars ?? {})) fig.style.setProperty(k, v);
    for (const c of shownClasses) fig.classList.remove(c);
    shownClasses = Object.entries(s.classes ?? {}).filter(([, on]) => on).map(([c]) => c);
    for (const c of shownClasses) fig.classList.add(c);
    const speed = s.speed ?? 1;
    // 速いほど 1 回の動きが短い (0.6〜3 秒)。0 なら止める
    fig.style.setProperty('--dur', `${(0.6 + 2.4 * (1 - speed)).toFixed(2)}s`);
    fig.classList.toggle('is-still', speed === 0);
    readouts.replaceChildren(
      ...s.readouts.map((r) =>
        h(
          'p',
          { class: 'readout' },
          withRuby('span', 'readout-label', tx(r.label)),
          r.meter !== undefined ? h('span', { class: 'meter-track' }, h('span', { class: 'meter-bar', style: `width:${Math.round(r.meter * 100)}%` })) : null,
          withRuby('b', 'readout-value', tx(r.value)),
        ),
      ),
    );
  }

  const title = h('h2', { class: 'guide-title', id: 'guide-title' });
  const body = h('div', { class: 'guide-text' });
  const count = h('span', { class: 'guide-count' });
  const prev = h('button', { type: 'button', class: 'btn', onclick: () => go(step - 1) }, 'まえへ');
  const next = h('button', { type: 'button', class: 'btn btn-primary', onclick: () => go(step + 1) }, 'つぎへ');
  const dots = guide.steps.map((s, i) => h('button', { type: 'button', class: 'dot', 'aria-label': `${i + 1}. ${s.title.replace(/\(([ぁ-ん]+)\)/g, '')}`, onclick: () => go(i) }));

  /** ステップに合わせて、光らせる部品と動かす流れを変える */
  function show(): void {
    const s = guide.steps[step];
    parts.forEach((p) => p.classList.toggle('is-focus', s.parts.includes(p.dataset.part!)));
    flows.forEach((f) => f.classList.toggle('is-flow', s.flows.includes(f.dataset.flow!)));
    title.replaceChildren(withRuby('span', '', tx(s.title)));
    body.replaceChildren(paragraphs('', tx(s.text)));
    count.textContent = `${step + 1} / ${guide.steps.length}`;
    prev.disabled = step === 0;
    next.textContent = step === guide.steps.length - 1 ? 'たしかめ問題へ' : 'つぎへ';
    dots.forEach((d, i) => d.setAttribute('aria-current', i === step ? 'step' : 'false'));
    // 画面をかき直さずに、URL だけをそのステップにする
    history.replaceState(null, '', learnHref(guide.id, step));
  }

  function go(n: number): void {
    if (n >= guide.steps.length) {
      document.getElementById('check')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      return;
    }
    step = Math.max(0, n);
    show();
  }

  const list = (cls: string, title: string, items: string[]) => h('div', { class: cls }, h('h3', {}, title), h('ul', {}, ...items.map((m) => withRuby('li', '', tx(m)))));
  const siblings = GUIDES.filter((g) => g.field === guide.field);

  root.replaceChildren(
    h(
      'main',
      { class: 'learn' },
      h('div', { class: 'bar' }, h('a', { class: 'back', href: '#/learn' }, h('span', { 'aria-hidden': 'true' }, '‹'), '一覧'), withRuby('h1', '', tx(guide.name)), homeButton()),
      h(
        'nav',
        { class: 'learn-tabs', 'aria-label': `${guide.field}の解説をえらぶ` },
        ...siblings.map((g) => h('a', { href: learnHref(g.id), class: 'chip', 'aria-current': g.id === guide.id ? 'page' : 'false' }, g.id === 'generator' ? 'はじめに' : g.name)),
      ),
      h(
        'div',
        { class: 'learn-body' },
        h('div', { class: 'learn-stage' }, fig, h('div', { class: 'learn-controls' }, ...guide.controls.map((c) => controlInput(c, values, update)), readouts)),
        h(
          'section',
          { class: 'learn-guide', 'aria-labelledby': 'guide-title' },
          h('div', { class: 'guide-head' }, hakase(), h('div', {}, count, title)),
          body,
          h('div', { class: 'guide-nav' }, prev, h('div', { class: 'dots' }, ...dots), next),
        ),
      ),
      guide.energy ? h('section', { class: 'learn-section', 'aria-labelledby': 'energy-title' }, h('h2', { id: 'energy-title' }, 'エネルギーの変わり方'), h('ol', { class: 'energy' }, ...guide.energy.map((e) => h('li', {}, e)))) : null,
      guide.points ? h('section', { class: 'learn-section', 'aria-labelledby': 'points-title' }, h('h2', { id: 'points-title' }, 'ポイント'), h('div', { class: 'points-grid' }, list('points-good', 'おぼえておこう', guide.points))) : null,
      guide.merits?.length
        ? h(
            'section',
            { class: 'learn-section', 'aria-labelledby': 'merits-title' },
            h('h2', { id: 'merits-title' }, 'よいところと課題'),
            h('div', { class: 'points-grid' }, list('points-good', 'よいところ', guide.merits), list('points-bad', '課題', guide.issues ?? [])),
          )
        : null,
      checkQuiz(guide, tx),
    ),
  );

  update();
  show();

  // キーボードの ← → でもステップを動かせる (つまみやボタンを使っているときはのぞく)
  const onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight' && step < guide.steps.length - 1) go(step + 1);
    if (e.key === 'ArrowLeft') go(step - 1);
  };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}

/** #/learn の画面。id がなければ (またはわからなければ) 一覧 */
export function renderLearnPage(root: HTMLElement, id: string | null, step: number): (() => void) | null {
  const guide = id ? guideById(id) : undefined;
  if (!guide) {
    renderLearnList(root);
    return null;
  }
  return renderGuide(root, guide, step);
}
