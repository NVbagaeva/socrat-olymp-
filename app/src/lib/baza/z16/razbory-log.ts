/**
 * База, задание №16, раздел III «Преобразование логарифмических
 * выражений»: разборы.
 *
 * Приёмы — как в профильном №8 (lib/vychisleniya/prototypes/logarifmy.ts):
 * сумма логарифмов — логарифм произведения, разность — частного;
 * показатель выносится множителем; log_{√a} x = 2·log_a x; основное
 * логарифмическое тождество a^{log_a b} = b. Значение логарифма —
 * показатель степени: какое число нужно возвести в степень, чтобы
 * получить аргумент.
 */

import type { HintStep } from '../types';
import { add, dec, div, mul, powQ, q, sub, texDrobQ, texQ, type Q } from './drob';
import { d, etap, f, hesh, num, pw, vopros, type Resh, type Vid } from './obshchee';

/** Наименьшее g, степень которого — a: 36 → 6, 8 → 2, 12 → 12. */
function koren(a: number): { g: number; s: number } {
  for (let g = 2; g <= a; g += 1) {
    let y = a;
    let s = 0;
    while (y % g === 0) {
      y /= g;
      s += 1;
    }
    if (y === 1) return { g, s };
  }
  throw new Error(`основание ${a}`);
}

/** Показатель t: x = g^t (x — дробь, t любого знака) или null. */
function pokazatel(x: Q, g: number): number | null {
  const B = BigInt(g);
  const odin = BigInt(1);
  const pok = (n: bigint): number | null => {
    let y = n;
    let t = 0;
    while (y > odin && y % B === BigInt(0)) {
      y /= B;
      t += 1;
    }
    return y === odin ? t : null;
  };
  const a = pok(x.n);
  const b = pok(x.d);
  return a === null || b === null ? null : a - b;
}

/**
 * log_a x точно. Вместе с ответом — строка, почему так:
 * «$8 = 2^{3}$» или «$36 = 6^{2}$, $216 = 6^{3}$».
 */
function logTochno(a: number, x: Q, zapis: string): { v: Q; pochemu: string; vykl: string } {
  const { g, s } = koren(a);
  const t = pokazatel(x, g);
  if (t === null) throw new Error(`log_${a} ${texQ(x)} не вычисляется в «${zapis}»`);
  const v = q(t, s);
  const xt = texDrobQ(x);
  if (s === 1) {
    return {
      v,
      pochemu: `$${xt} = ${pw(a, t)}$, значит, $\\log_{${a}}${arg(xt)} = ${t}$.`,
      vykl: `\\log_{${a}}${arg(xt)} = \\log_{${a}}${pw(a, t)} = ${texQ(v)}`,
    };
  }
  return {
    v,
    pochemu: `$${a} = ${pw(g, s)}$ и $${xt} = ${pw(g, t)}$: $\\log_{a^{k}}a^{m} = \\dfrac{m}{k}$.`,
    vykl: `\\log_{${a}}${arg(xt)} = \\log_{${pw(g, s)}}${pw(g, t)} = \\dfrac{${t}}{${s}} = ${texQ(v)}`,
  };
}

/** Аргумент логарифма: дробь и сложное — в скобках. */
function arg(t: string): string {
  return /^[\d{},]+$/.test(t) ? t : `\\left(${t}\\right)`;
}

const lg = (a: string | number, x: string) => `\\log_{${a}}${arg(x)}`;

function blizkie(v: Q): string[] {
  return [f(texQ(add(v, q(1)))), f(texQ(mul(v, q(2)))), f(texQ(sub(v, q(1))))];
}

/* ── Сумма и разность логарифмов ───────────────────────────────── */

