/**
 * Прототипы раздела «Ежемесячные варианты» для задания №10. В реестр
 * PROTOTYPES не входят — в банк, тренажёр и «Собрать вариант» не
 * попадают; числа и текст условия задаёт вариант. Разбор — теми же
 * кирпичами, что у прототипов раздела (kit.ts): «Дано», этапы,
 * подсказки с кнопками.
 */

import { div, mul, sub } from '../../zadanie11/num';
import { chtoNayti, d, dano, fq, num, q, razbor, val, vopros, type Q } from '../kit';
import type { Prototype } from '../types';

/** Табличные углы 0…180° по косинусу. */
const UGOL_PO_COS: Record<string, { u: number; tex: string }> = {
  '1/1': { u: 0, tex: '1' },
  '1/2': { u: 60, tex: '\\dfrac12' },
  '0/1': { u: 90, tex: '0' },
  '-1/2': { u: 120, tex: '-\\dfrac12' },
  '-1/1': { u: 180, tex: '-1' },
};

/** Табличные острые углы по квадрату синуса. */
const UGOL_PO_SIN2: Record<string, { u: number; tex: string }> = {
  '1/4': { u: 30, tex: '\\dfrac{1}{2}' },
  '1/2': { u: 45, tex: '\\dfrac{\\sqrt{2}}{2}' },
  '3/4': { u: 60, tex: '\\dfrac{\\sqrt{3}}{2}' },
};

const kl = (x: Q) => `${x.n}/${x.m}`;

/** k√m в TeX. */
function kKoren(k: number, m: number): string {
  if (m === 1) return d(k);
  return `${k === 1 ? '' : d(k)}\\sqrt{${m}}`;
}

/* ── Высота полёта по углу броска: угол по известной высоте ─────── */

/**
 * H = v₀²/(4g)·(1 − cos 2α): мяч поднялся ровно на H — найти острый
 * угол α. Подвох — найти 2α и забыть поделить на 2.
 */
