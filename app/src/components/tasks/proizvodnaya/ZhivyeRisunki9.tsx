'use client';

import { useId, useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import { renderLuchDvizheniya } from '@/lib/proizvodnaya/osDvizheniya';
import { renderFigura } from '@/lib/proizvodnaya/render';
import {
  MODUL,
  SEK,
  SKOROST,
  galochkaFig,
  sekushchayaFig,
} from '@/lib/proizvodnaya/stsenyPonyatiya';
import { FiguraSvg9 } from './FiguraSvg9';

/**
 * Живые рисунки блока «Понятие производной»: слайдер уменьшает
 * приращение, рисунок движка перерисовывается, рядом пересчитываются
 * числа. Значения слайдера — конечные десятичные дроби, чтобы числа на
 * панели были точными (функции рисунков — stsenyPonyatiya.ts). При
 * печати слайдер скрыт, остаётся кадр с начальным значением.
 */

/** Число для TeX: десятичная запятая, типографский минус, без хвостовых нулей. */
function chislo(x: number): string {
  const r = Math.round(x * 1e6) / 1e6;
  const text = String(Math.abs(r)).replace('.', '{,}');
  return r < 0 ? `-${text}` : text;
}

function Slider({
  label,
  slovami,
  values,
  index,
  onChange,
}: {
  label: string;
  /** Название величины словами — для скринридера. */
  slovami: string;
  values: readonly number[];
  index: number;
  onChange: (i: number) => void;
}) {
  const id = useId();
  const value = values[index] as number;
  return (
    <div className="z9-zhivoy__slider">
      <label htmlFor={id} className="z9-zhivoy__label">
        <span className="z9-zhivoy__glagol">Сдвиньте: </span>
        <Tex text={`${label} = $${chislo(value)}$`} />
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={values.length - 1}
        step={1}
        value={index}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-valuetext={`${slovami}: ${String(value).replace('.', ',').replace('-', 'минус ')}`}
      />
    </div>
  );
}

function Panel({ stroki }: { stroki: readonly string[] }) {
  return (
    <dl className="z9-zhivoy__panel" aria-live="polite">
      {stroki.map((s) => (
        <dd key={s}>
          <Tex text={s} />
        </dd>
      ))}
    </dl>
  );
}

/* ── Секущая → касательная ───────────────────────────────────────── */

const DX = SEK.shkala;

export function ZhivayaSekushchaya() {
  const [i, setI] = useState(1);
  const dx = DX[i] as number;
  const svg = renderFigura(sekushchayaFig(dx, false), { rezhim: 'teacher' });
  const df = SEK.f(SEK.x0 + dx) - SEK.f(SEK.x0);
  return (
    <figure className="z9-zhivoy">
      <FiguraSvg9 svg={svg} label="Секущая поворачивается к касательной" />
      <div className="z9-zhivoy__ruchki">
        <Slider
          label="$\Delta x$"
          slovami="приращение аргумента"
          values={DX}
          index={i}
          onChange={setI}
        />
        <Panel
          stroki={[
            `$\\Delta f = f(x+\\Delta x)-f(x) = ${chislo(df)}$`,
            `$\\operatorname{tg}\\beta = \\dfrac{\\Delta f}{\\Delta x} = ${chislo(SEK.tgBeta(dx))}$`,
            `$\\operatorname{tg}\\alpha = ${chislo(SEK.tgAlpha)}$ — к этому числу стремится $\\operatorname{tg}\\beta$`,
          ]}
        />
      </div>
    </figure>
  );
}

/* ── Мгновенная скорость ─────────────────────────────────────────── */

const DT = SKOROST.shkala;

export function ZhivayaSkorost() {
  const [i, setI] = useState(0);
  const dt = DT[i] as number;
  const s0 = SKOROST.s(SKOROST.t0);
  const ds = SKOROST.s(SKOROST.t0 + dt) - s0;
  const svg = renderLuchDvizheniya({ s: s0, ds });
  return (
    <figure className="z9-zhivoy">
      <FiguraSvg9 svg={svg} label="Путь точки за малое время" />
      <div className="z9-zhivoy__ruchki">
        <p className="z9-zhivoy__zakon">
          <Tex text="Закон движения $s(t)=\tfrac{t^2}{2}$ (метры, секунды), момент $t=2$." />
        </p>
        <Slider
          label="$\Delta t$"
          slovami="промежуток времени"
          values={DT}
          index={i}
          onChange={setI}
        />
        <Panel
          stroki={[
            `$\\Delta s = s(2+\\Delta t)-s(2) = ${chislo(ds)}$`,
            `$v_{\\text{ср}} = \\dfrac{\\Delta s}{\\Delta t} = ${chislo(SKOROST.vSr(dt))}$`,
            `$v = ${chislo(SKOROST.v)}$ — к этому числу стремится $v_{\\text{ср}}$`,
          ]}
        />
      </div>
    </figure>
  );
}

/* ── Модуль: скачок отношения ────────────────────────────────────── */

const DX_MODUL = MODUL.shkala;

export function ZhivoyModul() {
  const [i, setI] = useState(5);
  const dx = DX_MODUL[i] as number;
  const svg = renderFigura(galochkaFig(dx), { rezhim: 'teacher' });
  const otn = Math.abs(dx) / dx;
  return (
    <figure className="z9-zhivoy">
      <FiguraSvg9 svg={svg} label="Секущая графика модуля" />
      <div className="z9-zhivoy__ruchki">
        <Slider
          label="$\Delta x$"
          slovami="приращение аргумента"
          values={DX_MODUL}
          index={i}
          onChange={setI}
        />
        <Panel
          stroki={[
            `$\\Delta y = |\\Delta x| = ${chislo(Math.abs(dx))}$`,
            `$\\dfrac{\\Delta y}{\\Delta x} = ${chislo(otn)}$`,
            dx > 0
              ? 'Справа от нуля отношение всегда равно $1$.'
              : 'Слева от нуля отношение всегда равно $-1$.',
          ]}
        />
      </div>
    </figure>
  );
}
