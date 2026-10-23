/**
 * Группа IV — логарифмические уравнения (П-20 … П-25, П-30).
 *
 * Общий приём: по определению логарифма $\log_a A=c\iff A=a^c$ или по
 * равенству логарифмов с одним основанием $\log_aA=\log_aB\iff A=B>0$.
 * ОДЗ: аргумент положителен, основание положительно и не равно $1$.
 */

import {
  d,
  hint,
  hintOtbor,
  lin,
  linKoren,
  linReshenie,
  linVal,
  num,
  podst,
  por,
  pw,
  q,
  razbor,
  t,
  uslovieTekst,
  val,
  voprosIz,
  vychDelenie,
  type Q,
} from '../kit';
import type { Params, Prototype, Solved } from '../types';
import { ryadom } from './gruppa1';

/** Логарифм по основанию a: «\log_7», «\log_{12}», «\lg». */
export function logTex(a: number): string {
  if (a === 10) {
    return '\\lg';
  }
  return a < 10 ? `\\log_${a}` : `\\log_{${a}}`;
}

/** Логарифм по основанию 1/a. */
function logObrTex(a: number): string {
  return `\\log_{\\frac{1}{${d(a)}}}`;
}

/** Степень числа как дробь: a^c при любом целом c. */
function stepenQ(a: number, c: number): Q {
  return c >= 0 ? q(a ** c) : q(1, a ** -c);
}

/** Аргумент логарифма из параметров: k, b, por. */
function arg(p: Params): { k: number; b: number; pr: 'xb' | 'bx'; A: string } {
  const k = num(p, 'k');
  const b = num(p, 'b');
  const pr = por(p);
  return { k, b, pr, A: lin(k, b, 'x', pr) };
}

/** Строки ОДЗ / отбора / проверки, общие для «аргумент = число». */
function linLog(
  p: Params,
  uravnenie: string,
  plan: string[],
  perehod: string[],
  znach: Q,
  proverka: (x: Q) => string,
  hints: Solved['hints'],
): Solved {
  const { k, b, pr, A } = arg(p);
  const x = linKoren(k, b, znach);
  const ans = val(x);
  return {
    answer: ans,
    uravnenie,
    korni: [ans],
    postoronnie: [],
    etapy: razbor({
      plan,
      odz: [`Аргумент логарифма положителен: $${A}>0$. Проверим это для найденного корня.`],
      preobr: [...perehod, ...linReshenie(k, b, znach, pr)],
      korni: [`$x=${t(x)}$.`],
      otbor: [`При $x=${t(x)}$ аргумент $${A}=${t(linVal(k, b, x))}>0$ — корень входит в ОДЗ.`],
      proverka: [proverka(x)],
      answer: ans,
    }),
    vychisleniya: Math.abs(k) === 1 ? [] : vychDelenie(q(znach.n - b * znach.m, znach.m), q(k)),
    hints: [...hints, hint('Чему равен $x$?', `$${t(x)}$`, ryadom(x))],
  };
}

function hintOdz(A: string): Solved['hints'][number] {
  return hint(
    'Какое условие — ОДЗ этого уравнения?',
    `$${A}>0$`,
    [`$${A}\\ge0$`, `$${A}\\ne0$`, 'ограничений нет'],
    'Логарифм есть только у положительных чисел.',
  );
}

/* ── П-20 logₐ(kx + b) = logₐc ─────────────────────────────────── */

