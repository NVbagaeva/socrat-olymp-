'use client';

import { useEffect, useRef } from 'react';
import { WINTER_MODE } from '@/config/zima';
import { MOTION_LEVEL_ATTR } from '@/lib/motion';
import './pingviny.css';

/**
 * Два пингвинёнка на верхнем краю карточки и снежный бортик по краю.
 * Ставится внутрь блока с position: relative (на «Об авторе» — полоса
 * показателей); место над карточкой оставляет about.css (.oa--zima).
 *
 * Левый — в синем шарфике, иногда машет крылышком. Правый — в оранжевой
 * шапочке с помпоном, иногда задирает голову и следит за снежинкой,
 * пока та не сядет ему на клюв. Оба дышат, моргают через случайные
 * промежутки и изредка переваливаются с лапы на лапу. Анимируются
 * только transform и opacity (pingviny.css), жесты включаются отсюда
 * через data-атрибуты.
 *
 * Пасхалка: тап или клик — пингвин подпрыгивает и выпускает сердечко
 * или облачко снежинок. Декор: aria-hidden, в табуляцию не попадает.
 * При «Уменьшить движение» стоят неподвижно.
 */

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

const ZHESTY = {
  sharf: [
    { id: 'mashet', ms: 1600, ves: 3 },
    { id: 'perevalka', ms: 1400, ves: 2 },
  ],
  shapka: [
    { id: 'smotrit', ms: 4200, ves: 3 },
    { id: 'perevalka', ms: 1400, ves: 2 },
  ],
} as const;

type Kto = keyof typeof ZHESTY;

function vybrat(kto: Kto) {
  const iz = ZHESTY[kto];
  let r = Math.random() * iz.reduce((s, z) => s + z.ves, 0);
  for (const z of iz) {
    r -= z.ves;
    if (r <= 0) return z;
  }
  return iz[0];
}

export function Pingviny() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const html = document.documentElement;
    const tiho = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stoyat = () => tiho.matches || html.getAttribute(MOTION_LEVEL_ATTR) === 'reduce';
    const pingviny = [...el.querySelectorAll<HTMLElement>('[data-pingvin]')];
    const taymery = new Set<number>();
    let vidno = false;
    let idut = false;

    const pozzhe = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        taymery.delete(id);
        fn();
      }, ms);
      taymery.add(id);
    };

    const zhest = (p: HTMLElement, kto: Kto) => {
      pozzhe(
        () => {
          if (!idut) return;
          if (p.hasAttribute('data-zhest')) return zhest(p, kto);
          const z = vybrat(kto);
          p.setAttribute('data-zhest', z.id);
          pozzhe(() => p.removeAttribute('data-zhest'), z.ms);
          zhest(p, kto);
        },
        rnd(2600, 7000),
      );
    };
    const morgat = (p: HTMLElement) => {
      pozzhe(
        () => {
          if (!idut) return;
          p.setAttribute('data-morg', Math.random() < 0.25 ? '2' : '1');
          pozzhe(() => p.removeAttribute('data-morg'), 560);
          morgat(p);
        },
        rnd(1800, 5600),
      );
    };

    const start = () => {
      if (idut) return;
      idut = true;
      for (const p of pingviny) {
        zhest(p, p.dataset.pingvin as Kto);
        morgat(p);
      }
    };
    const stop = () => {
      idut = false;
      taymery.forEach((id) => window.clearTimeout(id));
      taymery.clear();
      for (const p of pingviny) {
        p.removeAttribute('data-zhest');
        p.removeAttribute('data-morg');
      }
    };
    const obnovit = () => {
      if (vidno && !document.hidden && !stoyat()) start();
      else stop();
    };

    /* Пасхалка: прыжок и сердечко или облачко снежинок. */
    const naTap = (e: PointerEvent) => {
      const p = (e.currentTarget as HTMLElement | null) ?? null;
      if (!p || stoyat() || p.hasAttribute('data-pryg')) return;
      p.removeAttribute('data-zhest');
      p.setAttribute('data-pryg', '');
      pozzhe(() => p.removeAttribute('data-pryg'), 700);
      const serdce = Math.random() < 0.5;
      const skolko = serdce ? 1 : 6;
      for (let i = 0; i < skolko; i++) {
        const s = document.createElement('span');
        s.className = serdce ? 'pingvin-iskra pingvin-iskra--serdce' : 'pingvin-iskra';
        s.style.setProperty('--dx', `${serdce ? rnd(-4, 4) : rnd(-26, 26)}px`);
        s.style.setProperty('--dy', `${serdce ? -42 : rnd(-44, -24)}px`);
        s.style.setProperty('--zad', `${serdce ? 120 : i * 40}ms`);
        s.style.setProperty('--ugol', `${rnd(-60, 60)}deg`);
        s.addEventListener('animationend', () => s.remove(), { once: true });
        p.append(s);
      }
    };
    for (const p of pingviny) p.addEventListener('pointerdown', naTap);

    const io = new IntersectionObserver(([e]) => {
      vidno = e?.isIntersecting ?? false;
      obnovit();
    });
    io.observe(el);
    const mo = new MutationObserver(obnovit);
    mo.observe(html, { attributes: true, attributeFilter: [MOTION_LEVEL_ATTR] });
    document.addEventListener('visibilitychange', obnovit);
    tiho.addEventListener('change', obnovit);

    return () => {
      stop();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener('visibilitychange', obnovit);
      tiho.removeEventListener('change', obnovit);
      for (const p of pingviny) p.removeEventListener('pointerdown', naTap);
    };
  }, []);

  if (!WINTER_MODE) return null;
  return (
    <div className="pingviny" ref={root} aria-hidden="true">
      <Bortik />
      <div className="pingviny__para">
        <span className="pingvin pingvin--sharf" data-pingvin="sharf">
          <Pingvin kto="sharf" />
        </span>
        <span className="pingvin pingvin--shapka" data-pingvin="shapka">
          <Pingvin kto="shapka" />
        </span>
      </div>
    </div>
  );
}

