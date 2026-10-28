'use client';

/**
 * Вращение стереометрического чертежа руками — одно на все чертежи
 * раздела (lib/solid, lib/chertezh3).
 *
 * - Перетаскивание пальцем или мышью по чертежу вращает фигуру:
 *   вбок — вокруг вертикали без ограничений, вверх-вниз — наклон от
 *   почти сбоку до почти сверху, вверх ногами фигура не встаёт. После
 *   отпускания вращение затухает (лёгкая инерция).
 * - Масштаб — щипок двумя пальцами, колесо мыши, кнопки «+» и «−».
 * - Короткое касание без сдвига (меньше SDVIG_TAPA px) — обычный клик:
 *   им выбирают грань, ребро или вершину. Перетаскивание кликом не
 *   считается.
 * - Жест по чертежу страницу не прокручивает (touch-action: none на
 *   области чертежа); вне чертежа страница листается как обычно.
 *
 * Кадр перерисовывает сам чертёж в onVid — не чаще раза в кадр
 * экрана. Чертёж, который никто не трогает, не перерисовывается.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

export interface Vid {
  /** Азимут, градусы: поворот вокруг вертикали. */
  az: number;
  /** Подъём взгляда, градусы: 0 — сбоку, 90 — сверху. */
  el: number;
  /** Масштаб: 1 — фигура вписана в окно. */
  zum: number;
}

export const PODYOM_MIN = 5;
export const PODYOM_MAX = 85;
/** Подъём кнопки «Сверху». */
export const PODYOM_SVERKHU = 82;
export const ZUM_MIN = 0.7;
export const ZUM_MAX = 3;
const ZUM_SHAG = 1.25;
/** Градусов поворота на пиксель перетаскивания. */
const NA_PIKSEL = 0.5;
/** Сдвиг, после которого касание — уже перетаскивание, px. */
const SDVIG_TAPA = 7;
/** Затухание инерции за кадр 16 мс и скорость остановки, °/мс. */
const ZATUKHANIE = 0.9;
const STOP = 0.004;
/** Шаг поворота стрелками клавиатуры, градусы. */
const NA_KLAVISHU = 10;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Подсказку «Крутите фигуру» показываем, пока ученик ни разу не повернул чертёж. */
const KLYUCH_PODSKAZKI = 'budetege:stereo:povernul';

function uzhePovorachival(): boolean {
  try {
    return window.localStorage.getItem(KLYUCH_PODSKAZKI) === '1';
  } catch {
    return false;
  }
}

function zapomnitPovorot(): void {
  try {
    window.localStorage.setItem(KLYUCH_PODSKAZKI, '1');
  } catch {
    /* хранилище закрыто — подсказка просто покажется снова */
  }
}

const bezPodpiski = () => () => undefined;

export interface VrashchenieOpts {
  /** Область чертежа: на неё вешаются жесты. */
  oblast: React.RefObject<HTMLDivElement | null>;
  /** Ракурс по умолчанию — к нему ведёт «Сбросить вид». */
  az: number;
  el: number;
  /** Новый вид: перерисовать чертёж. Зовётся не чаще раза в кадр. */
  onVid: (vid: Vid) => void;
}

