'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDvizhenie } from '@/components/zhivye/hooks';
import { katex } from '@/lib/graph/katex';
import { typeset } from '@/lib/tex';
import { USTNYY } from '@/content/ustnyySchet';

const T = USTNYY.konstruktor;

const MIN = -10;
const MAX = 10;

/* Числовая прямая: ширина viewBox — ширина на экране в px (точки и
   подписи одного размера на телефоне и компьютере), высота 84. */
const LH = 84;
const LPOLE = 28;
const LY = 40;
const lxPri = (lw: number) => (x: number) => LPOLE + ((x - MIN) / (MAX - MIN)) * (lw - 2 * LPOLE);

/* Парабола: viewBox 640 × 300, ось x — та же шкала. */
const PW = 640;
const PH = 260;
const PVERH = 16;
const PNIZ = 24;

const klamp = (x: number) => Math.max(MIN, Math.min(MAX, Math.round(x)));
const minus = (n: number) => (n < 0 ? `−${-n}` : String(n));

/** Формула с цветными суммой и произведением (KaTeX с \htmlClass). */
function formula(tex: string): string {
  return katex.renderToString(tex, {
    throwOnError: false,
    strict: 'ignore',
    trust: (ctx: { command: string }) => ctx.command === '\\htmlClass',
  });
}

const sk = (n: number) => (n < 0 ? `(${n})` : String(n));

function uravnenie(x1: number, x2: number): { obshchee: string; itog: string } {
  const S = x1 + x2;
  const P = x1 * x2;
  const sum = `\\htmlClass{us-kk__s}{${sk(x1)} + ${sk(x2)}}`;
  const pr = `\\htmlClass{us-kk__p}{${sk(x1)} \\cdot ${sk(x2)}}`;
  const obshchee = `x^2 - (${sum})\\,x + ${pr} = 0`;
  /* Стандартный вид: без «+ −», «1x», «+ 0»; b — оранжевым, c — синим. */
  let itog = 'x^2';
  if (S !== 0) {
    const b = -S;
    const kx = Math.abs(b) === 1 ? '' : String(Math.abs(b));
    itog += ` \\htmlClass{us-kk__s}{${b < 0 ? '-' : '+'} ${kx}x}`;
  }
  if (P !== 0) itog += ` \\htmlClass{us-kk__p}{${P < 0 ? '-' : '+'} ${Math.abs(P)}}`;
  itog += ' = 0';
  return { obshchee, itog };
}

/** Плавное следование за целью (для параболы); при reduce — сразу. */
function usePlavno(cel: readonly [number, number], reduce: boolean): [number, number] {
  const [v, setV] = useState<[number, number]>([cel[0], cel[1]]);
  const tek = useRef<[number, number]>([cel[0], cel[1]]);
  useEffect(() => {
    if (reduce) {
      tek.current = [cel[0], cel[1]];
      setV(tek.current);
      return;
    }
    let raf = 0;
    const shag = () => {
      const [a, b] = tek.current;
      const na = a + (cel[0] - a) * 0.22;
      const nb = b + (cel[1] - b) * 0.22;
      const blizko = Math.abs(na - cel[0]) < 0.005 && Math.abs(nb - cel[1]) < 0.005;
      tek.current = blizko ? [cel[0], cel[1]] : [na, nb];
      setV(tek.current);
      if (!blizko) raf = requestAnimationFrame(shag);
    };
    raf = requestAnimationFrame(shag);
    return () => cancelAnimationFrame(raf);
  }, [cel, reduce]);
  return v;
}

interface TochkaProps {
  x: number;
  nomer: 1 | 2;
  label: string;
  onX: (x: number) => void;
  svg: React.RefObject<SVGSVGElement | null>;
  lw: number;
}

/** Стеклянная точка на прямой: тянется мышью и пальцем, ходит стрелками. */
function Tochka({ x, nomer, label, onX, svg, lw }: TochkaProps) {
  const lx = lxPri(lw);
  const tyanem = useRef(false);
  const izKursora = (clientX: number) => {
    const el = svg.current;
    if (el === null) return;
    const r = el.getBoundingClientRect();
    const u = ((clientX - r.left) / r.width) * lw;
    onX(klamp(MIN + ((u - LPOLE) / (lw - 2 * LPOLE)) * (MAX - MIN)));
  };
  return (
    <g
      className={`us-kk__tochka us-kk__tochka--${nomer}`}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={x}
      aria-valuetext={minus(x)}
      aria-orientation="horizontal"
      data-x={x}
      onKeyDown={(e) => {
        const d: Record<string, number> = {
          ArrowLeft: -1,
          ArrowDown: -1,
          ArrowRight: 1,
          ArrowUp: 1,
          PageDown: -5,
          PageUp: 5,
        };
        if (e.key === 'Home') onX(MIN);
        else if (e.key === 'End') onX(MAX);
        else if (d[e.key] !== undefined) onX(klamp(x + (d[e.key] as number)));
        else return;
        e.preventDefault();
      }}
      onPointerDown={(e) => {
        tyanem.current = true;
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
        izKursora(e.clientX);
      }}
      onPointerMove={(e) => {
        if (tyanem.current) izKursora(e.clientX);
      }}
      onPointerUp={() => {
        tyanem.current = false;
      }}
      onPointerCancel={() => {
        tyanem.current = false;
      }}
    >
      {/* Невидимая область нажатия — не меньше 44 px на экране. */}
      <circle className="us-kk__zona" cx={lx(x)} cy={LY} r={24} />
      <circle className="us-kk__shar" cx={lx(x)} cy={LY} r={12} />
      <circle className="us-kk__blik" cx={lx(x) - 4} cy={LY - 4} r={3.5} />
      <text className="us-kk__podpis" x={lx(x)} y={LY - 20} textAnchor="middle">
        x{nomer === 1 ? '₁' : '₂'}
      </text>
    </g>
  );
}

