import type { Level } from '../core/quiz';
import { MONTH_POINTS, PERFECT_BONUS, QUIZ_POINTS, WEEK_LENGTH, WEEK_POINTS } from '../core/rewards';

export const LEVEL_LABEL: Record<Level, string> = {
  g3: '3年生むけ',
  g4: '4年生むけ',
  g5: '5年生むけ',
  g6: '6年生むけ',
};

export const LEVEL_NOTE: Record<Level, string> = {
  g3: '身のまわりのふしぎから、理科をはじめよう',
  g4: '季節・星・電気など、きほんをしっかりと',
  g5: '計算や実験の問題にちょうせん',
  g6: '入試に向けて、力をしあげよう',
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
  '3年生から6年生まで、学年ごとに、毎日10問の理科の問題が出ます。4つの中から答えを1つえらぼう。',
  '同じ日のうちは、いつ開いても同じ問題です。日付が変わると、新しい10問になります。',
  '生物・地学・化学・物理の16の分野から、毎日ちがう10分野が1問ずつ出ます。8日間で、どの分野も同じ回数だけ出ます。',
  '答えるとすぐに、正解と解説が出ます。まちがえた問題こそ、解説をよく読もう。',
  '10問をとき終えると、スタンプとポイントがもらえます。ポイントをためて、柴犬（しばいぬ）のカードを集めよう。',
  '記録は、この端末（たんまつ）のブラウザにほぞんされます。Googleでログインすると、ほかの端末でも同じ記録でつづけられます。',
];

const num = (n: number) => n.toLocaleString('ja-JP');

/** スタンプカード・ポイント・柴犬カードの文言 */
export const REWARD = {
  goHome: 'ホームへ',
  stampTitle: 'スタンプカード',
  stampMonth: (month: number) => `${month}月`,
  stampDayLabel: (day: number, stamped: boolean) => `${day}日${stamped ? ' スタンプあり' : ''}`,
  stampRun: (run: number, left: number) =>
    run === 0 ? `今日の10問をとき終えると、スタンプがもらえます。${WEEK_LENGTH}日つづけると${num(WEEK_POINTS)}pt！` : `${run}日つづいています。あと${left}日で${num(WEEK_POINTS)}pt！`,
  stampRule: `10問をとき終えると${QUIZ_POINTS}pt（全問正解なら、さらに${PERFECT_BONUS}pt）。学年ごとにもらえます。スタンプは1日1個で、${WEEK_LENGTH}日つづけるたびに${num(WEEK_POINTS)}pt、1日から月のさいごの日まで全部そろうと、さらに${num(MONTH_POINTS)}pt。`,
  stampDone: 'スタンプをおしたよ',
  rewardQuiz: (points: number, perfect: boolean) => (perfect ? `全問正解！ +${points}pt` : `とき終えた！ +${points}pt`),
  rewardWeek: (run: number) => `${run}日つづいた！ +${num(WEEK_POINTS)}pt`,
  rewardMonth: (month: number) => `${month}月のスタンプが全部そろった！ +${num(MONTH_POINTS)}pt`,
  points: (n: number) => `${num(n)}pt`,
  pointsLabel: '持っているポイント',
  rewardLinks: 'スタンプカードと柴犬カード',
  seeStamps: 'スタンプカードを見る',
  cardsTitle: '柴犬カード',
  cardsLead: 'ポイントをためて、柴犬（しばいぬ）のカードを集めよう。',
  cardsOwned: (n: number, total: number) => `${n} / ${total}まい`,
  cardGet: 'ゲットする',
  cardShort: (n: number) => `あと${num(n)}pt`,
  cardConfirm: (price: number) => `${num(price)}ptを使って、このカードをゲットしますか？`,
  cardBackLabel: (price: number) => `まだ持っていないカード。${num(price)}ptでゲットできる`,
};

/** アカウント欄の文言 */
export const ACCOUNT = {
  title: '記録のほぞん',
  note: 'Googleでログインすると、ほかのブラウザや端末（たんまつ）でも、同じ記録でつづけられます。ログインしなくても使えます。',
  signIn: 'Googleでログイン',
  signedIn: 'ログイン中',
  signOut: 'ログアウト',
  loading: 'たしかめています…',
  saving: 'ほぞん中…',
  saved: 'ほぞんずみ',
  offline: 'まだほぞんできていません。つながったらほぞんします。',
  askMigrate:
    'この端末の記録を、アカウントにうつしますか？\n\n「OK」… うつす（アカウントの記録と合わせます）\n「キャンセル」… うつさない（端末の記録はそのままのこります）',
  signOutUnsynced: 'まだほぞんできていない記録があります。今ログアウトすると、その分はなくなります。ログアウトしますか？',
  signInFailed: 'ログインできませんでした。もういちどためしてください。',
};
