'use client';

import { Suspense, lazy, useState, type ReactNode } from 'react';
import { SHAPKA3 } from '@/content/zadanie3/spravka';
import type { Model } from '@/lib/solid/model';
import { telo } from '@/lib/solid/sechenie';
import '@/components/tasks/zadanie3/zadanie3.css';

/* Построитель — отдельным куском: грузится по кнопке. */
const PostroitSechenie = lazy(() =>
  import('./PostroitSechenie').then((m) => ({ default: m.PostroitSechenie })),
);

/**
 * Чертёж задачи с кнопкой «Сечение»: по ней вместо чертежа — построение
 * сечения в той же фигуре (PostroitSechenie), обратно — «К чертежу».
 * У тел без многогранника (цилиндр, конус, шар) кнопки нет.
 * Тренажёр и опорные задачи №3.
 */
export function SSecheniem({ model, children }: { model: Model; children: ReactNode }) {
  const [vkl, setVkl] = useState(false);
  if (telo(model) === null) return <>{children}</>;
  return (
    <div className="z3-s-secheniem">
      {vkl ? (
        <Suspense fallback={children}>
          <PostroitSechenie model={model} />
        </Suspense>
      ) : (
        children
      )}
      <button
        type="button"
        className="stk-ssylka z3-s-secheniem__knopka"
        aria-pressed={vkl}
        aria-label={vkl ? SHAPKA3.kChertezhu : SHAPKA3.sechenieDlinno}
        onClick={() => setVkl(!vkl)}
      >
        {vkl ? SHAPKA3.kChertezhu : SHAPKA3.sechenieDlinno}
      </button>
    </div>
  );
}
