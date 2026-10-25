'use client';

import { useMemo } from 'react';
import { clsx } from 'clsx';
import { renderSolid } from '@/lib/solid/render';
import type { ZadachaOp3Sealed } from '@/lib/stereo/opornye3/seal';

/**
 * «Нажми на чертеже»: отрезок или треугольник выбирают касанием. Над
 * каждым — прозрачная широкая полоса (renderSolid, опция celi), по
 * которой легко попасть пальцем; выбранное подсвечено. Те же цели —
 * кнопками под чертежом: с клавиатуры и экранной читалкой.
 */
export function NazhmiChertezh({
  task,
  value,
  onPick,
  disabled,
  proverka,
  labelId,
}: {
  task: ZadachaOp3Sealed;
  value: string;
  onPick: (id: string) => void;
  disabled: boolean;
  proverka: 'right' | 'wrong' | null;
  labelId: string;
}) {
  const celi = useMemo(() => task.celi ?? [], [task.celi]);
  /* Многоугольники — под отрезками: отрезок внутри треугольника тоже
     можно выбрать. */
  const order = useMemo(
    () => [...celi].sort((a, b) => b.points.length - a.points.length),
    [celi],
  );
  const svg = useMemo(
    () =>
      renderSolid(task.model, {
        celi: order.map((c) => ({ id: c.id, points: c.points })),
        vybrano: value === '' ? [] : [value],
      }),
    [task.model, order, value],
  );
  return (
    <div className={clsx('o3-nazhmi', proverka !== null && `is-${proverka}`)}>
      <div
        className="o3-nazhmi__ris"
        onClick={(event) => {
          if (disabled) return;
          const target = (event.target as Element).closest('[data-cel]');
          const id = target?.getAttribute('data-cel');
          if (id) onPick(id);
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="o3-nazhmi__knopki" role="group" aria-labelledby={labelId}>
        {celi.map((c) => (
          <button
            key={c.id}
            type="button"
            className={clsx(
              'o3-cel',
              value === c.id && 'is-chosen',
              value === c.id && proverka !== null && `is-${proverka}`,
            )}
            aria-pressed={value === c.id}
            disabled={disabled}
            onClick={() => onPick(c.id)}
            dangerouslySetInnerHTML={{ __html: c.labelHtml }}
          />
        ))}
      </div>
    </div>
  );
}
