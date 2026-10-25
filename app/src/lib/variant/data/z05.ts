/**
 * Данные задания №5 для «Собрать вариант» (маршрут
 * /variant/dannye/z05.json): то же устройство, что у №4 (./z04.ts).
 */

import type { Dannye45 } from '../adapters/z04/veroyatnost';
import { dannyeVeroyatnosti } from './z04';

export function dannye(): Dannye45 {
  return dannyeVeroyatnosti(5);
}
