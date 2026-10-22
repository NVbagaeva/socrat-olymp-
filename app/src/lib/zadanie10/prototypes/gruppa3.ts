/**
 * Группа III — степени и корни (П-18 … П-21) и прототипы из курса
 * П-30 … П-32 (неравенства со степенями).
 *
 * Приём: возвести обе части в нужную степень или извлечь корень;
 * дробный показатель $\frac{7}{5}$ или $\frac{5}{3}$ — это «корень из
 * степени», и удобнее всего представлять числа степенями одного
 * основания. Большие и малые числа — в стандартном виде $a\cdot10^n$.
 */

import { FAKT, perevod } from '../../teoriya/perevod';
import { div, mul } from '../../zadanie11/num';
import {
  chtoNayti,
  d,
  dano,
  fq,
  korenQ,
  num,
  q,
  razbor,
  sokrashchenie,
  str,
  val,
  vKakihEdinicah,
  vopros,
  type Q,
} from '../kit';
import type { Params, Prototype, Solved } from '../types';

/* ── П-18 Разгон: v = √(2la) ────────────────────────────────────── */

const P18: Prototype = {
  id: 'P18',
  no: 18,
  group: 'III',
  title: 'Разгон автомобиля: путь или ускорение',
  formula: 'v=\\sqrt{2la}',
  ask: 'путь $l$ или ускорение $a$',
  skills: ['stepen'],
  fipiNos: '79–86',
  alt: 'Автомобиль разгоняется на прямом участке шоссе, рядом спидометр',
  solve(p) {
    const find = str(p, 'find', ['l', 'a'] as const);
    const v = num(p, 'v');
    if (find === 'l') {
      const a = num(p, 'a');
      const l = val(q(v * v, 2 * a));
      return {
        answer: l,
        iskomoe: 'l',
        edinicy: 'км',
        dano: [
          dano('a', a, 'км/ч²', 'ускорение'),
          dano('v', v, 'км/ч', 'скорость в конце разгона'),
        ],
        etapy: razbor({
          dano: [
            dano('a', a, 'км/ч²', 'ускорение'),
            dano('v', v, 'км/ч', 'скорость в конце разгона'),
          ],
          ishchem: [`Ищем путь $l$. Подставляем: $${d(v)}=\\sqrt{2\\cdot l\\cdot${d(a)}}$.`],
          vid: 'uravnenie',
          reshaem: [
            `Обе части неотрицательны — возводим в квадрат: $${d(v * v)}=${d(2 * a)}l$.`,
            `$l=\\dfrac{${d(v * v)}}{${d(2 * a)}}=${d(l)}$.`,
          ],
          proverka: [
            `${perevod(FAKT.kmM, 'километры', 'метры', 'vniz', `${d(l)}\\text{ км}=${d(l)}\\cdot1000=${d(Math.round(l * 1000))}\\text{ м}`)} Столько нужно на разгон до $${d(v)}$ км/ч — правдоподобно для машины на шоссе или трассе.`,
          ],
          answer: l,
          ed: 'км',
        }),
        vychisleniya: sokrashchenie([v, v], 2 * a, 'l'),
        hints: [
          chtoNayti('путь $l$', ['ускорение $a$', 'время разгона']),
          vopros('Как избавиться от корня?', 'возвести обе части в квадрат', [
            'извлечь корень ещё раз',
            'разделить на 2',
          ]),
          vopros('Чему равно $v^2$?', `$${d(v * v)}$`, [`$${d(2 * v)}$`, `$${d(v * 10)}$`]),
          vKakihEdinicah('в километрах', ['в метрах', 'в км/ч']),
        ],
      };
    }
    const l = num(p, 'l');
    const a = val(div(q(v * v), mul(q(2), q(l))));
    return {
      answer: a,
      iskomoe: 'a',
      edinicy: 'км/ч²',
      dano: [dano('l', l, 'км', 'путь разгона'), dano('v', v, 'км/ч', 'скорость в конце разгона')],
      etapy: razbor({
        dano: [
          dano('l', l, 'км', 'путь разгона'),
          dano('v', v, 'км/ч', 'скорость в конце разгона'),
        ],
        ishchem: [`Ищем ускорение $a$. Подставляем: $${d(v)}=\\sqrt{2\\cdot${d(l)}\\cdot a}$.`],
        vid: 'uravnenie',
        reshaem: [
          `Возводим в квадрат: $${d(v * v)}=${d(2 * l)}a$.`,
          `$a=\\dfrac{${d(v * v)}}{${d(2 * l)}}=${d(a)}$.`,
        ],
        proverka: [
          `Ускорение в км/ч² выглядит огромным, но это нормально. Переводим дробь по частям: числитель $1\\text{ км}=1000\\text{ м}$ (большая → меньшая, умножаем), знаменатель $1\\text{ ч}^2=3600^2\\text{ с}^2$ (большая → меньшая, умножаем): $${d(a)}\\text{ км/ч}^2=\\dfrac{${d(a)}\\cdot1000}{3600^2}\\text{ м/с}^2\\approx${d(Math.round((a / 12960) * 10) / 10)}\\text{ м/с}^2$ — обычный разгон автомобиля.`,
        ],
        answer: a,
        ed: 'км/ч²',
      }),
      vychisleniya: [
        {
          tekst: 'Деление на десятичную дробь: умножим числитель и знаменатель на 10:',
          tex: `\\dfrac{${d(v * v)}}{${d(2 * l)}}=\\dfrac{${d(v * v * 10)}}{${d(Math.round(2 * l * 10))}}=${d(a)}`,
        },
      ],
      hints: [
        chtoNayti('ускорение $a$', ['путь $l$', 'скорость $v$']),
        vopros('Как избавиться от корня?', 'возвести обе части в квадрат', [
          'умножить на 2',
          'разделить на $l$',
        ]),
        vopros('Какое уравнение получится?', `$${d(v * v)}=${d(2 * l)}a$`, [
          `$${d(v)}=${d(2 * l)}a$`,
          `$${d(v * v)}=${d(l)}a$`,
        ]),
        vKakihEdinicah('в км/ч²', ['в м/с²', 'в км/ч']),
      ],
    };
  },
};