function summaLog(a: number, x: string, y: string, raznost: boolean, zapis: string): Resh {
  const X = dec(x);
  const Y = dec(y);
  const N = raznost ? div(X, Y) : mul(X, Y);
  const { v, pochemu, vykl } = logTochno(a, N, zapis);
  const zn = raznost ? '-' : '+';
  const vnutri = raznost ? `\\dfrac{${d(x)}}{${d(y)}}` : `${d(x)} \\cdot ${d(y)}`;
  const etapy = [
    etap(
      raznost
        ? 'Разность логарифмов — логарифм частного'
        : 'Сумма логарифмов — логарифм произведения',
      raznost
        ? 'Основания одинаковые: $\\log_{a}x - \\log_{a}y = \\log_{a}\\dfrac{x}{y}$. Каждый логарифм по отдельности не считается.'
        : 'Основания одинаковые: $\\log_{a}x + \\log_{a}y = \\log_{a}(xy)$. Каждый логарифм по отдельности не считается.',
      `${lg(a, d(x))} ${zn} ${lg(a, d(y))} = \\log_{${a}}\\left(${vnutri}\\right) = ${lg(a, texDrobQ(N))}`,
    ),
    etap('Считаем логарифм', pochemu, vykl),
  ];
  const h = hesh(zapis);
  const hints = [
    vopros(
      `Чему равно $${lg(a, d(x))} ${zn} ${lg(a, d(y))}$?`,
      f(`\\log_{${a}}\\left(${vnutri}\\right)`),
      [
        f(`\\log_{${a}}\\left(${d(x)} ${zn} ${d(y)}\\right)`),
        f(`\\log_{${2 * a}}\\left(${vnutri}\\right)`),
      ],
      h,
      raznost
        ? 'Разность логарифмов — логарифм частного.'
        : 'Сумма логарифмов — логарифм произведения.',
    ),
    vopros(`Чему равно $${lg(a, texDrobQ(N))}$?`, f(texQ(v)), blizkie(v), h + 1, pochemu),
  ];
  return { otvet: v, etapy, hints };
}

/* ── Логарифм от логарифма ─────────────────────────────────────── */

function vlozhennyy(a: number, b: number, N: number, c: number | null, zapis: string): Resh {
  const vn = logTochno(b, q(N), zapis);
  const M = c === null ? vn.v : add(vn.v, q(c));
  const vnesh = logTochno(a, M, zapis);
  const iskhod =
    c === null ? `\\log_{${a}}(\\log_{${b}}${N})` : `\\log_{${a}}(\\log_{${b}}${N} + ${c})`;
  const etapy = [
    etap('Считаем внутренний логарифм', vn.pochemu, vn.vykl),
    etap(
      'Подставляем',
      null,
      `${iskhod} = ${
        c === null
          ? lg(a, texDrobQ(M))
          : `\\log_{${a}}(${texDrobQ(vn.v)} + ${c}) = ${lg(a, texDrobQ(M))}`
      }`,
    ),
    etap('Считаем внешний логарифм', vnesh.pochemu, vnesh.vykl),
  ];
  const h = hesh(zapis);
  const hints = [
    vopros(`Чему равно $\\log_{${b}}${N}$?`, f(texQ(vn.v)), blizkie(vn.v), h, vn.pochemu),
    vopros(
      `Чему равно $${lg(a, texDrobQ(M))}$?`,
      f(texQ(vnesh.v)),
      blizkie(vnesh.v),
      h + 1,
      vnesh.pochemu,
    ),
  ];
  return { otvet: vnesh.v, etapy, hints };
}

/* ── Показатель выносим, основание-корень ──────────────────────── */

function vynosPokazatelya(b: number, c: number, n: number, k: number, zapis: string): Resh {
  const otvet = q(n, k);
  const etapy = [
    etap(
      'Выносим показатель',
      'Показатель степени под логарифмом выносится множителем: $\\log_{a}(x^{n}) = n\\log_{a}x$.',
      `\\log_{${b}}\\left(${pw(c, n)}\\right) = ${n}\\log_{${b}}${c}`,
    ),
    etap(
      `Сокращаем на $\\log_{${b}}${c}$`,
      'Логарифм $\\log_{' +
        b +
        '}' +
        c +
        '$ сам не считается, но он есть и в числителе, и в знаменателе.',
      `\\dfrac{${n}\\log_{${b}}${c}}{${k}\\log_{${b}}${c}} = \\dfrac{${n}}{${k}} = ${texQ(otvet)}`,
    ),
  ];
  const h = hesh(zapis);
  const hints = [
    vopros(
      `Чему равно $\\log_{${b}}\\left(${pw(c, n)}\\right)$?`,
      f(`${n}\\log_{${b}}${c}`),
      [f(`\\log_{${b}}${c * n}`), f(`${pw(`(\\log_{${b}}${c})`, n)}`)],
      h,
      'Показатель выносится множителем.',
    ),
    vopros(
      'Чему равно значение выражения?',
      f(texQ(otvet)),
      [f(texQ(q(k, n))), f(String(n - k))],
      h + 1,
    ),
  ];
  return { otvet, etapy, hints };
}

