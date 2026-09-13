/* families/index.js — подключение семейств.

   Каждое семейство само регистрирует свой сэмплер через registerCurve
   при загрузке модуля. Чтобы рендерер узнал о семействе, модуль должен
   быть импортирован — этим и занят этот файл.

   line.js здесь нет намеренно: сэмплер прямой зарегистрирован внутри
   renderer.js с самого начала, и трогать это нельзя — на нём держится
   существующий тренажёр.
*/

'use strict';

import quadratic from './quadratic.js';
import rational from './rational.js';
import exponential from './exponential.js';
import logarithmic from './logarithmic.js';
import trigonometric from './trigonometric.js';

export { quadratic, rational, exponential, logarithmic, trigonometric };

/** Семейство по имени типа кривой. */
export const families = {
  quadratic: quadratic,
  rational: rational,
  exponential: exponential,
  logarithmic: logarithmic,
  trigonometric: trigonometric,
};

export default families;
