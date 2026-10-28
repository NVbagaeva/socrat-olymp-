/**
 * Прототипы раздела «Варианты повышенной сложности» для задания №10.
 * В реестр PROTOTYPES не входят — в банк, тренажёр и «Собрать вариант»
 * не попадают; числа и текст условия задаёт вариант. Разбор — теми же
 * кирпичами, что у прототипов разделов (kit.ts): «Дано», этапы,
 * подсказки с кнопками.
 */

import { div, mul, sub } from '../../zadanie11/num';
import {
  chtoNayti,
  d,
  dano,
  fq,
  num,
  q,
  razbor,
  sokrashchenie,
  val,
  vKakihEdinicah,
  vopros,
  type Q,
} from '../kit';
import type { Prototype } from '../types';

/* ── Линза: наибольшее расстояние до лампочки ──────────────────── */

/**
 * Собирающая линза, d₁ и d₂ — в заданных пределах; найти наибольшее d₁,
 * при котором изображение на экране чёткое. Подвох — d₁ наибольшее при
 * наименьшем d₂ (а не при наибольшем), и это значение лежит внутри
 * пределов для d₁, а не на их правом конце.
 */
export const PV10_LINZA_MAX: Prototype = {
  id: 'PV10-LINZA-MAX',
  no: 107,
  group: 'I',
  title: 'Собирающая линза: наибольшее расстояние до лампочки',
  formula: '\\dfrac{1}{d_1}+\\dfrac{1}{d_2}=\\dfrac{1}{f}',
  ask: 'наибольшее расстояние от линзы до лампочки',
  skills: ['podstanovka'],
  fipiNos: '',
  alt: 'Лампочка, собирающая линза и экран на оптической скамье',
  solve(p) {
    const f = num(p, 'f');
    const d1min = num(p, 'd1min');
    const d1max = num(p, 'd1max');
    const d2min = num(p, 'd2min');
    const d2max = num(p, 'd2max');
    const top = f * d2min;
    const raz = d2min - f;
    const d1 = val(q(top, raz));
    if (!Number.isInteger(d1) || d1 <= d1min || d1 >= d1max) {
      throw new Error(`PV10-LINZA-MAX: d₁ = ${d1} вне пределов (${d1min}; ${d1max})`);
    }
    /* Нижняя граница d₁ (при наибольшем d₂) не выше верхней: условие совместно. */
    if (val(q(f * d2max, d2max - f)) > d1) {
      throw new Error('PV10-LINZA-MAX: пределы для d₂ несовместны с d₁');
    }
    const inv = sub(q(1, f), q(1, d2min));
    const dn = [
      dano('f', f, 'см', 'фокусное расстояние'),
      dano('d_1', `${d(d1min)}\\ldots${d(d1max)}`, 'см', 'от линзы до лампочки'),
      dano('d_2', `${d(d2min)}\\ldots${d(d2max)}`, 'см', 'от линзы до экрана'),
    ];
    return {
      answer: d1,
      iskomoe: 'd_1',
      edinicy: 'см',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Ищем наибольшее $d_1$. Выразим его: $\\dfrac{1}{d_1}=\\dfrac{1}{${d(f)}}-\\dfrac{1}{d_2}$.`,
          `$d_1$ наибольшее, когда $\\dfrac{1}{d_1}$ наименьшее, то есть когда вычитаемое $\\dfrac{1}{d_2}$ наибольшее — при наименьшем $d_2=${d(d2min)}$ см.`,
        ],
        vid: 'uravnenie',
        reshaem: [
          `$\\dfrac{1}{d_1}=\\dfrac{1}{${d(f)}}-\\dfrac{1}{${d(d2min)}}=\\dfrac{${d(d2min)}-${d(f)}}{${d(f)}\\cdot${d(d2min)}}=${fq(inv)}$.`,
          `$d_1=\\dfrac{${d(top)}}{${d(raz)}}=${d(d1)}$ см.`,
        ],
        proverka: [
          `$${d(d1)}$ см лежит в пределах для лампочки ($${d(d1min)}$–$${d(d1max)}$ см). Взять $d_1=${d(d1max)}$ см нельзя: тогда экран пришлось бы поставить ближе $${d(d2min)}$ см.`,
        ],
        answer: d1,
        ed: 'см',
      }),
      vychisleniya: sokrashchenie([f, d2min], raz, 'd_1'),
      hints: [
        chtoNayti('наибольшее расстояние $d_1$', ['фокусное расстояние', 'расстояние до экрана']),
        vopros('Какое $d_2$ взять, чтобы $d_1$ было наибольшим?', `наименьшее, $${d(d2min)}$ см`, [
          `наибольшее, $${d(d2max)}$ см`,
          `равное $f=${d(f)}$ см`,
        ]),
        vopros(
          'Можно ли сразу ответить $d_1=' + d(d1max) + '$ см?',
          'нет: экран тогда не помещается в свои пределы',
          ['да, это наибольшее допустимое $d_1$', 'да, если линза собирающая'],
        ),
        vKakihEdinicah('в сантиметрах', ['в метрах', 'в миллиметрах']),
      ],
    };
  },
};

/* ── Доля времени, когда скорость не больше заданной ──────────── */

/** Угол α ∈ (0°; 90°) по квадрату синуса и синус в TeX. */
const UGOL: Record<string, { u: number; tex: string }> = {
  '1/4': { u: 30, tex: '\\dfrac{1}{2}' },
  '1/2': { u: 45, tex: '\\dfrac{\\sqrt{2}}{2}' },
  '3/4': { u: 60, tex: '\\dfrac{\\sqrt{3}}{2}' },
};

/** Коэффициент k√m в TeX: «2\sqrt{2}», «4». */
function kKoren(k: number, m: number): string {
  if (m === 1) return d(k);
  return `${k === 1 ? '' : d(k)}\\sqrt{${m}}`;
}

/** Дробь Q·π в TeX: «\dfrac{\pi}{6}», «\dfrac{7\pi}{12}». */
function piTex(x: Q): string {
  const n = x.n === 1 ? '' : d(x.n);
  return x.m === 1 ? `${n}\\pi` : `\\dfrac{${n}\\pi}{${d(x.m)}}`;
}

/**
 * v(t) = A·sin(πt/T), A = k√m. Какую долю времени из первых τ секунд
 * скорость не больше c? На [0; τ] аргумент не доходит до π − α, поэтому
 * подходит только начальный участок [0; t₁]. Подвох — делить t₁ на τ,
 * а не на период и не брать вторую дугу синуса, которой ещё нет.
 */
export const PV10_DOLYA: Prototype = {
  id: 'PV10-DOLYA',
  no: 134,
  group: 'V',
  title: 'Колебания: какую долю времени скорость не больше заданной',
  formula: 'v=A\\sin\\dfrac{\\pi t}{T}',
  ask: 'долю времени, когда скорость не превышает заданную',
  skills: ['trigonometriya'],
  fipiNos: '',
  alt: 'Поплавок качается на волнах',
  solve(p) {
    const ak = num(p, 'ak');
    const am = num(p, 'am');
    const c = num(p, 'c');
    const T = num(p, 'T');
    const tau = num(p, 'tau');
    const s2 = div(q(c * c), q(ak * ak * am));
    const ug = UGOL[`${s2.n}/${s2.m}`];
    if (ug === undefined) throw new Error(`PV10-DOLYA: sin² = ${fq(s2)} — не табличный`);
    const alfa = q(ug.u, 180);
    const t1 = mul(alfa, q(T));
    const t2 = sub(q(T), t1);
    const tauQ = q(tau);
    if (!(val(tauQ) > val(t1) && val(tauQ) < val(t2))) {
      throw new Error('PV10-DOLYA: τ должно лежать между t₁ и T − t₁');
    }
    const dolya = div(t1, tauQ);
    const ans = val(dolya);
    const A = kKoren(ak, am);
    const argTau = div(tauQ, q(T));
    const dn = [
      dano('A', A, 'см/с', 'наибольшая скорость'),
      dano('T', T, 'с', 'знаменатель в аргументе синуса'),
      dano('v', `\\le${d(c)}`, 'см/с', 'нужная скорость'),
      dano('\\tau', tau, 'с', 'рассматриваемое время'),
    ];
    return {
      answer: ans,
      iskomoe: '\\dfrac{t_1}{\\tau}',
      edinicy: '',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Нужно $${A}\\sin\\dfrac{\\pi t}{${d(T)}}\\le${d(c)}$, то есть $\\sin\\dfrac{\\pi t}{${d(T)}}\\le\\dfrac{${d(c)}}{${A}}=${ug.tex}$, при $0\\le t\\le${d(tau)}$.`,
        ],
        vid: 'neravenstvo',
        reshaem: [
          `Аргумент $x=\\dfrac{\\pi t}{${d(T)}}$ за первые $${d(tau)}$ с растёт от $0$ до $${piTex(argTau)}$.`,
          `$\\sin x=${ug.tex}$ при $x=${piTex(alfa)}$ и $x=${piTex(sub(q(1), alfa))}$. Синус не больше $${ug.tex}$ при $0\\le x\\le${piTex(alfa)}$ и снова — при $x\\ge${piTex(sub(q(1), alfa))}$, но до этого значения за $${d(tau)}$ с аргумент не доходит: $${piTex(argTau)}<${piTex(sub(q(1), alfa))}$.`,
          `$\\dfrac{\\pi t}{${d(T)}}\\le${piTex(alfa)}$, $t\\le${fq(t1)}$: скорость не больше $${d(c)}$ см/с первые $${fq(t1)}$ с.`,
          `Доля: $${fq(t1)}:${d(tau)}=${d(ans)}$.`,
        ],
        proverka: [
          `В начале движения тело разгоняется от нуля, поэтому скорость мала только на первом участке; дальше до $t=${d(tau)}$ с она больше $${d(c)}$ см/с. Доля $${d(ans)}$ меньше $1$ — так и должно быть.`,
        ],
        answer: ans,
        ed: '',
      }),
      vychisleniya: [
        { tekst: 'Синус:', tex: `\\dfrac{${d(c)}}{${A}}=${ug.tex}` },
        { tekst: 'Время:', tex: `t_1=${d(T)}\\cdot${fq(alfa)}=${fq(t1)}` },
      ],
      hints: [
        chtoNayti('долю первых $' + d(tau) + '$ с, когда $v\\le' + d(c) + '$', [
          'момент, когда $v=' + d(c) + '$',
          'наибольшую скорость',
        ]),
        vopros(
          'Какое неравенство на синус получится?',
          `$\\sin\\dfrac{\\pi t}{${d(T)}}\\le${ug.tex}$`,
          [
            `$\\sin\\dfrac{\\pi t}{${d(T)}}\\ge${ug.tex}$`,
            `$\\sin\\dfrac{\\pi t}{${d(T)}}\\le${d(c)}$`,
          ],
        ),
        vopros(
          'Есть ли второй промежуток с $v\\le' + d(c) + '$ за первые $' + d(tau) + '$ с?',
          `нет: он начинается при $t=${fq(t2)}>${d(tau)}$`,
          ['да, симметричный первому', 'да, весь конец промежутка'],
        ),
        vopros('На что делить найденное время?', `на $${d(tau)}$ с`, [
          `на $${d(2 * T)}$ с — период`,
          `на $${d(T)}$ с`,
        ]),
      ],
    };
  },
};

