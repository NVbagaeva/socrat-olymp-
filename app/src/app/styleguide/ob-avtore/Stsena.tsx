'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/* Сцена первого экрана: за портретом — геометрическое построение
   (окружность, вписанный треугольник, оси) и живая парабола.
   Курсор двигает вершину параболы и меняет её раствор, слои сцены
   чуть смещаются за ним; на телефоне то же делает прокрутка. Числа в
   подписи — настоящие коэффициенты нарисованной кривой.
   При prefers-reduced-motion сцена неподвижна. */

/* Поле построения 600×600; единица графика — 42 px, начало координат — O. */
const U = 42;
const OX = 300;
const OY = 430;
const POKOY = { a: 0.42, m: 0, n: -0.6 };

function krivaya(a: number, m: number, n: number): string {
  let d = '';
  for (let x = -7; x <= 7.001; x += 0.25) {
    const px = OX + x * U;
    const py = OY - (a * (x - m) ** 2 + n) * U;
    d += `${d === '' ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`;
  }
  return d;
}

/** 0.42 → «0,42»; минус — типографский. */
function chislo(value: number, digits = 1): string {
  return Math.abs(value).toFixed(digits).replace('.', ',');
}

function podpis(a: number, m: number, n: number): string {
  /* Знак берётся у округлённого числа: «− 0,0» в подписи не бывает. */
  const m1 = Math.round(m * 10) / 10;
  const n1 = Math.round(n * 10) / 10;
  const sdvig = `x ${m1 < 0 ? '+' : '−'} ${chislo(m1)}`;
  return `y = ${chislo(a, 2)}(${sdvig})² ${n1 < 0 ? '−' : '+'} ${chislo(n1)}`;
}

/* Вершины треугольника, вписанного в окружность радиуса 250. */
const A = { x: 300, y: 50 };
const B = { x: 516.5, y: 425 };
const C = { x: 83.5, y: 425 };