function osnovanieKoren(A: number, xTex: string, x: Q, zapis: string): Resh {
  const vn = logTochno(A, x, zapis);
  const otvet = mul(q(2), vn.v);
  const etapy = [
    etap(
      'Основание — корень',
      `$\\sqrt{${A}} = ${A}^{\\frac{1}{2}}$, а $\\log_{a^{k}}x = \\dfrac{1}{k}\\log_{a}x$, поэтому $\\log_{\\sqrt{a}}x = 2\\log_{a}x$.`,
      `\\log_{\\sqrt{${A}}}${xTex} = 2\\log_{${A}}${xTex}`,
    ),
    etap('Считаем логарифм', vn.pochemu, vn.vykl),
    etap('Умножаем на 2', null, `2 \\cdot ${texQ(vn.v)} = ${texQ(otvet)}`),
  ];
  const h = hesh(zapis);
  const hints = [
    vopros(
      `Чему равно $\\log_{\\sqrt{${A}}}${xTex}$?`,
      f(`2\\log_{${A}}${xTex}`),
      [f(`\\dfrac{1}{2}\\log_{${A}}${xTex}`), f(`\\log_{${A}}${xTex}`)],
      h,
      'Основание $\\sqrt{a} = a^{\\frac{1}{2}}$: множитель — $2$.',
    ),
    vopros(
      'Чему равно значение выражения?',
      f(texQ(otvet)),
      [f(texQ(vn.v)), f(texQ(div(vn.v, q(2))))],
      h + 1,
      `$2 \\cdot ${texQ(vn.v)} = ${texQ(otvet)}$.`,
    ),
  ];
  return { otvet, etapy, hints };
}

/* ── Основное логарифмическое тождество ───────────────────────── */

const TOZHDESTVO = 'Основное логарифмическое тождество: $a^{\\log_{a}b} = b$.';

/** a^{k·log_a b}, k может быть отрицательным. */
function stepenSLog(a: number, k: number, b: number, kTex: string, zapis: string): Resh {
  const otvet = powQ(q(b), k);
  const iskhod = `${a}^{${kTex}\\log_{${a}}${b}}`;
  const etapy = [
    etap(
      'Вносим множитель под логарифм',
      'Множитель перед логарифмом — показатель степени аргумента: $k\\log_{a}b = \\log_{a}(b^{k})$.',
      `${iskhod} = ${a}^{\\log_{${a}}(${pw(b, k)})}`,
    ),
    etap(
      'Применяем тождество',
      TOZHDESTVO +
        (k < 0 ? ' Отрицательный показатель — дробь: $b^{-n} = \\dfrac{1}{b^{n}}$.' : ''),
      `${a}^{\\log_{${a}}(${pw(b, k)})} = ${pw(b, k)}${
        k < 0 ? ` = \\dfrac{1}{${pw(b, -k)}} = \\dfrac{1}{${texQ(powQ(q(b), -k))}}` : ''
      } = ${texQ(otvet)}`,
    ),
  ];
  const h = hesh(zapis);
  const hints: HintStep[] = [
    vopros(
      `Чему равно $${a}^{\\log_{${a}}${b}}$?`,
      f(String(b)),
      [f(String(a)), f(String(a * b))],
      h,
      TOZHDESTVO,
    ),
    vopros(
      'Чему равно значение выражения?',
      f(texQ(otvet)),
      [f(texQ(q(b * k))), f(texQ(powQ(q(b), -k))), f(texQ(powQ(q(a), k)))],
      h + 1,
      `$${pw(b, k)} = ${texQ(otvet)}$.`,
    ),
  ];
  return { otvet, etapy, hints };
}

