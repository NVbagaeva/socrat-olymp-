'use client';

import { clsx } from 'clsx';
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { assetUrl } from '@/lib/assetUrl';
import type { Kotik3d as Scena } from './scena';
import { KOTIK_RAD } from './signal';

/**
 * 3D-котик — баннер над окружностью и окно «Погладь котика».
 *
 * — Пока сцена грузится или если 3D не подходит устройству, показан
 *   `zapasnaya` — обычная картинка с лёгким параллаксом за указателем.
 *   3D не включается без WebGL2, при prefers-reduced-motion и если за
 *   первые две секунды выходит меньше 30 кадров в секунду (тогда и до
 *   конца сессии браузера — картинка).
 * — three.js и модель грузятся лениво: баннер — когда попал в экран,
 *   окно — сразу. Рендер стоит, когда сцена вне экрана или вкладка
 *   скрыта; pixel ratio — не выше 1,5 на телефоне и 2 на компьютере.
 * — Камера инерционно поворачивается на ±8° за мышью или пальцем, на
 *   телефоне — за наклоном (на iOS разрешение — по кнопке).
 * — В окне котика гладят: провёл пальцем или мышью по голове или спине
 *   (путь от ~80 px) — котик жмурится и тянется к руке, всплывают
 *   сердечки, облако светлеет.
 * — `?kotik-fps=1` в адресе — счётчик кадров и время загрузки.
 */

const SLABO = 'kotik:slabo';

function mozhno3d(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    if (window.sessionStorage.getItem(SLABO) === '1') return false;
  } catch {
    /* Хранилище недоступно — проверим по ходу. */
  }
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

function fonStranicy(): string {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? '#2b2321' : '#fbf1ea';
}

interface Serdce {
  id: number;
  x: number;
  y: number;
  dx: number;
}

