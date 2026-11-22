'use client';

/**
 * Задачи тренажёра №1 в браузере — загрузчик общего тренажёра по банку
 * (lib/trening/zagruzka.ts: интерфейс Zagruzka). Файлов прототипов у
 * №1 нет: задачу по ключу собирает движок планиметрии (sborka.ts), он
 * приезжает один раз вместе с KaTeX по первой задаче. Собранная задача
 * и её разбор кешируются: чертежи шагов не строятся заново.
 */

import type { Zagruzka } from '../../trening/zagruzka';
import type { Reshenie1T, Sobrannaya1, Zadacha1T } from './sborka';

function createZagruzka1(): Zagruzka<Zadacha1T, Reshenie1T, null> {
  let sobrat: ((id: string) => Sobrannaya1 | null) | null = null;
  let zhdyot: Promise<void> | null = null;
  const kesh = new Map<string, Sobrannaya1 | null>();

  function vzyat(id: string): Sobrannaya1 | null {
    if (sobrat === null) return null;
    if (!kesh.has(id)) kesh.set(id, sobrat(id));
    return kesh.get(id) ?? null;
  }

  return {
    async zagruzit() {
      zhdyot ??= import('./sborka').then((m) => {
        sobrat = m.sobrat1;
      });
      zhdyot.catch(() => {
        zhdyot = null;
      });
      await zhdyot;
    },
    izKesha(id) {
      return vzyat(id)?.z;
    },
    reshenie(z) {
      return vzyat(z.id)?.s ?? null;
    },
    /* Условие собирается уже набранным. */
    nabrat: (text) => text,
    prototip: () => null,
  };
}

export const ZAGRUZKA1 = createZagruzka1();