export interface Vrashchenie {
  vid: Vid;
  /** Ученик уже вращал чертёж — подсказка не нужна. */
  povernul: boolean;
  /** Фигура повёрнута или увеличена — «Сбросить вид» есть что сбрасывать. */
  izmenyon: boolean;
  sverkhu: boolean;
  plus: () => void;
  minus: () => void;
  sbrosit: () => void;
  /** «Сверху» ↔ прежний подъём. */
  sverhu: () => void;
  /** Стрелки клавиатуры на области чертежа. */
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function useVrashchenie({ oblast, az, el, onVid }: VrashchenieOpts): Vrashchenie {
  const tek = useRef<Vid>({ az, el, zum: 1 });
  const [vid, setVid] = useState<Vid>({ az, el, zum: 1 });
  /* Повернул раньше (на любом чертеже) — из хранилища; без скриптов и
     на сборке — «да», чтобы подсказка не мелькала. */
  const bylo = useSyncExternalStore(bezPodpiski, uzhePovorachival, () => true);
  const [rukami, setRukami] = useState(false);
  const onVidRef = useRef(onVid);
  useEffect(() => {
    onVidRef.current = onVid;
  }, [onVid]);
  const raf = useRef(0);
  const inerciya = useRef(0);

  /* Новый ракурс по умолчанию (другая задача) — вид с начала. */
  const [prezhniy, setPrezhniy] = useState({ az, el });
  if (prezhniy.az !== az || prezhniy.el !== el) {
    setPrezhniy({ az, el });
    setVid({ az, el, zum: 1 });
  }
  useEffect(() => {
    tek.current = { az, el, zum: 1 };
  }, [az, el]);

  /* Кадр — не чаще раза в кадр экрана. */
  const narisovat = useCallback(() => {
    if (raf.current !== 0) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      setVid(tek.current);
      onVidRef.current(tek.current);
    });
  }, []);

  const postavit = useCallback(
    (next: Partial<Vid>, rukami = false) => {
      const v = { ...tek.current, ...next };
      tek.current = {
        az: ((((v.az + 180) % 360) + 360) % 360) - 180,
        el: clamp(v.el, PODYOM_MIN, PODYOM_MAX),
        zum: clamp(v.zum, ZUM_MIN, ZUM_MAX),
      };
      if (rukami) {
        setRukami((was) => {
          if (!was) zapomnitPovorot();
          return true;
        });
      }
      narisovat();
    },
    [narisovat],
  );

  const ostanovit = () => {
    if (inerciya.current !== 0) cancelAnimationFrame(inerciya.current);
    inerciya.current = 0;
  };

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      ostanovit();
    },
    [],
  );

  /* Жесты: свои слушатели на узле — нужны passive: false (колесо) и
     захват указателя только после сдвига (иначе касание не дойдёт до
     цели как клик). */
  useEffect(() => {
    const node = oblast.current;
    if (node === null) return undefined;
    const ukazateli = new Map<number, { x: number; y: number }>();
    let start: { x: number; y: number; id: number } | null = null;
    let tyanem = false;
    let shchipok: { d: number; zum: number } | null = null;
    /* Скорость поворота по последним движениям, °/мс. */
    let skorost = { az: 0, el: 0 };
    let proshloe = { t: 0, x: 0, y: 0 };
    let glushitKlik = false;

    const rasstoyanie = () => {
      const [a, b] = [...ukazateli.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      ostanovit();
      ukazateli.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ukazateli.size === 2) {
        shchipok = { d: rasstoyanie(), zum: tek.current.zum };
        tyanem = true;
        try {
          node.setPointerCapture(e.pointerId);
        } catch {
          /* указатель уже ушёл */
        }
        return;
      }
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      tyanem = false;
      skorost = { az: 0, el: 0 };
      proshloe = { t: e.timeStamp, x: e.clientX, y: e.clientY };
    };

    const move = (e: PointerEvent) => {
      if (!ukazateli.has(e.pointerId)) return;
      ukazateli.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (shchipok !== null && ukazateli.size >= 2) {
        const d = rasstoyanie();
        if (shchipok.d > 0) postavit({ zum: (shchipok.zum * d) / shchipok.d });
        e.preventDefault();
        return;
      }
      if (start === null || start.id !== e.pointerId) return;
      if (!tyanem) {
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < SDVIG_TAPA) return;
        tyanem = true;
        try {
          node.setPointerCapture(e.pointerId);
        } catch {
          /* указатель уже ушёл */
        }
      }
      e.preventDefault();
      const dx = e.clientX - proshloe.x;
      const dy = e.clientY - proshloe.y;
      const dt = Math.max(1, e.timeStamp - proshloe.t);
      proshloe = { t: e.timeStamp, x: e.clientX, y: e.clientY };
      const dAz = -dx * NA_PIKSEL;
      const dEl = dy * NA_PIKSEL;
      /* Сглаженная скорость — для инерции после отпускания. */
      skorost = {
        az: skorost.az * 0.5 + (dAz / dt) * 0.5,
        el: skorost.el * 0.5 + (dEl / dt) * 0.5,
      };
      postavit({ az: tek.current.az + dAz, el: tek.current.el + dEl }, true);
    };

    const up = (e: PointerEvent) => {
      if (!ukazateli.has(e.pointerId)) return;
      ukazateli.delete(e.pointerId);
      if (shchipok !== null) {
        if (ukazateli.size < 2) shchipok = null;
        glushitKlik = true;
        start = null;
        return;
      }
      if (start?.id !== e.pointerId) return;
      start = null;
      if (!tyanem) return;
      tyanem = false;
      glushitKlik = true;
      /* Палец стоял перед отпусканием — без инерции. */
      if (e.timeStamp - proshloe.t > 80) return;
      let v = { ...skorost };
      let t = performance.now();
      const shag = (now: number) => {
        const dt = Math.min(48, now - t);
        t = now;
        v = { az: v.az * ZATUKHANIE ** (dt / 16), el: v.el * ZATUKHANIE ** (dt / 16) };
        if (Math.abs(v.az) < STOP && Math.abs(v.el) < STOP) {
          inerciya.current = 0;
          return;
        }
        postavit({ az: tek.current.az + v.az * dt, el: tek.current.el + v.el * dt });
        inerciya.current = requestAnimationFrame(shag);
      };
      inerciya.current = requestAnimationFrame(shag);
    };

    /* Перетаскивание не выбирает грань: клик после него глушится. */
    const click = (e: MouseEvent) => {
      if (!glushitKlik) return;
      glushitKlik = false;
      e.stopPropagation();
      e.preventDefault();
    };
    const sbrosKlika = () => {
      window.setTimeout(() => {
        glushitKlik = false;
      }, 0);
    };

    const wheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      ostanovit();
      /* Щипок на тачпаде приходит колесом с ctrlKey — он мельче. */
      const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      postavit({ zum: tek.current.zum * k });
    };

    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move, { passive: false });
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    node.addEventListener('click', click, true);
    node.addEventListener('pointerup', sbrosKlika);
    node.addEventListener('wheel', wheel, { passive: false });
    return () => {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', up);
      node.removeEventListener('click', click, true);
      node.removeEventListener('pointerup', sbrosKlika);
      node.removeEventListener('wheel', wheel);
    };
  }, [oblast, postavit]);

  const sverkhu = vid.el > 60;

  return {
    vid,
    povernul: bylo || rukami,
    izmenyon: Math.abs(vid.az - az) > 0.5 || Math.abs(vid.el - el) > 0.5 || vid.zum !== 1,
    sverkhu,
    plus: () => postavit({ zum: tek.current.zum * ZUM_SHAG }),
    minus: () => postavit({ zum: tek.current.zum / ZUM_SHAG }),
    sbrosit: () => {
      ostanovit();
      postavit({ az, el, zum: 1 });
    },
    sverhu: () => {
      ostanovit();
      postavit({ el: tek.current.el > 60 ? el : PODYOM_SVERKHU });
    },
    onKeyDown: (e) => {
      const d: Record<string, [number, number]> = {
        ArrowLeft: [NA_KLAVISHU, 0],
        ArrowRight: [-NA_KLAVISHU, 0],
        ArrowUp: [0, NA_KLAVISHU],
        ArrowDown: [0, -NA_KLAVISHU],
      };
      const s = d[e.key];
      if (s !== undefined) {
        e.preventDefault();
        postavit({ az: tek.current.az + s[0], el: tek.current.el + s[1] }, true);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        postavit({ zum: tek.current.zum * ZUM_SHAG });
      } else if (e.key === '-') {
        e.preventDefault();
        postavit({ zum: tek.current.zum / ZUM_SHAG });
      }
    },
  };
}
