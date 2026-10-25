/**
 * Таблицы по периодам в буквах для разборов №13 (решение автора от
 * 24.10.2026): сначала таблица в буквах, потом уравнение в буквах,
 * преобразования, итоговая формула и только в конце — числа.
 *
 * Обозначения едины по всей теории (легенда в начале раздела):
 * S — сумма кредита (вклада), r % — ставка, k = 1 + r/100 — множитель,
 * x — платёж, n — срок. Аннуитет и вклад — в развёрнутом виде (Sk − x,
 * Sk² − xk − x), как ученик записывает в тетради; у «поломанных» схем
 * с неравными уменьшениями долг на конец периода i — D_i.
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

const kSt = (e: number | string): string => (e === 0 ? '' : e === 1 ? 'k' : `k^{${e}}`);

/** Член многочлена по k: знак, множитель («S», «x», «3x», «y») и степень k. */
interface Chlen {
  znak: '+' | '-';
  c: string;
  st: number;
}

/** «Sk^{2} - xk - x»; больше четырёх членов — два первых, «…» и последний. */
function mnogochlen(ch: readonly Chlen[]): string {
  const sh: (Chlen | null)[] = ch.length > 4 ? [ch[0]!, ch[1]!, null, ch[ch.length - 1]!] : [...ch];
  const posl = ch[ch.length - 1]!;
  return sh
    .map((t, j) => {
      if (t === null) return ` ${posl.znak} \\dots`;
      const telo = `${t.c}${kSt(t.st)}`;
      if (j === 0) return t.znak === '-' ? `-${telo}` : telo;
      return ` ${t.znak} ${telo}`;
    })
    .join('');
}

/** «- x» → член; пустая строка или «0» — операции нет. */
function chlenOp(op: string, st: number): Chlen | null {
  const t = op.trim();
  if (t === '' || t === '0') return null;
  if (t.startsWith('-')) return { znak: '-', c: t.slice(1).trim(), st };
  return { znak: '+', c: t.replace(/^\+/, '').trim(), st };
}

/**
 * Строка i (с 1) в развёрнутом виде: сумма на начало, после начисления и
 * на конец периода. ops — операции по периодам со знаком («- x», «+ y»).
 */
function razvernuto(S: string, ops: readonly string[], i: number) {
  const nachalo: Chlen[] = [{ znak: '+', c: S, st: i - 1 }];
  for (let j = 1; j < i; j++) {
    const ch = chlenOp(ops[j - 1] ?? '', i - 1 - j);
    if (ch) nachalo.push(ch);
  }
  const posle = nachalo.map((t) => ({ ...t, st: t.st + 1 }));
  const op = chlenOp(ops[i - 1] ?? '', 0);
  const konec = op ? [...posle, op] : posle;
  return { nachalo: mnogochlen(nachalo), posle: mnogochlen(posle), konec: mnogochlen(konec) };
}

/** Общая строка n при равных операциях: «Sk^{n-1} - xk^{n-2} - … - x». */
function obshayaN(S: string, op: string) {
  const ch = chlenOp(op, 0);
  if (!ch) return { nachalo: `${S}k^{n-1}`, posle: `${S}k^{n}` };
  const z = ch.znak;
  return {
    nachalo: `${S}k^{n-1} ${z} ${ch.c}k^{n-2} ${z} \\dots ${z} ${ch.c}`,
    posle: `${S}k^{n} ${z} ${ch.c}k^{n-1} ${z} \\dots ${z} ${ch.c}k`,
  };
}

/**
 * Аннуитет и «известны платежи»: Долг на начало · Долг после начисления ·
 * Платёж · Долг на конец — в развёрнутом виде, как в тетради:
 * S | Sk | x | Sk − x, затем Sk − x | Sk² − xk | x | Sk² − xk − x.
 * После последнего платежа долг равен нулю; «Итого» — сумма платежей.
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
}): TablitsaPeremennye {
  const pl = opts.platezh ?? (() => 'x');
  const lbl = opts.label ?? ((i) => String(i));
  const S = opts.nachalo ?? 'S';
  const n = opts.n;
  const ops = n === null ? [] : Array.from({ length: n }, (_, j) => `- ${pl(j + 1)}`);
  const rows: Stroka[] = nomera(n).map((i) => {
    if (i === null) return null;
    if (i === 'n') {
      const o = obshayaN(S, `- ${pl('n')}`);
      return { label: lbl('n'), cells: [o.nachalo, o.posle, pl('n'), '0'] };
    }
    const r = razvernuto(S, ops, i);
    return { label: lbl(i), cells: [r.nachalo, r.posle, pl(i), i === n ? '0' : r.konec] };
  });
  const vse = n === null ? [] : Array.from({ length: n }, (_, j) => pl(j + 1));
  const itogo =
    n === null
      ? `n${pl('n')}`
      : vse.every((p) => p === vse[0])
        ? `${n}${vse[0]}`
        : n <= 4
          ? vse.join(' + ')
          : `${vse[0]} + ${vse[1]} + \\dots + ${vse[n - 1]}`;
  return {
    podpis: opts.podpis ?? '',
    period: opts.period,
    scheme: 'ann',
    rows,
    itog: ['', itogo],
    strelka: null,
  };
}

/**
 * Вклад: Вклад на начало · После начисления % · Пополнение / снятие ·
 * Вклад на конец — в развёрнутом виде. Пополнение строки i — dobavka(i):
 * «y», «-x» или «0».
 */
export function depBukvy(opts: {
  n: number | null;
  period: 'month' | 'year';
  podpis?: string;
  dobavka: (i: number | 'n') => string;
  label?: (i: number | 'n') => string;
  nachalo?: string;
  /** Вклад на конец последнего периода: «0» у снятий до нуля. */
  konec?: string;
}): TablitsaPeremennye {
  const lbl = opts.label ?? ((i) => String(i));
  const S = opts.nachalo ?? 'S';
  const n = opts.n;
  const zn = (d: string) => (d === '0' ? '' : d.startsWith('-') ? `- ${d.slice(1)}` : `+ ${d}`);
  const ops = n === null ? [] : Array.from({ length: n }, (_, j) => zn(opts.dobavka(j + 1)));
  const rows: Stroka[] = nomera(n).map((i) => {
    if (i === null) return null;
    const d = opts.dobavka(i);
    if (i === 'n') {
      const o = obshayaN(S, zn(d));
      return { label: lbl('n'), cells: [o.nachalo, o.posle, d, opts.konec ?? '\\dots'] };
    }
    const r = razvernuto(S, ops, i);
    const konec = i === n && opts.konec !== undefined ? opts.konec : r.konec;
    return { label: lbl(i), cells: [r.nachalo, r.posle, d, konec] };
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
          cells: [start, fr('S', n), `${rT}\\cdot ${start}`, dolya(n - i, n)],
        };
      }
      const D = (k: number) => (k === 0 ? 'S' : `D_{${k}}`);
      const d = nachaloX && i < n ? 'X' : i === n && nachaloX ? D(n - 1) : `\\Delta_{${i}}`;
      const konec = i === n && pogashen ? '0' : `${D(i)} = ${D(i - 1)} - ${d}`;
      return { label: lbl(i), cells: [D(i - 1), d, `${rT}\\cdot ${D(i - 1)}`, konec] };
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
