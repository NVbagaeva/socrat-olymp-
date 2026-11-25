'use client';

import { useEffect, useRef, useState } from 'react';
import type { ZhivoyProps } from './tip';
import { Formula, ZhivoyKoren, type Tochka } from './obshchee';

/** Брусок из кубиков: задний верхний угол на экране, размеры в кубиках. */
interface Brusok {
  ox: number;
  oy: number;
  zo: number;
  a: number;
  b: number;
  c: number;
}
/** Знак корня: начало черты, её конец, верх и низ. */
interface ZnakKornya {
  x0: number;
  x1: number;
  yt: number;
  yb: number;
  op: number;
}
interface Kadr {
  A: Brusok;
  B: Brusok;
  r1: ZnakKornya;
  r2: ZnakKornya;
}

const KADRY: Kadr[] = [
  {
    A: { ox: 150, oy: 96, zo: 0, a: 6, b: 6, c: 1 },
    B: { ox: 150, oy: 96, zo: 1, a: 6, b: 6, c: 1 },
    r1: { x0: 84, x1: 222, yt: 58, yb: 172, op: 1 },
    r2: { x0: 186, x1: 236, yt: 118, yb: 162, op: 0 },
  },
  {
    A: { ox: 150, oy: 104, zo: 0, a: 6, b: 6, c: 1 },
    B: { ox: 150, oy: 104, zo: 2.2, a: 6, b: 6, c: 1 },
    r1: { x0: 84, x1: 222, yt: 52, yb: 180, op: 1 },
    r2: { x0: 186, x1: 236, yt: 118, yb: 162, op: 0 },
  },
  {
    A: { ox: 92, oy: 110, zo: 0, a: 6, b: 6, c: 1 },
    B: { ox: 205, oy: 140, zo: 0, a: 2, b: 1, c: 1 },
    r1: { x0: 30, x1: 158, yt: 88, yb: 186, op: 1 },
    r2: { x0: 186, x1: 236, yt: 118, yb: 162, op: 1 },
  },
  {
    A: { ox: 76, oy: 140, zo: 0, a: 6, b: 1, c: 1 },
    B: { ox: 205, oy: 140, zo: 0, a: 2, b: 1, c: 1 },
    r1: { x0: 30, x1: 158, yt: 88, yb: 186, op: 0 },
    r2: { x0: 186, x1: 236, yt: 118, yb: 162, op: 1 },
  },
];

