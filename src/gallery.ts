// 全部のジェネレーターが作る問題を、図といっしょにならべて確かめるためのページ (gallery.html)。
// ?n=3 で 1 つのジェネレーターあたりの見本の数、?level=upper でレベル、?only=lever でカテゴリーをしぼれる。
import './styles.css';
import { CATEGORIES, CATEGORY_LABEL, LEVELS } from './core/quiz';
import { rngFromString } from './core/rng';
import { GENERATORS } from './questions';
import { addRuby } from './questions/ruby';
import { figure, h, paragraphs, withRuby } from './ui/dom';
import { LEVEL_LABEL } from './ui/text';

const params = new URLSearchParams(location.search);
const count = Number(params.get('n') ?? 2);
const app = document.getElementById('app')!;
// ?figs=1 で、図だけをならべる
const figsOnly = params.has('figs');
const page = h('main', { class: 'result-page', style: figsOnly ? 'max-width:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(20rem,1fr));gap:0.75rem' : '' });

for (const level of LEVELS.filter((l) => !params.get('level') || params.get('level') === l)) {
  const ruby = level === 'lower' ? addRuby : (s: string) => s;
  for (const category of CATEGORIES.filter((c) => !params.get('only') || params.get('only') === c)) {
    if (!figsOnly) page.append(h('h2', {}, `${LEVEL_LABEL[level]} ／ ${CATEGORY_LABEL[category]}`));
    for (const gen of GENERATORS[level][category]) {
      for (let i = 0; i < count; i++) {
        const q = gen.make(rngFromString(`${gen.id}:gallery:${i}`));
        if (figsOnly) {
          if (q.svg) page.append(h('article', { class: 'card' }, h('span', { class: 'chip' }, gen.id), figure(q.svg), withRuby('p', 'section-note', `正解: ${ruby(q.choices[q.answer])}`)));
          continue;
        }
        page.append(
          h(
            'article',
            { class: 'card' },
            h('header', { class: 'card-head' }, h('span', { class: 'chip' }, gen.id)),
            paragraphs('q-text', ruby(q.text)),
            q.svg ? figure(q.svg) : null,
            h(
              'div',
              { class: 'choices' },
              ...q.choices.map((c, k) => {
                const btn = h('button', { type: 'button', class: k === q.answer ? 'choice choice-correct' : 'choice', disabled: true });
                btn.append(withRuby('span', 'choice-text', ruby(c)));
                return btn;
              }),
            ),
            paragraphs('explain', ruby(q.explanation)),
          ),
        );
      }
    }
  }
}
app.append(page);
