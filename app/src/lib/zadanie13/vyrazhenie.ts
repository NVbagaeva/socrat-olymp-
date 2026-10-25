/**
 * Выражения в буквах для «Заполни таблицу» №13: ученик пишет S/7,
 * (1/7)S, Sk² − xk; проверка — по смыслу, подстановкой. Выражение
 * считается точно (обыкновенными дробями) в нескольких точках — наборах
 * S, x, y, …; совпали значения во всех точках — записи равны.
 *
 * Ответов в разметке нет: вниз уходят точки и отпечаток значений
 * верного выражения (и типичных ошибок — чтобы назвать ошибку).
 * Модуль изоморфный: отпечатки считает сборка, сверку — браузер.
 */

import { D, type Drob } from './drob';
import { fingerprint } from './secret';

/* ── Разбор ─────────────────────────────────────────────────────── */

/** Буквы, которые понимает проверка; x₁, x₂ — платежи разных лет. */
export const BUKVY = ['S', 'x', 'y', 'k', 'r', 'n', 'x₁', 'x₂', 'x₃', 'x₄'] as const;
export type Bukva = (typeof BUKVY)[number];

export type Uzel =
  | { t: 'chislo'; v: Drob; zapis: string }
  | { t: 'bukva'; b: Bukva }
  | { t: 'minus'; a: Uzel }
  | { t: 'skobki'; a: Uzel }
  | { t: 'op'; op: '+' | '-' | '*' | '/' | '^'; a: Uzel; b: Uzel; yavno: boolean };

type Leksema =
  | { t: 'chislo'; v: string }
  | { t: 'bukva'; b: Bukva }
  | { t: 'op'; v: '+' | '-' | '*' | '/' | '^' }
  | { t: '(' }
  | { t: ')' };

const PODSTROCHNYE: Record<string, string> = { '₁': '1', '₂': '2', '₃': '3', '₄': '4' };
const NADSTROCHNYE: Record<string, string> = { '²': '2', '³': '3', '⁴': '4' };

/** Похожие кириллические буквы и знаки — в те, что понимает разбор. */
function normalno(s: string): string {
  return s
    .replace(/[хХ]/g, 'x')
    .replace(/[кК]/g, 'k')
    .replace(/[СсSs]/g, 'S')
    .replace(/[уУ]/g, 'y')
    .replace(/X/g, 'x')
    .replace(/K/g, 'k')
    .replace(/[−–—]/g, '-')
    .replace(/[·×∙⋅*]/g, '*')
    .replace(/[:÷]/g, '/');
}

function leksemy(vvod: string): Leksema[] | null {
  const s = normalno(vvod);
  const out: Leksema[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i]!;
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9]/.test(c) || ((c === ',' || c === '.') && /[0-9]/.test(s[i + 1] ?? ''))) {
      let j = i;
      while (j < s.length && /[0-9.,]/.test(s[j]!)) j++;
      const v = s.slice(i, j).replace(',', '.');
      if ((v.match(/\./g) ?? []).length > 1 || v.endsWith('.')) return null;
      out.push({ t: 'chislo', v: v.startsWith('.') ? `0${v}` : v });
      i = j;
      continue;
    }
    if (c === 'x') {
      const pod = PODSTROCHNYE[s[i + 1] ?? ''];
      /* x₁, x_1, x_{1} и просто x1 — платёж первого года. */
      const m = /^(?:_\{?([1-4])\}?|([1-4]))/.exec(s.slice(i + 1));
      if (pod) {
        out.push({ t: 'bukva', b: `x${'₀₁₂₃₄'[Number(pod)]}` as Bukva });
        i += 2;
      } else if (m) {
        out.push({ t: 'bukva', b: `x${'₀₁₂₃₄'[Number(m[1] ?? m[2])]}` as Bukva });
        i += 1 + m[0].length;
      } else {
        out.push({ t: 'bukva', b: 'x' });
        i++;
      }
      continue;
    }
    if (c === 'S' || c === 'y' || c === 'k' || c === 'r' || c === 'n') {
      out.push({ t: 'bukva', b: c });
      i++;
      continue;
    }
    if (NADSTROCHNYE[c]) {
      out.push({ t: 'op', v: '^' }, { t: 'chislo', v: NADSTROCHNYE[c]! });
      i++;
      continue;
    }
    if (c === '+' || c === '-' || c === '*' || c === '/' || c === '^') {
      out.push({ t: 'op', v: c });
      i++;
      continue;
    }
    if (c === '(' || c === '[' || c === '{') {
      out.push({ t: '(' });
      i++;
      continue;
    }
    if (c === ')' || c === ']' || c === '}') {
      out.push({ t: ')' });
      i++;
      continue;
    }
    return null;
  }
  return out;
}

/**
 * Разбор с обычным порядком действий: степень, умножение и деление
 * (подряд — слева направо, «6S/7» — это 6S, делённое на 7), сложение.
 * Умножение можно не писать: 6S, (r/100)S, x(k + 1).
 */
