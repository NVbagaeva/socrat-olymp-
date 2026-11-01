/**
 * Карточки по теории задания №2 «Векторы».
 *
 * `source` — якорь карточки теории «t2-<раздел>-<карточка>»
 * (components/tasks/vektory/Teoriya2.tsx, content/theoryVektory.ts).
 * Коллинеарность, середина отрезка, расстояние между точками,
 * разложение по базису и векторы в фигурах в теории №2 нет — такие
 * карточки помечены «добавлено».
 *
 * Чертежи рисует движок векторов (lib/vektory). Примеры с числами —
 * свои, не задачи ЕГЭ; ответы и формулы проверяет scripts/verify_cards.
 */

import type { Kartochka, Koloda, ProverkaFormuly } from '@/lib/kartochki/tipy';
import { DOBAVLENO } from '@/lib/kartochki/tipy';
import { dist, gr, ugol, type P } from '@/lib/kartochki/schet';

const B = 'база' as const;
const E = 'важно для ЕГЭ' as const;

/** Модуль вектора в записи карточек. */
const mod = (v: string) => `|\\vec{${v}}|`;

const kartochki: Kartochka[] = [
  /* ── Координаты вектора ── */
  {
    id: '2-koordinaty',
    task: 2,
    topic: 'koordinaty',
    type: 'formula',
    front: 'Координаты вектора $\\overrightarrow{AB}$, если $A(x_1;\\ y_1)$ и $B(x_2;\\ y_2)$?',
    back: '$\\overrightarrow{AB}\\,(x_2 - x_1;\\ y_2 - y_1)$',
    pochemu: 'Координаты конца минус координаты начала.',
    figure: { dvizhok: 'vektory', stsena: 'koordinaty' },
    level: B,
    source: 't2-koordinaty-opredelenie',
  },
  {
    id: '2-koordinaty-v',
    task: 2,
    topic: 'koordinaty',
    type: 'vychislenie',
    front:
      'Даны точки $A(2;\\ 7)$ и $B(-3;\\ 4)$. Найдите абсциссу вектора $\\overrightarrow{AB}$.',
    back: '$x = -3 - 2 = -5$',
    otvet: '-5',
    proverka: () => -3 - 2,
    level: B,
    source: 't2-koordinaty-opredelenie',
  },
  {
    id: '2-poryadok-l',
    task: 2,
    topic: 'koordinaty',
    type: 'verno',
    front: 'У векторов $\\overrightarrow{AB}$ и $\\overrightarrow{BA}$ одинаковые координаты.',
    verno: false,
    back: 'Неверно: у $\\overrightarrow{BA}$ координаты те же по модулю, но с противоположными знаками.',
    pochemu: 'Самая частая ошибка — «начало минус конец» вместо «конец минус начало».',
    level: E,
    source: 't2-koordinaty-poryadok',
  },
  {
    id: '2-katety',
    task: 2,
    topic: 'koordinaty',
    type: 'svoystvo',
    front: 'Вектор нарисован на клетчатой бумаге. Как найти модули его координат?',
    back: 'Провести от начала к концу два катета: горизонтальный в клетках — это $|x|$, вертикальный — $|y|$.',
    figure: { dvizhok: 'vektory', stsena: 'znak' },
    level: B,
    source: 't2-po-kletkam-katety',
  },
  {
    id: '2-znak',
    task: 2,
    topic: 'koordinaty',
    type: 'svoystvo',
    front: 'Как по рисунку определить знаки координат вектора?',
    back: 'Конец **правее** начала — $x > 0$, левее — $x < 0$. Конец **выше** начала — $y > 0$, ниже — $y < 0$.',
    level: E,
    source: 't2-po-kletkam-znak',
  },
  {
    id: '2-po-risunku',
    task: 2,
    topic: 'koordinaty',
    type: 'chertezh',
    front: 'Найдите координаты вектора $\\vec{a}$ по рисунку.',
    back: '$\\vec{a}\\,(-3;\\ -4)$',
    pochemu:
      '$3$ клетки влево и $4$ клетки вниз: конец левее и ниже начала — обе координаты отрицательные.',
    figure: {
      dvizhok: 'vektory',
      stsena: {
        vectors: [{ name: 'a', from: [4, 9], to: [1, 5] }],
        window: { xmin: -1, xmax: 7, ymin: -1, ymax: 11 },
        alt: 'Вектор a на клетчатой бумаге: из точки (4; 9) в точку (1; 5)',
      },
    },
    level: E,
    source: 't2-po-kletkam-primer-znak',
  },

  /* ── Действия с векторами ── */
  {
    id: '2-slozhenie',
    task: 2,
    topic: 'deystviya',
    type: 'formula',
    front: 'Сумма векторов $\\vec{a}\\,(x_1;\\ y_1)$ и $\\vec{b}\\,(x_2;\\ y_2)$ в координатах?',
    back: '$\\vec{a} + \\vec{b} = (x_1 + x_2;\\ y_1 + y_2)$',
    level: B,
    source: 't2-deystviya-slozhenie',
  },
  {
    id: '2-treugolnik',
    task: 2,
    topic: 'deystviya',
    type: 'svoystvo',
    front: 'Правило треугольника: как построить сумму $\\vec{a} + \\vec{b}$?',
    back: 'Отложить $\\vec{b}$ от конца $\\vec{a}$. Сумма идёт из начала $\\vec{a}$ в конец $\\vec{b}$.',
    figure: { dvizhok: 'vektory', stsena: 'slozhenie' },
    level: B,
    source: 't2-deystviya-slozhenie',
  },
  {
    id: '2-parallelogramm',
    task: 2,
    topic: 'deystviya',
    type: 'svoystvo',
    front: 'Правило параллелограмма: как построить сумму $\\vec{a} + \\vec{b}$?',
    back: 'Отложить $\\vec{a}$ и $\\vec{b}$ от одной точки и достроить параллелограмм. Сумма — его диагональ из этой точки.',
    figure: {
      dvizhok: 'vektory',
      stsena: {
        vectors: [
          { name: 'a', from: [1, 1], to: [5, 2] },
          { name: 'b', from: [1, 1], to: [3, 5] },
          { name: 'c', from: [1, 1], to: [7, 6] },
        ],
        window: { xmin: -1, xmax: 9, ymin: -1, ymax: 8 },
        alt: 'Векторы a и b из одной точки и их сумма c — диагональ параллелограмма',
      },
    },
    level: B,
    source: DOBAVLENO,
  },
  {
    id: '2-raznost',
    task: 2,
    topic: 'deystviya',
    type: 'svoystvo',
    front:
      'Векторы $\\vec{a}$ и $\\vec{b}$ отложены от одной точки. Как построить разность $\\vec{a} - \\vec{b}$?',
    back: 'Провести вектор **от конца $\\vec{b}$ к концу $\\vec{a}$**.',
    pochemu: 'Тогда $\\vec{b} + (\\vec{a} - \\vec{b}) = \\vec{a}$ — правило треугольника.',
    figure: { dvizhok: 'vektory', stsena: 'vychitanie' },
    level: E,
    source: 't2-deystviya-vychitanie',
  },
  {
    id: '2-umnozhenie',
    task: 2,
    topic: 'deystviya',
    type: 'formula',
    front: 'Как умножить вектор $\\vec{a}\\,(x;\\ y)$ на число $k$?',
    back: '$k\\vec{a} = (kx;\\ ky)$. При $k > 0$ направление сохраняется, при $k < 0$ — меняется на противоположное.',
    figure: { dvizhok: 'vektory', stsena: 'umnozhenie' },
    level: B,
    source: 't2-deystviya-umnozhenie',
  },
  {
    id: '2-kombinatsiya-v',
    task: 2,
    topic: 'deystviya',
    type: 'vychislenie',
    front:
      'Даны векторы $\\vec{a}\\,(2;\\ -3)$ и $\\vec{b}\\,(-1;\\ 4)$. Найдите абсциссу вектора $3\\vec{a} - 2\\vec{b}$.',
    back: '$3 \\cdot 2 - 2 \\cdot (-1) = 8$',
    otvet: '8',
    proverka: () => 3 * 2 - 2 * -1,
    level: E,
    source: 't2-deystviya-kombinatsiya',
  },
  {
    id: '2-summa-v',
    task: 2,
    topic: 'deystviya',
    type: 'vychislenie',
    front:
      'Даны векторы $\\vec{a}\\,(1;\\ 5)$ и $\\vec{b}\\,(4;\\ -2)$. Найдите ординату вектора $\\vec{a} + \\vec{b}$.',
    back: '$5 + (-2) = 3$',
    otvet: '3',
    proverka: () => 5 + -2,
    level: B,
    source: 't2-deystviya-slozhenie',
  },
  {
    id: '2-minus-l',
    task: 2,
    topic: 'deystviya',
    type: 'verno',
    front: 'Векторы $\\vec{a}$ и $-2\\vec{a}$ направлены в одну сторону.',
    verno: false,
    back: 'Неверно: при умножении на отрицательное число вектор разворачивается.',
    level: B,
    source: 't2-deystviya-umnozhenie',
  },

  /* ── Длина вектора ── */
  {
    id: '2-dlina',
    task: 2,
    topic: 'dlina',
    type: 'formula',
    front: 'Длина вектора $\\vec{a}\\,(x;\\ y)$?',
    back: `$${mod('a')} = \\sqrt{x^2 + y^2}$`,
    pochemu: 'Вектор — гипотенуза прямоугольного треугольника с катетами $|x|$ и $|y|$.',
    figure: { dvizhok: 'vektory', stsena: 'dlina' },
    level: B,
    source: 't2-dlina-formula',
  },
  {
    id: '2-dlina-v',
    task: 2,
    topic: 'dlina',
    type: 'vychislenie',
    front: 'Найдите длину вектора $\\vec{a}\\,(-6;\\ 8)$.',
    back: '$\\sqrt{36 + 64} = 10$',
    otvet: '10',
    proverka: () => Math.hypot(-6, 8),
    level: B,
    source: 't2-dlina-formula',
  },
  {
    id: '2-dlina-summy-l',
    task: 2,
    topic: 'dlina',
    type: 'verno',
    front: `Для любых векторов $${mod('a')} + ${mod('b')} = |\\vec{a} + \\vec{b}|$.`,
    verno: false,
    back: 'Неверно: длины не складываются. Сначала находим координаты суммы, потом её длину.',
    pochemu: 'Равенство верно, только если векторы сонаправлены.',
    level: E,
    source: 't2-dlina-summa',
  },
  {
    id: '2-dlina-summy-v',
    task: 2,
    topic: 'dlina',
    type: 'vychislenie',
    front:
      'Даны векторы $\\vec{a}\\,(1;\\ 2)$ и $\\vec{b}\\,(2;\\ 2)$. Найдите длину вектора $\\vec{a} + \\vec{b}$.',
    back: '$\\vec{a} + \\vec{b} = (3;\\ 4)$, длина $\\sqrt{9 + 16} = 5$',
    pochemu: `А $${mod('a')} + ${mod('b')} = \\sqrt5 + \\sqrt8 \\ne 5$.`,
    otvet: '5',
    proverka: () => Math.hypot(1 + 2, 2 + 2),
    level: E,
    source: 't2-dlina-summa',
  },
  {
    id: '2-troyki',
    task: 2,
    topic: 'dlina',
    type: 'svoystvo',
    front: 'Какие пифагоровы тройки чаще всего дают целую длину вектора?',
    back: '$3$–$4$–$5$, $5$–$12$–$13$, $8$–$15$–$17$, $7$–$24$–$25$ и кратные им.',
    level: B,
    source: 't2-dlina-primer',
  },

  /* ── Скалярное произведение ── */
  {
    id: '2-skalyarnoe-ugol',
    task: 2,
    topic: 'skalyarnoe',
    type: 'formula',
    front: 'Скалярное произведение через длины векторов и угол между ними?',
    back: `$\\vec{a}\\cdot\\vec{b} = ${mod('a')}\\cdot${mod('b')}\\cdot\\cos\\alpha$`,
    figure: { dvizhok: 'vektory', stsena: 'skalyarnoe' },
    level: E,
    source: 't2-skalyarnoe-cherez-ugol',
  },
  {
    id: '2-skalyarnoe-koordinaty',
    task: 2,
    topic: 'skalyarnoe',
    type: 'formula',
    front:
      'Скалярное произведение векторов $\\vec{a}\\,(x_1;\\ y_1)$ и $\\vec{b}\\,(x_2;\\ y_2)$ в координатах?',
    back: '$\\vec{a}\\cdot\\vec{b} = x_1x_2 + y_1y_2$',
    level: E,
    source: 't2-skalyarnoe-cherez-koordinaty',
  },
  {
    id: '2-skalyarnoe-ugol-v',
    task: 2,
    topic: 'skalyarnoe',
    type: 'vychislenie',
    front: `$${mod('a')} = 4$, $${mod('b')} = 5$, угол между векторами $60^\\circ$. Найдите $\\vec{a}\\cdot\\vec{b}$.`,
    back: '$4 \\cdot 5 \\cdot \\cos 60^\\circ = 20 \\cdot \\dfrac12 = 10$',
    otvet: '10',
    proverka: () => {
      const a: P = [4, 0];
      const b: P = [5 * Math.cos(Math.PI / 3), 5 * Math.sin(Math.PI / 3)];
      return Math.round((a[0] * b[0] + a[1] * b[1]) * 1e9) / 1e9;
    },
    level: E,
    source: 't2-skalyarnoe-cherez-ugol',
  },
  {
    id: '2-skalyarnoe-koordinaty-v',
    task: 2,
    topic: 'skalyarnoe',
    type: 'vychislenie',
    front:
      'Найдите скалярное произведение векторов $\\vec{a}\\,(3;\\ -2)$ и $\\vec{b}\\,(4;\\ 5)$.',
    back: '$3 \\cdot 4 + (-2) \\cdot 5 = 2$',
    otvet: '2',
    proverka: () => 3 * 4 + -2 * 5,
    level: E,
    source: 't2-skalyarnoe-cherez-koordinaty',
  },
  {
    id: '2-koren-v',
    task: 2,
    topic: 'skalyarnoe',
    type: 'vychislenie',
    front: `$${mod('a')} = 4\\sqrt3$, $${mod('b')} = 5$, угол между векторами $30^\\circ$. Найдите $\\vec{a}\\cdot\\vec{b}$.`,
    back: '$4\\sqrt3 \\cdot 5 \\cdot \\dfrac{\\sqrt3}{2} = 30$',
    pochemu: 'Корни подобраны так, чтобы сократиться: $\\sqrt3 \\cdot \\sqrt3 = 3$.',
    otvet: '30',
    proverka: () => 4 * Math.sqrt(3) * 5 * Math.cos(Math.PI / 6),
    level: E,
    source: 't2-skalyarnoe-tablitsa',
  },
  {
    id: '2-chislo-l',
    task: 2,
    topic: 'skalyarnoe',
    type: 'verno',
    front: 'Скалярное произведение двух векторов — это вектор.',
    verno: false,
    back: 'Неверно: скалярное произведение — **число**.',
    level: B,
    source: 't2-skalyarnoe-cherez-ugol',
  },
  {
    id: '2-kosinusy',
    task: 2,
    topic: 'skalyarnoe',
    type: 'svoystvo',
    front: 'Косинусы углов $30^\\circ$, $45^\\circ$, $60^\\circ$, $90^\\circ$?',
    back: '$\\dfrac{\\sqrt3}{2}$, $\\dfrac{\\sqrt2}{2}$, $\\dfrac12$, $0$',
    level: E,
    source: 't2-skalyarnoe-tablitsa',
  },
  {
    id: '2-svoystva',
    task: 2,
    topic: 'skalyarnoe',
    type: 'svoystvo',
    front: 'Можно ли в скалярном произведении раскрывать скобки и выносить числовой множитель?',
    back: 'Да: $(\\vec{a} + \\vec{b})\\cdot\\vec{c} = \\vec{a}\\cdot\\vec{c} + \\vec{b}\\cdot\\vec{c}$, $(k\\vec{a})\\cdot\\vec{b} = k\\,(\\vec{a}\\cdot\\vec{b})$; множители можно переставлять.',
    figure: { dvizhok: 'vektory', stsena: 'svoystva' },
    level: B,
    source: 't2-svoystva-raspredelitelnost',
  },
  {
    id: '2-kvadrat',
    task: 2,
    topic: 'skalyarnoe',
    type: 'formula',
    front: 'Чему равен скалярный квадрат $\\vec{a}\\cdot\\vec{a}$?',
    back: `$\\vec{a}\\cdot\\vec{a} = ${mod('a')}^2$`,
    pochemu: 'Угол вектора с самим собой равен $0^\\circ$, $\\cos 0^\\circ = 1$.',
    level: B,
    source: DOBAVLENO,
  },

  /* ── Угол между векторами ── */
  {
    id: '2-kosinus',
    task: 2,
    topic: 'kosinus',
    type: 'formula',
    front: 'Косинус угла между векторами $\\vec{a}\\,(x_1;\\ y_1)$ и $\\vec{b}\\,(x_2;\\ y_2)$?',
    back: '$\\cos\\alpha = \\dfrac{x_1x_2 + y_1y_2}{\\sqrt{x_1^2 + y_1^2}\\cdot\\sqrt{x_2^2 + y_2^2}}$',
    pochemu: 'Скалярное произведение, делённое на произведение длин.',
    figure: { dvizhok: 'vektory', stsena: 'kosinus' },
    level: E,
    source: 't2-kosinus-formula',
  },
  {
    id: '2-kosinus-v',
    task: 2,
    topic: 'kosinus',
    type: 'vychislenie',
    front: 'Найдите косинус угла между векторами $\\vec{a}\\,(3;\\ 4)$ и $\\vec{b}\\,(4;\\ 3)$.',
    back: '$\\cos\\alpha = \\dfrac{12 + 12}{5 \\cdot 5} = 0{,}96$',
    otvet: '0,96',
    proverka: () => Math.cos(ugol([3, 4], [0, 0], [4, 3])),
    level: E,
    source: 't2-kosinus-formula',
  },
  {
    id: '2-kosinus-tupoy-v',
    task: 2,
    topic: 'kosinus',
    type: 'vychislenie',
    front: 'Найдите косинус угла между векторами $\\vec{a}\\,(1;\\ 0)$ и $\\vec{b}\\,(-3;\\ 4)$.',
    back: '$\\cos\\alpha = \\dfrac{-3 + 0}{1 \\cdot 5} = -0{,}6$',
    pochemu: 'Скалярное произведение отрицательно — угол тупой, косинус отрицательный.',
    otvet: '-0,6',
    proverka: () => Math.cos(ugol([1, 0], [0, 0], [-3, 4])),
    level: E,
    source: 't2-kosinus-znak',
  },
  {
    id: '2-oshibka',
    task: 2,
    topic: 'kosinus',
    type: 'svoystvo',
    front: 'Самая частая ошибка при поиске косинуса угла между векторами?',
    back: 'Записать в ответ скалярное произведение и **не разделить** его на произведение длин.',
    level: E,
    source: 't2-kosinus-primer',
  },
  {
    id: '2-tupoy-l',
    task: 2,
    topic: 'kosinus',
    type: 'verno',
    front: 'Если угол между векторами тупой, их скалярное произведение отрицательно.',
    verno: true,
    back: 'Верно: косинус тупого угла отрицателен, а длины положительны.',
    level: E,
    source: 't2-kosinus-znak',
  },

  /* ── Перпендикулярность ── */
  {
    id: '2-perpendikulyarnost',
    task: 2,
    topic: 'perpendikulyarnost',
    type: 'formula',
    front: 'Признак перпендикулярности ненулевых векторов?',
    back: '$\\vec{a}\\perp\\vec{b} \\iff \\vec{a}\\cdot\\vec{b} = 0$',
    pochemu: '$\\cos 90^\\circ = 0$.',
    figure: { dvizhok: 'vektory', stsena: 'perpendikulyarnost' },
    level: E,
    source: 't2-perpendikulyarnost-priznak',
  },
  {
    id: '2-perpendikulyarnost-v',
    task: 2,
    topic: 'perpendikulyarnost',
    type: 'vychislenie',
    front: 'При каком $k$ векторы $\\vec{a}\\,(2;\\ k)$ и $\\vec{b}\\,(3;\\ -6)$ перпендикулярны?',
    back: '$2 \\cdot 3 + k \\cdot (-6) = 0$, откуда $k = 1$.',
    otvet: '1',
    proverka: () => 6 / 6,
    level: E,
    source: 't2-perpendikulyarnost-priznak',
  },
  {
    id: '2-perpendikulyarnost-l',
    task: 2,
    topic: 'perpendikulyarnost',
    type: 'verno',
    front: 'Векторы $(4;\\ 3)$ и $(-3;\\ 4)$ перпендикулярны.',
    verno: true,
    back: 'Верно: $4 \\cdot (-3) + 3 \\cdot 4 = 0$.',
    pochemu: 'Координаты поменялись местами, у одной сменился знак.',
    level: B,
    source: 't2-perpendikulyarnost-primer',
  },

  /* ── Коллинеарность (добавлено) ── */
  {
    id: '2-kollinearnost',
    task: 2,
    topic: 'kollinearnost',
    type: 'svoystvo',
    front: 'Когда векторы $\\vec{a}\\,(x_1;\\ y_1)$ и $\\vec{b}\\,(x_2;\\ y_2)$ коллинеарны?',
    back: 'Когда $\\vec{b} = k\\vec{a}$, то есть координаты пропорциональны: $x_1 y_2 = x_2 y_1$.',
    pochemu: 'Коллинеарные векторы лежат на одной прямой или на параллельных прямых.',
    level: B,
    source: DOBAVLENO,
  },
  {
    id: '2-kollinearnost-v',
    task: 2,
    topic: 'kollinearnost',
    type: 'vychislenie',
    front: 'При каком $m$ векторы $\\vec{a}\\,(2;\\ 3)$ и $\\vec{b}\\,(6;\\ m)$ коллинеарны?',
    back: '$\\vec{b} = 3\\vec{a}$, поэтому $m = 3 \\cdot 3 = 9$.',
    otvet: '9',
    proverka: () => (6 * 3) / 2,
    level: B,
    source: DOBAVLENO,
  },
  {
    id: '2-kollinearnost-l',
    task: 2,
    topic: 'kollinearnost',
    type: 'verno',
    front: 'Векторы $(2;\\ -4)$ и $(-1;\\ 2)$ коллинеарны.',
    verno: true,
    back: 'Верно: $(-1;\\ 2) = -\\dfrac12\\,(2;\\ -4)$ — векторы противоположно направлены.',
    level: B,
    source: DOBAVLENO,
  },

  /* ── Середина отрезка и расстояние (добавлено) ── */
  {
    id: '2-seredina',
    task: 2,
    topic: 'tochki',
    type: 'formula',
    front: 'Координаты середины отрезка $AB$, если $A(x_1;\\ y_1)$ и $B(x_2;\\ y_2)$?',
    back: '$M\\left(\\dfrac{x_1 + x_2}{2};\\ \\dfrac{y_1 + y_2}{2}\\right)$',
    level: B,
    source: DOBAVLENO,
  },
  {
    id: '2-seredina-v',
    task: 2,
    topic: 'tochki',
    type: 'vychislenie',
    front: 'Даны точки $A(-2;\\ 5)$ и $B(6;\\ 1)$. Найдите абсциссу середины отрезка $AB$.',
    back: '$\\dfrac{-2 + 6}{2} = 2$',
    otvet: '2',
    proverka: () => (-2 + 6) / 2,
    level: B,
    source: DOBAVLENO,
  },
  {
    id: '2-rasstoyanie',
    task: 2,
    topic: 'tochki',
    type: 'formula',
    front: 'Расстояние между точками $A(x_1;\\ y_1)$ и $B(x_2;\\ y_2)$?',
    back: '$AB = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$',
    pochemu: 'Это длина вектора $\\overrightarrow{AB}$.',
    level: B,
    source: DOBAVLENO,
  },
  {
    id: '2-rasstoyanie-v',
    task: 2,
    topic: 'tochki',
    type: 'vychislenie',
    front: 'Даны точки $A(1;\\ 2)$ и $B(13;\\ 7)$. Найдите длину отрезка $AB$.',
    back: '$\\sqrt{12^2 + 5^2} = \\sqrt{169} = 13$',
    otvet: '13',
    proverka: () => dist([1, 2], [13, 7]),
    level: B,
    source: DOBAVLENO,
  },

  /* ── Базис и векторы в фигурах (добавлено) ── */
  {
    id: '2-bazis',
    task: 2,
    topic: 'figury',
    type: 'svoystvo',
    front: 'Как связаны координаты вектора и его разложение по базису $\\vec{i}$, $\\vec{j}$?',
    back: '$\\vec{a}\\,(x;\\ y) \\iff \\vec{a} = x\\vec{i} + y\\vec{j}$: координаты — коэффициенты разложения.',
    pochemu: '$\\vec{i}$ и $\\vec{j}$ — единичные векторы осей $Ox$ и $Oy$.',
    level: B,
    source: DOBAVLENO,
  },
  {
    id: '2-mediana',
    task: 2,
    topic: 'figury',
    type: 'formula',
    front:
      'Медиана $AM$ треугольника $ABC$ через векторы $\\overrightarrow{AB}$ и $\\overrightarrow{AC}$?',
    back: '$\\overrightarrow{AM} = \\dfrac12\\left(\\overrightarrow{AB} + \\overrightarrow{AC}\\right)$',
    pochemu: '$M$ — середина $BC$: половина диагонали параллелограмма на $AB$ и $AC$.',
    level: E,
    source: DOBAVLENO,
  },
  {
    id: '2-diagonali',
    task: 2,
    topic: 'figury',
    type: 'formula',
    front:
      'Диагонали параллелограмма $ABCD$ через векторы $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$?',
    back: '$\\overrightarrow{AC} = \\overrightarrow{AB} + \\overrightarrow{AD}$, $\\overrightarrow{DB} = \\overrightarrow{AB} - \\overrightarrow{AD}$',
    level: E,
    source: DOBAVLENO,
  },
  {
    id: '2-ravnye-l',
    task: 2,
    topic: 'figury',
    type: 'verno',
    front:
      'В параллелограмме $ABCD$ векторы $\\overrightarrow{AB}$ и $\\overrightarrow{DC}$ равны.',
    verno: true,
    back: 'Верно: у них одинаковые длина и направление.',
    pochemu: 'А $\\overrightarrow{AB}$ и $\\overrightarrow{CD}$ противоположны.',
    level: B,
    source: DOBAVLENO,
  },
];

