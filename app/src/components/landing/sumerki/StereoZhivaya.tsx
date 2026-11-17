'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VITRINA_STEREO as T } from '@/content/vitrinaStereo';
import type { Model } from '@/lib/solid/model';
import type { View } from '@/lib/solid/project';
import type { RenderOptions } from '@/lib/solid/render';

/* Движок рисунка — тот же кусок, что у чертежей раздела №3
   (ZhivoyChertezh3d): приезжает, когда блок подъезжает к экрану. */
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

const NA_PIKSEL = 0.5;
const SDVIG = 6;
const PODYOM_MIN = 5;
const PODYOM_MAX = 85;
const ZATUKHANIE = 0.9;
const STOP = 0.004;
/** Автоповорот при первом появлении: размах, градусы, и длительность. */
const AVTO_RAZMAH = 28;
const AVTO_MS = 1800;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const tikho = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface StereoZhivayaProps {
  model: Model;
  /** Первый кадр с сервера: тот же ракурс и шаг — подмена без скачка. */
  svg: string;
  az: number;
  el: number;
  /** Шаг, открытый сначала (последний: выделен треугольник). */
  nachalo: number;
  lid: string;
  uslovie: string;
  knopkaHref: string;
  /** Миниатюры других живых чертежей: неподвижный SVG с сервера и адрес. */
  mini: readonly { id: string; href: string; podpis: string; svg: string }[];
}

/**
 * Живая фигура витрины: вращение рукой, шаги разбора на этом же
 * чертеже. Жест: палец вбок крутит фигуру, вверх-вниз листает страницу
 * (touch-action: pan-y — как у кристалла первого экрана); мышь крутит
 * в обе стороны; стрелки клавиатуры — тоже. Кадр — SVG движка lib/solid,
 * перерисовывается только пока фигура движется.
 */
