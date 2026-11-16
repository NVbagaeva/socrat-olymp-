'use client';

/**
 * Прогресс ученика на карточках банка (docs/design-audit.md, 5.2) — по
 * той же модели, что «Карта ЕГЭ» (lib/karta/model.ts): тип освоен при
 * 3 верных из последних 5 попыток, раздел — при 80 % освоенных типов.
 * Ключ — номер хранения раздела (ExamTask.hranenie). Разделы без
 * попыток в карту прогресса не попадают: карточка остаётся чистой.
 */

import { useMemo, useState } from 'react';
import { KARTA_RAZDELY } from './katalog';
import { postroitKartu } from './model';
import { useZhurnaly } from './zhurnaly';

export interface ProgressKartochki {
  dolya: number;
  podpis: string;
  gotovo: boolean;
}

export function useProgressBanka(): ReadonlyMap<number, ProgressKartochki> {
  const zhurnaly = useZhurnaly();
  const [seychas] = useState(() => Date.now());
  return useMemo(() => {
    const out = new Map<number, ProgressKartochki>();
    const karta = postroitKartu(KARTA_RAZDELY, zhurnaly, seychas);
    for (const o of karta.oblasti) {
      if (o.sostoyanie === 'osvoeno') {
        out.set(o.no, { dolya: 1, podpis: 'готово', gotovo: true });
      } else if (o.sostoyanie === 'v-processe') {
        out.set(o.no, {
          dolya: o.procent / 100,
          podpis: `начато · ${Math.round(o.procent)} %`,
          gotovo: false,
        });
      }
    }
    return out;
  }, [zhurnaly, seychas]);
}