/* ── П-19 Линия горизонта ───────────────────────────────────────── */

const P19: Prototype = {
  id: 'P19',
  no: 19,
  group: 'III',
  title: 'Дальность линии горизонта',
  formula: 'l=\\sqrt{2Rh}',
  ask: 'высоту наблюдателя',
  skills: ['stepen', 'edinicy'],
  fipiNos: '87–94',
  alt: 'Наблюдатель на вышке смотрит на линию горизонта над морем',
  solve(p) {
    const R = num(p, 'R');
    const l = num(p, 'l');
    const form = str(p, 'form', ['km', 'm'] as const);
    const l2 = q(l * l);
    if (form === 'km') {
      const h = div(l2, q(2 * R));
      const ans = val(h);
      return {
        answer: ans,
        iskomoe: 'h',
        edinicy: 'км',
        dano: [dano('R', R, 'км', 'радиус Земли'), dano('l', l, 'км', 'расстояние до горизонта')],
        etapy: razbor({
          dano: [dano('R', R, 'км', 'радиус Земли'), dano('l', l, 'км', 'расстояние до горизонта')],
          ishchem: [`Ищем $h$ (в км). Подставляем: $${d(l)}=\\sqrt{2\\cdot${d(R)}\\cdot h}$.`],
          vid: 'uravnenie',
          reshaem: [
            `Возводим в квадрат: $${fq(l2, true)}=${d(2 * R)}h$.`,
            `$h=\\dfrac{${fq(l2, true)}}{${d(2 * R)}}=${d(ans)}$.`,
          ],
          proverka: [
            `${perevod(FAKT.kmM, 'километры', 'метры', 'vniz', `${d(ans)}\\text{ км}=${d(ans)}\\cdot1000=${d(Math.round(ans * 1000))}\\text{ м}`)} Это высота горы или самолёта — с неё горизонт и правда виден за десятки километров.`,
          ],
          answer: ans,
          ed: 'км',
        }),
        vychisleniya: sokrashchenie([l, l], 2 * R, 'h'),
        hints: [
          chtoNayti('высоту $h$', ['расстояние $l$', 'радиус Земли']),
          vopros('Как избавиться от корня?', 'возвести обе части в квадрат', [
            'разделить на $R$',
            'умножить на 2',
          ]),
          vKakihEdinicah('в километрах', ['в метрах', 'в сантиметрах']),
        ],
      };
    }
    const h = div(mul(l2, q(500)), q(R));
    const ans = val(h);
    return {
      answer: ans,
      iskomoe: 'h',
      edinicy: 'м',
      dano: [dano('R', R, 'км', 'радиус Земли'), dano('l', l, 'км', 'расстояние до горизонта')],
      etapy: razbor({
        dano: [dano('R', R, 'км', 'радиус Земли'), dano('l', l, 'км', 'расстояние до горизонта')],
        ishchem: [
          `В этой формуле $h$ — сразу в метрах (деление на $500$ уже учитывает перевод). Подставляем: $${d(l)}=\\sqrt{\\dfrac{${d(R)}h}{500}}$.`,
        ],
        vid: 'uravnenie',
        reshaem: [
          `Возводим в квадрат: $${fq(l2, true)}=\\dfrac{${d(R)}h}{500}$.`,
          `$h=\\dfrac{${fq(l2, true)}\\cdot500}{${d(R)}}=${d(ans)}$.`,
        ],
        proverka: [
          `С высоты $${d(ans)}$ м горизонт виден на $${d(l)}$ км — чем выше, тем дальше, всё согласовано.`,
        ],
        answer: ans,
        ed: 'м',
      }),
      vychisleniya: [
        {
          tekst: 'Сначала сократим $500$ и $6400$ на $100$:',
          tex: `\\dfrac{500}{6400}=\\dfrac{5}{64}`,
        },
      ],
      hints: [
        chtoNayti('высоту $h$ в метрах', ['расстояние $l$', 'высоту в километрах']),
        vopros('Что сделать первым?', 'возвести обе части в квадрат', [
          'умножить на 500',
          'перевести $R$ в метры',
        ]),
        vopros('Нужно ли переводить ответ в метры?', 'нет, формула уже даёт $h$ в метрах', [
          'да, умножить на 1000',
          'да, разделить на 1000',
        ]),
      ],
    };
  },
};

