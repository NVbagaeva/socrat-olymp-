'use client';

import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { GRANI } from '@/lib/veroyatnost/metody4-interaktiv';

/**
 * Интерактивы глав ключевых методов задания №4 («Попробуйте сами»).
 *
 * Формулы с дробями набраны KaTeX на сервере (GlavaMetoda4) для каждого
 * возможного состояния и приходят сюда готовой вёрсткой: в браузер
 * KaTeX не уезжает. У диска состояний сто одно, и там только десятичные
 * числа — они пишутся обычным текстом тем же шрифтом.
 *
 * Слова интерактивов — в INTERAKTIV ниже: они живут только здесь.
 */

const INTERAKTIV = {
  sbros: 'Сбросить',
  sharik: (i: number, da: boolean) => `Шарик ${i}: ${da ? 'благоприятный' : 'не отмечен'}`,
  shariki: (m: number, n: number) => `Отмечено ${m} из ${n}`,
  kostiUslovie: 'Условие',
  kostiPervaya: 'Первая кость',
  kostiVtoraya: 'Вторая кость',
  kostiPodpis: (m: number) => `Подходит клеток: ${m} из 36`,
  broskov: (n: number) => `${n} броска`,
  derevoPodpis: (m: number, n: number) => `Отмечено цепочек: ${m} из ${n}`,
  derevoList: (c: string, da: boolean) => `Цепочка ${c}: ${da ? 'отмечена' : 'не отмечена'}`,
  stolNachalo: 'Нажмите на любой стул — туда сядет Алиса.',
  stolAlisa: 'Алиса',
  stolStul: (i: number) => `Стул ${i}`,
  stolPodpis: (n: number) => `Для Шляпника ${n} равновозможных стульев, рядом с Алисой — 2:`,
  diskPolzunok: 'Вероятность оранжевого сектора',
} as const;

