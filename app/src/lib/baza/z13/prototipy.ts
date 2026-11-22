/**
 * База, задание №13 «Стереометрия»: прототипы задач тренажёра.
 *
 * Прототип — тип задачи задачника (одна формулировка, меняются числа),
 * задачи прототипа — проверенные аналоги задач задачника (числа —
 * dannye.ts). Раздел собран из частей по разделам задачника:
 * часть 1 — параллелепипед и призма (chast1.ts, P01–P05);
 * часть 2 — пирамида (chast2.ts, P06–P13);
 * часть 3 — цилиндр, конус, шар (chast3.ts, P14–P24).
 * У каждой задачи — чертёж условия (ris.ts).
 */

import type { GruppaBazy, Prototip } from '../types';
import { GRUPPY_13_1, PROTOTIPY_13_1 } from './chast1';
import { GRUPPY_13_2, PROTOTIPY_13_2 } from './chast2';
import { GRUPPY_13_3, PROTOTIPY_13_3 } from './chast3';

export const GRUPPY_13: GruppaBazy[] = [...GRUPPY_13_1, ...GRUPPY_13_2, ...GRUPPY_13_3];

export const PROTOTIPY_13: Prototip[] = [...PROTOTIPY_13_1, ...PROTOTIPY_13_2, ...PROTOTIPY_13_3];
