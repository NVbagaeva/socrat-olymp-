'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { clsx } from 'clsx';
import { ORTHO_AZIMUTH, ORTHO_ELEVATION, orthoAt } from '@/lib/solid/project';
import { renderSolid } from '@/lib/solid/render';
import type { ZadachaOp3Sealed } from '@/lib/stereo/opornye3/seal';
import { OPORNYE_3 } from '@/content/stereo/opornye3';
import { IkMinus, IkPlyus, IkPovorot } from '../metodika/Ikonki';

/** Цель касания на экране не уже этого, px. */
const CEL_PX = 44;
const MASHTABY = [1, 1.25, 1.5] as const;

/**
 * Чертёж задачи «нажми на чертеже»: крупно, «стеклом», с кнопками
 * «крупнее / мельче / повернуть». Над каждой целью — прозрачная
 * полоса касания (renderSolid, celi), её ширина пересчитывается под
 * масштаб рисунка, чтобы на телефоне она была не меньше 44 px.
 */
export function NazhmiRisunok({
  task,
  value,
  onPick,
  disabled,
  proverka,
}: {
  task: ZadachaOp3Sealed;
  value: string;
  onPick: (id: string) => void;
  disabled: boolean;
  proverka: 'right' | 'wrong' | null;
}) {
  const celi = useMemo(() => task.celi ?? [], [task.celi]);
  /* Многоугольники — под отрезками: отрезок внутри треугольника тоже
     можно выбрать. */
  const order = useMemo(() => [...celi].sort((a, b) => b.points.length - a.points.length), [celi]);
  const [mashtab, setMashtab] = useState(0);
  const [povorot, setPovorot] = useState(0);
  /* Единиц рисунка на пиксель экрана: от неё — ширина полосы касания. */
  const [naPiksel, setNaPiksel] = useState(1);
  const kholst = useRef<HTMLDivElement>(null);

  const svg = useMemo(() => {
    const az = (task.model.rakurs?.azimuth ?? ORTHO_AZIMUTH) + povorot;
    const el = task.model.rakurs?.elevation ?? ORTHO_ELEVATION;
    return renderSolid(task.model, {
      tema: 'ekran',
      ...(povorot === 0 ? {} : { view: orthoAt(az, el) }),
      celi: order.map((c) => ({ id: c.id, points: c.points })),
      vybrano: value === '' ? [] : [value],
      celShirina: Math.max(22, CEL_PX * naPiksel),
    });
  }, [task.model, order, value, povorot, naPiksel]);

  useEffect(() => {
    const node = kholst.current;
    if (node === null || typeof ResizeObserver === 'undefined') return undefined;
    const izmerit = () => {
      const el = node.querySelector('svg');
      const w = el?.viewBox.baseVal.width ?? 0;
      const px = el?.getBoundingClientRect().width ?? 0;
      if (w > 0 && px > 0) {
        const next = Math.round((w / px) * 100) / 100;
        setNaPiksel((prev) => (Math.abs(prev - next) > 0.02 ? next : prev));
      }
    };
    izmerit();
    const ro = new ResizeObserver(izmerit);
    ro.observe(node);
    return () => ro.disconnect();
  }, [mashtab]);

  return (
    <div className={clsx('o3-nazhmi', proverka !== null && `is-${proverka}`)}>
      <div className="o3-nazhmi__okno">
        <div
          ref={kholst}
          className="o3-nazhmi__ris"
          style={
            {
              width: `${(MASHTABY[mashtab] ?? 1) * 100}%`,
              '--o3-zum': MASHTABY[mashtab] ?? 1,
            } as CSSProperties
          }
          onClick={(event) => {
            if (disabled) return;
            const target = (event.target as Element).closest('[data-cel]');
            const id = target?.getAttribute('data-cel');
            if (id) onPick(id);
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      <div className="o3-zum" role="group" aria-label="Чертёж">
        <button
          type="button"
          className="o3-zum__btn"
          aria-label={OPORNYE_3.chertezh.krupnee}
          disabled={mashtab === MASHTABY.length - 1}
          onClick={() => setMashtab(mashtab + 1)}
        >
          <IkPlyus />
        </button>
        <button
          type="button"
          className="o3-zum__btn"
          aria-label={OPORNYE_3.chertezh.melche}
          disabled={mashtab === 0}
          onClick={() => setMashtab(mashtab - 1)}
        >
          <IkMinus />
        </button>
        <button
          type="button"
          className="o3-zum__btn"
          aria-label={OPORNYE_3.chertezh.povernut}
          onClick={() => setPovorot((povorot + 30) % 360)}
        >
          <IkPovorot />
        </button>
      </div>
    </div>
  );
}

/**
 * Те же цели кнопками — сеткой карточек в две колонки, с отметкой:
 * выбрать можно с клавиатуры и экранной читалкой. Ответ один, поэтому
 * отметка снимается с прежней цели, когда выбрана новая.
 */
export function NazhmiVarianty({
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
  return (
    <ul className="o3-var" aria-labelledby={labelId}>
      {(task.celi ?? []).map((c) => (
        <li key={c.id}>
          <button
            type="button"
            className={clsx(
              'o3-var__btn',
              value === c.id && 'is-chosen',
              value === c.id && proverka !== null && `is-${proverka}`,
            )}
            aria-pressed={value === c.id}
            disabled={disabled}
            onClick={() => onPick(c.id)}
          >
            <span className="o3-var__box" aria-hidden="true" />
            <span className="o3-var__t" dangerouslySetInnerHTML={{ __html: c.labelHtml }} />
          </button>
        </li>
      ))}
    </ul>
  );
}