/** a^{m + log_a b} и a^{(log_a b) − m}. */
function summaVPokazatele(a: number, m: number, b: number, iskhod: string, zapis: string): Resh {
  const am = powQ(q(a), m);
  const otvet = mul(am, q(b));
  const etapy = [
    etap(
      'Разбиваем показатель',
      m >= 0
        ? 'При умножении степеней показатели складываются, значит, $a^{x + y} = a^{x} \\cdot a^{y}$.'
        : 'При делении степеней показатели вычитаются, значит, $a^{x - y} = \\dfrac{a^{x}}{a^{y}}$.',
      m >= 0
        ? `${iskhod} = ${pw(a, m)} \\cdot ${a}^{\\log_{${a}}${b}}`
        : `${iskhod} = \\dfrac{${a}^{\\log_{${a}}${b}}}{${pw(a, -m)}}`,
    ),
    etap(
      'Применяем тождество',
      TOZHDESTVO,
      m >= 0
        ? `${pw(a, m)} \\cdot ${b} = ${texQ(am)} \\cdot ${b} = ${texQ(otvet)}`
        : `\\dfrac{${b}}{${pw(a, -m)}} = \\dfrac{${b}}{${texQ(powQ(q(a), -m))}} = ${texQ(otvet)}`,
    ),
  ];
  const h = hesh(zapis);
  const hints = [
    vopros(
      `Чему равно $${a}^{\\log_{${a}}${b}}$?`,
      f(String(b)),
      [f(String(a)), f(`\\log_{${a}}${b}`)],
      h,
      TOZHDESTVO,
    ),
    vopros(
      'Чему равно значение выражения?',
      f(texQ(otvet)),
      [f(texQ(add(q(b), q(m)))), f(texQ(add(am, q(b)))), f(texQ(mul(q(b), q(m))))],
      h + 1,
      m >= 0
        ? `$${texQ(am)} \\cdot ${b} = ${texQ(otvet)}$.`
        : `$${b} : ${texQ(powQ(q(a), -m))} = ${texQ(otvet)}$.`,
    ),
  ];
  return { otvet, etapy, hints };
}

const DCH = '(\\d+(?:,\\d+)?)';

export const VIDY_LOG: Vid[] = [
  {
    re: new RegExp(`^\\\\log_\\{(\\d+)\\}${DCH}([+-])\\\\log_\\{(\\d+)\\}${DCH}$`),
    reshit: (m, z) => {
      if (m[1] !== m[4]) throw new Error(`разные основания: «${z}»`);
      return summaLog(num(m[1]), m[2] ?? '', m[5] ?? '', m[3] === '-', z);
    },
  },
  {
    re: /^\\log_\{(\d+)\}\(\\log_\{(\d+)\}(\d+)(?:\+(\d+))?\)$/,
    reshit: (m, z) =>
      vlozhennyy(num(m[1]), num(m[2]), num(m[3]), m[4] === undefined ? null : num(m[4]), z),
  },
  {
    re: /^\\frac\{\\log_\{(\d+)\}\\left\((\d+)\^\{(\d+)\}\\right\)\}\{(\d+)\\log_\{(\d+)\}(\d+)\}$/,
    reshit: (m, z) => {
      if (m[1] !== m[5] || m[2] !== m[6]) throw new Error(`не то сокращение: «${z}»`);
      return vynosPokazatelya(num(m[1]), num(m[2]), num(m[3]), num(m[4]), z);
    },
  },
  {
    re: /^\\log_\{\\sqrt\{(\d+)\}\}(\d+)(?:\^\{(\d+)\})?$/,
    reshit: (m, z) => {
      const x = num(m[2]);
      const e = m[3] === undefined ? null : num(m[3]);
      return osnovanieKoren(num(m[1]), e === null ? String(x) : pw(x, e), powQ(q(x), e ?? 1), z);
    },
  },
  {
    re: /^(\d+)\^\{(-?)(\d*)\\log_\{(\d+)\}(\d+)\}$/,
    reshit: (m, z) => {
      if (m[1] !== m[4]) throw new Error(`разные основания: «${z}»`);
      const k = (m[2] === '-' ? -1 : 1) * (m[3] === '' ? 1 : num(m[3]));
      return stepenSLog(num(m[1]), k, num(m[5]), `${m[2] ?? ''}${m[3] ?? ''}`, z);
    },
  },
  {
    re: /^(\d+)\^\{(\d+)\+\\log_\{(\d+)\}(\d+)\}$/,
    reshit: (m, z) => {
      if (m[1] !== m[3]) throw new Error(`разные основания: «${z}»`);
      const a = num(m[1]);
      return summaVPokazatele(a, num(m[2]), num(m[4]), `${a}^{${m[2]} + \\log_{${a}}${m[4]}}`, z);
    },
  },
  {
    re: /^(\d+)\^\{\(\\log_\{(\d+)\}(\d+)\)-(\d+)\}$/,
    reshit: (m, z) => {
      if (m[1] !== m[2]) throw new Error(`разные основания: «${z}»`);
      const a = num(m[1]);
      return summaVPokazatele(a, -num(m[4]), num(m[3]), `${a}^{\\log_{${a}}${m[3]} - ${m[4]}}`, z);
    },
  },
];
