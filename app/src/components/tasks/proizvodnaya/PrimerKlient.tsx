'use client';

import { useMemo } from 'react';
import { generate, opornayaSeed } from '@/lib/proizvodnaya/generate';
import { PrimerIzZadachi } from './Primer9';

/**
 * Разобранный пример прототипа, собранный в браузере по нажатию:
 * один и тот же seed опорной задачи (opornayaSeed), поэтому пример
 * совпадает с тем, что на листе учителя. Модуль грузится лениво —
 * генератор в страницу «О задании» заранее не попадает.
 */
export default function PrimerKlient({ id, title }: { id: string; title: string }) {
  const task = useMemo(() => {
    try {
      return generate(id, opornayaSeed(id));
    } catch {
      return null;
    }
  }, [id]);
  return task === null ? (
    <p className="z9-about__hint">Пример для этого типа пока недоступен.</p>
  ) : (
    <PrimerIzZadachi task={task} title={title} />
  );
}
