'use client';

import { useId, useMemo, useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import { TEORIYA_7_TEKSTY } from '@/content/teoriya7';
import { renderGraph } from '@/lib/graph/renderer.js';
import { piTex, serii, ZNACHENIYA, znachenie, znachTex, type Funkciya } from '@/lib/zadanie7/trig';
import { add, mul, q, val, type Q } from '@/lib/zadanie11/num';

/**
 * Живой тригонометрический круг (теория №7, раздел 8).
 *
 * Ползунок перебирает табличные значения $a$; на единичной окружности —
 * точки, у которых синус (косинус, тангенс) равен $a$, ниже — серии
 * решений уравнения и корни на числовой прямой от $-2\pi$ до $2\pi$.
 * Нужный корень — наименьший положительный или наибольший отрицательный
 * — подсвечен. Оба рисунка собирает движок графиков (renderGraph), как
 * все чертежи сайта; на печати ползунок и кнопки скрыты, остаётся кадр.
 */

const T = TEORIYA_7_TEKSTY.krug;
const FUNKCII: { id: Funkciya; tex: string }[] = [
  { id: 'sin', tex: '\\sin x' },
  { id: 'cos', tex: '\\cos x' },
  { id: 'tg', tex: '\\operatorname{tg}x' },
];

/** Подпись угла для движка: «π/6», «−5π/6», «2π». */
function ugolTekst(t: Q): string {
  if (t.n === 0) {
    return '0';
  }
  const s = t.n < 0 ? '−' : '';
  const n = Math.abs(t.n);
  const ch = n === 1 ? 'π' : `${n}π`;
  return t.m === 1 ? `${s}${ch}` : `${s}${ch}/${t.m}`;
}

/** Угол в (−π; π]: точка на круге та же. */
function vKruge(t: Q): Q {
  let r = t;
  while (val(r) > 1) {
    r = add(r, q(-2));
  }
  while (val(r) <= -1) {
    r = add(r, q(2));
  }
  return r;
}

function krugScene(f: Funkciya, kod: string) {
  const a = znachenie(kod);
  const ugly = serii(f, kod).map((s) => vKruge(s.t0));
  /* У тангенса — и противоположная точка круга (период π). */
  const tochki = f === 'tg' ? [...ugly, ...ugly.map((t) => vKruge(add(t, q(1))))] : ugly;
  const ymax = f === 'tg' ? Math.max(1.45, Math.abs(a) + 0.35) : 1.45;
  const shapes: unknown[] = [{ type: 'circle', at: [0, 0], radius: 1, color: 'axis', width: 1.6 }];
  if (f === 'sin') {
    shapes.push({
      type: 'segment',
      from: [-1.4, a],
      to: [1.4, a],
      color: 'accent',
      style: 'dashed',
    });
  } else if (f === 'cos') {
    shapes.push({
      type: 'segment',
      from: [a, -1.35],
      to: [a, 1.35],
      color: 'accent',
      style: 'dashed',
    });
  } else {
    shapes.push({
      type: 'segment',
      from: [1, -ymax + 0.05],
      to: [1, ymax - 0.05],
      color: 'grid',
      width: 1.4,
    });
    shapes.push({ type: 'dot', at: [1, a], color: 'accent', radius: 5 });
  }
  tochki.forEach((t, i) => {
    const th = val(t) * Math.PI;
    const x = Math.cos(th);
    const y = Math.sin(th);
    const glavnaya = i < ugly.length;
    if (f === 'tg' && glavnaya) {
      shapes.push({ type: 'segment', from: [-x, -y], to: [1, a], color: 'lineA', style: 'dashed' });
    }
    shapes.push({ type: 'segment', from: [0, 0], to: [x, y], color: 'lineA', width: 1.8 });
    if (glavnaya && t.n !== 0) {
      const deg = val(t) * 180;
      shapes.push({
        type: 'arc',
        at: [0, 0],
        from: Math.min(0, deg),
        to: Math.max(0, deg),
        radius: 0.22 + 0.1 * i,
        color: 'lineA',
      });
    }
    shapes.push({ type: 'dot', at: [x, y], color: 'lineA', radius: 5.5 });
    shapes.push({
      type: 'label',
      at: [x * 1.27, y * 1.2],
      text: ugolTekst(t),
      color: 'lineA',
      size: 15,
    });
  });
  return {
    window: { xmin: -1.6, xmax: 1.6, ymin: -ymax, ymax },
    cell: 120,
    grid: { step: 1, show: false },
    axes: { labelX: 'x', labelY: 'y', origin: '' },
    axisLabels: 'minimal',
    curves: [],
    points: [],
    shapes,
    alt: `Единичная окружность: точки, у которых ${f === 'sin' ? 'синус' : f === 'cos' ? 'косинус' : 'тангенс'} равен ${kod.replace('r', '√')}`,
  };
}

interface Koren {
  t: Q;
  nuzhnyy: boolean;
}

/** Корни уравнения на [−2π; 2π] в долях π и нужный по вопросу. */
function korni(f: Funkciya, kod: string, v: 'minPol' | 'maxOtr'): Koren[] {
  const vse: Q[] = [];
  for (const s of serii(f, kod)) {
    for (let n = -4; n <= 4; n += 1) {
      const t = add(s.t0, mul(q(s.per), q(n)));
      if (Math.abs(val(t)) <= 2 + 1e-9 && !vse.some((x) => val(x) === val(t))) {
        vse.push(t);
      }
    }
  }
  vse.sort((x, y) => val(x) - val(y));
  const kandidaty = vse.filter((t) => (v === 'minPol' ? val(t) > 0 : val(t) < 0));
  const nuzhnyy = v === 'minPol' ? kandidaty[0] : kandidaty.at(-1);
  return vse.map((t) => ({ t, nuzhnyy: nuzhnyy !== undefined && val(t) === val(nuzhnyy) }));
}

function pryamayaScene(k: Koren[]) {
  const shapes: unknown[] = [];
  for (let i = -4; i <= 4; i += 1) {
    const x = i / 2;
    shapes.push({ type: 'segment', from: [x, -0.08], to: [x, 0.08], color: 'axis', width: 1.2 });
    shapes.push({
      type: 'label',
      at: [x, -0.32],
      text: ugolTekst(q(i, 2)),
      color: 'axis',
      size: 13,
    });
  }
  for (const r of k) {
    shapes.push({
      type: 'dot',
      at: [val(r.t), 0],
      color: r.nuzhnyy ? 'accent' : 'lineA',
      radius: r.nuzhnyy ? 7 : 4.5,
    });
    if (r.nuzhnyy) {
      shapes.push({
        type: 'label',
        at: [val(r.t), 0.33],
        text: ugolTekst(r.t),
        color: 'accent',
        size: 15,
      });
    }
  }
  return {
    window: { xmin: -2.3, xmax: 2.3, ymin: -0.55, ymax: 0.55 },
    cell: 120,
    grid: { step: 1, show: false },
    axes: { labelX: '', labelY: '', origin: '', y: false },
    axisLabels: 'none',
    curves: [],
    points: [],
    shapes,
    alt: 'Числовая прямая от −2π до 2π с корнями уравнения',
  };
}

function seriiTex(f: Funkciya, kod: string): string {
  return serii(f, kod)
    .map((s) => {
      const per = s.per === 1 ? '\\pi n' : `${s.per}\\pi n`;
      return `$x=${s.t0.n === 0 ? per : `${piTex(s.t0)}+${per}`}$`;
    })
    .join(' или ');
}

export function ZhivoyKrug7() {
  const id = useId();
  const [f, setF] = useState<Funkciya>('sin');
  const [i, setI] = useState(3);
  const [v, setV] = useState<'minPol' | 'maxOtr'>('minPol');
  const spisok = ZNACHENIYA[f];
  const kod = spisok[Math.min(i, spisok.length - 1)] ?? '0';
  const fTex = FUNKCII.find((x) => x.id === f)?.tex ?? '';
  const krug = useMemo(() => renderGraph(krugScene(f, kod)) as string, [f, kod]);
  const k = useMemo(() => korni(f, kod, v), [f, kod, v]);
  const pryamaya = useMemo(() => renderGraph(pryamayaScene(k)) as string, [k]);
  const nuzhnyy = k.find((r) => r.nuzhnyy);
  return (
    <figure className="z7-krug">
      <figcaption className="z7-krug__title">{T.title}</figcaption>
      <div className="z7-krug__knopki" role="group" aria-label={T.funkciya}>
        {FUNKCII.map((x) => (
          <button
            type="button"
            key={x.id}
            className="z7-krug__knopka"
            aria-pressed={f === x.id}
            onClick={() => {
              setF(x.id);
              setI(Math.min(i, ZNACHENIYA[x.id].length - 1));
            }}
          >
            <Tex text={`$${x.tex}$`} />
          </button>
        ))}
      </div>
      <p className="z7-krug__uravnenie">
        <Tex text={`$${fTex}=${znachTex(kod)}$`} />
      </p>
      <span className="z7-krug__svg" dangerouslySetInnerHTML={{ __html: krug }} />
      <div className="z7-krug__polzunok">
        <label htmlFor={`${id}-a`}>
          {T.znachenie} <Tex text="$a$" />
        </label>
        <input
          id={`${id}-a`}
          type="range"
          min={0}
          max={spisok.length - 1}
          step={1}
          value={Math.min(i, spisok.length - 1)}
          aria-valuetext={kod.replace('r', 'корень из ')}
          onChange={(e) => setI(Number(e.target.value))}
        />
      </div>
      <p className="z7-krug__serii">
        <Tex text={`${seriiTex(f, kod)}, $n\\in\\mathbb{Z}$.`} />
      </p>
      <div className="z7-krug__knopki" role="group" aria-label={T.vopros}>
        {(['minPol', 'maxOtr'] as const).map((x) => (
          <button
            type="button"
            key={x}
            className="z7-krug__knopka"
            aria-pressed={v === x}
            onClick={() => setV(x)}
          >
            {T[x]}
          </button>
        ))}
      </div>
      <p className="z7-krug__podzag">{T.pryamaya}</p>
      <span className="z7-krug__svg" dangerouslySetInnerHTML={{ __html: pryamaya }} />
      <p className="z7-krug__otvet" aria-live="polite">
        {nuzhnyy ? (
          <Tex
            text={`${T[v][0]?.toUpperCase()}${T[v].slice(1)} корень: $x=${piTex(nuzhnyy.t)}$.`}
          />
        ) : null}
      </p>
      <p className="z7-krug__podpis">{T.podpis}</p>
    </figure>
  );
}
