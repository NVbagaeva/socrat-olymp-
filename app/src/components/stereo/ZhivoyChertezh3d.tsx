'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import type { Model } from '@/lib/solid/model';
import type { View } from '@/lib/solid/project';
import type { RenderOptions } from '@/lib/solid/render';

/** Движок рисунка — приезжает только по первому касанию. */
interface Dvizhok {
  renderSolid: (model: Model, options: RenderOptions) => string;
  orthoAt: (azimuth: number, elevation: number) => View;
}

let dvizhok: Promise<Dvizhok> | null = null;
function zagruzit(): Promise<Dvizhok> {
  dvizhok ??= Promise.all([import('@/lib/solid/render'), import('@/lib/solid/project')]).then(
    ([r, p]) => ({ renderSolid: r.renderSolid, orthoAt: p.orthoAt }),
  );
  return dvizhok;
}

/** Подъём взгляда: от почти горизонтального до почти сверху. */
const PODYOM_MIN = 5;
const PODYOM_MAX = 80;
/** Градусов поворота на пиксель перетаскивания. */
const NA_PIKSEL = 0.5;
/** Шаг поворота стрелками клавиатуры. */
const NA_KLAVISHU = 10;
/** Кадр дольше этого — следующий пропускается (слабый телефон). */
const DOLGIY_KADR_MS = 24;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface ZhivoyChertezh3dProps {
  model: Model;
  /** Первый кадр, нарисованный на сборке. */
  svg: string;
  azimuth: number;
  elevation: number;
  /** Подписи шагов, уже набранные KaTeX: [условие, шаг 1, …]. Пусто — без шагов. */
  podpisi: readonly string[];
  className?: string;
}

/**
 * Живой чертёж: поворот перетаскиванием (на телефоне — пальцем вбок,
 * страница при этом листается вверх-вниз как обычно), стрелками
 * клавиатуры и кнопками, шаги решения с выделением элементов шага.
 */
export function ZhivoyChertezh3d({
  model,
  svg,
  azimuth,
  elevation,
  podpisi,
  className,
}: ZhivoyChertezh3dProps) {
  const kholst = useRef<HTMLDivElement>(null);
  const [shag, setShag] = useState(0);
  const [tronut, setTronut] = useState(false);
  /* Взгляд почти сверху: кнопка тогда возвращает вид сбоку. */
  const [sverkhu, setSverkhu] = useState(false);
  const vid = useRef({ az: azimuth, el: elevation });
  const kadr = useRef<number | null>(null);
  const propusk = useRef(false);
  const tyanem = useRef<{ x: number; y: number; az: number; el: number; touch: boolean } | null>(
    null,
  );
  const shagRef = useRef(0);
  const estShagi = podpisi.length > 1;
  const nShagov = podpisi.length - 1;

  /* Перерисовать в ближайшем кадре: несколько движений за кадр — один
     рисунок. Если прошлый кадр рисовался долго (слабый телефон),
     следующий кадр пропускается. */
  const narisovat = useCallback(() => {
    if (kadr.current !== null) {
      return;
    }
    const step = () => {
      if (propusk.current) {
        propusk.current = false;
        kadr.current = requestAnimationFrame(step);
        return;
      }
      kadr.current = null;
      void zagruzit().then(({ renderSolid, orthoAt }) => {
        const node = kholst.current;
        if (node === null) {
          return;
        }
        const t0 = performance.now();
        node.innerHTML = renderSolid(model, {
          view: orthoAt(vid.current.az, vid.current.el),
          ustoychivo: true,
          ...(estShagi ? { shag: shagRef.current } : {}),
        });
        propusk.current = performance.now() - t0 > DOLGIY_KADR_MS;
      });
    };
    kadr.current = requestAnimationFrame(step);
  }, [model, estShagi]);

  useEffect(
    () => () => {
      if (kadr.current !== null) {
        cancelAnimationFrame(kadr.current);
      }
    },
    [],
  );

  const povernut = useCallback(
    (az: number, el: number) => {
      vid.current = { az, el: clamp(el, PODYOM_MIN, PODYOM_MAX) };
      setTronut(true);
      setSverkhu(vid.current.el > 60);
      narisovat();
    },
    [narisovat],
  );

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }
    /* Движок — заранее, пока палец ещё не сдвинулся. */
    void zagruzit();
    tyanem.current = {
      x: event.clientX,
      y: event.clientY,
      az: vid.current.az,
      el: vid.current.el,
      touch: event.pointerType === 'touch',
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const t = tyanem.current;
    if (t === null) {
      return;
    }
    const dx = event.clientX - t.x;
    const dy = event.clientY - t.y;
    /* Пальцем — только вбок: вертикальный жест остаётся прокрутке страницы. */
    povernut(t.az - dx * NA_PIKSEL, t.touch ? t.el : t.el + dy * NA_PIKSEL);
  }

  function onPointerUp() {
    tyanem.current = null;
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const { az, el } = vid.current;
    const shift: Record<string, [number, number]> = {
      ArrowLeft: [NA_KLAVISHU, 0],
      ArrowRight: [-NA_KLAVISHU, 0],
      ArrowUp: [0, NA_KLAVISHU],
      ArrowDown: [0, -NA_KLAVISHU],
    };
    const d = shift[event.key];
    if (d === undefined) {
      return;
    }
    event.preventDefault();
    povernut(az + d[0], el + d[1]);
  }

  function sbrosit() {
    povernut(azimuth, elevation);
    setTronut(false);
  }

  function sverhu() {
    povernut(vid.current.az, vid.current.el > 60 ? elevation : PODYOM_MAX);
  }

  function pereyti(k: number) {
    const next = clamp(k, 0, nShagov);
    shagRef.current = next;
    setShag(next);
    narisovat();
  }

  return (
    <figure className={clsx('z3d', className)}>
      <div
        className="z3d__vid"
        role="group"
        tabIndex={0}
        aria-label={`${model.alt}. Чертёж можно поворачивать: перетащите его или нажимайте стрелки.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <div
          ref={kholst}
          className="z3d__kholst solid-wrap"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      <div className="z3d__knopki">
        <Button variant="secondary" size="sm" onClick={sbrosit}>
          Сбросить вид
        </Button>
        <Button variant="secondary" size="sm" onClick={sverhu}>
          {sverkhu ? 'Сбоку' : 'Сверху'}
        </Button>
        {tronut ? null : (
          <span className="z3d__namek" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M4 12h16M4 12l3-3M4 12l3 3M20 12l-3-3M20 12l-3 3" />
            </svg>
            Потяните, чтобы повернуть
          </span>
        )}
      </div>

      {estShagi ? (
        <figcaption className="z3d__shagi">
          <div className="z3d__shagi-nav">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => pereyti(shag - 1)}
              disabled={shag === 0}
            >
              Назад
            </Button>
            <span className="z3d__shag t-sm">
              {shag === 0 ? 'Условие' : `Шаг ${shag} из ${nShagov}`}
            </span>
            <Button size="sm" onClick={() => pereyti(shag + 1)} disabled={shag === nShagov}>
              Далее
            </Button>
          </div>
          <p
            className="z3d__podpis"
            aria-live="polite"
            dangerouslySetInnerHTML={{ __html: podpisi[shag] ?? '' }}
          />
        </figcaption>
      ) : null}
    </figure>
  );
}
