/**
 * «Заполни таблицу» для задач «таблица руками» (P-01…P-03). Строки —
 * периоды, столбцы — величины, как во всей теории:
 *  дифференцированный — Долг на начало · Сумма изменения долга ·
 *    Переплата · Долг на конец (S | S/n | r/100 · S | (n−1)S/n);
 *  аннуитет — Долг на начало · Долг после начисления · Платёж · Долг на
 *    конец (S | Sk | x₁ | Sk − x₁);
 *  вклад — Вклад на начало · После начисления · Пополнение / снятие ·
 *    Вклад на конец.
 * Ученик заполняет буквами (срок n — число из условия). Проверка — по
 * смыслу: подстановкой в точках (vyrazhenie.ts), S/7 и (1/7)·S равны.
 * Типичные ошибки узнаются и называются.
 *
 * Четыре уровня: 1 — выбрать верную таблицу из трёх, 2 — выбрать
 * выражение в пустых клетках, 3 — вписать ключевые клетки, 4 — вся
 * таблица. Верные записи закрыты sealText, проверка — по отпечаткам.
 * Модуль изоморфный: собирается на сборке и в браузере по «Ещё вариант».
 */

import { katex } from '../graph/katex';
import { D } from './drob';
import { rng13 } from './rng';
import { sealChoice, sealText } from './secret';
import { TABLE_HEAD } from './tablica';
import type { Task13 } from './types';
import {
  izZapisi,
  sealVyrazhenie,
  tochkiZadachi,
  type Bukva,
  type Tochka,
  type TochkaZapis,
} from './vyrazhenie';

/* ── Что уходит в браузер ───────────────────────────────────────── */

export interface OshibkaZapolni13 {
  seal: string;
  msg: string;
}

export interface KletkaZapolni13 {
  id: string;
  /** Дано в условии: открытая разметка (KaTeX). */
  dano: string | null;
  /** Верная запись — разметка KaTeX, закрытая sealText (показ, где клетка заполнена). */
  html: string;
  /** Отпечаток значений верного выражения в точках. */
  seal: string;
  oshibki: OshibkaZapolni13[];
  /** Уровень 2: варианты выражений (закрыты) и отпечаток номера верного. */
  varianty: string[];
  vernyy: string;
  /** В верной записи есть буквы: ответ числом — подсказка писать буквами. */
  bukvy: boolean;
}

export interface StrokaZapolni13 {
  label: string;
  kletki: KletkaZapolni13[];
}

export interface TablitsaZapolni13 {
  /** Ключ sealText и отпечатков выбора: id задачи. */
  kluch: string;
  /** «Месяц», «Год». */
  period: string;
  stolbcy: { title: string; podskazka: string }[];
  stroki: StrokaZapolni13[];
  /** «Итого»: сумма переплат или платежей — в столбце stolbec. */
  itog: { stolbec: number; kletka: KletkaZapolni13 } | null;
  tochki: TochkaZapis[];
  /** Буквы на экранной клавиатуре. */
  klavishi: Bukva[];
  /** Уровень 1: три таблицы (разметка закрыта), отпечаток номера верной. */
  uroven1: { tablitsy: string[]; vernyy: string };
  /** Пустые клетки уровней 2 и 3 (id); в уровне 4 пусто всё, кроме данного. */
  uroven2: string[];
  uroven3: string[];
  /** Формула ответа в буквах — после таблицы. */
  formula: { seal: string; oshibki: OshibkaZapolni13[]; bukvy: boolean };
}

/* ── Выражения: запись для подсчёта и TeX ───────────────────────── */

interface V {
  z: string;
  t: string;
}

interface Oshibka {
  v: V;
  msg: string;
}

const v = (z: string, t: string): V => ({ z, t });