export const EV10_VYSOTA_UGOL: Prototype = {
  id: 'EV10-VYSOTA-UGOL',
  no: 201,
  group: 'V',
  title: 'Бросок под углом: угол по наибольшей высоте',
  formula: 'H=\\dfrac{v_0^2}{4g}(1-\\cos2\\alpha)',
  ask: 'острый угол броска по наибольшей высоте подъёма',
  skills: ['trigonometriya'],
  fipiNos: '',
  alt: 'Мяч летит по дуге после удара вратаря',
  solve(p) {
    const v0 = num(p, 'v0');
    const g = num(p, 'g');
    const H = num(p, 'H');
    const c = sub(q(1), div(mul(q(4 * g), q(H)), q(v0 * v0)));
    const u = UGOL_PO_COS[kl(c)];
    if (u === undefined || u.u === 0 || u.u === 180)
      throw new Error(`EV10-VYSOTA-UGOL: cos2α = ${fq(c)} — не табличный`);
    const ans = u.u / 2;
    const dn = [
      dano('v_0', v0, 'м/с', 'начальная скорость'),
      dano('g', g, 'м/с²', 'ускорение свободного падения'),
      dano('H', H, 'м', 'наибольшая высота'),
    ];
    return {
      answer: ans,
      iskomoe: '\\alpha',
      edinicy: '°',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Подставляем числа: $\\dfrac{${d(v0)}^2}{4\\cdot${d(g)}}(1-\\cos2\\alpha)=${d(H)}$, то есть $${fq(div(q(v0 * v0), q(4 * g)))}(1-\\cos2\\alpha)=${d(H)}$.`,
        ],
        vid: 'uravnenie',
        reshaem: [
          `$1-\\cos2\\alpha=\\dfrac{${d(H)}}{${fq(div(q(v0 * v0), q(4 * g)))}}=${fq(sub(q(1), c))}$, $\\cos2\\alpha=${u.tex}$.`,
          `Угол $\\alpha$ острый, значит, $0^\\circ<2\\alpha<180^\\circ$, и $2\\alpha=${u.u}^\\circ$.`,
        ],
        koren: [`Спрашивают $\\alpha$, а не $2\\alpha$: $\\alpha=${u.u}^\\circ:2=${ans}^\\circ$.`],
        proverka: [
          `Чем круче удар, тем выше летит мяч; при $\\alpha=90^\\circ$ высота была бы $\\dfrac{${d(v0)}^2}{2\\cdot${d(g)}}=${fq(div(q(v0 * v0), q(2 * g)))}$ м — больше $${d(H)}$ м, так и должно быть.`,
        ],
        answer: ans,
        ed: '°',
      }),
      vychisleniya: [
        {
          tekst: 'Множитель перед скобкой:',
          tex: `\\dfrac{${d(v0 * v0)}}{${d(4 * g)}}=${fq(div(q(v0 * v0), q(4 * g)))}`,
        },
        { tekst: 'Табличное значение:', tex: `\\cos${u.u}^\\circ=${u.tex}` },
      ],
      hints: [
        chtoNayti('угол $\\alpha$', ['угол $2\\alpha$', 'наибольшую высоту']),
        vopros('Чему равен $\\cos2\\alpha$?', `$${u.tex}$`, [
          `$${fq(sub(q(1), c))}$`,
          `$${fq(q(-c.n, c.m))}$`,
        ]),
        vopros('Что записать в ответ?', `$\\alpha=${ans}$`, [
          `$2\\alpha=${u.u}$`,
          `$\\cos2\\alpha$`,
        ]),
      ],
    };
  },
};

/* ── Синусоидальный сигнал: доля времени, когда сигнал не ниже порога ─ */

/**
 * U = U₀·sin(ωt + φ), ω и φ в градусах. Какую часть первых τ секунд
 * (в процентах) напряжение не ниже c = k√m? Подвох — фаза в момент
 * t = 0 не нулевая, и окно [α; 180° − α] переводится во время через φ.
 */
export const EV10_SIGNAL: Prototype = {
  id: 'EV10-SIGNAL',
  no: 202,
  group: 'V',
  title: 'Генератор: какую часть времени напряжение не ниже порога',
  formula: 'U=U_0\\sin(\\omega t+\\varphi)',
  ask: 'долю времени в процентах, когда напряжение не ниже заданного',
  skills: ['trigonometriya'],
  fipiNos: '',
  alt: 'Велосипедный генератор и светодиод',
  solve(p) {
    const U0 = num(p, 'U0');
    const ck = num(p, 'ck');
    const cm = num(p, 'cm');
    const w = num(p, 'w');
    const phi = num(p, 'phi');
    const tau = num(p, 'tau');
    const s2 = div(q(ck * ck * cm), q(U0 * U0));
    const ug = UGOL_PO_SIN2[kl(s2)];
    if (ug === undefined) throw new Error(`EV10-SIGNAL: sin² = ${fq(s2)} — не табличный`);
    const a1 = ug.u;
    const a2 = 180 - ug.u;
    /* Фаза за первые τ секунд — от φ до φ + ωτ; второе окно (a1 + 360) не наступает. */
    const konec = phi + w * tau;
    if (!(phi < a1 && konec > a1 && konec < a1 + 360))
      throw new Error('EV10-SIGNAL: фаза должна пройти начало окна и не дойти до следующего');
    const t1 = div(q(a1 - phi), q(w));
    const t2 = konec >= a2 ? div(q(a2 - phi), q(w)) : q(tau);
    const dlit = sub(t2, t1);
    const ans = val(mul(div(dlit, q(tau)), q(100)));
    const c = kKoren(ck, cm);
    const dn = [
      dano('U_0', U0, 'В', 'амплитуда'),
      dano('\\omega', w, '°/с', 'частота'),
      dano('\\varphi', `${d(phi)}^\\circ`, '', 'начальная фаза'),
      dano('U', `\\ge${c}`, 'В', 'светодиод горит'),
      dano('\\tau', tau, 'с', 'рассматриваемое время'),
    ];
    return {
      answer: ans,
      iskomoe: '\\dfrac{t_2-t_1}{\\tau}\\cdot100\\%',
      edinicy: '%',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Нужно $${d(U0)}\\sin(${d(w)}t+${d(phi)}^\\circ)\\ge${c}$, то есть $\\sin(${d(w)}t+${d(phi)}^\\circ)\\ge\\dfrac{${c}}{${d(U0)}}=${ug.tex}$, при $0\\le t\\le${d(tau)}$.`,
        ],
        vid: 'neravenstvo',
        reshaem: [
          `За первые $${d(tau)}$ с фаза $${d(w)}t+${d(phi)}^\\circ$ растёт от $${d(phi)}^\\circ$ до $${d(konec)}^\\circ$.`,
          `$\\sin x\\ge${ug.tex}$ при $${a1}^\\circ\\le x\\le${a2}^\\circ$; следующее такое окно начинается с $${a1 + 360}^\\circ$ — фаза до него не доходит.`,
          `$${d(w)}t+${d(phi)}=${a1}$ при $t_1=${fq(t1, true)}$ с; ${konec >= a2 ? `$${d(w)}t+${d(phi)}=${a2}$ при $t_2=${fq(t2, true)}$ с` : `до конца $${d(tau)}$-й секунды фаза не доходит до $${a2}^\\circ$, $t_2=${d(tau)}$ с`}.`,
          `Светодиод горит $${fq(t2, true)}-${fq(t1, true)}=${fq(dlit, true)}$ с из $${d(tau)}$ с, это $${d(ans)}\\%$.`,
        ],
        proverka: [
          `Синус больше $${ug.tex}$ на дуге $${a2 - a1}^\\circ$ из $${d(w * tau)}^\\circ$, пройденных за $${d(tau)}$ с: $\\dfrac{${a2 - a1}}{${d(w * tau)}}\\cdot100\\%=${d(ans)}\\%$ — сходится.`,
        ],
        answer: ans,
        ed: '%',
      }),
      vychisleniya: [
        { tekst: 'Синус порога:', tex: `\\dfrac{${c}}{${d(U0)}}=${ug.tex}` },
        { tekst: 'Начало окна:', tex: `t_1=\\dfrac{${a1}-${d(phi)}}{${d(w)}}=${fq(t1, true)}` },
      ],
      hints: [
        chtoNayti('долю первых $' + d(tau) + '$ с, когда $U\\ge' + c + '$', [
          'момент, когда $U=' + c + '$',
          'наибольшее напряжение',
        ]),
        vopros('Какое неравенство на синус получится?', `$\\sin x\\ge${ug.tex}$`, [
          `$\\sin x\\le${ug.tex}$`,
          `$\\sin x\\ge${c}$`,
        ]),
        vopros(
          'При каких значениях фазы $x$ оно выполняется?',
          `$${a1}^\\circ\\le x\\le${a2}^\\circ$`,
          [`$0^\\circ\\le x\\le${a1}^\\circ$`, `$x\\ge${a1}^\\circ$`],
        ),
        vopros('Сколько секунд горит светодиод?', `$${fq(dlit, true)}$ с`, [
          `$${fq(t2, true)}$ с`,
          `$${fq(t1, true)}$ с`,
        ]),
      ],
    };
  },
};