const TEX = ['\\sqrt{72}', '\\sqrt{36\\cdot 2}', '\\sqrt{36}\\cdot\\sqrt{2}', '6\\sqrt{2}'];
const SHAGI = [
  'Нажми — вынести множитель',
  'Множители 36 и 2: два слоя по 36',
  'Корень из произведения',
  '√36 = 6 выходит из-под корня',
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function smesh<T extends object>(a: T, b: T, t: number): T {
  const out: Record<string, number> = {};
  for (const k of Object.keys(a)) {
    out[k] = lerp((a as Record<string, number>)[k]!, (b as Record<string, number>)[k]!, t);
  }
  return out as T;
}

const EX: Tochka = [10.4, 6];
const EY: Tochka = [-10.4, 6];
const EZ = 12;

function iso(br: Brusok, x: number, y: number, z: number): string {
  const px = br.ox + x * EX[0] + y * EY[0];
  const py = br.oy + x * EX[1] + y * EY[1] - (z + br.zo) * EZ;
  return `${px.toFixed(1)} ${py.toFixed(1)}`;
}

function BrusokSvg({ br, ton }: { br: Brusok; ton: 'blue' | 'or' }) {
  const { a, b, c } = br;
  const verh = `M${iso(br, 0, 0, c)}L${iso(br, a, 0, c)}L${iso(br, a, b, c)}L${iso(br, 0, b, c)}Z`;
  const pravo = `M${iso(br, a, 0, c)}L${iso(br, a, b, c)}L${iso(br, a, b, 0)}L${iso(br, a, 0, 0)}Z`;
  const levo = `M${iso(br, 0, b, c)}L${iso(br, a, b, c)}L${iso(br, a, b, 0)}L${iso(br, 0, b, 0)}Z`;
  /* Швы между кубиками — тонкие линии по граням. */
  const shvy: string[] = [];
  for (let i = 1; i < Math.round(a); i += 1) {
    shvy.push(`M${iso(br, i, 0, c)}L${iso(br, i, b, c)}L${iso(br, i, b, 0)}`);
  }
  for (let j = 1; j < Math.round(b); j += 1) {
    shvy.push(`M${iso(br, 0, j, c)}L${iso(br, a, j, c)}L${iso(br, a, j, 0)}`);
  }
  const s = ton === 'or' ? 'var(--chertezh-akcent)' : 'var(--blue-600)';
  const f =
    ton === 'or'
      ? ['255 214 170', '255 190 130', '250 170 100']
      : ['230 240 255', '196 218 250', '170 200 245'];
  return (
    <g strokeLinejoin="round">
      <path d={verh} fill={`rgb(${f[0]} / 0.85)`} stroke={s} strokeWidth={1.4} />
      <path d={pravo} fill={`rgb(${f[1]} / 0.85)`} stroke={s} strokeWidth={1.4} />
      <path d={levo} fill={`rgb(${f[2]} / 0.85)`} stroke={s} strokeWidth={1.4} />
      <path d={shvy.join('')} fill="none" stroke={s} strokeOpacity={0.35} strokeWidth={0.8} />
    </g>
  );
}

function KorenSvg({ r }: { r: ZnakKornya }) {
  const d = `M${r.x0 - 20} ${r.yb - 26}L${r.x0 - 13} ${r.yb - 30}L${r.x0 - 4} ${r.yb}L${r.x0 + 6} ${r.yt}L${r.x1} ${r.yt}`;
  return (
    <g opacity={r.op}>
      <path
        d={d}
        fill="none"
        stroke="color-mix(in srgb, var(--chertezh-zalivka-siniy) 80%, transparent)"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        fill="none"
        stroke="var(--blue-600)"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M${r.x0 + 6} ${r.yt}L${r.x1} ${r.yt}`}
        stroke="var(--chertezh-akcent)"
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.9}
      />
    </g>
  );
}

/**
 * №7 «Вычисления»: корень и стопка кубиков. Нажатие ведёт по шагам
 * вынесения множителя из-под корня: √72 = √(36·2) = √36·√2 = 6√2, и
 * кубики перестраиваются в такт — два слоя 6 × 6, слой выходит из-под
 * корня и становится стороной 6. Стрелки — шаг назад и вперёд.
 */
export default function Koren({ label, tiho, avtofokus }: ZhivoyProps) {
  const [shag, setShag] = useState(0);
  const [kadr, setKadr] = useState<Kadr>(KADRY[0]!);
  const tek = useRef<Kadr>(KADRY[0]!);

  useEffect(() => {
    const cel = KADRY[shag]!;
    const ot = tek.current;
    const dlit = tiho ? 0 : 520;
    const t0 = performance.now();
    let id = 0;
    const tik = (t: number) => {
      const x = dlit === 0 ? 1 : Math.min(1, (t - t0) / dlit);
      const e = x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
      const k: Kadr = {
        A: smesh(ot.A, cel.A, e),
        B: smesh(ot.B, cel.B, e),
        r1: smesh(ot.r1, cel.r1, e),
        r2: smesh(ot.r2, cel.r2, e),
      };
      tek.current = k;
      setKadr(k);
      if (x < 1) id = requestAnimationFrame(tik);
    };
    id = requestAnimationFrame(tik);
    return () => cancelAnimationFrame(id);
  }, [shag, tiho]);

  const dalshe = () => setShag((s) => (s + 1) % KADRY.length);
  const tsepochka = TEX.slice(0, shag + 1)
    .map((t, i) => (i === shag ? `\\color{#c2621b}{${t}}` : t))
    .join('=');

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      naEnter={dalshe}
      naStrelku={(d) => {
        if (d[0] > 0) dalshe();
        else if (d[0] < 0) setShag((s) => Math.max(0, s - 1));
      }}
    >
      <svg viewBox="0 0 260 260" aria-hidden="true" onClick={dalshe} style={{ cursor: 'pointer' }}>
        <KorenSvg r={kadr.r1} />
        <KorenSvg r={kadr.r2} />
        <BrusokSvg br={kadr.A} ton="blue" />
        <BrusokSvg br={kadr.B} ton="or" />
        {shag === 3 ? (
          <text
            className="zhv__v"
            x={104}
            y={196}
            textAnchor="middle"
            style={{ fontStyle: 'normal' }}
          >
            6
          </text>
        ) : null}
      </svg>
      <span className="zhv__plashka zhv__plashka--verh">
        <Formula tex={tsepochka} />
      </span>
      <span className="zhv__plashka" aria-live="polite">
        {SHAGI[shag]}
      </span>
    </ZhivoyKoren>
  );
}
