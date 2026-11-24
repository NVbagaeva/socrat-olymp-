'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { motionLevel, type MotionLevel } from '@/lib/motion';
import { pokazanoDo, shagVremeni, sleduyushayaOstanovka, type HodOpcii } from '@/lib/zhivye/hod';

/**
 * Общие хуки живых сцен (components/zhivye):
 *
 *   useHod       — модельное время t с паузами-«снимками», пуск/пауза,
 *                  сброс, перемотка; кадры — requestAnimationFrame, только
 *                  пока идёт показ;
 *   useShirina   — ширина контейнера: сцена рисуется в его пикселях,
 *                  подписи на телефоне не мельчают;
 *   useDvizhenie — уровень движения сайта (full / lite / reduce) с учётом
 *                  системного «Уменьшить движение».
 */

export interface Kadr {
  t: number;
  igraet: boolean;
  /** Идёт пауза-«снимок» на отметке. */
  snimokIdet: boolean;
  /** Показ хоть раз запускали или перематывали — таблица заполняется с начала. */
  zapuskalsya: boolean;
  /** Номер дохода до конца: перезапускает финальные эффекты. */
  konec: number;
}

interface Dvizhok {
  t: number;
  start: number;
  igraet: boolean;
  pokazano: number;
  derzhatDo: number;
  zapuskalsya: boolean;
  konec: number;
}

function novyy(): Dvizhok {
  return { t: 0, start: 0, igraet: false, pokazano: 0, derzhatDo: 0, zapuskalsya: false, konec: 0 };
}

function snyat(d: Dvizhok): Kadr {
  return {
    t: d.t,
    igraet: d.igraet,
    snimokIdet: d.derzhatDo > 0,
    zapuskalsya: d.zapuskalsya,
    konec: d.konec,
  };
}

export interface Hod {
  kadr: Kadr;
  skorost: 1 | 2;
  setSkorost: (s: 1 | 2) => void;
  /** Пуск, пауза, продолжение; с конца — заново. */
  pusk: () => void;
  sbros: () => void;
  peremotat: (t: number) => void;
}

export function useHod(o: HodOpcii): Hod {
  const [skorost, setSkorost] = useState<1 | 2>(1);
  const [kadr, setKadr] = useState<Kadr>(() => snyat(novyy()));
  const dv = useRef<Dvizhok>(novyy());
  const raf = useRef<number | null>(null);
  const tek = useRef({ o, skorost });
  useLayoutEffect(() => {
    tek.current = { o, skorost };
  });
  const perisovat = useCallback(() => setKadr(snyat(dv.current)), []);

  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    },
    [],
  );

  const cikl = useCallback(() => {
    if (raf.current !== null) return;
    let prev = performance.now();
    const shag = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const e = dv.current;
      const { o: op, skorost: sk } = tek.current;
      if (e.igraet) {
        if (e.derzhatDo > 0) {
          if (now >= e.derzhatDo) {
            e.derzhatDo = 0;
            e.start = e.t;
          }
        } else {
          const stop = sleduyushayaOstanovka(op, e.t, e.pokazano);
          e.t = shagVremeni(op, dt, sk, e.t, e.start, stop);
          if (e.t >= stop - 1e-9) {
            e.t = stop;
            if (stop >= op.tMax) {
              e.igraet = false;
              e.konec += 1;
            } else {
              e.pokazano = pokazanoDo(op, e.t);
              e.derzhatDo = now + (op.sekSnimok * 1000) / sk;
            }
          }
        }
      }
      setKadr(snyat(e));
      raf.current = e.igraet ? requestAnimationFrame(shag) : null;
    };
    raf.current = requestAnimationFrame(shag);
  }, []);

  const pusk = useCallback(() => {
    const e = dv.current;
    if (e.igraet) {
      e.igraet = false;
      e.derzhatDo = 0;
      perisovat();
      return;
    }
    if (e.t >= tek.current.o.tMax - 1e-9) {
      e.t = 0;
      e.pokazano = 0;
    }
    e.start = e.t;
    e.igraet = true;
    e.zapuskalsya = true;
    cikl();
    perisovat();
  }, [cikl, perisovat]);

  const sbros = useCallback(() => {
    Object.assign(dv.current, novyy(), { konec: dv.current.konec });
    perisovat();
  }, [perisovat]);

  const peremotat = useCallback(
    (t: number) => {
      const e = dv.current;
      const op = tek.current.o;
      e.t = Math.min(Math.max(t, 0), op.tMax);
      e.igraet = false;
      e.derzhatDo = 0;
      e.pokazano = pokazanoDo(op, e.t);
      if (e.t > 0) e.zapuskalsya = true;
      perisovat();
    },
    [perisovat],
  );

  return { kadr, skorost, setSkorost, pusk, sbros, peremotat };
}

export function useShirina(ref: RefObject<HTMLElement | null>): number {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el === null) return undefined;
    setW(Math.round(el.clientWidth));
    const ro = new ResizeObserver(([e]) => {
      if (e !== undefined) setW(Math.round(e.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

export function useDvizhenie(): MotionLevel {
  const [lvl, setLvl] = useState<MotionLevel>('full');
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const obnovit = () => setLvl(mq.matches ? 'reduce' : motionLevel());
    obnovit();
    mq.addEventListener('change', obnovit);
    return () => mq.removeEventListener('change', obnovit);
  }, []);
  return lvl;
}
