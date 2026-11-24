'use client';

import { useState } from 'react';
import {
  BOLSHE_K_5,
  GRANI_5,
  SUMMY_5,
  ZAPRETY_5,
  nod,
  paraOstalas,
  popytokDoUspeha,
  ruDrob,
  type Zapret5,
} from '@/lib/veroyatnost/metody5-interaktiv';

/**
 * Интерактивы глав ключевых методов задания №5 («Попробуйте сами»).
 *
 * Как у №4 (Interaktivy4): обозначения вроде «P(A∪B)=» набраны KaTeX
 * на сервере (GlavaMetoda5) и приходят готовой вёрсткой, а меняющиеся
 * числа пишутся обычным текстом тем же шрифтом — KaTeX в браузер не
 * уезжает. Таблица костей — дроби для каждого состояния, тоже с сервера.
 *
 * Вероятности считаются в целых долях (lib/veroyatnost/metody5-interaktiv.ts),
 * поэтому на экране точные десятичные дроби без хвостов.
 */

const INTERAKTIV = {
  sbros: 'Сбросить',
  kletka: (i: number, chto: string) => `Клетка ${i}: ${chto}`,
  kletkaChto: ['без отметки', 'событие A', 'событие B', 'оба события'] as const,
  polosa: 'Полоса из 20 равновозможных исходов',
  dvazhdy: (s: string) => `Без вычитания вышло бы ${s}: общие клетки посчитаны дважды`,
  porogA: 'Порог a',
  porogB: 'Порог b',
  pryamaya: 'Числовая прямая: число решённых задач от 0 до 10',
  zapret: 'Условие',
  zapretNazv: (z: Zapret5) => (z === 0 ? 'Без условия' : `${z} не выпала ни разу`),
  summa: 'Сумма очков',
  kostiPodpis: (m: number, n: number) => `Подходит клеток: ${m} из ${n} оставшихся`,
  kostiPervaya: 'Первая кость',
  kostiVtoraya: 'Вторая кость',
  popadanie: 'Вероятность попадания',
  mishen: (i: number, da: boolean) => `Мишень ${i}: ${da ? 'попал' : 'промахнулся'}`,
  popal: 'попал',
  mimo: 'мимо',
  svetilnikov: 'Светильников',
  pogasnet: 'Вероятность, что один погаснет',
  sinih: 'Синих',
  krasnyh: 'Красных',
  prochih: 'Прочих',
  menshe: 'Меньше',
  bolshe: 'Больше',
  poryadok1: 'синий, затем красный',
  poryadok2: 'красный, затем синий',
  vetka: (s: string) => s,
  derevoH: 'Первая развилка, P(H₁)',
  derevoA1: 'Ветка A после H₁',
  derevoA2: 'Ветка A после H₂',
  porog: 'Порог',
  popytok: 'Попыток',
  uspeh: 'Вероятность успеха',
  hvataet: 'хватает',
  malo: 'мало',
} as const;

