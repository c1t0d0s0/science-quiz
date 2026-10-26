import { BODY_GUIDES } from './body';
import { MATTER_GUIDES } from './matter';
import { PHYSICS } from './physics';
import { PLANT_GUIDES } from './plants';
import { PLANTS } from './power';
import type { Guide } from './types';

/** 全部の解説 (一覧では系統ごとにならべる) */
export const GUIDES: readonly Guide[] = [...PHYSICS, ...BODY_GUIDES, ...MATTER_GUIDES, ...PLANT_GUIDES, ...PLANTS];

export const guideById = (id: string): Guide | undefined => GUIDES.find((g) => g.id === id);
