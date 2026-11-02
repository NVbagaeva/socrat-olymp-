import type { ReactNode } from 'react';
import { PIKTOGRAMMY, RAZDELY } from './piktogrammy';

/**
 * Пиктограмма подтипа в окне подтипов «Собрать вариант»: тонкая линия
 * #0c3ebc, точки-узлы, лёгкая голубая заливка — как миниатюры разделов
 * (public/images/task-01.svg). Нет своей у подтипа — пиктограмма раздела.
 */
export function Piktogramma({ ege, id }: { ege: number; id: string }) {
  const risunok: ReactNode = PIKTOGRAMMY[`${ege}:${id}`] ?? RAZDELY[ege] ?? null;
  return (
    <svg className="pikt" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {risunok}
    </svg>
  );
}
