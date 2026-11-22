'use client';

/**
 * Перемещение и масштаб «Карты ЕГЭ».
 *
 * Слой карты — прямоугольник в координатах фона (1586 × 992). Вид —
 * масштаб k и сдвиг (x, y): точка карты (px, py) стоит на экране в
 * (x + px·k, y + py·k) от левого верхнего угла окна карты. Вид пишется
 * прямо в стили (переменные --k, --x, --y), минуя React: при
 * перетаскивании дерево не перерисовывается, поэтому рывков нет. Вся
 * логика — в классе Holst, у React только подключение к элементу.
 *
 * Жесты — Pointer Events:
 *   один палец или мышь — перетаскивание;
 *   два пальца — масштаб вокруг середины между ними и сдвиг;
 *   короткое касание без движения — выбор (onTap), оно никогда не
 *     срабатывает вместо перетаскивания, и наоборот;
 *   Ctrl/⌘ + колесо и щипок на тачпаде — масштаб вокруг курсора; простое
 *     колесо прокручивает страницу.
 */

import { useEffect, useState, type RefObject } from 'react';

export interface Vid {
  k: number;
  x: number;
  y: number;
}

export interface Pryamougolnik {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Polya {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface HolstOptions {
  /** Окно карты: элемент с overflow: hidden, в нём лежит слой. */
  okno: RefObject<HTMLDivElement | null>;
  /** Размер слоя карты в её координатах. */
  shirina: number;
  vysota: number;
  /** Самый крупный масштаб (экранных пикселей на пиксель карты). */
  maxK: number;
  /** Короткое касание: координаты на экране. */
  onTap: (clientX: number, clientY: number) => void;
  /** Вид изменился (после жеста или анимации). */
  onVid?: (vid: Vid, mir: number) => void;
}

/** Сколько пикселей можно сдвинуть палец, чтобы касание осталось касанием. */
const DOPUSK_KASANIYA = 8;
const VREMYA_KASANIYA = 600;
const PEREHOD_MS = 480;
const POLYA: Polya = { top: 16, right: 16, bottom: 16, left: 16 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface Zhest {
  start: Vid;
  /** Середина касаний в начале (координаты окна) и расстояние между ними. */
  cx: number;
  cy: number;
  dist: number;
  /** Было ли движение больше допуска. */
  dvigalsya: boolean;
  at: number;
  palcev: number;
}

export class Holst {
  opts: HolstOptions;
  private el: HTMLDivElement | null = null;
  private vidTek: Vid = { k: 1, x: 0, y: 0 };
  /** Масштаб вида «Весь мир» для текущего размера окна. */
  private mirTek = 1;
  private pointers = new Map<number, { x: number; y: number }>();
  private zhest: Zhest | null = null;
  private taymer: number | null = null;
  private nachaloShchipka = 1;

  constructor(opts: HolstOptions) {
    this.opts = opts;
  }

  /** Свежие настройки и обработчики от компонента. */
  ustanovit(opts: HolstOptions): void {
    this.opts = opts;
  }

  vid(): Vid {
    return this.vidTek;
  }

  mir(): number {
    return this.mirTek;
  }

  private razmer() {
    const r = this.el?.getBoundingClientRect();
    return r === undefined
      ? { w: 1, h: 1, left: 0, top: 0 }
      : { w: r.width, h: r.height, left: r.left, top: r.top };
  }

  private maxK(): number {
    return Math.max(this.mirTek, this.opts.maxK);
  }

  /** Не дать карте уехать за край: в окне всегда остаётся её середина. */
  private vGranicah(v: Vid): Vid {
    const { w, h } = this.razmer();
    const { shirina, vysota } = this.opts;
    const k = clamp(v.k, this.mirTek, this.maxK());
    const kw = shirina * k;
    const kh = vysota * k;
    /* Края карты не заходят внутрь окна дальше, чем на его треть: карту
       можно сдвинуть, чтобы нужная часть вышла из-под панели, но нельзя
       увезти с глаз. */
    const zapasX = w / 3;
    const zapasY = h / 3;
    const x = clamp(v.x, Math.min(0, w - kw) - zapasX, Math.max(0, w - kw) + zapasX);
    const y = clamp(v.y, Math.min(0, h - kh) - zapasY, Math.max(0, h - kh) + zapasY);
    return { k, x, y };
  }

  private primenit(v: Vid, plavno = false): void {
    const el = this.el;
    this.vidTek = v;
    if (el === null) return;
    const bezAnimacii = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.taymer !== null) window.clearTimeout(this.taymer);
    if (plavno && !bezAnimacii) {
      el.dataset.plavno = '1';
      this.taymer = window.setTimeout(() => {
        delete el.dataset.plavno;
        this.taymer = null;
      }, PEREHOD_MS + 40);
    } else {
      delete el.dataset.plavno;
    }
    el.style.setProperty('--k', String(v.k));
    el.style.setProperty('--x', `${v.x}px`);
    el.style.setProperty('--y', `${v.y}px`);
    this.opts.onVid?.(v, this.mirTek);
  }

  /** Вид, в котором прямоугольник карты вписан в окно с полями. */
  private vidDlya(p: Pryamougolnik, polya: Polya, maxK?: number): Vid {
    const { w, h } = this.razmer();
    const mesto = {
      w: Math.max(40, w - polya.left - polya.right),
      h: Math.max(40, h - polya.top - polya.bottom),
    };
    const predel = this.maxK();
    const k = clamp(
      Math.min(mesto.w / p.w, mesto.h / p.h),
      this.mirTek,
      Math.min(predel, maxK ?? predel),
    );
    return this.vGranicah({
      k,
      x: polya.left + mesto.w / 2 - (p.x + p.w / 2) * k,
      y: polya.top + mesto.h / 2 - (p.y + p.h / 2) * k,
    });
  }

  /** Плавно подъехать к прямоугольнику карты. */
  pokazat(p: Pryamougolnik, polya: Polya = POLYA, maxK?: number): void {
    this.primenit(this.vidDlya(p, polya, maxK), true);
  }

  vesMir(plavno = true): void {
    const { w, h } = this.razmer();
    const { shirina, vysota } = this.opts;
    this.mirTek = Math.min(w / shirina, h / vysota);
    this.primenit(this.vGranicah(this.poCentru(this.mirTek)), plavno);
  }

  /** Вид с картой по центру окна при масштабе k. */
  private poCentru(k: number): Vid {
    const { w, h } = this.razmer();
    return { k, x: (w - this.opts.shirina * k) / 2, y: (h - this.opts.vysota * k) / 2 };
  }

  /** Масштаб вокруг точки окна (по умолчанию — вокруг середины). */
  masshtab(mnozhitel: number, tochka?: { x: number; y: number }, plavno = true): void {
    const { w, h } = this.razmer();
    const p = tochka ?? { x: w / 2, y: h / 2 };
    const v = this.vidTek;
    const k = clamp(v.k * mnozhitel, this.mirTek, this.maxK());
    const m = k / v.k;
    this.primenit(
      this.vGranicah({ k, x: p.x - (p.x - v.x) * m, y: p.y - (p.y - v.y) * m }),
      plavno,
    );
  }

  /* ── Подключение к элементу ───────────────────────────────────── */

  podklyuchit(el: HTMLDivElement): () => void {
    this.el = el;
    let prezhniy = this.razmer();
    this.vesMir(false);
    el.dataset.gotov = '1';

    /* Размер окна изменился: сохраняем середину и кратность. */
    const ro = new ResizeObserver(() => {
      const novyy = this.razmer();
      if (Math.abs(novyy.w - prezhniy.w) < 1 && Math.abs(novyy.h - prezhniy.h) < 1) return;
      const v = this.vidTek;
      const staryyMir = this.mirTek;
      const { shirina, vysota } = this.opts;
      this.mirTek = Math.min(novyy.w / shirina, novyy.h / vysota);
      const kratnost = v.k / staryyMir;
      if (kratnost <= 1.01) {
        this.primenit(this.vGranicah(this.poCentru(this.mirTek)));
      } else {
        const cx = (prezhniy.w / 2 - v.x) / v.k;
        const cy = (prezhniy.h / 2 - v.y) / v.k;
        const k = this.mirTek * kratnost;
        this.primenit(this.vGranicah({ k, x: novyy.w / 2 - cx * k, y: novyy.h / 2 - cy * k }));
      }
      prezhniy = novyy;
    });
    ro.observe(el);

    const mesto = (e: { clientX: number; clientY: number }) => {
      const r = this.razmer();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const nachat = () => {
      const pts = [...this.pointers.values()];
      const a = pts[0];
      if (a === undefined) {
        this.zhest = null;
        return;
      }
      const b = pts[1];
      const prezhniyZhest = this.zhest;
      this.zhest = {
        start: this.vidTek,
        cx: b === undefined ? a.x : (a.x + b.x) / 2,
        cy: b === undefined ? a.y : (a.y + b.y) / 2,
        dist: b === undefined ? 0 : Math.hypot(a.x - b.x, a.y - b.y),
        /* Второй палец или уже начатое движение — это не касание. */
        dvigalsya: prezhniyZhest?.dvigalsya === true || pts.length > 1,
        at: prezhniyZhest?.at ?? performance.now(),
        palcev: Math.max(prezhniyZhest?.palcev ?? 0, pts.length),
      };
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      /* Кнопки и ссылки поверх карты живут своей жизнью. */
      if ((e.target as Element | null)?.closest('[data-karta-ne-holst]') != null) return;
      this.pointers.set(e.pointerId, mesto(e));
      if (this.pointers.size === 1) this.zhest = null;
      nachat();
    };

    const move = (e: PointerEvent) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.set(e.pointerId, mesto(e));
      const g = this.zhest;
      if (g === null) return;
      const pts = [...this.pointers.values()];
      const a = pts[0];
      if (a === undefined) return;
      const b = pts[1];
      const cx = b === undefined ? a.x : (a.x + b.x) / 2;
      const cy = b === undefined ? a.y : (a.y + b.y) / 2;
      if (!g.dvigalsya) {
        if (Math.hypot(cx - g.cx, cy - g.cy) < DOPUSK_KASANIYA) return;
        g.dvigalsya = true;
        /* Движение началось — забираем указатель, чтобы не терять его за краем. */
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* Указатель уже отпущен. */
        }
        el.dataset.tyanut = '1';
      }
      const m = b === undefined || g.dist === 0 ? 1 : Math.hypot(a.x - b.x, a.y - b.y) / g.dist;
      const k = clamp(g.start.k * m, this.mirTek, this.maxK());
      const mm = k / g.start.k;
      this.primenit(
        this.vGranicah({
          k,
          x: cx - (g.cx - g.start.x) * mm,
          y: cy - (g.cy - g.start.y) * mm,
        }),
      );
      e.preventDefault();
    };

    const up = (e: PointerEvent) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.delete(e.pointerId);
      const g = this.zhest;
      if (this.pointers.size === 0) {
        delete el.dataset.tyanut;
        this.zhest = null;
        if (
          g !== null &&
          e.type === 'pointerup' &&
          !g.dvigalsya &&
          g.palcev === 1 &&
          performance.now() - g.at < VREMYA_KASANIYA
        ) {
          this.opts.onTap(e.clientX, e.clientY);
        }
      } else {
        nachat();
      }
    };

    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      this.masshtab(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.01)), mesto(e), false);
    };

    /* Щипок на тачпаде в Safari: gesture*-события. */
    const gestureStart = (e: Event) => {
      e.preventDefault();
      this.nachaloShchipka = this.vidTek.k;
    };
    const gestureChange = (e: Event) => {
      e.preventDefault();
      const g = e as unknown as { scale: number; clientX: number; clientY: number };
      this.masshtab((this.nachaloShchipka * g.scale) / this.vidTek.k, mesto(g), false);
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('gesturestart', gestureStart);
    el.addEventListener('gesturechange', gestureChange);
    return () => {
      ro.disconnect();
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('gesturestart', gestureStart);
      el.removeEventListener('gesturechange', gestureChange);
      delete el.dataset.gotov;
      if (this.el === el) this.el = null;
    };
  }
}

/** Холст карты: один экземпляр на компонент, подключается к окну при монтировании. */
export function useHolst(options: HolstOptions): Holst {
  const [holst] = useState(() => new Holst(options));
  useEffect(() => {
    holst.ustanovit(options);
  });
  const { okno } = options;
  useEffect(() => {
    const el = okno.current;
    if (el === null) return undefined;
    return holst.podklyuchit(el);
  }, [holst, okno]);
  return holst;
}
