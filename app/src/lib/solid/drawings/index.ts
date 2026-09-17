/**
 * Все чертежи банка задания №3 в одном месте.
 *
 * Прототипы — по разделам задачника, плюс шпаргалки «Что нужно помнить»
 * и миниатюры разделов. Тексты условий здесь не дублируются: они
 * приходят из prototipy-91.json.
 *
 * Раздел I собран не отдельными картинками, а из данных прототипов:
 * чертёж прототипа — это чертёж его первого варианта. Так числа
 * и буквы задачи и её чертёж не могут разойтись.
 */

import { RAZDEL_1 } from '../../zadanie3/razdel1';
import { RAZDEL_2 } from '../../zadanie3/razdel2';
import { RAZDEL_3 } from '../../zadanie3/razdel3';
import { RAZDEL_4 } from '../../zadanie3/razdel4';
import { RAZDEL_5 } from '../../zadanie3/razdel5';
import { type Prototype } from '../../zadanie3/types';
import { type Model } from '../model';
import { SECTION6 } from './section6';
import { SECTION7 } from './section7';
import { SECTION8 } from './section8';
import { SHEETS } from './sheets';
import { THUMBS } from './thumbs';

/** Чертёж первого варианта прототипа. */
function firstDrawing(prototype: Prototype): Model {
  const first = prototype.varianty[0];
  if (first === undefined) {
    throw new Error(`У прототипа ${prototype.id} нет вариантов`);
  }
  return prototype.chertezh(first.params);
}

const SECTION1: Record<string, Model> = Object.fromEntries(
  RAZDEL_1.map((prototype) => [prototype.id, firstDrawing(prototype)]),
);

const SECTION2: Record<string, Model> = Object.fromEntries(
  RAZDEL_2.map((prototype) => [prototype.id, firstDrawing(prototype)]),
);

const SECTION3: Record<string, Model> = Object.fromEntries(
  RAZDEL_3.map((prototype) => [prototype.id, firstDrawing(prototype)]),
);

const SECTION4: Record<string, Model> = Object.fromEntries(
  RAZDEL_4.map((prototype) => [prototype.id, firstDrawing(prototype)]),
);

const SECTION5: Record<string, Model> = Object.fromEntries(
  RAZDEL_5.map((prototype) => [prototype.id, firstDrawing(prototype)]),
);

/** Прототипы, у которых числа стоят на самом чертеже. */
const WITH_NUMBERS = ['P03-05', 'P03-11'];

/** Чертёж прототипа по его id. */
export const PROTOTYPE_DRAWINGS: Record<string, Model> = {
  ...SECTION1,
  ...SECTION2,
  ...SECTION3,
  ...SECTION4,
  ...SECTION5,
  ...SECTION6,
  ...SECTION7,
  ...SECTION8,
};

/**
 * Варианты ступенчатых многогранников: у каждого свои числа на
 * чертеже, поэтому и чертёж свой.
 */
export const STEP_VARIANTS: { id: string; variant: number; model: Model }[] = RAZDEL_1.filter(
  (prototype) => WITH_NUMBERS.includes(prototype.id),
).flatMap((prototype) =>
  prototype.varianty.map((v) => ({
    id: prototype.id,
    variant: v.n,
    model: prototype.chertezh(v.params),
  })),
);

export { SHEETS, THUMBS };

/** Сколько всего чертежей в банке. */
export function drawingCount(): number {
  return (
    Object.keys(PROTOTYPE_DRAWINGS).length +
    STEP_VARIANTS.length -
    WITH_NUMBERS.length +
    Object.keys(SHEETS).length +
    Object.keys(THUMBS).length
  );
}
