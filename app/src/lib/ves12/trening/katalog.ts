/**
 * Каталог тренажёра №12 на сборке: набор движка → шаблоны задач. Те же
 * 748 шаблонов, что у прежнего тренажёра (lib/ves12/trenazher12.ts,
 * zadachi12): задачи открытого банка ФИПИ — `f`, остальные — `a`.
 * Условий и ответов в каталоге нет — задачу строит движок в браузере.
 */

import type { KatalogBanka } from '@/lib/trening/bank';
import { zadachi12 } from '../trenazher12';

export function katalog12(tip?: string): KatalogBanka {
  const out: KatalogBanka = {};
  for (const ref of zadachi12(tip)) {
    const nabor = (out[ref.podtip] ??= { f: [], a: [] });
    (ref.istochnik === 'fipi' ? nabor.f : nabor.a).push(ref.key);
  }
  return out;
}
