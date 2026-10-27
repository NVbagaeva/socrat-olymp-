/**
 * №3, теория, глава 4 «Объём и площадь поверхности многогранников»:
 * формулы, составные тела (сложить или вычесть), площадь через
 * проекции и где она не работает, части параллелепипеда и призмы.
 */

import { box, kubiki, pyramid, regularPolygon, polygonStart, rightPrism, vertex } from '../../solid/figures';
import type { Polyhedron } from '../../solid/model';
import { teloStupenki, vershinyStupenki, type Stupenka } from '../stupenka';
import { obemMnogogrannika, obemTetraedra, P, ploshchadKubikov, ploshchadPoverhnosti, pri } from './schet';
import type { GlavaDannye } from './tipy';

function imena(body: Polyhedron) {
  return (n: string) => vertex(body, n);
}

/** Куб из единичных кубиков n×n×n без кубиков из spisok. */
function kubBez(n: number, bez: readonly (readonly [number, number, number])[]): [number, number, number][] {
  const ubrat = new Set(bez.map((k) => k.join(',')));
  const out: [number, number, number][] = [];
  for (let i = 0; i < n; i += 1)
    for (let j = 0; j < n; j += 1)
      for (let k = 0; k < n; k += 1) if (!ubrat.has(`${i},${j},${k}`)) out.push([i, j, k]);
  return out;
}