export function Kotik3d({
  rezhim,
  zapasnaya,
  onPoglazhivanie,
  className,
}: {
  rezhim: 'banner' | 'okno';
  /** Обычная картинка: пока грузится 3D и вместо него. */
  zapasnaya: ReactNode;
  /** Котика погладили (n — сколько раз за открытие окна). */
  onPoglazhivanie?: (n: number) => void;
  className?: string;
}) {
  const korobka = useRef<HTMLDivElement>(null);
  const holst = useRef<HTMLCanvasElement>(null);
  const scena = useRef<Scena | null>(null);
  const [sostoyanie, setSostoyanie] = useState<'kartinka' | 'zagruzka' | '3d'>('kartinka');
  const [serdca, setSerdca] = useState<Serdce[]>([]);
  const [paralaks, setParalaks] = useState({ x: 0, y: 0 });
  const [naklonKnopka, setNaklonKnopka] = useState(false);
  const [otladka, setOtladka] = useState<string | null>(null);
  const cel = useRef({ az: 0, el: 0 });
  const povorot = useRef({ az: 0, el: 0 });
  const glad = useRef({ dlina: 0, posled: { x: 0, y: 0 }, idet: false, raz: 0, do: 0 });
  const radDo = useRef(0);
  const serdceId = useRef(0);
  const vklNaklon = useRef<(() => void) | null>(null);

  /* Загрузка сцены: баннер — когда виден, окно — сразу. */
  useEffect(() => {
    const el = korobka.current;
    const cnv = holst.current;
    if (!el || !cnv || !mozhno3d()) return;
    const telefon = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;
    const fps = new URLSearchParams(window.location.search).get('kotik-fps') === '1';
    let otmena = false;
    let vidno = rezhim === 'okno';
    let raf = 0;
    let zapushen = false;
    const t0 = performance.now();
    let zagruzheno = 0;
    let start = 0;
    let zamerOt = 0;
    let zamerKadrov = 0;
    let zamerGotov = false;

    const kadr = (t: number) => {
      raf = 0;
      const k = scena.current;
      if (!k || otmena) return;
      /* Инерция поворота. */
      povorot.current.az += (cel.current.az - povorot.current.az) * 0.08;
      povorot.current.el += (cel.current.el - povorot.current.el) * 0.08;
      k.povorot(povorot.current.az, povorot.current.el);
      const sek = t / 1000;
      if (glad.current.do > 0 && sek * 1000 > glad.current.do) {
        glad.current.do = 0;
        k.glazhu(0);
      }
      if (radDo.current > 0 && t > radDo.current) {
        radDo.current = 0;
        k.rad(0);
      }
      k.kadr(sek);
      /* Замер: с 0,6 с после первого кадра — 2 секунды. Слабо (< 30 к/с) —
         назад на картинку и до конца сессии браузера без 3D. */
      if (!zamerGotov) {
        if (start === 0) start = t;
        if (t - start > 600) {
          if (zamerOt === 0) zamerOt = t;
          zamerKadrov += 1;
          if (t - zamerOt > 2000) {
            zamerGotov = true;
            const sredn = zamerKadrov / ((t - zamerOt) / 1000);
            if (fps)
              setOtladka(
                `${sredn.toFixed(0)} к/с · загрузка ${(zagruzheno / 1000).toFixed(1)} с · слоёв ${telefon ? 16 : 24}`,
              );
            if (sredn < 30 && !fps) {
              try {
                window.sessionStorage.setItem(SLABO, '1');
              } catch {
                /* не страшно */
              }
              otmena = true;
              k.ubrat();
              scena.current = null;
              setSostoyanie('kartinka');
              return;
            }
          }
        }
      }
      if (vidno && !document.hidden) raf = requestAnimationFrame(kadr);
    };
    const pusk = () => {
      if (!raf && vidno && !document.hidden && scena.current) raf = requestAnimationFrame(kadr);
    };

    const zagruzit = async () => {
      if (zapushen) return;
      zapushen = true;
      setSostoyanie('zagruzka');
      try {
        const { sozdatKotika } = await import('./scena');
        if (otmena) return;
        const k = await sozdatKotika(cnv, {
          model: assetUrl('/models/kotik.glb'),
          sloev: telefon ? 16 : 24,
          dpr: telefon ? 1.5 : 2,
          fon: fonStranicy(),
        });
        if (otmena) {
          k.ubrat();
          return;
        }
        scena.current = k;
        zagruzheno = performance.now() - t0;
        const r = el.getBoundingClientRect();
        k.razmer(Math.max(1, r.width), Math.max(1, r.height));
        setSostoyanie('3d');
        pusk();
      } catch {
        setSostoyanie('kartinka');
      }
    };

    const io = new IntersectionObserver(
      ([e]) => {
        vidno = rezhim === 'okno' || (e?.isIntersecting ?? false);
        if (vidno) {
          void zagruzit();
          pusk();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    if (rezhim === 'okno') void zagruzit();
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      scena.current?.razmer(Math.max(1, r.width), Math.max(1, r.height));
    });
    ro.observe(el);
    const vidimost = () => pusk();
    document.addEventListener('visibilitychange', vidimost);
    const tema = window.matchMedia('(prefers-color-scheme: dark)');
    const smenaTemy = () => scena.current?.fon(fonStranicy());
    tema.addEventListener('change', smenaTemy);
    const rad = () => {
      scena.current?.rad(1);
      radDo.current = performance.now() + 2000;
    };
    window.addEventListener(KOTIK_RAD, rad);

    /* Наклон телефона: на Android — сразу, на iOS — по кнопке. */
    const naklon = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      cel.current = {
        az: Math.max(-8, Math.min(8, e.gamma / 4)),
        el: Math.max(-8, Math.min(8, (e.beta - 45) / 5)),
      };
    };
    const DOE = (
      window as unknown as {
        DeviceOrientationEvent?: { requestPermission?: () => Promise<string> };
      }
    ).DeviceOrientationEvent;
    if (telefon) {
      /* Кнопку показываем после монтирования (на сервере её нет). */
      if (typeof DOE?.requestPermission === 'function')
        window.setTimeout(() => setNaklonKnopka(true), 0);
      else window.addEventListener('deviceorientation', naklon);
    }
    vklNaklon.current = () => window.addEventListener('deviceorientation', naklon);

    return () => {
      otmena = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', vidimost);
      tema.removeEventListener('change', smenaTemy);
      window.removeEventListener(KOTIK_RAD, rad);
      window.removeEventListener('deviceorientation', naklon);
      scena.current?.ubrat();
      scena.current = null;
    };
  }, [rezhim]);

  /* Указатель: поворот камеры, параллакс картинки, поглаживание. */
  function dvizhenie(e: ReactPointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    cel.current = { az: (x - 0.5) * 16, el: (0.5 - y) * 10 };
    setParalaks({ x: (x - 0.5) * 2, y: (y - 0.5) * 2 });
    if (rezhim !== 'okno' || !glad.current.idet) return;
    const g = glad.current;
    const k = scena.current;
    const popal = k ? k.popal(x, y) !== null : true;
    const shag = Math.hypot(e.clientX - g.posled.x, e.clientY - g.posled.y);
    g.posled = { x: e.clientX, y: e.clientY };
    if (!popal) return;
    g.dlina += shag;
    k?.glazhu(1, { x, y });
    if (g.dlina >= 80) {
      g.dlina = 0;
      g.raz += 1;
      g.do = performance.now() + 1400;
      onPoglazhivanie?.(g.raz);
      const n = 2 + Math.floor(Math.random() * 3);
      const nov: Serdce[] = Array.from({ length: n }, (_, i) => ({
        id: (serdceId.current += 1),
        x: e.clientX - r.left + (i - n / 2) * 14,
        y: e.clientY - r.top - 10,
        dx: (Math.random() - 0.5) * 40,
      }));
      setSerdca((s) => [...s, ...nov]);
      window.setTimeout(() => setSerdca((s) => s.filter((x) => !nov.includes(x))), 1600);
    }
  }

  return (
    <div
      ref={korobka}
      className={clsx('kotik3d', `kotik3d--${rezhim}`, `is-${sostoyanie}`, className)}
      onPointerMove={dvizhenie}
      onPointerDown={(e) => {
        if (rezhim !== 'okno') return;
        e.currentTarget.setPointerCapture(e.pointerId);
        glad.current.idet = true;
        glad.current.dlina = 0;
        glad.current.posled = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={() => {
        glad.current.idet = false;
      }}
      onPointerLeave={() => {
        cel.current = { az: 0, el: 0 };
        setParalaks({ x: 0, y: 0 });
      }}
    >
      <div
        className="kotik3d__kartinka"
        aria-hidden={sostoyanie === '3d'}
        style={{ transform: `translate(${paralaks.x * 6}px, ${paralaks.y * 4}px)` }}
      >
        {zapasnaya}
      </div>
      <canvas ref={holst} className="kotik3d__holst" aria-hidden="true" />
      {serdca.map((s) => (
        <span
          key={s.id}
          className="kotik3d__serdce"
          style={{ left: s.x, top: s.y, ['--dx' as string]: `${s.dx}px` }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 22" width="22" height="20">
            <path d="M12 21s-8.5-5.4-10.6-10.3C-0.2 6.6 2.4 2 6.6 2c2.3 0 4 1.3 5.4 3.2C13.4 3.3 15.1 2 17.4 2c4.2 0 6.8 4.6 5.2 8.7C20.5 15.6 12 21 12 21z" />
          </svg>
        </span>
      ))}
      {naklonKnopka ? (
        <button
          type="button"
          className="kotik3d__naklon"
          onClick={() => {
            const DOE = (
              window as unknown as {
                DeviceOrientationEvent?: { requestPermission?: () => Promise<string> };
              }
            ).DeviceOrientationEvent;
            void DOE?.requestPermission?.().then((r) => {
              if (r === 'granted') vklNaklon.current?.();
            });
            setNaklonKnopka(false);
          }}
        >
          Поворот наклоном
        </button>
      ) : null}
      {otladka === null ? null : <span className="kotik3d__fps">{otladka}</span>}
    </div>
  );
}