/* ── Стефан — Больцман: П-20 (равенство) и П-30 (неравенство) ───── */

/** T⁴ = c·10^E, c — рациональное; T = r·10^k. */
function koren4(c: Q, E: number): { N: number; k: number; r: number } {
  for (let k = Math.floor(E / 4); k >= -6; k -= 1) {
    const N = val(c) * 10 ** (E - 4 * k);
    const Nr = Math.round(N);
    if (Math.abs(N - Nr) > 1e-6 || Nr <= 0) {
      continue;
    }
    const r = korenQ(q(Nr), 4);
    if (r !== null) {
      return { N: Nr, k, r: val(r) };
    }
  }
  throw new Error(`корень четвёртой степени не извлекается: ${val(c)}·10^${E}`);
}

function stefan(p: Params, ge: boolean): Solved {
  const Sden = num(p, 'Sden');
  const Sexp = num(p, 'Sexp');
  const Pm = num(p, 'Pm');
  const Pe = num(p, 'Pe');
  const c = div(mul(q(Pm), q(Sden)), q(57, 10));
  const E = Pe - Sexp + 8;
  const { N, k, r } = koren4(c, E);
  const T = r * 10 ** k;
  const S = `\\dfrac{1}{${d(Sden)}}\\cdot10^{${Sexp}}`;
  const P = `${d(Pm)}\\cdot10^{${Pe}}`;
  const dn = [
    dano('\\sigma', '5{,}7\\cdot10^{-8}', 'Вт/(м²·К⁴)', 'постоянная'),
    dano('S', S, 'м²', 'площадь поверхности звезды'),
    dano('P', ge ? `\\ge${P}` : P, 'Вт', 'мощность излучения'),
  ];
  return {
    answer: T,
    iskomoe: 'T',
    edinicy: 'К',
    dano: dn,
    etapy: razbor({
      dano: dn,
      ishchem: [
        `Ищем температуру $T$. Выразим $T^4$: $T^4=\\dfrac{P}{\\sigma S}$.`,
        ...(ge
          ? [
              'Чем горячее звезда, тем больше мощность. Наименьшая температура соответствует наименьшей мощности — подставляем граничное значение $P$.',
            ]
          : []),
      ],
      vid: 'uravnenie',
      reshaem: [
        `$T^4=\\dfrac{${P}\\cdot${d(Sden)}}{5{,}7\\cdot10^{-8}\\cdot10^{${Sexp}}}$ $=\\dfrac{${d(Pm)}\\cdot${d(Sden)}}{5{,}7}\\cdot10^{${Pe}-(${Sexp}-8)}$ $=${fq(c, true)}\\cdot10^{${E}}$.`,
        `Подгоняем под четвёртую степень: $${fq(c, true)}\\cdot10^{${E}}=${d(N)}\\cdot10^{${4 * k}}$.`,
        `$T>0$, поэтому $T=\\sqrt[4]{${d(N)}}\\cdot10^{${k}}=${d(r)}\\cdot10^{${k}}=${d(T)}$.`,
      ],
      proverka: [`$${d(T)}$ К — температура поверхности обычной звезды (у Солнца около $6000$ К).`],
      answer: T,
      ed: 'К',
    }),
    vychisleniya: [
      {
        tekst: 'Степени с одинаковым основанием: при делении показатели вычитаются.',
        tex: `\\dfrac{10^{${Pe}}}{10^{-8}\\cdot10^{${Sexp}}}=10^{${E}}`,
      },
      { tekst: 'Удобно, когда показатель делится на 4:', tex: `10^{${4 * k}}=(10^{${k}})^4` },
      {
        tekst: 'Корень четвёртой степени из небольшого числа — подбором:',
        tex: `${d(r)}^4=${d(N)}`,
      },
    ],
    hints: [
      chtoNayti(ge ? 'наименьшую температуру $T$' : 'температуру $T$', [
        'мощность $P$',
        'площадь $S$',
      ]),
      vopros('Как выразить $T^4$?', '$T^4=\\dfrac{P}{\\sigma S}$', [
        '$T^4=P\\sigma S$',
        '$T^4=\\dfrac{\\sigma S}{P}$',
      ]),
      vopros('Что происходит с показателями при делении степеней десяти?', 'вычитаются', [
        'складываются',
        'умножаются',
      ]),
      vKakihEdinicah('в кельвинах', ['в градусах Цельсия', 'в ваттах']),
    ],
  };
}