/* ── Горизонт: на сколько метров подняться ─────────────────────── */

/**
 * l = √(2Rh): человек у подножия видит горизонт на l₁ км; на сколько
 * метров подняться, чтобы видеть на l₂ км. Подвох — найти две высоты и
 * их разность, а ответ перевести из километров в метры.
 */
export const PV10_GORIZONT: Prototype = {
  id: 'PV10-GORIZONT',
  no: 135,
  group: 'III',
  title: 'Дальность горизонта: на сколько подняться',
  formula: 'l=\\sqrt{2Rh}',
  ask: 'на сколько метров нужно подняться',
  skills: ['stepen', 'edinicy'],
  fipiNos: '',
  alt: 'Наблюдатель поднимается на смотровую площадку и видит горизонт дальше',
  solve(p) {
    const R = num(p, 'R');
    const l1 = num(p, 'l1');
    const l2 = num(p, 'l2');
    const h1 = q(l1 * l1, 2 * R);
    const h2 = q(l2 * l2, 2 * R);
    const dh = sub(h2, h1);
    const ans = val(mul(dh, q(1000)));
    if (!Number.isFinite(ans) || ans <= 0) throw new Error('PV10-GORIZONT: l₂ ≤ l₁');
    const dn = [
      dano('R', R, 'км', 'радиус Земли'),
      dano('l_1', l1, 'км', 'горизонт у подножия'),
      dano('l_2', l2, 'км', 'горизонт с площадки'),
    ];
    return {
      answer: ans,
      iskomoe: 'h_2-h_1',
      edinicy: 'м',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Из $l=\\sqrt{2Rh}$ высота $h=\\dfrac{l^2}{2R}$ (в км). Найдём высоты для $l_1$ и $l_2$ и их разность.`,
        ],
        vid: 'vychislyaem',
        reshaem: [
          `$h_1=\\dfrac{${d(l1)}^2}{2\\cdot${d(R)}}=${fq(h1, true)}$ км, $h_2=\\dfrac{${d(l2)}^2}{2\\cdot${d(R)}}=${fq(h2, true)}$ км.`,
          `$h_2-h_1=\\dfrac{${d(l2 * l2)}-${d(l1 * l1)}}{${d(2 * R)}}=${fq(dh, true)}$ км $=${d(ans)}$ м.`,
        ],
        proverka: [
          `Подъём на $${d(ans)}$ м — смотровая площадка или вышка; горизонт при этом отодвигается с $${d(l1)}$ до $${d(l2)}$ км — правдоподобно.`,
        ],
        answer: ans,
        ed: 'м',
      }),
      vychisleniya: sokrashchenie([l2 * l2 - l1 * l1, 1000], 2 * R, 'h_2-h_1'),
      hints: [
        chtoNayti('разность высот $h_2-h_1$', ['высоту $h_2$', 'расстояние $l_2$']),
        vopros('Как выразить $h$ из $l=\\sqrt{2Rh}$?', '$h=\\dfrac{l^2}{2R}$', [
          '$h=\\dfrac{l}{2R}$',
          '$h=2Rl^2$',
        ]),
        vKakihEdinicah('в метрах', ['в километрах', 'в сантиметрах'], 'Высоты получились в километрах — переводим.'),
      ],
    };
  },
};

/* ── КПД двигателя: температура нагревателя ────────────────────── */

/**
 * η = (T₁ − T₂)/T₁ · 100 %: по η и T₂ найти T₁. Подвох — T₁ стоит и в
 * числителе, и в знаменателе: η/100 = 1 − T₂/T₁, откуда T₁ = T₂/(1 − η/100).
 */
export const PV10_KPD: Prototype = {
  id: 'PV10-KPD',
  no: 136,
  group: 'I',
  title: 'КПД двигателя: температура нагревателя',
  formula: '\\eta=\\dfrac{T_1-T_2}{T_1}\\cdot100\\%',
  ask: 'температуру нагревателя',
  skills: ['podstanovka'],
  fipiNos: '',
  alt: 'Тепловой двигатель: нагреватель и холодильник',
  solve(p) {
    const T2 = num(p, 'T2');
    const eta = num(p, 'eta');
    const dolya = q(100 - eta, 100);
    const T1q = div(q(T2), dolya);
    const ans = val(T1q);
    const dn = [
      dano('\\eta', `${d(eta)}\\%`, '', 'КПД'),
      dano('T_2', T2, 'К', 'температура холодильника'),
    ];
    return {
      answer: ans,
      iskomoe: 'T_1',
      edinicy: 'К',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Ищем $T_1$. Подставляем: $${d(eta)}=\\dfrac{T_1-${d(T2)}}{T_1}\\cdot100$.`,
        ],
        vid: 'uravnenie',
        reshaem: [
          `Делим на $100$: $\\dfrac{T_1-${d(T2)}}{T_1}=${fq(q(eta, 100))}$, то есть $1-\\dfrac{${d(T2)}}{T_1}=${fq(q(eta, 100))}$.`,
          `$\\dfrac{${d(T2)}}{T_1}=${fq(dolya)}$, $T_1=${d(T2)}:${fq(dolya)}=${d(ans)}$ К.`,
        ],
        proverka: [
          `$\\dfrac{${d(ans)}-${d(T2)}}{${d(ans)}}\\cdot100=${d(eta)}$ — верно; нагреватель горячее холодильника.`,
        ],
        answer: ans,
        ed: 'К',
      }),
      vychisleniya: sokrashchenie([T2, 100], 100 - eta, 'T_1'),
      hints: [
        chtoNayti('температуру нагревателя $T_1$', ['КПД', 'температуру холодильника']),
        vopros(
          'Какое уравнение получится после деления на $100$?',
          `$1-\\dfrac{${d(T2)}}{T_1}=${fq(q(eta, 100))}$`,
          [`$T_1-${d(T2)}=${fq(q(eta, 100))}$`, `$\\dfrac{T_1}{${d(T2)}}=${fq(q(eta, 100))}$`],
        ),
        vKakihEdinicah('в кельвинах', ['в градусах Цельсия', 'в процентах']),
      ],
    };
  },
};

