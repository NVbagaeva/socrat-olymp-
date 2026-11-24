'use client';

import { clsx } from 'clsx';
import { useMemo, type CSSProperties } from 'react';
import { ZHIVOY_19 } from '@/content/zadanie19';
import { PARAMETR18 as T } from '@/content/zhivye18';
import { katex } from '@/lib/graph/katex';
import { svg19 } from '@/lib/zadanie19/risunok';
import { mnozhestvoTex, zhivoy19, type Zhivoy19 } from '@/lib/zadanie19/zhivye';
import { ru } from '@/lib/zhivye/hod';
import { aIzU, hodParametra, lenta, naSetke, uIzA } from '@/lib/zhivye/parametr18';
import { Taymlayn, Upravlenie, klavishi, tex } from '../Elementy';
import { useDvizhenie, useHod } from '../hooks';
import '../zhivye.css';
import './parametr18.css';

/**
 * Живая сцена параметра (теория №18): параметр сам проходит отрезок от
 * min до max, на особых значениях — пауза. Рисунок строит прежний движок
 * по описанию (lib/zadanie19/zhivye.ts), под ним растёт лента числа
 * решений: отрезок значений параметра, раскрашенный по числу решений.
 * Особые значения — кнопками, как раньше. Заменила Zhivoy19 (ползунок).
 */

/** «a = 0,25» в KaTeX. */
function znachenieTex(bukva: string, v: number): string {
  return `${bukva}=${String(Math.round(v * 100) / 100).replace('.', '{,}')}`;
}

/** Готовый рисунок движка по значению на сетке — с кешем: кадры повторяются. */
const kesh = new Map<string, string>();
function risunok(id: string, z: Zhivoy19, a: number): string {
  const kl = `${id}|${a}`;
  let html = kesh.get(kl);
  if (html === undefined) {
    html = svg19(z.scena(a));
    if (kesh.size > 600) kesh.clear();
    kesh.set(kl, html);
  }
  return html;
}

/** Строка под рисунком (как у прежнего блока): множество, число решений и вывод. */
function itogTex(z: Zhivoy19, a: number): string {
  if (z.mnozhestvo !== undefined) {
    const mn = `$${mnozhestvoTex(z.mnozhestvo(a))}$`;
    return z.itog === undefined ? mn : `${mn}; ${z.itog(a)}`;
  }
  if (z.resheniy === undefined && z.itog !== undefined) return z.itog(a);
  const n = ZHIVOY_19.resheniy(z.resheniy?.(a) ?? 0);
  return z.itog === undefined ? n : `${n}; ${z.itog(a)}`;
}

/**
 * Особое значение подписью без KaTeX (в SVG-ленте формулы не набрать):
 * «\frac15» → «1/5», «-\frac{4}{\sqrt3}» → «−4/√3», «2{,}1» → «2,1».
 */
function podpisTex(t: string): string {
  let i = 0;
  const arg = (): string => {
    if (t[i] === '{') {
      let gl = 1;
      const s0 = (i += 1);
      while (i < t.length && gl > 0) {
        if (t[i] === '{') gl += 1;
        if (t[i] === '}') gl -= 1;
        i += 1;
      }
      return podpisTex(t.slice(s0, i - 1));
    }
    return vyrazhenie(true);
  };
  const vyrazhenie = (odin: boolean): string => {
    let out = '';
    while (i < t.length) {
      if (t.startsWith('\\', i)) {
        const m = /^\\([a-z]+)/.exec(t.slice(i));
        const kom = m?.[1] ?? '';
        i += kom.length + 1;
        if (kom === 'frac' || kom === 'dfrac' || kom === 'tfrac') out += `${arg()}/${arg()}`;
        else if (kom === 'sqrt') out += `√${arg()}`;
        else if (kom === 'pi') out += 'π';
      } else if (t[i] === '{') {
        out += arg();
      } else {
        out += t[i] === '-' ? '−' : t[i];
        i += 1;
      }
      if (odin) break;
    }
    return out;
  };
  return vyrazhenie(false);
}

const CVETA = ['n0', 'n1', 'n2', 'n3', 'n4'] as const;
function cvet(n: number): string {
  if (n === Infinity) return 'ninf';
  return CVETA[Math.min(n, 4)] ?? 'n4';
}

