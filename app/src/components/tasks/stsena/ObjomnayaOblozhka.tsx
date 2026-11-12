'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import './stsena.css';

/** Живая модель обложки: то, что возвращает её модуль three.js. */
export interface Model3d {
  /** Ракурс: азимут и подъём взгляда, градусы. */
  vid: (az: number, el: number) => void;
  razmer: () => void;
  ubrat: () => void;
}

export type Sozdat3d = (host: HTMLElement, az: number, el: number) => Model3d;

export interface Poster {
  /** Запасной PNG и его srcset. */
  src: string;
  srcSet: string;
  /** WebP того же кадра. */
  webpSrcSet: string;
  sizes: string;
  width: number;
  height: number;
}

export interface ObjomnayaOblozhkaProps {
  poster: Poster;
  /**
   * Код модели — отдельным куском: грузится по первому касанию,
   * перетаскиванию, стрелке или кнопке, на первую загрузку не влияет.
   */
  zagruzit: () => Promise<{ sozdat: Sozdat3d }>;
  /** Ракурс модели, совпадающий с картинкой. */
  az: number;
  el: number;
  elMin?: number;
  elMax?: number;
  /** Описание для скринридера. */
  label: string;
  /** Подпись стеклянной кнопки «Можно вращать». */
  knopka: string;
  className?: string;
}

/** Градусов на пиксель перетаскивания. */
const NA_PIKSEL = 0.5;
/** Шаг стрелок клавиатуры, градусы. */
const NA_KLAVISHU = 12;
/** Поворот по кнопке «Можно вращать»: столько градусов и за столько мс. */
const KRUTNUT_GRADUSOV = 60;
const KRUTNUT_MS = 700;

/**
 * Обложка раздела, оживающая в 3D — как кристалл на главной
 * (landing/kristall): в покое картинка, по первому касанию,
 * перетаскиванию, стрелке или кнопке подгружается живая модель в том же
 * ракурсе и масштабе и плавно (200 мс) сменяет картинку без пустого
 * кадра: модель рисует первый кадр до того, как картинка начнёт гаснуть.
 * Дальше фигура вращается рукой с лёгкой инерцией; пальцем — только
 * вбок, вертикальный жест остаётся прокрутке страницы. Картинка
 * возвращается только после перезагрузки.
 */
export function ObjomnayaOblozhka({
  poster,
  zagruzit,
  az,
  el,
  elMin = -20,
  elMax = 70,
  label,
  knopka,
  className,
}: ObjomnayaOblozhkaProps) {
  const oblast = useRef<HTMLDivElement>(null);
  const kholst = useRef<HTMLDivElement>(null);
  const model = useRef<Model3d | null>(null);
  const zagruzka = useRef<Promise<Model3d | null> | null>(null);
  const vid = useRef({ az, el });
  const raf = useRef(0);
  const [zhivoy, setZhivoy] = useState(false);

  const narisovat = useCallback(() => {
    const m = model.current;
    if (m === null) return;
    m.vid(vid.current.az, vid.current.el);
  }, []);

  const podgruzit = useCallback(() => {
    if (zagruzka.current === null) {
      zagruzka.current = zagruzit()
        .then(({ sozdat }) => {
          const host = kholst.current;
          if (host === null) return null;
          const m = sozdat(host, vid.current.az, vid.current.el);
          model.current = m;
          setZhivoy(true);
          return m;
        })
        .catch(() => null);
    }
    return zagruzka.current;
  }, [zagruzit]);

  const povernut = useCallback(
    (dAz: number, dEl: number) => {
      const v = vid.current;
      v.az = ((((v.az + dAz + 180) % 360) + 360) % 360) - 180;
      v.el = Math.min(elMax, Math.max(elMin, v.el + dEl));
      narisovat();
    },
    [elMax, elMin, narisovat],
  );

  /* Кнопка «Можно вращать»: подгрузить модель и показать, что она живая —
     мягкий поворот с замедлением. При «уменьшить движение» — один шаг. */
  const krutnut = useCallback(() => {
    void podgruzit().then((m) => {
      if (m === null) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        povernut(NA_KLAVISHU, 0);
        return;
      }
      cancelAnimationFrame(raf.current);
      const start = performance.now();
      let proshlo = 0;
      const tik = (now: number) => {
        const t = Math.min(1, (now - start) / KRUTNUT_MS);
        const dolya = 1 - Math.pow(1 - t, 3);
        const nado = KRUTNUT_GRADUSOV * dolya;
        povernut(nado - proshlo, 0);
        proshlo = nado;
        if (t < 1) raf.current = requestAnimationFrame(tik);
      };
      raf.current = requestAnimationFrame(tik);
    });
  }, [podgruzit, povernut]);

  /* Перетаскивание с лёгкой инерцией. */
  useEffect(() => {
    const node = oblast.current;
    if (node === null) return;
    let tyanu: { id: number; x: number; y: number; t: number } | null = null;
    let skorost = 0;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      void podgruzit();
      cancelAnimationFrame(raf.current);
      tyanu = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
      skorost = 0;
      node.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (tyanu === null || e.pointerId !== tyanu.id) return;
      const dx = e.clientX - tyanu.x;
      /* Палец двигает только вбок: вертикаль у страницы. */
      const dy = e.pointerType === 'mouse' ? e.clientY - tyanu.y : 0;
      const now = performance.now();
      skorost = (dx * NA_PIKSEL) / Math.max(1, now - tyanu.t);
      tyanu = { id: e.pointerId, x: e.clientX, y: e.clientY, t: now };
      povernut(dx * NA_PIKSEL, -dy * NA_PIKSEL);
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
        raf.current = requestAnimationFrame(tik);
      };
      raf.current = requestAnimationFrame(tik);
    };
    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    return () => {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', up);
    };
  }, [podgruzit, povernut]);

  /* Размер холста — за размером области. */
  useEffect(() => {
    const node = oblast.current;
    if (node === null || !zhivoy) return;
    const ro = new ResizeObserver(() => model.current?.razmer());
    ro.observe(node);
    return () => ro.disconnect();
  }, [zhivoy]);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
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
    <div className={clsx('oblozhka', zhivoy && 'is-zhivoy', className)}>
      <div
        ref={oblast}
        className="oblozhka__oblast"
        role="img"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{ aspectRatio: `${poster.width} / ${poster.height}` }}
      >
        <picture className="oblozhka__poster">
          <source type="image/webp" srcSet={poster.webpSrcSet} sizes={poster.sizes} />
          <img
            src={poster.src}
            srcSet={poster.srcSet}
            sizes={poster.sizes}
            alt=""
            width={poster.width}
            height={poster.height}
            fetchPriority="high"
            decoding="async"
            draggable={false}
          />
        </picture>
        <div ref={kholst} className="oblozhka__kholst" />
      </div>
      <button type="button" className="oblozhka__knopka" onClick={krutnut} aria-pressed={zhivoy}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M20 12a8 8 0 1 1-2.3-5.7" />
          <path d="M20 4v4.5h-4.5" />
        </svg>
        <span>{knopka}</span>
      </button>
    </div>
  );
}