function Html({ html, className }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Chislo({ children }: { children: string }) {
  return <span className="m4i-chislo">{children}</span>;
}

/** Набор кнопок-фишек: один выбранный вариант. */
function Fishki<T extends string | number>({
  podpis,
  varianty,
  znachenie,
  nazvanie,
  onVybor,
}: {
  podpis: string;
  varianty: readonly T[];
  znachenie: T;
  nazvanie: (v: T) => string;
  onVybor: (v: T) => void;
}) {
  return (
    <div className="m5i-ryad">
      <span className="m5i-ryad__podpis">{podpis}</span>
      <div className="m4i-vybor" role="radiogroup" aria-label={podpis}>
        {varianty.map((v) => (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={v === znachenie}
            className={v === znachenie ? 'm4i-chip is-on' : 'm4i-chip'}
            onClick={() => onVybor(v)}
          >
            {nazvanie(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Ползунок с подписью и значением справа. */
function Polzunok({
  podpis,
  min,
  max,
  shag,
  znachenie,
  tekst,
  onChange,
}: {
  podpis: string;
  min: number;
  max: number;
  shag: number;
  znachenie: number;
  tekst: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="m5i-polzunok">
      <span className="m5i-ryad__podpis">{podpis}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={shag}
        value={znachenie}
        aria-valuetext={tekst}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <Chislo>{tekst}</Chislo>
    </label>
  );
}

/** Доля в сотых — десятичной записью: 35 → «0,35». */
const sotye = (k: number) => ruDrob(k, 2);

/* ── 1 и 4. Полоса исходов ─────────────────────────────────────────── */

/** Обозначения полосы, набранные KaTeX: P(A)=, P(B)=, P(A∩B)=, P(A∪B)=. */
export interface PolosaTex {
  pa: string;
  pb: string;
  pab: string;
  pu: string;
}

const KLETOK = 20;
const NACHALO_1 = [1, 1, 1, 1, 1, 1, 1, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0];
const NACHALO_4 = [1, 1, 1, 1, 1, 3, 3, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export function Polosa5({ obshchie, tex }: { obshchie: boolean; tex: PolosaTex }) {
  const [kletki, setKletki] = useState<number[]>(() => [...(obshchie ? NACHALO_4 : NACHALO_1)]);
  const sostoyaniy = obshchie ? 4 : 3;
  const a = kletki.filter((k) => k === 1 || k === 3).length;
  const b = kletki.filter((k) => k === 2 || k === 3).length;
  const ab = kletki.filter((k) => k === 3).length;
  /* Одна клетка — 1/20 = 5 сотых. */
  const pa = sotye(a * 5);
  const pb = sotye(b * 5);
  const pab = sotye(ab * 5);
  const pu = sotye((a + b - ab) * 5);
  return (
    <div className="m4i m5i-polosa">
      <div className="m5i-polosa__ryad" role="group" aria-label={INTERAKTIV.polosa}>
        {kletki.map((k, i) => (
          <button
            key={i}
            type="button"
            className={`m5i-kletka m5i-kletka--${k}`}
            aria-label={INTERAKTIV.kletka(i + 1, INTERAKTIV.kletkaChto[k] ?? '')}
            onClick={() =>
              setKletki((prev) => prev.map((x, j) => (j === i ? (x + 1) % sostoyaniy : x)))
            }
          />
        ))}
      </div>
      <div className="m4i-itog m4i-mat" aria-live="polite">
        <span>
          <Html html={tex.pa} /> <Chislo>{pa}</Chislo>
        </span>
        <span>
          <Html html={tex.pb} /> <Chislo>{pb}</Chislo>
        </span>
        {obshchie ? (
          <span>
            <Html html={tex.pab} /> <Chislo>{pab}</Chislo>
          </span>
        ) : null}
      </div>
      <div className="m4i-itog m4i-mat">
        <span>
          <Html html={tex.pu} />{' '}
          <Chislo>{obshchie ? `${pa} + ${pb} − ${pab} = ${pu}` : `${pa} + ${pb} = ${pu}`}</Chislo>
        </span>
      </div>
      {obshchie && ab > 0 ? (
        <p className="m4i-itog__podpis">{INTERAKTIV.dvazhdy(sotye((a + b) * 5))}</p>
      ) : null}
      <button
        type="button"
        className="btn btn--secondary btn--sm"
        onClick={() => setKletki(new Array<number>(KLETOK).fill(0))}
      >
        {INTERAKTIV.sbros}
      </button>
    </div>
  );
}

/* ── 3. Числовая прямая ────────────────────────────────────────────── */

export interface PryamayaTex {
  /** P(X>a)= */
  pa: string;
  /** P(X>b)= */
  pb: string;
  /** P(a<X\le b)= */
  pab: string;
}

export function Pryamaya5({ tex }: { tex: PryamayaTex }) {
  const [a, setA] = useState(3);
  const [b, setB] = useState(6);
  const x = (k: number) => 20 + k * 30;
  const pa = BOLSHE_K_5[a] ?? 0;
  const pb = BOLSHE_K_5[b] ?? 0;
  return (
    <div className="m4i m5i-pryamaya">
      <svg
        className="m5i-pryamaya__svg"
        viewBox="0 0 340 92"
        role="img"
        aria-label={INTERAKTIV.pryamaya}
      >
        <line className="m5i-pryamaya__os" x1={10} y1={60} x2={332} y2={60} />
        <line
          className="m5i-pryamaya__luch m5i-pryamaya__luch--a"
          x1={x(a)}
          y1={30}
          x2={x(10)}
          y2={30}
        />
        <line
          className="m5i-pryamaya__luch m5i-pryamaya__luch--b"
          x1={x(b)}
          y1={42}
          x2={x(10)}
          y2={42}
        />
        <rect
          className="m5i-pryamaya__otrezok"
          x={x(a)}
          y={54}
          width={x(b) - x(a)}
          height={12}
          rx={4}
        />
        {Array.from({ length: 11 }, (_, k) => (
          <g key={k}>
            <line className="m5i-pryamaya__shtrih" x1={x(k)} y1={55} x2={x(k)} y2={65} />
            <text className="m5i-pryamaya__chislo" x={x(k)} y={84}>
              {k}
            </text>
          </g>
        ))}
        <text className="m5i-pryamaya__bukva" x={x(a)} y={22}>
          a
        </text>
        <text className="m5i-pryamaya__bukva" x={x(b)} y={22}>
          b
        </text>
      </svg>
      <Polzunok
        podpis={INTERAKTIV.porogA}
        min={0}
        max={9}
        shag={1}
        znachenie={a}
        tekst={String(a)}
        onChange={(v) => {
          setA(v);
          if (b <= v) setB(v + 1);
        }}
      />
      <Polzunok
        podpis={INTERAKTIV.porogB}
        min={1}
        max={10}
        shag={1}
        znachenie={b}
        tekst={String(b)}
        onChange={(v) => {
          setB(v);
          if (a >= v) setA(v - 1);
        }}
      />
      <div className="m4i-itog m4i-mat" aria-live="polite">
        <span>
          <Html html={tex.pa} /> <Chislo>{sotye(pa)}</Chislo>
        </span>
        <span>
          <Html html={tex.pb} /> <Chislo>{sotye(pb)}</Chislo>
        </span>
      </div>
      <div className="m4i-itog m4i-mat">
        <span>
          <Html html={tex.pab} />{' '}
          <Chislo>{`${sotye(pa)} − ${sotye(pb)} = ${sotye(pa - pb)}`}</Chislo>
        </span>
      </div>
    </div>
  );
}

/* ── 5. Таблица костей при условии ─────────────────────────────────── */

/** Дроби для всех состояний: ключ `${запрет}-${сумма}`. */
export function Kosti5({ formuly }: { formuly: Record<string, string> }) {
  const [zapret, setZapret] = useState<Zapret5>(6);
  const [summa, setSumma] = useState(7);
  let m = 0;
  let n = 0;
  for (const a of GRANI_5) {
    for (const b of GRANI_5) {
      if (!paraOstalas(zapret, a, b)) continue;
      n += 1;
      if (a + b === summa) m += 1;
    }
  }
  return (
    <div className="m4i m4i-kosti">
      <Fishki
        podpis={INTERAKTIV.zapret}
        varianty={ZAPRETY_5}
        znachenie={zapret}
        nazvanie={INTERAKTIV.zapretNazv}
        onVybor={setZapret}
      />
      <Fishki
        podpis={INTERAKTIV.summa}
        varianty={SUMMY_5}
        znachenie={summa}
        nazvanie={String}
        onVybor={setSumma}
      />
      <div className="m4i-kosti__ramka">
        <table className="m4i-tablica">
          <caption className="sr-only">{INTERAKTIV.kostiPodpis(m, n)}</caption>
          <thead>
            <tr>
              <th scope="col" className="m4i-tablica__ugol">
                <span aria-hidden="true">1-я \ 2-я</span>
                <span className="sr-only">
                  {INTERAKTIV.kostiPervaya} / {INTERAKTIV.kostiVtoraya}
                </span>
              </th>
              {GRANI_5.map((b) => (
                <th scope="col" key={b}>
                  {b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GRANI_5.map((a) => (
              <tr key={a}>
                <th scope="row">{a}</th>
                {GRANI_5.map((b) => {
                  const ostalas = paraOstalas(zapret, a, b);
                  const klass = !ostalas
                    ? 'm5i-vycherknuta'
                    : a + b === summa
                      ? 'is-da'
                      : undefined;
                  return (
                    <td key={b} className={klass}>
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
        <span className="m4i-itog__podpis">{INTERAKTIV.kostiPodpis(m, n)}</span>
        <Html className="m4i-itog__formula" html={formuly[`${zapret}-${summa}`] ?? ''} />
      </div>
    </div>
  );
}

/* ── 6. Выстрелы по мишеням ────────────────────────────────────────── */

export function Vystrely5({ tex }: { tex: { p: string } }) {
  const [p, setP] = useState(9);
  const [put, setPut] = useState([true, true, true, false]);
  /* Вероятности в десятых: попадание p, промах 10 − p. */
  const mnozhiteli = put.map((da) => (da ? p : 10 - p));
  const proizv = mnozhiteli.reduce((s, k) => s * k, 1);
  return (
    <div className="m4i m5i-vystrely">
      <Fishki
        podpis={INTERAKTIV.popadanie}
        varianty={[5, 6, 7, 8, 9] as const}
        znachenie={p as 5 | 6 | 7 | 8 | 9}
        nazvanie={(v) => ruDrob(v, 1)}
        onVybor={setP}
      />
      <div className="m5i-misheni">
        {put.map((da, i) => (
          <button
            key={i}
            type="button"
            className={da ? 'm5i-mishen is-da' : 'm5i-mishen'}
            aria-pressed={da}
            aria-label={INTERAKTIV.mishen(i + 1, da)}
            onClick={() => setPut((prev) => prev.map((x, j) => (j === i ? !x : x)))}
          >
            <span className="m5i-mishen__krug" aria-hidden="true" />
            <span className="m5i-mishen__podpis">{da ? INTERAKTIV.popal : INTERAKTIV.mimo}</span>
            <Chislo>{ruDrob(mnozhiteli[i] ?? 0, 1)}</Chislo>
          </button>
        ))}
      </div>
      <div className="m4i-itog m4i-mat" aria-live="polite">
        <span>
          <Html html={tex.p} />{' '}
          <Chislo>{`${mnozhiteli.map((k) => ruDrob(k, 1)).join(' · ')} = ${ruDrob(proizv, 4)}`}</Chislo>
        </span>
      </div>
    </div>
  );
}

/* ── 7. Светильники: «хотя бы один» ────────────────────────────────── */

export interface LampyTex {
  /** P(\text{все погасли})= */
  vse: string;
  /** P(\text{хотя бы один горит})=1- */
  hotyaBy: string;
  ravno: string;
}

export function Lampy5({ tex }: { tex: LampyTex }) {
  const [n, setN] = useState(3);
  const [q, setQ] = useState(2);
  const vse = q ** n;
  return (
    <div className="m4i m5i-lampy">
      <Fishki
        podpis={INTERAKTIV.svetilnikov}
        varianty={[1, 2, 3, 4, 5] as const}
        znachenie={n as 1 | 2 | 3 | 4 | 5}
        nazvanie={String}
        onVybor={setN}
      />
      <Fishki
        podpis={INTERAKTIV.pogasnet}
        varianty={[1, 2, 3, 4, 5] as const}
        znachenie={q as 1 | 2 | 3 | 4 | 5}
        nazvanie={(v) => ruDrob(v, 1)}
        onVybor={setQ}
      />
      <div className="m5i-lampy__ryad" aria-hidden="true">
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className="m5i-lampa" />
        ))}
      </div>
      <div className="m4i-itog m4i-mat" aria-live="polite">
        <span>
          <Html html={tex.vse} />{' '}
          <Chislo>{`${Array.from({ length: n }, () => ruDrob(q, 1)).join(' · ')} = ${ruDrob(vse, n)}`}</Chislo>
        </span>
      </div>
      <div className="m4i-itog m4i-mat">
        <span>
          <Html html={tex.hotyaBy} /> <Chislo>{ruDrob(vse, n)}</Chislo> <Html html={tex.ravno} />{' '}
          <Chislo>{ruDrob(10 ** n - vse, n)}</Chislo>
        </span>
      </div>
    </div>
  );
}

/* ── 8. Два предмета без возвращения ───────────────────────────────── */

function Drob({ ch, zn }: { ch: number | string; zn: number | string }) {
  return (
    <span className="m5i-drob">
      <span className="m5i-drob__ch">{ch}</span>
      <span className="m5i-drob__zn">{zn}</span>
    </span>
  );
}

function Schetchik({
  podpis,
  znachenie,
  min,
  max,
  onChange,
}: {
  podpis: string;
  znachenie: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="m5i-schetchik" role="group" aria-label={podpis}>
      <span className="m5i-ryad__podpis">{podpis}</span>
      <button
        type="button"
        className="m4i-chip"
        aria-label={`${podpis}: ${INTERAKTIV.menshe}`}
        disabled={znachenie <= min}
        onClick={() => onChange(znachenie - 1)}
      >
        −
      </button>
      <Chislo>{String(znachenie)}</Chislo>
      <button
        type="button"
        className="m4i-chip"
        aria-label={`${podpis}: ${INTERAKTIV.bolshe}`}
        disabled={znachenie >= max}
        onClick={() => onChange(znachenie + 1)}
      >
        +
      </button>
    </div>
  );
}

/** Десятичная запись дроби m/n, если она конечная, иначе ≈ до сотых. */
function desyatichnaya(m: number, n: number): string {
  const d = nod(m, n);
  let zn = n / d;
  for (const p of [2, 5]) while (zn % p === 0) zn /= p;
  if (zn === 1) {
    for (let r = 0; r <= 8; r += 1) {
      const ch = (m * 10 ** r) / n;
      if (Number.isInteger(ch)) return ruDrob(ch, r);
    }
  }
  return `≈ ${ruDrob(Math.round((m / n) * 100), 2)}`;
}

export function Para5({ tex }: { tex: { p: string } }) {
  const [a, setA] = useState(3);
  const [b, setB] = useState(3);
  const [c, setC] = useState(4);
  const N = a + b + c;
  const ch = 2 * a * b;
  const zn = N * (N - 1);
  const d = nod(ch, zn);
  return (
    <div className="m4i m5i-para">
      <div className="m5i-para__schet">
        <Schetchik podpis={INTERAKTIV.sinih} znachenie={a} min={1} max={6} onChange={setA} />
        <Schetchik podpis={INTERAKTIV.krasnyh} znachenie={b} min={1} max={6} onChange={setB} />
        <Schetchik podpis={INTERAKTIV.prochih} znachenie={c} min={0} max={6} onChange={setC} />
      </div>
      <div className="m5i-para__nabor" aria-hidden="true">
        {Array.from({ length: a }, (_, i) => (
          <span key={`a${i}`} className="m5i-shar m5i-shar--a" />
        ))}
        {Array.from({ length: b }, (_, i) => (
          <span key={`b${i}`} className="m5i-shar m5i-shar--b" />
        ))}
        {Array.from({ length: c }, (_, i) => (
          <span key={`c${i}`} className="m5i-shar" />
        ))}
      </div>
      <div className="m5i-para__poryadki m4i-mat">
        <span>
          <span className="m5i-ryad__podpis">{INTERAKTIV.poryadok1}</span>
          <Drob ch={a} zn={N} /> · <Drob ch={b} zn={N - 1} />
        </span>
        <span>
          <span className="m5i-ryad__podpis">{INTERAKTIV.poryadok2}</span>
          <Drob ch={b} zn={N} /> · <Drob ch={a} zn={N - 1} />
        </span>
      </div>
      <div className="m4i-itog m4i-mat" aria-live="polite">
        <Html html={tex.p} />
        <span className="m4i-chislo">
          2 · <Drob ch={a} zn={N} /> · <Drob ch={b} zn={N - 1} /> = <Drob ch={ch} zn={zn} />
          {d > 1 ? (
            <>
              {' '}
              = <Drob ch={ch / d} zn={zn / d} />
            </>
          ) : null}{' '}
          {desyatichnaya(ch, zn).startsWith('≈') ? '' : '= '}
          {desyatichnaya(ch, zn)}
        </span>
      </div>
    </div>
  );
}

/* ── 9. Дерево полной вероятности ──────────────────────────────────── */

/** Ветки вертикального дерева: корень сверху, листья внизу. */
const VETKI_5 = [
  { id: 'h1', x1: 160, y1: 22, x2: 80, y2: 104, a: false },
  { id: 'h2', x1: 160, y1: 22, x2: 240, y2: 104, a: false },
  { id: 'a1', x1: 80, y1: 104, x2: 40, y2: 186, a: true },
  { id: 'n1', x1: 80, y1: 104, x2: 120, y2: 186, a: false },
  { id: 'a2', x1: 240, y1: 104, x2: 200, y2: 186, a: true },
  { id: 'n2', x1: 240, y1: 104, x2: 280, y2: 186, a: false },
] as const;

export function Derevo5({ tex }: { tex: { p: string } }) {
  /* Вероятности в сотых. */
  const [h, setH] = useState(40);
  const [q1, setQ1] = useState(50);
  const [q2, setQ2] = useState(20);
  const put1 = h * q1;
  const put2 = (100 - h) * q2;
  /* Толщина ветки — по её вероятности. */
  const tolsh = (p: number) => 1.5 + (p / 100) * 9;
  const ves: Record<(typeof VETKI_5)[number]['id'], number> = {
    h1: h,
    h2: 100 - h,
    a1: q1,
    n1: 100 - q1,
    a2: q2,
    n2: 100 - q2,
  };
  return (
    <div className="m4i m5i-derevo">
      {/* Дерево растёт сверху вниз: корень — опыт, первый уровень — случаи
          H₁ и H₂, второй — произошло A или нет. */}
      <svg className="m5i-derevo__svg" viewBox="0 0 320 228" aria-hidden="true">
        {VETKI_5.map((v) => (
          <line
            key={v.id}
            className={v.a ? 'm5i-vetka m5i-vetka--a' : 'm5i-vetka'}
            x1={v.x1}
            y1={v.y1}
            x2={v.x2}
            y2={v.y2}
            strokeWidth={tolsh(ves[v.id])}
          />
        ))}
        <circle className="m5i-uzel" cx={160} cy={22} r={7} />
        <circle className="m5i-uzel" cx={80} cy={104} r={7} />
        <circle className="m5i-uzel" cx={240} cy={104} r={7} />
        <circle className="m5i-uzel m5i-uzel--a" cx={40} cy={186} r={8} />
        <circle className="m5i-uzel" cx={120} cy={186} r={6} />
        <circle className="m5i-uzel m5i-uzel--a" cx={200} cy={186} r={8} />
        <circle className="m5i-uzel" cx={280} cy={186} r={6} />
        <text className="m5i-derevo__tekst" x={104} y={58}>
          {sotye(h)}
        </text>
        <text className="m5i-derevo__tekst" x={216} y={58}>
          {sotye(100 - h)}
        </text>
        <text className="m5i-derevo__tekst m5i-derevo__tekst--a" x={58} y={104}>
          H₁
        </text>
        <text className="m5i-derevo__tekst m5i-derevo__tekst--a" x={262} y={104}>
          H₂
        </text>
        <text className="m5i-derevo__tekst" x={42} y={146}>
          {sotye(q1)}
        </text>
        <text className="m5i-derevo__tekst" x={198} y={146}>
          {sotye(q2)}
        </text>
        <text className="m5i-derevo__tekst m5i-derevo__tekst--a" x={40} y={214}>
          A
        </text>
        <text className="m5i-derevo__tekst m5i-derevo__tekst--ne" x={120} y={214}>
          A
        </text>
        <text className="m5i-derevo__tekst m5i-derevo__tekst--a" x={200} y={214}>
          A
        </text>
        <text className="m5i-derevo__tekst m5i-derevo__tekst--ne" x={280} y={214}>
          A
        </text>
      </svg>
      <Polzunok
        podpis={INTERAKTIV.derevoH}
        min={0}
        max={100}
        shag={5}
        znachenie={h}
        tekst={sotye(h)}
        onChange={setH}
      />
      <Polzunok
        podpis={INTERAKTIV.derevoA1}
        min={0}
        max={100}
        shag={5}
        znachenie={q1}
        tekst={sotye(q1)}
        onChange={setQ1}
      />
      <Polzunok
        podpis={INTERAKTIV.derevoA2}
        min={0}
        max={100}
        shag={5}
        znachenie={q2}
        tekst={sotye(q2)}
        onChange={setQ2}
      />
      <div className="m4i-itog m4i-mat" aria-live="polite">
        <span>
          <Html html={tex.p} />{' '}
          <Chislo>
            {`${sotye(h)} · ${sotye(q1)} + ${sotye(100 - h)} · ${sotye(q2)} = ${ruDrob(put1, 4)} + ${ruDrob(put2, 4)} = ${ruDrob(put1 + put2, 4)}`}
          </Chislo>
        </span>
      </div>
    </div>
  );
}

/* ── 10. До первой удачи ───────────────────────────────────────────── */

const POROGI = [80, 90, 95, 99] as const;
const POPADANIYA = [20, 30, 40, 50, 60, 70, 80] as const;

export function DoUspeha5() {
  const [p, setP] = useState<(typeof POPADANIYA)[number]>(60);
  const [porog, setPorog] = useState<(typeof POROGI)[number]>(90);
  const q = 100 - p;
  const otvet = popytokDoUspeha(q, porog);
  /* Строки: все до ответа; если их много — начало, многоточие, конец. */
  const vse = Array.from({ length: otvet }, (_, i) => i + 1);
  const stroki = otvet <= 7 ? vse : [1, 2, 3, 0, otvet - 2, otvet - 1, otvet];
  return (
    <div className="m4i m5i-uspeh">
      <Fishki
        podpis={INTERAKTIV.popadanie}
        varianty={POPADANIYA}
        znachenie={p}
        nazvanie={sotye}
        onVybor={setP}
      />
      <Fishki
        podpis={INTERAKTIV.porog}
        varianty={POROGI}
        znachenie={porog}
        nazvanie={sotye}
        onVybor={setPorog}
      />
      <table className="m4i-tablica m5i-uspeh__tablica">
        <thead>
          <tr>
            <th scope="col">{INTERAKTIV.popytok}</th>
            <th scope="col">{INTERAKTIV.uspeh}</th>
            <th scope="col">
              <span className="sr-only">{INTERAKTIV.porog}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {stroki.map((n, i) => {
            if (n === 0) {
              return (
                <tr key={`t${i}`}>
                  <td colSpan={3}>…</td>
                </tr>
              );
            }
            const uspeh = 1 - (q / 100) ** n;
            const tochno = n <= 3;
            const zapis = tochno
              ? ruDrob(100 ** n - q ** n, 2 * n)
              : `≈ ${ruDrob(Math.floor(uspeh * 10000), 4)}`;
            const da = n === otvet;
            return (
              <tr key={n} className={da ? 'is-da' : undefined}>
                <th scope="row">{n}</th>
                <td>
                  <Chislo>{zapis}</Chislo>
                </td>
                <td>{da ? INTERAKTIV.hvataet : INTERAKTIV.malo}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="m4i-itog m4i-mat" aria-live="polite">
        <Chislo>{`n = ${otvet}`}</Chislo>
      </p>
    </div>
  );
}
