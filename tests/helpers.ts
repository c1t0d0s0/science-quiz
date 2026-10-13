import { expect } from 'vitest';
import type { Draft } from '../src/questions/helpers';

/** SVG のタグが正しく開いて閉じているかを確かめる (属性の中身までは見ない) */
export function assertWellFormed(svg: string): void {
  // 何万回もよばれるので、expect は使わずに自分で調べる
  const fail = (why: string): never => {
    throw new Error(`SVG が正しくありません (${why}): ${svg.slice(0, 200)}`);
  };
  if (!svg.startsWith('<svg ')) fail('svg で始まっていない');
  // タグの外に < や > が残っていないこと (文字はエスケープされているはず)
  if (/[<>]/.test(svg.replace(/<[^<>]+>/g, ''))) fail('タグの外に < >');
  if (/NaN|undefined|Infinity/.test(svg)) fail('数になっていない値');
  const stack: string[] = [];
  for (const tag of svg.match(/<[^>]+>/g) ?? []) {
    const name = tag.match(/^<\/?([a-zA-Z]+)/)?.[1];
    if (!name) fail(tag);
    // 属性は 名前="値" の形だけ
    if (!/^<\/?[a-zA-Z]+( [a-zA-Z0-9:-]+="")*\s*\/?>$/.test(tag.replace(/"[^"]*"/g, '""'))) fail(tag);
    if (tag.startsWith('</')) {
      if (stack.pop() !== name) fail(tag);
    } else if (!tag.endsWith('/>')) stack.push(name!);
  }
  if (stack.length > 0) fail(`閉じていない ${stack.join(',')}`);
}

/** 問題 1 つ分として形が正しいかを確かめる */
export function assertValid(q: Draft, label: string): void {
  expect(q.choices.length, label).toBe(4);
  expect(new Set(q.choices).size, `${label}: 選択肢が重なっている ${q.choices.join(' / ')}`).toBe(4);
  expect(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, label).toBe(true);
  for (const s of [q.text, q.explanation, ...q.choices]) {
    // 0.30000000000000004 のような計算のずれや、値の入っていない文字が出ていないこと
    if (s.trim().length === 0 || /NaN|undefined|Infinity|\[object|null|\d\.\d{4,}/.test(s)) throw new Error(`${label}: 文が正しくありません: ${s}`);
  }
  // 0 や マイナスの量が選択肢に出ていないこと
  for (const c of q.choices) if (/^-|^0(g|cm|cm³|%|L|kg|度)$/.test(c)) throw new Error(`${label}: 選択肢が正しくありません: ${c}`);
  if (q.svg) assertWellFormed(q.svg);
}
