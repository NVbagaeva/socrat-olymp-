'use client';

/**
 * Объёмные чертежи шапки — на ядре стереометрии сайта (lib/stereo):
 * параллельная проекция, ракурс двумя углами, видимость рёбер по
 * граням выпуклого тела. Рисуется SVG, без three.js: лёгкий кусок,
 * плавный и на слабом телефоне.
 *
 * useVrashchenie — вращение мышью во все стороны и пальцем вбок (по
 * вертикали палец листает страницу), инерция после отпускания, само
 * очень медленно крутится (6° в секунду), пока фигуру не трогают и
 * курсор не над ней. Стрелки клавиатуры — поворот на 12°.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import {
  bazis,
  napravlenie,
  povernut,
  proj,
  type Bazis,
  type Rakurs,
} from '@/lib/stereo/proekciya';
import type { Telo } from '@/lib/stereo/telo';
import { dot, type P2, type V } from '@/lib/stereo/vec';
import type { Tochka } from './obshchee';

const AVTO_GRAD_V_SEK = 6;
const NA_PIKSEL = 0.5;
const NA_KLAVISHU = 12;
const TRENIE = 0.92;

export interface Vrashchenie {
  rakurs: Rakurs;
  b: Bazis;
  /** Обработчики для корня чертежа. */
  pointer: {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
    onPointerEnter: () => void;
    onPointerLeave: () => void;
  };
  naStrelku: (d: Tochka, e: KeyboardEvent) => void;
  /** Был ли последний жест поворотом (а не нажатием). */
  bylPovorot: () => boolean;
}

export function useVrashchenie(nachalo: Rakurs, tiho: boolean): Vrashchenie {
  const [rakurs, setRakurs] = useState(nachalo);
  const r = useRef(nachalo);
  const skorost = useRef<[number, number]>([0, 0]);
  const tyanu = useRef<{ id: number; x: number; y: number; t: number } | null>(null);
  const navedeno = useRef(false);
  const proyden = useRef(0);
  const kadr = useRef(0);

  const postavit = useCallback((n: Rakurs) => {
    r.current = n;
    setRakurs(n);
  }, []);

  /* Один цикл кадров: инерция и авто-вращение. */
  useEffect(() => {
    let pred = performance.now();
    const shag = (t: number) => {
      const dt = Math.min(0.05, (t - pred) / 1000);
      pred = t;
      if (tyanu.current === null) {
        const [vx, vy] = skorost.current;
        if (Math.abs(vx) > 0.02 || Math.abs(vy) > 0.02) {
          postavit(povernut(r.current, vx, vy, NA_PIKSEL));
          skorost.current = [vx * TRENIE, vy * TRENIE];
        } else if (!tiho && !navedeno.current) {
          postavit({ ...r.current, azimut: r.current.azimut - AVTO_GRAD_V_SEK * dt });
        }
      }
      kadr.current = requestAnimationFrame(shag);
    };
    kadr.current = requestAnimationFrame(shag);
    return () => cancelAnimationFrame(kadr.current);
  }, [tiho, postavit]);

  const pointer = {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      tyanu.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
      proyden.current = 0;
      skorost.current = [0, 0];
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      const t = tyanu.current;
      if (t === null || t.id !== e.pointerId) return;
      const dx = e.clientX - t.x;
      /* Пальцем — только вбок: вертикаль отдана прокрутке (pan-y). */
      const dy = e.pointerType === 'mouse' ? e.clientY - t.y : 0;
      if (proyden.current < 4 && Math.hypot(dx, dy) >= 1) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      proyden.current += Math.hypot(dx, dy);
      postavit(povernut(r.current, dx, dy, NA_PIKSEL));
      skorost.current = tiho ? [0, 0] : [dx, dy];
      tyanu.current = { ...t, x: e.clientX, y: e.clientY, t: performance.now() };
    },
    onPointerUp: (e: PointerEvent<HTMLDivElement>) => {
      if (tyanu.current?.id !== e.pointerId) return;
      /* Долго стоял перед отпусканием — без инерции. */
      if (performance.now() - tyanu.current.t > 80) skorost.current = [0, 0];
      tyanu.current = null;
    },
    onPointerEnter: () => {
      navedeno.current = true;
    },
    onPointerLeave: () => {
      navedeno.current = false;
    },
  };

  const naStrelku = (d: Tochka) => {
    skorost.current = [0, 0];
    const px = NA_KLAVISHU / NA_PIKSEL;
    postavit(povernut(r.current, d[0] * px, d[1] * px, NA_PIKSEL));
  };

  return {
    rakurs,
    b: bazis(napravlenie(rakurs)),
    pointer,
    naStrelku,
    bylPovorot: () => proyden.current >= 6,
  };
}

/** Проекция точки пространства на холст: масштаб и центр. */
export function naHolst(b: Bazis, p: V, m: number, c: Tochka): P2 {
  const [x, y] = proj(b, p);
  return [c[0] + x * m, c[1] + y * m];
}

export interface ChastiTela {
  /** Видимые грани — путями для заливки, от дальних к ближним. */
  grani: { d: string; n: V; i: number }[];
  vidimye: string;
  skrytye: string;
}

/**
 * Выпуклое тело на холсте: грань видна, если её нормаль смотрит на
 * зрителя; ребро видно, если видна хоть одна из двух его граней.
 */
export function risovatTelo(t: Telo, b: Bazis, m: number, c: Tochka): ChastiTela {
  const vid = t.grani.map((g) => dot(g.n, b.k) > 1e-6);
  const put = (pts: readonly V[], zamknut: boolean) =>
    pts
      .map((p, i) => {
        const [x, y] = naHolst(b, p, m, c);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join('') + (zamknut ? 'Z' : '');
  const grani = t.grani
    .map((g, i) => ({ d: put(g.pts, true), n: g.n, i, vid: vid[i] }))
    .filter((g) => g.vid)
    .map(({ d, n, i }) => ({ d, n, i }));
  let vidimye = '';
  let skrytye = '';
  for (const e of t.rebra) {
    const s = put([e.a, e.b], false);
    if (vid[e.f[0]] === true || vid[e.f[1]] === true) vidimye += s;
    else skrytye += s;
  }
  return { grani, vidimye, skrytye };
}

/** Яркость грани по нормали: свет сверху слева, спереди. */
export function svetGrani(n: V): number {
  const l: V = [-0.35, -0.55, 0.76];
  return Math.max(0, dot(n, l));
}
