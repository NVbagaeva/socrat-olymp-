/**
 * Группа II — иррациональные уравнения (П-11 … П-14).
 *
 * Общий приём: возвести обе части в квадрат (в куб — для кубического
 * корня). Квадратный корень неотрицателен, поэтому у √A = B нужна
 * проверка B ≥ 0 — без неё в ответ попадает посторонний корень.
 */

import { kvadratQ } from '../../zadanie10/kit';
import {
  d,
  div,
  dr,
  hint,
  hintOtbor,
  koef,
  lin,
  linKoren,
  linReshenie,
  linVal,
  mul,
  num,
  podst,
  por,
  q,
  razbor,
  sk,
  t,
  uslovieTekst,
  val,
  voprosIz,
  vychDelenie,
  type Q,
} from '../kit';
import type { Prototype } from '../types';
import { ryadom } from './gruppa1';

/* ── П-11 √(kx + b) = c ────────────────────────────────────────── */

const P11: Prototype = {
  id: 'P11',
  no: 11,
  group: 'II',
  title: 'Квадратный корень равен числу',
  formula: '\\sqrt{kx+b}=c',
  skills: ['korni', 'perenos'],
  fipiNos: 'Блок 1, задание 3; подборка 10',
  uravnenie(p) {
    return `\\sqrt{${lin(num(p, 'k'), num(p, 'b'), 'x', por(p))}}=${d(num(p, 'c'))}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const k = num(p, 'k');
    const b = num(p, 'b');
    const c = num(p, 'c');
    return { lhs: (x) => Math.sqrt(k * x + b), rhs: () => c, odz: (x) => k * x + b >= 0 };
  },
  solve(p) {
    const k = num(p, 'k');
    const b = num(p, 'b');
    const c = num(p, 'c');
    const pr = por(p);
    const A = lin(k, b, 'x', pr);
    const c2 = c * c;
    const x = linKoren(k, b, q(c2));
    const ans = val(x);
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          `Иррациональное уравнение: квадратный корень равен числу. Справа $${d(c)}\\ge0$, поэтому обе части можно возвести в квадрат: $\\sqrt A=c\\iff A=c^2$ при $c\\ge0$.`,
        ],
        odz: [
          `Подкоренное выражение неотрицательно: $${A}\\ge0$. Отдельно решать неравенство не нужно: после возведения в квадрат $${A}=${d(c2)}>0$ — условие выполнится само.`,
        ],
        preobr: [
          `Возводим обе части в квадрат: $${A}=${d(c)}^2=${d(c2)}$.`,
          ...linReshenie(k, b, q(c2), pr),
        ],
        korni: [`$x=${t(x)}$.`],
        proverka: [`$\\sqrt{${podst(k, b, x, pr)}}=\\sqrt{${d(c2)}}=${d(c)}$ — верно.`],
        answer: ans,
      }),
      vychisleniya: [
        { tekst: 'Квадрат правой части:', tex: `${d(c)}^2=${d(c2)}` },
        ...(Math.abs(k) === 1 ? [] : vychDelenie(q(c2 - b), q(k))),
      ],
      hints: [
        hint(
          'Что сделать с корнем?',
          'возвести обе части в квадрат',
          [
            'извлечь корень из правой части',
            'возвести обе части в куб',
            'разделить обе части на корень',
          ],
          'Справа неотрицательное число — возводить в квадрат можно.',
        ),
        hint('Чему равно подкоренное выражение?', `$${d(c2)}$`, [
          `$${d(c)}$`,
          `$${d(2 * c)}$`,
          `$\\sqrt{${d(c)}}$`,
        ]),
        hint(`Чему равен $x$?`, `$${t(x)}$`, ryadom(x)),
      ],
    };
  },
};

/* ── П-12 ∛(x + a) = c ─────────────────────────────────────────── */

const P12: Prototype = {
  id: 'P12',
  no: 12,
  group: 'II',
  title: 'Кубический корень равен числу',
  formula: '\\sqrt[3]{x+a}=c',
  skills: ['korni', 'stepeni'],
  fipiNos: 'Блок 1, задание 4; подборка 14',
  uravnenie(p) {
    return `\\sqrt[3]{${lin(1, num(p, 'a'))}}=${d(num(p, 'c'))}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const a = num(p, 'a');
    const c = num(p, 'c');
    return { lhs: (x) => Math.cbrt(x + a), rhs: () => c, odz: () => true };
  },
  solve(p) {
    const a = num(p, 'a');
    const c = num(p, 'c');
    const A = lin(1, a);
    const c3 = c ** 3;
    const x = q(c3 - a);
    const ans = val(x);
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          'Кубический корень равен числу. Кубический корень есть у любого числа (и у отрицательного), поэтому ограничений нет: возводим обе части в куб.',
        ],
        preobr: [`$${A}=${sk(c)}^3=${d(c3)}$.`, ...linReshenie(1, a, q(c3))],
        korni: [`$x=${t(x)}$.`],
        proverka: [`$\\sqrt[3]{${podst(1, a, x)}}=\\sqrt[3]{${d(c3)}}=${d(c)}$ — верно.`],
        answer: ans,
      }),
      vychisleniya:
        Math.abs(c) === 1
          ? []
          : [
              {
                tekst: 'Куб правой части:',
                tex: `${sk(c)}^3=${sk(c)}\\cdot${sk(c)}\\cdot${sk(c)}=${d(c3)}`,
              },
            ],
      hints: [
        hint(
          'Что сделать с кубическим корнем?',
          'возвести обе части в куб',
          ['возвести обе части в квадрат', 'записать условие $x+a\\ge0$'],
          'Куб и кубический корень «отменяют» друг друга.',
        ),
        hint(
          'Нужно ли ограничение на подкоренное выражение?',
          'нет: кубический корень есть у любого числа',
          ['да: оно неотрицательно', 'да: оно положительно'],
        ),
        hint('Чему равно подкоренное выражение?', `$${d(c3)}$`, [`$${d(c * c)}$`, `$${d(3 * c)}$`]),
        hint(`Чему равен $x$?`, `$${t(x)}$`, ryadom(x)),
      ],
    };
  },
};