/* ── Партия 4 (варианты 19–24) ──────────────────────────────────── */

/**
 * Радиатор: x = α·(cm/γ)·log₂((T_{\\text{в}} − T_{\\text{п}})/(T − T_{\\text{п}})); по длине трубы x
 * найти температуру T на выходе. Подвох — сначала посчитать множитель
 * перед логарифмом, затем раскрыть логарифм: отношение разностей равно
 * степени двойки, и T — не сама дробь, а T_{\\text{п}} плюс разность.
 */
export const PV10_RADIATOR: Prototype = {
  id: 'PV10-RADIATOR',
  no: 137,
  group: 'IV',
  title: 'Радиатор: температура воды на выходе',
  formula: 'x=\\alpha\\dfrac{cm}{\\gamma}\\log_2\\dfrac{T_{\\text{в}}-T_{\\text{п}}}{T-T_{\\text{п}}}',
  ask: 'до какой температуры охладится вода',
  skills: ['logarifm', 'podstanovka'],
  fipiNos: '',
  alt: 'Горячая вода остывает, проходя по трубе радиатора',
  solve(p) {
    const al = num(p, 'alpha');
    const c = num(p, 'c');
    const m = num(p, 'm');
    const ga = num(p, 'gamma');
    const Tv = num(p, 'Tv');
    const Tp = num(p, 'Tp');
    const x = num(p, 'x');
    const K = q(al * c * m, ga);
    const L = div(q(x), K);
    const Lv = val(L);
    if (!Number.isInteger(Lv) || Lv < 1) throw new Error('PV10-RADIATOR: логарифм не целый');
    const raz = q(Tv - Tp, 2 ** Lv);
    const ans = val(raz) + Tp;
    const dn = [
      dano('\\alpha', al, '', 'постоянная'),
      dano('c', c, '', 'теплоёмкость воды'),
      dano('m', m, 'кг/с', 'расход воды'),
      dano('\\gamma', ga, '', 'коэффициент теплообмена'),
      dano('T_{\\text{в}}', Tv, '°C', 'температура на входе'),
      dano('T_{\\text{п}}', Tp, '°C', 'температура помещения'),
      dano('x', x, 'м', 'длина трубы'),
    ];
    return {
      answer: ans,
      iskomoe: 'T',
      edinicy: '°C',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [`Ищем $T$. Сначала множитель перед логарифмом, потом сам логарифм.`],
        vid: 'uravnenie',
        reshaem: [
          `$\\alpha\\dfrac{cm}{\\gamma}=\\dfrac{${d(al)}\\cdot${d(c)}\\cdot${d(m)}}{${d(ga)}}=${fq(K)}$.`,
          `$${d(x)}=${fq(K)}\\cdot\\log_2\\dfrac{${d(Tv - Tp)}}{T-${d(Tp)}}$, откуда $\\log_2\\dfrac{${d(Tv - Tp)}}{T-${d(Tp)}}=${d(Lv)}$.`,
          `$\\dfrac{${d(Tv - Tp)}}{T-${d(Tp)}}=2^{${d(Lv)}}=${d(2 ** Lv)}$, значит $T-${d(Tp)}=${fq(raz)}$ и $T=${d(ans)}$ °C.`,
        ],
        proverka: [
          `Вода остыла с $${d(Tv)}$ до $${d(ans)}$ °C — выше температуры помещения $${d(Tp)}$ °C, правдоподобно.`,
        ],
        answer: ans,
        ed: '°C',
      }),
      vychisleniya: sokrashchenie([al, c, m], ga, '\\alpha\\dfrac{cm}{\\gamma}'),
      hints: [
        chtoNayti('температуру $T$ на выходе', ['длину трубы', 'температуру помещения']),
        vopros(
          'Чему равен логарифм в формуле?',
          `$${d(Lv)}$`,
          [`$${d(x)}$`, `$${fq(K)}$`].filter((o) => o !== `$${d(Lv)}$`),
          'Делим длину трубы на множитель перед логарифмом.',
        ),
        vopros(
          'Что получается из $\\log_2 A=n$?',
          '$A=2^n$',
          ['$A=n^2$', '$A=2n$'],
        ),
      ],
    };
  },
};

