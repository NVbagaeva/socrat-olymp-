/**
 * Таблицы по периодам в буквах для разборов №13 (решение автора от
 * 24.10.2026): сначала таблица в буквах, потом уравнение в буквах,
 * преобразования, итоговая формула и только в конце — числа.
 *
 * Обозначения едины по всей теории (легенда в начале раздела):
 * S — сумма кредита (вклада), r % — ставка, k = 1 + r/100 — множитель,
 * x — платёж, n — срок. Долг (вклад) на конец периода i — D_i: так
 * строка следующего периода начинается с того, чем кончилась прошлая,
 * и запись не разрастается скобками.
 */

import type { PeriodRow, TableModel, TablitsaPeremennye } from './types';

type Stroka = { label: string; cells: [string, string, string, string] } | null;

/**
 * Номера строк: все при n ≤ 4, иначе 1, 2, 3, «…», n. Для общего n —
 * 1, 2, «…», n.
 */
function nomera(n: number | null): (number | 'n' | null)[] {
  if (n === null) return [1, 2, null, 'n'];
  if (n <= 4) return Array.from({ length: n }, (_, i) => i + 1);
  return [1, 2, 3, null, n];
}

/**
 * Аннуитет и «известны платежи»: Долг на начало · Долг с процентами ·
 * Платёж · Долг на конец. Платёж строки i — platezh(i) (по умолчанию x),
 * после последнего платежа долг равен нулю.
 */
export function annBukvy(opts: {
  n: number | null;
  period: 'month' | 'year';
  podpis?: string;
  platezh?: (i: number | 'n') => string;
  /** Подписи периодов («2028») вместо номеров; по номеру строки. */
  label?: (i: number | 'n') => string;
  /** Что на начало первого периода: S. */
  nachalo?: string;
  /** Буква долга на конец: D; у второй схемы той же задачи — D'. */
  bukva?: string;
}): TablitsaPeremennye {
  const pl = opts.platezh ?? (() => 'x');
  const D = (i: number | string) => `${opts.bukva ?? 'D'}_{${i}}`;
  const lbl = opts.label ?? ((i) => String(i));
  const S = opts.nachalo ?? 'S';
  const last = opts.n ?? 'n';
  const rows: Stroka[] = nomera(opts.n).map((i) => {
    if (i === null) return null;
    const prev = i === 1 ? S : i === 'n' ? D('n-1') : D(i - 1);
    const sK = i === 1 ? `${S}k` : `${prev}\\,k`;
    const konec = i === last ? '0' : `${D(i)} = ${sK} - ${pl(i)}`;
    return { label: lbl(i), cells: [prev, sK, pl(i), konec] };
  });
  return {
    podpis: opts.podpis ?? '',
    period: opts.period,
    scheme: 'ann',
    rows,
    itog: null,
    strelka: null,
  };
}

/**
 * Вклад: Вклад на начало · После начисления % · Пополнение / снятие ·
 * Вклад на конец. Пополнение строки i — dobavka(i) со знаком («+ y»,
 * «- x», «0»).
 */
export function depBukvy(opts: {
  n: number | null;
  period: 'month' | 'year';
  podpis?: string;
  dobavka: (i: number | 'n') => string;
  label?: (i: number | 'n') => string;
  nachalo?: string;
  /** Вклад на конец последнего периода: «0» у снятий до нуля; по умолчанию V_n. */
  konec?: string;
}): TablitsaPeremennye {
  const lbl = opts.label ?? ((i) => String(i));
  const S = opts.nachalo ?? 'S';
  const last = opts.n ?? 'n';
  const V = (i: number | string) => `V_{${i}}`;
  const rows: Stroka[] = nomera(opts.n).map((i) => {
    if (i === null) return null;
    const prev = i === 1 ? S : i === 'n' ? V('n-1') : V(i - 1);
    const sK = i === 1 ? `${S}k` : `${prev}\\,k`;
    const d = opts.dobavka(i);
    const sum = d === '0' ? sK : d.startsWith('-') ? `${sK} - ${d.slice(1)}` : `${sK} + ${d}`;
    const konec = i === last && opts.konec !== undefined ? opts.konec : `${V(i)} = ${sum}`;
    return { label: lbl(i), cells: [prev, sK, d === '0' ? '0' : d, konec] };
  });
  return {
    podpis: opts.podpis ?? '',
    period: opts.period,
    scheme: 'dep',
    rows,
    itog: null,
    strelka: null,
  };
}