/* ── П-13 √(kx + b) = x, меньший корень ───────────────────────── */

const P13: Prototype = {
  id: 'P13',
  no: 13,
  group: 'II',
  title: 'Корень равен $x$: отбор по условию $x\\ge0$',
  formula: '\\sqrt{a+bx}=x',
  skills: ['korni', 'diskriminant'],
  fipiNos: 'Блок 2, задание 5; подборка 13',
  uravnenie(p) {
    return `\\sqrt{${lin(num(p, 'k'), num(p, 'b'), 'x', por(p))}}=x`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), this.vopros(p));
  },
  vopros: (p) => voprosIz(p, ['menshiy', 'bolshiy']),
  chisla(p) {
    const k = num(p, 'k');
    const b = num(p, 'b');
    return { lhs: (x) => Math.sqrt(k * x + b), rhs: (x) => x, odz: (x) => k * x + b >= 0 };
  },
  solve(p) {
    const k = num(p, 'k');
    const b = num(p, 'b');
    const pr = por(p);
    const v = this.vopros(p);
    const A = lin(k, b, 'x', pr);
    /* x² − kx − b = 0 */
    const kv = kvadratQ(q(1), q(-k), q(-b), 'x');
    const vse = kv.roots.map(val).sort((x, y) => x - y);
    if (vse[0] === vse[1]) {
      throw new Error('П-13: корни совпали');
    }
    const plohie = vse.filter((x) => x < 0);
    const horoshie = vse.filter((x) => x >= 0);
    if (horoshie.length === 0) {
      throw new Error('П-13: нет неотрицательных корней');
    }
    const ans =
      horoshie.length === 1
        ? (horoshie[0] as number)
        : v === 'menshiy'
          ? Math.min(...horoshie)
          : Math.max(...horoshie);
    const xa = q(ans);
    const kvTex = `x^2${-k < 0 ? '-' : '+'}${koef(Math.abs(k), 'x')}${-b < 0 ? '-' : '+'}${d(Math.abs(b))}=0`;
    const otbor =
      plohie.length > 0
        ? [
            ...plohie.map(
              (x) =>
                `$x=${d(x)}<0$ — не подходит: корень $\\sqrt{${A}}$ не бывает отрицательным. Это посторонний корень (он появился при возведении в квадрат: подставим — $\\sqrt{${podst(k, b, q(x), pr)}}=${d(-x)}\\ne${d(x)}$).`,
            ),
            `$x=${d(ans)}\\ge0$ — подходит. Корень один — его и записываем.`,
          ]
        : [
            `Оба корня неотрицательны — оба подходят (подкоренное выражение равно $x^2\\ge0$).`,
            `В ответ — ${v === 'menshiy' ? 'меньший' : 'больший'}: $${d(ans)}$.`,
          ];
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: vse,
      postoronnie: plohie,
      etapy: razbor({
        plan: [
          'Иррациональное уравнение: корень равен выражению с $x$. Корень неотрицателен, поэтому и правая часть должна быть неотрицательной: $\\sqrt A=B\\iff A=B^2$ и $B\\ge0$. План: возвести в квадрат, решить квадратное уравнение, отобрать корни с $x\\ge0$.',
        ],
        odz: [
          'Условие отбора: $x\\ge0$ (правая часть равна корню). Подкоренное выражение после возведения в квадрат равно $x^2\\ge0$ — его отдельно проверять не нужно.',
        ],
        preobr: [`Возводим в квадрат: $${A}=x^2$.`, `Переносим всё в одну часть: $${kvTex}$.`],
        korni: kv.lines.slice(kv.lines.findIndex((l) => l.startsWith('$D'))),
        otbor,
        proverka: [
          `$\\sqrt{${podst(k, b, xa, pr)}}=\\sqrt{${t(linVal(k, b, xa))}}=${d(ans)}$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: [
        {
          tekst:
            'Корни удобно проверить по теореме Виета: сумма равна второму коэффициенту с обратным знаком, произведение — свободному члену.',
          tex: `x_1+x_2=${d(k)},\\quad x_1x_2=${d(-b)}`,
        },
      ],
      hints: [
        hint('Что сделать с корнем?', 'возвести обе части в квадрат и запомнить условие $x\\ge0$', [
          'возвести обе части в квадрат — и всё',
          'извлечь корень из $x$',
        ]),
        hint('Какое квадратное уравнение получится?', `$${kvTex}$`, [
          `$x^2${k < 0 ? '-' : '+'}${koef(Math.abs(k), 'x')}${-b < 0 ? '-' : '+'}${d(Math.abs(b))}=0$`,
          `$x^2${-k < 0 ? '-' : '+'}${koef(Math.abs(k), 'x')}${b < 0 ? '-' : '+'}${d(Math.abs(b))}=0$`,
        ]),
        hint(
          'Какие корни у квадратного уравнения?',
          `$${d(vse[0] as number)}$ и $${d(vse[1] as number)}$`,
          [
            `$${d(-(vse[0] as number))}$ и $${d(-(vse[1] as number))}$`,
            `$${d(vse[0] as number)}$ и $${d(-(vse[1] as number))}$`,
          ],
        ),
        plohie.length > 0
          ? hint(
              `Подходит ли корень $x=${d(plohie[0] as number)}$?`,
              'нет: корень не может равняться отрицательному числу',
              ['да: он меньший', 'да: подкоренное выражение положительно'],
            )
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

/* ── П-14 √(c/(kx + b)) = d ────────────────────────────────────── */

/** Число под корнем справа: 0,4 или 1/8. */
function dTex(dq: Q, vid: string): string {
  if (vid === 'dec') {
    return t(dq);
  }
  return dq.m === 1 ? d(dq.n) : `\\dfrac{${d(dq.n)}}{${d(dq.m)}}`;
}

const P14: Prototype = {
  id: 'P14',
  no: 14,
  group: 'II',
  title: 'Корень из дроби равен числу',
  formula: '\\sqrt{\\dfrac{c}{kx+b}}=d',
  skills: ['korni', 'proporciya'],
  fipiNos: 'подборка 11, 12',
  uravnenie(p) {
    const dq = q(num(p, 'dn'), num(p, 'dm'));
    return `\\sqrt{\\dfrac{${d(num(p, 'c'))}}{${lin(num(p, 'k'), num(p, 'b'), 'x', por(p))}}}=${dTex(dq, String(p.dvid))}`;
  },
  uslovie(p) {
    return uslovieTekst(this.uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const c = num(p, 'c');
    const k = num(p, 'k');
    const b = num(p, 'b');
    const dd = num(p, 'dn') / num(p, 'dm');
    return {
      lhs: (x) => Math.sqrt(c / (k * x + b)),
      rhs: () => dd,
      odz: (x) => k * x + b !== 0 && c / (k * x + b) >= 0,
    };
  },
  solve(p) {
    const c = num(p, 'c');
    const k = num(p, 'k');
    const b = num(p, 'b');
    const pr = por(p);
    const dq = q(num(p, 'dn'), num(p, 'dm'));
    const vid = String(p.dvid);
    const D = dTex(dq, vid);
    const d2 = mul(dq, dq);
    const D2 = dTex(d2, vid);
    const A = lin(k, b, 'x', pr);
    const znach = div(q(c), d2);
    const x = linKoren(k, b, znach);
    const ans = val(x);
    return {
      answer: ans,
      uravnenie: this.uravnenie(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          `Иррациональное уравнение: корень из дроби равен числу $${D}\\ge0$. Возводим в квадрат, затем по правилу пропорции находим знаменатель.`,
        ],
        odz: [
          `Знаменатель не ноль, а дробь под корнем неотрицательна: $\\dfrac{${d(c)}}{${A}}\\ge0$, то есть $${A}>0$. Проверим это для найденного корня.`,
        ],
        preobr: [
          `Возводим обе части в квадрат: $\\dfrac{${d(c)}}{${A}}=${D2}$.`,
          `По правилу пропорции знаменатель равен $${d(c)}:${vid === 'dec' ? t(d2) : `${D2}`}$: $${A}=${dr(q(c), d2)}=${t(znach)}$.`,
          ...linReshenie(k, b, znach, pr),
        ],
        korni: [`$x=${t(x)}$.`],
        otbor: [`При $x=${t(x)}$: $${A}=${t(znach)}>0$ — корень входит в ОДЗ.`],
        proverka: [
          `$\\sqrt{\\dfrac{${d(c)}}{${podst(k, b, x, pr)}}}=\\sqrt{\\dfrac{${d(c)}}{${t(znach)}}}=${D}$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: [
        {
          tekst: 'Квадрат правой части:',
          tex: `${vid === 'dec' ? t(dq) : `\\left(${D}\\right)`}^2=${D2}`,
        },
        ...vychDelenie(q(c), d2, 'A'),
      ],
      hints: [
        hint('Что сделать с корнем?', 'возвести обе части в квадрат', [
          'извлечь корень из правой части',
          'перевернуть дробь под корнем',
        ]),
        hint('Чему равна дробь под корнем?', `$${D2}$`, [`$${D}$`, `$${t(mul(q(2), dq))}$`]),
        hint(`Чему равен знаменатель $${A}$?`, `$${t(znach)}$`, [
          `$${t(mul(q(c), d2))}$`,
          `$${t(div(q(c), dq))}$`,
        ]),
        hint(`Чему равен $x$?`, `$${t(x)}$`, ryadom(x)),
      ],
    };
  },
};

export const GRUPPA_II: Prototype[] = [P11, P12, P13, P14];