export default function Parametr({ id }: { id: string }) {
  const z = zhivoy19(id) as Zhivoy19;
  const o = useMemo(() => hodParametra(z), [z]);
  const hod = useHod(o);
  const dvizhenie = useDvizhenie();
  const ln = useMemo(() => lenta(z), [z]);
  const { t } = hod.kadr;
  const a = naSetke(z, aIzU(z, t));
  const konec = t >= 1 - 1e-9;
  const osoboe = z.osobye.find((x) => Math.abs(x.a - a) < 1e-9);
  const naSnimke = osoboe !== undefined && (hod.kadr.snimokIdet || !hod.kadr.igraet);

  const zn = znachenieTex(z.bukva, a);
  const status = `${naSnimke ? `${T.osoboe}: ` : ''}$${zn}$: ${itogTex(z, a)}`;
  const shagU = z.shag / (z.max - z.min);
  /* Shift + стрелка — к следующему особому значению. */
  const osobyeU = [...new Set(z.osobye.map((x) => uIzA(z, x.a)))].sort((p, q) => p - q);

  return (
    <div
      className="zv-osnova"
      onKeyDown={(e) => {
        if (e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
          e.preventDefault();
          const vpered = e.key === 'ArrowRight';
          const cel = vpered
            ? osobyeU.find((u) => u > t + 1e-9)
            : [...osobyeU].reverse().find((u) => u < t - 1e-9);
          hod.peremotat(cel ?? (vpered ? 1 : 0));
          return;
        }
        klavishi(hod, { shag: shagU * 5, shagShift: shagU * 5, tMax: 1 })(e);
      }}
    >
      <Taymlayn
        dolya={t}
        strelka={t * 360}
        puzyrHtml={tex(`$${zn}$`)}
        ariaLabel={T.ariaVremya}
        ariaValueText={`${z.bukva} = ${ru(a, 2)}`}
        metki={[
          { dolya: 0, text: ru(z.min, 2), proydena: true },
          { dolya: 1, text: ru(z.max, 2), proydena: konec },
        ]}
        tochki={osobyeU
          .filter((u) => u > 1e-9 && u < 1 - 1e-9)
          .map((u) => ({ dolya: u, proydena: t >= u - 1e-9 }))}
        onDolya={(d) => hod.peremotat(d)}
      />

      <div
        className={clsx('zv-scena', 'zv18-scena', `is-${dvizhenie}`)}
        tabIndex={0}
        role="group"
        aria-label={`${zn.replace('{,}', ',')}. ${T.upravlenie.klaviatura}`}
      >
        <div className="zv18-risunok" dangerouslySetInnerHTML={{ __html: risunok(id, z, a) }} />
      </div>

      {ln !== null ? (
        <div className="zv18-lenta" aria-hidden="true">
          <p className="zv18-lenta-zag">{T.lentaZag}</p>
          <div className="zv18-polosa">
            {ln.kuski.map((k, i) => {
              const vidno = Math.max(0, Math.min(k.do, t) - k.ot);
              const shir = k.do - k.ot;
              return (
                <span
                  key={i}
                  className={clsx('zv18-kusok', `is-${cvet(k.n)}`)}
                  style={
                    {
                      '--ot': k.ot,
                      '--shir': shir,
                      '--vidno': shir > 0 ? vidno / shir : 0,
                    } as CSSProperties
                  }
                >
                  {vidno > 0.05 && shir > 0.06 ? <b>{k.n === Infinity ? '∞' : k.n}</b> : null}
                </span>
              );
            })}
            {ln.tochki.map((p, i) =>
              t >= p.u - 1e-9 ? (
                <i
                  key={`t${i}`}
                  className={clsx('zv18-tochka', `is-${cvet(p.n)}`)}
                  style={{ '--u': p.u } as CSSProperties}
                  title={String(p.n)}
                >
                  {p.n === Infinity ? '∞' : p.n}
                </i>
              ) : null,
            )}
            <i className="zv18-metka" style={{ '--u': t } as CSSProperties} />
          </div>
          <div className="zv18-osi">
            {z.osobye
              .filter((x) => x.a >= z.min - 1e-9 && x.a <= z.max + 1e-9)
              .map((x) => (
                <span
                  key={x.tex}
                  style={{ '--u': uIzA(z, x.a) } as CSSProperties}
                  className={clsx(t >= uIzA(z, x.a) - 1e-9 && 'is-proydena')}
                >
                  {podpisTex(x.tex)}
                </span>
              ))}
          </div>
        </div>
      ) : null}

      <p
        className="zv-status"
        aria-live="polite"
        dangerouslySetInnerHTML={{ __html: tex(status) }}
      />
      <Upravlenie hod={hod} T={T.upravlenie} konec={konec} />

      <div className="zv18-osobye" role="group" aria-label={ZHIVOY_19.osobye}>
        <span className="zv18-osobye-zag">{ZHIVOY_19.osobye}</span>
        {z.osobye.map((x) => (
          <button
            key={x.tex}
            type="button"
            className={clsx(Math.abs(a - x.a) < 1e-9 && 'is-on')}
            aria-pressed={Math.abs(a - x.a) < 1e-9}
            onClick={() => hod.peremotat(uIzA(z, x.a))}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(`${z.bukva}=${x.tex}`, { throwOnError: true }),
            }}
          />
        ))}
      </div>
    </div>
  );
}