/** m·S/d: «S», «S/7», «6S/7», «0». */
function chast(m: number, d: number): V {
  if (m === d) return v('S', 'S');
  if (m === 0) return v('0', '0');
  const zn = m < 0 ? '-' : '';
  const a = Math.abs(m);
  return a === 1
    ? v(`${zn}S/${d}`, `${zn}\\dfrac{S}{${d}}`)
    : v(`${zn}${a}*S/${d}`, `${zn}\\dfrac{${a}S}{${d}}`);
}

const procent = (x: V): V => v(`r/100*(${x.z})`, `\\dfrac{r}{100}\\cdot ${x.t}`);
const raznost = (a: V, b: V): V =>
  v(`(${a.z})-(${b.z})`, `${a.t} - ${b.t.startsWith('-') ? `(${b.t})` : b.t}`);

/** Член многочлена по k: ±(буква)·k^st. */
interface Chlen {
  znak: 1 | -1;
  b: string;
  tex: string;
  st: number;
}

const kTex = (st: number) => (st === 0 ? '' : st === 1 ? 'k' : `k^{${st}}`);

function mnogochlen(ch: readonly Chlen[]): V {
  if (ch.length === 0) return v('0', '0');
  const z = ch
    .map((c, j) => `${c.znak < 0 ? '-' : j ? '+' : ''}${c.b}${c.st ? `*k^${c.st}` : ''}`)
    .join(' ');
  const t = ch
    .map((c, j) => {
      const telo = `${c.tex}${kTex(c.st)}`;
      if (j === 0) return c.znak < 0 ? `-${telo}` : telo;
      return ` ${c.znak < 0 ? '-' : '+'} ${telo}`;
    })
    .join('');
  return v(z, t);
}

const naK = (ch: readonly Chlen[]): Chlen[] => ch.map((c) => ({ ...c, st: c.st + 1 }));

/* ── Сообщения о типичных ошибках ───────────────────────────────── */

type Soobshcheniya = ReturnType<typeof soobshcheniya>;

function soobshcheniya(period: 'month' | 'year', n: number) {
  const pg = period === 'month' ? 'месяца' : 'года';
  return {
    n1: `Делите на ${n - 1}, а нужно на ${n} — на число ${period === 'month' ? 'месяцев' : 'лет'}.`,
    r: 'Записано $r\\cdot$ долг: проценты — это $\\dfrac{r}{100}$ от долга, а не $r$.',
    konec: `Проценты начисляются на долг на начало ${pg}, а не на конец.`,
    vesKredit: `Проценты — от долга на начало этого ${pg}, а не от всей суммы кредита.`,
    pred: 'Сумма на начало — это сумма на конец предыдущей строки.',
    pereplata:
      'Долг на конец $=$ долг на начало $-$ сумма изменения долга; переплата сюда не входит.',
    k: 'Забыли умножить на $k$: после начисления процентов сумма увеличивается в $k$ раз.',
    tolkoProc:
      'Это только начисленные проценты; после начисления $=$ сумма на начало $\\cdot\\,k$.',
    znak: 'Платёж уменьшает долг — его вычитают.',
    znakVklad: 'Пополнение прибавляют, снятие вычитают — проверьте знак.',
    naR: 'Умножать нужно на $k = 1 + \\dfrac{r}{100}$, а не на $r$.',
    bezPlatezha: 'Платёж ещё не вычли: долг на конец $=$ после начисления $-$ платёж.',
    bezOp: 'Не учли пополнение или снятие этого года.',
    predNachalo: 'Это сумма на начало прошлой строки, а нужна сумма на её конец.',
    bezS: 'Всего вернуть $=$ кредит $+$ переплата: не забудьте $S$.',
    summa: 'Сложите все строки столбца.',
    platezh: 'Платёж $=$ сумма изменения долга $+$ переплата.',
  };
}

/* ── Таблицы по схемам ──────────────────────────────────────────── */

interface Kl {
  v: V;
  dano: boolean;
  oshibki: Oshibka[];
}

