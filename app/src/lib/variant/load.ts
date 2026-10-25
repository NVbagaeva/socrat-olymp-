/**
 * Загрузка разделов в браузере: модуль адаптера динамическим импортом
 * (у каждого раздела свой кусок сборки) и данные банка. Экран фильтров
 * их не грузит — только первое «Сформировать».
 *
 * Готовые разделы кешируются на время жизни страницы: повторная сборка
 * и «заменить» обходятся без сети.
 */

import type { EgeNo, SectionAdapter, SectionModule } from './types';

/* Пути импорта — строками: сборщику нужны статические адреса кусков. */
const MODULES: Record<EgeNo, () => Promise<{ section: SectionModule }>> = {
  1: () => import('./adapters/z01'),
  2: () => import('./adapters/z02'),
  3: () => import('./adapters/z03'),
  4: () => import('./adapters/z04'),
  5: () => import('./adapters/z05'),
  6: () => import('./adapters/z06'),
  7: () => import('./adapters/z07'),
  8: () => import('./adapters/z08'),
  9: () => import('./adapters/z09'),
  10: () => import('./adapters/z10'),
  11: () => import('./adapters/z11'),
  12: () => import('./adapters/z12'),
  13: () => import('./adapters/z13'),
};

const ready = new Map<EgeNo, Promise<SectionAdapter>>();

function loadOne(n: EgeNo): Promise<SectionAdapter> {
  let p = ready.get(n);
  if (p === undefined) {
    p = MODULES[n]().then(async ({ section }) => section.init(await section.load()));
    /* Сбой сети не застревает в кеше: следующая попытка грузит заново. */
    p.catch(() => ready.delete(n));
    ready.set(n, p);
  }
  return p;
}

/** Разделы для заданий партии. Не загрузился раздел — его нет в карте. */
export async function loadAdapters(
  numbers: readonly EgeNo[],
): Promise<{ adapters: Map<EgeNo, SectionAdapter>; failed: EgeNo[] }> {
  const results = await Promise.allSettled(numbers.map((n) => loadOne(n)));
  const adapters = new Map<EgeNo, SectionAdapter>();
  const failed: EgeNo[] = [];
  results.forEach((r, i) => {
    const n = numbers[i] as EgeNo;
    if (r.status === 'fulfilled') adapters.set(n, r.value);
    else failed.push(n);
  });
  return { adapters, failed };
}
