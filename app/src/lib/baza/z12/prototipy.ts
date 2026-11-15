/**
 * База, задание №12 «Планиметрия»: прототипы задач тренажёра.
 *
 * Раздел собран из частей по разделам задачника:
 * часть 1 — углы, треугольник, четырёхугольники (chast1.ts, P01–P30);
 * часть 2 — площадь, теорема Пифагора, подобие (chast2.ts, P31–P60).
 */

import type { GruppaBazy, Prototip } from '../types';
import { GRUPPY_12_1, PROTOTIPY_12_1 } from './chast1';
import { GRUPPY_12_2, PROTOTIPY_12_2 } from './chast2';

export const GRUPPY_12: GruppaBazy[] = [...GRUPPY_12_1, ...GRUPPY_12_2];

export const PROTOTIPY_12: Prototip[] = [...PROTOTIPY_12_1, ...PROTOTIPY_12_2];