function Html({ html, className }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ── 1. Шарики ─────────────────────────────────────────────────────── */

export function Shariki4({ n, formuly }: { n: number; formuly: string[] }) {
  const [vybrany, setVybrany] = useState<ReadonlySet<number>>(() => new Set([0, 3, 7]));
  const m = vybrany.size;
  function pereklyuchit(i: number) {
    setVybrany((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }
  return (
    <div className="m4i m4i-shariki">
      <div className="m4i-shariki__podnos" role="group" aria-label={INTERAKTIV.shariki(m, n)}>
        {Array.from({ length: n }, (_, i) => {
          const da = vybrany.has(i);
          return (
            <button
              key={i}
              type="button"
              className={da ? 'm4i-sharik is-da' : 'm4i-sharik'}
              aria-pressed={da}
              aria-label={INTERAKTIV.sharik(i + 1, da)}
              onClick={() => pereklyuchit(i)}
            />
          );
        })}
      </div>
      <div className="m4i-itog" aria-live="polite">
        <span className="m4i-itog__podpis">{INTERAKTIV.shariki(m, n)}</span>
        <Html className="m4i-itog__formula" html={formuly[m] ?? ''} />
      </div>
      <button
        type="button"
        className="btn btn--secondary btn--sm"
        onClick={() => setVybrany(new Set())}
      >
        {INTERAKTIV.sbros}
      </button>
    </div>
  );
}

/* ── 2. Таблица 6×6 ────────────────────────────────────────────────── */

interface UslovieKlient {
  id: string;
  nazvanie: string;
  formula: string;
}

/* Условия повторены функциями: в клиент передаются только данные. */
const PODHODIT: Record<string, (a: number, b: number) => boolean> = {
  'summa-8': (a, b) => a + b === 8,
  shesterka: (a, b) => a === 6 || b === 6,
  ravny: (a, b) => a === b,
};

export function Kosti4({ usloviya }: { usloviya: UslovieKlient[] }) {
  const [id, setId] = useState(usloviya[0]?.id ?? '');
  const u = usloviya.find((x) => x.id === id);
  const podhodit = PODHODIT[id] ?? (() => false);
  const m = GRANI.reduce((s, a) => s + GRANI.filter((b) => podhodit(a, b)).length, 0);
  return (
    <div className="m4i m4i-kosti">
      <div className="m4i-vybor" role="radiogroup" aria-label={INTERAKTIV.kostiUslovie}>
        {usloviya.map((x) => (
          <button
            key={x.id}
            type="button"
            role="radio"
            aria-checked={x.id === id}
            className={x.id === id ? 'm4i-chip is-on' : 'm4i-chip'}
            onClick={() => setId(x.id)}
          >
            {x.nazvanie}
          </button>
        ))}
      </div>
      <div className="m4i-kosti__ramka">
        <table className="m4i-tablica">
          <caption className="sr-only">{INTERAKTIV.kostiPodpis(m)}</caption>
          <thead>
            <tr>
              <th scope="col" className="m4i-tablica__ugol">
                <span aria-hidden="true">1-я \ 2-я</span>
                <span className="sr-only">
                  {INTERAKTIV.kostiPervaya} / {INTERAKTIV.kostiVtoraya}
                </span>
              </th>
              {GRANI.map((b) => (
                <th scope="col" key={b}>
                  {b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GRANI.map((a) => (
              <tr key={a}>
                <th scope="row">{a}</th>
                {GRANI.map((b) => {
                  const da = podhodit(a, b);
                  return (
                    <td key={b} className={da ? 'is-da' : undefined}>
                      {a};{b}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="m4i-itog" aria-live="polite">
        <span className="m4i-itog__podpis">{INTERAKTIV.kostiPodpis(m)}</span>
        {u === undefined ? null : <Html className="m4i-itog__formula" html={u.formula} />}
      </div>
    </div>
  );
}

/* ── 3. Дерево бросков ─────────────────────────────────────────────── */

interface VariantDereva {
  n: number;
  cepochki: string[];
  formuly: string[];
}

const SHAG_X = 120;
const SHAG_Y = 40;

export function Derevo4({ varianty }: { varianty: VariantDereva[] }) {
  const [n, setN] = useState(varianty[0]?.n ?? 2);
  const [vybrany, setVybrany] = useState<ReadonlySet<string>>(new Set());
  const v = varianty.find((x) => x.n === n);
  if (v === undefined) {
    return null;
  }
  const listev = v.cepochki.length;
  const shirina = 40 + n * SHAG_X + 90;
  const vysota = listev * SHAG_Y + 10;
  /* Узел уровня k с префиксом p: y — середина его листьев. */
  const yUzla = (k: number, indeks: number) => {
    const span = listev / 2 ** k;
    return 5 + (indeks * span + span / 2) * SHAG_Y;
  };
  const vetki: { x1: number; y1: number; x2: number; y2: number; bukva: string; key: string }[] =
    [];
  for (let k = 0; k < n; k += 1) {
    for (let i = 0; i < 2 ** k; i += 1) {
      ['О', 'Р'].forEach((bukva, j) => {
        vetki.push({
          x1: 30 + k * SHAG_X,
          y1: yUzla(k, i),
          x2: 30 + (k + 1) * SHAG_X,
          y2: yUzla(k + 1, i * 2 + j),
          bukva,
          key: `${k}-${i}-${j}`,
        });
      });
    }
  }
  function pereklyuchit(c: string) {
    setVybrany((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }
  function klavisha(e: KeyboardEvent, c: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pereklyuchit(c);
    }
  }
  const m = v.cepochki.filter((c) => vybrany.has(c)).length;
  return (
    <div className="m4i m4i-derevo">
      <div className="m4i-vybor" role="radiogroup" aria-label="Число бросков">
        {varianty.map((x) => (
          <button
            key={x.n}
            type="button"
            role="radio"
            aria-checked={x.n === n}
            className={x.n === n ? 'm4i-chip is-on' : 'm4i-chip'}
            onClick={() => {
              setN(x.n);
              setVybrany(new Set());
            }}
          >
            {INTERAKTIV.broskov(x.n)}
          </button>
        ))}
      </div>
      <div className="m4i-derevo__ramka">
        <svg
          className="m4i-derevo__svg"
          viewBox={`0 0 ${shirina} ${vysota}`}
          width={shirina}
          height={vysota}
          role="group"
          aria-label={INTERAKTIV.derevoPodpis(m, listev)}
        >
          {vetki.map((b) => (
            <g key={b.key}>
              <line className="m4i-derevo__vetka" x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />
              <text
                className="m4i-derevo__bukva"
                x={(b.x1 + b.x2) / 2}
                y={(b.y1 + b.y2) / 2 - 6}
                textAnchor="middle"
              >
                {b.bukva}
              </text>
            </g>
          ))}
          {Array.from({ length: n }, (_, k) =>
            Array.from({ length: 2 ** k }, (__, i) => (
              <circle
                key={`u${k}-${i}`}
                className="m4i-derevo__uzel"
                cx={30 + k * SHAG_X}
                cy={yUzla(k, i)}
                r={6}
              />
            )),
          )}
          {v.cepochki.map((c, i) => {
            const da = vybrany.has(c);
            const y = yUzla(n, i);
            const x = 30 + n * SHAG_X;
            return (
              <g
                key={c}
                className={da ? 'm4i-list is-da' : 'm4i-list'}
                role="checkbox"
                aria-checked={da}
                aria-label={INTERAKTIV.derevoList(c, da)}
                tabIndex={0}
                onClick={() => pereklyuchit(c)}
                onKeyDown={(e) => klavisha(e, c)}
              >
                <rect x={x - 8} y={y - 15} width={86} height={30} rx={15} />
                <text x={x + 35} y={y + 5} textAnchor="middle">
                  {c}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="m4i-itog" aria-live="polite">
        <span className="m4i-itog__podpis">{INTERAKTIV.derevoPodpis(m, listev)}</span>
        <Html className="m4i-itog__formula" html={v.formuly[m] ?? ''} />
      </div>
      <button
        type="button"
        className="btn btn--secondary btn--sm"
        onClick={() => setVybrany(new Set())}
      >
        {INTERAKTIV.sbros}
      </button>
    </div>
  );
}

/* ── 4. Круглый стол ───────────────────────────────────────────────── */

export function Stol4({ mest, formula }: { mest: number; formula: string }) {
  const [alisa, setAlisa] = useState<number | null>(null);
  const R = 118;
  const C = 160;
  const sosed = (i: number) =>
    alisa !== null && (i === (alisa + 1) % mest || i === (alisa + mest - 1) % mest);
  return (
    <div className="m4i m4i-stol">
      <svg
        className="m4i-stol__svg"
        viewBox="0 0 320 320"
        width={320}
        height={320}
        role="group"
        aria-label={INTERAKTIV.stolNachalo}
      >
        <defs>
          <radialGradient id="m4i-stol-steklo" cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#bcd7ff" stopOpacity="0.7" />
          </radialGradient>
        </defs>
        <circle className="m4i-stol__stol" cx={C} cy={C} r={80} fill="url(#m4i-stol-steklo)" />
        {Array.from({ length: mest }, (_, i) => {
          const ugol = (i / mest) * Math.PI * 2 - Math.PI / 2;
          const x = C + R * Math.cos(ugol);
          const y = C + R * Math.sin(ugol);
          const kto =
            alisa === i ? 'is-alisa' : sosed(i) ? 'is-sosed' : alisa !== null ? 'is-mozhno' : '';
          return (
            <g
              key={i}
              className={`m4i-stul ${kto}`}
              role="button"
              tabIndex={0}
              aria-pressed={alisa === i}
              aria-label={
                alisa === i
                  ? `${INTERAKTIV.stolStul(i + 1)}: ${INTERAKTIV.stolAlisa}`
                  : INTERAKTIV.stolStul(i + 1)
              }
              onClick={() => setAlisa(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setAlisa(i);
                }
              }}
            >
              <circle cx={x} cy={y} r={22} />
              {alisa === i ? (
                <text x={x} y={y + 5} textAnchor="middle">
                  А
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <div className="m4i-itog" aria-live="polite">
        {alisa === null ? (
          <span className="m4i-itog__podpis">{INTERAKTIV.stolNachalo}</span>
        ) : (
          <>
            <span className="m4i-itog__podpis">{INTERAKTIV.stolPodpis(mest - 1)}</span>
            <Html className="m4i-itog__formula" html={formula} />
          </>
        )}
      </div>
    </div>
  );
}

/* ── 5. Стеклянный диск ────────────────────────────────────────────── */

function ruDolya(p: number): string {
  return (p / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
}

/** Точка на окружности: доля p (0…100) по часовой от верха. */
function tochka(p: number, r: number, c: number): [number, number] {
  const ugol = (p / 100) * Math.PI * 2 - Math.PI / 2;
  return [c + r * Math.cos(ugol), c + r * Math.sin(ugol)];
}

/** Обозначения подписи диска, набранные KaTeX на сервере: числа между ними меняются. */
export interface DiskTex {
  /** P(A)= */
  pa: string;
  /** P(\overline A)=1- */
  pna: string;
  /** = */
  ravno: string;
}

export function Disk4({ nachalo, tex }: { nachalo: number; tex: DiskTex }) {
  const [p, setP] = useState(nachalo);
  const svg = useRef<SVGSVGElement | null>(null);
  const tyanem = useRef(false);
  const C = 140;
  const R = 110;

  const izTochki = useCallback((e: PointerEvent) => {
    const box = svg.current?.getBoundingClientRect();
    if (box === undefined) return;
    const x = ((e.clientX - box.left) / box.width) * 280 - C;
    const y = ((e.clientY - box.top) / box.height) * 280 - C;
    let ugol = Math.atan2(y, x) + Math.PI / 2;
    if (ugol < 0) ugol += Math.PI * 2;
    setP(Math.min(100, Math.max(0, Math.round((ugol / (Math.PI * 2)) * 100))));
  }, []);

  const [x1, y1] = tochka(p, R, C);
  const bolshaya = p > 50 ? 1 : 0;
  const sektor =
    p <= 0
      ? ''
      : p >= 100
        ? `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R} Z`
        : `M ${C} ${C} L ${C} ${C - R} A ${R} ${R} 0 ${bolshaya} 1 ${x1} ${y1} Z`;
  const pa = ruDolya(p);
  const pna = ruDolya(100 - p);

  return (
    <div className="m4i m4i-disk">
      <svg
        ref={svg}
        className="m4i-disk__svg"
        viewBox="0 0 280 280"
        width={280}
        height={280}
        aria-hidden="true"
        onPointerDown={(e) => {
          tyanem.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          izTochki(e);
        }}
        onPointerMove={(e) => {
          if (tyanem.current) izTochki(e);
        }}
        onPointerUp={() => {
          tyanem.current = false;
        }}
      >
        <defs>
          <radialGradient id="m4i-disk-steklo" cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#a9caf5" stopOpacity="0.75" />
          </radialGradient>
          <radialGradient id="m4i-disk-ogon" cx="40%" cy="35%" r="75%">
            <stop offset="0" stopColor="#ffe2bd" />
            <stop offset="1" stopColor="#f39a3d" />
          </radialGradient>
        </defs>
        <circle className="m4i-disk__ves" cx={C} cy={C} r={R} fill="url(#m4i-disk-steklo)" />
        {sektor === '' ? null : (
          <path className="m4i-disk__sektor" d={sektor} fill="url(#m4i-disk-ogon)" />
        )}
        <line className="m4i-disk__granica" x1={C} y1={C} x2={C} y2={C - R} />
        <line className="m4i-disk__granica" x1={C} y1={C} x2={x1} y2={y1} />
        <circle className="m4i-disk__ruchka" cx={x1} cy={y1} r={11} />
      </svg>
      <label className="m4i-disk__polzunok">
        <span className="sr-only">{INTERAKTIV.diskPolzunok}</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={p}
          aria-valuetext={`P(A) = ${pa}`}
          onChange={(e) => setP(Number(e.target.value))}
        />
      </label>
      <div className="m4i-itog m4i-mat" aria-live="polite">
        <span className="m4i-disk__a">
          <Html html={tex.pa} /> <span className="m4i-chislo">{pa}</span>
        </span>
        <span className="m4i-disk__na">
          <Html html={tex.pna} /> <span className="m4i-chislo">{pa}</span> <Html html={tex.ravno} />{' '}
          <span className="m4i-chislo">{pna}</span>
        </span>
      </div>
    </div>
  );
}
