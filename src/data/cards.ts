/** 柴犬の絵柄の指定。指定しない項目は、ホームの柴犬 (赤しば) と同じになる */
export interface Look {
  fur?: string;
  light?: string;
  pink?: string;
  /** まゆの丸いもようの色 (黒しばなど) */
  brow?: string;
  /** 目に色をつける (毛の色が暗いときなど) */
  eyeColor?: string;
  eyes?: 'open' | 'wink' | 'sleep' | 'happy' | 'sparkle' | 'brave';
  mouth?: 'tongue' | 'smile' | 'open';
  items?: Item[];
}

export type Item =
  | 'ribbon'
  | 'glasses'
  | 'pencil'
  | 'hat'
  | 'scarf'
  | 'flower'
  | 'flask'
  | 'headband'
  | 'magnifier'
  | 'cap'
  | 'bulb'
  | 'sprout'
  | 'doctor'
  | 'crown'
  | 'zzz';

export type Background =
  | 'paper'
  | 'dots'
  | 'grid'
  | 'night'
  | 'pink'
  | 'sky'
  | 'snow'
  | 'sakura'
  | 'leaves'
  | 'hanamaru'
  | 'stars'
  | 'rainbow'
  | 'gold';

export interface Card {
  id: string;
  /** 3 年生でも読めるよう、漢字は 3 年生までに習うものだけ */
  name: string;
  price: number;
  look: Look;
  bg: Background;
  frame: 'plain' | 'silver' | 'gold';
}

/**
 * 値段の安い順。合計は 28,420pt (Wordlynx のヤマネコカードと同じ値段のならび)。
 * - 毎日 1 つの学年をとき終える人が、はじめの 5 枚を 2 週間ほどで手に入れられる
 *   (1 日 20〜30pt と、7 日つづくたびの 1000pt)
 * - そのあとは、1 枚ごとに少しずつ時間がかかる
 * - 全部集めるには、「1 か月そろった」(5000pt) が何回かいる
 */
export const CARDS: Card[] = [
  { id: 's01', name: 'しばいぬ', price: 40, look: {}, bg: 'paper', frame: 'plain' },
  { id: 's02', name: 'ウインク しばいぬ', price: 80, look: { eyes: 'wink', mouth: 'smile' }, bg: 'dots', frame: 'plain' },
  { id: 's03', name: 'ねむねむ しばいぬ', price: 300, look: { eyes: 'sleep', mouth: 'smile', items: ['zzz'] }, bg: 'night', frame: 'plain' },
  { id: 's04', name: 'にこにこ しばいぬ', price: 500, look: { eyes: 'happy', mouth: 'open' }, bg: 'pink', frame: 'plain' },
  { id: 's05', name: 'リボンの しばいぬ', price: 800, look: { items: ['ribbon'], fur: '#ecb574' }, bg: 'dots', frame: 'plain' },
  { id: 's06', name: 'めがねの しばいぬ', price: 1000, look: { items: ['glasses'], mouth: 'smile' }, bg: 'grid', frame: 'plain' },
  { id: 's07', name: '虫めがね しばいぬ', price: 1100, look: { items: ['magnifier'], eyes: 'brave', mouth: 'smile' }, bg: 'leaves', frame: 'plain' },
  { id: 's08', name: 'ぼうしの しばいぬ', price: 1200, look: { items: ['hat'], mouth: 'open', eyes: 'happy' }, bg: 'sky', frame: 'plain' },
  { id: 's09', name: 'マフラーの しばいぬ', price: 1300, look: { items: ['scarf'], fur: '#cf8f4a' }, bg: 'snow', frame: 'plain' },
  { id: 's10', name: '花の しばいぬ', price: 1400, look: { items: ['flower'], eyes: 'wink', fur: '#e8b06c' }, bg: 'sakura', frame: 'plain' },
  { id: 's11', name: 'じっけん しばいぬ', price: 1500, look: { items: ['glasses', 'flask'], mouth: 'smile' }, bg: 'grid', frame: 'silver' },
  { id: 's12', name: 'はちまき しばいぬ', price: 1600, look: { items: ['headband'], eyes: 'brave', mouth: 'open' }, bg: 'hanamaru', frame: 'silver' },
  { id: 's13', name: '白い しばいぬ', price: 1700, look: { fur: '#f6f1e6', light: '#ffffff', pink: '#f9c9c0', brow: '#ffffff', items: ['scarf'] }, bg: 'snow', frame: 'silver' },
  { id: 's14', name: '黒い しばいぬ', price: 1800, look: { fur: '#3b3d4c', light: '#f6ead2', pink: '#b98d7c', brow: '#d9a55b', eyeColor: '#f6ead2', mouth: 'smile' }, bg: 'night', frame: 'silver' },
  { id: 's15', name: 'ひらめき しばいぬ', price: 1900, look: { items: ['bulb'], eyes: 'sparkle', mouth: 'open' }, bg: 'dots', frame: 'silver' },
  { id: 's16', name: 'たんけん しばいぬ', price: 2000, look: { items: ['cap', 'magnifier'], eyes: 'brave', mouth: 'smile', fur: '#d99a55' }, bg: 'sky', frame: 'silver' },
  { id: 's17', name: 'はなまる しばいぬ', price: 2200, look: { eyes: 'sparkle', mouth: 'open', items: ['pencil'] }, bg: 'hanamaru', frame: 'gold' },
  { id: 's18', name: 'はかせの しばいぬ', price: 2400, look: { items: ['doctor', 'glasses'], eyes: 'sparkle', mouth: 'smile', fur: '#e6c59a', light: '#fffaf0' }, bg: 'stars', frame: 'gold' },
  { id: 's19', name: 'にじの しばいぬ', price: 2600, look: { eyes: 'sparkle', mouth: 'open', fur: '#f2c787', items: ['sprout'] }, bg: 'rainbow', frame: 'gold' },
  { id: 's20', name: '王様の しばいぬ', price: 3000, look: { items: ['crown'], eyes: 'sparkle', mouth: 'smile', fur: '#eab65c' }, bg: 'gold', frame: 'gold' },
];