const P20: Prototype = {
  id: 'P20',
  no: 20,
  group: 'III',
  title: 'Закон Стефана — Больцмана: температура звезды',
  formula: 'P=\\sigma ST^4',
  ask: 'температуру звезды',
  skills: ['stepen'],
  fipiNos: '103–108',
  alt: 'Яркая звезда в космосе, излучающая свет',
  solve: (p) => stefan(p, false),
};

const P30: Prototype = {
  id: 'P30',
  no: 30,
  group: 'III',
  title: 'Стефан — Больцман: наименьшая температура',
  formula: 'P=\\sigma ST^4',
  ask: 'наименьшую температуру при мощности не меньше заданной',
  skills: ['stepen'],
  fipiNos: '',
  alt: 'Звезда и шкала мощности излучения',
  solve: (p) => stefan(p, true),
};

/* ── Адиабата: П-21 (равенство), П-31 и П-32 (неравенства) ───────── */

function adiabataDve(p: Params, ge: boolean): Solved {
  const V1 = num(p, 'V1');
  const p1 = num(p, 'p1');
  const p2 = num(p, 'p2');
  const ratio = q(p2, p1);
  const s = korenQ(ratio, 7);
  if (s === null) {
    throw new Error(`p2/p1 не седьмая степень: ${p2}/${p1}`);
  }
  const s5 = val(s) ** 5;
  const V2 = val(div(q(V1), q(s5)));
  const dn = [
    dano('V_1', V1, 'л', 'начальный объём'),
    dano('p_1', p1, 'атм', 'начальное давление'),
    dano('p_2', ge ? `\\le${d(p2)}` : d(p2), 'атм', 'конечное давление'),
  ];
  return {
    answer: V2,
    iskomoe: 'V_2',
    edinicy: 'л',
    dano: dn,
    etapy: razbor({
      dano: dn,
      ishchem: [
        `Ищем $V_2$. Подставляем: $${p1 === 1 ? '' : `${d(p1)}\\cdot`}${d(V1)}^{1{,}4}=${d(p2)}\\cdot V_2^{1{,}4}$.`,
        ...(ge
          ? [
              'Чем сильнее сжимаем газ, тем выше давление. Наименьший объём — при наибольшем допустимом давлении.',
            ]
          : []),
      ],
      vid: 'uravnenie',
      reshaem: [
        `$1{,}4=\\dfrac{7}{5}$, а $${fq(ratio)}=${d(val(s))}^7$. Тогда $\\left(\\dfrac{${d(V1)}}{V_2}\\right)^{\\frac{7}{5}}=${d(val(s))}^7$.`,
        `Возводим обе части в степень $\\dfrac{5}{7}$: $\\dfrac{${d(V1)}}{V_2}=${d(val(s))}^5=${d(s5)}$.`,
        `$V_2=\\dfrac{${d(V1)}}{${d(s5)}}=${d(V2)}$.`,
      ],
      proverka: [
        `Давление выросло в $${fq(ratio)}$ раз, а объём уменьшился в $${d(s5)}$ раз — при адиабатическом сжатии объём падает медленнее, чем растёт давление.`,
      ],
      answer: V2,
      ed: 'л',
    }),
    vychisleniya: [
      {
        tekst: 'Десятичный показатель — в обыкновенную дробь:',
        tex: '1{,}4=\\dfrac{14}{10}=\\dfrac{7}{5}',
      },
      { tekst: 'Давление — степенью двойки:', tex: `${fq(ratio)}=${d(val(s))}^7` },
      { tekst: 'Деление десятичной дроби:', tex: `${d(V1)}:${d(s5)}=${d(V2)}` },
    ],
    hints: [
      chtoNayti(ge ? 'наименьший объём $V_2$' : 'объём $V_2$', [
        'давление $p_2$',
        'начальный объём',
      ]),
      vopros('Как записать $1{,}4$ обыкновенной дробью?', '$\\dfrac{7}{5}$', [
        '$\\dfrac{14}{5}$',
        '$\\dfrac{1}{4}$',
      ]),
      vopros(`Каким числом в седьмой степени является $${fq(ratio)}$?`, `$${d(val(s))}^7$`, [
        '$4^7$',
        '$7^2$',
      ]),
      vKakihEdinicah('в литрах', ['в атмосферах', 'в кубических метрах']),
    ],
  };
}

