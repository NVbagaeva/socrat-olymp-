/**
 * Часть 2 ежемесячного варианта 4 (январь 2027): задания 14–20.
 * Числа заморожены; ответ каждого задания пересчитывается вторым
 * способом в автотесте (scripts/check-ezhemesyachnye.mjs) по `kontrol`.
 */

import type { Scenariy } from '@/lib/chertezh3';
import type { Element, Scena } from '@/lib/planimetriya/types';
import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';
import { gotovyy, plan, sRakursom, stereo } from './obshchee';

const PI = Math.PI;

/* ── 14 ─────────────────────────────────────────────────────────── */

function z14(): Chast2Zadacha {
  return {
    no: 14,
    shablon: 'ev4.14',
    uslovie:
      'а) Решите уравнение $-\\sqrt2\\sin(3\\pi+2x)+2\\sin\\left(x-\\dfrac{5\\pi}{2}\\right)+\\sqrt6\\cos\\left(x-\\dfrac{21\\pi}{2}\\right)-\\sqrt3=0.$\n' +
      'б) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[-2\\pi;\\ -\\dfrac{\\pi}{2}\\right].$',
    risunok: null,
    punkty: [
      {
        bukva: 'а',
        podpis: 'Серии решений',
        pole: {
          vid: 'serii',
          verno: [
            '\\dfrac{\\pi}{4}+2\\pi n',
            '\\dfrac{3\\pi}{4}+2\\pi n',
            '\\dfrac{5\\pi}{6}+2\\pi n',
            '-\\dfrac{5\\pi}{6}+2\\pi n',
          ],
        },
      },
      {
        bukva: 'б',
        podpis: 'Корни на отрезке',
        pole: {
          vid: 'korni',
          verno: [
            '-\\dfrac{7\\pi}{4}',
            '-\\dfrac{5\\pi}{4}',
            '-\\dfrac{7\\pi}{6}',
            '-\\dfrac{5\\pi}{6}',
          ],
        },
      },
    ],
    otvet:
      'а) $x=\\dfrac{\\pi}{4}+2\\pi n$; $x=\\dfrac{3\\pi}{4}+2\\pi n$; $x=\\pm\\dfrac{5\\pi}{6}+2\\pi n$, $n\\in\\mathbb Z$; б) $-\\dfrac{7\\pi}{4};\\ -\\dfrac{5\\pi}{4};\\ -\\dfrac{7\\pi}{6};\\ -\\dfrac{5\\pi}{6}$',
    reshenie: [
      {
        title: 'а) Формулы приведения',
        lines: [
          '$\\sin(3\\pi+2x)=\\sin(\\pi+2x)=-\\sin2x$, поэтому $-\\sqrt2\\sin(3\\pi+2x)=\\sqrt2\\sin2x$.',
          '$\\sin\\left(x-\\dfrac{5\\pi}{2}\\right)=\\sin\\left(x-\\dfrac{\\pi}{2}\\right)=-\\cos x$; $\\cos\\left(x-\\dfrac{21\\pi}{2}\\right)=\\cos\\left(x-\\dfrac{\\pi}{2}\\right)=\\sin x$.',
          'Уравнение: $\\sqrt2\\sin2x-2\\cos x+\\sqrt6\\sin x-\\sqrt3=0$.',
        ],
      },
      {
        title: 'а) Раскладываем на множители',
        lines: [
          '$2\\sqrt2\\sin x\\cos x-2\\cos x+\\sqrt6\\sin x-\\sqrt3=2\\cos x\\left(\\sqrt2\\sin x-1\\right)+\\sqrt3\\left(\\sqrt2\\sin x-1\\right)=\\left(\\sqrt2\\sin x-1\\right)\\left(2\\cos x+\\sqrt3\\right)=0$.',
          '$\\sin x=\\dfrac{\\sqrt2}{2}$: $x=\\dfrac{\\pi}{4}+2\\pi n$ или $x=\\dfrac{3\\pi}{4}+2\\pi n$.',
          '$\\cos x=-\\dfrac{\\sqrt3}{2}$: $x=\\pm\\dfrac{5\\pi}{6}+2\\pi n$, $n\\in\\mathbb Z$.',
        ],
      },
      {
        title: 'б) Отбираем корни на отрезке',
        lines: [
          'На отрезке $\\left[-2\\pi;\\ -\\dfrac{\\pi}{2}\\right]$ (длина меньше периода $2\\pi$) каждая серия даёт не больше одного корня, $n=-1$:',
          '$\\dfrac{\\pi}{4}-2\\pi=-\\dfrac{7\\pi}{4}$, $\\dfrac{3\\pi}{4}-2\\pi=-\\dfrac{5\\pi}{4}$, $\\dfrac{5\\pi}{6}-2\\pi=-\\dfrac{7\\pi}{6}$ — лежат на отрезке; $-\\dfrac{5\\pi}{6}$ (при $n=0$) — тоже: $-2\\pi<-\\dfrac{5\\pi}{6}<-\\dfrac{\\pi}{2}$.',
          'Остальные значения ($\\dfrac{\\pi}{4}$, $\\dfrac{3\\pi}{4}$, $\\dfrac{5\\pi}{6}$, $-\\dfrac{17\\pi}{6}$ и дальше) лежат вне отрезка.',
        ],
      },
    ],
    razbor: [
      { slovo: 'Формулы приведения', formula: '\\sqrt2\\sin2x-2\\cos x+\\sqrt6\\sin x-\\sqrt3=0' },
      {
        slovo: 'Группировка',
        formula: '\\left(\\sqrt2\\sin x-1\\right)\\left(2\\cos x+\\sqrt3\\right)=0',
      },
      {
        slovo: 'Серии',
        formula: 'x=\\dfrac{\\pi}{4},\\ \\dfrac{3\\pi}{4},\\ \\pm\\dfrac{5\\pi}{6}\\ (+2\\pi n)',
      },
      {
        slovo: 'Отбор',
        formula:
          '-\\dfrac{7\\pi}{4};\\ -\\dfrac{5\\pi}{4};\\ -\\dfrac{7\\pi}{6};\\ -\\dfrac{5\\pi}{6}',
      },
    ],
    kontrol: {
      serii: [PI / 4, (3 * PI) / 4, (5 * PI) / 6, (-5 * PI) / 6],
      period: 2 * PI,
      korni: [(-7 * PI) / 4, (-5 * PI) / 4, (-7 * PI) / 6, (-5 * PI) / 6],
      lo: -2 * PI,
      hi: -PI / 2,
    },
  };
}

