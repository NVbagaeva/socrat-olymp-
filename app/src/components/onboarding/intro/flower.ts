/**
 * Заставка из слоёв (2.5D). Сценарий:
 *   0–0,8   октаэдр F проявляется из мягкого сияния (0,9 → 1), по граням
 *           проходит блик, на вершинах вспыхивают искры;
 *   0,8–1,6 октаэдр «вдыхает» (1 → 1,04), тёплая вспышка — и под ней F
 *           сменяется короной G с пружинным раскрытием; корона перетекает
 *           в чашечку B, на T_SEAM — вторая вспышка;
 *   1,6–3,5 из чашечки по очереди вырастают внешние лепестки C, через
 *           0,3 с — внутренние D, затем тычинки E с пульсом свечения;
 *   дальше  блик по лепесткам, «дыхание» после окна, остановка на 20 с.
 *
 * Всё — стили, посчитанные из времени t: кадр любого момента одинаков.
 * Разметку строит IntroSplash (элементы с data-layer), здесь — только
 * transform и opacity.
 */

import { BASE, LAYERS, type LayerId } from './layers.gen';
import type { Stage } from './stage';
import { IDLE_STOP_S, T_CARD, clamp01, easeOutCubic, smooth, span } from './timeline';

/** Тёплая вспышка, под которой октаэдр сменяется короной. */
export const T_CROWN_IN = 1.15;
/** Корона перетекла в чашечку — вторая вспышка. */
export const T_SEAM = 1.6;
/** Когда вырастает каждый ярус. */
export const T_OUTER = T_SEAM + 0.15;
export const T_INNER = T_OUTER + 0.3;
export const T_STAMENS = T_INNER + 0.35;

/** Октаэдр в рамке чуть меньше короны — размер кадра 1. */
const OCTA_SCALE = 0.84;

/** Затухающая пружина: 0 → 1 с перелётом ≈ 5 %, ровно 1 в конце. */
function springy(x: number): number {
  const c = clamp01(x);
  const u = 1 - c;
  return 1 - u * u * u * Math.cos(c * Math.PI * 1.15) * (1 + 0.6 * c);
}

/** Рост яруса: масштаб 0,3 → 1 с пружинкой, прозрачность 0 → 1. */
function grow(t: number, start: number, dur = 0.9): { s: number; a: number } {
  return {
    s: 0.3 + 0.7 * springy((t - start) / dur),
    a: smooth(span(t, start, start + 0.35)),
  };
}

const gauss = (t: number, at: number, w: number) => Math.exp(-(((t - at) / w) ** 2));

export interface Phase {
  /** Масштаб и прозрачность октаэдра F, короны G, чашечки B. */
  f: { s: number; a: number };
  g: { s: number; a: number };
  b: { s: number; a: number };
  /** Вспышки: тёплая (F → G) и стык (G → B). */
  flash: number;
  /** Сияние, из которого проявляется октаэдр. */
  halo: number;
  /** Тёплое сердце внутри октаэдра и короны (кадр 2). */
  heart: number;
  /** Световое пятно на «полу» под нижней вершиной. */
  floor: number;
}

export function phaseAt(t: number): Phase {
  const reveal = easeOutCubic(span(t, 0, 0.8));
  const inhale = smooth(span(t, 0.8, T_CROWN_IN));
  const fOut = smooth(span(t, T_CROWN_IN - 0.05, T_CROWN_IN + 0.1));
  const gIn = smooth(span(t, T_CROWN_IN - 0.05, T_CROWN_IN + 0.12));
  /* Корона → чашечка — под вспышкой стыка, без двоения. */
  const gOut = smooth(span(t, T_SEAM - 0.1, T_SEAM + 0.03));
  return {
    f: {
      s: OCTA_SCALE * (0.9 + 0.1 * reveal) * (1 + 0.04 * inhale),
      a: smooth(span(t, 0.05, 0.6)) * (1 - fOut),
    },
    g: { s: 0.85 + 0.15 * springy((t - T_CROWN_IN + 0.05) / 0.5), a: gIn * (1 - gOut) },
    b: { s: 0.97 + 0.03 * smooth(span(t, T_SEAM - 0.1, T_SEAM + 0.05)), a: gOut },
    flash: 0.55 * gauss(t, T_CROWN_IN, 0.09) + 0.8 * gauss(t, T_SEAM, 0.11),
    halo: gauss(t, 0.12, 0.3) * (1 - span(t, 0.4, 0.9)),
    heart: smooth(span(t, 0.75, T_CROWN_IN)) * (1 - smooth(span(t, T_SEAM, T_STAMENS))),
    floor: smooth(span(t, 0.15, 0.7)),
  };
}

/** «Дыхание» после окна: 1 ↔ 1,015, к остановке затихает. */
export function breathAt(t: number): number {
  const on =
    smooth(span(t, T_CARD, T_CARD + 1)) * (1 - smooth(span(t, IDLE_STOP_S - 2, IDLE_STOP_S)));
  return 1 + 0.0075 * (1 - Math.cos(((t - T_CARD) / 4) * Math.PI * 2)) * on;
}