export function razobrat(vvod: string): Uzel | null {
  const ls = leksemy(vvod);
  if (!ls || ls.length === 0) return null;
  let p = 0;
  const vid = () => ls[p];

  function summa(): Uzel | null {
    let a = proizv();
    while (a) {
      const l = vid();
      if (l?.t !== 'op' || (l.v !== '+' && l.v !== '-')) break;
      p++;
      const b = proizv();
      if (!b) return null;
      a = { t: 'op', op: l.v, a, b, yavno: true };
    }
    return a;
  }

  function nachaloMnozhitelya(l: Leksema | undefined): boolean {
    return l !== undefined && (l.t === 'bukva' || l.t === '(' || l.t === 'chislo');
  }

  function proizv(): Uzel | null {
    let a = unarnyy();
    while (a) {
      const l = vid();
      if (l?.t === 'op' && (l.v === '*' || l.v === '/')) {
        p++;
        const b = unarnyy();
        if (!b) return null;
        a = { t: 'op', op: l.v, a, b, yavno: true };
      } else if (nachaloMnozhitelya(l)) {
        const b = stepen();
        if (!b) return null;
        a = { t: 'op', op: '*', a, b, yavno: false };
      } else break;
    }
    return a;
  }

  function unarnyy(): Uzel | null {
    const l = vid();
    if (l?.t === 'op' && l.v === '-') {
      p++;
      const a = unarnyy();
      return a ? { t: 'minus', a } : null;
    }
    if (l?.t === 'op' && l.v === '+') {
      p++;
      return unarnyy();
    }
    return stepen();
  }

  function stepen(): Uzel | null {
    const a = osnova();
    if (!a) return null;
    const l = vid();
    if (l?.t === 'op' && l.v === '^') {
      p++;
      const b = unarnyy();
      if (!b) return null;
      return { t: 'op', op: '^', a, b, yavno: true };
    }
    return a;
  }

  function osnova(): Uzel | null {
    const l = vid();
    if (!l) return null;
    if (l.t === 'chislo') {
      p++;
      return { t: 'chislo', v: D(l.v), zapis: l.v };
    }
    if (l.t === 'bukva') {
      p++;
      return { t: 'bukva', b: l.b };
    }
    if (l.t === '(') {
      p++;
      const a = summa();
      if (!a || vid()?.t !== ')') return null;
      p++;
      return { t: 'skobki', a };
    }
    return null;
  }

  const u = summa();
  return u && p === ls.length ? u : null;
}

/* ── Вычисление ─────────────────────────────────────────────────── */

export type Tochka = Partial<Record<Bukva, Drob>>;

/** Значение в точке; null — деление на ноль, нецелая степень, неизвестная буква. */
export function vychislit(u: Uzel, t: Tochka): Drob | null {
  switch (u.t) {
    case 'chislo':
      return u.v;
    case 'bukva':
      return t[u.b] ?? null;
    case 'minus': {
      const a = vychislit(u.a, t);
      return a === null ? null : a.neg();
    }
    case 'skobki':
      return vychislit(u.a, t);
    case 'op': {
      const a = vychislit(u.a, t);
      const b = vychislit(u.b, t);
      if (a === null || b === null) return null;
      if (u.op === '+') return a.add(b);
      if (u.op === '-') return a.sub(b);
      if (u.op === '*') return a.mul(b);
      if (u.op === '/') return b.n === 0n ? null : a.div(b);
      if (!b.isInteger() || b.n < 0n || b.n > 12n) return null;
      return a.pow(Number(b.n));
    }
  }
}

/** Буквы выражения. */
export function bukvyVyrazheniya(u: Uzel): Set<Bukva> {
  const s = new Set<Bukva>();
  const obhod = (x: Uzel) => {
    if (x.t === 'bukva') s.add(x.b);
    else if (x.t === 'minus' || x.t === 'skobki') obhod(x.a);
    else if (x.t === 'op') {
      obhod(x.a);
      obhod(x.b);
    }
  };
  obhod(u);
  return s;
}

/* ── Запись в KaTeX ─────────────────────────────────────────────── */

const TEX_BUKVA: Record<Bukva, string> = {
  S: 'S',
  x: 'x',
  y: 'y',
  k: 'k',
  r: 'r',
  n: 'n',
  'x₁': 'x_{1}',
  'x₂': 'x_{2}',
  'x₃': 'x_{3}',
  'x₄': 'x_{4}',
};

const bezSkobok = (u: Uzel): Uzel => (u.t === 'skobki' ? bezSkobok(u.a) : u);

