/**
 * Все чертежи банка задания №3 в одном месте.
 *
 * Прототипы — по разделам задачника, плюс шпаргалки «Что нужно помнить»
 * и миниатюры разделов. Тексты условий здесь не дублируются: они
 * приходят из prototipy-91.json.
 */

import { type Model } from '../model';
import { SECTION1 } from './section1';
import { SECTION2 } from './section2';
import { SECTION3 } from './section3';
import { SECTION4 } from './section4';
import { SECTION5 } from './section5';
import { SECTION6 } from './section6';
import { SECTION7 } from './section7';
import { SECTION8 } from './section8';
import { SHEETS } from './sheets';
import { STEPS, STEP_VARIANTS } from './steps';
import { THUMBS } from './thumbs';

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
  ...STEPS,
};

export { SHEETS, THUMBS, STEP_VARIANTS };

/** Сколько всего чертежей в банке. */
export function drawingCount(): number {
  return (
    Object.keys(PROTOTYPE_DRAWINGS).length +
    STEP_VARIANTS.length -
    Object.keys(STEPS).length +
    Object.keys(SHEETS).length +
    Object.keys(THUMBS).length
  );
}
