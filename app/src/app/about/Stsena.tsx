'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { assetUrl } from '@/lib/assetUrl';

/* Сцена первого экрана «Об авторе» по утверждённому макету:
   окружность, равнобедренный треугольник ABC с вписанной окружностью и
   высотой, оси координат и оранжевая парабола. Портрет стоит левее
   построения, справа внизу — стеклянная пирамида и мраморный бюст.

   Курсор двигает вершину параболы и меняет её раствор, слои слегка
   смещаются; на телефоне то же делает прокрутка. Плашка в покое
   показывает общий вид y = ax² + bx + c, при движении — коэффициенты
   нарисованной кривой. Бюст при прокрутке чуть отстаёт от страницы.
   При prefers-reduced-motion сцена неподвижна. */

/* Поле построения 600×600. Начало координат графика — O, единица — U. */
const U = 40;
const OX = 290;
const OY = 320;
const POKOY = { a: 0.31, m: 1.5, n: -2.1 };
const OBSHCHIY_VID = 'y = ax² + bx + c';

/* Треугольник: основание на оси x, вершина B — на окружности радиуса 250. */
const A = { x: 230, y: OY };
const B = { x: 340, y: 53 };
const C = { x: 450, y: OY };
/* Вписанная окружность: r = S / p для основания 220 и высоты 267. */
const R_VPIS = 73.6;

function krivaya(a: number, m: number, n: number): string {
  let d = '';
  for (let x = -9; x <= 9.001; x += 0.25) {
    const px = OX + x * U;
    const py = OY - (a * (x - m) ** 2 + n) * U;
    d += `${d === '' ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`;
  }
  return d;
}

function chislo(value: number): string {
  return Math.abs(value).toFixed(2).replace('.', ',');
}

/** Коэффициенты кривой в общем виде: y = ax² + bx + c. */
function podpis(a: number, m: number, n: number): string {
  const b = Math.round(-2 * a * m * 100) / 100;
  const c = Math.round((a * m * m + n) * 100) / 100;
  return `y = ${chislo(a)}x² ${b < 0 ? '−' : '+'} ${chislo(b)}x ${c < 0 ? '−' : '+'} ${chislo(c)}`;
}