/* ── Таблица в буквах по модели задачи ───────────────────────────── */

const fr = (a: string, b: string | number) => `\\dfrac{${a}}{${b}}`;

const ravny = (xs: readonly number[]) => xs.every((x) => Math.abs(x - (xs[0] ?? 0)) < 1e-9);

/** «1, 2, 3, …, n» по числу периодов: номера строк модели (с 1), 0 — «…». */
function pokaz(n: number): number[] {
  return n <= 5 ? Array.from({ length: n }, (_, i) => i + 1) : [1, 2, 3, 0, n - 1, n];
}

/** m·S/n дробью: «S», «\dfrac{S}{n}», «\dfrac{5S}{n}». */
function dolya(m: number, n: number): string {
  if (m === 0) return '0';
  if (m === n) return 'S';
  return fr(m === 1 ? 'S' : `${m}S`, n);
}

/**
 * Таблица в буквах по модели задачи — замена таблицы, сразу заполненной
 * числами. Дифференцированный платёж с равными долями — дроби
 * \dfrac{(n−i+1)S}{n}; иначе долг на конец периода i — D_i (вклад —
 * V_i), сумма изменения долга — X (если первые периоды одинаковы) или
 * Δ_i, платежи — x (равные) или x_i, пополнения — y или y_i.
 */
export function bukvyIzModeli(m: TableModel): TablitsaPeremennye {
  const n = m.rows.length;
  const lbl = (i: number | 'n') => m.labels[(i === 'n' ? n : i) - 1] ?? String(i);
  if (m.scheme === 'ann') {
    const x = m.rows.map((r) => r.payment);
    const pl = ravny(x) ? () => 'x' : (i: number | 'n') => `x_{${i}}`;
    return annBukvy({ n, period: m.period, platezh: pl, label: lbl });
  }
  if (m.scheme === 'dep') {
    const p = m.rows.map((r) => r.payment);
    const plus = p.filter((v) => v > 0);
    const minus = p.filter((v) => v < 0);
    const dobavka = (i: number | 'n') => {
      const v = p[(i === 'n' ? n : i) - 1] ?? 0;
      if (Math.abs(v) < 1e-9) return '0';
      if (v > 0) return ravny(plus) ? 'y' : `y_{${i}}`;
      return ravny(minus) ? '-x' : `-x_{${i}}`;
    };
    const last = m.rows[n - 1];
    return depBukvy({
      n,
      period: m.period,
      dobavka,
      label: lbl,
      ...(last && Math.abs(last.end) < 1e-9 ? { konec: '0' } : {}),
    });
  }
  /* Дифференцированный и «поломанный». */
  const stavki = [...new Set(m.rows.map((r) => r.rate))];
  const rBukva = (rate: number) => (stavki.length === 1 ? 'r' : `r_{${stavki.indexOf(rate) + 1}}`);
  const change = m.rows.map((r) => r.change);
  const first = m.rows[0];
  const rovno =
    first !== undefined && ravny(change) && Math.abs(first.start - n * (change[0] ?? 0)) < 1e-6;
  const nachaloX = ravny(change.slice(0, -1)) && n > 1;
  const pogashen = Math.abs(m.rows[n - 1]?.end ?? 1) < 1e-9;
  const rows = pokaz(n).map(
    (i): { label: string; cells: [string, string, string, string] } | null => {
      if (i === 0) return null;
      const r = m.rows[i - 1] as PeriodRow;
      const rT = fr(rBukva(r.rate), 100);
      if (rovno) {
        const start = dolya(n - i + 1, n);
        return {
          label: lbl(i),
          cells: [start, fr('S', n), `${start}\\cdot ${rT}`, dolya(n - i, n)],
        };
      }
      const D = (k: number) => (k === 0 ? 'S' : `D_{${k}}`);
      const d = nachaloX && i < n ? 'X' : i === n && nachaloX ? D(n - 1) : `\\Delta_{${i}}`;
      const konec = i === n && pogashen ? '0' : `${D(i)} = ${D(i - 1)} - ${d}`;
      return { label: lbl(i), cells: [D(i - 1), d, `${D(i - 1)}\\cdot ${rT}`, konec] };
    },
  );
  const kogda = m.period === 'year' ? 'года' : 'месяца';
  return {
    podpis: '',
    period: m.period,
    scheme: 'dif',
    rows,
    itog: pogashen ? ['S', 'P'] : null,
    strelka: stavki.length === 1 ? `$r\\,\\%$ начисляется на долг на начало ${kogda}` : null,
  };
}
