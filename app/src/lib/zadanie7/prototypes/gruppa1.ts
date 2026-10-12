/**
 * Группа I — линейные, дробно-рациональные, степенные и квадратные
 * уравнения (П-01 … П-10).
 *
 * Общий приём: свести уравнение к линейному (перенос, пропорция,
 * извлечение корня) или к квадратному и не забыть про знаменатель.
 */

import { kvadratQ } from '../../zadanie10/kit';
import {
  add,
  d,
  div,
  dr,
  hint,
  hintOtbor,
  koef,
  koefQ,
  konechnaya,
  korenN,
  lin,
  linKoren,
  linReshenie,
  linVal,
  mul,
  num,
  podst,
  q,
  razbor,
  sk,
  stepenTex,
  sub,
  t,
  tk,
  uslovieTekst,
  val,
  voprosIz,
  vychDelenie,
  type Q,
} from '../kit';
import type { Params, Prototype } from '../types';

/* ── Общее ──────────────────────────────────────────────────────── */

/** Число-дробь из параметров: n/m. */
function drob(p: Params, n: string, m: string): Q {
  return q(num(p, n), num(p, m));
}

/** Правая часть-дробь в TeX: «5», «\dfrac{1}{3}», «-\dfrac{2}{5}», «0{,}4». */
function chisloTex(x: Q, vid: 'drob' | 'dec' = 'drob'): string {
  if (x.m === 1) {
    return d(x.n);
  }
  if (vid === 'dec' && konechnaya(x)) {
    return t(x);
  }
  return `${x.n < 0 ? '-' : ''}\\dfrac{${d(Math.abs(x.n))}}{${d(x.m)}}`;
}

/** Смешанное число: «3\dfrac{7}{9}». */
function smeshTex(w: number, rn: number, rm: number): string {
  if (rn === 0) {
    return d(w);
  }
  return `${w === 0 ? '' : d(w)}\\dfrac{${d(rn)}}{${d(rm)}}`;
}

/** Неверные варианты для «чему равен x»: противоположный, на единицу больше, обратный. */
export function ryadom(x: Q): string[] {
  const out = [t(q(-x.n, x.m)), t(add(x, q(1))), t(sub(x, q(2)))];
  if (x.n !== 0) {
    out.push(t(q(x.m, x.n)));
  }
  return out.map((s) => `$${s}$`);
}

/** Значение «x ≠ …» из знаменателя kx + b. */
function nePriX(k: number, b: number): string {
  return `x\\ne${chisloTex(q(-b, k))}`;
}

/* ── П-01 1/(kx+b) = c ──────────────────────────────────────────── */

const P01: Prototype = {
  id: 'P01',
  no: 1,
  group: 'I',
  title: 'Единица, делённая на линейное выражение',
  formula: '\\dfrac{1}{kx+b}=c',
  skills: ['proporciya', 'perenos'],
  fipiNos: 'Блок 1, задание 1; Блок 2, задание 2; подборка 6, 8',
  uravnenie(p) {
    const c = drob(p, 'cn', 'cm');
    return `\\dfrac{1}{${lin(num(p, 'k'), num(p, 'b'))}}=${chisloTex(c)}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const k = num(p, 'k');
    const b = num(p, 'b');
    const c = num(p, 'cn') / num(p, 'cm');
    return { lhs: (x) => 1 / (k * x + b), rhs: () => c, odz: (x) => k * x + b !== 0 };
  },
  solve(p) {
    const k = num(p, 'k');
    const b = num(p, 'b');
    const c = drob(p, 'cn', 'cm');
    const A = lin(k, b);
    const obr = q(c.m, c.n);
    const x = linKoren(k, b, obr);
    const ans = val(x);
    const znam = linVal(k, b, x);
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          `Дробно-рациональное уравнение: дробь с единицей в числителе равна числу. Если $\\dfrac{1}{A}=c$, то $A=\\dfrac{1}{c}$ — знаменатель равен числу, обратному правой части. Дальше — линейное уравнение.`,
        ],
        odz: [`Знаменатель не равен нулю: $${A}\\ne0$, то есть $${nePriX(k, b)}$.`],
        preobr: [
          `По правилу пропорции $${chisloTex(c)}\\cdot(${A})=1$, то есть знаменатель равен числу, обратному $${chisloTex(c)}$: $${A}=${chisloTex(obr, 'dec')}$.`,
          ...linReshenie(k, b, obr),
        ],
        korni: [`$x=${t(x)}$.`],
        otbor: [`При $x=${t(x)}$ знаменатель равен $${t(znam)}\\ne0$ — корень входит в ОДЗ.`],
        proverka: [
          `$\\dfrac{1}{${podst(k, b, x)}}=\\dfrac{1}{${t(znam)}}=${chisloTex(c)}$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: vychDelenie(sub(obr, q(b)), q(k)),
      hints: [
        hint(
          `Что следует из равенства $\\dfrac{1}{A}=${chisloTex(c)}$?`,
          `$A=${chisloTex(obr)}$`,
          [
            `$A=${chisloTex(c)}$`,
            `$A=${chisloTex(q(-c.n, c.m))}$`,
            `$A=${chisloTex(q(-obr.n, obr.m))}$`,
          ],
          'Знаменатель равен числу, обратному правой части.',
        ),
        hint(`Какое линейное уравнение получилось?`, `$${A}=${chisloTex(obr, 'dec')}$`, [
          `$${A}=${chisloTex(c, 'dec')}$`,
          `$${A}=1$`,
          `$${A}=0$`,
        ]),
        hint(`Чему равен $x$?`, `$${t(x)}$`, ryadom(x)),
        hint(`Подходит ли корень по ОДЗ?`, `да: знаменатель $${t(znam)}\\ne0$`, [
          'нет: знаменатель равен нулю',
          'нет: корень отрицательный',
        ]),
      ],
    };
  },
};