interface Model {
  stroki: Kl[][];
  itog: { stolbec: number; kl: Kl } | null;
  /** Платёж периода — для формулы ответа «платёж m-го месяца». */
  platezh: Kl[];
}

type Variant = 'verno' | 'osh1' | 'osh2';

/** Дифференцированный платёж: osh1 — делим на n − 1, osh2 — проценты на долг на конец. */
function difModel(n: number, variant: Variant, M: Soobshcheniya): Model {
  const dn = variant === 'osh1' ? n - 1 : n;
  const stroki: Kl[][] = [];
  const platezh: Kl[] = [];
  const starty: V[] = [];
  const pereplaty: V[] = [];
  for (let i = 1; i <= n; i++) {
    const s = chast(dn - (i - 1), dn);
    const izm = chast(1, dn);
    const e = chast(dn - i, dn);
    const p = variant === 'osh2' ? procent(e) : procent(s);
    starty.push(s);
    pereplaty.push(p);
    platezh.push({
      v: v(`(${izm.z})+(${p.z})`, `${izm.t} + ${p.t}`),
      dano: false,
      oshibki: [{ v: p, msg: M.platezh }],
    });
    stroki.push([
      {
        v: s,
        dano: false,
        oshibki:
          i === 1
            ? []
            : [
                { v: chast(n - i + 2, n), msg: M.pred },
                { v: chast(n - i + 1, n - 1), msg: M.n1 },
              ],
      },
      { v: izm, dano: false, oshibki: [{ v: chast(1, n - 1), msg: M.n1 }] },
      {
        v: p,
        dano: false,
        oshibki: [
          { v: v(`r*(${s.z})`, `r\\cdot ${s.t}`), msg: M.r },
          { v: procent(e), msg: M.konec },
          ...(i > 1 ? [{ v: procent(v('S', 'S')), msg: M.vesKredit }] : []),
        ],
      },
      {
        v: e,
        dano: false,
        oshibki: [
          { v: raznost(s, chast(1, n - 1)), msg: M.n1 },
          { v: raznost(s, p), msg: M.pereplata },
        ],
      },
    ]);
  }
  const sumZ = pereplaty.map((p) => `(${p.z})`).join('+');
  const sumT = `\\dfrac{r}{100}\\cdot\\left(${starty.map((s) => s.t).join(' + ')}\\right)`;
  return {
    stroki,
    itog: {
      stolbec: 2,
      kl: {
        v: v(sumZ, sumT),
        dano: false,
        oshibki: [
          { v: v(`r*S*${n + 1}/2`, ''), msg: M.r },
          { v: v(`r/100*S*${n}/2`, ''), msg: M.summa },
        ],
      },
    },
    platezh,
  };
}

/**
 * Аннуитет «известны платежи» (P-02): платежи x₁…x_{n−1} даны, последний
 * гасит весь долг. osh1 — забыли умножить на k, osh2 — долг на конец
 * считают от долга на начало.
 */