export function Stsena({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const vershina = useRef<SVGGElement>(null);
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
      vershina.current?.setAttribute(
        'transform',
        `translate(${(OX + now.m * U).toFixed(1)} ${(OY - now.n * U).toFixed(1)})`,
      );
      if (tekst.current) tekst.current.textContent = podpis(now.a, now.m, now.n);
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
      cel.px = nx;
      cel.py = ny;
      cel.m = nx * 2.2;
      cel.a = 0.5 - ny * 0.32;
      cel.n = POKOY.n + ny * 1.2;
      zapusk();
    };
    const onLeave = () => {
      Object.assign(cel, POKOY, { px: 0, py: 0 });
      zapusk();
    };
    /* Телефон: параболу раскрывает прокрутка первого экрана. */
    const onScroll = () => {
      const t = Math.max(0, Math.min(1, window.scrollY / Math.max(1, hero.offsetHeight)));
      cel.a = POKOY.a + t * 0.9;
      cel.n = POKOY.n + t * 2.4;
      cel.py = t;
      zapusk();
    };

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
      if (frame !== 0) cancelAnimationFrame(frame);
      el.classList.remove('is-zhivaya');
    };
  }, []);

  return (
    <div className="oa-stsena" ref={root}>
      <svg className="oa-stsena__geo" viewBox="0 0 600 600" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="oa-krug">
            <circle cx="300" cy="300" r="249" />
          </clipPath>
        </defs>

        {/* Построение: окружность, вписанный треугольник, его высота и вписанная окружность. */}
        <circle className="oa-geo-diska" cx="300" cy="300" r="250" />
        <circle className="oa-geo-line oa-geo-draw" cx="300" cy="300" r="250" pathLength={1} />
        <path
          className="oa-geo-line oa-geo-draw oa-geo-draw--2"
          d={`M${A.x} ${A.y}L${B.x} ${B.y}L${C.x} ${C.y}Z`}
          pathLength={1}
        />
        <circle className="oa-geo-dash" cx="300" cy="300" r="125" />
        <path className="oa-geo-dash" d={`M${A.x} ${A.y}L300 425`} />
        <path className="oa-geo-dash" d="M300 300L516.5 425M300 300L83.5 425" />
        {/* Прямой угол при основании высоты. */}
        <path className="oa-geo-line" d="M300 411h14v14" />

        {/* Оси графика и парабола — внутри окружности. */}
        <g clipPath="url(#oa-krug)">
          <path className="oa-geo-os" d={`M40 ${OY}H560M${OX} 560V60`} />
          <path
            className="oa-geo-tik"
            d={[-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]
              .map((i) => `M${OX + i * U} ${OY - 4}v8`)
              .join('')}
          />
          <path className="oa-geo-parabola" ref={path} d={krivaya(POKOY.a, POKOY.m, POKOY.n)} />
          <g ref={vershina} transform={`translate(${OX + POKOY.m * U} ${OY - POKOY.n * U})`}>
            <circle className="oa-geo-vershina" r="5" />
          </g>
        </g>

        {[A, B, C].map((p) => (
          <circle className="oa-geo-tochka" cx={p.x} cy={p.y} r="4.5" key={`${p.x}-${p.y}`} />
        ))}
        <text className="oa-geo-bukva" x={A.x + 14} y={A.y + 2}>
          A
        </text>
        <text className="oa-geo-bukva" x={B.x + 12} y={B.y + 22}>
          B
        </text>
        <text className="oa-geo-bukva" x={C.x - 26} y={C.y + 22}>
          C
        </text>
      </svg>

      {/* Стеклянная пирамида нарисована, а не вставлена картинкой: грани
          полупрозрачные, сквозь них видно построение за ней. */}
      <span className="oa-piramida" aria-hidden="true">
        <svg viewBox="0 0 200 210" focusable="false">
          <defs>
            <linearGradient id="oa-gran-l" x1="0.2" y1="0" x2="0.6" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.92" />
              <stop offset="0.55" stopColor="#dbe8fd" stopOpacity="0.5" />
              <stop offset="1" stopColor="#8fb4ee" stopOpacity="0.42" />
            </linearGradient>
            <linearGradient id="oa-gran-r" x1="0.3" y1="0" x2="0.9" y2="1">
              <stop offset="0" stopColor="#eef4ff" stopOpacity="0.7" />
              <stop offset="0.6" stopColor="#7aa5ea" stopOpacity="0.5" />
              <stop offset="1" stopColor="#1f5fd0" stopOpacity="0.44" />
            </linearGradient>
            <linearGradient id="oa-rebro-t" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#f5a04a" stopOpacity="0.75" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="oa-ten" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#16326b" stopOpacity="0.26" />
              <stop offset="1" stopColor="#16326b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="oa-blik" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
              <stop offset="0.5" stopColor="#ffd9b0" stopOpacity="0.4" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Тень и световое пятно под стеклом. */}
          <ellipse cx="104" cy="176" rx="92" ry="20" fill="url(#oa-ten)" />
          <ellipse cx="132" cy="178" rx="34" ry="7" fill="url(#oa-blik)" />
          {/* Дальние рёбра видны сквозь грани. */}
          <path
            d="M100 14L112 112M22 146L112 112L180 138"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.55"
            strokeWidth="1"
          />
          <path d="M22 146L94 186L180 138L112 112Z" fill="#cfe0fb" fillOpacity="0.22" />
          {/* Две ближние грани. */}
          <path d="M100 14L22 146L94 186Z" fill="url(#oa-gran-l)" />
          <path d="M100 14L94 186L180 138Z" fill="url(#oa-gran-r)" />
          {/* Тонкий синий контур под светлым ребром: форма читается на светлом фоне. */}
          <path
            d="M100 14L22 146L94 186L180 138ZM100 14L94 186"
            fill="none"
            stroke="#1f5fd0"
            strokeOpacity="0.4"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          {/* Блик вдоль левого ребра. */}
          <path d="M100 14L22 146L34 152Z" fill="#fff" fillOpacity="0.5" />
          <path
            d="M100 14L22 146L94 186L180 138Z"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.95"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M100 14L94 186" stroke="#fff" strokeOpacity="0.9" strokeWidth="1.2" />
          {/* Тёплый отсвет на правом ребре — оранжевый из палитры. */}
          <path d="M100 14L180 138" stroke="url(#oa-rebro-t)" strokeWidth="2" />
        </svg>
      </span>

      <figure className="oa-stsena__foto">{children}</figure>

      {/* Единственное стекло первого экрана: живая подпись к параболе. */}
      <p className="oa-stsena__formula" aria-hidden="true">
        <span className="oa-stsena__chisla" ref={tekst}>
          {podpis(POKOY.a, POKOY.m, POKOY.n)}
        </span>
        <span className="oa-stsena__podskazka oa-stsena__podskazka--myshka">
          двигайте курсор — график оживёт
        </span>
        <span className="oa-stsena__podskazka oa-stsena__podskazka--palets">
          листайте — график оживёт
        </span>
      </p>
    </div>
  );
}