/* ── П-02 (x + a)ⁿ = b, n нечётное ─────────────────────────────── */

const P02: Prototype = {
  id: 'P02',
  no: 2,
  group: 'I',
  title: 'Нечётная степень линейного выражения',
  formula: '(x+a)^n=b,\\ n\\ \\text{нечётное}',
  skills: ['stepeni', 'perenos'],
  fipiNos: 'Блок 1, задание 2; подборка 5',
  uravnenie(p) {
    return `(${lin(1, num(p, 'a'))})^${num(p, 'n')}=${d(num(p, 'b'))}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const a = num(p, 'a');
    const n = num(p, 'n');
    const b = num(p, 'b');
    return { lhs: (x) => (x + a) ** n, rhs: () => b, odz: () => true };
  },
  solve(p) {
    const a = num(p, 'a');
    const n = num(p, 'n');
    const b = num(p, 'b');
    const r = korenN(b, n);
    if (r === null) {
      throw new Error(`${b} — не ${n}-я степень целого`);
    }
    const x = q(r - a);
    const ans = val(x);
    const A = lin(1, a);
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          `Степенное уравнение $t^${n}=${d(b)}$, где $t=${A}$. Степень $${n}$ нечётная: каждое число получается в нечётной степени ровно из одного основания, поэтому корень один — корень $${n}$-й степени из $${d(b)}$.`,
        ],
        preobr: [
          `Представим правую часть степенью: $${d(b)}=${stepenTex(r, n)}$.`,
          `Значит, $${A}=${d(r)}$${b < 0 ? ' (корень нечётной степени из отрицательного числа — отрицательное число)' : ''}.`,
          ...linReshenie(1, a, q(r)),
        ],
        korni: [`$x=${t(x)}$ — единственный корень.`],
        proverka: [`$(${podst(1, a, x)})^${n}=${stepenTex(r, n)}=${d(b)}$ — верно.`],
        answer: ans,
      }),
      vychisleniya: [
        {
          tekst: `Ищем основание перебором: $${d(Math.abs(r))}^${n}=${d(Math.abs(r) ** n)}$.`,
        },
      ],
      hints: [
        hint(
          `Какое число в ${n}-й степени даёт $${d(b)}$?`,
          `$${d(r)}$`,
          [`$${d(-r)}$`, `$${d(r + 1)}$`, `$${d(Math.abs(b) / 2)}$`],
          b < 0 ? 'Нечётная степень отрицательного числа отрицательна.' : undefined,
        ),
        hint(
          `Сколько корней у уравнения $t^${n}=${d(b)}$?`,
          'один',
          ['два', 'ни одного'],
          'У нечётной степени два разных основания не дают одно и то же число.',
        ),
        hint(`Какое уравнение получилось?`, `$${A}=${d(r)}$`, [
          `$${A}=${d(-r)}$`,
          `$${A}=${d(b)}$`,
        ]),
        hint(`Чему равен $x$?`, `$${t(x)}$`, ryadom(x)),
      ],
    };
  },
};

/* ── П-03 (p/q)·x = смешанное число ────────────────────────────── */

const P03: Prototype = {
  id: 'P03',
  no: 3,
  group: 'I',
  title: 'Дробный коэффициент и смешанное число',
  formula: '\\dfrac{p}{q}\\,x=m\\dfrac{r}{s}',
  skills: ['perenos', 'proporciya'],
  fipiNos: 'Блок 2, задание 1 (1–6); подборка 1',
  uravnenie(p) {
    const kn = num(p, 'kn');
    const km = num(p, 'km');
    const z = num(p, 'z');
    const pr = smeshTex(num(p, 'w'), num(p, 'rn'), num(p, 'rm'));
    return `${kn < 0 ? '-' : ''}\\dfrac{${d(Math.abs(kn))}}{${d(km)}}x=${z < 0 ? '-' : ''}${pr}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const k = num(p, 'kn') / num(p, 'km');
    const c = num(p, 'z') * (num(p, 'w') + num(p, 'rn') / num(p, 'rm'));
    return { lhs: (x) => k * x, rhs: () => c, odz: () => true };
  },
  solve(p) {
    const kn = num(p, 'kn');
    const km = num(p, 'km');
    const z = num(p, 'z');
    const w = num(p, 'w');
    const rn = num(p, 'rn');
    const rm = num(p, 'rm');
    const k = q(kn, km);
    const chisl = w * rm + rn;
    const c = q(z * chisl, rm);
    const x = div(c, k);
    const ans = val(x);
    const kTex = `${kn < 0 ? '-' : ''}\\dfrac{${d(Math.abs(kn))}}{${d(km)}}`;
    const obr = `${kn < 0 ? '-' : ''}\\dfrac{${d(km)}}{${d(Math.abs(kn))}}`;
    const cNepr = `${z < 0 ? '-' : ''}\\dfrac{${d(chisl)}}{${d(rm)}}`;
    const smesh = smeshTex(w, rn, rm);
    const lozh = q(w * rn, rm);
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          `Линейное уравнение $kx=c$ с дробным коэффициентом $k=${kTex}$. План: перевести смешанное число в неправильную дробь и разделить обе части на коэффициент — то есть умножить на перевёрнутую дробь $${obr}$.`,
        ],
        preobr: [
          w === 0
            ? `Правая часть уже обыкновенная дробь: $${cNepr}$.`
            : `Смешанное число $${smesh}$ — это сумма $${d(w)}+\\dfrac{${d(rn)}}{${d(rm)}}$, а не произведение: $${smesh}=\\dfrac{${d(w)}\\cdot${d(rm)}+${d(rn)}}{${d(rm)}}=\\dfrac{${d(chisl)}}{${d(rm)}}$.`,
          `Уравнение: $${kTex}x=${cNepr}$.`,
          `Умножаем обе части на $${obr}$: $x=${cNepr}\\cdot${obr.replace(/^-/, '')}${kn < 0 ? '\\cdot(-1)' : ''}$.`,
        ],
        korni: [
          `$x=${z * kn < 0 ? '-' : ''}\\dfrac{${d(chisl)}\\cdot${d(km)}}{${d(rm)}\\cdot${d(Math.abs(kn))}}=${t(x)}$.`,
        ],
        proverka: [`$${kTex}\\cdot${tk(x)}=${cNepr}=${z < 0 ? '-' : ''}${smesh}$ — верно.`],
        answer: ans,
      }),
      vychisleniya: vychDelenie(q(z * Math.sign(kn) * chisl * km), q(rm * Math.abs(kn))),
      hints: [
        ...(w === 0
          ? []
          : [
              hint(
                `Как записать $${smesh}$ неправильной дробью?`,
                `$\\dfrac{${d(chisl)}}{${d(rm)}}$`,
                [
                  `$${chisloTex(lozh)}$`,
                  `$\\dfrac{${d(w + rn)}}{${d(rm)}}$`,
                  `$\\dfrac{${d(chisl)}}{${d(rm * w)}}$`,
                ],
                'Смешанное число — сумма целой и дробной части: целую часть умножаем на знаменатель и прибавляем числитель.',
              ),
            ]),
        hint(
          `На какое число умножить обе части, чтобы слева остался $x$?`,
          `$${obr}$`,
          [`$${kTex}$`, `$${d(km)}$`, `$${obr.startsWith('-') ? obr.slice(1) : `-${obr}`}$`],
          'Умножение на перевёрнутую дробь — это деление на коэффициент.',
        ),
        hint(
          `Какой знак будет у ответа?`,
          ans < 0 ? 'минус' : 'плюс',
          [ans < 0 ? 'плюс' : 'минус', 'ответ равен нулю'],
          'Знаки коэффициента и правой части: одинаковые — плюс, разные — минус.',
        ),
        hint(`Чему равен $x$?`, `$${t(x)}$`, ryadom(x)),
      ],
    };
  },
};

