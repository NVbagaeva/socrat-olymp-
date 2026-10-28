'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { Model } from '@/lib/solid/model';
import type { View } from '@/lib/solid/project';
import type { RenderOptions, Tema } from '@/lib/solid/render';
import { VrashchaemyyChertezh } from './vrashchenie/VrashchaemyyChertezh';
import type { Vid } from './vrashchenie/useVrashchenie';

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
  /**
   * Шаг снаружи: разбор держит шаг сам, чтобы текст решения и чертёж
   * шли вместе. Не задан — шаг живёт внутри чертежа.
   */
  shag?: number;
  onShag?: (shag: number) => void;
  /** Без своих кнопок шагов: их рисует разбор рядом с текстом решения. */
  bezNavigatsii?: boolean;
  /** Тема движка: «стекло» новых экранов №3 или строгий чертёж (по умолчанию). */
  tema?: Tema;
  /** С какого шага открыть чертёж (внутренний шаг): по умолчанию с условия. */
  shagSnachala?: number;
  className?: string;
  /** Чертёж повернули: ракурс для листа печати (генератор). */
  onPovorot?: (vid: Vid) => void;
}

/**
 * Живой чертёж: вращение руками (VrashchaemyyChertezh — палец, мышь,
 * щипок, колесо, кнопки вида), шаги решения с выделением элементов шага.
 */
export function ZhivoyChertezh3d({
  model,
  svg,
  azimuth,
  elevation,
  podpisi,
  shag: shagSnaruzhi,
  onShag,
  bezNavigatsii = false,
  tema = 'pechat',
  shagSnachala = 0,
  className,
  onPovorot,
}: ZhivoyChertezh3dProps) {
  const kholst = useRef<HTMLDivElement>(null);
  const [shagVnutri, setShag] = useState(shagSnachala);
  const shag = shagSnaruzhi ?? shagVnutri;
  const vid = useRef({ az: azimuth, el: elevation });
  const propusk = useRef(false);
  /* Стороны подписей прошлого кадра: при вращении подписи не прыгают. */
  const pamyat = useRef(new Map<string, number>());
  const shagRef = useRef(shagSnachala);
  const estShagi = podpisi.length > 1;
  const nShagov = podpisi.length - 1;

  /* Перерисовать кадр. Если прошлый кадр рисовался долго (слабый
     телефон), следующий пропускается. */
  const narisovat = useCallback(() => {
    if (propusk.current) {
      propusk.current = false;
      return;
    }
    void zagruzit().then(({ renderSolid, orthoAt }) => {
      const node = kholst.current;
      if (node === null) {
        return;
      }
      const t0 = performance.now();
      node.innerHTML = renderSolid(model, {
        view: orthoAt(vid.current.az, vid.current.el),
        ustoychivo: true,
        tema,
        pamyatPodpisey: pamyat.current,
        ...(estShagi ? { shag: shagRef.current } : {}),
      });
      propusk.current = performance.now() - t0 > DOLGIY_KADR_MS;
    });
  }, [model, estShagi, tema]);

  const onVid = useCallback(
    (v: Vid) => {
      if (v.az === vid.current.az && v.el === vid.current.el) return;
      vid.current = { az: v.az, el: v.el };
      narisovat();
    },
    [narisovat],
  );

  function pereyti(k: number) {
    const next = clamp(k, 0, nShagov);
    if (onShag !== undefined) {
      onShag(next);
      return;
    }
    shagRef.current = next;
    setShag(next);
    propusk.current = false;
    narisovat();
  }

  /* Шаг сменили снаружи (кнопка у шага в тексте разбора) — перерисовать. */
  useEffect(() => {
    if (shagSnaruzhi === undefined || shagSnaruzhi === shagRef.current) {
      return;
    }
    shagRef.current = shagSnaruzhi;
    propusk.current = false;
    narisovat();
  }, [shagSnaruzhi, narisovat]);

  return (
    <figure className={clsx('z3d', className)}>
      <VrashchaemyyChertezh
        az={azimuth}
        el={elevation}
        onVid={onVid}
        alt={model.alt}
        className="z3d__vid"
        {...(onPovorot === undefined ? {} : { onPovorot })}
      >
        <div
          ref={kholst}
          className="z3d__kholst solid-wrap"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </VrashchaemyyChertezh>

      {estShagi && !bezNavigatsii ? (
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