export function StereoZhivaya({
  model,
  svg,
  az: az0,
  el: el0,
  nachalo,
  lid,
  uslovie,
  knopkaHref,
  mini,
}: StereoZhivayaProps) {
  const koren = useRef<HTMLElement>(null);
  const oblast = useRef<HTMLDivElement>(null);
  const kholst = useRef<HTMLDivElement>(null);
  const vid = useRef({ az: az0, el: el0 });
  const shagRef = useRef(nachalo);
  const pamyat = useRef(new Map<string, number>());
  const kadrRaf = useRef(0);
  const dvizhenie = useRef(0);
  const [shag, setShag] = useState(nachalo);
  const [povernul, setPovernul] = useState(false);
  const [izmenyon, setIzmenyon] = useState(false);

  const narisovat = useCallback(() => {
    if (kadrRaf.current !== 0) return;
    kadrRaf.current = requestAnimationFrame(() => {
      kadrRaf.current = 0;
      void zagruzit().then(({ renderSolid, orthoAt }) => {
        const node = kholst.current;
        if (node === null) return;
        node.innerHTML = renderSolid(model, {
          view: orthoAt(vid.current.az, vid.current.el),
          ustoychivo: true,
          tema: 'ekran',
          shag: shagRef.current,
          pamyatPodpisey: pamyat.current,
        });
      });
    });
  }, [model]);

  const postavit = useCallback(
    (az: number, el: number) => {
      vid.current = {
        az: ((((az + 180) % 360) + 360) % 360) - 180,
        el: clamp(el, PODYOM_MIN, PODYOM_MAX),
      };
      narisovat();
    },
    [narisovat],
  );

  const ostanovit = () => {
    cancelAnimationFrame(dvizhenie.current);
    dvizhenie.current = 0;
  };

  const rukami = useCallback(() => {
    setPovernul(true);
    setIzmenyon(true);
  }, []);

  /* Движок — заранее, на подъезде к экрану; автоповорот — когда блок
     виден больше чем наполовину, один раз и без reduced-motion. */
  useEffect(() => {
    const node = koren.current;
    if (node === null) return undefined;
    let avtoBylo = false;
    const podyezd = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          void zagruzit();
          podyezd.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    const vidno = new IntersectionObserver(
      (es) => {
        if (avtoBylo || !es.some((e) => e.isIntersecting)) return;
        avtoBylo = true;
        vidno.disconnect();
        if (tikho()) return;
        void zagruzit().then(() => {
          if (dvizhenie.current !== 0 || vid.current.az !== az0) return;
          const t0 = performance.now();
          const shag = (now: number) => {
            const t = Math.min(1, (now - t0) / AVTO_MS);
            const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
            postavit(az0 + AVTO_RAZMAH * Math.sin(Math.PI * e), el0);
            dvizhenie.current = t < 1 ? requestAnimationFrame(shag) : 0;
          };
          dvizhenie.current = requestAnimationFrame(shag);
        });
      },
      { threshold: 0.5 },
    );
    const okno = oblast.current;
    podyezd.observe(node);
    if (okno !== null) vidno.observe(okno);
    return () => {
      podyezd.disconnect();
      vidno.disconnect();
    };
  }, [az0, el0, postavit]);

  /* Жесты на области фигуры. */
  useEffect(() => {
    const node = oblast.current;
    if (node === null) return undefined;
    let start: { id: number; x: number; y: number; palec: boolean } | null = null;
    let tyanem = false;
    let proshloe = { t: 0, x: 0, y: 0 };
    let skorost = { az: 0, el: 0 };

    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (start !== null) return;
      ostanovit();
      void zagruzit();
      start = { id: e.pointerId, x: e.clientX, y: e.clientY, palec: e.pointerType !== 'mouse' };
      tyanem = false;
      skorost = { az: 0, el: 0 };
      proshloe = { t: e.timeStamp, x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (start === null || e.pointerId !== start.id) return;
      if (!tyanem) {
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.hypot(dx, dy) < SDVIG) return;
        /* Палец вверх-вниз — это страница (её листает браузер, pan-y). */
        if (start.palec && Math.abs(dy) > Math.abs(dx)) {
          start = null;
          return;
        }
        tyanem = true;
        rukami();
        try {
          node.setPointerCapture(e.pointerId);
        } catch {
          /* указатель уже ушёл */
        }
      }
      e.preventDefault();
      const dt = Math.max(1, e.timeStamp - proshloe.t);
      const dAz = -(e.clientX - proshloe.x) * NA_PIKSEL;
      /* Палец двигает только вбок: наклон у мыши и клавиатуры. */
      const dEl = start.palec ? 0 : (e.clientY - proshloe.y) * NA_PIKSEL;
      proshloe = { t: e.timeStamp, x: e.clientX, y: e.clientY };
      skorost = {
        az: skorost.az * 0.5 + (dAz / dt) * 0.5,
        el: skorost.el * 0.5 + (dEl / dt) * 0.5,
      };
      postavit(vid.current.az + dAz, vid.current.el + dEl);
    };
    const up = (e: PointerEvent) => {
      if (start === null || e.pointerId !== start.id) return;
      start = null;
      if (!tyanem) return;
      tyanem = false;
      if (e.timeStamp - proshloe.t > 80 || tikho()) return;
      let v = { ...skorost };
      let t = performance.now();
      const shag = (now: number) => {
        const dt = Math.min(48, now - t);
        t = now;
        v = { az: v.az * ZATUKHANIE ** (dt / 16), el: v.el * ZATUKHANIE ** (dt / 16) };
        if (Math.abs(v.az) < STOP && Math.abs(v.el) < STOP) {
          dvizhenie.current = 0;
          return;
        }
        postavit(vid.current.az + v.az * dt, vid.current.el + v.el * dt);
        dvizhenie.current = requestAnimationFrame(shag);
      };
      dvizhenie.current = requestAnimationFrame(shag);
    };
    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move, { passive: false });
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    return () => {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', up);
      ostanovit();
      cancelAnimationFrame(kadrRaf.current);
    };
  }, [postavit, rukami]);

  const klavisha = (e: React.KeyboardEvent) => {
    const d: Record<string, [number, number]> = {
      ArrowLeft: [10, 0],
      ArrowRight: [-10, 0],
      ArrowUp: [0, 10],
      ArrowDown: [0, -10],
    };
    const s = d[e.key];
    if (s === undefined) return;
    e.preventDefault();
    ostanovit();
    rukami();
    postavit(vid.current.az + s[0], vid.current.el + s[1]);
  };

  const sbrosit = () => {
    ostanovit();
    pamyat.current.clear();
    setIzmenyon(false);
    postavit(az0, el0);
  };

  const naShag = (k: number) => {
    shagRef.current = k;
    setShag(k);
    narisovat();
  };

  return (
    <section ref={koren} className="vit-chast vit-chast--stereo" aria-labelledby="vit-stereo">
      <div className="vit-chast__tekst">
        <p className="vit-metka-chasti">{T.metka}</p>
        <h3 id="vit-stereo" className="vit-chast__z">
          {T.zagolovok.slice(0, T.zagolovok.indexOf(T.akcent))}
          <span className="vit-akcent">{T.akcent}</span>
        </h3>
        <p className="vit-chast__lid">{lid}</p>
      </div>

      <div className="vit-chast__scena vst">
        <div className="vst-scena">
          <div
            ref={oblast}
            className="vst-oblast"
            role="img"
            tabIndex={0}
            aria-label={`${model.alt}. Фигуру можно вращать: перетащите её или нажимайте стрелки.`}
            onKeyDown={klavisha}
          >
            <div ref={kholst} className="vst-kholst" dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
          <span className="vst-pol" aria-hidden="true" />
          <p className={clsx('vst-zhest', povernul && 'is-skryt')} aria-hidden="true">
            <svg viewBox="0 0 24 24" className="vst-zhest__ruka" focusable="false">
              <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4.5 15.4a1.6 1.6 0 0 1 2.4-2.1L9 15" />
            </svg>
            <span className="vst-zhest__t vst-zhest__t--palec">↔ {T.zhest.palcem}</span>
            <span className="vst-zhest__t vst-zhest__t--mysh">↔ {T.zhest.myshyu}</span>
          </p>
          {izmenyon ? (
            <button type="button" className="vst-sbros" onClick={sbrosit}>
              {T.sbrosit}
            </button>
          ) : null}
        </div>
        <p className="vst-podpis">{T.podpis}</p>
      </div>
      <div className="vst-mini-blok">
        <p className="vst-mini-z">{T.minZ}</p>
        <ul className="vst-mini">
          {mini.map((m) => (
            <li key={m.id}>
              <Link className="vst-mini__k" href={m.href}>
                <span
                  className="vst-mini__ris"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: m.svg }}
                />
                <span className="vst-mini__p">{m.podpis}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="vst-razbor">
        <p className="vst-zadacha">
          <span className="vst-zadacha__m">{T.zadacha}</span>
          {uslovie}
        </p>
        <p className="vst-shagi-z">{T.shagiZ}</p>
        <ol className="vit-punkty vst-shagi">
          {T.shagi.map((s, i) => (
            <li key={s.shag}>
              <button
                type="button"
                className={clsx('vit-punkt', shag === s.shag && 'is-aktivnyy')}
                aria-pressed={shag === s.shag}
                onClick={() => naShag(s.shag)}
              >
                <span className="vit-punkt__no">{String(i + 1).padStart(2, '0')}</span>
                <span className="vit-punkt__tekst">
                  <span className="vit-punkt__z">{s.z}</span>
                  <span className="vst-formula">{s.f}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="vit-knopki">
        <Link className="vit-knopka vit-knopka--zalitaya" href={knopkaHref}>
          {T.knopka}
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 12h13M12 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
