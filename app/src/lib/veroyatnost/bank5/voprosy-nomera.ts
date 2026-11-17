/**
 * Номера прототипов №5 «другой вопрос к той же истории»
 * (derevo-voprosy.ts): с p5-54 подряд, по два на историю — сначала
 * противоположное событие, потом один путь. Отдельным модулем: тексты
 * раздела (content/veroyatnost5.ts) берут номера отсюда, не подтягивая
 * весь банк в браузер.
 */
export const PERVYY_NOMER_VOPROSOV = 54;

/** Сколько историй получили новые вопросы: 20 с двумя группами и 7 с тремя. */
export const ISTORIY_S_VOPROSAMI = 27;

/** Вид вопроса по номеру прототипа; не из этого диапазона — null. */
export function vidVoprosa(id: string): 'ne' | 'put' | null {
  const n = Number(id.replace(/^p5-/, ''));
  if (!Number.isInteger(n) || n < PERVYY_NOMER_VOPROSOV) return null;
  const k = n - PERVYY_NOMER_VOPROSOV;
  if (k >= ISTORIY_S_VOPROSAMI * 2) return null;
  return k % 2 === 0 ? 'ne' : 'put';
}