/**
 * Разгон с постоянным ускорением: v = √(2la). vid 'a' — найти
 * ускорение по пути и скорости, vid 'l' — путь по ускорению и скорости.
 * Подвох — возвести формулу в квадрат и выразить нужную величину, не
 * перепутав, что делить и на что.
 */
export const PV10_RAZGON: Prototype = {
  id: 'PV10-RAZGON',
  no: 138,
  group: 'II',
  title: 'Разгон: ускорение или путь по формуле $v=\\sqrt{2la}$',
  formula: 'v=\\sqrt{2la}',
  ask: 'ускорение или путь',
  skills: ['koren', 'podstanovka'],
  fipiNos: '',
  alt: 'Автомобиль разгоняется на прямом участке дороги',
  solve(p) {
    const v = num(p, 'v');
    const naiti = p['vid'] === 'l' ? 'l' : 'a';
    const dano2 = num(p, naiti === 'a' ? 'l' : 'a');
    const otv = q(v * v, 2 * dano2);
    const ans = val(otv);
    const dn =
      naiti === 'a'
        ? [dano('l', dano2, 'км', 'путь'), dano('v', v, 'км/ч', 'скорость в конце')]
        : [dano('a', dano2, 'км/ч²', 'ускорение'), dano('v', v, 'км/ч', 'скорость в конце')];
    return {
      answer: ans,
      iskomoe: naiti,
      edinicy: naiti === 'a' ? 'км/ч²' : 'км',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [`Ищем $${naiti}$. Возводим формулу в квадрат: $v^2=2la$.`],
        vid: 'vychislyaem',
        reshaem: [
          naiti === 'a'
            ? `$a=\\dfrac{v^2}{2l}=\\dfrac{${d(v)}^2}{2\\cdot${d(dano2)}}=${d(ans)}$ км/ч².`
            : `$l=\\dfrac{v^2}{2a}=\\dfrac{${d(v)}^2}{2\\cdot${d(dano2)}}=${d(ans)}$ км.`,
        ],
        proverka: [
          `$\\sqrt{2\\cdot${d(naiti === 'a' ? dano2 : ans)}\\cdot${d(naiti === 'a' ? ans : dano2)}}=${d(v)}$ — верно.`,
        ],
        answer: ans,
        ed: naiti === 'a' ? 'км/ч²' : 'км',
      }),
      vychisleniya: sokrashchenie([v, v], 2 * dano2, naiti),
      hints: [
        chtoNayti(naiti === 'a' ? 'ускорение $a$' : 'путь $l$', ['скорость $v$', 'время разгона']),
        vopros(
          `Как выразить $${naiti}$ из $v=\\sqrt{2la}$?`,
          naiti === 'a' ? '$a=\\dfrac{v^2}{2l}$' : '$l=\\dfrac{v^2}{2a}$',
          naiti === 'a' ? ['$a=\\dfrac{v}{2l}$', '$a=\\dfrac{2l}{v^2}$'] : ['$l=\\dfrac{v}{2a}$', '$l=\\dfrac{2a}{v^2}$'],
        ),
        vKakihEdinicah(naiti === 'a' ? 'в км/ч²' : 'в километрах', naiti === 'a' ? ['в м/с²', 'в км/ч'] : ['в метрах', 'в км/ч']),
      ],
    };
  },
};

