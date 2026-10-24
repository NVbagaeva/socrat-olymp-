/**
 * Верные ответы версии варианта: часть 1 — запись бланка по порядку
 * заданий, часть 2 — поля автопроверки по пунктам. На сервере это
 * таблица variant_keys (заполняется при выкладке из этих же данных);
 * в пробном кабинете ключ собирается здесь, в браузере.
 */

import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';
import type { Pole } from '@/lib/chast2/sravnenie';

export interface Klyuchi {
  part1: { taskNo: number; answer: string }[];
  part2: Chast2Zadacha[];
}

export async function klyuchi(code: string, versiya: number): Promise<Klyuchi | null> {
  const [{ loadSet }, { part2For }] = await Promise.all([
    import('@/lib/variant/online/work'),
    import('@/lib/variant/online/sessionUi'),
  ]);
  const loaded = await loadSet(code);
  const tasks = loaded?.set.variants[versiya - 1]?.tasks;
  if (tasks === undefined) return null;
  return {
    part1: tasks.map((t) => ({ taskNo: t.egeNumber, answer: t.answer })),
    part2: (await part2For({ code, variant: versiya })) ?? [],
  };
}

/** Поле пункта по номеру задания и пункту ('0', '1', …). */
export function poleKlyucha(k: Klyuchi, taskNo: number, punkt: string): Pole | null {
  const z = k.part2.find((x) => x.no === taskNo);
  return z?.punkty[Number(punkt)]?.pole ?? null;
}
