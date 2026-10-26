import { PLANTS } from './power';
import type { Guide } from './types';

/** 全部の解説 (一覧では系統ごとにならべる) */
export const GUIDES: readonly Guide[] = [...PLANTS];

export const guideById = (id: string): Guide | undefined => GUIDES.find((g) => g.id === id);
