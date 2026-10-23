/**
 * Решения блоков V–IX: синус, косинус, тангенс (23–32), центральные
 * и вписанные углы, касательные (33–40), вписанная (41–44) и
 * описанная (45–48) окружности, теорема синусов (49).
 */

import type { Params } from '../stseny/dsl';
import { g, n, shag, sokr, sverkaDliny, sverkaUgla, vopros, variantyGradusov } from './obshchee';
import type { Reshenie } from './types';

const VGR = 180 / Math.PI;

/** k√m в TeX. */
function kor(k: number, m: number): string {
  if (m === 1) return n(k);
  return `${k === 1 ? '' : n(k)}\\sqrt{${m}}`;
}

/** n√m/d в TeX (dec — десятичной дробью). */
function drob(nn: number, d: number, m = 1, dec = false): string {
  if (dec) return n((nn * Math.sqrt(m)) / d);
  if (d === 1) return kor(nn, m);
  return `\\dfrac{${kor(nn, m)}}{${d}}`;
}

/**
 * Сверка тригонометрической функции острого угла с рисунком: значение
 * между 0 и 1, и сравнение с √2/2 по тому, больше угол 45° или меньше.
 */
function sverkaTrig(fn: 'sin' | 'cos', ugolImya: string, ugol: number, x: number): string {
  const bolshe45 = ugol > 45;
  const rastet = fn === 'sin';
  const bolsheKorenya = bolshe45 === rastet;
  const tochno = Math.abs(ugol - 45) < 1e-9;
  if (tochno) {
    return `Сверяем: угол ${ugolImya} равен $45^\\circ$, и $\\${fn} = \\frac{\\sqrt2}{2}$ — сходится.`;
  }
  return `Сверяем с рисунком: $\\${fn}$ острого угла — число между $0$ и $1$. Угол ${ugolImya} на чертеже ${bolshe45 ? 'больше' : 'меньше'} $45^\\circ$, поэтому $\\${fn}$ ${bolsheKorenya ? 'больше' : 'меньше'} $\\frac{\\sqrt2}{2}\\approx 0{,}71$: $${n(x)}$ — сходится.`;
}