/* ── П-04 1/(ax + b) = 1/(cx + d) ──────────────────────────────── */

const P04: Prototype = {
  id: 'P04',
  no: 4,
  group: 'I',
  title: 'Две дроби с единицей в числителе',
  formula: '\\dfrac{1}{ax+b}=\\dfrac{1}{cx+d}',
  skills: ['proporciya', 'perenos'],
  fipiNos: 'Блок 2, задание 1 (7–12)',
  uravnenie(p) {
    return `\\dfrac{1}{${lin(num(p, 'a'), num(p, 'b'))}}=\\dfrac{1}{${lin(num(p, 'c'), num(p, 'dd'))}}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const [a, b, c, dd] = ['a', 'b', 'c', 'dd'].map((k) => num(p, k)) as [
      number,
      number,
      number,
      number,
    ];
    return {
      lhs: (x) => 1 / (a * x + b),
      rhs: (x) => 1 / (c * x + dd),
      odz: (x) => a * x + b !== 0 && c * x + dd !== 0,
    };
  },
  solve(p) {
    const [a, b, c, dd] = ['a', 'b', 'c', 'dd'].map((k) => num(p, k)) as [
      number,
      number,
      number,
      number,
    ];
    const A = lin(a, b);
    const B = lin(c, dd);
    const x = q(dd - b, a - c);
    const ans = val(x);
    const v1 = linVal(a, b, x);
    const v2 = linVal(c, dd, x);
    const kx = a - c;
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          'Две дроби с одинаковыми числителями равны — значит, равны и знаменатели (по правилу пропорции $A=B$). План: записать ОДЗ, приравнять знаменатели, решить линейное уравнение и проверить, что знаменатели не обращаются в ноль.',
        ],
        odz: [`$${A}\\ne0$ и $${B}\\ne0$, то есть $${nePriX(a, b)}$ и $${nePriX(c, dd)}$.`],
        preobr: [
          `Приравниваем знаменатели: $${A}=${B}$.`,
          `Слагаемые с $x$ — влево, числа — вправо (при переносе знак меняется): $${koef(a, 'x')}-${koef(c, 'x')}=${d(dd)}-${d(b)}$.`,
          kx === 1
            ? `$x=${t(x)}$.`
            : `$${koef(kx, 'x')}=${d(dd - b)}$, $x=${dr(q(dd - b), q(kx))}=${t(x)}$.`,
        ],
        korni: [`$x=${t(x)}$.`],
        otbor: [
          `При $x=${t(x)}$: $${A}=${t(v1)}\\ne0$ и $${B}=${t(v2)}\\ne0$ — корень входит в ОДЗ.`,
        ],
        proverka: [
          `Левая часть $\\dfrac{1}{${podst(a, b, x)}}=${chisloTex(div(q(1), v1))}$, правая $\\dfrac{1}{${podst(c, dd, x)}}=${chisloTex(div(q(1), v2))}$ — равны.`,
        ],
        answer: ans,
      }),
      vychisleniya: kx === 1 || kx === -1 ? [] : vychDelenie(q(dd - b), q(kx)),
      hints: [
        hint(
          'Что следует из равенства $\\dfrac{1}{A}=\\dfrac{1}{B}$?',
          '$A=B$',
          ['$A=-B$', '$A\\cdot B=1$', '$A+B=0$'],
          'Числители равны, значит, равны и знаменатели.',
        ),
        hint('Какое уравнение получится?', `$${A}=${B}$`, [`$${A}=-(${B})$`, `$${A}=1$`]),
        hint(`Чему равен $x$?`, `$${t(x)}$`, ryadom(x)),
        hint(
          'Не обращается ли знаменатель в ноль при найденном $x$?',
          `нет: знаменатели равны $${t(v1)}$`,
          ['да, корень надо отбросить', 'это проверять не нужно'],
        ),
      ],
    };
  },
};

/* ── П-05 (ax + b)² = (ax + c)² ────────────────────────────────── */

const P05: Prototype = {
  id: 'P05',
  no: 5,
  group: 'I',
  title: 'Равные квадраты',
  formula: '(ax+b)^2=(ax+c)^2',
  skills: ['stepeni', 'perenos'],
  fipiNos: 'Блок 2, задание 3; подборка 2',
  uravnenie(p) {
    const a = num(p, 'a');
    return `(${lin(a, num(p, 'b'))})^2=(${lin(a, num(p, 'c'))})^2`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    return { lhs: (x) => (a * x + b) ** 2, rhs: (x) => (a * x + c) ** 2, odz: () => true };
  },
  solve(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    const A = lin(a, b);
    const B = lin(a, c);
    const minusB = lin(-a, -c);
    const x = q(-(b + c), 2 * a);
    const ans = val(x);
    const vA = linVal(a, b, x);
    const vB = linVal(a, c, x);
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          'Квадраты двух выражений равны. Значит, сами выражения либо равны, либо противоположны: $A^2=B^2\\iff A=B$ или $A=-B$. Раскрывать скобки не обязательно.',
        ],
        preobr: [
          `Случай $A=B$: $${A}=${B}$, отсюда $${d(b)}=${d(c)}$ — неверно. В этом случае корней нет.`,
          `Случай $A=-B$: $${A}=-(${B})$, то есть $${A}=${minusB}$.`,
          `Переносим: $${koef(a, 'x')}+${koef(a, 'x')}=${d(-c)}-${d(b)}$, $${koef(2 * a, 'x')}=${d(-c - b)}$, $x=${dr(q(-c - b), q(2 * a))}=${t(x)}$.`,
        ],
        korni: [`$x=${t(x)}$ — единственный корень.`],
        proverka: [
          `$(${podst(a, b, x)})^2=${tk(vA)}^2=${t(mul(vA, vA))}$ и $(${podst(a, c, x)})^2=${tk(vB)}^2=${t(mul(vB, vB))}$ — равны.`,
        ],
        answer: ans,
      }),
      vychisleniya: vychDelenie(q(-c - b), q(2 * a)),
      hints: [
        hint(
          'Если $A^2=B^2$, то…',
          '$A=B$ или $A=-B$',
          ['только $A=B$', '$A=B^2$', '$A=\\sqrt B$'],
          'Например, $3^2=(-3)^2$.',
        ),
        hint(`Что даёт случай $${A}=${B}$?`, 'неверное числовое равенство — корней нет', [
          'любое $x$ — корень',
          '$x=0$',
        ]),
        hint('Какое уравнение даёт случай $A=-B$?', `$${A}=${minusB}$`, [
          `$${A}=${B}$`,
          `$${A}=${lin(-a, c)}$`,
        ]),
        hint(`Чему равен $x$?`, `$${t(x)}$`, ryadom(x)),
      ],
    };
  },
};

/* ── П-06 (x + a)² = 4a·x — единственный корень ───────────────── */

const P06: Prototype = {
  id: 'P06',
  no: 6,
  group: 'I',
  title: 'Квадрат суммы равен $bx$',
  formula: '(x+a)^2=bx',
  skills: ['diskriminant', 'stepeni'],
  fipiNos: 'Блок 2, задание 4; подборка 3',
  uravnenie(p) {
    const a = num(p, 'a');
    return `(${lin(1, a)})^2=${koef(4 * a, 'x')}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const a = num(p, 'a');
    return { lhs: (x) => (x + a) ** 2, rhs: (x) => 4 * a * x, odz: () => true };
  },
  solve(p) {
    const a = num(p, 'a');
    const x = q(a);
    const ans = a;
    const kv = `x^2${a < 0 ? '-' : '+'}${koef(Math.abs(2 * a), 'x')}+${d(a * a)}`;
    const itog = `x^2${a < 0 ? '+' : '-'}${koef(Math.abs(2 * a), 'x')}+${d(a * a)}`;
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          'После раскрытия скобок получится квадратное уравнение. План: раскрыть квадрат суммы, перенести всё влево, увидеть полный квадрат (или найти дискриминант).',
        ],
        preobr: [
          `Квадрат суммы: $(${lin(1, a)})^2=${kv}$.`,
          `Уравнение: $${kv}=${koef(4 * a, 'x')}$. Переносим $${koef(4 * a, 'x')}$ влево: $${itog}=0$.`,
          `Это полный квадрат: $${itog}=(${lin(1, -a)})^2$.`,
        ],
        korni: [
          `$(${lin(1, -a)})^2=0$, значит $${lin(1, -a)}=0$ и $x=${d(a)}$. Корень один — дискриминант равен нулю: $D=${sk(2 * a)}^2-4\\cdot${d(a * a)}=0$.`,
        ],
        proverka: [
          `$(${podst(1, a, x)})^2=${d(4 * a * a)}$ и $${d(4 * a)}\\cdot${sk(a)}=${d(4 * a * a)}$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: [
        { tekst: 'Квадрат суммы:', tex: `(x+y)^2=x^2+2xy+y^2` },
        {
          tekst: 'Удвоенное произведение:',
          tex: `2\\cdot x\\cdot${sk(a)}=${koef(2 * a, 'x')}`,
        },
      ],
      hints: [
        hint(
          `Как раскрыть $(${lin(1, a)})^2$?`,
          `$${kv}$`,
          [`$x^2+${d(a * a)}$`, `$x^2${a < 0 ? '-' : '+'}${koef(Math.abs(a), 'x')}+${d(a * a)}$`],
          'Не забываем удвоенное произведение.',
        ),
        hint('Какое уравнение получится после переноса?', `$${itog}=0$`, [
          `$${kv}=0$`,
          `$x^2${a < 0 ? '-' : '+'}${koef(Math.abs(6 * a), 'x')}+${d(a * a)}=0$`,
        ]),
        hint('Сколько корней у этого уравнения?', 'один: это полный квадрат', ['два', 'ни одного']),
        hint(`Чему равен $x$?`, `$${d(a)}$`, ryadom(x)),
      ],
    };
  },
};

/* ── П-07 k·x² = c, меньший / больший корень ───────────────────── */

const P07: Prototype = {
  id: 'P07',
  no: 7,
  group: 'I',
  title: 'Неполное квадратное $kx^2=c$',
  formula: 'kx^2=c',
  skills: ['korni', 'diskriminant'],
  fipiNos: 'подборка 4',
  uravnenie(p) {
    const kn = num(p, 'kn');
    const km = num(p, 'km');
    const k = km === 1 ? koef(kn, 'x^2') : `\\dfrac{${d(kn)}}{${d(km)}}x^2`;
    return `${k}=${smeshTex(num(p, 'cw'), num(p, 'cn'), num(p, 'cm'))}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), this.vopros(p));
  },
  vopros: (p) => voprosIz(p, ['menshiy', 'bolshiy']),
  chisla(p) {
    const k = num(p, 'kn') / num(p, 'km');
    const c = num(p, 'cw') + num(p, 'cn') / num(p, 'cm');
    return { lhs: (x) => k * x * x, rhs: () => c, odz: () => true };
  },
  solve(p) {
    const kn = num(p, 'kn');
    const km = num(p, 'km');
    const cw = num(p, 'cw');
    const cn = num(p, 'cn');
    const cm = num(p, 'cm');
    const v = this.vopros(p);
    const k = q(kn, km);
    const c = q(cw * cm + cn, cm);
    const x2 = div(c, k);
    const sn = korenN(x2.n, 2);
    const sm = korenN(x2.m, 2);
    if (sn === null || sm === null) {
      throw new Error('x² — не квадрат дроби');
    }
    const s = q(sn, sm);
    const ans = v === 'menshiy' ? -val(s) : val(s);
    const kTex = km === 1 ? d(kn) : `\\dfrac{${d(kn)}}{${d(km)}}`;
    const cTex = smeshTex(cw, cn, cm);
    const cNepr = cm === 1 ? d(cw) : `\\dfrac{${d(cw * cm + cn)}}{${d(cm)}}`;
    const obr = km === 1 ? `\\dfrac{1}{${d(kn)}}` : `\\dfrac{${d(km)}}{${d(kn)}}`;
    const x2Tex = x2.m === 1 ? d(x2.n) : `\\dfrac{${d(x2.n)}}{${d(x2.m)}}`;
    const sTex = s.m === 1 ? d(s.n) : `\\dfrac{${d(s.n)}}{${d(s.m)}}`;
    const minus = q(-s.n, s.m);
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: [val(minus), val(s)],
      postoronnie: [],
      etapy: razbor({
        plan: [
          'Неполное квадратное уравнение $kx^2=c$: выразим $x^2$ и извлечём корень. При $x^2=m$, $m>0$, корней два: $\\sqrt m$ и $-\\sqrt m$.',
        ],
        preobr: [
          ...(cm === 1 || cn === 0
            ? []
            : [
                `Смешанное число — в неправильную дробь: $${cTex}=\\dfrac{${d(cw)}\\cdot${d(cm)}+${d(cn)}}{${d(cm)}}=${cNepr}$.`,
              ]),
          `Делим обе части на $${kTex}$ (умножаем на $${obr}$): $x^2=${cNepr}\\cdot${obr}=${x2Tex}$.`,
        ],
        korni: [`$x=\\pm\\sqrt{${x2Tex}}=\\pm${sTex}$, то есть $x_1=${t(minus)}$, $x_2=${t(s)}$.`],
        otbor: [`Корней два, в ответ — ${v === 'menshiy' ? 'меньший' : 'больший'}: $${d(ans)}$.`],
        proverka: [`$${kTex}\\cdot${tk(q(ans))}^2=${kTex}\\cdot${t(x2)}=${cTex}$ — верно.`],
        answer: ans,
      }),
      vychisleniya: vychDelenie(c, k),
      hints: [
        hint('Что сделать сначала?', 'выразить $x^2$: разделить на коэффициент', [
          'извлечь корень из обеих частей сразу',
          'перенести всё влево и раскрыть скобки',
        ]),
        hint('Чему равно $x^2$?', `$${x2Tex}$`, [`$${cNepr}$`, `$${t(mul(c, k))}$`]),
        hint('Сколько корней у уравнения?', `два: $\\pm${sTex}$`, [`один: $${sTex}$`, 'ни одного']),
        hintOtbor(v, `$${d(ans)}$`, [`$${d(-ans)}$`, `$${t(x2)}$`]),
      ],
    };
  },
};