/**
 * Изотермическое сжатие воздуха в колоколе: A = α·ν·T·log₂ r, где r =
 * V₁/V₂ (vid 'V' — найти V₂) или r = p₂/p₁ (vid 'p' — найти p₂).
 * Подвох — log₂ r = A/(ανT), отсюда r — степень двойки, и для объёма
 * V₂ = V₁/r (объём уменьшается), а для давления p₂ = p₁·r (растёт).
 */
export const PV10_KOLOKOL: Prototype = {
  id: 'PV10-KOLOKOL',
  no: 139,
  group: 'IV',
  title: 'Водолазный колокол: изотермическое сжатие, объём или давление',
  formula: 'A=\\alpha\\nu T\\log_2\\dfrac{V_1}{V_2}',
  ask: 'конечный объём или давление',
  skills: ['logarifm', 'podstanovka'],
  fipiNos: '',
  alt: 'Водолазный колокол опускают на дно',
  solve(p) {
    const al = num(p, 'alpha');
    const nu = num(p, 'nu');
    const T = num(p, 'T');
    const A = num(p, 'A');
    const poV = p['vid'] !== 'p';
    const nach = num(p, poV ? 'V1' : 'p1');
    const K = al * nu * T;
    const L = val(div(q(A), q(K)));
    if (!Number.isInteger(L) || L < 1) throw new Error('PV10-KOLOKOL: логарифм не целый');
    const r = 2 ** L;
    const ans = val(poV ? q(nach, r) : mul(q(nach), q(r)));
    const dn = [
      dano('\\nu', nu, 'моль', 'количество воздуха'),
      dano(poV ? 'V_1' : 'p_1', nach, poV ? 'л' : 'атм', poV ? 'начальный объём' : 'начальное давление'),
      dano('\\alpha', al, '', 'постоянная'),
      dano('T', T, 'К', 'температура'),
      dano('A', A, 'Дж', 'работа'),
    ];
    return {
      answer: ans,
      iskomoe: poV ? 'V_2' : 'p_2',
      edinicy: poV ? 'л' : 'атм',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [`Ищем $${poV ? 'V_2' : 'p_2'}$. Сначала множитель $\\alpha\\nu T$, потом логарифм.`],
        vid: 'uravnenie',
        reshaem: [
          `$\\alpha\\nu T=${d(al)}\\cdot${d(nu)}\\cdot${d(T)}=${d(K)}$.`,
          `$${d(A)}=${d(K)}\\cdot\\log_2${poV ? `\\dfrac{${d(nach)}}{V_2}` : `\\dfrac{p_2}{${d(nach)}}`}$, откуда логарифм равен $${d(A)}:${d(K)}=${d(L)}$.`,
          poV
            ? `$\\dfrac{${d(nach)}}{V_2}=2^{${d(L)}}=${d(r)}$, $V_2=${d(nach)}:${d(r)}=${d(ans)}$ л.`
            : `$\\dfrac{p_2}{${d(nach)}}=2^{${d(L)}}=${d(r)}$, $p_2=${d(nach)}\\cdot${d(r)}=${d(ans)}$ атм.`,
        ],
        proverka: [
          poV
            ? `Воздух сжали: объём уменьшился с $${d(nach)}$ до $${d(ans)}$ л — так и должно быть.`
            : `Воздух сжали: давление выросло с $${d(nach)}$ до $${d(ans)}$ атм — так и должно быть.`,
        ],
        answer: ans,
        ed: poV ? 'л' : 'атм',
      }),
      vychisleniya: [],
      hints: [
        chtoNayti(poV ? 'объём $V_2$' : 'давление $p_2$', ['работу $A$', 'температуру $T$']),
        vopros('Чему равен логарифм в формуле?', `$${d(L)}$`, [`$${d(r)}$`, `$${d(K)}$`]),
        vopros(
          poV ? 'Как найти $V_2$?' : 'Как найти $p_2$?',
          poV ? `$V_2=\\dfrac{${d(nach)}}{${d(r)}}$` : `$p_2=${d(nach)}\\cdot${d(r)}$`,
          poV ? [`$V_2=${d(nach)}\\cdot${d(r)}$`, `$V_2=${d(nach)}-${d(r)}$`] : [`$p_2=\\dfrac{${d(nach)}}{${d(r)}}$`, `$p_2=${d(nach)}+${d(r)}$`],
        ),
      ],
    };
  },
};