function annModel(n: number, variant: Variant, M: Soobshcheniya): Model {
  const x = (i: number): Chlen => ({ znak: -1, b: `x${'₀₁₂₃₄'[i]}`, tex: `x_{${i}}`, st: 0 });
  const stroki: Kl[][] = [];
  const platezhi: V[] = [];
  let predPosle: V | null = null;
  let predStart: V | null = null;
  let tek: Chlen[] = [{ znak: 1, b: 'S', tex: 'S', st: 0 }];
  for (let i = 1; i <= n; i++) {
    const s = mnogochlen(tek);
    const posleCh = variant === 'osh1' ? tek : naK(tek);
    const posle = mnogochlen(posleCh);
    const posl = i === n;
    const pl: V = posl ? posle : v(x(i).b, x(i).tex);
    const konecCh = posl ? [] : [...(variant === 'osh2' ? tek : posleCh), x(i)];
    platezhi.push(pl);
    stroki.push([
      {
        v: s,
        dano: false,
        oshibki: [
          ...(predPosle ? [{ v: predPosle, msg: M.pred }] : []),
          ...(predStart ? [{ v: predStart, msg: M.predNachalo }] : []),
        ],
      },
      {
        v: posle,
        dano: false,
        oshibki: [
          { v: s, msg: M.k },
          {
            v: v(`(${s.z})*r/100`, `${s.t.includes(' ') ? `(${s.t})` : s.t}\cdot\dfrac{r}{100}`),
            msg: M.tolkoProc,
          },
          { v: v(`(${s.z})*r`, `${s.t.includes(' ') ? `(${s.t})` : s.t}\cdot r`), msg: M.naR },
        ],
      },
      { v: pl, dano: !posl, oshibki: posl ? [{ v: s, msg: M.k }] : [] },
      {
        v: mnogochlen(konecCh),
        dano: posl,
        oshibki: posl
          ? []
          : [
              { v: mnogochlen([...tek, x(i)]), msg: M.k },
              { v: mnogochlen([...naK(tek), { ...x(i), znak: 1 }]), msg: M.znak },
              { v: posle, msg: M.bezPlatezha },
            ],
      },
    ]);
    predPosle = posle;
    predStart = s;
    tek = konecCh;
  }
  const sumZ = platezhi.map((p) => `(${p.z})`).join('+');
  const sumT = platezhi
    .map((p, i) => (i === n - 1 && n > 1 ? `\\left(${p.t}\\right)` : p.t))
    .join(' + ');
  return {
    stroki,
    itog: { stolbec: 2, kl: { v: v(sumZ, sumT), dano: false, oshibki: [] } },
    platezh: [],
  };
}

/**
 * Вклад (P-03): в год opGod пополнение +y или снятие −x. osh1 — забыли
 * умножить на k, osh2 — пополнение до начисления процентов.
 */
function depModel(
  n: number,
  opGod: number,
  znak: 1 | -1,
  variant: Variant,
  M: Soobshcheniya,
): Model {
  const op: Chlen =
    znak > 0 ? { znak: 1, b: 'y', tex: 'y', st: 0 } : { znak: -1, b: 'x', tex: 'x', st: 0 };
  const stroki: Kl[][] = [];
  let predPosle: V | null = null;
  let predStart: V | null = null;
  let tek: Chlen[] = [{ znak: 1, b: 'S', tex: 'S', st: 0 }];
  for (let i = 1; i <= n; i++) {
    const s = mnogochlen(tek);
    const est = i === opGod;
    let posleCh: Chlen[];
    let konecCh: Chlen[];
    if (variant === 'osh1') {
      posleCh = tek;
      konecCh = est ? [...tek, op] : tek;
    } else if (variant === 'osh2' && est) {
      posleCh = naK([...tek, op]);
      konecCh = posleCh;
    } else {
      posleCh = naK(tek);
      konecCh = est ? [...posleCh, op] : posleCh;
    }
    const posle = mnogochlen(posleCh);
    const opV: V = est ? v(znak > 0 ? 'y' : '-x', znak > 0 ? '+y' : '-x') : v('0', '0');
    const obratno: Chlen = { ...op, znak: -op.znak as 1 | -1 };
    const vSkobkah = s.t.includes(' ') ? `(${s.t})` : s.t;
    stroki.push([
      {
        v: s,
        dano: false,
        oshibki: [
          ...(predPosle ? [{ v: predPosle, msg: M.bezOp }] : []),
          ...(predStart ? [{ v: predStart, msg: M.predNachalo }] : []),
        ],
      },
      {
        v: posle,
        dano: false,
        oshibki: [
          { v: s, msg: M.k },
          { v: v(`(${s.z})*r/100`, `${vSkobkah}\cdot\dfrac{r}{100}`), msg: M.tolkoProc },
          { v: v(`(${s.z})*r`, `${vSkobkah}\cdot r`), msg: M.naR },
        ],
      },
      { v: opV, dano: true, oshibki: [] },
      {
        v: mnogochlen(konecCh),
        dano: false,
        oshibki: est
          ? [
              { v: mnogochlen([...tek, op]), msg: M.k },
              { v: mnogochlen([...naK(tek), obratno]), msg: M.znakVklad },
              { v: posle, msg: M.bezOp },
            ]
          : [
              { v: s, msg: M.k },
              { v: v(`(${s.z})*r/100`, `${vSkobkah}\cdot\dfrac{r}{100}`), msg: M.tolkoProc },
            ],
      },
    ]);
    predPosle = posle;
    predStart = s;
    tek = konecCh;
  }
  return { stroki, itog: null, platezh: [] };
}