/** Положение полосы блика 0…1 на слое (или −1 — полосы нет). */
function glintAt(id: 'F' | 'C' | 'D', t: number): number {
  if (id === 'F') {
    const g = span(t, 0.3, 1.05);
    return g > 0 && g < 1 ? g : -1;
  }
  const first = span(t, T_STAMENS + 0.2 + (id === 'D' ? 0.15 : 0), T_STAMENS + 1.4);
  if (first > 0 && first < 1) return first;
  /* Потом — раз в 7 с, медленно, до остановки. */
  if (t > T_CARD + 1 && t < IDLE_STOP_S - 1.5) {
    const c = ((t - T_CARD - 1) % 7) / 2.2;
    if (c < 1) return c;
  }
  return -1;
}

export class FlowerDom {
  private readonly stage: HTMLElement;
  private readonly layer = new Map<LayerId, HTMLElement>();
  private readonly glints: HTMLElement[];
  private readonly core: HTMLElement | null;
  private readonly flash: HTMLElement | null;
  private readonly halo: HTMLElement | null;
  private readonly floor: HTMLElement | null;

  constructor(stage: HTMLElement) {
    this.stage = stage;
    for (const el of stage.querySelectorAll<HTMLElement>('[data-layer]')) {
      this.layer.set(el.dataset.layer as LayerId, el);
    }
    this.glints = Array.from(stage.querySelectorAll<HTMLElement>('[data-glint]'));
    this.core = stage.querySelector<HTMLElement>('[data-core]');
    this.floor = stage.querySelector<HTMLElement>('[data-floor]');
    this.flash = stage.parentElement?.querySelector<HTMLElement>('[data-flash]') ?? null;
    this.halo = stage.parentElement?.querySelector<HTMLElement>('[data-halo]') ?? null;
  }

  /** Статичный режим: только собранный цветок A. */
  renderStatic(stage: Stage): void {
    this.place(stage, 1);
    this.set('A', 1, 1);
    if (this.floor !== null) this.floor.style.opacity = '1';
  }

  render(t: number, stage: Stage): void {
    const ph = phaseAt(t);
    this.place(stage, breathAt(t));
    this.set('F', ph.f.a, ph.f.s);
    this.set('G', ph.g.a, ph.g.s);
    this.set('B', ph.b.a, ph.b.s);
    const c = grow(t, T_OUTER);
    this.set('C', c.a, c.s);
    const d = grow(t, T_INNER);
    this.set('D', d.a, d.s);
    const e = grow(t, T_STAMENS, 0.8);
    this.set('E', e.a, 0.4 + 0.6 * ((e.s - 0.3) / 0.7));

    /* Свет сердцевины: тёплое сердце в кристалле, потом — с тычинками,
       мягко пульсирует. */
    if (this.core !== null) {
      const t0 = Math.min(t, IDLE_STOP_S);
      const pulse = 0.8 + 0.2 * Math.sin(t0 * 2.4);
      const stamens = smooth(span(t, T_STAMENS, T_STAMENS + 0.6));
      this.core.style.opacity = String(Math.max(0.7 * ph.heart, stamens) * pulse);
    }
    if (this.floor !== null) this.floor.style.opacity = String(ph.floor);
    /* Блик: светлая полоса по маске слоя слева направо; масштаб — как у слоя. */
    const tg = Math.min(t, IDLE_STOP_S);
    for (const el of this.glints) {
      const id = el.dataset.glint as 'F' | 'C' | 'D';
      const g = glintAt(id, tg);
      const owner = id === 'F' ? ph.f : id === 'C' ? c : d;
      el.style.opacity = g < 0 ? '0' : String(Math.sin(Math.PI * g) * 0.75 * owner.a);
      el.style.backgroundPosition = `${(1 - Math.max(g, 0)) * 100}% 0`;
      el.style.transform = `scale(${owner.s})`;
    }
    if (this.flash !== null) this.flash.style.opacity = String(ph.flash);
    if (this.halo !== null) this.halo.style.opacity = String(ph.halo);
  }

  private place(stage: Stage, breath: number): void {
    const k = stage.k * breath;
    const x = stage.x + BASE.x * stage.k * (1 - breath);
    const y = stage.y + BASE.y * stage.k * (1 - breath);
    this.stage.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
    /* Вспышка и сияние — в центре октаэдра и короны, размером с них. */
    const cx = stage.x + BASE.x * stage.k;
    const cy = stage.y + (BASE.y - 470) * stage.k;
    const glows: [HTMLElement | null, number][] = [
      [this.flash, 620],
      [this.halo, 1100],
    ];
    for (const [el, size] of glows) {
      if (el === null) continue;
      const r = size * stage.k;
      el.style.transform = `translate(${cx - r / 2}px, ${cy - r / 2}px)`;
      el.style.width = el.style.height = `${r}px`;
    }
  }

  private set(id: LayerId, alpha: number, scale: number): void {
    const el = this.layer.get(id);
    if (el === undefined) return;
    el.style.opacity = String(alpha);
    el.style.visibility = alpha > 0.001 ? 'visible' : 'hidden';
    el.style.transform = scale === 1 ? '' : `scale(${scale})`;
  }
}

/** Стиль слоя в рамке: положение и точка роста — основание цветка. */
export function layerStyle(id: LayerId): Record<string, string | number> {
  const b = LAYERS[id];
  return {
    left: b.x,
    top: b.y,
    width: b.w,
    height: b.h,
    transformOrigin: `${BASE.x - b.x}px ${BASE.y - b.y}px`,
  };
}
