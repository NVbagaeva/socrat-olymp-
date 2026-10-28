'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { assetUrl } from '@/lib/assetUrl';
import type { Kristall3d, TochkaId } from './kristall3d';

/**
 * Кристалл героя для демо направлений. Целиком в кадре, не срезан краем.
 *
 * В покое — готовый рендер (тот же файл, что в герое главной, вертикальный
 * кадр): он лёгкий и красивый. Первое касание, перетаскивание или стрелка
 * клавиатуры подгружают живую модель (kristall3d.ts, three.js) и меняют
 * рендер на неё — дальше фигура вращается пальцем и мышью, как чертежи
 * стереометрии на сайте: пальцем — вбок, вертикальный жест остаётся
 * прокрутке страницы; мышью — в обе стороны.
 *
 * Подписи (направление «Чертёж») — стеклянные ярлыки у точек фигуры: до
 * подгрузки стоят по рендеру, после — следуют за моделью.
 */

export interface KristallPodpis {
  id: TochkaId;
  text: string;
}

export interface KristallProps {
  className?: string;
  podpisi?: readonly KristallPodpis[];
}

/* Ракурс модели, совпадающий с рендером. */
const AZ = 0;
const EL = 16;
const EL_MIN = 4;
const EL_MAX = 60;
/** Градусов на пиксель перетаскивания. */
const NA_PIKSEL = 0.5;
/** Шаг стрелок клавиатуры, градусы. */
const NA_KLAVISHU = 12;

/* Где точки подписей на рендере, доли кадра (подобрано по файлу). */
const NA_RENDERE: Record<TochkaId, { x: number; y: number }> = {
  h: { x: 0.5, y: 0.4 },
  a: { x: 0.68, y: 0.66 },
  ugol: { x: 0.5, y: 0.6 },
};

const FORMATY = [
  { ext: 'avif', type: 'image/avif' },
  { ext: 'webp', type: 'image/webp' },
] as const;

export function Kristall({ className, podpisi = [] }: KristallProps) {
  const oblast = useRef<HTMLDivElement>(null);
  const kholst = useRef<HTMLDivElement>(null);
  const model = useRef<Kristall3d | null>(null);
  const zagruzka = useRef<Promise<Kristall3d | null> | null>(null);
  const vid = useRef({ az: AZ, el: EL });
  const [zhivoy, setZhivoy] = useState(false);
  const [povernul, setPovernul] = useState(false);
  const [tochki, setTochki] = useState(NA_RENDERE);

  const narisovat = useCallback(() => {
    const m = model.current;
    if (m === null) return;
    m.vid(vid.current.az, vid.current.el);
    setTochki(m.tochki());
  }, []);

  const podgruzit = useCallback(() => {
    if (zagruzka.current === null) {
      zagruzka.current = import('./kristall3d')
        .then(({ sozdatKristall }) => {
          const host = kholst.current;
          if (host === null) return null;
          const m = sozdatKristall(host, vid.current.az, vid.current.el);
          model.current = m;
          setTochki(m.tochki());
          setZhivoy(true);
          return m;
        })
        .catch(() => null);
    }
    return zagruzka.current;
  }, []);

  const povernut = useCallback(
    (dAz: number, dEl: number) => {
      const v = vid.current;
      v.az = (((v.az + dAz + 180) % 360) + 360) % 360 - 180;
      v.el = Math.min(EL_MAX, Math.max(EL_MIN, v.el + dEl));
      setPovernul(true);
      narisovat();
    },
    [narisovat],
  );

  /* Перетаскивание с лёгкой инерцией. */
  useEffect(() => {
    const el = oblast.current;
    if (el === null) return;
    let tyanu: { id: number; x: number; y: number; t: number } | null = null;
    let skorost = 0;
    let raf = 0;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      void podgruzit();
      cancelAnimationFrame(raf);
      tyanu = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
      skorost = 0;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (tyanu === null || e.pointerId !== tyanu.id) return;
      const dx = e.clientX - tyanu.x;
      /* Палец двигает только вбок: вертикаль у страницы. */
      const dy = e.pointerType === 'mouse' ? e.clientY - tyanu.y : 0;
      const now = performance.now();
      skorost = (dx * NA_PIKSEL) / Math.max(1, now - tyanu.t);
      tyanu = { id: e.pointerId, x: e.clientX, y: e.clientY, t: now };
      povernut(dx * NA_PIKSEL, dy * NA_PIKSEL);
    };
    const up = (e: PointerEvent) => {
      if (tyanu === null || e.pointerId !== tyanu.id) return;
      tyanu = null;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let last = performance.now();
      const tik = (now: number) => {
        const dt = now - last;
        last = now;
        skorost *= Math.pow(0.9, dt / 16);
        if (Math.abs(skorost) < 0.004) return;
        povernut(skorost * dt, 0);
        raf = requestAnimationFrame(tik);
      };
      raf = requestAnimationFrame(tik);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [podgruzit, povernut]);

  /* Размер холста — за размером области. */
  useEffect(() => {
    const el = oblast.current;
    if (el === null || !zhivoy) return;
    const ro = new ResizeObserver(() => {
      model.current?.razmer();
      if (model.current !== null) setTochki(model.current.tochki());
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [zhivoy]);

  useEffect(
    () => () => {
      model.current?.ubrat();
      model.current = null;
    },
    [],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    const shag: Record<string, [number, number]> = {
      ArrowLeft: [-NA_KLAVISHU, 0],
      ArrowRight: [NA_KLAVISHU, 0],
      ArrowUp: [0, NA_KLAVISHU],
      ArrowDown: [0, -NA_KLAVISHU],
    };
    const d = shag[e.key];
    if (d === undefined) return;
    e.preventDefault();
    void podgruzit().then(() => povernut(d[0], d[1]));
  };

  return (
    <div className={clsx('dm-kristall', zhivoy && 'is-zhivoy', className)}>
      <div
        ref={oblast}
        className="dm-kristall__oblast"
        role="img"
        aria-label="Стеклянная правильная шестиугольная усечённая пирамида. Поворачивается перетаскиванием и стрелками."
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <picture className="dm-kristall__poster">
          {FORMATY.map((f) => (
            <source key={f.ext} type={f.type} srcSet={assetUrl(`/hero/hero-mobile.${f.ext}`)} />
          ))}
          <img
            src={assetUrl('/hero/hero-mobile.png')}
            alt=""
            width={1122}
            height={946}
            fetchPriority="high"
            decoding="async"
            draggable={false}
          />
        </picture>
        <div ref={kholst} className="dm-kristall__kholst" />
        {podpisi.map((p) => (
          <span
            key={p.id}
            className={`dm-kristall__podpis dm-kristall__podpis--${p.id}`}
            style={{ left: `${tochki[p.id].x * 100}%`, top: `${tochki[p.id].y * 100}%` }}
          >
            {p.text}
          </span>
        ))}
      </div>
      <p className={clsx('dm-kristall__hint', povernul && 'is-skryt')} aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" />
        </svg>
        Покрутите фигуру
      </p>
    </div>
  );
}