/* ── 15 ─────────────────────────────────────────────────────────── */

/** Правильная четырёхугольная пирамида: AB = 4, SA = 12, высота √136. */
function sc15(punkt: 'a' | 'b'): Scenariy {
  const sc: Scenariy = {
    id: `EV4-15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная четырёхугольная пирамида SABCD, биссектрисы AL и AM боковых граней, сечение ALPM'
        : 'Сечение ALPM: диагонали AP и LM перпендикулярны',
    telo: { vid: 'piramida', n: 4, a: 4, h: Math.sqrt(136) },
    imena: ['A', 'B', 'C', 'D', 'S'],
    tochki: [
      { imya: 'O', gde: { centr: ['A', 'B', 'C', 'D'] } },
      { imya: 'L', gde: { naOtrezke: ['S', 'B', 0.75] }, rol: 'uslovie' },
      { imya: 'M', gde: { naOtrezke: ['S', 'D', 0.75] }, rol: 'uslovie' },
      { imya: 'P', gde: { naOtrezke: ['S', 'C', 0.6] } },
      { imya: 'Q', gde: { naOtrezke: ['S', 'O', 0.75] } },
    ] as Scenariy['tochki'],
    elementy: [
      { id: 'al', vid: 'otrezok', tochki: ['A', 'L'], rol: 'uslovie' },
      { id: 'am', vid: 'otrezok', tochki: ['A', 'M'], rol: 'uslovie' },
      { id: 'sech', vid: 'mnogougolnik', tochki: ['A', 'L', 'P', 'M'] },
      { id: 'so', vid: 'vysota', tochki: ['S', 'O'] },
      { id: 'lm', vid: 'otrezok', tochki: ['L', 'M'] },
      { id: 'ap', vid: 'otrezok', tochki: ['A', 'P'] },
      ...(punkt === 'b'
        ? [
            { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'] },
            { id: 'bd', vid: 'diagonal', tochki: ['B', 'D'] },
          ]
        : []),
    ] as Scenariy['elementy'],
    proverki: [{ dlina: ['S', 'A'], ravno: 12 }],
  };
  return punkt === 'a' ? sRakursom(sc) : sc;
}

function z15(): Chast2Zadacha {
  const a = sc15('a');
  return {
    no: 15,
    shablon: 'ev4.15',
    uslovie:
      'В правильной четырёхугольной пирамиде $SABCD$ боковое ребро $SA$ равно $12$, а сторона основания $AB$ равна $4$. В боковых гранях $SAB$ и $SAD$ провели биссектрисы $AL$ и $AM$ соответственно.\n' +
      'а) Докажите, что плоскость $ALM$ делит ребро $SC$ в отношении $3:2$, считая от вершины $S$.\n' +
      'б) Найдите площадь сечения пирамиды плоскостью $ALM$.',
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Площадь сечения',
        pole: { vid: 'chislo', verno: '\\frac{12\\sqrt{33}}{5}' },
      },
    ],
    otvet: 'б) $\\dfrac{12\\sqrt{33}}{5}$',
    reshenie: [
      {
        title: 'а) Где лежат $L$ и $M$',
        risunok: stereo(a),
        lines: [
          'По свойству биссектрисы в треугольнике $SAB$: $\\dfrac{SL}{LB}=\\dfrac{SA}{AB}=\\dfrac{12}{4}=3$, то есть $SL=\\dfrac34SB$. Так же $SM=\\dfrac34SD$.',
          'Значит, $LM\\parallel BD$ (треугольники $SLM$ и $SBD$ подобны), и $LM$ пересекает высоту $SO$ в точке $Q$ с $\\dfrac{SQ}{SO}=\\dfrac34$, то есть $SQ:QO=3:1$.',
        ],
      },
      {
        title: 'а) Теорема Менелая',
        lines: [
          'Плоскость $ALM$ пересекает плоскость $SAC$ по прямой $AQ$; она пересекает $SC$ в точке $P$. Для треугольника $SOC$ и прямой $A$–$Q$–$P$: $\\dfrac{SQ}{QO}\\cdot\\dfrac{OA}{AC}\\cdot\\dfrac{CP}{PS}=1$, то есть $3\\cdot\\dfrac12\\cdot\\dfrac{CP}{PS}=1$, $\\dfrac{CP}{PS}=\\dfrac23$.',
          'Значит, $SP:PC=3:2$, что и требовалось доказать.',
        ],
      },
      {
        title: 'б) Диагонали сечения перпендикулярны',
        risunok: stereo(sc15('b'), a),
        lines: [
          'Сечение — четырёхугольник $ALPM$ с диагоналями $AP$ и $LM$. $BD\\perp AC$ и $BD\\perp SO$, поэтому $BD\\perp(SAC)$, а значит, и $LM\\parallel BD$ перпендикулярна плоскости $SAC$, в частности $LM\\perp AP$.',
          'Площадь четырёхугольника с перпендикулярными диагоналями: $S=\\dfrac12\\,AP\\cdot LM$.',
        ],
      },
      {
        title: 'б) Длины диагоналей',
        lines: [
          '$BD=4\\sqrt2$, $LM=\\dfrac34BD=3\\sqrt2$.',
          'В треугольнике $SAC$: $SA=SC=12$, $AC=4\\sqrt2$, по {{t:teorema-kosinusov|теореме косинусов}} $\\cos\\angle ASC=\\dfrac{144+144-32}{2\\cdot144}=\\dfrac89$. $SP=\\dfrac35\\cdot12=\\dfrac{36}{5}$.',
          '$AP^2=SA^2+SP^2-2\\cdot SA\\cdot SP\\cos\\angle ASC=144+\\dfrac{1296}{25}-2\\cdot12\\cdot\\dfrac{36}{5}\\cdot\\dfrac89=\\dfrac{1056}{25}$, $AP=\\dfrac{4\\sqrt{66}}{5}$.',
        ],
      },
      {
        title: 'б) Площадь',
        lines: [
          '$S=\\dfrac12\\cdot\\dfrac{4\\sqrt{66}}{5}\\cdot3\\sqrt2=\\dfrac{6\\sqrt{132}}{5}=\\dfrac{12\\sqrt{33}}{5}$.',
        ],
      },
    ],
    razbor: [
      { slovo: 'Свойство биссектрисы', formula: 'SL:LB=SM:MD=3:1' },
      { slovo: 'Теорема Менелая в треугольнике $SOC$', formula: 'SP:PC=3:2' },
      { slovo: 'Диагонали сечения перпендикулярны', formula: 'LM\\perp AP' },
      { slovo: 'Длины диагоналей', formula: 'LM=3\\sqrt2,\\ AP=\\dfrac{4\\sqrt{66}}{5}' },
      { slovo: 'Площадь', formula: 'S=\\dfrac{12\\sqrt{33}}{5}' },
    ],
    kontrol: { S: (12 * Math.sqrt(33)) / 5, sp: 0.6, a: 4, l: 12 },
  };
}

/* ── 16 ─────────────────────────────────────────────────────────── */

function z16(): Chast2Zadacha {
  return {
    no: 16,
    shablon: 'ev4.16',
    uslovie:
      'Решите неравенство $\\dfrac{\\log_3\\left(x^2\\right)-\\log_7\\left(x^2\\right)}{\\log_5^2\\left(4x^2-12x+9\\right)+2}\\ge0.$',
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество решений',
        pole: {
          vid: 'promezhutki',
          verno: {
            kuski: [
              { t: 'interval', lo: '-inf', loZakr: false, hi: '-1', hiZakr: true },
              { t: 'interval', lo: '1', loZakr: true, hi: '1,5', hiZakr: false },
              { t: 'interval', lo: '1,5', loZakr: false, hi: 'inf', hiZakr: false },
            ],
          },
        },
      },
    ],
    otvet:
      '$\\left(-\\infty;\\ -1\\right]\\cup\\left[1;\\ 1{,}5\\right)\\cup\\left(1{,}5;\\ +\\infty\\right)$',
    reshenie: [
      {
        title: 'Область определения',
        lines: [
          '$x^2>0$, то есть $x\\ne0$; $4x^2-12x+9=(2x-3)^2>0$, то есть $x\\ne1{,}5$.',
          'Знаменатель $\\log_5^2(\\ldots)+2\\ge2>0$ — на знак дроби не влияет.',
        ],
      },
      {
        title: 'Числитель',
        lines: [
          'Переходим к натуральным логарифмам: $\\log_3(x^2)-\\log_7(x^2)=\\ln(x^2)\\left(\\dfrac{1}{\\ln3}-\\dfrac{1}{\\ln7}\\right)$.',
          '$0<\\ln3<\\ln7$, поэтому $\\dfrac{1}{\\ln3}-\\dfrac{1}{\\ln7}>0$, и знак числителя совпадает со знаком $\\ln(x^2)$.',
        ],
      },
      {
        title: 'Решаем',
        lines: [
          '$\\ln(x^2)\\ge0$, $x^2\\ge1$: $x\\le-1$ или $x\\ge1$. С учётом $x\\ne0$, $x\\ne1{,}5$:',
          '$x\\in\\left(-\\infty;\\ -1\\right]\\cup\\left[1;\\ 1{,}5\\right)\\cup\\left(1{,}5;\\ +\\infty\\right)$.',
        ],
      },
    ],
    razbor: [
      { slovo: 'ОДЗ', formula: 'x\\ne0,\\ x\\ne1{,}5' },
      { slovo: 'Знаменатель положителен', formula: '\\log_5^2(\\ldots)+2>0' },
      { slovo: 'Знак числителя — знак $\\ln(x^2)$', formula: 'x^2\\ge1' },
      { slovo: 'Учитываем ОДЗ', formula: '(-\\infty;-1]\\cup[1;1{,}5)\\cup(1{,}5;+\\infty)' },
    ],
    utochnenie: { u: 'точки $1{,}5$' },
    kontrol: { kuski: [-1e9, -1, 0, 1, 1, 1.5, 1, 0, 1.5, 1e9, 0, 0] },
  };
}

/* ── 17 ─────────────────────────────────────────────────────────── */

function z17(): Chast2Zadacha {
  return {
    no: 17,
    shablon: 'ev4.17',
    uslovie:
      'Ящик массой $m=20$ кг тянут по полу за верёвку, натянутую под углом $\\alpha$ к горизонту ($0^\\circ\\le\\alpha<90^\\circ$). Чтобы ящик двигался равномерно, сила натяжения верёвки должна быть равна $F(\\alpha)=\\dfrac{\\mu mg}{\\cos\\alpha+\\mu\\sin\\alpha}$ (в ньютонах), где $\\mu=0{,}75$ — коэффициент трения, $g=10$ м/с².\n' +
      'При каком угле $\\alpha$ сила будет наименьшей и чему она равна? В ответе укажите $\\operatorname{tg}\\alpha$ и наименьшую силу.',
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: '$\\operatorname{tg}\\alpha$',
        pole: { vid: 'chislo', verno: '0,75' },
      },
      { bukva: null, podpis: 'Наименьшая сила, Н', pole: { vid: 'chislo', verno: '120' } },
    ],
    otvet: '$\\operatorname{tg}\\alpha=0{,}75$, $F_{\\min}=120$ Н',
    reshenie: [
      {
        title: 'Сводим к знаменателю',
        lines: [
          'Числитель $\\mu mg=0{,}75\\cdot20\\cdot10=150$ постоянен, поэтому сила наименьшая, когда наибольший знаменатель $g(\\alpha)=\\cos\\alpha+0{,}75\\sin\\alpha$.',
        ],
      },
      {
        title: 'Вспомогательный угол',
        lines: [
          '$\\sqrt{1^2+0{,}75^2}=1{,}25$. Пусть $\\varphi$ — острый угол с $\\cos\\varphi=\\dfrac{1}{1{,}25}=0{,}8$, $\\sin\\varphi=\\dfrac{0{,}75}{1{,}25}=0{,}6$, то есть $\\operatorname{tg}\\varphi=0{,}75$.',
          '$g(\\alpha)=1{,}25(\\cos\\alpha\\cos\\varphi+\\sin\\alpha\\sin\\varphi)=1{,}25\\cos(\\alpha-\\varphi)\\le1{,}25$, равенство при $\\alpha=\\varphi$ — этот угол лежит в $[0^\\circ;\\ 90^\\circ)$.',
        ],
      },
      {
        title: 'Наименьшая сила',
        lines: [
          '$F_{\\min}=\\dfrac{150}{1{,}25}=120$ Н при $\\operatorname{tg}\\alpha=0{,}75$ ($\\alpha=\\operatorname{arctg}0{,}75\\approx37^\\circ$).',
          "Проверка производной: $g'(\\alpha)=-\\sin\\alpha+0{,}75\\cos\\alpha=0$ при $\\operatorname{tg}\\alpha=0{,}75$; слева $g'>0$, справа $g'<0$ — максимум знаменателя, минимум силы.",
        ],
      },
      { title: 'Ответ', lines: ['$\\operatorname{tg}\\alpha=0{,}75$, $F_{\\min}=120$ Н.'] },
    ],
    razbor: [
      {
        slovo: 'Числитель постоянный — максимизируем знаменатель',
        formula: '\\cos\\alpha+0{,}75\\sin\\alpha',
      },
      {
        slovo: 'Вспомогательный угол',
        formula: '1{,}25\\cos(\\alpha-\\varphi),\\ \\operatorname{tg}\\varphi=0{,}75',
      },
      { slovo: 'Наименьшая сила', formula: 'F_{\\min}=\\dfrac{150}{1{,}25}=120' },
    ],
    kontrol: { tg: 0.75, F: 120 },
  };
}

/* ── 18 ─────────────────────────────────────────────────────────── */

function chertezh18(punkt: 'a' | 'b'): string {
  /* Диагонали AC = 6 и BD = 9 перпендикулярны и пересекаются в начале координат. */
  const A: [number, number] = [-2, 0];
  const C: [number, number] = [4, 0];
  const B: [number, number] = [0, -3];
  const D: [number, number] = [0, 6];
  const tr = (u: [number, number], v: [number, number]): [number, number] => [
    u[0] + (v[0] - u[0]) / 3,
    u[1] + (v[1] - u[1]) / 3,
  ];
  const tochki: Scena['tochki'] = { A, B, C, D, P: tr(A, B), Q: tr(C, B), W: tr(C, D), O: [0, 0] };
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
    { tip: 'mnogougolnik', tochki: ['P', 'Q', 'W'], vydelit: 'iskomoe' },
    { tip: 'ugol', a: 'P', v: 'Q', b: 'W', pryamoy: true, sloy: 'reshenie' },
  ];
  if (punkt === 'b') {
    el.push({ tip: 'otrezok', a: 'A', b: 'C', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'B', b: 'D', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'ugol', a: 'C', v: 'O', b: 'D', pryamoy: true, sloy: 'reshenie' });
  }
  return plan(
    {
      tochki,
      elementy: el,
      podpisi:
        punkt === 'a'
          ? ['A', 'B', 'C', 'D', 'P', 'Q', 'W']
          : ['A', 'B', 'C', 'D', 'P', 'Q', 'W', 'O'],
      proverki: [
        {
          parallelny: [
            ['P', 'Q'],
            ['A', 'C'],
          ],
        },
        {
          parallelny: [
            ['Q', 'W'],
            ['B', 'D'],
          ],
        },
      ],
    },
    'Четырёхугольник ABCD и треугольник PQW с вершинами на его сторонах',
  );
}

function z18(): Chast2Zadacha {
  return {
    no: 18,
    shablon: 'ev4.18',
    uslovie:
      'Точки $P$, $Q$, $W$ делят стороны выпуклого четырёхугольника $ABCD$ в отношении $AP:PB=CQ:QB=CW:WD=1:2$. В треугольнике $PQW$ угол $W$ острый, радиус описанной около него окружности равен $\\dfrac52$, $PQ=4$, $QW=3$.\n' +
      'а) Докажите, что треугольник $PQW$ прямоугольный.\n' +
      'б) Найдите площадь четырёхугольника $ABCD$.',
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      { bukva: 'б', podpis: 'Площадь', pole: { vid: 'chislo', verno: '27' } },
    ],
    otvet: 'б) $27$',
    reshenie: [
      {
        title: 'а) Угол $W$',
        risunok: chertezh18('a'),
        lines: [
          'По {{t:teorema-sinusov|теореме синусов}} $\\dfrac{PQ}{\\sin W}=2R$, $\\sin W=\\dfrac{4}{5}$. Угол $W$ острый, поэтому $\\cos W=\\dfrac35$.',
        ],
      },
      {
        title: 'а) Третья сторона',
        lines: [
          'По {{t:teorema-kosinusov|теореме косинусов}} $PQ^2=QW^2+PW^2-2\\cdot QW\\cdot PW\\cos W$: $16=9+PW^2-\\dfrac{18}{5}PW$, $PW^2-3{,}6\\,PW-7=0$.',
          'Положительный корень: $PW=\\dfrac{3{,}6+\\sqrt{12{,}96+28}}{2}=\\dfrac{3{,}6+6{,}4}{2}=5$.',
          '$PQ^2+QW^2=16+9=25=PW^2$, по теореме, обратной теореме Пифагора, $\\angle PQW=90^\\circ$, что и требовалось доказать.',
        ],
      },
      {
        title: 'б) Стороны треугольника и диагонали',
        risunok: chertezh18('b'),
        lines: [
          '$\\dfrac{BP}{BA}=\\dfrac{BQ}{BC}=\\dfrac23$, поэтому $PQ\\parallel AC$ и $PQ=\\dfrac23AC$ (подобие треугольников $BPQ$ и $BAC$): $AC=6$.',
          '$\\dfrac{CQ}{CB}=\\dfrac{CW}{CD}=\\dfrac13$, поэтому $QW\\parallel BD$ и $QW=\\dfrac13BD$: $BD=9$.',
        ],
      },
      {
        title: 'б) Площадь',
        lines: [
          'Угол между $AC$ и $BD$ равен углу $PQW=90^\\circ$. Площадь выпуклого четырёхугольника — половина произведения диагоналей на синус угла между ними: $S=\\dfrac12\\cdot6\\cdot9\\cdot\\sin90^\\circ=27$.',
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Теорема синусов: $\\sin W$, затем $\\cos W$',
        formula: '\\sin W=\\dfrac45,\\ \\cos W=\\dfrac35',
      },
      { slovo: 'Теорема косинусов: третья сторона', formula: 'PW=5' },
      { slovo: 'Обратная теорема Пифагора', formula: '\\angle Q=90^\\circ' },
      {
        slovo: 'Стороны треугольника параллельны диагоналям',
        formula: 'AC=6,\\ BD=9,\\ AC\\perp BD',
      },
      { slovo: 'Площадь через диагонали', formula: 'S=27' },
    ],
    kontrol: { S: 27, PW: 5 },
  };
}

/* ── 19 ─────────────────────────────────────────────────────────── */

function z19(): Chast2Zadacha {
  return {
    no: 19,
    shablon: 'ev4.19',
    uslovie:
      'При каких значениях параметра $a$ система неравенств $\\begin{cases}\\left(a+7-(x^2-4x)\\right)(a-\\cos x)\\le0,\\\\ x^2-4x\\le5\\end{cases}$ имеет более одного решения?',
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество значений $a$',
        pole: {
          vid: 'promezhutki',
          verno: { kuski: [{ t: 'interval', lo: '-11', loZakr: false, hi: '1', hiZakr: false }] },
        },
      },
    ],
    otvet: '$a\\in\\left(-11;\\ 1\\right)$',
    reshenie: [
      {
        title: 'Второе неравенство',
        lines: ['$x^2-4x-5\\le0$, $(x+1)(x-5)\\le0$: $-1\\le x\\le5$.'],
      },
      {
        title: 'Сравниваем две функции',
        lines: [
          'Пусть $f(x)=x^2-4x-7$; первое неравенство: $(a-f(x))(a-\\cos x)\\le0$.',
          'На отрезке $[-1;\\ 5]$: $f(x)=(x-2)^2-11$ принимает значения от $f(2)=-11$ до $f(-1)=f(5)=-2$, а $\\cos x\\ge-1>-2$. Значит, $f(x)<\\cos x$ при всех $x$ отрезка.',
          'Произведение $(a-f(x))(a-\\cos x)$ неположительно тогда и только тогда, когда $a$ лежит между $f(x)$ и $\\cos x$: $f(x)\\le a\\le\\cos x$.',
        ],
      },
      {
        title: 'Сколько решений при каждом $a$',
        lines: [
          '$a<-11$: $f(x)\\le a$ ни при каком $x$ — решений нет. $a=-11$: $f(x)\\le-11$ только при $x=2$, и $\\cos2\\ge-11$ — одно решение.',
          '$-11<a<-1$: неравенство $f(x)\\le a$ выполнено на отрезке $\\left[2-\\sqrt{a+11};\\ 2+\\sqrt{a+11}\\right]$ ненулевой длины, а $a<-1\\le\\cos x$ — бесконечно много решений.',
          '$-1\\le a<1$: $f(x)\\le-2<a$ при всех $x$, остаётся $\\cos x\\ge a$; оно выполнено в окрестности точки $x=0$ ($\\cos0=1>a$) — бесконечно много решений.',
          '$a=1$: $\\cos x\\ge1$ только при $x=0$ на отрезке $[-1;\\ 5]$ (следующая точка $2\\pi>5$) — одно решение. $a>1$: решений нет.',
        ],
      },
      { title: 'Ответ', lines: ['$a\\in\\left(-11;\\ 1\\right)$.'] },
    ],
    razbor: [
      { slovo: 'Второе неравенство — отрезок', formula: '-1\\le x\\le5' },
      { slovo: 'Парабола ниже косинуса на отрезке', formula: 'f(x)\\le-2<\\cos x' },
      { slovo: 'Неравенство: $a$ между функциями', formula: 'f(x)\\le a\\le\\cos x' },
      { slovo: 'Одно решение — на краях', formula: 'a=-11,\\ a=1' },
    ],
    utochnenie: {
      u: 'включением точек $-11$ и/или $1$',
      u3: 'условию $f(x)\\le a\\le\\cos x$ на отрезке $[-1;\\ 5]$',
    },
    kontrol: { lo: -11, hi: 1 },
  };
}

/* ── 20 ─────────────────────────────────────────────────────────── */

function z20(): Chast2Zadacha {
  return {
    no: 20,
    shablon: 'ev4.20',
    uslovie:
      'Четыре натуральных числа $a$, $b$, $c$, $d$ таковы, что $\\dfrac1a+\\dfrac1b+\\dfrac1c+\\dfrac1d=\\dfrac12$.\n' +
      'а) Могут ли все числа быть попарно различны?\n' +
      'б) Может ли одно из этих чисел равняться $17$?\n' +
      'в) Сколько существует наборов таких чисел (без учёта порядка), в которых ровно три числа равны? Найдите все такие наборы.',
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Ответ', pole: { vid: 'danet', verno: true } },
      { bukva: 'б', podpis: 'Ответ', pole: { vid: 'danet', verno: false } },
      { bukva: 'в', podpis: 'Количество наборов', pole: { vid: 'chislo', verno: '5' } },
    ],
    otvet:
      'а) да; б) нет; в) $5$: $\\{3,18,18,18\\}$, $\\{4,12,12,12\\}$, $\\{5,10,10,10\\}$, $\\{6,9,9,9\\}$, $\\{7,7,7,14\\}$',
    reshenie: [
      {
        title: 'а) Пример',
        lines: [
          '$\\dfrac14+\\dfrac15+\\dfrac1{30}+\\dfrac1{60}=\\dfrac{15+12+2+1}{60}=\\dfrac{30}{60}=\\dfrac12$ — числа $4$, $5$, $30$, $60$ различны. Ответ: да.',
        ],
      },
      {
        title: 'б) Оценка остальных чисел',
        lines: [
          'Пусть одно из чисел равно $17$, а остальные $b\\le c\\le d$. Тогда $\\dfrac1b+\\dfrac1c+\\dfrac1d=\\dfrac12-\\dfrac1{17}=\\dfrac{15}{34}$.',
          '$\\dfrac3b\\ge\\dfrac{15}{34}$, откуда $b\\le6$; $\\dfrac1b<\\dfrac{15}{34}$, откуда $b\\ge3$. Для каждого $b$ остаётся $\\dfrac1c+\\dfrac1d=r$, где $\\dfrac1r<c\\le\\dfrac2r$, и $d=\\dfrac{1}{r-\\frac1c}$.',
        ],
      },
      {
        title: 'б) Перебор',
        lines: [
          '$b=3$: $r=\\dfrac{11}{102}$, $10\\le c\\le18$, $d=\\dfrac{102c}{11c-102}$ — при $c=10,\\ldots,18$ получаем $\\dfrac{255}{2},\\ \\dfrac{1122}{19},\\ \\dfrac{204}{5},\\ \\dfrac{1326}{41},\\ \\dfrac{357}{13},\\ \\dfrac{170}{7},\\ \\dfrac{816}{37},\\ \\dfrac{102}{5},\\ \\dfrac{153}{8}$ — ни одного целого.',
          '$b=4$: $r=\\dfrac{13}{68}$, $6\\le c\\le10$: $d=\\dfrac{204}{5},\\ \\dfrac{476}{23},\\ \\dfrac{136}{9},\\ \\dfrac{612}{49},\\ \\dfrac{340}{31}$ — не целые.',
          '$b=5$: $r=\\dfrac{41}{170}$, $5\\le c\\le8$: $d=\\dfrac{170}{7},\\ \\dfrac{255}{19},\\ \\dfrac{1190}{117},\\ \\dfrac{680}{79}$ — не целые.',
          '$b=6$: $r=\\dfrac{14}{51}$, $6\\le c\\le7$: $d=\\dfrac{102}{11},\\ \\dfrac{357}{47}$ — не целые. Ответ: нет.',
        ],
      },
      {
        title: 'в) Три равных числа',
        lines: [
          'Пусть набор $\\{x,x,x,y\\}$, $y\\ne x$: $\\dfrac3x+\\dfrac1y=\\dfrac12$, $\\dfrac1y=\\dfrac{x-6}{2x}$, $y=\\dfrac{2x}{x-6}=2+\\dfrac{12}{x-6}$.',
          '$y$ натуральное, поэтому $x-6$ — натуральный делитель $12$: $x-6\\in\\{1,2,3,4,6,12\\}$, $x\\in\\{7,8,9,10,12,18\\}$, $y\\in\\{14,8,6,5,4,3\\}$.',
          'При $x=8$ получается $y=8$ — все четыре числа равны, не подходит. Остаются $5$ наборов: $\\{7,7,7,14\\}$, $\\{6,9,9,9\\}$, $\\{5,10,10,10\\}$, $\\{4,12,12,12\\}$, $\\{3,18,18,18\\}$.',
        ],
      },
    ],
    razbor: [
      { slovo: 'а) Пример', formula: '\\dfrac14+\\dfrac15+\\dfrac1{30}+\\dfrac1{60}=\\dfrac12' },
      { slovo: 'б) Оценка наименьшего из остальных', formula: '3\\le b\\le6' },
      { slovo: 'б) Перебор $c$ — $d$ не целое', formula: '\\text{нет}' },
      { slovo: 'в) $y=2+\\dfrac{12}{x-6}$', formula: 'x-6\\mid12' },
      { slovo: 'в) Исключаем $x=y=8$', formula: '5\\ \\text{наборов}' },
    ],
    kontrol: { A: true, B: false, V: 5 },
  };
}

export const CHAST2_M04 = {
  'ev4.14': gotovyy(14, 'Тригонометрическое уравнение: формулы приведения и группировка', z14),
  'ev4.15': gotovyy(
    15,
    'Правильная четырёхугольная пирамида: биссектрисы граней, Менелай, площадь сечения',
    z15,
  ),
  'ev4.16': gotovyy(
    16,
    'Логарифмическое неравенство: разность логарифмов по разным основаниям',
    z16,
  ),
  'ev4.17': gotovyy(17, 'Прикладная: сила тяги под углом — вспомогательный угол', z17),
  'ev4.18': gotovyy(
    18,
    'Четырёхугольник и треугольник на его сторонах: прямой угол и площадь',
    z18,
  ),
  'ev4.19': gotovyy(19, 'Параметр: система неравенств, парабола и косинус', z19),
  'ev4.20': gotovyy(20, 'Теория чисел: сумма четырёх обратных чисел', z20),
};