/** Выражение в KaTeX: дробь — \dfrac, умножение без знака там, где можно. */
export function vTex(u: Uzel): string {
  switch (u.t) {
    case 'chislo':
      return u.zapis.replace('.', '{,}');
    case 'bukva':
      return TEX_BUKVA[u.b];
    case 'minus':
      return `-${vTex(u.a)}`;
    case 'skobki':
      return `\\left(${vTex(u.a)}\\right)`;
    case 'op': {
      if (u.op === '/') return `\\dfrac{${vTex(bezSkobok(u.a))}}{${vTex(bezSkobok(u.b))}}`;
      if (u.op === '^') return `${vTex(u.a)}^{${vTex(bezSkobok(u.b))}}`;
      if (u.op === '*') {
        const a = vTex(u.a);
        const b = vTex(u.b);
        const nuzhenZnak = u.yavno || /[0-9}]$/.test(a) || /^[0-9-]/.test(b) || /^\\dfrac/.test(b);
        return nuzhenZnak ? `${a}\\cdot ${b}` : `${a}${b}`;
      }
      return `${vTex(u.a)} ${u.op} ${vTex(u.b)}`;
    }
  }
}

/** KaTeX по вводу ученика; null — запись не разобрать. */
export function texVvoda(vvod: string): string | null {
  const u = razobrat(vvod);
  return u ? vTex(u) : null;
}

/* ── Отпечатки ──────────────────────────────────────────────────── */

/** Отпечаток значений в точках: одно и то же выражение в любой записи — один отпечаток. */
function otpechatokZnacheniy(znach: readonly Drob[]): string {
  return fingerprint(`vyr:${znach.map((z) => z.toString()).join('|')}`);
}

/** Отпечаток выражения (канонической записи) в точках; null — не считается. */
export function sealVyrazhenie(zapis: string, tochki: readonly Tochka[]): string {
  const u = razobrat(zapis);
  if (!u) throw new Error(`vyrazhenie: не разобрать «${zapis}»`);
  const znach = tochki.map((t) => vychislit(u, t));
  if (znach.some((z) => z === null))
    throw new Error(`vyrazhenie: «${zapis}» не считается в точках`);
  return otpechatokZnacheniy(znach as Drob[]);
}

/** Отпечаток ввода ученика или null, если запись не разобрать или не посчитать. */
export function otpechatokVvoda(vvod: string, tochki: readonly Tochka[]): string | null {
  const u = razobrat(vvod);
  if (!u) return null;
  const znach = tochki.map((t) => vychislit(u, t));
  if (znach.some((z) => z === null)) return null;
  return otpechatokZnacheniy(znach as Drob[]);
}

/* ── Точки подстановки ──────────────────────────────────────────── */

/** Точка в разметке: значения строками «4000», «1.1». */
export type TochkaZapis = Partial<Record<Bukva, string>>;

export const izZapisi = (t: TochkaZapis): Tochka =>
  Object.fromEntries(
    Object.entries(t).map(([b, v]) => {
      const [a, d] = (v as string).split('/');
      return [b, D(a!, d ?? 1)];
    }),
  ) as Tochka;

/**
 * Три точки: S, x, y, x₁… — случайные целые (по seed задачи), r и n — из
 * условия, k = 1 + r/100. Так 0,1·S и S/10 при r = 10 совпадают, а S/7
 * и S/6 — нет.
 */
export function tochkiZadachi(opts: {
  r: Drob;
  n: number;
  sluchaynoe: (lo: number, hi: number) => number;
}): TochkaZapis[] {
  const k = D(1).add(opts.r.div(100));
  return [0, 1, 2].map(() => {
    const t: TochkaZapis = { r: opts.r.toString(), n: String(opts.n), k: k.toString() };
    for (const b of ['S', 'x', 'y', 'x₁', 'x₂', 'x₃', 'x₄'] as const)
      t[b] = String(opts.sluchaynoe(b === 'S' ? 1000 : 11, b === 'S' ? 9973 : 997));
    return t;
  });
}

/* ── Сверка клетки ──────────────────────────────────────────────── */

export type Itog =
  | { t: 'pusto' }
  | { t: 'nerazobrano' }
  | { t: 'chisla' }
  | { t: 'verno' }
  | { t: 'oshibka'; msg: string }
  | { t: 'neverno' };

/**
 * Сверка ввода с клеткой: верно — отпечаток совпал; типичная ошибка —
 * её сообщение; числа вместо букв — подсказка писать в буквах.
 */
export function proverit(
  vvod: string,
  k: { seal: string; oshibki: readonly { seal: string; msg: string }[]; bukvy: boolean },
  tochki: readonly Tochka[],
): Itog {
  if (vvod.trim() === '') return { t: 'pusto' };
  const u = razobrat(vvod);
  if (!u) return { t: 'nerazobrano' };
  const o = otpechatokVvoda(vvod, tochki);
  if (o === null) return { t: 'nerazobrano' };
  if (o === k.seal) return { t: 'verno' };
  const osh = k.oshibki.find((x) => x.seal === o);
  if (osh) return { t: 'oshibka', msg: osh.msg };
  if (k.bukvy && bukvyVyrazheniya(u).size === 0) return { t: 'chisla' };
  return { t: 'neverno' };
}
