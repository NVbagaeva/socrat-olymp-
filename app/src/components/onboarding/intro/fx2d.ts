/**
 * Эффекты поверх слоёв: светящиеся частицы, поднимающиеся вверх, и
 * искры на золотых вершинах октаэдра F, короны G и чашечки B (вершины
 * нашёл scripts/build-intro-layers.mjs). Canvas 2D, сложение света
 * ('lighter'). Всё — функция времени: кадр любого момента одинаков.
 */

import { breathAt, phaseAt, T_SEAM } from './flower';
import { BASE, SPARKS } from './layers.gen';
import type { Stage } from './stage';
import { IDLE_STOP_S, T_CARD, smooth, span } from './timeline';

interface Particle {
  x: number;
  y: number;
  rise: number;
  life: number;
  phase: number;
  size: number;
  hue: 0 | 1 | 2;
}

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Цвета: белый, голубой (--blue-300), тёплый (--terracotta → светлее). */
const COLORS = ['255,255,255', '155,192,242', '255,200,140'] as const;

export class Fx2D {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;
  private readonly particles: Particle[];
  private w = 1;
  private h = 1;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement, phone: boolean) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    const rand = rng(17);
    const n = phone ? 22 : 44;
    this.particles = Array.from({ length: n }, () => ({
      x: BASE.x + (rand() - 0.5) * 900,
      y: BASE.y - 120 - rand() * 380,
      rise: 220 + rand() * 260,
      life: 2.6 + rand() * 2.2,
      phase: rand(),
      size: 3 + rand() * 4.5,
      hue: (rand() < 0.5 ? 2 : rand() < 0.6 ? 0 : 1) as 0 | 1 | 2,
    }));
  }

  setView(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
  }

  render(t: number, stage: Stage): void {
    const g = this.ctx;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.w, this.h);
    g.globalCompositeOperation = 'lighter';
    const breath = breathAt(t);
    const k = stage.k * breath;
    const ox = stage.x + BASE.x * stage.k * (1 - breath);
    const oy = stage.y + BASE.y * stage.k * (1 - breath);
    const px = (x: number) => ox + x * k;
    const py = (y: number) => oy + y * k;
    /* Масштаб размеров: на крупном цветке частицы крупнее. */
    const unit = Math.max(0.6, k / 0.55);

    /* Частицы: «немного и деликатно»; после окна — реже, к остановке гаснут. */
    const t0 = Math.min(t, IDLE_STOP_S);
    const amount =
      (0.3 * smooth(span(t0, 0.2, 0.8)) + 0.7 * smooth(span(t0, T_SEAM, T_SEAM + 0.8))) *
      (1 - 0.55 * smooth(span(t0, T_CARD, T_CARD + 2))) *
      (1 - smooth(span(t0, IDLE_STOP_S - 1.5, IDLE_STOP_S)));
    this.particles.forEach((p, i) => {
      if (i / this.particles.length > amount) return;
      const life = (t0 / p.life + p.phase) % 1;
      if (life < 0) return;
      const a = Math.sin(Math.PI * life);
      const x = px(p.x + Math.sin(t0 * 0.9 + i) * 14);
      const y = py(p.y - p.rise * life);
      const r = p.size * unit;
      const grad = g.createRadialGradient(x, y, 0, x, y, r * 3);
      grad.addColorStop(0, `rgba(${COLORS[p.hue]},${0.9 * a})`);
      grad.addColorStop(0.3, `rgba(${COLORS[p.hue]},${0.35 * a})`);
      grad.addColorStop(1, `rgba(${COLORS[p.hue]},0)`);
      g.fillStyle = grad;
      g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    });

    /* Искры на вершинах того слоя, что сейчас виден: масштаб — как у слоя
       (вокруг основания). Мерцают по очереди. */
    const ph = phaseAt(t);
    const groups: [readonly { x: number; y: number; w: number }[], { s: number; a: number }][] = [
      [SPARKS.F, ph.f],
      [SPARKS.G, ph.g],
      [SPARKS.B, ph.b],
    ];
    const lit = smooth(span(t, 0.15, 0.55));
    let n = 0;
    for (const [points, layer] of groups) {
      if (layer.a < 0.02) continue;
      for (const v of points) {
        n += 1;
        const tw = 0.5 + 0.5 * Math.sin(t0 * (1.3 + (n % 5) * 0.37) + n * 2.1);
        const a = lit * layer.a * v.w * (0.35 + 0.65 * tw * tw);
        if (a < 0.02) continue;
        const x = px(BASE.x + (v.x - BASE.x) * layer.s);
        const y = py(BASE.y + (v.y - BASE.y) * layer.s);
        const r = 26 * unit * (0.7 + 0.3 * tw);
        const core = g.createRadialGradient(x, y, 0, x, y, r * 0.45);
        core.addColorStop(0, `rgba(255,255,255,${a})`);
        core.addColorStop(1, 'rgba(255,220,170,0)');
        g.fillStyle = core;
        g.fillRect(x - r, y - r, r * 2, r * 2);
        g.fillStyle = `rgba(255,235,205,${0.7 * a})`;
        g.fillRect(x - r, y - 0.8, r * 2, 1.6);
        g.fillRect(x - 0.8, y - r, 1.6, r * 2);
      }
    }
    g.globalCompositeOperation = 'source-over';
  }
}