/* ── Сборка ─────────────────────────────────────────────────────── */

const kt = (tex: string): string =>
  katex.renderToString(tex, { throwOnError: true, displayFrac: true });

const PODSKAZKI: Record<'dif' | 'ann' | 'dep', string[]> = {
  dif: [
    'В первом месяце — сумма кредита $S$, дальше — долг на конец прошлого месяца.',
    'Кредит делим на число месяцев: $\\dfrac{S}{n}$ — одинаково в каждой строке.',
    'Переплата $=$ долг на начало $\\cdot\\,\\dfrac{r}{100}$.',
    'Долг на конец $=$ долг на начало $-$ сумма изменения долга.',
  ],
  ann: [
    'В первом году — сумма кредита $S$, дальше — долг на конец прошлого года.',
    'Долг после начисления $=$ долг на начало $\\cdot\\,k$, где $k = 1 + \\dfrac{r}{100}$.',
    'Платежи даны в условии; последний гасит весь долг — он равен долгу после начисления.',
    'Долг на конец $=$ долг после начисления $-$ платёж.',
  ],
  dep: [
    'В первом году — вклад $S$, дальше — вклад на конец прошлого года.',
    'После начисления $=$ вклад на начало $\\cdot\\,k$, где $k = 1 + \\dfrac{r}{100}$.',
    'Пополнение $+y$ или снятие $-x$ — из условия; в остальные годы $0$.',
    'Вклад на конец $=$ после начисления, плюс пополнение или минус снятие.',
  ],
};

/** Формула ответа по вопросу задачи: выражение и типичные ошибки. */
function formulaOtveta(t: Task13, m: Model, M: Soobshcheniya): Kl {
  const { chto, nomer } = t.zapros ?? { chto: '', nomer: 1 };
  const n = m.stroki.length;
  const i = Math.min(n, Math.max(1, nomer)) - 1;
  const kl = (c: number): Kl => m.stroki[i]![c]!;
  switch (t.tableModel.scheme) {
    case 'dif': {
      if (chto === 'change') return kl(1);
      if (chto === 'interest') return kl(2);
      if (chto === 'end') return kl(3);
      if (chto === 'payment') return m.platezh[i]!;
      const itog = m.itog!.kl;
      if (chto === 'overpay') return itog;
      return {
        v: v(`S+(${itog.v.z})`, ''),
        dano: false,
        oshibki: [
          { v: itog.v, msg: M.bezS },
          { v: v(`S+r*S*${n + 1}/2`, ''), msg: M.r },
        ],
      };
    }
    case 'ann':
      if (chto === 'after') return kl(1);
      if (chto === 'end') return kl(3);
      return m.stroki[n - 1]![2]!;
    default:
      if (chto === 'after') return kl(1);
      if (chto === 'end') return kl(3);
      return m.stroki[n - 1]![3]!;
  }
}