/* ── Партия 5 (варианты 25–30) ──────────────────────────────────── */

/** Табличные углы: sin² и cos² как дроби. */
const SIN2: Record<number, [number, number]> = { 30: [1, 4], 45: [1, 2], 60: [3, 4], 90: [1, 1] };
const COS: Record<number, [number, number]> = { 0: [1, 1], 60: [1, 2] };

/**
 * Неупругий удар: Q = m·v²·sin²α, тела летят под углом 2α. Найти
 * наименьший угол 2α, при котором выделится не меньше Q₀. Подвох —
 * sin²α = Q₀/(mv²), α из таблицы, а ответ — удвоенный угол.
 */
export const PV10_UDAR: Prototype = {
  id: 'PV10-UDAR',
  no: 140,
  group: 'V',
  title: 'Неупругий удар: наименьший угол между направлениями',
  formula: 'Q=mv^2\\sin^2\\alpha',
  ask: 'наименьший угол 2α',
  skills: ['trigonometriya', 'podstanovka'],
  fipiNos: '',
  alt: 'Два тела летят навстречу под углом и слипаются',
  solve(p) {
    const m = num(p, 'm');
    const v = num(p, 'v');
    const Q0 = num(p, 'Q');
    const s2 = q(Q0, m * v * v);
    const al = Object.entries(SIN2).find(([, [a, b]]) => a * s2.m === b * s2.n)?.[0];
    if (al === undefined) throw new Error(`PV10-UDAR: sin²α = ${fq(s2)} — не табличный`);
    const alpha = Number(al);
    const ans = 2 * alpha;
    const dn = [
      dano('m', m, 'кг', 'масса каждого тела'),
      dano('v', v, 'м/с', 'скорость тел'),
      dano('Q', `\\ge${d(Q0)}`, 'Дж', 'выделившаяся энергия'),
    ];
    return {
      answer: ans,
      iskomoe: '2\\alpha',
      edinicy: '°',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          'Ищем угол $2\\alpha$. Энергия растёт вместе с $\\sin^2\\alpha$, поэтому наименьший угол — тот, при котором $Q$ ровно равна порогу.',
        ],
        vid: 'neravenstvo',
        reshaem: [
          `$${d(m)}\\cdot${d(v)}^2\\cdot\\sin^2\\alpha\\ge${d(Q0)}$, то есть $\\sin^2\\alpha\\ge\\dfrac{${d(Q0)}}{${d(m * v * v)}}=${fq(s2)}$.`,
          `При острых $\\alpha$ это $\\alpha\\ge${alpha}^\\circ$: $\\sin^2${alpha}^\\circ=${fq(s2)}$.`,
          `Угол между направлениями $2\\alpha\\ge${ans}^\\circ$, наименьший — $${ans}^\\circ$.`,
        ],
        proverka: [
          `При $2\\alpha=${ans}^\\circ$: $Q=${d(m * v * v)}\\cdot${fq(s2)}=${d(Q0)}$ Дж — ровно порог.`,
        ],
        answer: ans,
        ed: '°',
      }),
      vychisleniya: [],
      hints: [
        chtoNayti('угол $2\\alpha$ между направлениями', ['угол $\\alpha$', 'энергию $Q$']),
        vopros('Чему равен $\\sin^2\\alpha$ на пороге?', `$${fq(s2)}$`, [
          `$${fq(q(s2.m, s2.n))}$`,
          `$${fq(q(Q0, m * v))}$`,
        ]),
        vopros(
          'Что записать в ответ?',
          `$${ans}$`,
          [`$${alpha}$`, `$${180 - ans}$`],
          'Спрашивают угол $2\\alpha$, а не $\\alpha$.',
        ),
      ],
    };
  },
};

/**
 * Прыжок на платформу: u = m/(m + M)·v·cos α. Найти наибольший угол α,
 * чтобы скорость платформы была не меньше u₀. Подвох — cos α убывает,
 * поэтому неравенство u ≥ u₀ даёт α ≤ …, а не α ≥ ….
 */
