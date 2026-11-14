/**
 * Тренировка №11: ключи задач и перенос записи прежнего тренажёра.
 * Сама логика — общая (lib/trening/bank.ts).
 *
 * Прежний тренажёр №11 (общая панель фильтров, components/trenazher)
 * хранил тренировку так: { v: 1, rezhim, seed, items: [{ k: «DP-07|b12» }] };
 * ещё раньше — { zadachi: [[вид, подтип, номер или seed]], podskazki }.
 * Обе записи открываются в новом тренажёре на той же задаче: ключи
 * задач те же. Задача прежнего генератора («DP-07|n…») в банк не входит
 * — на её месте встаёт задача того же подтипа из банка, которой ещё нет
 * в тренировке (номера задач и отметки не сдвигаются). Режим «Без
 * подсказок» остаётся без подсказок; «На время» — с таймером.
 */

import {
  isPayloadBanka,
  razobratZapis,
  type KatalogBanka,
  type PayloadBanka,
  type TaskBanka,
} from '@/lib/trening/bank';
import { isRecord } from '@/lib/trainerSession/restore';
import { KLYUCH11 } from './dannye';

export { KLYUCH11 };

const PODTIP = /^(RZ|PR|SM|DP|PT|VD|OK|RB|PG)-\d\d$/;

export function isTrenazher11Payload(value: unknown): value is PayloadBanka {
  return isPayloadBanka(value, KLYUCH11);
}

/** Ключ прежней записи → ключ задачи банка; «n…» — null (задача генератора). */
function klyuchIzPrezhnego(k: string): { p: string; id: string | null } | null {
  const [p = '', hvost = ''] = k.split('|');
  if (!PODTIP.test(p) || hvost === '') return null;
  if (hvost.startsWith('n')) return { p, id: null };
  const id = `${p}|${hvost}`;
  return KLYUCH11.test(id) ? { p, id } : null;
}

/**
 * Запись тренировки из хранилища: новый формат, прежний формат №11
 * (панель фильтров) или самый ранний. Чужое и повреждённое — null.
 */
export function razobratZapis11(packed: unknown, katalog: KatalogBanka): PayloadBanka | null {
  const nov = razobratZapis(packed, KLYUCH11);
  if (nov !== null) return nov;
  if (!isRecord(packed)) return null;
  /* Общий разбор (TrenazherBanka) уже отверг запись нового формата — здесь
     только прежние форматы №11. */

  let syrye: { k: string }[] = [];
  let control = false;
  if (packed['v'] === 1 && Array.isArray(packed['items'])) {
    syrye = (packed['items'] as unknown[]).flatMap((x) =>
      isRecord(x) && typeof x['k'] === 'string' ? [{ k: x['k'] }] : [],
    );
    control = packed['rezhim'] === 'bez';
  } else if (Array.isArray(packed['zadachi'])) {
    syrye = (packed['zadachi'] as unknown[]).flatMap((z) => {
      if (!Array.isArray(z) || typeof z[1] !== 'string') return [];
      const [vid, id, otkuda] = z as [unknown, string, unknown];
      if (vid === 'new') return [{ k: `${id}|n` }];
      const bukva = vid === 'bank' ? 'b' : vid === 'razminka' ? 'r' : vid === 'analog' ? 'a' : null;
      return bukva === null || typeof otkuda !== 'number' ? [] : [{ k: `${id}|${bukva}${otkuda}` }];
    });
    control = packed['podskazki'] === false;
  } else {
    return null;
  }

  const razobrano = syrye.map((x) => klyuchIzPrezhnego(x.k));
  if (razobrano.length === 0 || razobrano.some((x) => x === null)) return null;
  const zanyato = new Set(razobrano.flatMap((x) => (x === null || x.id === null ? [] : [x.id])));
  const tasks: TaskBanka[] = [];
  for (const x of razobrano) {
    if (x === null) return null;
    if (x.id !== null) {
      tasks.push({ id: x.id, p: x.p });
      continue;
    }
    const z = katalog[x.p];
    const svobodnaya = [...(z?.f ?? []), ...(z?.a ?? [])].find((id) => !zanyato.has(id));
    if (svobodnaya === undefined) return null;
    zanyato.add(svobodnaya);
    tasks.push({ id: svobodnaya, p: x.p });
  }
  return { tasks, control, timer: true };
}
