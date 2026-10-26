/**
 * Главы теории №3, написанные по данным (кроме главы 2 — она своим
 * компонентом): id главы → её данные. Строятся на сборке.
 */

import { glava0 } from './glava0';
import { glava1 } from './glava1';
import { glava3 } from './glava3';
import { glava4 } from './glava4';
import { glava5 } from './glava5';
import { glava9 } from './glava9';
import { glava10 } from './glava10';
import type { GlavaDannye } from './tipy';

export const GLAVY_DANNYE_3: Readonly<Record<string, () => GlavaDannye>> = {
  umet: glava0,
  chertezh: glava1,
  mnogogranniki: glava3,
  obem: glava4,
  vrashcheniya: glava5,
  schet: glava9,
  formuly: glava10,
};
