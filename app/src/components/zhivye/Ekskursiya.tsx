'use client';

import { useMemo, useState } from 'react';
import { Taymlayn, Upravlenie, tex, type TekstyUpravleniya } from './Elementy';
import { useHod, type Hod } from './hooks';
import '@/components/tasks/steklo/steklo.css';
import './zhivye.css';

/**
 * «Экскурсия» для живых графиков с ползунками (теория №11): параметры
 * плавно проходят ключевые кадры, на каждом — пауза и пояснение. Сам
 * график рисует прежний компонент; экскурсия только подставляет
 * параметры. Тронул ползунок — показ встаёт на паузу, параметры дальше
 * твои (с того места, где остановился показ).
 */

export interface Kadr<S> {
  s: S;
  /** Пояснение к кадру: текст с формулами в $…$. */
  tex: string;
}

const TEKSTY: TekstyUpravleniya = {
  zapustit: 'Показать',
  prodolzhit: 'Продолжить',
  pauza: 'Пауза',
  snachala: 'Сначала',
  eshche: 'Ещё раз',
  skorostPokaza: 'Скорость показа',
  klaviatura: 'Пробел — показ и пауза. Ползунки ниже — твои: тронешь — показ встанет на паузу.',
};

/** Плавный переход внутри отрезка между кадрами. */
function plavno(u: number): number {
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
}

export interface Ekskursiya<S> {
  /** Параметры показа или null — сейчас ползунки ученика. */
  s: S | null;
  /** Перейти к ползункам: сначала перенести в них текущие параметры показа. */
  vRuchnoy: (perenesti: (s: S) => void) => void;
  panel: {
    hod: Hod;
    t: number;
    n: number;
    tex: string;
    aktiven: boolean;
    pusk: () => void;
    sbros: () => void;
  };
}

export function useEkskursiya<S>(
  kadry: readonly Kadr<S>[],
  smeshat: (a: S, b: S, u: number) => S,
): Ekskursiya<S> {
  const n = kadry.length;
  const o = useMemo(
    () => ({
      tMax: n - 1,
      ostanovki: Array.from({ length: n - 2 }, (_, i) => i + 1),
      sekNaEd: 1.6,
      sekSnimok: 1.8,
      razgon: 0.25,
    }),
    [n],
  );
  const hod = useHod(o);
  const [aktiven, setAktiven] = useState(false);
  const { t } = hod.kadr;
  const i = Math.min(n - 2, Math.floor(t + 1e-9));
  const u = Math.min(1, Math.max(0, t - i));
  const a = kadry[i] as Kadr<S>;
  const b = kadry[i + 1] as Kadr<S>;
  const s = u < 1e-9 ? a.s : u > 1 - 1e-9 ? b.s : smeshat(a.s, b.s, plavno(u));
  const tekushchiy = kadry[Math.min(n - 1, Math.round(t))] as Kadr<S>;

  return {
    s: aktiven ? s : null,
    vRuchnoy: (perenesti) => {
      if (!aktiven) return;
      if (hod.kadr.igraet) hod.pusk();
      perenesti(s);
      setAktiven(false);
    },
    panel: {
      hod,
      t,
      n,
      tex: tekushchiy.tex,
      aktiven,
      pusk: () => {
        setAktiven(true);
        hod.pusk();
      },
      sbros: () => {
        setAktiven(true);
        hod.sbros();
      },
    },
  };
}

/** Панель экскурсии: таймлайн по кадрам, пояснение кадра и кнопки. */
export function EkskursiyaPanel({ panel }: { panel: Ekskursiya<unknown>['panel'] }) {
  const { hod, t, n, aktiven } = panel;
  const konec = t >= n - 1 - 1e-9;
  const svoy: Hod = { ...hod, pusk: panel.pusk, sbros: panel.sbros };
  return (
    <div
      className="zv-osnova zv-ekskursiya"
      onKeyDown={(e) => {
        if (
          (e.key === ' ' || e.key === 'Spacebar') &&
          (e.target as HTMLElement).tagName !== 'BUTTON'
        ) {
          e.preventDefault();
          panel.pusk();
        }
      }}
    >
      <Taymlayn
        dolya={t / (n - 1)}
        strelka={(t / (n - 1)) * 360}
        puzyrHtml={tex(`кадр ${Math.min(n, Math.floor(t + 1e-9) + 1)} из ${n}`)}
        ariaLabel="Кадр показа"
        ariaValueText={`кадр ${Math.min(n, Math.floor(t + 1e-9) + 1)} из ${n}`}
        metki={[
          { dolya: 0, text: '1', proydena: true },
          { dolya: 1, text: String(n), proydena: konec },
        ]}
        tochki={Array.from({ length: n - 2 }, (_, k) => ({
          dolya: (k + 1) / (n - 1),
          proydena: t >= k + 1 - 1e-9,
        }))}
        onDolya={(d) => {
          panel.pusk();
          hod.peremotat(d * (n - 1));
        }}
      />
      <p
        className="zv-status zv-ekskursiya-tekst"
        aria-live="polite"
        dangerouslySetInnerHTML={{ __html: aktiven ? tex(panel.tex) : tex(TEKSTY_RUCHNOY) }}
      />
      <Upravlenie hod={svoy} T={TEKSTY} konec={konec && aktiven} />
    </div>
  );
}

const TEKSTY_RUCHNOY =
  'Нажми «Показать» — график сам пройдёт по главным случаям. Или двигай ползунки.';

/** Смешение чисел: для кадров из одних чисел. */
export function smeshatChisla<S extends Record<string, number>>(a: S, b: S, u: number): S {
  const out: Record<string, number> = {};
  for (const k of Object.keys(b))
    out[k] = (a[k] as number) + ((b[k] as number) - (a[k] as number)) * u;
  return out as S;
}