export const PV10_PLATFORMA: Prototype = {
  id: 'PV10-PLATFORMA',
  no: 141,
  group: 'V',
  title: 'Прыжок на платформу: наибольший угол к рельсам',
  formula: 'u=\\dfrac{m}{m+M}v\\cos\\alpha',
  ask: 'наибольший угол α',
  skills: ['trigonometriya', 'podstanovka'],
  fipiNos: '',
  alt: 'Человек запрыгивает на платформу, стоящую на рельсах',
  solve(p) {
    if (p['vid'] === 'v') return platformaSkorost(p);
    const m = num(p, 'm');
    const M = num(p, 'M');
    const v = num(p, 'v');
    const u = num(p, 'u');
    const k = q(m, m + M);
    const kv = mul(k, q(v));
    const c = div(q(u), kv);
    const al = Object.entries(COS).find(([, [a, b]]) => a * c.m === b * c.n)?.[0];
    if (al === undefined || Number(al) === 0) throw new Error(`PV10-PLATFORMA: cos α = ${fq(c)} — не табличный`);
    const ans = Number(al);
    const dn = [
      dano('m', m, 'кг', 'масса прыгуна со снарядом'),
      dano('M', M, 'кг', 'масса платформы'),
      dano('v', v, 'м/с', 'скорость прыжка'),
      dano('u', `\\ge${d(u)}`, 'м/с', 'скорость платформы'),
    ];
    return {
      answer: ans,
      iskomoe: '\\alpha',
      edinicy: '°',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: ['Ищем наибольший угол $\\alpha$. Чем больше острый угол, тем меньше $\\cos\\alpha$ и тем медленнее платформа.'],
        vid: 'neravenstvo',
        reshaem: [
          `Множитель $\\dfrac{m}{m+M}v=\\dfrac{${d(m)}}{${d(m + M)}}\\cdot${d(v)}=${fq(kv)}$.`,
          `$${fq(kv)}\\cos\\alpha\\ge${d(u)}$, то есть $\\cos\\alpha\\ge${fq(c)}$.`,
          `$\\cos\\alpha$ на острых углах убывает: $\\alpha\\le${ans}^\\circ$, наибольший — $${ans}^\\circ$.`,
        ],
        proverka: [`При $\\alpha=${ans}^\\circ$: $u=${fq(kv)}\\cdot${fq(c)}=${d(u)}$ м/с — ровно порог.`],
        answer: ans,
        ed: '°',
      }),
      vychisleniya: [],
      hints: [
        chtoNayti('наибольший угол $\\alpha$', ['скорость платформы', 'наименьший угол $\\alpha$']),
        vopros('Чему должен быть не меньше $\\cos\\alpha$?', `$${fq(c)}$`, [
          `$${fq(div(q(u), q(v)))}$`,
          `$${fq(q(1, 1))}$`,
        ]),
        vopros(
          'Неравенство $\\cos\\alpha\\ge c$ на острых углах — это…',
          `$\\alpha\\le\\arccos c$`,
          ['$\\alpha\\ge\\arccos c$', '$\\alpha=\\arccos c$ и только'],
          'Косинус убывает: больший угол — меньший косинус.',
        ),
      ],
    };
  },
};

/**
 * Тот же прыжок, но угол дан (α = 60°): найти наименьшую скорость прыжка
 * v, при которой платформа поедет не медленнее u₀. Подвох — cos 60° = 1/2
 * стоит в знаменателе и удваивает ответ.
 */
function platformaSkorost(p: Parameters<Prototype['solve']>[0]): ReturnType<Prototype['solve']> {
  const m = num(p, 'm');
  const M = num(p, 'M');
  const u = num(p, 'u');
  const al = num(p, 'alpha');
  const c = COS[al];
  if (c === undefined) throw new Error(`PV10-PLATFORMA: cos ${al}° не табличный рациональный`);
  const cosQ = q(c[0], c[1]);
  const k = q(m, m + M);
  const v = div(q(u), mul(k, cosQ));
  const ans = val(v);
  const dn = [
    dano('m', m, 'кг', 'масса прыгуна со снарядом'),
    dano('M', M, 'кг', 'масса платформы'),
    dano('\\alpha', `${al}^\\circ`, '', 'угол прыжка к рельсам'),
    dano('u', `\\ge${d(u)}`, 'м/с', 'скорость платформы'),
  ];
  return {
    answer: ans,
    iskomoe: 'v',
    edinicy: 'м/с',
    dano: dn,
    etapy: razbor({
      dano: dn,
      ishchem: ['Ищем наименьшую скорость прыжка $v$: скорость платформы растёт вместе с $v$, на пределе $u$ ровно равна порогу.'],
      vid: 'neravenstvo',
      reshaem: [
        `$\\dfrac{${d(m)}}{${d(m + M)}}\\cdot v\\cdot\\cos${al}^\\circ\\ge${d(u)}$, где $\\cos${al}^\\circ=${fq(cosQ)}$.`,
        `$${fq(mul(k, cosQ))}\\,v\\ge${d(u)}$, $v\\ge${d(u)}:${fq(mul(k, cosQ))}=${d(ans)}$ м/с.`,
      ],
      proverka: [`При $v=${d(ans)}$ м/с: $u=${fq(k)}\\cdot${d(ans)}\\cdot${fq(cosQ)}=${d(u)}$ м/с — ровно порог.`],
      answer: ans,
      ed: 'м/с',
    }),
    vychisleniya: [],
    hints: [
      chtoNayti('наименьшую скорость прыжка $v$', ['угол $\\alpha$', 'скорость платформы']),
      vopros(`Чему равен $\\cos${al}^\\circ$?`, `$${fq(cosQ)}$`, ['$\\dfrac{\\sqrt3}{2}$', '$1$']),
      vopros(
        'Как меняется ответ из-за косинуса в знаменателе?',
        'Скорость прыжка нужна больше',
        ['Скорость прыжка нужна меньше', 'Не меняется'],
        'Делим на число меньше единицы.',
      ),
    ],
  };
}

/**
 * Колодец: h = 5t². Время падения было t₁, после дождя изменилось на Δ
 * (вода ближе — время меньше). На сколько поднялась вода? Подвох — время
 * уменьшается, и ответ — разность расстояний, а не 5·Δ².
 */
