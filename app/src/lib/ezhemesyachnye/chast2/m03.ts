/**
 * Часть 2 ежемесячного варианта 3 (декабрь 2026): задания 14–20.
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
    shablon: 'ev3.14',
    uslovie:
      'а) Решите уравнение $\\dfrac{\\log_2^2(\\cos x)+\\log_2(\\cos x)}{2\\sin x-\\sqrt3}=0.$\n' +
      'б) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[-\\dfrac{5\\pi}{2};\\ -\\pi\\right].$',
    risunok: null,
    punkty: [
      {
        bukva: 'а',
        podpis: 'Серии решений',
        pole: { vid: 'serii', verno: ['2\\pi n', '-\\dfrac{\\pi}{3}+2\\pi n'] },
      },
      {
        bukva: 'б',
        podpis: 'Корни на отрезке',
        pole: { vid: 'korni', verno: ['-\\dfrac{7\\pi}{3}', '-2\\pi'] },
      },
    ],
    otvet:
      'а) $x=2\\pi n,\\ n\\in\\mathbb Z$; $x=-\\dfrac{\\pi}{3}+2\\pi n,\\ n\\in\\mathbb Z$; б) $-\\dfrac{7\\pi}{3};\\ -2\\pi$',
    reshenie: [
      {
        title: 'а) Область определения',
        lines: [
          'Логарифм определён при $\\cos x>0$; знаменатель не равен нулю: $\\sin x\\ne\\dfrac{\\sqrt3}{2}$.',
        ],
      },
      {
        title: 'а) Числитель равен нулю',
        lines: [
          '$\\log_2(\\cos x)\\cdot\\left(\\log_2(\\cos x)+1\\right)=0$: $\\log_2(\\cos x)=0$ или $\\log_2(\\cos x)=-1$.',
          '$\\cos x=1$ или $\\cos x=\\dfrac12$ — оба значения положительны, условие $\\cos x>0$ выполнено.',
        ],
      },
      {
        title: 'а) Отбор по знаменателю',
        lines: [
          '$\\cos x=1$: $x=2\\pi n$, здесь $\\sin x=0$ — подходит.',
          '$\\cos x=\\dfrac12$: $x=\\dfrac{\\pi}{3}+2\\pi n$ или $x=-\\dfrac{\\pi}{3}+2\\pi n$. В первой серии $\\sin x=\\dfrac{\\sqrt3}{2}$ — знаменатель обращается в ноль, серия не подходит; во второй $\\sin x=-\\dfrac{\\sqrt3}{2}$ — подходит.',
          'Ответ а): $x=2\\pi n$, $x=-\\dfrac{\\pi}{3}+2\\pi n$, $n\\in\\mathbb Z$.',
        ],
      },
      {
        title: 'б) Отбираем корни на отрезке',
        lines: [
          'Серия $x=2\\pi n$: $-\\dfrac{5\\pi}{2}\\le2\\pi n\\le-\\pi$, $-\\dfrac54\\le n\\le-\\dfrac12$, $n=-1$: $x=-2\\pi$.',
          'Серия $x=-\\dfrac{\\pi}{3}+2\\pi n$: $-\\dfrac{13}{12}\\le n\\le-\\dfrac13$, $n=-1$: $x=-\\dfrac{7\\pi}{3}$.',
        ],
      },
    ],
    razbor: [
      {
        slovo: 'ОДЗ: $\\cos x>0$, знаменатель не ноль',
        formula: '\\cos x>0,\\ \\sin x\\ne\\dfrac{\\sqrt3}{2}',
      },
      {
        slovo: 'Выносим логарифм за скобку',
        formula: '\\cos x=1\\ \\text{или}\\ \\cos x=\\dfrac12',
      },
      {
        slovo: 'Отбрасываем серию, где $\\sin x=\\dfrac{\\sqrt3}{2}$',
        formula: 'x=2\\pi n,\\ x=-\\dfrac{\\pi}{3}+2\\pi n',
      },
      { slovo: 'Отбираем корни на отрезке', formula: '-\\dfrac{7\\pi}{3};\\ -2\\pi' },
    ],
    kontrol: {
      serii: [0, -PI / 3],
      period: 2 * PI,
      korni: [(-7 * PI) / 3, -2 * PI],
      lo: (-5 * PI) / 2,
      hi: -PI,
    },
  };
}

/* ── 15 ─────────────────────────────────────────────────────────── */

