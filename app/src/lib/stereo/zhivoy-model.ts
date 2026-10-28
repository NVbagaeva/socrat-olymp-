/**
 * Модель для вращения на экране (собирается на сборке, в браузер не
 * тянет подбор вида — поэтому отдельно от zhivoy.ts).
 */

import type { Model } from '../solid/model';
import { vybratVidSolid } from '../solid/vid';

/**
 * Модель для вращения: всегда параллельная проекция с выбранным
 * ракурсом. Косоугольный вид (призмы банка) не вращается — живой
 * чертёж открывается ближайшим к нему ортогональным видом.
 */
export function modelDlyaVrashcheniya(model: Model): Model {
  return vybratVidSolid(model.view === 'cabinet' ? { ...model, view: 'ortho' } : model).model;
}