function adiabataConst(p: Params, mode: 'eq' | 'max'): Solved {
  const Cm = num(p, 'Cm');
  const Ce = num(p, 'Ce');
  const kn = num(p, 'kNum');
  const kd = num(p, 'kDen');
  const pm = num(p, 'pm');
  const pe = num(p, 'pe');
  const x = div(
    mul(q(Cm), q(10 ** Math.max(0, Ce - pe))),
    mul(q(pm), q(10 ** Math.max(0, pe - Ce))),
  );
  const root = korenQ(x, kn);
  if (root === null) {
    throw new Error(`не извлекается корень степени ${kn} из ${val(x)}`);
  }
  let V = q(1);
  for (let i = 0; i < kd; i += 1) {
    V = mul(V, root);
  }
  const ans = val(V);
  const k = `\\frac{${kn}}{${kd}}`;
  const C = `${d(Cm)}\\cdot10^{${Ce}}`;
  const P = `${d(pm)}\\cdot10^{${pe}}`;
  const dn = [
    dano('pV^k', C, 'Па·м⁵', 'постоянная процесса'),
    dano('k', `\\dfrac{${kn}}{${kd}}`, '', 'показатель адиабаты'),
    dano('p', mode === 'max' ? `\\ge${P}` : P, 'Па', 'давление'),
  ];
  return {
    answer: ans,
    iskomoe: 'V',
    edinicy: 'м³',
    dano: dn,
    etapy: razbor({
      dano: dn,
      ishchem: [
        `Ищем $V$. Выражаем: $V^{${k}}=\\dfrac{${C}}{p}$.`,
        ...(mode === 'max'
          ? [
              'Чем больше давление, тем меньше объём. Наибольший объём — при наименьшем допустимом давлении, его и подставляем.',
            ]
          : []),
      ],
      vid: 'uravnenie',
      reshaem: [
        `$V^{${k}}=\\dfrac{${C}}{${P}}=${fq(x, true)}$.`,
        `$${fq(x, true)}=${fq(root, true)}^{${kn}}$, поэтому $V^{\\frac{1}{${kd}}}=${fq(root, true)}$.`,
        `$V=${fq(root, true)}^{${kd}}=${fq(V, true)}$.`,
      ],
      proverka: [
        `Объём положительный и небольшой — для сжатого газа под высоким давлением это нормально.`,
      ],
      answer: ans,
      ed: 'м³',
    }),
    vychisleniya: [
      {
        tekst: 'Дробный показатель: сначала корень, потом степень:',
        tex: `V^{${k}}=a\\;\\Rightarrow\\;V=\\left(\\sqrt[${kn}]{a}\\right)^{${kd}}`,
      },
      { tekst: 'Корень подбираем:', tex: `${fq(root, true)}^{${kn}}=${fq(x, true)}` },
    ],
    hints: [
      chtoNayti(mode === 'max' ? 'наибольший объём $V$' : 'объём $V$', [
        'давление $p$',
        'показатель $k$',
      ]),
      vopros('Что сделать первым?', `разделить постоянную на давление: $V^{${k}}=\\dfrac{C}{p}$`, [
        'умножить постоянную на давление',
        'возвести давление в степень $k$',
      ]),
      vopros(
        `Как найти $V$ из $V^{${k}}=a$?`,
        `извлечь корень степени $${kn}$, затем возвести в степень $${kd}$`,
        [`возвести в степень $${kn}$`, `извлечь корень степени $${kd}$`],
      ),
      vKakihEdinicah('в кубических метрах', ['в литрах', 'в паскалях']),
    ],
  };
}

