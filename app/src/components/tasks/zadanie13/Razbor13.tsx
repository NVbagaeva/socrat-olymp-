'use client';

import { TRENAZHER_13 } from '@/content/zadanie13';
import type { Razbor13 } from '@/lib/zadanie13/opornye/seal';
import { openText } from '@/lib/zadanie13/secret';
import type { Zadacha13T } from '@/lib/zadanie13/trenazher/zadacha';

/** Закрытый блок задачи (подсказки, оформление, разбор) — по отпечатку ответа. */
export function otkryt13<T>(z: Zadacha13T, blob: string): T | null {
  try {
    return JSON.parse(openText(blob, z.seal)) as T;
  } catch {
    return null;
  }
}

/** Решение по шагам: на экране задачи и в разборе на итогах. */
export function Razbor13Blok({ razbor }: { razbor: Razbor13 }) {
  return (
    <section className="z13-oreshenie" aria-label={TRENAZHER_13.reshenie}>
      <p className="z13-oreshenie__title">{TRENAZHER_13.reshenie}</p>
      <div className="z13-reshenie" dangerouslySetInnerHTML={{ __html: razbor.html }} />
      <p className="z13-otvet">
        {TRENAZHER_13.otvet}: {razbor.otvet}
      </p>
    </section>
  );
}