/* Снежный бортик по верхнему краю карточки: мягкие сугробики. */
function Bortik() {
  return (
    <svg
      className="pingviny__bortik"
      viewBox="0 0 400 16"
      preserveAspectRatio="none"
      focusable="false"
    >
      <path
        className="pingviny__bortik-ten"
        d="M8 15.4C40 11.4 80 12.6 120 11.6s80 1 120 .2 80-1.4 120 .4c14 .6 26 1.8 34 3.2v1.2H6z"
      />
      <path
        className="pingviny__bortik-sneg"
        d="M0 15.6C6 13.4 11 9.6 21 8.4c10-4.2 24-4.4 36-1.4 12-3.8 30-3.8 42-.4 14-3.6 32-3.2 44 .2 14-3.6 32-3.8 46-.4 14-3.4 34-3.2 48 .2 14-3.2 32-3.4 46 0 14-3 32-3.2 46 .2 14-2.8 30-2.4 41 1 12 .8 21 4.6 30 7.8z"
      />
      <path
        className="pingviny__bortik-blik"
        d="M18 8.6c10-1.8 20-2 28-1M98 6.6c12-1.8 26-1.8 38 0M196 6.4c14-2 30-1.6 44 .8M300 6.8c12-1.6 26-1.4 36 .6"
      />
    </svg>
  );
}

