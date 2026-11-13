/**
 * Какие прототипы №13 идут в тренажёр и на карту задания: все, кроме
 * «таблицы руками» (P-…) — она в опорных задачах. Группы — четыре схемы.
 */

import { PROTOTYPES } from '../proto';
import type { TypeCode } from '../types';

export const SHEMY_13: TypeCode[] = ['A', 'B', 'C', 'D'];

export const PROTOTIPY_TRENAZHERA_13 = PROTOTYPES.filter((p) => !p.id.startsWith('P-'));
