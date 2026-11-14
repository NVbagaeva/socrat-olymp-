/**
 * Чертёж условия задач тренажёра №18: только то, что дано.
 *
 * Сцены (sceny.ts, dop/, опорные задачи) рисуют и построения решения:
 * высоту, которой нет в условии, радиусы в точки касания, точку
 * пересечения, засечки равенства, которое надо доказать. Ученику —
 * на листе генератора с «Чертежом к условию» и в тренажёре до
 * подсказок — их видеть не нужно: дополнительные построения — часть
 * решения, а по засечкам «AM = ML» читается ответ пункта а).
 *
 * Здесь — по типу задачи, что из видимого на сцене — построение:
 *   skryt — элементы (id сцены; точка — «t-Имя»): становятся скрытыми,
 *     видны при подсветке своей группы (подсказка, шаг разбора) и на
 *     чертеже учителя (Sostoyanie.uchitel);
 *   vyvod — отрезки, засечки которых — вывод, а не данное: засечки
 *     видны так же — при подсветке и у учителя.
 * Остальное на сцене — данные условия: scripts/check-chertezhi-18.mjs
 * сверяет буквы чертежа условия с текстом задачи.
 */

import type { Element, ZhivayaSkhema } from '@/lib/skhemy/tipy';

export interface Postroeniya18 {
  skryt?: readonly string[];
  vyvod?: readonly string[];
}

export const POSTROENIYA_18: Readonly<Record<string, Postroeniya18>> = {
  /* H — пересечение высот: в условии его нет. */
  'vysoty-cos': { skryt: ['t-H'] },
  /* ∠ALM = ∠LAB и AM = ML — то, что доказывается. */
  'bis-par': { skryt: ['u3'], vyvod: ['AM', 'LM'] },
  /* ∠C₁CB = ∠C₁B₁B — вписанные углы решения. */
  'vysoty-okr': { skryt: ['u2'] },
  /* WA = WI = WC и отрезок AI — доказательство а). */
  'trezubec-centr': { skryt: ['AI', 'WA', 'WI', 'WC'] },
  /* Равные вписанные углы — шаг доказательства подобия. */
  'vpis-hordy': { skryt: ['uA', 'uD'] },
  /* Центр, радиусы в точки касания и равные отрезки касательных — решение. */
  'vpis-pryam': {
    skryt: ['IP', 'IQ', 't-I', 't-P', 't-Q'],
    vyvod: ['AK', 'AP', 'KB', 'BQ'],
  },
  /* Общий угол A — подсказка к методу. */
  'obshchiy-ugol': { skryt: ['uA'] },
  /* O и концы высоты E, F в условии не названы: высота — данное, её точки — нет. */
  'ravnobok-perp': { skryt: ['t-O', 't-E', 't-F'] },
  /* В условии — угол OAC: радиус OC и равенство радиусов — решение;
     основания высот A₁, B₁ вводит решение (высоты видны — без букв). */
  'ok-ortocentr': { skryt: ['OC', 't-A_1', 't-B_1'], vyvod: ['OA', 'OC'] },
  /* Радиус в точку C, прямые углы касания, точка H — решение. */
  'ks-dve-kasatelnye': { skryt: ['OC', 'pB', 'pC', 't-H'], vyvod: ['AB', 'AC'] },
  /* KO = OL — то, что доказывается. */
  'tp-babochka': { vyvod: ['KO', 'OL'] },
  /* Продолжения боковых сторон до P и прямой угол — построение решения. */
  'tp-ugol-90': { skryt: ['BP', 'CP', 'pP', 'PM', 't-P'] },
  /* O — пересечение диагоналей: в условии нет. */
  'diag-trap': { skryt: ['t-O'] },
  /* Радиусы в точки касания — построение; NK = NA = NB — вывод. */
  'kas-ef': { skryt: ['O1A', 'O2B'], vyvod: ['NK'] },
  /* Центр второго квадрата в условии не участвует; CM = MC₂ — удвоение медианы. */
  kvadraty: { skryt: ['t-O_2'], vyvod: ['CM'] },
  /* Равные отрезки касательных — вывод а). */
  'vpis-klm': { vyvod: ['KC', 'MC'] },
  /* BL = CL — вывод. */
  'biss-sred': { vyvod: ['BL', 'CL'] },
  /* Радиусы в точки касания — построение решения. */
  vnevpis: { skryt: ['IaP', 'IaS', 'IbT'] },
  /* Треугольник средних линий — построение решения. */
  'ser-vys': { skryt: ['A1B1', 'B1C1', 'C1A1'], vyvod: ['A1B1'] },
};

/**
 * Условия в формулировке ФИПИ (опорные задачи 656–669), где точки
 * чертежа названы не буквами: «основания трапеции равны 4 и 9», «квадрат
 * с центром O». Тексты ФИПИ не меняются; буквы на чертеже — для решения,
 * а на листе без «Чертежа к условию» чертежа нет. Проверка букв чертежа
 * по тексту (scripts/check-chertezhi-18.mjs) их пропускает.
 */
export const TEKST_FIPI_BEZ_BUKV_18: readonly string[] = ['diag-trap', 'kvadraty', 'kv-gip'];

/** Сцена с чертежом условия: построения решения скрыты, засечки-выводы помечены. */
export function chertezhUsloviya18(tip: string, sk: ZhivayaSkhema): ZhivayaSkhema {
  const p = POSTROENIYA_18[tip];
  if (p === undefined) return sk;
  const skryt = new Set(p.skryt ?? []);
  const vyvod = new Set(p.vyvod ?? []);
  const pometit = (el: Element): Element => {
    let out = el;
    if (skryt.has(el.id)) out = { ...out, skrytyy: true };
    if (out.vid === 'otrezok' && vyvod.has(el.id)) out = { ...out, shtrihiVyvod: true };
    return out;
  };
  return {
    ...sk,
    postroit: (t, rezhim) => {
      const k = sk.postroit(t, rezhim);
      return { ...k, elementy: k.elementy.map(pometit) };
    },
  };
}