/* ── П-08 (px + q)/(rx + s) = c ────────────────────────────────── */

const P08: Prototype = {
  id: 'P08',
  no: 8,
  group: 'I',
  title: 'Дробь с $x$ в числителе и знаменателе',
  formula: '\\dfrac{px+q}{rx+s}=c',
  skills: ['proporciya', 'perenos'],
  fipiNos: 'подборка 7',
  uravnenie(p) {
    return `\\dfrac{${lin(num(p, 'p'), num(p, 'qq'))}}{${lin(num(p, 'r'), num(p, 's'))}}=${chisloTex(drob(p, 'cn', 'cm'), 'dec')}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const [pp, qq, r, s] = ['p', 'qq', 'r', 's'].map((k) => num(p, k)) as [
      number,
      number,
      number,
      number,
    ];
    const c = num(p, 'cn') / num(p, 'cm');
    return { lhs: (x) => (pp * x + qq) / (r * x + s), rhs: () => c, odz: (x) => r * x + s !== 0 };
  },
  solve(p) {
    const [pp, qq, r, s] = ['p', 'qq', 'r', 's'].map((k) => num(p, k)) as [
      number,
      number,
      number,
      number,
    ];
    const c = drob(p, 'cn', 'cm');
    const cTex = chisloTex(c, 'dec');
    const Ch = lin(pp, qq);
    const Zn = lin(r, s);
    const cr = mul(c, q(r));
    const cs = mul(c, q(s));
    const kx = sub(q(pp), cr);
    const pr = sub(cs, q(qq));
    const x = div(pr, kx);
    const ans = val(x);
    const vZn = linVal(r, s, x);
    const vCh = linVal(pp, qq, x);
    const pravaya =
      c.n === 1 && c.m === 1
        ? Zn
        : `${koefQ(cr, 'x')}${cs.n < 0 ? '-' : '+'}${t(q(Math.abs(cs.n), cs.m))}`;
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          'Дробно-рациональное уравнение: дробь равна числу. План: записать ОДЗ (знаменатель не ноль), умножить обе части на знаменатель («крест-накрест»), решить линейное уравнение и сверить корень с ОДЗ.',
        ],
        odz: [`$${Zn}\\ne0$, то есть $${nePriX(r, s)}$.`],
        preobr: [
          `Умножаем обе части на $${Zn}$ — на ОДЗ он не равен нулю, поэтому корни не потеряются и не появятся: $${Ch}=${c.n === 1 && c.m === 1 ? Zn : `${cTex}(${Zn})`}$.`,
          ...(c.n === 1 && c.m === 1 ? [] : [`Раскрываем скобки: $${Ch}=${pravaya}$.`]),
          `Слагаемые с $x$ — влево, числа — вправо: $${koef(pp, 'x')}-${koefQ(cr, 'x')}=${t(cs)}-${d(qq)}$, то есть $${koefQ(kx, 'x')}=${t(pr)}$.`,
        ],
        korni: [kx.n === kx.m ? `$x=${t(x)}$.` : `$x=${dr(pr, kx)}=${t(x)}$.`],
        otbor: [`При $x=${t(x)}$ знаменатель $${Zn}=${t(vZn)}\\ne0$ — корень входит в ОДЗ.`],
        proverka: [
          `$\\dfrac{${podst(pp, qq, x)}}{${podst(r, s, x)}}=\\dfrac{${t(vCh)}}{${t(vZn)}}=${cTex}$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: vychDelenie(pr, kx),
      hints: [
        hint(
          'Какое ограничение на $x$ нужно записать?',
          `$${Zn}\\ne0$`,
          [`$${Ch}\\ne0$`, `$${Zn}>0$`],
          'Делить на ноль нельзя — ограничение даёт знаменатель.',
        ),
        hint('Что сделать с дробью?', `умножить обе части на $${Zn}$`, [
          `умножить обе части на $${Ch}$`,
          'приравнять числитель к нулю',
        ]),
        hint(`Чему равен $x$?`, `$${t(x)}$`, ryadom(x)),
        hint('Подходит ли корень по ОДЗ?', `да: знаменатель $${t(vZn)}\\ne0$`, [
          'нет: знаменатель равен нулю',
          'нет: корень отрицательный',
        ]),
      ],
    };
  },
};