export const PV10_KOLODEC: Prototype = {
  id: 'PV10-KOLODEC',
  no: 142,
  group: 'II',
  title: 'Колодец: на сколько поднялась вода по времени падения камешка',
  formula: 'h=5t^2',
  ask: 'на сколько метров поднялась вода',
  skills: ['podstanovka'],
  fipiNos: '',
  alt: 'Камешек падает в колодец',
  solve(p) {
    const t1 = num(p, 't1');
    const dt = num(p, 'dt');
    const t2 = val(sub(q(t1), q(dt)));
    const h1 = val(mul(q(5), mul(q(t1), q(t1))));
    const h2 = val(mul(q(5), mul(q(t2), q(t2))));
    const ans = val(sub(q(h1), q(h2)));
    if (!(t2 > 0)) throw new Error('PV10-KOLODEC: время после дождя не положительно');
    const dn = [
      dano('t_1', t1, 'с', 'время падения до дождя'),
      dano('\\Delta t', dt, 'с', 'на сколько изменилось время'),
    ];
    return {
      answer: ans,
      iskomoe: '\\Delta h',
      edinicy: 'м',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          'Ищем, на сколько уменьшилось расстояние до воды. Вода поднялась — камешек падает меньше, время уменьшилось.',
        ],
        vid: 'vychislyaem',
        reshaem: [
          `До дождя: $h_1=5\\cdot${d(t1)}^2=${d(h1)}$ м.`,
          `После: $t_2=${d(t1)}-${d(dt)}=${d(t2)}$ с, $h_2=5\\cdot${d(t2)}^2=${d(h2)}$ м.`,
          `Вода поднялась на $${d(h1)}-${d(h2)}=${d(ans)}$ м.`,
        ],
        proverka: [`Время уменьшилось, расстояние до воды тоже: $${d(h2)}<${d(h1)}$ — сходится.`],
        answer: ans,
        ed: 'м',
      }),
      vychisleniya: [],
      hints: [
        chtoNayti('на сколько поднялась вода', ['глубину колодца', 'новое время падения']),
        vopros('Каким стало время падения после дождя?', `$${d(t2)}$ с`, [
          `$${d(val(sub(q(t1), q(-dt))))}$ с`,
          `$${d(dt)}$ с`,
        ], 'Вода ближе — камешек падает меньше.'),
        vopros('Чему равен ответ?', `$h_1-h_2$`, ['$5\\cdot(\\Delta t)^2$', '$h_1+h_2$']),
      ],
    };
  },
};

/**
 * Выталкивающая сила: куб F = ρgl³ (vid 'kub') или сфера F = αρgr³
 * (vid 'shar'); сила не больше F₀ — найти наибольшую длину ребра или
 * радиус. Подвох — из куба величины извлечь кубический корень, а не
 * квадратный.
 */
export const PV10_ARHIMED: Prototype = {
  id: 'PV10-ARHIMED',
  no: 143,
  group: 'III',
  title: 'Архимедова сила: наибольший размер аппарата',
  formula: 'F_A=\\rho g l^3',
  ask: 'наибольшее ребро или радиус',
  skills: ['koren', 'stepen'],
  fipiNos: '',
  alt: 'Аппарат погружается под воду',
  solve(p) {
    const shar = p['vid'] === 'shar';
    const rho = num(p, 'rho');
    const g = num(p, 'g');
    const al = shar ? num(p, 'alpha') : 1;
    const F = num(p, 'F');
    const K = val(mul(q(al), q(rho * g)));
    const kub = val(div(q(F), q(K)));
    const x = Math.round(Math.cbrt(kub) * 1e6) / 1e6;
    if (Math.abs(val(mul(q(x), mul(q(x), q(x)))) - kub) > 1e-9) throw new Error(`PV10-ARHIMED: ∛${kub} не конечная дробь`);
    const bukva = shar ? 'r' : 'l';
    const dn = [
      ...(shar ? [dano('\\alpha', al, '', 'постоянная')] : []),
      dano('\\rho', rho, 'кг/м³', 'плотность воды'),
      dano('g', g, 'Н/кг', 'ускорение свободного падения'),
      dano('F_A', `\\le${d(F)}`, 'Н', 'выталкивающая сила'),
    ];
    return {
      answer: x,
      iskomoe: bukva,
      edinicy: 'м',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [`Ищем наибольшее $${bukva}$: сила растёт вместе с $${bukva}^3$, на пределе она равна $${d(F)}$ Н.`],
        vid: 'neravenstvo',
        reshaem: [
          `Множитель при $${bukva}^3$: $${shar ? `${d(al)}\\cdot` : ''}${d(rho)}\\cdot${d(g)}=${d(K)}$.`,
          `$${d(K)}\\,${bukva}^3\\le${d(F)}$, $${bukva}^3\\le\\dfrac{${d(F)}}{${d(K)}}=${d(kub)}$.`,
          `$${bukva}\\le\\sqrt[3]{${d(kub)}}=${d(x)}$ м.`,
        ],
        proverka: [`$${d(x)}^3=${d(kub)}$ и $${d(K)}\\cdot${d(kub)}=${d(F)}$ — сходится.`],
        answer: x,
        ed: 'м',
      }),
      vychisleniya: sokrashchenie([F], K, `${bukva}^3`),
      hints: [
        chtoNayti(shar ? 'наибольший радиус $r$' : 'наибольшее ребро $l$', ['силу $F_A$', 'объём аппарата']),
        vopros(`Чему равно наибольшее $${bukva}^3$?`, `$${d(kub)}$`, [`$${d(val(div(q(F), q(rho))))}$`, `$${d(F)}$`]),
        vopros('Какой корень извлекаем?', 'Кубический', ['Квадратный', 'Никакой'], `$${bukva}$ стоит в третьей степени.`),
      ],
    };
  },
};
