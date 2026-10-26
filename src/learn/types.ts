import type { Fact } from '../questions/helpers';
import type { Plan } from './figs/common';

// 図で学ぶ「しくみ」の解説。地学ビューアの解説 (ステップごとにハカセが説明し、図の表示が切りかわる) にならう

/** 一覧でまとめる系統 (ならべる順) */
export const FIELDS = ['物理', '人体', '熱・物質', '植物', '電気の利用'] as const;
export type Field = (typeof FIELDS)[number];

export interface Step {
  title: string;
  /** ハカセの説明。改行で段落を分ける。「漢字(かんじ)」と書くとふりがなになる */
  text: string;
  /** 光らせる部品 (図の data-part) */
  parts: string[];
  /** 動かす流れ (図の data-flow) */
  flows: string[];
}

/** 図を動かす操作。range はつまみ、toggle は 2 つの切りかえ、select はいくつかからえらぶ */
export type Control =
  | { kind: 'range'; key: string; label: string; min: number; max: number; step: number; value: number; show: (v: number) => string }
  | { kind: 'toggle'; key: string; label: string; value: boolean; on: string; off: string }
  | { kind: 'select'; key: string; label: string; value: string; options: { value: string; label: string }[] };

export type Values = Record<string, number | string | boolean>;

/** 図の横に出す数や言葉。meter (0〜1) があれば、メーターでも出す */
export interface Readout {
  label: string;
  value: string;
  meter?: number;
}

/** 操作の値から決まる、図のようす */
export interface State {
  /** 図につける CSS の変数 (--tilt など) */
  vars?: Record<string, string>;
  /** 図につけるクラス (true のものだけつく) */
  classes?: Record<string, boolean>;
  /** 回る・流れる速さ (0 なら止まる、1 でいちばん速い) */
  speed?: number;
  readouts: Readout[];
}

export interface Guide {
  id: string;
  field: Field;
  /** 学年 (3〜6) */
  grades: number[];
  name: string;
  /** 一覧のカードに書く、ひとことの説明 */
  lead: string;
  /** ふりがなをつけるか (3・4 年むけ) */
  ruby?: boolean;
  plan: () => Plan;
  steps: Step[];
  controls: Control[];
  state: (v: Values) => State;
  /** エネルギーの変わり方 (発電所) */
  energy?: string[];
  /** くらべてみようの表 (発電所) */
  compare?: { fuel: string; co2: string; weather: string };
  /** よいところと課題 (発電所) */
  merits?: string[];
  issues?: string[];
  /** 解説の下にならべる「ポイント」 */
  points?: string[];
  /** たしかめ問題 */
  quiz: Fact[];
}

/** 操作のはじめの値 */
export const initialValues = (g: Guide): Values => Object.fromEntries(g.controls.map((c) => [c.key, c.value]));

export const clamp = (x: number) => Math.min(1, Math.max(0, x));
export const percent = (v: number) => `${v}%`;
export const round1 = (n: number) => Math.round(n * 10) / 10;