/* ── Квадратное уравнение: корни и строки ──────────────────────── */

/** Корни x² + Bx + C = 0 по дискриминанту + строка Виета (если корни целые). */
function kvadratStroki(B: number, C: number): { lines: string[]; roots: [Q, Q] } {
  const r = kvadratQ(q(1), q(B), q(C), 'x');
  const lines = [...r.lines];
  const [r1, r2] = r.roots;
  if (r1.m === 1 && r2.m === 1 && r1.n !== r2.n) {
    lines.push(
      `Проверка по теореме Виета: сумма корней $${t(r1)}+${tk(r2)}=${d(-B)}$ — второй коэффициент с обратным знаком, произведение корней равно $${t(mul(r1, r2))}$ — свободному члену.`,
    );
  }
  return { lines, roots: [r1, r2] };
}

/** Подстановка в x² + Bx + C: «5^2-8\cdot5+15». */
function podstKv(B: number, C: number, x: Q): string {
  const bx =
    B === 0
      ? ''
      : B === 1
        ? `+${tk(x)}`
        : B === -1
          ? `-${tk(x)}`
          : `${B < 0 ? '-' : '+'}${d(Math.abs(B))}\\cdot${tk(x)}`;
  const c = C === 0 ? '' : `${C < 0 ? '-' : '+'}${d(Math.abs(C))}`;
  return `${tk(x)}^2${bx}${c}`;
}