/* ── Закон Ома для полной цепи: наименьшее число элементов ──────── */

/**
 * I = ε/(R + r), R = n·R₁: ток не больше I₀ — наименьшее целое n.
 * Подвох — округлить вниз, а не вверх: нужно n ≥ дробного значения.
 */
export const EV10_NAGREVATELI: Prototype = {
  id: 'EV10-NAGREVATELI',
  no: 203,
  group: 'I',
  title: 'Закон Ома для полной цепи: сколько элементов включить последовательно',
  formula: 'I=\\dfrac{\\varepsilon}{R+r}',
  ask: 'наименьшее число последовательных элементов, при котором ток не больше заданного',
  skills: ['podstanovka'],
  fipiNos: '',
  alt: 'Цепочка нагревательных элементов в инкубаторе',
  solve(p) {
    const eps = num(p, 'eps');
    const r = num(p, 'r');
    const R1 = num(p, 'R1');
    const I0 = num(p, 'I');
    const Rmin = sub(div(q(eps), q(I0)), q(r));
    const nMin = div(Rmin, q(R1));
    const ans = Math.ceil(val(nMin) - 1e-9);
    const dn = [
      dano('\\varepsilon', eps, 'В', 'ЭДС источника'),
      dano('r', r, 'Ом', 'внутреннее сопротивление'),
      dano('R_1', R1, 'Ом', 'сопротивление одного элемента'),
      dano('I', `\\le${d(I0)}`, 'А', 'допустимая сила тока'),
    ];
    return {
      answer: ans,
      iskomoe: 'n',
      edinicy: '',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `При последовательном соединении сопротивления складываются: $R=${d(R1)}n$. Нужно $\\dfrac{${d(eps)}}{${d(R1)}n+${d(r)}}\\le${d(I0)}$.`,
        ],
        vid: 'neravenstvo',
        reshaem: [
          `Знаменатель положителен, умножаем на него: $${d(eps)}\\le${d(I0)}(${d(R1)}n+${d(r)})$, $${d(R1)}n+${d(r)}\\ge\\dfrac{${d(eps)}}{${d(I0)}}=${fq(div(q(eps), q(I0)), true)}$.`,
          `$${d(R1)}n\\ge${fq(Rmin, true)}$, $n\\ge${fq(nMin, true)}$.`,
        ],
        koren: [
          `Число элементов целое: наименьшее $n$, не меньшее $${fq(nMin, true)}$, — это $${ans}$.`,
        ],
        proverka: [
          `При $n=${ans}$: $I=\\dfrac{${d(eps)}}{${d(R1 * ans)}+${d(r)}}=${fq(div(q(eps), q(R1 * ans + r)), true)}\\le${d(I0)}$; при $n=${ans - 1}$: $I=${fq(div(q(eps), q(R1 * (ans - 1) + r)), true)}>${d(I0)}$ — сходится.`,
        ],
        answer: ans,
        ed: '',
      }),
      vychisleniya: [
        {
          tekst: 'Наименьшее общее сопротивление:',
          tex: `\\dfrac{${d(eps)}}{${d(I0)}}-${d(r)}=${fq(Rmin, true)}`,
        },
      ],
      hints: [
        chtoNayti('наименьшее число элементов $n$', ['силу тока', 'сопротивление одного элемента']),
        vopros('Чему равно сопротивление цепочки из $n$ элементов?', `$${d(R1)}n$`, [
          `$\\dfrac{${d(R1)}}{n}$`,
          `$${d(R1)}+n$`,
        ]),
        vopros(`Как округлить $n\\ge${fq(nMin, true)}$?`, `вверх: $n=${ans}$`, [
          `вниз: $n=${ans - 1}$`,
          'не округлять',
        ]),
      ],
    };
  },
};