const P21: Prototype = {
  id: 'P21',
  no: 21,
  group: 'III',
  title: 'Адиабатическое сжатие газа',
  formula: 'p_1V_1^{1{,}4}=p_2V_2^{1{,}4}',
  ask: 'объём газа после сжатия',
  skills: ['stepen'],
  fipiNos: '115–122',
  alt: 'Прозрачный цилиндр с поршнем, резко сжимающим газ',
  solve(p) {
    return str(p, 'form', ['two', 'const'] as const) === 'two'
      ? adiabataDve(p, false)
      : adiabataConst(p, 'eq');
  },
};

const P31: Prototype = {
  id: 'P31',
  no: 31,
  group: 'III',
  title: 'Адиабата: наименьший объём',
  formula: 'pV^{1{,}4}=\\text{const}',
  ask: 'наименьший объём при ограничении на давление',
  skills: ['stepen'],
  fipiNos: '',
  alt: 'Насос с манометром: поршень выдерживает ограниченное давление',
  solve: (p) => adiabataDve(p, true),
};

const P32: Prototype = {
  id: 'P32',
  no: 32,
  group: 'III',
  title: 'Адиабата: наибольший объём',
  formula: 'pV^k=\\text{const}',
  ask: 'наибольший объём при давлении не ниже заданного',
  skills: ['stepen'],
  fipiNos: '',
  alt: 'Сосуд с газом и манометром, стрелка у отметки давления',
  solve: (p) => adiabataConst(p, 'max'),
};

export const GRUPPA_III: Prototype[] = [P18, P19, P20, P21, P30, P31, P32];
