'use client';

import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { SNEG, WINTER_MODE } from '@/config/zima';
import { MOTION_LEVEL_ATTR } from '@/lib/motion';
import './sneg.css';

/**
 * Снег по краям блока: <canvas> на всю площадь родителя (у родителя —
 * position: relative и isolation: isolate; холст стоит на z-index: -1,
 * то есть над фоном блока и под его текстом и кнопками). Мышь не ловит.
 *
 * Гуще всего у левого и правого края, к середине сходит на нет: и сами
 * снежинки рождаются ближе к краям, и маска (sneg.css) гасит середину.
 * Три слоя глубины: дальний — мелкие медленные полупрозрачные; средний;
 * ближний — немного крупных, мягких и быстрых, среди них редкие
 * кристаллики с медленным вращением. Покачивание по синусоиде и общий
 * ветер, который медленно меняет силу и направление.
 *
 * Цвет — из CSS-переменных холста (sneg.css): в тёмной теме белый со
 * свечением, в светлой — серебристо-голубой. Тема и уровень движения
 * (data-tema, data-motion-level на <html>) отслеживаются на ходу.
 *
 * Бережём батарею: requestAnimationFrame, плотность пикселей не выше 2,
 * на телефоне и при data-motion-level="lite" снежинок меньше. Пауза,
 * когда блок ушёл с экрана и когда вкладка скрыта. При «Уменьшить
 * движение» — дюжина неподвижных снежинок по краям.
 *
 * Плотность: SNEG в config/zima.ts и множитель plotnost здесь.
 */

interface Sloj {
  dolya: number;
  r: [number, number];
  v: [number, number];
  alpha: [number, number];
  amp: [number, number];
  veter: number;
  myagkiy: boolean;
}

/* Дальний, средний, ближний. r — радиус ядра, px; v — px/с вниз. */
const SLOI: Sloj[] = [
  {
    dolya: 0.55,
    r: [0.7, 1.4],
    v: [12, 22],
    alpha: [0.3, 0.55],
    amp: [6, 14],
    veter: 0.45,
    myagkiy: false,
  },
  {
    dolya: 0.33,
    r: [1.4, 2.3],
    v: [24, 38],
    alpha: [0.55, 0.85],
    amp: [10, 20],
    veter: 0.8,
    myagkiy: false,
  },
  {
    dolya: 0.12,
    r: [2.6, 4.2],
    v: [42, 64],
    alpha: [0.4, 0.65],
    amp: [14, 28],
    veter: 1.2,
    myagkiy: true,
  },
];

interface Hlopya {
  x: number;
  y: number;
  r: number;
  v: number;
  alpha: number;
  amp: number;
  chastota: number;
  faza: number;
  sloj: number;
  kristall: boolean;
  ugol: number;
  vrash: number;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/* Доля ширины: ближе к краям чаще, к середине — реже. */
const uKraya = () => {
  const d = Math.pow(Math.random(), 1.8) * 0.5;
  return Math.random() < 0.5 ? d : 1 - d;
};

function vybratSloj() {
  let r = Math.random();
  for (let i = 0; i < SLOI.length; i++) {
    r -= SLOI[i]!.dolya;
    if (r <= 0) return i;
  }
  return 0;
}

function novaya(w: number, h: number, sverhu: boolean): Hlopya {
  const sloj = vybratSloj();
  const s = SLOI[sloj]!;
  const kristall = s.myagkiy && Math.random() < 0.35;
  return {
    x: uKraya() * w,
    y: sverhu ? rnd(-30, -6) : rnd(0, h),
    r: kristall ? rnd(4.2, 6.4) : rnd(s.r[0], s.r[1]),
    v: rnd(s.v[0], s.v[1]) * (kristall ? 0.7 : 1),
    alpha: kristall ? rnd(0.35, 0.55) : rnd(s.alpha[0], s.alpha[1]),
    amp: rnd(s.amp[0], s.amp[1]),
    chastota: rnd(0.4, 1.1),
    faza: rnd(0, Math.PI * 2),
    sloj,
    kristall,
    ugol: rnd(0, Math.PI),
    vrash: rnd(0.15, 0.4) * (Math.random() < 0.5 ? -1 : 1),
  };
}

/* Спрайты снежинок рисуются один раз на тему, кадр — только drawImage. */
interface Sprajty {
  tochka: HTMLCanvasElement;
  myagkaya: HTMLCanvasElement;
  kristall: HTMLCanvasElement;
}
/* Сколько радиусов ядра занимает спрайт точки вместе со свечением. */
const ORE = 2.6;

function sdelatSprajty(cvet: string, svechenie: number): Sprajty {
  const kholst = (n: number) => {
    const c = document.createElement('canvas');
    c.width = n;
    c.height = n;
    return c;
  };
  const rgba = (a: number) => `rgb(${cvet} / ${a})`;

  /* Чёткая точка: плотное ядро и ореол (в тёмной теме заметнее). */
  const tochka = kholst(64);
  let g = tochka.getContext('2d')!;
  let grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  const yadro = 1 / ORE;
  grad.addColorStop(0, rgba(1));
  grad.addColorStop(yadro * 0.7, rgba(1));
  grad.addColorStop(yadro, rgba(0.6 + svechenie * 0.2));
  grad.addColorStop(Math.min(1, yadro * 1.6), rgba(0.12 + svechenie * 0.22));
  grad.addColorStop(1, rgba(0));
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);