/** Таблица модели разметкой: строки — периоды, «Итого» — внизу. */
function modelHtml(
  m: Model,
  labels: readonly string[],
  period: string,
  cols: readonly string[],
  cls: string,
): string {
  const head = `<tr><th scope="col">${period}</th>${cols.map((c) => `<th scope="col">${c}</th>`).join('')}</tr>`;
  const body = m.stroki
    .map(
      (row, i) =>
        `<tr><th scope="row">${labels[i] ?? i + 1}</th>${row.map((kl) => `<td>${kt(kl.v.t)}</td>`).join('')}</tr>`,
    )
    .join('');
  const it = m.itog
    ? `<tr class="z13-zap__itog"><th scope="row">Итого</th>${cols
        .map((_, c) => `<td>${c === m.itog!.stolbec ? kt(m.itog!.kl.v.t) : ''}</td>`)
        .join('')}</tr>`
    : '';
  return `<table class="${cls}"><thead>${head}</thead><tbody>${body}${it}</tbody></table>`;
}

/** Модель задачи «таблица руками»: схема, подписи, верная таблица. */
function modelZadachi(t: Task13) {
  const tm = t.tableModel;
  const n = tm.rows.length;
  const M = soobshcheniya(tm.period, n);
  const opGod = Math.max(1, tm.rows.findIndex((x) => Math.abs(x.payment) > 1e-9) + 1);
  const opZnak: 1 | -1 = (tm.rows[opGod - 1]?.payment ?? 1) < 0 ? -1 : 1;
  const model = (variant: Variant): Model =>
    tm.scheme === 'dif'
      ? difModel(n, variant, M)
      : tm.scheme === 'ann'
        ? annModel(n, variant, M)
        : depModel(n, opGod, opZnak, variant, M);
  const labels =
    tm.labels.length === n ? tm.labels : Array.from({ length: n }, (_, i) => String(i + 1));
  return {
    n,
    M,
    opZnak,
    model,
    labels,
    period: tm.period === 'year' ? 'Год' : 'Месяц',
    cols: TABLE_HEAD[tm.scheme].cols,
  };
}

/** Лист учителя: таблица «Заполни таблицу», заполненная в буквах; null — не «таблица руками». */
export function tablitsaZapolniBukvyHtml(t: Task13, cls: string): string | null {
  if (!t.prototypeId.startsWith('P-')) return null;
  const z = modelZadachi(t);
  return modelHtml(z.model('verno'), z.labels, z.period, z.cols, cls);
}