const P20: Prototype = {
  id: 'P20',
  no: 20,
  group: 'IV',
  title: 'Логарифмы с одним основанием равны',
  formula: '\\log_a(x+b)=\\log_a c',
  skills: ['log-svoystva', 'perenos'],
  fipiNos: 'Блок 1, задание 9; подборка 22',
  uravnenie(p) {
    const L = logTex(num(p, 'a'));
    return `${L}(${arg(p).A})=${L} ${d(num(p, 'c'))}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const { k, b } = arg(p);
    const a = num(p, 'a');
    const c = num(p, 'c');
    return {
      lhs: (x) => Math.log(k * x + b) / Math.log(a),
      rhs: () => Math.log(c) / Math.log(a),
      odz: (x) => k * x + b > 0,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const c = num(p, 'c');
    const { k, b, pr, A } = arg(p);
    const L = logTex(a);
    return linLog(
      p,
      this.uravnenie(p),
      [
        'Логарифмы с одинаковым основанием равны — значит, равны и выражения под ними, если они положительны: $\\log_aA=\\log_aB\\iff A=B>0$.',
      ],
      [`Приравниваем аргументы: $${A}=${d(c)}$.`],
      q(c),
      (x) => `$${L}(${podst(k, b, x, pr)})=${L} ${d(c)}$ — верно.`,
      [
        hint('Что следует из равенства $\\log_aA=\\log_aB$?', '$A=B$, причём $A>0$', [
          '$A=a^B$',
          '$A=B^a$',
          '$A=-B$',
        ]),
        hint('Какое уравнение получится?', `$${A}=${d(c)}$`, [
          `$${A}=${d(a)}^{${d(c)}}$`,
          `$${A}=${d(a * c)}$`,
        ]),
        hintOdz(A),
      ],
    );
  },
};

/* ── П-21 logₐ(kx + b) = c, в том числе lg ─────────────────────── */

const P21: Prototype = {
  id: 'P21',
  no: 21,
  group: 'IV',
  title: 'Логарифм равен числу',
  formula: '\\log_a(kx+b)=c',
  skills: ['log-opredelenie', 'perenos'],
  fipiNos: 'Блок 1, задание 10; Блок 2, задание 7, З8; подборка 20',
  uravnenie(p) {
    return `${logTex(num(p, 'a'))}(${arg(p).A})=${d(num(p, 'c'))}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const { k, b } = arg(p);
    const a = num(p, 'a');
    const c = num(p, 'c');
    return {
      lhs: (x) => Math.log(k * x + b) / Math.log(a),
      rhs: () => c,
      odz: (x) => k * x + b > 0,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const c = num(p, 'c');
    const { k, b, pr, A } = arg(p);
    const L = logTex(a);
    const z = stepenQ(a, c);
    const st = pw(d(a), String(c));
    return linLog(
      p,
      this.uravnenie(p),
      [
        `Логарифм равен числу. По определению логарифма $\\log_aA=c$ означает $A=a^c$: логарифм — это показатель, в который нужно возвести основание, чтобы получить $A$.${a === 10 ? ' Здесь $\\lg$ — десятичный логарифм, основание $10$.' : ''}`,
      ],
      [`По определению логарифма: $${A}=${c === 1 ? d(a) : `${st}=${t(z)}`}$.`],
      z,
      (x) =>
        `$${L}(${podst(k, b, x, pr)})=${L} ${t(z)}=${d(c)}$, так как $${c === 1 ? `${d(a)}=${d(a)}` : `${st}=${t(z)}`}$ — верно.`,
      [
        hint(
          `Что означает запись $${L}(${A})=${d(c)}$?`,
          `$${A}=${pw(d(a), String(c))}$`,
          [`$${A}=${pw(d(c), String(a))}$`, `$${A}=${d(a * c)}$`, `$${A}=${d(c)}$`],
          'Логарифм — показатель степени.',
        ),
        hint(`Чему равно $${A}$?`, `$${t(z)}$`, [`$${d(a * c)}$`, `$${d(c ** a)}$`]),
        hintOdz(A),
      ],
    );
  },
};

/* ── П-22 log_{1/a}(kx + b) = c ────────────────────────────────── */

const P22: Prototype = {
  id: 'P22',
  no: 22,
  group: 'IV',
  title: 'Логарифм по основанию $\\dfrac{1}{a}$',
  formula: '\\log_{\\frac{1}{a}}(kx+b)=c',
  skills: ['log-opredelenie', 'stepeni'],
  fipiNos: 'подборка 21',
  uravnenie(p) {
    return `${logObrTex(num(p, 'a'))}(${arg(p).A})=${d(num(p, 'c'))}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const { k, b } = arg(p);
    const a = num(p, 'a');
    const c = num(p, 'c');
    return {
      lhs: (x) => Math.log(k * x + b) / Math.log(1 / a),
      rhs: () => c,
      odz: (x) => k * x + b > 0,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const c = num(p, 'c');
    const { k, b, pr, A } = arg(p);
    const z = stepenQ(a, -c);
    const L = logObrTex(a);
    const drob = `\\left(\\dfrac{1}{${d(a)}}\\right)`;
    return linLog(
      p,
      this.uravnenie(p),
      [
        'Логарифм по основанию-дроби равен числу. По определению $\\log_bA=c\\iff A=b^c$; дробь в степени удобно перевернуть: $\\left(\\dfrac{1}{a}\\right)^c=a^{-c}$.',
      ],
      [`По определению логарифма: $${A}=${pw(drob, String(c))}=${pw(d(a), String(-c))}=${t(z)}$.`],
      z,
      (x) =>
        `$${L}(${podst(k, b, x, pr)})=${L} ${t(z)}=${d(c)}$, так как $${pw(drob, String(c))}=${t(z)}$ — верно.`,
      [
        hint(`Что означает запись $${L}(${A})=${d(c)}$?`, `$${A}=${pw(drob, String(c))}$`, [
          `$${A}=${pw(d(a), String(c))}$`,
          `$${A}=${pw(d(c), '\\frac{1}{' + d(a) + '}')}$`,
        ]),
        hint(
          `Чему равно $${pw(drob, String(c))}$?`,
          `$${t(z)}$`,
          [`$${t(stepenQ(a, c))}$`, `$${t(q(-z.n, z.m))}$`],
          'Перевернём дробь и сменим знак показателя: $\\left(\\dfrac{1}{a}\\right)^c=a^{-c}$.',
        ),
        hintOdz(A),
      ],
    );
  },
};

/* ── П-23 logₐ(kx + b) = m·logₐc ───────────────────────────────── */

const P23: Prototype = {
  id: 'P23',
  no: 23,
  group: 'IV',
  title: 'Множитель перед логарифмом справа',
  formula: '\\log_a(b-x)=2\\log_a c',
  skills: ['log-svoystva', 'stepeni'],
  fipiNos: 'подборка 23',
  uravnenie(p) {
    const L = logTex(num(p, 'a'));
    return `${L}(${arg(p).A})=${d(num(p, 'm'))}${L} ${d(num(p, 'c'))}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const { k, b } = arg(p);
    const a = num(p, 'a');
    const m = num(p, 'm');
    const c = num(p, 'c');
    return {
      lhs: (x) => Math.log(k * x + b) / Math.log(a),
      rhs: () => (m * Math.log(c)) / Math.log(a),
      odz: (x) => k * x + b > 0,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const m = num(p, 'm');
    const c = num(p, 'c');
    const { k, b, pr, A } = arg(p);
    const L = logTex(a);
    const cm = c ** m;
    return linLog(
      p,
      this.uravnenie(p),
      [
        'Справа множитель перед логарифмом. По свойству логарифма степени его можно внести в показатель: $m\\log_ac=\\log_ac^m$. Дальше — равенство логарифмов с одним основанием.',
      ],
      [
        `Вносим множитель в показатель: $${d(m)}${L} ${d(c)}=${L} ${d(c)}^${d(m)}=${L} ${d(cm)}$.`,
        `Уравнение: $${L}(${A})=${L} ${d(cm)}$, приравниваем аргументы: $${A}=${d(cm)}$.`,
      ],
      q(cm),
      (x) => `$${L}(${podst(k, b, x, pr)})=${L} ${d(cm)}=${d(m)}${L} ${d(c)}$ — верно.`,
      [
        hint(
          `Как записать $${d(m)}${L} ${d(c)}$ одним логарифмом?`,
          `$${L} ${d(cm)}$`,
          [`$${L} ${d(m * c)}$`, `$${L} ${d(m + c)}$`, `$${pw(`(${L} ${d(c)})`, d(m))}$`],
          'Множитель перед логарифмом уходит в показатель аргумента.',
        ),
        hint('Какое уравнение получится?', `$${A}=${d(cm)}$`, [
          `$${A}=${d(m * c)}$`,
          `$${A}=${d(c)}$`,
        ]),
        hintOdz(A),
      ],
    );
  },
};

/* ── П-24 a^(log_{aʲ}(kx + b)) = m ──────────────────────────────── */

const P24: Prototype = {
  id: 'P24',
  no: 24,
  group: 'IV',
  title: 'Основное логарифмическое тождество',
  formula: 'a^{\\log_{a^k}(bx+c)}=m',
  skills: ['log-svoystva', 'korni'],
  fipiNos: 'Блок 2, задание 9 (1–6); подборка 24',
  uravnenie(p) {
    const a = num(p, 'a');
    const j = num(p, 'j');
    return `${d(a)}^{${logTex(a ** j)}(${arg(p).A})}=${d(num(p, 'm'))}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const { k, b } = arg(p);
    const a = num(p, 'a');
    const B = a ** num(p, 'j');
    const m = num(p, 'm');
    return {
      lhs: (x) => a ** (Math.log(k * x + b) / Math.log(B)),
      rhs: () => m,
      odz: (x) => k * x + b > 0,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const j = num(p, 'j');
    const m = num(p, 'm');
    const { k, b, pr, A } = arg(p);
    const B = a ** j;
    const LB = logTex(B);
    const La = logTex(a);
    const mj = m ** j;
    const koren = j === 2 ? `\\sqrt{${A}}` : `\\sqrt[${j}]{${A}}`;
    const stepen = j === 2 ? 'квадрат' : j === 3 ? 'куб' : `${j}-ю степень`;
    return linLog(
      p,
      this.uravnenie(p),
      [
        `Основание логарифма — степень основания степени: $${d(B)}=${pw(d(a), String(j))}$. По свойству $\\log_{a^k}A=\\dfrac{1}{k}\\log_aA$ и основному логарифмическому тождеству $a^{\\log_aA}=A$ левая часть превращается в корень $${j}$-й степени из $A$.`,
      ],
      [
        `$${LB}(${A})=\\dfrac{1}{${j}}${La}(${A})$, поэтому $${d(a)}^{${LB}(${A})}=\\left(${d(a)}^{${La}(${A})}\\right)^{\\frac{1}{${j}}}=(${A})^{\\frac{1}{${j}}}=${koren}$.`,
        `Уравнение: $${koren}=${d(m)}$. Возводим в ${stepen}: $${A}=${pw(d(m), String(j))}=${d(mj)}$.`,
      ],
      q(mj),
      (x) =>
        `$${d(a)}^{${LB}(${podst(k, b, x, pr)})}=${d(a)}^{${LB} ${d(mj)}}=${koren.replace(A, d(mj))}=${d(m)}$ — верно.`,
      [
        hint(`Как связаны основания $${d(B)}$ и $${d(a)}$?`, `$${d(B)}=${pw(d(a), String(j))}$`, [
          `$${d(B)}=${d(a)}\\cdot${d(j)}$`,
          `$${d(a)}=${pw(d(B), String(j))}$`,
        ]),
        hint(
          'Чему равна левая часть?',
          `$${koren}$`,
          [`$${A}$`, `$${pw(`(${A})`, String(j))}$`],
          'Основное тождество $a^{\\log_aA}=A$, а множитель $\\dfrac{1}{k}$ даёт корень.',
        ),
        hint(`Чему равно $${A}$?`, `$${d(mj)}$`, [`$${d(m)}$`, `$${d(m * j)}$`]),
        hintOdz(A),
      ],
    );
  },
};

/* ── П-25 log_{aʲ}(a^(kx + b)) = m ──────────────────────────────── */

const P25: Prototype = {
  id: 'P25',
  no: 25,
  group: 'IV',
  title: 'Логарифм степени того же числа',
  formula: '\\log_{a^k}a^{bx+c}=m',
  skills: ['log-svoystva', 'perenos'],
  fipiNos: 'Блок 2, задание 9 (7–12)',
  uravnenie(p) {
    const a = num(p, 'a');
    const j = num(p, 'j');
    return `${logTex(a ** j)} ${pw(d(a), arg(p).A)}=${d(num(p, 'm'))}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const { k, b } = arg(p);
    const a = num(p, 'a');
    const B = a ** num(p, 'j');
    const m = num(p, 'm');
    return {
      lhs: (x) => ((k * x + b) * Math.log(a)) / Math.log(B),
      rhs: () => m,
      odz: () => true,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const j = num(p, 'j');
    const m = num(p, 'm');
    const { k, b, pr, A } = arg(p);
    const B = a ** j;
    const LB = logTex(B);
    const jm = j * m;
    const x = linKoren(k, b, q(jm));
    const ans = val(x);
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          `Под логарифмом — степень того же числа, что и в основании: $${d(B)}=${pw(d(a), String(j))}$. По свойствам $\\log_{a^k}a^E=\\dfrac{E}{k}\\log_aa=\\dfrac{E}{k}$ — логарифм превращается в линейное выражение.`,
        ],
        odz: [
          `Аргумент $${pw(d(a), A)}$ положителен при любом $x$ (степень положительного числа), основание $${d(B)}>0$, $${d(B)}\\ne1$ — ограничений на $x$ нет.`,
        ],
        preobr: [
          `$${LB} ${pw(d(a), A)}=\\dfrac{${A}}{${d(j)}}\\cdot${logTex(a)} ${d(a)}=\\dfrac{${A}}{${d(j)}}$.`,
          `Уравнение: $\\dfrac{${A}}{${d(j)}}=${d(m)}$, умножаем обе части на $${d(j)}$: $${A}=${d(jm)}$.`,
          ...linReshenie(k, b, q(jm), pr),
        ],
        korni: [`$x=${t(x)}$.`],
        proverka: [
          `$${LB} ${pw(d(a), podst(k, b, x, pr))}=${LB} ${pw(d(a), d(jm))}=\\dfrac{${d(jm)}}{${d(j)}}=${d(m)}$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: Math.abs(k) === 1 ? [] : vychDelenie(q(jm - b), q(k)),
      hints: [
        hint(`Как связаны основания $${d(B)}$ и $${d(a)}$?`, `$${d(B)}=${pw(d(a), String(j))}$`, [
          `$${d(B)}=${d(a)}\\cdot${d(j)}$`,
          `$${d(a)}=${pw(d(B), String(j))}$`,
        ]),
        hint(
          `Чему равен $${LB} ${pw(d(a), 'E')}$?`,
          `$\\dfrac{E}{${d(j)}}$`,
          [`$${d(j)}E$`, '$E$', `$E^{${d(j)}}$`],
          'Показатель выносим вперёд, а логарифм по основанию $a^k$ делится на $k$.',
        ),
        hint('Какое уравнение получится?', `$${A}=${d(jm)}$`, [
          `$${A}=${d(m)}$`,
          `$${A}=${t(q(m, j))}$`,
        ]),
        hint('Чему равен $x$?', `$${t(x)}$`, ryadom(x)),
      ],
    };
  },
};

/* ── П-30 log_{x+a} N = 2 — основание с x ──────────────────────── */

const P30: Prototype = {
  id: 'P30',
  no: 30,
  group: 'IV',
  title: '$x$ в основании логарифма',
  formula: '\\log_{x+a}N=2',
  skills: ['log-opredelenie', 'korni'],
  fipiNos: '',
  uravnenie(p) {
    return `\\log_{${lin(1, num(p, 'a'))}}${d(num(p, 'N'))}=2`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), this.vopros(p));
  },
  vopros: (p) => voprosIz(p, ['menshiy', 'bolshiy']),
  chisla(p) {
    const a = num(p, 'a');
    const N = num(p, 'N');
    return {
      lhs: (x) => Math.log(N) / Math.log(x + a),
      rhs: () => 2,
      odz: (x) => x + a > 0 && x + a !== 1,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const N = num(p, 'N');
    const v = this.vopros(p);
    const s = Math.round(Math.sqrt(N));
    const B = lin(1, a);
    const x1 = s - a;
    const x2 = -s - a;
    const ans = x1;
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: [x2, x1],
      postoronnie: [x2],
      etapy: razbor({
        plan: [
          'В основании логарифма — выражение с $x$. По определению $\\log_BN=2$ означает $B^2=N$, причём основание логарифма положительно и не равно единице. План: ОДЗ, определение логарифма, квадратное уравнение, отбор по ОДЗ.',
        ],
        odz: [`$${B}>0$ и $${B}\\ne1$, то есть $x>${d(-a)}$ и $x\\ne${d(1 - a)}$.`],
        preobr: [
          `По определению логарифма: $(${B})^2=${d(N)}$.`,
          `Число в квадрате равно $${d(N)}$ — это $${d(s)}$ или $${d(-s)}$: $${B}=${d(s)}$ или $${B}=${d(-s)}$.`,
        ],
        korni: [`$x=${d(x1)}$ или $x=${d(x2)}$.`],
        otbor: [
          `$x=${d(x2)}$: основание $${B}=${d(-s)}<0$ — не входит в ОДЗ, это посторонний корень.`,
          `$x=${d(x1)}$: основание $${d(s)}>0$ и $${d(s)}\\ne1$ — подходит. Корень один — сравнивать «${v === 'menshiy' ? 'меньший' : 'больший'}» не с чем.`,
        ],
        proverka: [`$\\log_{${d(s)}}${d(N)}=2$, так как $${d(s)}^2=${d(N)}$ — верно.`],
        answer: ans,
      }),
      vychisleniya: [
        { tekst: 'Квадратный корень из правой части:', tex: `\\sqrt{${d(N)}}=${d(s)}` },
      ],
      hints: [
        hint('Какие условия накладывает основание логарифма?', `$${B}>0$ и $${B}\\ne1$`, [
          `$${B}\\ge0$`,
          `$${B}\\ne0$`,
          'никаких',
        ]),
        hint('Что означает запись $\\log_BN=2$?', '$B^2=N$', ['$N^2=B$', '$2^B=N$', '$B=2N$']),
        hint('Какие корни у уравнения после перехода?', `$${d(x1)}$ и $${d(x2)}$`, [
          `$${d(x1)}$`,
          `$${d(-x1)}$ и $${d(-x2)}$`,
        ]),
        hintOtbor(
          v,
          `$${d(ans)}$`,
          [`$${d(x2)}$`, `$${d(Math.min(x1, x2))}$`],
          'Отрицательное основание логарифма не бывает.',
        ),
      ],
    };
  },
};

export const GRUPPA_IV: Prototype[] = [P20, P21, P22, P23, P24, P25, P30];