export function glava4(): GlavaDannye {
  /* Пирамида 6 × 6, высота 5. */
  const pir = pyramid(regularPolygon(4, 6 / Math.SQRT2, 0, polygonStart(4)), P(0, 0, 5));

  /* Ступенька: вся ширина 6, высокий блок 3 × 5, низкий — высотой 2, глубина 4. */
  const st: Stupenka = { W: 6, w: 3, H: 5, h: 2, D: 4 };
  const stV = vershinyStupenki(st);
  const stTelo = teloStupenki(st, ['A', 'B', 'C', 'D']);
  const stModel = (alt: string) => ({
    alt,
    view: 'cabinet' as const,
    bodies: [stTelo],
    measures: [
      { a: stV['A'] as [number, number, number], b: stV['B'] as [number, number, number], text: '6' },
      { a: stV['A2'] as [number, number, number], b: stV['B2'] as [number, number, number], text: '3' },
      { a: stV['A'] as [number, number, number], b: stV['A2'] as [number, number, number], text: '5' },
      { a: stV['B'] as [number, number, number], b: stV['B1'] as [number, number, number], text: '2' },
      { a: stV['B'] as [number, number, number], b: stV['C'] as [number, number, number], text: '4' },
    ],
  });

  /* Куб 4 с вырезом 2 × 2 × 4 — та же ступенька. */
  const vyrez: Stupenka = { W: 4, w: 2, H: 4, h: 2, D: 4 };

  /* Куб 3 с ямкой 1 × 1 × 1 в середине верхней грани. */
  const yamka = kubiki(kubBez(3, [[1, 1, 2]]));
  /* Стенки ямки, видные сверху внутрь (дальняя и левая): новые грани,
     которых нет в проекциях. Ближние стенки закрыты краем ямки. */
  const stenkiYamki = [
    { points: [P(2, 2, 2), P(1, 2, 2), P(1, 2, 3), P(2, 2, 3)] },
    { points: [P(1, 2, 2), P(1, 1, 2), P(1, 1, 3), P(1, 2, 3)] },
  ];

  /* Части параллелепипеда объёма 18 и 30. */
  const b18 = box(3, 2, 3);
  const a = imena(b18);
  const pirB1 = pyramid(['A', 'B', 'C', 'D'].map(a), a('B1'));
  const b12 = box(2, 2, 3);
  const c = imena(b12);
  const b30 = box(2, 3, 5);
  const d = imena(b30);

  return {
    id: 'obem',
    lead: 'Объём и площадь поверхности: формулы одной карточкой и три приёма — разбить, достроить, взять долю.',
    razdely: [
      {
        id: 'g4-formuly',
        title: 'Формулы — одной карточкой',
        bloki: [
          {
            vid: 'formuly',
            title: 'Объём',
            stroki: [
              { podpis: 'Прямоугольный параллелепипед', tex: 'V = abc' },
              { podpis: 'Любая призма', tex: 'V = S_{\\text{осн}}\\cdot h' },
              { podpis: 'Любая пирамида', tex: 'V = \\frac{1}{3}S_{\\text{осн}}\\cdot h' },
            ],
          },
          {
            vid: 'formuly',
            title: 'Площадь поверхности',
            stroki: [
              { podpis: 'Прямоугольный параллелепипед', tex: 'S = 2(ab + bc + ac)' },
              { podpis: 'Любой многогранник', tex: 'S = \\text{сумма площадей всех граней}' },
            ],
          },
          {
            vid: 'vazhno',
            title: 'Важно: у пирамиды множитель $\\frac{1}{3}$',
            paras: ['Пирамида занимает ровно треть призмы с тем же основанием и той же высотой.'],
            zadacha: {
              uslovie:
                'В основании пирамиды квадрат со стороной $6$, высота пирамиды — $5$. Найдите её объём.',
              reshenie: ['Площадь основания — $36$.'],
              formuly: ['V = \\frac{1}{3}\\cdot 36\\cdot 5 = 60'],
              otvet: 'Ответ: $60$.',
              chislo: 60,
              pereschet: () => obemMnogogrannika(pir),
            },
          },
        ],
      },
      {
        id: 'g4-sostavnye',
        title: 'Составные многогранники: сложить или вычесть',
        bloki: [
          {
            vid: 'ideya',
            paras: [
              'Многогранник со ступенькой — это несколько параллелепипедов. Его объём можно сложить из частей или получить вычитанием: достроить до большого параллелепипеда и убрать лишнее.',
            ],
          },
          {
            vid: 'primer',
            primer: {
              id: 'g4-stupenka',
              title: 'Объём ступеньки',
              uslovie:
                'Найдите объём многогранника, изображённого на рисунке (все двугранные углы прямые).',
              model: stModel('Многогранник-ступенька: ширина 6, высокий блок шириной 3 и высотой 5, низкий — высотой 2, глубина 4'),
              shagi: [
                {
                  title: 'Разбиваем',
                  paras: ['Проводим разрез по уступу: низкий блок $6 \\times 2 \\times 4$ и над ним — блок $3 \\times 3 \\times 4$.'],
                },
                {
                  title: 'Складываем',
                  paras: [],
                  formuly: ['V = 6\\cdot 2\\cdot 4 + 3\\cdot 3\\cdot 4 = 48 + 36 = 84'],
                },
              ],
              otvet: 'Ответ: $84$.',
              chislo: 84,
              pereschet: () => obemMnogogrannika(stTelo),
            },
          },
          {
            vid: 'layfhak',
            title: 'Лайфхак: проще вычесть, чем сложить',
            paras: ['Если вырез — один параллелепипед, считаем целое тело и убираем вырез.'],
            zadacha: {
              uslovie:
                'Из куба с ребром $4$ вырезали прямоугольный параллелепипед $2 \\times 2 \\times 4$ вдоль одного ребра. Найдите объём оставшейся части.',
              reshenie: ['Объём куба минус объём выреза.'],
              formuly: ['V = 4^3 - 2\\cdot 2\\cdot 4 = 64 - 16 = 48'],
              otvet: 'Ответ: $48$.',
              chislo: 48,
              pereschet: () => obemMnogogrannika(teloStupenki(vyrez)),
            },
          },
        ],
      },
      {
        id: 'g4-proekcii',
        title: 'Площадь ступенчатых: через проекции и когда это не работает',
        bloki: [
          {
            vid: 'ideya',
            paras: [
              'У ступенчатого многогранника каждая грань смотрит в одну из шести сторон. Грани, которые смотрят вверх, вместе закрывают проекцию тела на пол; смотрящие вниз — тоже. Так по каждой из трёх осей: площадь поверхности — удвоенная сумма трёх проекций.',
            ],
          },
          { vid: 'formula', tex: 'S = 2\\left(S_{\\text{спереди}} + S_{\\text{сбоку}} + S_{\\text{сверху}}\\right)' },
          {
            vid: 'primer',
            primer: {
              id: 'g4-ploshchad-stupenki',
              title: 'Площадь поверхности ступеньки',
              uslovie:
                'Найдите площадь поверхности многогранника, изображённого на рисунке (все двугранные углы прямые).',
              model: stModel('Та же ступенька: ширина 6, высокий блок шириной 3 и высотой 5, низкий — высотой 2, глубина 4'),
              shagi: [
                {
                  title: 'Три проекции',
                  paras: [
                    'Спереди — профиль ступеньки: $6\\cdot 2 + 3\\cdot 3 = 21$. Сбоку — прямоугольник высотой $5$ и глубиной $4$: $20$. Сверху — прямоугольник $6 \\times 4$: $24$.',
                  ],
                },
                {
                  title: 'Удваиваем сумму',
                  paras: [],
                  formuly: ['S = 2(21 + 20 + 24) = 130'],
                },
              ],
              otvet: 'Ответ: $130$.',
              chislo: 130,
              pereschet: () => ploshchadPoverhnosti(stTelo),
            },
          },
          {
            vid: 'lovushka',
            title: 'Проекции не видят выемок',
            neverno: [
              '«Из середины грани куба с ребром $3$ вынули кубик $1 \\times 1 \\times 1$. Проекции те же, значит, $S = 6\\cdot 9 = 54$».',
            ],
            verno: [
              'Метод проекций работает, только если каждая прямая, параллельная оси, пересекает поверхность дважды. В ямке появились четыре стенки, которых проекции не видят: $S = 54 + 4 = 58$.',
            ],
            risunki: {
              neverno: { alt: 'Целый куб с ребром 3: такие же три проекции, как у куба с ямкой', bodies: [kubiki(kubBez(3, []), 1)] },
              verno: {
                alt: 'Куб с ребром 3 и ямкой 1 на 1 на 1 в середине верхней грани: видные стенки ямки выделены',
                bodies: [yamka],
                sections: stenkiYamki,
              },
            },
            zadacha: {
              uslovie:
                'Из середины грани куба с ребром $3$ вынули кубик с ребром $1$, получилась ямка. Найдите площадь поверхности оставшегося тела.',
              reshenie: ['Дно ямки заменило вынутый квадрат грани, а четыре стенки ямки — новые.'],
              formuly: ['S = 6\\cdot 3^2 + 4\\cdot 1^2 = 58'],
              otvet: 'Ответ: $58$.',
              chislo: 58,
              pereschet: () => pri([[ploshchadPoverhnosti(yamka), 58]], ploshchadKubikov(kubBez(3, [[1, 1, 2]]))),
            },
          },
        ],
      },
      {
        id: 'g4-chasti',
        title: 'Части параллелепипеда и призмы',
        bloki: [
          {
            vid: 'ideya',
            paras: [
              'Часть, отрезанная от параллелепипеда, считается долей от целого: с тем же основанием и той же высотой пирамида — это $\\frac{1}{3}$ призмы, а половина основания даёт ещё множитель $\\frac{1}{2}$.',
            ],
          },
          {
            vid: 'primer',
            primer: {
              id: 'g4-chast',
              title: 'Пирамида внутри параллелепипеда',
              uslovie:
                'Объём параллелепипеда $ABCDA_1B_1C_1D_1$ равен $18$. Найдите объём пирамиды $B_1ABCD$.',
              model: {
                alt: 'Параллелепипед ABCDA₁B₁C₁D₁ и пирамида с основанием ABCD и вершиной B₁',
                bodies: [b18],
                lines: [
                  { a: a('B1'), b: a('A'), shag: 1 },
                  { a: a('B1'), b: a('C'), shag: 1 },
                  { a: a('B1'), b: a('D'), shag: 1 },
                ],
                sections: [{ points: ['A', 'B', 'C', 'D'].map(a), shag: 1 }],
              },
              shagiChertezha: ['Основание пирамиды — нижняя грань, вершина $B_1$ — на верхней.'],
              shagi: [
                {
                  title: 'Сравниваем с параллелепипедом',
                  paras: ['Основание общее — $ABCD$, высота общая — расстояние между основаниями.'],
                },
                {
                  title: 'Берём треть',
                  paras: [],
                  formuly: ['V = \\frac{1}{3}\\cdot 18 = 6'],
                },
              ],
              otvet: 'Ответ: $6$.',
              chislo: 6,
              pereschet: () => pri([[obemMnogogrannika(b18), 18]], obemMnogogrannika(pirB1)),
            },
          },
          {
            vid: 'vazhno',
            title: 'Важно: диагональная плоскость делит параллелепипед пополам',
            zadacha: {
              uslovie:
                'Объём параллелепипеда $ABCDA_1B_1C_1D_1$ равен $12$. Найдите объём треугольной призмы $ABCA_1B_1C_1$.',
              reshenie: ['Диагональ $AC$ делит основание на два равных треугольника, высота та же.'],
              formuly: ['V = \\frac{1}{2}\\cdot 12 = 6'],
              otvet: 'Ответ: $6$.',
              chislo: 6,
              pereschet: () =>
                pri([[obemMnogogrannika(b12), 12]], obemMnogogrannika(rightPrism(['A', 'B', 'C'].map(c), 3))),
            },
          },
          {
            vid: 'lovushka',
            title: 'Треть от половины, а не от целого',
            neverno: ['«$A_1ABD$ — пирамида, значит, её объём — треть параллелепипеда: $10$». Но основание $ABD$ — только половина грани.'],
            verno: ['Основание — половина $ABCD$, высота — ребро $AA_1$: множители $\\frac{1}{2}$ и $\\frac{1}{3}$, всего $\\frac{1}{6}$.'],
            zadacha: {
              uslovie:
                'Объём параллелепипеда $ABCDA_1B_1C_1D_1$ равен $30$. Найдите объём треугольной пирамиды $A_1ABD$.',
              reshenie: ['Пирамида — шестая часть параллелепипеда.'],
              formuly: ['V = \\frac{1}{6}\\cdot 30 = 5'],
              otvet: 'Ответ: $5$.',
              chislo: 5,
              pereschet: () =>
                pri([[obemMnogogrannika(b30), 30]], obemTetraedra(d('A1'), d('A'), d('B'), d('D'))),
            },
          },
        ],
      },
    ],
  };
}