/* ── Проверки формул: случайные векторы ── */

const tsel = (rnd: () => number) => Math.round(rnd() * 20 - 10);
const vek = (rnd: () => number): P => {
  for (;;) {
    const v: P = [tsel(rnd), tsel(rnd)];
    if (v[0] !== 0 || v[1] !== 0) return v;
  }
};
const dot = (a: P, b: P) => a[0] * b[0] + a[1] * b[1];
const O: P = [0, 0];

const proverki: ProverkaFormuly[] = [
  {
    kartochka: '2-koordinaty',
    sluchay: (rnd) => {
      const A = vek(rnd);
      const Bt = vek(rnd);
      /* Вектор (x2 − x1; y2 − y1), отложенный от A, приходит в B. */
      const v: P = [Bt[0] - A[0], Bt[1] - A[1]];
      return { poFormule: 0, pryamo: dist([A[0] + v[0], A[1] + v[1]], Bt) };
    },
  },
  {
    kartochka: '2-slozhenie',
    sluchay: (rnd) => {
      const a = vek(rnd);
      const b = vek(rnd);
      /* Правило треугольника: конец b, отложенного от конца a. */
      const konec: P = [a[0] + b[0], a[1] + b[1]];
      return { poFormule: dist(O, [a[0] + b[0], a[1] + b[1]]), pryamo: dist(O, konec) };
    },
  },
  {
    kartochka: '2-dlina',
    sluchay: (rnd) => {
      const [x, y] = vek(rnd);
      return { poFormule: Math.sqrt(x * x + y * y), pryamo: dist(O, [x, y]) };
    },
  },
  {
    kartochka: '2-umnozhenie',
    sluchay: (rnd) => {
      const a = vek(rnd);
      const k = tsel(rnd) || 2;
      return { poFormule: Math.abs(k) * dist(O, a), pryamo: dist(O, [k * a[0], k * a[1]]) };
    },
  },
  {
    kartochka: '2-skalyarnoe-ugol',
    sluchay: (rnd) => {
      const a = vek(rnd);
      const b = vek(rnd);
      return { poFormule: dist(O, a) * dist(O, b) * Math.cos(ugol(a, O, b)), pryamo: dot(a, b) };
    },
  },
  {
    kartochka: '2-skalyarnoe-koordinaty',
    sluchay: (rnd) => {
      /* Повернём оба вектора на случайный угол: скалярное произведение не меняется. */
      const a = vek(rnd);
      const b = vek(rnd);
      const f = rnd() * 2 * Math.PI;
      const rot = (v: P): P => [
        v[0] * Math.cos(f) - v[1] * Math.sin(f),
        v[0] * Math.sin(f) + v[1] * Math.cos(f),
      ];
      return { poFormule: a[0] * b[0] + a[1] * b[1], pryamo: dot(rot(a), rot(b)) };
    },
  },
  {
    kartochka: '2-kvadrat',
    sluchay: (rnd) => {
      const a = vek(rnd);
      return { poFormule: dist(O, a) ** 2, pryamo: dot(a, a) };
    },
  },
  {
    kartochka: '2-svoystva',
    sluchay: (rnd) => {
      const a = vek(rnd);
      const b = vek(rnd);
      const c = vek(rnd);
      return { poFormule: dot(a, c) + dot(b, c), pryamo: dot([a[0] + b[0], a[1] + b[1]], c) };
    },
  },
  {
    kartochka: '2-kosinus',
    sluchay: (rnd) => {
      const [x1, y1] = vek(rnd);
      const [x2, y2] = vek(rnd);
      return {
        poFormule:
          (x1 * x2 + y1 * y2) / (Math.sqrt(x1 * x1 + y1 * y1) * Math.sqrt(x2 * x2 + y2 * y2)),
        pryamo: Math.cos(ugol([x1, y1], O, [x2, y2])),
      };
    },
  },
  {
    kartochka: '2-perpendikulyarnost',
    sluchay: (rnd) => {
      const a = vek(rnd);
      const b: P = [-a[1], a[0]];
      /* Скалярное произведение ноль — угол ровно 90°. */
      return { poFormule: 90, pryamo: dot(a, b) === 0 ? gr(ugol(a, O, b)) : NaN };
    },
  },
  {
    kartochka: '2-seredina',
    sluchay: (rnd) => {
      const A = vek(rnd);
      const Bt = vek(rnd);
      const M: P = [(A[0] + Bt[0]) / 2, (A[1] + Bt[1]) / 2];
      /* max(AM, MB) ≥ AB/2, и равенство — только у середины отрезка. */
      return { poFormule: dist(A, Bt) / 2, pryamo: Math.max(dist(A, M), dist(M, Bt)) };
    },
  },
  {
    kartochka: '2-rasstoyanie',
    sluchay: (rnd) => {
      const [x1, y1] = vek(rnd);
      const [x2, y2] = vek(rnd);
      return {
        poFormule: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
        pryamo: dist([x1, y1], [x2, y2]),
      };
    },
  },
  {
    kartochka: '2-mediana',
    sluchay: (rnd) => {
      const A = vek(rnd);
      const Bt = vek(rnd);
      const C = vek(rnd);
      const M: P = [(Bt[0] + C[0]) / 2, (Bt[1] + C[1]) / 2];
      const am: P = [(Bt[0] - A[0] + (C[0] - A[0])) / 2, (Bt[1] - A[1] + (C[1] - A[1])) / 2];
      return { poFormule: 0, pryamo: dist([A[0] + am[0], A[1] + am[1]], M) };
    },
  },
  {
    kartochka: '2-diagonali',
    sluchay: (rnd) => {
      const A = vek(rnd);
      const ab = vek(rnd);
      const ad = vek(rnd);
      const Bt: P = [A[0] + ab[0], A[1] + ab[1]];
      const D: P = [A[0] + ad[0], A[1] + ad[1]];
      const C: P = [Bt[0] + ad[0], Bt[1] + ad[1]];
      const ac: P = [ab[0] + ad[0], ab[1] + ad[1]];
      const db: P = [ab[0] - ad[0], ab[1] - ad[1]];
      return {
        poFormule: 0,
        pryamo: dist([A[0] + ac[0], A[1] + ac[1]], C) + dist([D[0] + db[0], D[1] + db[1]], Bt),
      };
    },
  },
];

const KOLODA_2: Koloda = {
  task: 2,
  slug: '2',
  title: 'Векторы',
  teoriya: 'teoriya/',
  podtemy: [
    { id: 'koordinaty', title: 'Координаты вектора' },
    { id: 'deystviya', title: 'Сложение, вычитание, умножение на число' },
    { id: 'dlina', title: 'Длина вектора' },
    { id: 'skalyarnoe', title: 'Скалярное произведение' },
    { id: 'kosinus', title: 'Угол между векторами' },
    { id: 'perpendikulyarnost', title: 'Перпендикулярность' },
    { id: 'kollinearnost', title: 'Коллинеарность' },
    { id: 'tochki', title: 'Середина отрезка и расстояние' },
    { id: 'figury', title: 'Базис и векторы в фигурах' },
  ],
  kartochki,
  proverki,
};

export default KOLODA_2;