  /* Мягкая — для ближнего слоя: «не в фокусе». */
  const myagkaya = kholst(64);
  g = myagkaya.getContext('2d')!;
  grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, rgba(0.95));
  grad.addColorStop(0.3, rgba(0.75));
  grad.addColorStop(0.6, rgba(0.22 + svechenie * 0.12));
  grad.addColorStop(1, rgba(0));
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);

  /* Кристаллик: шесть лучей с веточками. */
  const kristall = kholst(96);
  g = kristall.getContext('2d')!;
  g.translate(48, 48);
  g.strokeStyle = rgba(1);
  g.lineCap = 'round';
  g.lineWidth = 3.2;
  if (svechenie > 0) {
    g.shadowColor = rgba(0.9);
    g.shadowBlur = 10 * svechenie;
  }
  for (let i = 0; i < 6; i++) {
    g.save();
    g.rotate((i * Math.PI) / 3);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, -34);
    g.moveTo(0, -14);
    g.lineTo(-8, -22);
    g.moveTo(0, -14);
    g.lineTo(8, -22);
    g.moveTo(0, -24);
    g.lineTo(-5, -29);
    g.moveTo(0, -24);
    g.lineTo(5, -29);
    g.stroke();
    g.restore();
  }
  return { tochka, myagkaya, kristall };
}

export function Sneg({ className, plotnost = 1 }: { className?: string; plotnost?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const html = document.documentElement;
    const tiho = window.matchMedia('(prefers-reduced-motion: reduce)');

    let w = 0;
    let h = 0;
    const hlopya: Hlopya[] = [];
    let sprajty: Sprajty | null = null;
    let raf = 0;
    let last = 0;
    let t = 0;
    let vidno = false;

    const rezhim = () => {
      const lvl = html.getAttribute(MOTION_LEVEL_ATTR);
      if (tiho.matches || lvl === 'reduce') return 'stoit' as const;
      return lvl === 'lite' ? ('lite' as const) : ('full' as const);
    };

    const skolko = () => {
      const r = rezhim();
      if (r === 'stoit') return 12;
      const baza = Math.min(SNEG.maksimum, ((w * h) / 10000) * SNEG.naPloshchad);
      const k = SNEG.plotnost * plotnost * (w < 768 ? SNEG.telefon : 1) * (r === 'lite' ? 0.5 : 1);
      return Math.max(0, Math.round(baza * k));
    };

    const perechitatCvet = () => {
      const st = getComputedStyle(canvas);
      const cvet = st.getPropertyValue('--sneg-cvet').trim() || '255 255 255';
      const svechenie = parseFloat(st.getPropertyValue('--sneg-svechenie')) || 0;
      sprajty = sdelatSprajty(cvet, svechenie);
    };

    const narisovat = () => {
      if (!sprajty) return;
      ctx.clearRect(0, 0, w, h);
      for (const f of hlopya) {
        ctx.globalAlpha = f.alpha;
        if (f.kristall) {
          const s = f.r * 2;
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.ugol);
          ctx.drawImage(sprajty.kristall, -s, -s, s * 2, s * 2);
          ctx.restore();
        } else {
          const s = f.r * ORE;
          const img = SLOI[f.sloj]!.myagkiy ? sprajty.myagkaya : sprajty.tochka;
          ctx.drawImage(img, f.x - s, f.y - s, s * 2, s * 2);
        }
      }
      ctx.globalAlpha = 1;
    };

    const shag = (dt: number) => {
      t += dt;
      /* Ветер медленно меняет силу и направление. */
      const veter = 9 * Math.sin(t * 0.13) + 5 * Math.sin(t * 0.41 + 1.3);
      for (let i = 0; i < hlopya.length; i++) {
        const f = hlopya[i]!;
        f.y += f.v * dt;
        f.x +=
          (veter * SLOI[f.sloj]!.veter + Math.cos(f.faza + t * f.chastota) * f.amp * f.chastota) *
          dt;
        if (f.kristall) f.ugol += f.vrash * dt;
        if (f.y - f.r * 3 > h) hlopya[i] = novaya(w, h, true);
        else if (f.x < -20) f.x += w + 40;
        else if (f.x > w + 20) f.x -= w + 40;
      }
    };

    const kadr = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      shag(dt);
      narisovat();
      raf = requestAnimationFrame(kadr);
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    };
    const obnovit = () => {
      const nado = vidno && !document.hidden && rezhim() !== 'stoit';
      if (nado && !raf) raf = requestAnimationFrame(kadr);
      else if (!nado) {
        stop();
        narisovat();
      }
    };

    const podognat = () => {
      const b = canvas.getBoundingClientRect();
      w = b.width;
      h = b.height;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = skolko();
      if (hlopya.length > n) hlopya.length = n;
      while (hlopya.length < n) hlopya.push(novaya(w, h, false));
      narisovat();
    };

    const naSmenu = () => {
      perechitatCvet();
      podognat();
      obnovit();
    };

    perechitatCvet();
    podognat();

    const ro = new ResizeObserver(podognat);
    ro.observe(canvas);
    const io = new IntersectionObserver(
      ([e]) => {
        vidno = e?.isIntersecting ?? false;
        obnovit();
      },
      { rootMargin: '80px 0px' },
    );
    io.observe(canvas);
    const mo = new MutationObserver(naSmenu);
    mo.observe(html, { attributes: true, attributeFilter: ['data-tema', MOTION_LEVEL_ATTR] });
    document.addEventListener('visibilitychange', obnovit);
    tiho.addEventListener('change', naSmenu);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener('visibilitychange', obnovit);
      tiho.removeEventListener('change', naSmenu);
    };
  }, [plotnost]);

  if (!WINTER_MODE) return null;
  return <canvas ref={ref} className={clsx('sneg', className)} aria-hidden="true" />;
}
