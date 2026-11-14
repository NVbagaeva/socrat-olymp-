'use client';

import { Polosa } from '@/components/tasks/steklo';
import { STSENA } from '@/content/stsena';

/**
 * Строка прогресса в шапке раздела: «Решено 12 из 92» и оранжевая
 * полоса под ней. У гостя без попыток — «Пока ничего не решено», полоса
 * пустая.
 *
 * Сам счёт у каждого раздела свой — он приходит из клиентского островка
 * этого раздела. Здесь только вид, чтобы строка выглядела одинаково
 * везде.
 */
export function StrokaProgressa({ n, iz }: { n: number; iz: number }) {
  return (
    <>
      <p className="stsena__progress-text">{n === 0 ? STSENA.nichego : STSENA.resheno(n, iz)}</p>
      <Polosa dolya={iz === 0 ? 0 : n / iz} ton="terra" />
    </>
  );
}
