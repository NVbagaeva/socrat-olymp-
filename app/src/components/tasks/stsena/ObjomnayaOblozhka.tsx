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
  /**
   * Фигуру можно не только вращать, но и перетаскивать по шапке:
   * подержать и тянуть (мышью — с Shift или правой кнопкой), стрелки с
   * Shift — сдвиг, двойное касание — на место.
   */
  dvigat?: boolean;
  className?: string;
}

/** Градусов на пиксель перетаскивания. */
const NA_PIKSEL = 0.5;
/** Шаг стрелок клавиатуры, градусы. */
const NA_KLAVISHU = 12;
/** Перетаскивание: сколько держать палец до сдвига, мс, и допуск дрожи, px. */
const DERZHAT_MS = 350;
const DROZH_PX = 8;
/** Шаг сдвига стрелками с Shift, px. */
const SDVIG_KLAVISHA = 16;
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
 * возвращается только после перезагрузки. С dvigat фигуру можно ещё и
 * перетаскивать по шапке: подержать и тянуть.
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
  dvigat = false,
  className,
}: ObjomnayaOblozhkaProps) {
  const oblast = useRef<HTMLDivElement>(null);
  const kholst = useRef<HTMLDivElement>(null);
  const model = useRef<Model3d | null>(null);
  const zagruzka = useRef<Promise<Model3d | null> | null>(null);
  const vid = useRef({ az, el });
  const raf = useRef(0);
  const [zhivoy, setZhivoy] = useState(false);
  /* Сдвиг фигуры по шапке (dvigat): px от исходного места. */
  const sdvig = useRef({ x: 0, y: 0 });
  const [tyanu, setTyanu] = useState(false);

  /** Сдвинуть фигуру, не выпуская её за край шапки (или окна). */
  const sdvinut = useCallback((dx: number, dy: number) => {
    const node = oblast.current;
    if (node === null) return;
    const s = sdvig.current;
    const rect = node.getBoundingClientRect();
    const pole = (node.closest('header') ?? document.documentElement).getBoundingClientRect();
    /* Исходное место — без текущего сдвига. */
    const x0 = rect.left - s.x;
    const y0 = rect.top - s.y;
    s.x = Math.min(pole.right - rect.width - x0, Math.max(pole.left - x0, s.x + dx));
    s.y = Math.min(pole.bottom - rect.height - y0, Math.max(pole.top - y0, s.y + dy));
    node.style.translate = `${Math.round(s.x)}px ${Math.round(s.y)}px`;
  }, []);

  /** Вернуть фигуру на место. */
  const naMesto = useCallback(() => {
    const node = oblast.current;
    if (node === null) return;
    sdvig.current = { x: 0, y: 0 };
    node.style.translate = '';
  }, []);

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

  /* Перетаскивание: вращение с лёгкой инерцией; с dvigat — ещё и сдвиг
     фигуры. Сдвиг включается, если подержать палец (кнопку мыши) на
     месте DERZHAT_MS, а мышью — сразу с Shift или правой кнопкой. */
  useEffect(() => {
    const node = oblast.current;
    if (node === null) return;
    let tyanu: { id: number; x: number; y: number; t: number; sdvig: boolean } | null = null;
    let start: { x: number; y: number } | null = null;
    let derzhat = 0;
    let skorost = 0;
    const vklyuchitSdvig = () => {
      if (tyanu === null) return;
      tyanu.sdvig = true;
      setTyanu(true);
    };
    const down = (e: PointerEvent) => {
      const sdvigom = dvigat && (e.button === 2 || (e.button === 0 && e.shiftKey));
      if (e.button !== 0 && !sdvigom) return;
      void podgruzit();
      cancelAnimationFrame(raf.current);
      tyanu = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), sdvig: false };
      start = { x: e.clientX, y: e.clientY };
      skorost = 0;
      node.setPointerCapture(e.pointerId);
      if (sdvigom) {
        vklyuchitSdvig();
      } else if (dvigat) {
        window.clearTimeout(derzhat);
        derzhat = window.setTimeout(vklyuchitSdvig, DERZHAT_MS);
      }
    };
    const move = (e: PointerEvent) => {
      if (tyanu === null || e.pointerId !== tyanu.id) return;
      const dx = e.clientX - tyanu.x;
      const dyVse = e.clientY - tyanu.y;
      if (start !== null && Math.hypot(e.clientX - start.x, e.clientY - start.y) > DROZH_PX) {
        /* Сдвинулся раньше, чем выдержал паузу, — это вращение. */
        window.clearTimeout(derzhat);
      }
      const now = performance.now();
      if (tyanu.sdvig) {
        tyanu = { ...tyanu, x: e.clientX, y: e.clientY, t: now };
        sdvinut(dx, dyVse);
        return;
      }
      /* Палец вращает только вбок: вертикаль у страницы. */
      const dy = e.pointerType === 'mouse' ? dyVse : 0;
      skorost = (dx * NA_PIKSEL) / Math.max(1, now - tyanu.t);
      tyanu = { ...tyanu, x: e.clientX, y: e.clientY, t: now };
      povernut(dx * NA_PIKSEL, -dy * NA_PIKSEL);
    };
    const up = (e: PointerEvent) => {
      if (tyanu === null || e.pointerId !== tyanu.id) return;
      window.clearTimeout(derzhat);
      const bylSdvig = tyanu.sdvig;
      tyanu = null;
      start = null;
      if (bylSdvig) {
        setTyanu(false);
        return;
      }
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
    /* Пока фигуру тащат пальцем, страница не прокручивается. */
    const touchmove = (e: TouchEvent) => {
      if (tyanu?.sdvig === true) e.preventDefault();
    };
    /* Правая кнопка сдвигает — меню браузера не нужно. */
    const menu = (e: MouseEvent) => {
      if (dvigat) e.preventDefault();
    };
    /* Двойное касание — на место. */
    const dvazhdy = () => {
      if (dvigat) naMesto();
    };
    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    node.addEventListener('touchmove', touchmove, { passive: false });
    node.addEventListener('contextmenu', menu);
    node.addEventListener('dblclick', dvazhdy);
    return () => {
      window.clearTimeout(derzhat);
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', up);
      node.removeEventListener('touchmove', touchmove);
      node.removeEventListener('contextmenu', menu);
      node.removeEventListener('dblclick', dvazhdy);
    };
  }, [podgruzit, povernut, dvigat, sdvinut, naMesto]);

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
    if (dvigat && e.key === 'Escape') {
      naMesto();
      return;
    }
    if (d === undefined) return;
    e.preventDefault();
    if (dvigat && e.shiftKey) {
      /* Shift + стрелка — сдвиг фигуры. */
      const k = SDVIG_KLAVISHA / NA_KLAVISHU;
      sdvinut(d[0] * k, -d[1] * k);
      return;
    }
    void podgruzit().then(() => povernut(d[0], d[1]));
  };

  return (
    <div
      className={clsx(
        'oblozhka',
        zhivoy && 'is-zhivoy',
        dvigat && 'oblozhka--dvigat',
        tyanu && 'is-tyanu',
        className,
      )}
    >
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