export const RESHENIYA_2: Record<number, (p: Params) => Reshenie> = {
  23: (p) => {
    const s = sokr([p.c], 2 * p.l, '\\cos A');
    const A = Math.acos(p.c / (2 * p.l)) * VGR;
    return {
      shagi: [
        shag(
          'Высота к основанию',
          'В равнобедренном треугольнике высота $CH$ к основанию является и медианой: она делит $AB$ пополам.',
          [`AH = ${n(p.c)} : 2 = ${n(p.c / 2)}`],
          1,
        ),
        shag(
          'Косинус в прямоугольном треугольнике',
          'В прямоугольном треугольнике $ACH$ косинус угла $A$ — прилежащий катет $AH$, делённый на гипотенузу $AC$.',
          [`\\cos A = \\dfrac{AH}{AC} = \\dfrac{${n(p.c / 2)}}{${n(p.l)}} = ${n(s.itog)}`],
          2,
          s.shagi,
        ),
      ],
      voprosy: [
        vopros(
          'Что делает высота $CH$ равнобедренного треугольника с основанием?',
          ['делит его пополам', 'равна основанию', 'делит угол $A$ пополам'],
          'Высота к основанию равнобедренного треугольника — она же медиана.',
          1,
        ),
        vopros(
          'Косинус острого угла прямоугольного треугольника — это…',
          [
            'прилежащий катет : гипотенуза',
            'противолежащий катет : гипотенуза',
            'противолежащий катет : прилежащий',
          ],
          'cos — «прилежащий к гипотенузе».',
          2,
        ),
      ],
      sverka: sverkaTrig('cos', '$A$', A, s.itog),
      otvet: s.itog,
    };
  },
  24: (p) => {
    const s = sokr([p.bc, p.d], p.n, 'AB');
    return {
      shagi: [
        shag(
          'Косинус угла $B$',
          'Косинус угла $B$ — прилежащий катет $BC$, делённый на гипотенузу $AB$.',
          [`\\cos B = \\dfrac{BC}{AB}\\quad\\Rightarrow\\quad AB = \\dfrac{BC}{\\cos B}`],
        ),
        shag(
          'Считаем',
          'Делим на дробь — умножаем на перевёрнутую.',
          [
            `AB = ${n(p.bc)} : \\dfrac{${p.n}}{${p.d}} = \\dfrac{${n(p.bc)}\\cdot ${p.d}}{${p.n}} = ${n(s.itog)}`,
          ],
          undefined,
          s.shagi,
        ),
      ],
      voprosy: [
        vopros(
          'Какая сторона прилежит к углу $B$?',
          ['$BC$', '$AC$', '$AB$'],
          'Прилежащий катет — тот, что образует угол $B$ вместе с гипотенузой.',
        ),
        vopros(
          'Как выразить гипотенузу?',
          ['$AB = \\frac{BC}{\\cos B}$', '$AB = BC\\cdot\\cos B$', '$AB = \\frac{\\cos B}{BC}$'],
          'Из $\\cos B = \\frac{BC}{AB}$.',
        ),
      ],
      sverka: sverkaDliny(
        'гипотенуза $AB$',
        s.itog,
        'катет $BC$',
        p.bc,
        'гипотенуза — самая длинная сторона',
      ),
      otvet: s.itog,
    };
  },
  25: (p) => {
    const ac2 = p.k * p.k * p.m;
    const bc = Math.sqrt(p.ab * p.ab - ac2);
    const s = sokr([bc], p.ab, '\\sin A');
    const A = Math.acos(Math.sqrt(ac2) / p.ab) * VGR;
    return {
      shagi: [
        shag(
          'Катет $BC$ по теореме Пифагора',
          'Синусу угла $A$ нужен противолежащий катет $BC$ — его нет в условии. Находим по теореме Пифагора.',
          [
            `BC = \\sqrt{AB^2 - AC^2} = \\sqrt{${n(p.ab * p.ab)} - ${n(ac2)}} = \\sqrt{${n(p.ab * p.ab - ac2)}} = ${n(bc)}`,
          ],
          1,
        ),
        shag(
          'Синус угла $A$',
          'Синус — противолежащий катет, делённый на гипотенузу.',
          [`\\sin A = \\dfrac{BC}{AB} = \\dfrac{${n(bc)}}{${n(p.ab)}} = ${n(s.itog)}`],
          undefined,
          s.shagi,
        ),
      ],
      voprosy: [
        vopros(
          'Какой катет лежит против угла $A$?',
          ['$BC$', '$AC$', '$AB$'],
          'Против угла $A$ — сторона $BC$.',
          1,
        ),
        vopros(
          'Как найти $BC$?',
          ['по теореме Пифагора', 'по теореме синусов', 'как половину $AB$'],
          '$BC^2 = AB^2 - AC^2$.',
        ),
      ],
      sverka: sverkaTrig('sin', '$A$', A, s.itog),
      otvet: s.itog,
    };
  },
  26: (p) => {
    const bc2 = p.k * p.k * p.m;
    const ac = Math.sqrt(p.ab * p.ab - bc2);
    const s = sokr([ac], p.ab, '\\cos A');
    const A = Math.asin(Math.sqrt(bc2) / p.ab) * VGR;
    return {
      shagi: [
        shag('Катет $AC$ по теореме Пифагора', 'Косинусу угла $A$ нужен прилежащий катет $AC$.', [
          `AC = \\sqrt{AB^2 - BC^2} = \\sqrt{${n(p.ab * p.ab)} - ${n(bc2)}} = ${n(ac)}`,
        ]),
        shag(
          'Косинус угла $A$',
          'Косинус — прилежащий катет, делённый на гипотенузу.',
          [`\\cos A = \\dfrac{AC}{AB} = \\dfrac{${n(ac)}}{${n(p.ab)}} = ${n(s.itog)}`],
          undefined,
          s.shagi,
        ),
      ],
      voprosy: [
        vopros(
          'Какой катет прилежит к углу $A$?',
          ['$AC$', '$BC$', '$AB$'],
          'Прилежащий катет — сторона угла $A$, не гипотенуза.',
        ),
      ],
      sverka: sverkaTrig('cos', '$A$', A, s.itog),
      otvet: s.itog,
    };
  },
  27: (p) => {
    const bc2 = p.k * p.k * p.m;
    const ac = Math.sqrt(p.ab * p.ab - bc2);
    const s = sokr([ac], p.ab, '\\sin B');
    const B = Math.acos(Math.sqrt(bc2) / p.ab) * VGR;
    return {
      shagi: [
        shag('Катет $AC$ по теореме Пифагора', 'Синусу угла $B$ нужен противолежащий катет $AC$.', [
          `AC = \\sqrt{AB^2 - BC^2} = \\sqrt{${n(p.ab * p.ab)} - ${n(bc2)}} = ${n(ac)}`,
        ]),
        shag(
          'Синус угла $B$',
          'Синус — противолежащий катет, делённый на гипотенузу.',
          [`\\sin B = \\dfrac{AC}{AB} = \\dfrac{${n(ac)}}{${n(p.ab)}} = ${n(s.itog)}`],
          undefined,
          s.shagi,
        ),
      ],
      voprosy: [
        vopros(
          'Какой катет лежит против угла $B$?',
          ['$AC$', '$BC$', '$AB$'],
          'Против угла $B$ — сторона $AC$.',
        ),
      ],
      sverka: sverkaTrig('sin', '$B$', B, s.itog),
      otvet: s.itog,
    };
  },
  28: (p) => {
    const sinA = (p.n * Math.sqrt(p.m)) / p.d;
    const ans = Math.round(Math.sqrt(1 - sinA * sinA) * 1e6) / 1e6;
    const B = 90 - Math.asin(sinA) * VGR;
    return {
      shagi: [
        shag(
          'Синус $B$ — это косинус $A$',
          'Острые углы прямоугольного треугольника дополняют друг друга до $90^\\circ$, поэтому $\\sin B = \\cos A$: катет, противолежащий углу $B$, прилежит к углу $A$.',
        ),
        shag(
          'Основное тригонометрическое тождество',
          '$\\sin^2 A + \\cos^2 A = 1$, а косинус острого угла положителен.',
          [
            `\\sin B = \\cos A = \\sqrt{1 - \\left(${drob(p.n, p.d, p.m, p.dec === 1)}\\right)^2} = ${n(ans)}`,
          ],
        ),
      ],
      voprosy: [
        vopros(
          'Чему равен $\\sin B$ в прямоугольном треугольнике?',
          ['$\\cos A$', '$\\sin A$', '$\\operatorname{tg} A$'],
          'Противолежащий углу $B$ катет — прилежащий к углу $A$.',
        ),
      ],
      sverka: sverkaTrig('sin', '$B$', B, ans),
      otvet: ans,
    };
  },
  29: (p) => {
    const tg = (p.n * Math.sqrt(p.m)) / p.d;
    const bc = p.ac * tg;
    const ab = Math.round(Math.sqrt(p.ac * p.ac + bc * bc) * 1e6) / 1e6;
    return {
      shagi: [
        shag(
          'Катет $BC$ через тангенс',
          'Тангенс угла $A$ — противолежащий катет $BC$, делённый на прилежащий $AC$.',
          [
            `BC = AC\\cdot\\operatorname{tg} A = ${n(p.ac)}\\cdot ${drob(p.n, p.d, p.m)} = ${p.m === 1 ? n(bc) : kor((p.ac * p.n) / p.d, p.m)}`,
          ],
          1,
        ),
        shag('Гипотенуза по теореме Пифагора', '', [
          `AB = \\sqrt{AC^2 + BC^2} = \\sqrt{${n(p.ac * p.ac)} + ${n(Math.round(bc * bc * 1e6) / 1e6)}} = ${n(ab)}`,
        ]),
      ],
      voprosy: [
        vopros(
          'Тангенс острого угла — это…',
          [
            'противолежащий катет : прилежащий',
            'прилежащий катет : гипотенуза',
            'гипотенуза : катет',
          ],
          '$\\operatorname{tg} A = \\frac{BC}{AC}$.',
          1,
        ),
      ],
      sverka: sverkaDliny('гипотенуза $AB$', ab, 'катет $AC$', p.ac, 'гипотенуза длиннее катета'),
      otvet: ab,
    };
  },
  30: (p) => {
    const cos = (p.n * Math.sqrt(p.m)) / p.d;
    const sin = Math.sqrt(1 - cos * cos);
    const ch = p.hk * Math.sqrt(p.hm);
    const ac = Math.round((ch / sin) * 1e6) / 1e6;
    return {
      shagi: [
        shag(
          'Синус угла $A$',
          'Высота $CH$ — катет прямоугольного треугольника $ACH$, противолежащий углу $A$. Нужен синус: находим его из косинуса по основному тождеству.',
          [
            `\\sin A = \\sqrt{1 - \\cos^2 A} = \\sqrt{1 - \\left(${drob(p.n, p.d, p.m, p.dec === 1)}\\right)^2} = ${n(Math.round(sin * 1e6) / 1e6)}`,
          ],
        ),
        shag(
          'Гипотенуза $AC$',
          '$\\sin A = \\dfrac{CH}{AC}$, отсюда $AC = \\dfrac{CH}{\\sin A}$.',
          [`AC = \\dfrac{${kor(p.hk, p.hm)}}{${n(Math.round(sin * 1e6) / 1e6)}} = ${n(ac)}`],
        ),
      ],
      voprosy: [
        vopros(
          'Какая функция угла $A$ связывает $CH$ и $AC$?',
          ['синус', 'косинус', 'тангенс'],
          '$CH$ — противолежащий катет, $AC$ — гипотенуза.',
        ),
      ],
      sverka: sverkaDliny(
        'боковая сторона $AC$',
        ac,
        'высота $CH$',
        ch,
        'гипотенуза длиннее катета',
      ),
      otvet: ac,
    };
  },
  31: (p) => {
    const ans = p.h / p.a;
    const s = sokr([p.h], p.a, '\\sin');
    const [ug, os, vys, ver] = p.k ? ['ACB', 'AC', 'CH', 'A'] : ['BAC', 'AB', 'AH', 'B'];
    return {
      shagi: [
        shag(
          'Углы при основании',
          `Треугольник равнобедренный, углы при основании $${os}$ равны: синус угла $${ug}$ равен синусу угла при вершине $${ver}$.`,
          undefined,
          1,
        ),
        shag(
          'Синус из прямоугольного треугольника',
          `Высота $${vys}$ отсекает прямоугольный треугольник с гипотенузой $${os}$ и катетом $${vys}$ против угла при основании.`,
          [`\\sin = \\dfrac{${vys}}{${os}} = \\dfrac{${n(p.h)}}{${n(p.a)}} = ${n(s.itog)}`],
          undefined,
          s.shagi,
        ),
      ],
      voprosy: [
        vopros(
          'В каком прямоугольном треугольнике удобно искать синус?',
          [
            `с гипотенузой $${os}$ и катетом $${vys}$`,
            'в треугольнике $ABC$',
            'с гипотенузой — боковой стороной',
          ],
          'Там угол при основании противолежит высоте.',
          1,
        ),
      ],
      sverka: `Сверяем: синус — число между $0$ и $1$, и высота короче основания: $${n(p.h)} < ${n(p.a)}$ — сходится.`,
      otvet: ans,
    };
  },
  32: (p) => {
    const s = sokr([p.m], p.c, '\\cos');
    return {
      shagi: [
        shag(
          'Углы при основании',
          'Треугольник равнобедренный: $\\angle BAC = \\angle B$, значит, нужен косинус угла $B$.',
          undefined,
          1,
        ),
        shag(
          'Прямоугольный треугольник $ABH$',
          'Высота $AH$ отсекает прямоугольный треугольник $ABH$: $BH$ — катет, прилежащий к углу $B$, $AB$ — гипотенуза.',
          [`\\cos B = \\dfrac{BH}{AB} = \\dfrac{${n(p.m)}}{${n(p.c)}} = ${n(s.itog)}`],
          undefined,
          s.shagi,
        ),
      ],
      voprosy: [
        vopros(
          'Какой угол равен углу $BAC$?',
          ['$\\angle B$', '$\\angle C$', '$\\angle BAH$'],
          'Углы при основании $AB$ равны.',
          1,
        ),
      ],
      sverka: `Сверяем: косинус острого угла — от $0$ до $1$, и $BH$ короче $AB$: $${n(p.m)} < ${n(p.c)}$ — сходится.`,
      otvet: s.itog,
    };
  },

  /* ── VI ────────────────────────────────────────────────────── */
  33: (p) => {
    const ans = p.k ? p.d : 2 * p.d;
    return {
      shagi: [
        shag(
          'Центральный и вписанный',
          'Вписанный угол равен половине центрального, опирающегося на ту же дугу. Обозначим вписанный $x$, тогда центральный $2x$.',
          undefined,
          1,
        ),
        shag('Уравнение', 'Центральный больше вписанного на $' + g(p.d) + '$.', [
          `2x - x = ${g(p.d)},\\quad x = ${g(p.d)}`,
          ...(p.k ? [] : [`2x = ${g(2 * p.d)}`]),
        ]),
      ],
      voprosy: [
        vopros(
          'Как связаны вписанный и центральный углы на одну дугу?',
          ['центральный вдвое больше', 'они равны', 'центральный на $90^\\circ$ больше'],
          'Вписанный угол равен половине дуги, центральный — всей дуге.',
          1,
        ),
      ],
      sverka: sverkaUgla(p.k ? 'вписанный' : 'центральный', ans),
      otvet: ans,
    };
  },
  34: (p) => {
    if (p.k) {
      const ans = 180 - 2 * p.u;
      return {
        shagi: [
          shag(
            'Центральный угол $AOB$',
            'Вписанный угол $ACB$ опирается на дугу $AB$; центральный угол $AOB$ на ту же дугу вдвое больше.',
            [`\\angle AOB = 2\\cdot ${g(p.u)} = ${g(2 * p.u)}`],
            1,
          ),
          shag('Смежные углы', '$BD$ — диаметр, углы $AOB$ и $AOD$ смежные.', [
            `\\angle AOD = 180^\\circ - ${g(2 * p.u)} = ${g(ans)}`,
          ]),
        ],
        voprosy: [
          vopros(
            'Чему равен угол $AOB$?',
            variantyGradusov(2 * p.u, p.u, 180 - p.u),
            'Центральный угол вдвое больше вписанного на ту же дугу.',
            1,
          ),
        ],
        sverka: sverkaUgla('$AOD$', ans),
        otvet: ans,
      };
    }
    const ans = (180 - p.u) / 2;
    return {
      shagi: [
        shag(
          'Центральный угол $AOB$',
          '$BD$ — диаметр, поэтому углы $AOD$ и $AOB$ смежные.',
          [`\\angle AOB = 180^\\circ - ${g(p.u)} = ${g(180 - p.u)}`],
          1,
        ),
        shag(
          'Вписанный угол',
          'Вписанный угол $ACB$ опирается на ту же дугу $AB$ — он вдвое меньше центрального.',
          [`\\angle ACB = ${g(180 - p.u)} : 2 = ${g(ans)}`],
        ),
      ],
      voprosy: [
        vopros(
          'Чему равен угол $AOB$?',
          variantyGradusov(180 - p.u, p.u, 90),
          'Углы $AOD$ и $AOB$ — смежные.',
          1,
        ),
      ],
      sverka: sverkaUgla('$ACB$', ans),
      otvet: ans,
    };
  },
  35: (p) => {
    const duga = (360 * p.n) / p.d;
    const ans = duga / 2;
    const s = sokr([360, p.n], p.d, '\\smile');
    return {
      shagi: [
        shag(
          'Дуга в градусах',
          'Вся окружность — $360^\\circ$.',
          [`\\dfrac{${p.n}}{${p.d}}\\cdot 360^\\circ = ${g(s.itog)}`],
          1,
          s.shagi,
        ),
        shag('Вписанный угол', 'Вписанный угол равен половине дуги, на которую опирается.', [
          `${g(duga)} : 2 = ${g(ans)}`,
        ]),
      ],
      voprosy: [
        vopros(
          'Сколько градусов во всей окружности?',
          variantyGradusov(360, 180, 90),
          'Полный оборот — $360^\\circ$.',
          1,
        ),
        vopros(
          'Вписанный угол равен…',
          ['половине дуги', 'дуге', 'удвоенной дуге'],
          'Это теорема о вписанном угле.',
        ),
      ],
      sverka: sverkaUgla('вписанный', ans),
      otvet: ans,
    };
  },
  36: (p) => {
    const ab = 360 - p.ac - p.bc;
    const ans = ab / 2;
    return {
      shagi: [
        shag(
          'Дуга $AB$',
          'Три дуги $AC$, $CB$ и $BA$ вместе составляют окружность.',
          [`\\smile AB = 360^\\circ - ${g(p.ac)} - ${g(p.bc)} = ${g(ab)}`],
          2,
        ),
        shag(
          'Вписанный угол',
          'Угол $ACB$ опирается на дугу $AB$ (не содержащую $C$) и равен её половине.',
          [`\\angle ACB = ${g(ab)} : 2 = ${g(ans)}`],
        ),
      ],
      voprosy: [
        vopros(
          'На какую дугу опирается угол $ACB$?',
          ['$AB$, не содержащую $C$', '$AC$', '$BC$'],
          'Вписанный угол опирается на дугу между сторонами угла.',
          2,
        ),
      ],
      sverka: sverkaUgla('$ACB$', ans),
      otvet: ans,
    };
  },
  37: (p) => {
    const ans = 90 - p.u;
    return {
      shagi: [
        shag(
          'Радиус и касательная',
          'Радиус, проведённый в точку касания, перпендикулярен касательной: $\\angle OAC = 90^\\circ$.',
          undefined,
          1,
        ),
        shag(
          'Центральный угол',
          'В прямоугольном треугольнике $OAC$ острые углы дают в сумме $90^\\circ$. Угол $AOB$ — центральный, он равен дуге $AB$.',
          [
            p.k
              ? `\\angle ACO = 90^\\circ - ${g(p.u)} = ${g(ans)}`
              : `\\smile AB = \\angle AOB = 90^\\circ - ${g(p.u)} = ${g(ans)}`,
          ],
          2,
        ),
      ],
      voprosy: [
        vopros(
          'Какой угол между радиусом $OA$ и касательной $CA$?',
          variantyGradusov(90, p.u, 180 - p.u),
          'Радиус в точку касания перпендикулярен касательной.',
          1,
        ),
        vopros(
          'Центральный угол $AOB$ равен…',
          ['дуге $AB$', 'половине дуги $AB$', 'удвоенной дуге'],
          'Центральный угол измеряется дугой, на которую опирается.',
          2,
        ),
      ],
      sverka: p.k
        ? sverkaUgla('$ACO$', ans)
        : `Сверяем с рисунком: дуга $AB$ меньше четверти окружности, $${g(ans)} < 90^\\circ$ — сходится.`,
      otvet: ans,
    };
  },
  38: (p) => {
    const aob = 90 - p.u;
    const ans = 180 - aob;
    return {
      shagi: [
        shag(
          'Радиус и касательная',
          'Радиус $OA$ перпендикулярен касательной $CA$: треугольник $OAC$ прямоугольный.',
          undefined,
          1,
        ),
        shag(
          'Угол $AOB$',
          'Острые углы прямоугольного треугольника дополняют друг друга до $90^\\circ$.',
          [`\\angle AOB = 90^\\circ - ${g(p.u)} = ${g(aob)}`],
          2,
        ),
        shag(
          'Дуга $AD$',
          '$BD$ — диаметр, угол $AOD$ смежный с $AOB$; центральный угол равен своей дуге.',
          [`\\smile AD = 180^\\circ - ${g(aob)} = ${g(ans)}`],
        ),
      ],
      voprosy: [
        vopros(
          'Чему равен угол $AOB$?',
          variantyGradusov(aob, p.u, 180 - p.u),
          'Сумма острых углов треугольника $OAC$ — $90^\\circ$.',
          2,
        ),
      ],
      sverka: `Сверяем с рисунком: дуга $AD$ больше четверти окружности, $${g(ans)} > 90^\\circ$ — сходится.`,
      otvet: ans,
    };
  },
  39: (p) => {
    const ans = 180 - p.g;
    return {
      shagi: [
        shag(
          'Прямые углы',
          'Радиусы в точки касания перпендикулярны касательным: $\\angle OAC = \\angle OBC = 90^\\circ$.',
          undefined,
          1,
        ),
        shag(
          'Четырёхугольник $OACB$',
          'Центральный угол $AOB$ равен меньшей дуге $AB$. Сумма углов четырёхугольника — $360^\\circ$.',
          [`\\angle ACB = 360^\\circ - 90^\\circ - 90^\\circ - ${g(p.g)} = ${g(ans)}`],
          2,
        ),
      ],
      voprosy: [
        vopros(
          'Сумма углов четырёхугольника $OACB$ равна…',
          variantyGradusov(360, 180, 270),
          'Две пары треугольников — $2\\cdot180^\\circ$.',
          2,
        ),
      ],
      sverka: sverkaUgla('$ACB$', ans),
      otvet: ans,
    };
  },
  40: (p) => {
    const adb = p.t / 2;
    const ans = adb - p.f;
    return {
      shagi: [
        shag(
          'Вписанный угол $ADB$',
          'Угол $ADB$ опирается на дугу $AB$ и равен её половине.',
          [`\\angle ADB = ${g(p.t)} : 2 = ${g(adb)}`],
          1,
        ),
        shag(
          'Внешний угол треугольника $ADC$',
          'Угол $ADB$ — внешний угол треугольника $ADC$: он равен сумме двух углов, не смежных с ним, $\\angle DAC + \\angle ACD$.',
          [`\\angle DAE = ${g(adb)} - ${g(p.f)} = ${g(ans)}`],
        ),
      ],
      voprosy: [
        vopros(
          'Чему равен угол $ADB$?',
          variantyGradusov(adb, p.t, p.f),
          'Вписанный угол — половина дуги.',
          1,
        ),
        vopros(
          'Внешний угол треугольника равен…',
          ['сумме двух несмежных углов', 'их разности', '$180^\\circ$'],
          'Это свойство внешнего угла.',
        ),
      ],
      sverka: sverkaUgla('$DAE$', ans),
      otvet: ans,
    };
  },

  /* ── VII ───────────────────────────────────────────────────── */
  41: (p) => {
    const ans = p.k ? p.ab + p.cd - p.bc : p.bc + p.da - p.ab;
    const formula = p.k
      ? `AD = AB + CD - BC = ${n(p.ab)} + ${n(p.cd)} - ${n(p.bc)} = ${n(ans)}`
      : `CD = BC + AD - AB = ${n(p.bc)} + ${n(p.da)} - ${n(p.ab)} = ${n(ans)}`;
    return {
      shagi: [
        shag(
          'Свойство описанного четырёхугольника',
          'Если в четырёхугольник вписана окружность, суммы его противоположных сторон равны: $AB + CD = BC + AD$. Причина — отрезки касательных из одной вершины равны.',
        ),
        shag('Четвёртая сторона', 'Выражаем неизвестную сторону.', [formula]),
      ],
      voprosy: [
        vopros(
          'Какие суммы сторон равны у описанного четырёхугольника?',
          ['$AB + CD = BC + AD$', '$AB + BC = CD + AD$', '$AB + AD = BC + CD$'],
          'Противоположные стороны в сумме равны.',
        ),
      ],
      sverka: `Сверяем: $AB + CD = ${n(p.ab + (p.k ? p.cd : ans))}$ и $BC + AD = ${n(p.bc + (p.k ? ans : p.da))}$ — суммы равны, сходится.`,
      otvet: ans,
    };
  },
  42: (p) => {
    const ans = 2 * (p.ab + p.cd);
    return {
      shagi: [
        shag(
          'Свойство описанного четырёхугольника',
          'Суммы противоположных сторон равны: $BC + AD = AB + CD$.',
          [`BC + AD = ${n(p.ab)} + ${n(p.cd)} = ${n(p.ab + p.cd)}`],
        ),
        shag('Периметр', 'Периметр — обе суммы вместе.', [
          `P = 2\\cdot ${n(p.ab + p.cd)} = ${n(ans)}`,
        ]),
      ],
      voprosy: [
        vopros(
          'Чему равна сумма $BC + AD$?',
          [`$${n(p.ab + p.cd)}$`, `$${n(2 * (p.ab + p.cd))}$`, `$${n((p.ab + p.cd) / 2)}$`],
          'У описанного четырёхугольника $AB + CD = BC + AD$.',
        ),
      ],
      sverka: `Сверяем: периметр больше удвоенной самой длинной из данных сторон, $${n(ans)} > ${n(2 * Math.max(p.ab, p.cd))}$ — сходится.`,
      otvet: ans,
    };
  },
  43: (p) => {
    const sumBok = p.per / 2;
    const malBok = sumBok - p.c;
    const ans = malBok / 2;
    return {
      shagi: [
        shag(
          'Суммы сторон',
          'В описанной трапеции сумма оснований равна сумме боковых сторон, значит, каждая сумма — половина периметра.',
          [`\\text{сумма боковых} = ${n(p.per)} : 2 = ${n(sumBok)}`],
        ),
        shag(
          'Меньшая боковая сторона',
          'У прямоугольной трапеции меньшая боковая сторона перпендикулярна основаниям — это высота.',
          [`h = ${n(sumBok)} - ${n(p.c)} = ${n(malBok)}`],
        ),
        shag(
          'Радиус',
          'Высота описанной трапеции равна диаметру вписанной окружности.',
          [`r = ${n(malBok)} : 2 = ${n(ans)}`],
          1,
        ),
      ],
      voprosy: [
        vopros(
          'Чему равна высота трапеции, описанной около окружности?',
          ['диаметру окружности', 'радиусу', 'средней линии'],
          'Окружность касается обоих оснований — между ними ровно диаметр.',
          1,
        ),
      ],
      sverka: sverkaDliny(
        'радиус',
        ans,
        'большая боковая сторона',
        p.c,
        'диаметр меньше любой боковой стороны',
      ),
      otvet: ans,
    };
  },
  44: (p) => {
    const ans = (p.c + p.d) / 2;
    return {
      shagi: [
        shag(
          'Свойство описанной трапеции',
          'Сумма оснований описанной трапеции равна сумме боковых сторон.',
          [`a + b = ${n(p.c)} + ${n(p.d)} = ${n(p.c + p.d)}`],
        ),
        shag('Средняя линия', 'Средняя линия — полусумма оснований.', [
          `m = ${n(p.c + p.d)} : 2 = ${n(ans)}`,
        ]),
      ],
      voprosy: [
        vopros(
          'Средняя линия трапеции равна…',
          ['полусумме оснований', 'сумме оснований', 'полуразности оснований'],
          '$m = \\frac{a+b}{2}$.',
        ),
      ],
      sverka: `Сверяем: средняя линия лежит между боковыми сторонами по длине: $${n(Math.min(p.c, p.d))} \\le ${n(ans)} \\le ${n(Math.max(p.c, p.d))}$ — сходится.`,
      otvet: ans,
    };
  },

  /* ── VIII ──────────────────────────────────────────────────── */
  45: (p) => {
    const abc = p.abd + p.cad;
    const ans = p.k ? p.abd : abc;
    return {
      shagi: [
        shag(
          'Равные вписанные углы',
          'Углы $DBC$ и $CAD$ опираются на одну дугу $CD$ — они равны.',
          [`\\angle DBC = \\angle CAD = ${g(p.cad)}`],
          1,
        ),
        shag(p.k ? 'Угол $ABD$' : 'Угол $ABC$', 'Угол $ABC$ складывается из углов $ABD$ и $DBC$.', [
          p.k
            ? `\\angle ABD = ${g(abc)} - ${g(p.cad)} = ${g(ans)}`
            : `\\angle ABC = ${g(p.abd)} + ${g(p.cad)} = ${g(ans)}`,
        ]),
      ],
      voprosy: [
        vopros(
          'Какой угол равен углу $CAD$?',
          ['$\\angle DBC$', '$\\angle ABD$', '$\\angle ACB$'],
          'Вписанные углы, опирающиеся на одну дугу, равны.',
          1,
        ),
      ],
      sverka: sverkaUgla(p.k ? '$ABD$' : '$ABC$', ans),
      otvet: ans,
    };
  },
  46: (p) => {
    const ans = p.abc - p.abd;
    return {
      shagi: [
        shag(
          'Угол $DBC$',
          'Угол $ABC$ состоит из углов $ABD$ и $DBC$.',
          [`\\angle DBC = ${g(p.abc)} - ${g(p.abd)} = ${g(ans)}`],
          1,
        ),
        shag('Равные вписанные углы', 'Углы $CAD$ и $DBC$ опираются на одну дугу $CD$.', [
          `\\angle CAD = \\angle DBC = ${g(ans)}`,
        ]),
      ],
      voprosy: [
        vopros(
          'Почему $\\angle CAD = \\angle DBC$?',
          ['опираются на одну дугу', 'вертикальные', 'накрест лежащие'],
          'Вписанные углы на одну дугу равны.',
          1,
        ),
      ],
      sverka: sverkaUgla('$CAD$', ans),
      otvet: ans,
    };
  },
  47: (p) => {
    const ans = 180 - p.u;
    return {
      shagi: [
        shag(
          'Вписанный четырёхугольник',
          'Сумма противолежащих углов вписанного четырёхугольника равна $180^\\circ$: вместе они опираются на всю окружность.',
          [
            p.k
              ? `\\angle BAD = 180^\\circ - ${g(p.u)} = ${g(ans)}`
              : `\\angle BCD = 180^\\circ - ${g(p.u)} = ${g(ans)}`,
          ],
        ),
      ],
      voprosy: [
        vopros(
          'Сумма противолежащих углов вписанного четырёхугольника равна…',
          variantyGradusov(180, 360, 90),
          'Два вписанных угла опираются на две дуги, вместе — $360^\\circ$, углы — вдвое меньше.',
        ),
      ],
      sverka: sverkaUgla(p.k ? '$BAD$' : '$BCD$', ans),
      otvet: ans,
    };
  },
  48: (p) => {
    const c = 180 - p.a;
    const d = 180 - p.b;
    const ans = p.k ? Math.max(c, d) : Math.min(c, d);
    return {
      shagi: [
        shag(
          'Данные углы — соседние',
          `$${g(p.a)} + ${g(p.b)} \\ne 180^\\circ$, значит, данные углы не противолежащие: напротив каждого стоит один из оставшихся.`,
        ),
        shag(
          'Оставшиеся углы',
          'Противолежащие углы вписанного четырёхугольника дают $180^\\circ$.',
          [`180^\\circ - ${g(p.a)} = ${g(c)},\\qquad 180^\\circ - ${g(p.b)} = ${g(d)}`],
        ),
        shag(p.k ? 'Больший' : 'Меньший', `Выбираем ${p.k ? 'больший' : 'меньший'} из двух.`, [
          `${g(ans)}`,
        ]),
      ],
      voprosy: [
        vopros(
          'Чему равна сумма противолежащих углов?',
          variantyGradusov(180, 360, 90),
          'Свойство вписанного четырёхугольника.',
        ),
      ],
      sverka: sverkaUgla(p.k ? 'больший оставшийся' : 'меньший оставшийся', ans),
      otvet: ans,
    };
  },
  49: (p) => {
    const sinC = Math.sin(p.g * (Math.PI / 180));
    const ab = p.k * Math.sqrt(p.m);
    const ans = Math.round((ab / (2 * sinC)) * 1e6) / 1e6;
    const sinTex =
      p.g === 120
        ? '\\dfrac{\\sqrt3}{2}'
        : p.g === 135
          ? '\\dfrac{\\sqrt2}{2}'
          : p.g === 150
            ? '\\dfrac12'
            : n(sinC);
    return {
      shagi: [
        shag(
          'Синус тупого угла',
          'Синусы смежных углов равны: $\\sin(180^\\circ - x) = \\sin x$.',
          [`\\sin ${g(p.g)} = \\sin ${g(180 - p.g)} = ${sinTex}`],
        ),
        shag(
          'Расширенная теорема синусов',
          'Сторона, делённая на синус противолежащего угла, равна диаметру описанной окружности.',
          [
            `2R = \\dfrac{AB}{\\sin C}\\quad\\Rightarrow\\quad R = \\dfrac{${kor(p.k, p.m)}}{2\\cdot ${sinTex}} = ${n(ans)}`,
          ],
          1,
        ),
      ],
      voprosy: [
        vopros(
          'Чему равен синус тупого угла?',
          ['синусу смежного острого', 'минус синусу смежного', 'косинусу смежного'],
          '$\\sin(180^\\circ - x) = \\sin x$.',
        ),
        vopros(
          'Теорема синусов: $\\frac{a}{\\sin A} = $',
          ['$2R$', '$R$', '$\\frac{R}{2}$'],
          'Расширенная теорема синусов.',
          1,
        ),
      ],
      sverka: `Сверяем: хорда не длиннее диаметра — $AB = ${kor(p.k, p.m)} \\le 2R = ${n(2 * ans)}$ — сходится.`,
      otvet: ans,
    };
  },
};