/** Правильная треугольная пирамида: сторона основания 12, боковое ребро 8, высота 4. */
function sc15(punkt: 'a' | 'b'): Scenariy {
  const sc: Scenariy = {
    id: `EV3-15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная треугольная пирамида SABC, медиана AM основания и апофема SM грани SBC'
        : 'Правильная треугольная пирамида, перпендикуляр AT к прямой SM',
    telo: { vid: 'piramida', n: 3, a: 12, h: 4 },
    imena: ['A', 'B', 'C', 'S'],
    tochki: [
      { imya: 'M', gde: { seredina: ['B', 'C'] } },
      { imya: 'O', gde: { centr: ['A', 'B', 'C'] } },
      ...(punkt === 'b' ? [{ imya: 'T', gde: { proekciya: 'A', na: ['S', 'M'] } }] : []),
    ] as Scenariy['tochki'],
    elementy: [
      { id: 'am', vid: 'mediana', tochki: ['A', 'M'] },
      { id: 'sm', vid: 'apofema', tochki: ['S', 'M'] },
      { id: 'so', vid: 'vysota', tochki: ['S', 'O'] },
      ...(punkt === 'a'
        ? [{ id: 'pr', vid: 'pryamoy-ugol', tochki: ['A', 'M', 'C'] }]
        : [
            { id: 'at', vid: 'otrezok', tochki: ['A', 'T'] },
            { id: 'st', vid: 'otrezok', tochki: ['S', 'T'] },
            { id: 'pr', vid: 'pryamoy-ugol', tochki: ['A', 'T', 'M'] },
          ]),
    ] as Scenariy['elementy'],
    proverki: [{ dlina: ['S', 'A'], ravno: 8 }],
  };
  return punkt === 'a' ? sRakursom(sc) : sc;
}

function z15(): Chast2Zadacha {
  const a = sc15('a');
  return {
    no: 15,
    shablon: 'ev3.15',
    uslovie:
      'В правильной треугольной пирамиде $SABC$ с основанием $ABC$ боковое ребро равно $8$, а сторона основания равна $12$.\n' +
      'а) Докажите, что прямые $AS$ и $BC$ перпендикулярны.\n' +
      'б) Найдите расстояние от вершины $A$ до плоскости $SBC$.',
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Расстояние',
        pole: { vid: 'chislo', verno: '\\frac{12\\sqrt{21}}{7}' },
      },
    ],
    otvet: 'б) $\\dfrac{12\\sqrt{21}}{7}$',
    reshenie: [
      {
        title: 'а) Плоскость ASM',
        risunok: stereo(a),
        lines: [
          'Пусть $M$ — середина $BC$. Треугольник $ABC$ равносторонний, поэтому медиана $AM$ — высота: $AM\\perp BC$.',
          'Треугольник $SBC$ равнобедренный ($SB=SC$), поэтому $SM\\perp BC$.',
          'Прямая $BC$ перпендикулярна двум пересекающимся прямым $AM$ и $SM$ плоскости $ASM$, значит, $BC\\perp(ASM)$ — {{t:priznak-perp-ploskosti|признак перпендикулярности прямой и плоскости}}, и $BC\\perp AS$, что и требовалось доказать.',
        ],
      },
      {
        title: 'б) Перпендикуляр к плоскости SBC',
        risunok: stereo(sc15('b'), a),
        lines: [
          'Плоскость $SBC$ проходит через $BC\\perp(ASM)$, поэтому плоскости $SBC$ и $ASM$ перпендикулярны и пересекаются по прямой $SM$. Перпендикуляр $AT$ из точки $A$ к прямой $SM$ лежит в плоскости $ASM$, поэтому он перпендикулярен плоскости $SBC$; искомое расстояние равно $AT$.',
          'Угол $ASM$ тупой ($AM^2=108>SA^2+SM^2=64+28$), поэтому точка $T$ лежит на продолжении $SM$ за точку $S$ — на расстояние это не влияет.',
        ],
      },
      {
        title: 'б) Размеры',
        lines: [
          '$AM=\\dfrac{12\\sqrt3}{2}=6\\sqrt3$; $O$ — центр основания, $AO=\\dfrac23AM=4\\sqrt3$; высота $SO=\\sqrt{SA^2-AO^2}=\\sqrt{64-48}=4$.',
          '$SM=\\sqrt{SB^2-BM^2}=\\sqrt{64-36}=2\\sqrt7$.',
        ],
      },
      {
        title: 'б) Площадь треугольника ASM двумя способами',
        lines: [
          '$S_{ASM}=\\dfrac12\\cdot AM\\cdot SO=\\dfrac12\\cdot6\\sqrt3\\cdot4=12\\sqrt3$ и $S_{ASM}=\\dfrac12\\cdot SM\\cdot AT$.',
          '$AT=\\dfrac{2\\cdot12\\sqrt3}{2\\sqrt7}=\\dfrac{12\\sqrt3}{\\sqrt7}=\\dfrac{12\\sqrt{21}}{7}$.',
        ],
      },
    ],
    razbor: [
      { slovo: 'Медиана основания и апофема перпендикулярны $BC$', formula: 'BC\\perp(ASM)' },
      { slovo: 'Расстояние — перпендикуляр из $A$ к прямой $SM$', formula: 'd=AT' },
      { slovo: 'Длины', formula: 'AM=6\\sqrt3,\\ SO=4,\\ SM=2\\sqrt7' },
      { slovo: 'Площадь двумя способами', formula: 'AT=\\dfrac{12\\sqrt{21}}{7}' },
    ],
    kontrol: { d: (12 * Math.sqrt(21)) / 7, a: 12, l: 8 },
  };
}

/* ── 16 ─────────────────────────────────────────────────────────── */

function z16(): Chast2Zadacha {
  return {
    no: 16,
    shablon: 'ev3.16',
    uslovie:
      'Решите неравенство $\\dfrac{\\left(4^x+2^x\\right)^2-19\\cdot2^x-19\\cdot4^x-20}{\\sqrt{3x^2-2x+1}}\\le0.$',
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество решений',
        pole: {
          vid: 'promezhutki',
          verno: { kuski: [{ t: 'interval', lo: '-inf', loZakr: false, hi: '2', hiZakr: true }] },
        },
      },
    ],
    otvet: '$\\left(-\\infty;\\ 2\\right]$',
    reshenie: [
      {
        title: 'Знаменатель',
        lines: [
          'Дискриминант трёхчлена $3x^2-2x+1$ равен $4-12<0$, старший коэффициент положителен, поэтому $3x^2-2x+1>0$ при всех $x$: знаменатель определён и положителен. Неравенство равносильно $\\left(4^x+2^x\\right)^2-19\\left(4^x+2^x\\right)-20\\le0$.',
        ],
      },
      {
        title: 'Замена',
        lines: [
          'Пусть $t=4^x+2^x>0$. Тогда $t^2-19t-20\\le0$, $(t-20)(t+1)\\le0$, $-1\\le t\\le20$. С учётом $t>0$: $0<t\\le20$.',
        ],
      },
      {
        title: 'Обратная замена',
        lines: [
          '$4^x+2^x\\le20$. Пусть $u=2^x>0$: $u^2+u-20\\le0$, $(u+5)(u-4)\\le0$, и при $u>0$ получаем $u\\le4$.',
          '$2^x\\le4=2^2$, функция $y=2^x$ возрастает, поэтому $x\\le2$.',
        ],
      },
      { title: 'Ответ', lines: ['$x\\in\\left(-\\infty;\\ 2\\right]$.'] },
    ],
    razbor: [
      { slovo: 'Знаменатель всегда положителен', formula: '3x^2-2x+1>0' },
      { slovo: 'Замена $t=4^x+2^x$', formula: '(t-20)(t+1)\\le0' },
      { slovo: 'Вторая замена $u=2^x$', formula: '(u+5)(u-4)\\le0' },
      { slovo: 'Ответ', formula: 'x\\le2' },
    ],
    utochnenie: { u: 'точки $2$' },
    kontrol: { hi: 2, hiZ: true },
  };
}

/* ── 17 ─────────────────────────────────────────────────────────── */

function z17(): Chast2Zadacha {
  return {
    no: 17,
    shablon: 'ev3.17',
    uslovie:
      'Спасатель стоит у кромки воды в точке $A$ прямого берега. Пловец находится в воде в $30$ м от берега, а ближайшая к пловцу точка берега удалена от $A$ на $60$ м. По песку вдоль кромки воды спасатель бежит со скоростью $5$ м/с, а плывёт со скоростью $3$ м/с. Если спасатель пробежит по берегу $x$ м, а затем поплывёт по прямой к пловцу, то на весь путь он потратит $T(x)=\\dfrac{x}{5}+\\dfrac{\\sqrt{(60-x)^2+900}}{3}$ секунд.\n' +
      'Сколько метров спасателю нужно пробежать по берегу, чтобы добраться до пловца быстрее всего?',
    risunok: null,
    punkty: [
      { bukva: null, podpis: 'Путь по берегу $x$, м', pole: { vid: 'chislo', verno: '37,5' } },
    ],
    otvet: '$x=37{,}5$ м',
    reshenie: [
      {
        title: 'Производная',
        lines: [
          'Бежать дальше ближайшей к пловцу точки бессмысленно, поэтому $0\\le x\\le60$.',
          "$T'(x)=\\dfrac15-\\dfrac{60-x}{3\\sqrt{(60-x)^2+900}}$.",
        ],
      },
      {
        title: 'Нуль производной',
        lines: [
          "$T'(x)=0$: $\\dfrac{60-x}{\\sqrt{(60-x)^2+900}}=\\dfrac35$. Пусть $y=60-x\\ge0$: $5y=3\\sqrt{y^2+900}$, $25y^2=9y^2+8100$, $y^2=\\dfrac{8100}{16}$, $y=22{,}5$.",
          '$x=60-22{,}5=37{,}5$.',
        ],
      },
      {
        title: 'Минимум',
        lines: [
          "Функция $\\dfrac{y}{\\sqrt{y^2+900}}$ возрастает по $y$, поэтому при $x<37{,}5$ (большие $y$) $T'(x)<0$, а при $x>37{,}5$ — $T'(x)>0$: $x=37{,}5$ — точка минимума.",
          'Сверяем с концами: $T(37{,}5)=7{,}5+\\dfrac{\\sqrt{506{,}25+900}}{3}=7{,}5+12{,}5=20$ с, $T(0)=\\dfrac{\\sqrt{4500}}{3}\\approx22{,}4$ с, $T(60)=12+10=22$ с.',
        ],
      },
      { title: 'Ответ', lines: ['$37{,}5$ м (время $20$ с).'] },
    ],
    razbor: [
      {
        slovo: 'Время — бег плюс заплыв',
        formula: 'T(x)=\\dfrac{x}{5}+\\dfrac{\\sqrt{(60-x)^2+900}}{3}',
      },
      {
        slovo: 'Приравниваем производную к нулю',
        formula: '\\dfrac{60-x}{\\sqrt{(60-x)^2+900}}=\\dfrac35',
      },
      { slovo: 'Решаем', formula: 'x=37{,}5' },
      { slovo: 'Сверяем с концами отрезка', formula: 'T_{\\min}=20' },
    ],
    kontrol: { x: 37.5, T: 20 },
  };
}

/* ── 18 ─────────────────────────────────────────────────────────── */

function chertezh18(punkt: 'a' | 'b'): string {
  /* Катеты 6√2 и 8√2: LC = (AC + BC)/√2 = 14. */
  const b = 6 * Math.SQRT2;
  const a = 8 * Math.SQRT2;
  const tochki: Scena['tochki'] = {
    C: [0, 0],
    A: [b, 0],
    B: [0, a],
    K: [b / 2, -b / 2],
    M: [-a / 2, a / 2],
    L: [(b + a) / 2, (b + a) / 2],
  };
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C'] },
    { tip: 'ugol', a: 'A', v: 'C', b: 'B', pryamoy: true },
    { tip: 'mnogougolnik', tochki: ['A', 'K', 'C'] },
    { tip: 'mnogougolnik', tochki: ['A', 'L', 'B'] },
    { tip: 'mnogougolnik', tochki: ['B', 'M', 'C'] },
    { tip: 'ugol', a: 'A', v: 'K', b: 'C', pryamoy: true },
    { tip: 'ugol', a: 'A', v: 'L', b: 'B', pryamoy: true },
    { tip: 'ugol', a: 'B', v: 'M', b: 'C', pryamoy: true },
    { tip: 'mnogougolnik', tochki: ['K', 'L', 'M'], vydelit: 'iskomoe' },
    { tip: 'otrezok', a: 'L', b: 'C' },
  ];
  if (punkt === 'a') {
    el.push({ tip: 'ugol', a: 'K', v: 'C', b: 'L', pryamoy: true, sloy: 'reshenie' });
  } else {
    el.push({ tip: 'okruzhnost', okr: 'w', stil: 'punktir', sloy: 'reshenie' });
  }
  return plan(
    {
      tochki: { ...tochki, Q: [b / 2, a / 2] },
      okruzhnosti: { w: { centr: 'Q', cherez: 'A' } },
      elementy: el,
      podpisi: ['A', 'B', 'C', 'K', 'L', 'M'],
      proverki: [{ naPryamoy: ['K', 'C', 'M'] }],
    },
    'Прямоугольный треугольник ABC и равнобедренные прямоугольные треугольники AKC, ALB, BMC на его сторонах',
  );
}

function z18(): Chast2Zadacha {
  return {
    no: 18,
    shablon: 'ev3.18',
    uslovie:
      'На сторонах $AC$, $AB$ и $BC$ прямоугольного треугольника $ABC$ с прямым углом $C$ во внешнюю сторону построены равнобедренные прямоугольные треугольники $AKC$, $ALB$ и $BMC$ с прямыми углами $K$, $L$ и $M$ соответственно.\n' +
      'а) Докажите, что $LC$ — высота треугольника $KLM$.\n' +
      'б) Найдите площадь треугольника $KLM$, если $LC=14$.',
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      { bukva: 'б', podpis: 'Площадь', pole: { vid: 'chislo', verno: '98' } },
    ],
    otvet: 'б) $98$',
    reshenie: [
      {
        title: 'а) Точки $K$, $C$, $M$ на одной прямой',
        risunok: chertezh18('a'),
        lines: [
          'Треугольники $AKC$ и $BMC$ равнобедренные прямоугольные, поэтому $\\angle KCA=\\angle BCM=45^\\circ$. Тогда $\\angle KCA+\\angle ACB+\\angle BCM=45^\\circ+90^\\circ+45^\\circ=180^\\circ$, и точки $K$, $C$, $M$ лежат на одной прямой.',
        ],
      },
      {
        title: 'а) Угол между LC и KM',
        lines: [
          '$\\angle ALB=\\angle ACB=90^\\circ$, поэтому точки $L$ и $C$ лежат на окружности с диаметром $AB$. $LA=LB$ — равные хорды, на них опираются равные вписанные углы: $\\angle ACL=\\angle LCB=45^\\circ$.',
          '$\\angle KCL=\\angle KCA+\\angle ACL=45^\\circ+45^\\circ=90^\\circ$, то есть $LC\\perp KM$, и $LC$ — высота треугольника $KLM$, что и требовалось доказать.',
        ],
      },
      {
        title: 'б) Длина KM',
        risunok: chertezh18('b'),
        lines: [
          'Пусть $AC=b$, $BC=a$. Катеты равнобедренных прямоугольных треугольников: $KC=\\dfrac{b}{\\sqrt2}$, $CM=\\dfrac{a}{\\sqrt2}$, поэтому $KM=\\dfrac{a+b}{\\sqrt2}$.',
        ],
      },
      {
        title: 'б) Длина LC',
        lines: [
          'Четырёхугольник $ACBL$ вписан в окружность, по теореме Птолемея $AC\\cdot LB+BC\\cdot LA=AB\\cdot LC$. Так как $LA=LB=\\dfrac{AB}{\\sqrt2}$, получаем $(a+b)\\dfrac{AB}{\\sqrt2}=AB\\cdot LC$, $LC=\\dfrac{a+b}{\\sqrt2}=KM$.',
          '(Без Птолемея: в треугольнике $ALC$ по {{t:teorema-sinusov|теореме синусов}} $\\dfrac{LC}{\\sin\\angle LAC}=\\dfrac{LA}{\\sin45^\\circ}=AB$, а $\\sin\\angle LAC=\\sin(45^\\circ+\\angle A)=\\dfrac{a+b}{\\sqrt2\\,AB}$.)',
        ],
      },
      {
        title: 'б) Площадь',
        lines: [
          '$S_{KLM}=\\dfrac12\\cdot KM\\cdot LC=\\dfrac12\\cdot LC^2=\\dfrac12\\cdot14^2=98$.',
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Углы по $45^\\circ$ при $C$: $K$, $C$, $M$ на прямой',
        formula: '45^\\circ+90^\\circ+45^\\circ=180^\\circ',
      },
      { slovo: '$L$ — середина дуги $AB$: $CL$ — биссектриса', formula: '\\angle KCL=90^\\circ' },
      { slovo: 'Обе длины равны $\\dfrac{a+b}{\\sqrt2}$', formula: 'KM=LC' },
      { slovo: 'Площадь', formula: 'S=\\dfrac{LC^2}{2}=98' },
    ],
    kontrol: { S: 98, LC: 14 },
  };
}

/* ── 19 ─────────────────────────────────────────────────────────── */

function z19(): Chast2Zadacha {
  return {
    no: 19,
    shablon: 'ev3.19',
    uslovie:
      'Найдите все значения $a$, при каждом из которых уравнение $\\left|x+\\dfrac{4a^2}{x}-3\\right|+\\left|x+\\dfrac{4a^2}{x}+1\\right|=4$ имеет хотя бы один корень.',
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество значений $a$',
        pole: {
          vid: 'promezhutki',
          verno: {
            kuski: [{ t: 'interval', lo: '-0,75', loZakr: true, hi: '0,75', hiZakr: true }],
          },
        },
      },
    ],
    otvet: '$a\\in\\left[-\\dfrac34;\\ \\dfrac34\\right]$',
    reshenie: [
      {
        title: 'Замена и неравенство треугольника',
        lines: [
          'Пусть $t=x+\\dfrac{4a^2}{x}$, $x\\ne0$. Для любых $t$: $|t-3|+|t+1|=|3-t|+|t+1|\\ge|(3-t)+(t+1)|=4$, причём равенство — тогда и только тогда, когда $3-t$ и $t+1$ одного знака, то есть при $-1\\le t\\le3$.',
          'Значит, уравнение равносильно условию $-1\\le x+\\dfrac{4a^2}{x}\\le3$, и нужно, чтобы у этого неравенства было хотя бы одно решение $x\\ne0$.',
        ],
      },
      {
        title: 'Случай $a=0$',
        lines: ['$t=x$, подходят все $x\\in[-1;\\ 3]$, кроме $0$ — решения есть.'],
      },
      {
        title: 'Случай $a\\ne 0$',
        lines: [
          'При $x>0$ по неравенству о среднем $x+\\dfrac{4a^2}{x}\\ge2\\sqrt{4a^2}=4|a|$, и все значения от $4|a|$ и больше достигаются; при $x<0$ значения — от $-\\infty$ до $-4|a|$.',
          'Пересечение с $[-1;\\ 3]$ непусто, если $4|a|\\le3$ (правая часть) или $4|a|\\le1$ (левая), то есть при $|a|\\le\\dfrac34$.',
        ],
      },
      { title: 'Ответ', lines: ['$a\\in\\left[-\\dfrac34;\\ \\dfrac34\\right]$.'] },
    ],
    razbor: [
      { slovo: 'Сумма модулей не меньше $4$', formula: '|t-3|+|t+1|\\ge4' },
      { slovo: 'Равенство — на отрезке', formula: '-1\\le t\\le3' },
      {
        slovo: 'Множество значений $x+\\frac{4a^2}{x}$',
        formula: '(-\\infty;\\,-4|a|]\\cup[4|a|;\\,+\\infty)',
      },
      { slovo: 'Условие пересечения', formula: '|a|\\le\\dfrac34' },
    ],
    utochnenie: {
      u: 'исключением точек $\\pm\\dfrac34$ и/или $0$',
      u3: 'неравенству $-1\\le x+\\dfrac{4a^2}{x}\\le3$',
    },
    kontrol: { lo: -0.75, hi: 0.75 },
  };
}

/* ── 20 ─────────────────────────────────────────────────────────── */

function z20(): Chast2Zadacha {
  return {
    no: 20,
    shablon: 'ev3.20',
    uslovie:
      'Дано трёхзначное число $A$, сумма цифр которого равна $S$.\n' +
      'а) Может ли выполняться равенство $A\\cdot S=1450$?\n' +
      'б) Может ли выполняться равенство $A\\cdot S=1451$?\n' +
      'в) Какое наименьшее значение может принимать выражение $A\\cdot S$, если оно больше $2026$?',
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Ответ', pole: { vid: 'danet', verno: true } },
      { bukva: 'б', podpis: 'Ответ', pole: { vid: 'danet', verno: false } },
      { bukva: 'в', podpis: 'Наименьшее значение', pole: { vid: 'chislo', verno: '2041' } },
    ],
    otvet: 'а) да; б) нет; в) $2041$',
    reshenie: [
      {
        title: 'а) Пример',
        lines: ['$A=145$, $S=1+4+5=10$, $A\\cdot S=1450$. Ответ: да.'],
      },
      {
        title: 'б) Остатки при делении на 9',
        lines: [
          'Число и сумма его цифр дают одинаковые остатки при делении на $9$: $A\\equiv S\\pmod 9$. Значит, $A\\cdot S\\equiv S^2\\pmod 9$.',
          'Квадраты дают при делении на $9$ остатки $0$, $1$, $4$, $7$. А $1451$ даёт остаток $2$ (сумма цифр $11$). Ответ: нет.',
        ],
      },
      {
        title: 'в) Какие числа после 2026 возможны',
        lines: [
          'По пункту б) остаток $A\\cdot S$ при делении на $9$ — $0$, $1$, $4$ или $7$. Среди чисел $2027,\\ldots,2040$ это $2029$, $2032$, $2034$, $2035$, $2038$. Проверим их: $S$ — делитель числа от $1$ до $27$, а $A=\\dfrac{A\\cdot S}{S}$ трёхзначно.',
          '$2029$ — простое: $S=1$, $A=2029$ — не трёхзначное.',
          '$2032=2^4\\cdot127$: $S=4$, $A=508$ (сумма цифр $13$); $S=8$, $A=254$ ($11$); $S=16$, $A=127$ ($10$) — не подходит.',
          '$2034=2\\cdot3^2\\cdot113$: $S=3$, $A=678$ ($21$); $S=6$, $A=339$ ($15$); $S=9$, $A=226$ ($10$); $S=18$, $A=113$ ($5$) — не подходит.',
          '$2035=5\\cdot11\\cdot37$: $S=5$, $A=407$ ($11$); $S=11$, $A=185$ ($14$) — не подходит. $2038=2\\cdot1019$: трёхзначного $A$ нет.',
        ],
      },
      {
        title: 'в) Пример и ответ',
        lines: [
          '$2041=157\\cdot13$, и сумма цифр числа $157$ равна $13$. Значит, наименьшее значение — $2041$.',
        ],
      },
    ],
    razbor: [
      { slovo: 'а) Пример', formula: '145\\cdot10=1450' },
      {
        slovo: 'б) $A\\cdot S\\equiv S^2\\pmod9$, а $1451\\equiv2$',
        formula: 'S^2\\not\\equiv2\\pmod9',
      },
      {
        slovo: 'в) Проверяем подходящие по остатку числа',
        formula: '2029,\\ 2032,\\ 2034,\\ 2035,\\ 2038',
      },
      { slovo: 'в) Пример', formula: '157\\cdot13=2041' },
    ],
    kontrol: { A: true, B: false, V: 2041 },
  };
}

export const CHAST2_M03 = {
  'ev3.14': gotovyy(14, 'Логарифмы в числителе дроби с тригонометрией: ОДЗ и отбор серий', z14),
  'ev3.15': gotovyy(
    15,
    'Правильная треугольная пирамида: перпендикулярность рёбер, расстояние до грани',
    z15,
  ),
  'ev3.16': gotovyy(
    16,
    'Показательное неравенство: двойная замена, знаменатель всегда положителен',
    z16,
  ),
  'ev3.17': gotovyy(17, 'Прикладная: спасатель — бег и заплыв, минимум времени', z17),
  'ev3.18': gotovyy(18, 'Внешние равнобедренные прямоугольные треугольники: высота и площадь', z18),
  'ev3.19': gotovyy(19, 'Параметр: сумма модулей и неравенство о среднем', z19),
  'ev3.20': gotovyy(20, 'Теория чисел: число и сумма его цифр, остатки по модулю 9', z20),
};