/** Таблица «Заполни таблицу» или null — задача не из «таблицы руками». */
export function tablitsaZapolni13(
  t: Task13,
  typeset: (s: string) => string,
): TablitsaZapolni13 | null {
  if (!t.prototypeId.startsWith('P-')) return null;
  const tm = t.tableModel;
  const scheme = tm.scheme;
  const { n, M, opZnak, model, labels, period, cols } = modelZadachi(t);
  const r = D(t.params.r ?? tm.rows[0]!.rate);
  const rng = rng13(t.prototypeId, `${t.seed}:zapolni`);
  const tochki = tochkiZadachi({ r, n, sluchaynoe: (a, b) => rng.int(a, b) });
  const tochkiV: Tochka[] = tochki.map(izZapisi);
  const kluch = t.id;
  const zakryt = (html: string) => sealText(html, kluch);

  /** Отпечатки ошибок: совпавшие с верным или друг с другом — прочь. */
  function oshibkiKl(seal: string, kl: Kl) {
    const vidano = new Set([seal]);
    const out: (OshibkaZapolni13 & { t: string })[] = [];
    for (const o of kl.oshibki) {
      const s = sealVyrazhenie(o.v.z, tochkiV);
      if (vidano.has(s)) continue;
      vidano.add(s);
      out.push({ seal: s, msg: typeset(o.msg), t: o.v.t });
    }
    return out;
  }

  function kletka(id: string, kl: Kl): KletkaZapolni13 {
    const seal = sealVyrazhenie(kl.v.z, tochkiV);
    const oshibki = oshibkiKl(seal, kl);
    const vse = [kl.v.t, ...oshibki.filter((o) => o.t !== '').map((o) => o.t)].slice(0, 4);
    const poryadok = rng.sample(
      vse.map((_, j) => j),
      vse.length,
    );
    return {
      id,
      dano: kl.dano ? kt(kl.v.t) : null,
      html: zakryt(kt(kl.v.t)),
      seal,
      oshibki: oshibki.map(({ seal: s, msg }) => ({ seal: s, msg })),
      varianty: poryadok.map((j) => zakryt(kt(vse[j]!))),
      vernyy: sealChoice(`${kluch}:${id}:${poryadok.indexOf(0)}`),
      bukvy: /[Sxykr]/.test(kl.v.z),
    };
  }

  const verno = model('verno');
  const stroki: StrokaZapolni13[] = verno.stroki.map((row, i) => ({
    label: labels[i] ?? String(i + 1),
    kletki: row.map((kl, c) => kletka(`${i}.${c}`, kl)),
  }));
  const itog = verno.itog
    ? { stolbec: verno.itog.stolbec, kletka: kletka('itog', verno.itog.kl) }
    : null;

  /* Уровень 1: верная таблица и две с типичной ошибкой — в случайном порядке. */
  const tablitsaHtml = (m: Model) => modelHtml(m, labels, period, cols, 'z13-zap__mini');
  const tri = [verno, model('osh1'), model('osh2')];
  const por1 = rng.sample([0, 1, 2], 3);

  /* Пустые клетки уровней 2 и 3. */
  const vseKletki = stroki.flatMap((s) => s.kletki);
  const sVariantami = vseKletki
    .filter((k) => k.dano === null && k.varianty.length >= 3)
    .map((k) => k.id);
  const uroven2 = rng.sample(sVariantami, Math.min(4, sVariantami.length));
  const klyuchevye = new Set([0, n > 2 ? Math.floor(n / 2) : -1, n - 1]);
  const uroven3 = vseKletki
    .filter((k) => {
      const [i, c] = k.id.split('.').map(Number) as [number, number];
      return k.dano === null && klyuchevye.has(i) && (i === 0 || c !== 0);
    })
    .map((k) => k.id);

  const f = formulaOtveta(t, verno, M);
  const fSeal = sealVyrazhenie(f.v.z, tochkiV);

  const klavishi: Bukva[] = ['S', 'k', 'r', 'n', 'x'];
  if (scheme === 'ann') for (let i = 1; i < n; i++) klavishi.push(`x${'₀₁₂₃₄'[i]}` as Bukva);
  if (scheme === 'dep' && opZnak > 0) klavishi.push('y');

  return {
    kluch,
    period,
    stolbcy: cols.map((title, c) => ({ title, podskazka: typeset(PODSKAZKI[scheme][c]!) })),
    stroki,
    itog,
    tochki,
    klavishi,
    uroven1: {
      tablitsy: por1.map((j) => zakryt(tablitsaHtml(tri[j]!))),
      vernyy: sealChoice(`${kluch}:t:${por1.indexOf(0)}`),
    },
    uroven2,
    uroven3,
    formula: {
      seal: fSeal,
      oshibki: oshibkiKl(fSeal, f).map(({ seal: s, msg }) => ({ seal: s, msg })),
      bukvy: /[Sxykr]/.test(f.v.z),
    },
  };
}

/** Для автотеста: записи верных выражений клеток, ошибок, «Итого» и формулы ответа. */
export function zapisiZapolni13(t: Task13) {
  if (!t.prototypeId.startsWith('P-')) return null;
  const z = modelZadachi(t);
  const m = z.model('verno');
  return {
    stroki: m.stroki.map((row) =>
      row.map((kl) => ({ z: kl.v.z, dano: kl.dano, oshibki: kl.oshibki.map((o) => o.v.z) })),
    ),
    itog: m.itog ? m.itog.kl.v.z : null,
    formula: formulaOtveta(t, m, z.M).v.z,
  };
}
