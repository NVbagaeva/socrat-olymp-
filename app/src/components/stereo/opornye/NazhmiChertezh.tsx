'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { ORTHO_AZIMUTH, ORTHO_ELEVATION, orthoAt } from '@/lib/solid/project';
import { renderSolid } from '@/lib/solid/render';
import type { ZadachaOp3Sealed } from '@/lib/stereo/opornye3/seal';
import { VrashchaemyyChertezh } from '../vrashchenie/VrashchaemyyChertezh';
import type { Vid } from '../vrashchenie/useVrashchenie';

/** Цель касания на экране не уже этого, px. */
const CEL_PX = 44;

/**
 * Чертёж задачи «нажми на чертеже»: крупно, «стеклом», вращается руками
 * (VrashchaemyyChertezh: палец, мышь, щипок, кнопки вида). Короткое
 * касание без сдвига выбирает цель, перетаскивание — вращает. Над
 * каждой целью — прозрачная полоса касания (renderSolid, celi), её
 * ширина пересчитывается под масштаб рисунка, чтобы на телефоне она
 * была не меньше 44 px.
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
  const az0 = task.model.rakurs?.azimuth ?? ORTHO_AZIMUTH;
  const el0 = task.model.rakurs?.elevation ?? ORTHO_ELEVATION;
  const [vid, setVid] = useState<Vid>({ az: az0, el: el0, zum: 1 });
  /* Единиц рисунка на пиксель экрана: от неё — ширина полосы касания. */
  const [naPiksel, setNaPiksel] = useState(1);
  const kholst = useRef<HTMLDivElement>(null);
  /* Стороны подписей прошлого кадра: при вращении подписи не прыгают. */
  const [pamyat] = useState(() => new Map<string, number>());
  const povernut = vid.az !== az0 || vid.el !== el0;

  const svg = useMemo(
    () =>
      renderSolid(task.model, {
        tema: 'ekran',
        ...(povernut
          ? { view: orthoAt(vid.az, vid.el), ustoychivo: true, pamyatPodpisey: pamyat }
          : {}),
        celi: order.map((c) => ({ id: c.id, points: c.points })),
        vybrano: value === '' ? [] : [value],
        celShirina: Math.max(22, (CEL_PX * naPiksel) / vid.zum),
      }),
    [task.model, order, value, povernut, vid.az, vid.el, vid.zum, naPiksel, pamyat],
  );

  useEffect(() => {
    const node = kholst.current;
    if (node === null || typeof ResizeObserver === 'undefined') return undefined;
    const izmerit = () => {
      const el = node.querySelector('svg');
      const w = el?.viewBox.baseVal.width ?? 0;
      const px = el?.getBoundingClientRect().width ?? 0;
      if (w > 0 && px > 0) {
        /* Прямоугольник уже увеличен масштабом окна — делим обратно. */
        const next = Math.round((w / px) * vid.zum * 100) / 100;
        setNaPiksel((prev) => (Math.abs(prev - next) > 0.02 ? next : prev));
      }
    };
    izmerit();
    const ro = new ResizeObserver(izmerit);
    ro.observe(node);
    return () => ro.disconnect();
  }, [vid.zum]);

  return (
    <div className={clsx('o3-nazhmi', proverka !== null && `is-${proverka}`)}>
      <VrashchaemyyChertezh az={az0} el={el0} onVid={setVid} alt={task.model.alt}>
        <div
          ref={kholst}
          className="o3-nazhmi__ris"
          onClick={(event) => {
            if (disabled) return;
            const target = (event.target as Element).closest('[data-cel]');
            const id = target?.getAttribute('data-cel');
            if (id) onPick(id);
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </VrashchaemyyChertezh>
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