/* ── П-09 x = (ax + b)/(x + c) ─────────────────────────────────── */

const P09: Prototype = {
  id: 'P09',
  no: 9,
  group: 'I',
  title: '$x$ равен дроби с $x$ в знаменателе',
  formula: 'x=\\dfrac{ax+b}{x+c}',
  skills: ['proporciya', 'diskriminant'],
  fipiNos: 'подборка 9',
  uravnenie(p) {
    return `x=\\dfrac{${lin(num(p, 'a'), num(p, 'b'))}}{${lin(1, num(p, 'c'))}}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), this.vopros(p));
  },
  vopros: (p) => voprosIz(p, ['bolshiy', 'menshiy']),
  chisla(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    return { lhs: (x) => x, rhs: (x) => (a * x + b) / (x + c), odz: (x) => x + c !== 0 };
  },
  solve(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    const v = this.vopros(p);
    const Zn = lin(1, c);
    const B = c - a;
    const C = -b;
    const { lines, roots } = kvadratStroki(B, C);
    const [r1, r2] = roots;
    const vse = [val(r1), val(r2)];
    const plohie = vse.filter((x) => x === -c);
    const horoshie = vse.filter((x) => x !== -c);
    if (horoshie.length === 0 || new Set(vse).size !== 2) {
      throw new Error('П-09: нужны два разных корня, хотя бы один в ОДЗ');
    }
    const ans =
      horoshie.length === 1
        ? (horoshie[0] as number)
        : v === 'menshiy'
          ? Math.min(...horoshie)
          : Math.max(...horoshie);
    const xa = q(ans);
    const vZn = add(xa, q(c));
    const otbor: string[] =
      plohie.length > 0
        ? [
            `$x=${d(-c)}$ обращает знаменатель $${Zn}$ в ноль — это посторонний корень, он не входит в ОДЗ.`,
            `Остаётся один корень $x=${d(ans)}$ — его и записываем${v === 'menshiy' ? ' (сравнивать «меньший» не с чем)' : ' (сравнивать «больший» не с чем)'}.`,
          ]
        : [
            `Оба корня не равны $${d(-c)}$ — оба входят в ОДЗ.`,
            `В ответ — ${v === 'menshiy' ? 'меньший' : 'больший'}: $${d(ans)}$.`,
          ];
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: vse.sort((x, y) => x - y),
      postoronnie: plohie,
      etapy: razbor({
        plan: [
          'Дробно-рациональное уравнение, после умножения на знаменатель — квадратное. План: ОДЗ, умножить на знаменатель, решить квадратное уравнение, отбросить корни вне ОДЗ, выбрать нужный.',
        ],
        odz: [`$${Zn}\\ne0$, то есть $x\\ne${d(-c)}$.`],
        preobr: [
          `Умножаем обе части на $${Zn}$ (на ОДЗ он не ноль): $x(${Zn})=${lin(a, b)}$.`,
          `Раскрываем скобки и переносим всё влево: $x^2${c < 0 ? '-' : '+'}${koef(Math.abs(c), 'x')}-${koef(a, 'x')}-${d(b)}=0$, то есть $x^2${B === 0 ? '' : `${B < 0 ? '-' : '+'}${koef(Math.abs(B), 'x')}`}${C === 0 ? '' : `${C < 0 ? '-' : '+'}${d(Math.abs(C))}`}=0$.`,
        ],
        korni: lines,
        otbor,
        proverka: [
          `$\\dfrac{${podst(a, b, xa)}}{${podst(1, c, xa)}}=\\dfrac{${t(linVal(a, b, xa))}}{${t(vZn)}}=${d(ans)}$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: [
        {
          tekst:
            'Удобно проверить корни по теореме Виета: их сумма равна второму коэффициенту с обратным знаком, произведение — свободному члену.',
        },
      ],
      hints: [
        hint('Какое ограничение на $x$ нужно записать?', `$x\\ne${d(-c)}$`, [
          `$x\\ne${d(c)}$`,
          '$x>0$',
        ]),
        hint(
          'Какое квадратное уравнение получится?',
          `$x^2${B === 0 ? '' : `${B < 0 ? '-' : '+'}${koef(Math.abs(B), 'x')}`}${C === 0 ? '' : `${C < 0 ? '-' : '+'}${d(Math.abs(C))}`}=0$`,
          [
            `$x^2${c - a + 2 * a === 0 ? '' : `${c + a < 0 ? '-' : '+'}${koef(Math.abs(c + a), 'x')}`}${C === 0 ? '' : `${C < 0 ? '-' : '+'}${d(Math.abs(C))}`}=0$`,
            `$x^2${B === 0 ? '' : `${B < 0 ? '-' : '+'}${koef(Math.abs(B), 'x')}`}${-C === 0 ? '' : `${-C < 0 ? '-' : '+'}${d(Math.abs(C))}`}=0$`,
          ],
        ),
        hint('Какие корни у квадратного уравнения?', `$${t(r1)}$ и $${t(r2)}$`, [
          `$${t(q(-r1.n, r1.m))}$ и $${t(q(-r2.n, r2.m))}$`,
          `$${t(r1)}$ и $${t(q(-r2.n, r2.m))}$`,
        ]),
        plohie.length > 0
          ? hint(`Подходит ли корень $x=${d(-c)}$ по ОДЗ?`, 'нет: знаменатель обращается в ноль', [
              'да: подходит',
              'да, если он меньший',
            ])
          : hintOtbor(
              v,
              `$${d(ans)}$`,
              vse
                .filter((x) => x !== ans)
                .map((x) => `$${d(x)}$`)
                .concat([`$${d(-ans)}$`]),
            ),
      ],
    };
  },
};