export function Stsena({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const tekst = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const hero = el?.closest<HTMLElement>('.oa-hero');
    if (!el || !hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    el.classList.add('is-zhivaya');
    const myshka = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* now — что нарисовано, cel — куда идём; px, py — сдвиг слоёв −1…1. */
    const now = { ...POKOY, px: 0, py: 0 };
    const cel = { ...POKOY, px: 0, py: 0 };
    let vPokoe = true;
    let frame = 0;

    const risuy = () => {
      frame = 0;
      let dalshe = false;
      for (const key of ['a', 'm', 'n', 'px', 'py'] as const) {
        const delta = cel[key] - now[key];
        if (Math.abs(delta) > 0.002) {
          now[key] += delta * 0.12;
          dalshe = true;
        } else {
          now[key] = cel[key];
        }
      }
      path.current?.setAttribute('d', krivaya(now.a, now.m, now.n));
      if (tekst.current) {
        tekst.current.textContent = vPokoe && !dalshe ? OBSHCHIY_VID : podpis(now.a, now.m, now.n);
      }
      el.style.setProperty('--px', now.px.toFixed(3));
      el.style.setProperty('--py', now.py.toFixed(3));
      if (dalshe) frame = requestAnimationFrame(risuy);
    };
    const zapusk = () => {
      if (frame === 0) frame = requestAnimationFrame(risuy);
    };

    const onMove = (event: PointerEvent) => {
      const box = hero.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1));
      vPokoe = false;
      cel.px = nx;
      cel.py = ny;
      cel.m = POKOY.m + nx * 1.8;
      cel.a = POKOY.a - ny * 0.16;
      cel.n = POKOY.n + ny * 0.9;
      zapusk();
    };
    const onLeave = () => {
      vPokoe = true;
      Object.assign(cel, POKOY, { px: 0, py: 0 });
      zapusk();
    };
    /* Прокрутка: бюст чуть отстаёт от страницы на любом устройстве. */
    const onParallax = () => {
      const t = Math.max(0, Math.min(1, window.scrollY / Math.max(1, hero.offsetHeight)));
      el.style.setProperty('--sy', t.toFixed(3));
    };
    /* Телефон: параболу раскрывает прокрутка первого экрана. */
    const onScroll = () => {
      const t = Math.max(0, Math.min(1, window.scrollY / Math.max(1, hero.offsetHeight)));
      vPokoe = t < 0.02;
      cel.a = POKOY.a + t * 0.5;
      cel.m = POKOY.m - t * 1.2;
      cel.n = POKOY.n + t * 1.6;
      cel.py = t;
      zapusk();
    };

    window.addEventListener('scroll', onParallax, { passive: true });
    if (myshka) {
      hero.addEventListener('pointermove', onMove);
      hero.addEventListener('pointerleave', onLeave);
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    return () => {
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onParallax);
      if (frame !== 0) cancelAnimationFrame(frame);
      el.classList.remove('is-zhivaya');
    };
  }, []);

  return (
    <div className="oa-sm" ref={root}>
      <svg className="oa-sm__geo" viewBox="0 0 600 600" aria-hidden="true" focusable="false">
        <defs>
          {/* Ветви параболы и концы осей растворяются за окружностью. */}
          <radialGradient
            id="oa-sm-tayanie"
            cx="300"
            cy="300"
            r="350"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.74" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask
            id="oa-sm-maska"
            maskUnits="userSpaceOnUse"
            x="-100"
            y="-100"
            width="800"
            height="800"
          >
            <rect x="-100" y="-100" width="800" height="800" fill="url(#oa-sm-tayanie)" />
          </mask>
        </defs>

        <circle
          className="oa-geo-line oa-geo-draw oa-sm__krug"
          cx="300"
          cy="300"
          r="250"
          pathLength={1}
        />

        {/* Оси со стрелками и делениями. */}
        <g mask="url(#oa-sm-maska)">
          <path className="oa-geo-os" d={`M10 ${OY}H588M${OX} 590V12`} />
          <path className="oa-geo-os" d={`M578 ${OY - 5}l10 5l-10 5M${OX - 5} 22l5 -10l5 10`} />
          <path
            className="oa-geo-tik"
            d={[-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]
              .map((i) => `M${OX + i * U} ${OY - 4}v8M${OX - 4} ${OY - i * U}h8`)
              .join('')}
          />
        </g>

        {/* Треугольник ABC, вписанная окружность, высота из B. */}
        <path
          className="oa-sm__treugolnik oa-geo-draw oa-geo-draw--2"
          d={`M${A.x} ${A.y}L${B.x} ${B.y}L${C.x} ${C.y}Z`}
          pathLength={1}
        />
        <circle className="oa-geo-dash" cx={B.x} cy={OY - R_VPIS} r={R_VPIS} />
        <path className="oa-geo-dash" d={`M${B.x} ${B.y}V${OY}`} />
        <path className="oa-geo-line" d={`M${B.x} ${OY - 14}h14v14`} />
        <circle className="oa-sm__centr" cx={B.x} cy={OY - R_VPIS} r="2.5" />

        <g mask="url(#oa-sm-maska)">
          <path className="oa-geo-parabola" ref={path} d={krivaya(POKOY.a, POKOY.m, POKOY.n)} />
        </g>

        {[A, B, C].map((p) => (
          <circle className="oa-sm__tochka" cx={p.x} cy={p.y} r="5" key={`${p.x}-${p.y}`} />
        ))}
        <text className="oa-geo-bukva" x={A.x - 8} y={A.y + 30}>
          A
        </text>
        <text className="oa-geo-bukva" x={B.x + 8} y={B.y - 10}>
          B
        </text>
        <text className="oa-geo-bukva" x={C.x - 30} y={C.y + 30}>
          C
        </text>
        <text className="oa-geo-bukva oa-sm__os" x="574" y={OY - 14}>
          x
        </text>
        <text className="oa-geo-bukva oa-sm__os" x={OX + 12} y="24">
          y
        </text>
      </svg>

      {/* Общий пол: портрет, пирамида и бюст стоят на одной площадке. */}
      <span className="oa-sm__pol" aria-hidden="true" />

      <figure className="oa-sm__foto">{children}</figure>

      {/* Бюст и пирамида — учебный натюрморт: гипсовая голова и геометрическое
          тело. Бюст развёрнут лицом к построению. */}
      <span className="oa-sm__byust">
        <img
          src={assetUrl('/images/author/bust-marble-400.webp')}
          srcSet={`${assetUrl('/images/author/bust-marble-400.webp')} 400w, ${assetUrl('/images/author/bust-marble-675.webp')} 675w`}
          sizes="(max-width: 899px) 31vw, 205px"
          alt="Мраморный бюст в античном стиле: женская голова с волнистыми волосами"
          width="675"
          height="900"
          decoding="async"
        />
      </span>

      {/* Стеклянная пирамида: готовая картинка с прозрачным фоном. */}
      <img
        className="oa-sm__piramida"
        src={assetUrl('/images/glass/piramida-steklo.webp')}
        srcSet={`${assetUrl('/images/glass/piramida-steklo.webp')} 500w, ${assetUrl('/images/glass/piramida-steklo-large.webp')} 1000w`}
        sizes="(max-width: 899px) 27vw, 180px"
        alt=""
        aria-hidden="true"
        width="500"
        height="443"
        decoding="async"
      />

      {/* Единственное стекло первого экрана: подпись к параболе. */}
      <p className="oa-sm__formula" aria-hidden="true">
        <span ref={tekst}>{OBSHCHIY_VID}</span>
      </p>
    </div>
  );
}
