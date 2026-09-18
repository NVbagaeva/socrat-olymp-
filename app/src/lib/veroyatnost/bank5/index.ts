/**
 * Банк задания №5: пятнадцать прототипов из задачника
 * Е. А. Ширяевой «ЕГЭпроф 2025», задачи 1–58.
 *
 * Разложены по одиннадцати блокам-способам решения (см. blocks.ts):
 * в самом задачнике подзаголовков нет, задачи идут подряд.
 */

import { type Prototype } from '../types';
import { PROIZVEDENIYA } from './proizvedeniya';
import { SUMMY } from './summy';

export const BANK_5: readonly Prototype[] = [...SUMMY, ...PROIZVEDENIYA];