/**
 * «Конструктор корней» на странице приёма «Обратная теорема Виета»:
 * корни x₁ и x₂ на числовой прямой, вживую — уравнение
 * x² − (x₁ + x₂)x + x₁x₂ = 0 и его парабола, которая пересекает ось
 * ровно в выбранных точках.
 */
export function KonstruktorKorney() {
  const [x1, setX1] = useState(2);
  const [x2, setX2] = useState(5);
  const lineSvg = useRef<SVGSVGElement>(null);
  const [lw, setLw] = useState(640);
  useEffect(() => {
    const el = lineSvg.current;
    if (el === null || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => {
      if (e !== undefined && e.contentRect.width > 0) setLw(Math.round(e.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const lx = lxPri(lw);
  const reduce = useDvizhenie() === 'reduce';
  const cel = useMemo(() => [x1, x2] as const, [x1, x2]);
  const [a, b] = usePlavno(cel, reduce);

  const S = x1 + x2;
  const P = x1 * x2;
  const html = useMemo(() => {
    const u = uravnenie(x1, x2);
    return { obshchee: formula(u.obshchee), itog: formula(u.itog) };
  }, [x1, x2]);
  const znak = x1 === x2 ? T.ravnye : P > 0 ? T.odin : P < 0 ? T.raznye : T.nol;
  const znakHtml = useMemo(() => typeset(znak), [znak]);

  /* Масштаб параболы: вершина и корни всегда видны. */
  const vy = -((b - a) ** 2) / 4;
  const ymin = Math.min(-1.5, vy * 1.15 - 1);
  const ymax = Math.max(12, -ymin * 0.9);
  const px = (x: number) => LPOLE + ((x - MIN) / (MAX - MIN)) * (PW - 2 * LPOLE);
  const py = (y: number) => PVERH + ((ymax - y) / (ymax - ymin)) * (PH - PVERH - PNIZ);
  /* Путь считается на каждом кадре плавного перехода — без мемо. */
  const put = (() => {
    const yy = (x: number) => x * x - (a + b) * x + a * b;
    const pts: string[] = [];
    for (let i = 0; i <= 240; i += 1) {
      const x = MIN - 0.5 + (i / 240) * (MAX - MIN + 1);
      const y = Math.max(ymin - 2, Math.min(ymax + 2, yy(x)));
      pts.push(`${px(x).toFixed(2)},${py(y).toFixed(2)}`);
    }
    return `M${pts.join('L')}`;
  })();

  const metki = [];
  for (let t = MIN; t <= MAX; t += 1) metki.push(t);

  return (
    <div className="us-kk" data-x1={x1} data-x2={x2}>
      <svg
        ref={lineSvg}
        className="us-kk__pryamaya"
        viewBox={`0 0 ${lw} ${LH}`}
        role="group"
        aria-label="Числовая прямая от −10 до 10"
      >
        <line className="us-kk__os" x1={LPOLE - 12} y1={LY} x2={lw - LPOLE + 12} y2={LY} />
        {metki.map((t) => (
          <g key={t}>
            <line
              className={t === 0 ? 'us-kk__nol' : 'us-kk__metka'}
              x1={lx(t)}
              x2={lx(t)}
              y1={LY - (t % 5 === 0 ? 7 : 4)}
              y2={LY + (t % 5 === 0 ? 7 : 4)}
            />
            {t % 5 === 0 && (
              <text className="us-kk__chislo" x={lx(t)} y={LY + 26} textAnchor="middle">
                {minus(t)}
              </text>
            )}
          </g>
        ))}
        <Tochka x={x1} nomer={1} label={T.x1} onX={setX1} svg={lineSvg} lw={lw} />
        <Tochka x={x2} nomer={2} label={T.x2} onX={setX2} svg={lineSvg} lw={lw} />
      </svg>

      <div className="us-kk__formuly" aria-live="polite">
        <p className="us-kk__formula" dangerouslySetInnerHTML={{ __html: html.obshchee }} />
        <p
          className="us-kk__formula us-kk__formula--itog"
          dangerouslySetInnerHTML={{ __html: html.itog }}
        />
        <p className="us-kk__legenda">
          <span className="us-kk__s">
            {T.summa}: {minus(S)}
          </span>
          <span className="us-kk__p">
            {T.proizvedenie}: {minus(P)}
          </span>
        </p>
        <p className="us-kk__znak" dangerouslySetInnerHTML={{ __html: znakHtml }} />
      </div>

      <svg
        className="us-kk__grafik"
        viewBox={`0 0 ${PW} ${PH}`}
        role="img"
        aria-label={T.grafik(minus(x1), minus(x2))}
      >
        <line className="us-kk__os" x1={0} y1={py(0)} x2={PW} y2={py(0)} />
        <line className="us-kk__os us-kk__os--y" x1={px(0)} y1={0} x2={px(0)} y2={PH} />
        <path className="us-kk__parabola" d={put} data-a={a} data-b={b} />
        <circle className="us-kk__koren us-kk__koren--1" cx={px(x1)} cy={py(0)} r={8} data-x={x1} />
        <circle className="us-kk__koren us-kk__koren--2" cx={px(x2)} cy={py(0)} r={8} data-x={x2} />
      </svg>
    </div>
  );
}
