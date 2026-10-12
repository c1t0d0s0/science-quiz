import type { Level } from '../core/quiz';

export const LEVEL_LABEL: Record<Level, string> = {
  lower: '3・4年生むけ',
  upper: '5・6年生むけ',
};

export const LEVEL_NOTE: Record<Level, string> = {
  lower: '身のまわりのふしぎから、理科のきほんをたしかめよう',
  upper: '計算や実験の問題で、入試に向けた力をつけよう',
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/** 「10月12日（月）」 */
export function dateLabel(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${WEEKDAYS[d.getUTCDay()]}）`;
}

/** 正解の数に合わせた、結果の見出し */
export function resultTitle(correct: number, total: number): string {
  if (correct === total) return 'ぜんぶ正解！ はなまる！';
  if (correct >= total * 0.8) return 'よくできました！';
  if (correct >= total * 0.5) return 'その調子！';
  return 'おつかれさま！';
}

export function resultNote(correct: number, total: number): string {
  if (correct === total) return 'すばらしい！ 明日の10問も楽しみにしていてね。';
  if (correct >= total * 0.8) return 'あと少しで全問正解。まちがえた問題の解説を読んでおこう。';
  if (correct >= total * 0.5) return 'まちがえた問題は、解説を読んで、もう一度考えてみよう。';
  return 'はじめはだれでもまちがえます。解説を読んで、少しずつおぼえていこう。';
}

export const HOWTO = [
  '毎日、理科の問題が10問出ます。4つの中から答えを1つえらぼう。',
  '同じ日のうちは、いつ開いても同じ問題です。日付が変わると、新しい10問になります。',
  '植物・動物・天体・物質・電球の明るさ・てこ・かっ車の7つの分野から、まんべんなく出題されます。',
  '答えるとすぐに、正解と解説が出ます。まちがえた問題こそ、解説をよく読もう。',
  '記録は、この端末（たんまつ）のブラウザにほぞんされます。',
];