/* ── Сила Ампера: наименьший угол ───────────────────────────────── */

/**
 * F = BIl·sin α ≥ F₀ — наименьший угол α ∈ [0°; 180°]. Подвох — на
 * [0°; 180°] синус растёт только до 90°, наименьший угол — первый.
 */
export const EV10_AMPER: Prototype = {
  id: 'EV10-AMPER',
  no: 204,
  group: 'V',
  title: 'Сила Ампера: наименьший угол, при котором сила не меньше заданной',
  formula: 'F=BIl\\sin\\alpha',
  ask: 'наименьший угол между проводником и полем',
  skills: ['trigonometriya'],
  fipiNos: '',
  alt: 'Металлический стержень на рельсах в магнитном поле',
  solve(p) {
    const B = num(p, 'B');
    const I = num(p, 'I');
    const l = num(p, 'l');
    const F = num(p, 'F');
    const BIl = mul(mul(q(B), q(I)), q(l));
    const s = div(q(F), BIl);
    const ug = UGOL_PO_SIN2[kl(mul(s, s))];
    if (ug === undefined) throw new Error(`EV10-AMPER: sin α = ${fq(s)} — не табличный`);
    const ans = ug.u;
    const dn = [
      dano('B', B, 'Тл', 'индукция поля'),
      dano('I', I, 'А', 'сила тока'),
      dano('l', l, 'м', 'длина стержня'),
      dano('F', `\\ge${d(F)}`, 'Н', 'нужная сила'),
    ];
    return {
      answer: ans,
      iskomoe: '\\alpha',
      edinicy: '°',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `$BIl=${d(B)}\\cdot${d(I)}\\cdot${d(l)}=${fq(BIl, true)}$. Нужно $${fq(BIl, true)}\\sin\\alpha\\ge${d(F)}$.`,
        ],
        vid: 'neravenstvo',
        reshaem: [
          `$\\sin\\alpha\\ge\\dfrac{${d(F)}}{${fq(BIl, true)}}=${ug.tex}$.`,
          `На $[0^\\circ;180^\\circ]$ это выполняется при $${ans}^\\circ\\le\\alpha\\le${180 - ans}^\\circ$: синус растёт до $90^\\circ$, потом убывает.`,
        ],
        koren: [`Наименьший угол — левый конец: $\\alpha=${ans}^\\circ$.`],
        proverka: [
          `При $\\alpha=${ans}^\\circ$ сила равна $${fq(BIl, true)}\\cdot${ug.tex}=${d(F)}$ Н, а при меньших углах она меньше — сходится.`,
        ],
        answer: ans,
        ed: '°',
      }),
      vychisleniya: [
        { tekst: 'Произведение:', tex: `${d(B)}\\cdot${d(I)}\\cdot${d(l)}=${fq(BIl, true)}` },
      ],
      hints: [
        chtoNayti('наименьший угол $\\alpha$', ['силу Ампера', 'наибольший угол']),
        vopros('Какое неравенство на синус получится?', `$\\sin\\alpha\\ge${ug.tex}$`, [
          `$\\sin\\alpha\\le${ug.tex}$`,
          `$\\sin\\alpha\\ge${d(F)}$`,
        ]),
        vopros('Какой угол записать в ответ?', `$${ans}$`, [`$${180 - ans}$`, '$90$']),
      ],
    };
  },
};