/* ── П-10 x² + px + q = 0 ──────────────────────────────────────── */

const P10: Prototype = {
  id: 'P10',
  no: 10,
  group: 'I',
  title: 'Квадратное уравнение, меньший или больший корень',
  formula: 'x^2+px+q=0',
  skills: ['diskriminant'],
  fipiNos: '',
  uravnenie(p) {
    const B = num(p, 'p');
    const C = num(p, 'qq');
    return `x^2${B === 0 ? '' : `${B < 0 ? '-' : '+'}${koef(Math.abs(B), 'x')}`}${C === 0 ? '' : `${C < 0 ? '-' : '+'}${d(Math.abs(C))}`}=0`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), this.vopros(p));
  },
  vopros: (p) => voprosIz(p, ['menshiy', 'bolshiy']),
  chisla(p) {
    const B = num(p, 'p');
    const C = num(p, 'qq');
    return { lhs: (x) => x * x + B * x + C, rhs: () => 0, odz: () => true };
  },
  solve(p) {
    const B = num(p, 'p');
    const C = num(p, 'qq');
    const v = this.vopros(p);
    const { lines, roots } = kvadratStroki(B, C);
    const vse = roots.map(val).sort((x, y) => x - y);
    if (vse[0] === vse[1]) {
      throw new Error('П-10: корни совпали');
    }
    const ans = (v === 'menshiy' ? vse[0] : vse[1]) as number;
    const drugoy = (v === 'menshiy' ? vse[1] : vse[0]) as number;
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: vse,
      postoronnie: [],
      etapy: razbor({
        plan: [
          'Приведённое квадратное уравнение (коэффициент при $x^2$ равен $1$). План: найти корни по формуле через дискриминант (или подобрать по теореме Виета) и выбрать нужный.',
        ],
        preobr: [`Коэффициенты: $a=1$, $b=${d(B)}$, $c=${d(C)}$.`],
        korni: lines,
        otbor: [
          `Корней два: $${d(vse[0] as number)}$ и $${d(vse[1] as number)}$. В ответ — ${v === 'menshiy' ? 'меньший' : 'больший'}: $${d(ans)}$.`,
        ],
        proverka: [`$${podstKv(B, C, q(ans))}=0$ — верно.`],
        answer: ans,
      }),
      vychisleniya: [
        {
          tekst:
            'По теореме Виета корни приведённого уравнения дают в сумме второй коэффициент с обратным знаком, а в произведении — свободный член:',
          tex: `x_1+x_2=${d(-B)},\\quad x_1x_2=${d(C)}`,
        },
      ],
      hints: [
        hint(
          'Чему равен дискриминант?',
          `$${d(B * B - 4 * C)}$`,
          [`$${d(B * B + 4 * C)}$`, `$${d(B * B - 2 * C)}$`],
          'Формула: $D=b^2-4ac$.',
        ),
        hint('Какие корни у уравнения?', `$${d(vse[0] as number)}$ и $${d(vse[1] as number)}$`, [
          `$${d(-(vse[0] as number))}$ и $${d(-(vse[1] as number))}$`,
          `$${d(vse[0] as number)}$ и $${d(-(vse[1] as number))}$`,
        ]),
        hintOtbor(v, `$${d(ans)}$`, [`$${d(drugoy)}$`, `$${d(-ans)}$`]),
      ],
    };
  },
};

export const GRUPPA_I: Prototype[] = [P01, P02, P03, P04, P05, P06, P07, P08, P09, P10];