/* Пингвинёнок в рамке 60×80, лапки — на y = 78. */
function Pingvin({ kto }: { kto: Kto }) {
  return (
    <svg className="pingvin__svg" viewBox="0 0 60 80" focusable="false">
      <g className="pingvin__vsyo">
        <ellipse className="pingvin__lapa" cx="22.5" cy="77" rx="7" ry="2.8" />
        <ellipse className="pingvin__lapa" cx="37.5" cy="77" rx="7" ry="2.8" />
        <g className="pingvin__dyhanie">
          {/* Крылышки — за телом, качаются от плеча. */}
          <path
            className="pingvin__telo pingvin__krylo pingvin__krylo--l"
            d="M14 42c-7 4-10.5 12-9.5 19.5.4 2.6 2.6 3 4 1.2 3-4 5.2-10.6 6.8-17.4z"
          />
          <path
            className="pingvin__telo pingvin__krylo pingvin__krylo--p"
            d="M46 42c7 4 10.5 12 9.5 19.5-.4 2.6-2.6 3-4 1.2-3-4-5.2-10.6-6.8-17.4z"
          />
          <path
            className="pingvin__telo"
            d="M30 31c11.6 0 19 9.6 19 23 0 13.4-8.4 22-19 22s-19-8.6-19-22c0-13.4 7.4-23 19-23z"
          />
          <path
            className="pingvin__puzo"
            d="M30 40c7.6 0 12.4 7 12.4 16.4 0 10-5.6 16.4-12.4 16.4s-12.4-6.4-12.4-16.4C17.6 47 22.4 40 30 40z"
          />
          <path
            className="pingvin__blik-tela"
            d="M18.6 47c1-4 3.4-7.6 6.6-9.4"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Голова — отдельно: поворачивается у шеи. */}
        <g className="pingvin__golova">
          <circle className="pingvin__telo" cx="30" cy="25" r="15.5" />
          <path
            className="pingvin__puzo"
            d="M30 19.6c-3.6-5.2-13-4.4-13.6 4-.4 6.6 5.6 12.8 13.6 12.8s14-6.2 13.6-12.8c-.6-8.4-10-9.2-13.6-4z"
          />
          <g className="pingvin__glaza">
            <circle cx="24.6" cy="24.6" r="2.5" className="pingvin__zrachok" />
            <circle cx="35.4" cy="24.6" r="2.5" className="pingvin__zrachok" />
            <circle cx="25.5" cy="23.6" r="0.9" className="pingvin__iskorka" />
            <circle cx="36.3" cy="23.6" r="0.9" className="pingvin__iskorka" />
          </g>
          <ellipse className="pingvin__shcheka" cx="20.4" cy="30" rx="2.8" ry="1.7" />
          <ellipse className="pingvin__shcheka" cx="39.6" cy="30" rx="2.8" ry="1.7" />
          <path
            className="pingvin__klyuv"
            d="M27 29.4c1.6-1.2 4.4-1.2 6 0-.6 2-1.8 3.4-3 3.4s-2.4-1.4-3-3.4z"
          />
          {kto === 'shapka' ? <Shapka /> : null}
        </g>

        {kto === 'sharf' ? <Sharf /> : null}
      </g>
      {kto === 'shapka' ? (
        /* Снежинка, за которой он следит (видна только в жесте). */
        <g className="pingvin__snezhinka">
          <path d="M0-3.6V3.6M-3.1-1.8 3.1 1.8M-3.1 1.8 3.1-1.8" />
        </g>
      ) : null}
    </svg>
  );
}

function Sharf() {
  return (
    <g className="pingvin__sharf">
      <path
        className="pingvin__sharf-tkan"
        d="M15.4 37.4c8.6 5 20.6 5 29.2 0l.8 4.8c-9.2 5.6-21.6 5.6-30.8 0z"
      />
      <path
        className="pingvin__sharf-tkan pingvin__sharf-hvost"
        d="M35.6 42.6l2.6 11.4 5.4-1.4-2.4-11.2z"
      />
      <path
        className="pingvin__sharf-polosa"
        d="M20 40.6c6.6 2.6 13.4 2.6 20 0M37 47.6l4.6-1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        className="pingvin__sharf-bahroma"
        d="M38.6 54.2l.2 2.2M40.6 53.7l.4 2.2M42.6 53.2l.5 2.1"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

function Shapka() {
  return (
    <g className="pingvin__shapka" transform="translate(0 -3.4)">
      <path
        className="pingvin__shapka-tkan"
        d="M15.6 20.4C15.8 11 22 5.4 30 5.4S44.2 11 44.4 20.4z"
      />
      <path
        className="pingvin__shapka-ten"
        d="M37.4 8c3.8 2.6 6.6 6.8 7 12.4h-4.6c-.2-4.8-1-8.8-2.4-12.4z"
      />
      <rect className="pingvin__shapka-otvorot" x="14" y="18.6" width="32" height="5.4" rx="2.7" />
      <path
        className="pingvin__shapka-rubchik"
        d="M18.5 19.4v3.8M22.5 19.4v3.8M26.5 19.4v3.8M30.5 19.4v3.8M34.5 19.4v3.8M38.5 19.4v3.8M42.5 19.4v3.8"
        fill="none"
        strokeLinecap="round"
      />
      <g className="pingvin__pompon">
        <circle className="pingvin__pompon-shar" cx="30" cy="5" r="4.6" />
        <path
          className="pingvin__pompon-vors"
          d="M27.6 3.4l1 .8M31.6 2.8l-.6 1M28.4 6.6l1.2-.4M32.4 6.2l-1-.6"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}
