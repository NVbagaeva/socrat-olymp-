/**
 * №3, теория, глава 7 «Комбинации тел»: всё через осевое сечение; шар и
 * куб; шар, конус и цилиндр; призма и цилиндр.
 */

import { box, regularPrism, vertex } from '../../solid/figures';
import type { Model } from '../../solid/model';
import { ortho } from '../../solid/project';
import { dlina, P, pri } from './schet';
import type { GlavaDannye } from './tipy';

export function glava7(): GlavaDannye {
  /* Шар, вписанный в куб с ребром 6. */
  const k6 = box(6, 6, 6);
  k6.glass = true;
  const O6 = P(3, 3, 3);

  /* Куб с ребром 2√3: вписанный и описанный шары. */
  const a = 2 * Math.sqrt(3);
  const O = P(a / 2, a / 2, a / 2);
  const kubShar = (opisannyy: boolean, { alt }: { alt: string }): Model => {
    const kub = box(a, a, a);
    if (!opisannyy) kub.glass = true;
    return {
      alt,
      bodies: opisannyy
        ? [{ kind: 'sphere', center: O, r: (a * Math.sqrt(3)) / 2, glass: true }, kub]
        : [kub, { kind: 'sphere', center: O, r: a / 2 }],
      marks: [{ p: O, label: 'O' }],
      lines: opisannyy ? [{ a: vertex(kub, 'A'), b: vertex(kub, 'C1') }] : [{ a: O, b: P(a / 2, a / 2, 0) }],
    };
  };

  /* Призма и цилиндр: радиус 5. */
  const R = 5;
  const prizmaVCilindre = regularPrism(4, R, 7);
  prizmaVCilindre.noFill = true;
  const cilindrVPrizme = regularPrism(4, R * Math.SQRT2, 7);
  cilindrVPrizme.glass = true;
  const pv = (n: string) => vertex(prizmaVCilindre, n);

  /* Цилиндр в призме: сторона 2, высота 5. */
  const prizma2 = regularPrism(4, Math.SQRT2, 5);
  prizma2.glass = true;

  return {
    id: 'kombinacii',
    lead: 'Шар в кубе, конус в цилиндре, призма в цилиндре: два тела связывает одно плоское сечение, в нём и считаем.',
    razdely: [
      {
        id: 'g7-sechenie',
        title: 'Всё — через осевое сечение',
        bloki: [
          {
            vid: 'ideya',
            paras: [
              'Объёмная картинка с двумя телами сложна, а их сечение через ось или центр — плоская: круг в квадрате, круг в прямоугольнике, треугольник в прямоугольнике. Радиус одного тела в этом сечении — простой отрезок другого.',
            ],
          },
          {
            vid: 'algoritm',
            title: 'Комбинация тел за четыре шага',
            shagi: [
              { title: 'Сечение', text: 'Проведите плоскость через ось тела вращения или центр шара.' },
              { title: 'Плоская фигура', text: 'Нарисуйте сечение отдельно: что в чём лежит и где касается.' },
              { title: 'Связь', text: 'Найдите, каким отрезком второго тела оказался радиус первого.' },
              { title: 'Счёт', text: 'Подставьте найденный радиус или высоту в формулу.' },
            ],
          },
        ],
      },
      {
        id: 'g7-shar-kub',
        title: 'Шар и куб',
        bloki: [
          {
            vid: 'primer',
            primer: {
              id: 'g7-vpisannyy',
              title: 'Шар, вписанный в куб',
              uslovie: 'Шар вписан в куб с ребром $6$. Найдите объём шара, делённый на $\\pi$.',
              model: {
                alt: 'Шар с центром O, вписанный в куб; радиус шара — половина ребра',
                bodies: [k6, { kind: 'sphere', center: O6, r: 3 }],
                marks: [{ p: O6, label: 'O' }],
                lines: [{ a: O6, b: P(3, 3, 0), shag: 1 }],
                measures: [{ a: vertex(k6, 'A'), b: vertex(k6, 'B'), text: '6' }],
              },
              shagiChertezha: ['Шар касается каждой грани: радиус — расстояние от центра до грани.'],
              shagi: [
                {
                  title: 'Сечение',
                  paras: ['Сечение через центр параллельно грани — круг, вписанный в квадрат $6 \\times 6$.'],
                },
                {
                  title: 'Радиус',
                  paras: ['Диаметр шара равен ребру куба.'],
                  formuly: ['R = \\frac{6}{2} = 3'],
                },
                {
                  title: 'Объём',
                  paras: [],
                  formuly: ['V = \\frac{4}{3}\\pi\\cdot 27 = 36\\pi,\\quad \\frac{V}{\\pi} = 36'],
                },
              ],
              otvet: 'Ответ: $36$.',
              chislo: 36,
              pereschet: () => {
                const r = dlina(O6, P(3, 3, 0));
                return pri([[dlina(O6, P(3, 0, 3)), r]], (4 / 3) * r ** 3);
              },
            },
          },
          {
            vid: 'lovushka',
            title: 'Описанный шар — не вписанный',
            neverno: ['«$R = \\frac{a}{2} = \\sqrt{3}$». Это радиус вписанного шара: он касается граней.'],
            verno: [
              'Описанный шар проходит через вершины куба, его диаметр — диагональ куба $a\\sqrt{3}$.',
            ],
            risunki: {
              neverno: kubShar(false, { alt: 'Шар, вписанный в куб: радиус — половина ребра' }),
              verno: kubShar(true, { alt: 'Шар, описанный около куба: диаметр — диагональ куба AC₁' }),
            },
            zadacha: {
              uslovie: 'Ребро куба равно $2\\sqrt{3}$. Найдите радиус шара, описанного около куба.',
              reshenie: ['Диагональ куба — $2\\sqrt{3}\\cdot\\sqrt{3} = 6$, радиус — половина.'],
              formuly: ['R = \\frac{6}{2} = 3'],
              otvet: 'Ответ: $3$.',
              chislo: 3,
              pereschet: () => dlina(O, P(0, 0, 0)),
            },
          },
        ],
      },
      {
        id: 'g7-vrashcheniya',
        title: 'Шар, конус и цилиндр',
        bloki: [
          {
            vid: 'primer',
            primer: {
              id: 'g7-cilindr-shar',
              title: 'Цилиндр, описанный около шара',
              uslovie:
                'Цилиндр описан около шара радиуса $2$. Найдите объём цилиндра, делённый на $\\pi$.',
              model: {
                alt: 'Шар, вписанный в цилиндр: радиус основания цилиндра равен радиусу шара, высота — диаметру',
                bodies: [
                  { kind: 'cylinder', base: P(0, 0, 0), r: 2, h: 4, glass: true },
                  { kind: 'sphere', center: P(0, 0, 2), r: 2 },
                ],
                marks: [{ p: P(0, 0, 2), label: 'O' }],
                lines: [
                  { a: P(0, 0, 2), b: ortho.circlePoint(P(0, 0, 2), 2, 0), shag: 1 },
                  { a: P(0, 0, 0), b: P(0, 0, 4), shag: 1 },
                ],
              },
              shagiChertezha: ['Осевое сечение: круг, вписанный в квадрат $4 \\times 4$.'],
              shagi: [
                {
                  title: 'Сечение',
                  paras: ['Осевое сечение цилиндра — квадрат, в который вписан большой круг шара.'],
                },
                {
                  title: 'Размеры цилиндра',
                  paras: ['Радиус основания равен радиусу шара, высота — диаметру.'],
                  formuly: ['r = 2,\\quad h = 4'],
                },
                {
                  title: 'Объём',
                  paras: [],
                  formuly: ['V = \\pi\\cdot 2^2\\cdot 4 = 16\\pi,\\quad \\frac{V}{\\pi} = 16'],
                },
              ],
              otvet: 'Ответ: $16$.',
              chislo: 16,
              pereschet: () => 2 ** 2 * (2 * 2),
            },
          },
          {
            vid: 'layfhak',
            title: 'Лайфхак: боковая поверхность описанного цилиндра равна поверхности шара',
            paras: ['$2\\pi R\\cdot 2R = 4\\pi R^2$ — совпадение, которое экономит весь счёт.'],
            zadacha: {
              uslovie:
                'Площадь поверхности шара равна $20$. Найдите площадь боковой поверхности цилиндра, описанного около шара.',
              reshenie: ['Боковая поверхность описанного цилиндра равна поверхности шара.'],
              formuly: ['S_{\\text{бок}} = 20'],
              otvet: 'Ответ: $20$.',
              chislo: 20,
              pereschet: () => {
                const r = Math.sqrt(20 / (4 * Math.PI));
                return 2 * Math.PI * r * 2 * r;
              },
            },
          },
          {
            vid: 'vazhno',
            title: 'Важно: конус — треть цилиндра',
            paras: ['Если у конуса и цилиндра общие основание и высота, объём конуса — треть объёма цилиндра.'],
            zadacha: {
              uslovie:
                'Конус и цилиндр имеют общее основание и общую высоту. Объём цилиндра равен $27$. Найдите объём конуса.',
              reshenie: ['$\\frac{1}{3}\\pi r^2 h$ против $\\pi r^2 h$.'],
              formuly: ['V = \\frac{27}{3} = 9'],
              otvet: 'Ответ: $9$.',
              chislo: 9,
              pereschet: () => {
                const r = 1;
                const h = 27 / Math.PI;
                return (Math.PI * r * r * h) / 3;
              },
            },
          },
        ],
      },
      {
        id: 'g7-prizma',
        title: 'Призма и цилиндр',
        bloki: [
          {
            vid: 'ideya',
            paras: [
              'Цилиндр, вписанный в призму, касается её боковых граней: его радиус — радиус окружности, вписанной в основание. Призма, вписанная в цилиндр, стоит вершинами на его окружности: радиус — радиус описанной окружности.',
            ],
          },
          {
            vid: 'primer',
            primer: {
              id: 'g7-cilindr-v-prizme',
              title: 'Цилиндр в правильной призме',
              uslovie:
                'В правильную четырёхугольную призму со стороной основания $2$ и высотой $5$ вписан цилиндр. Найдите площадь боковой поверхности цилиндра, делённую на $\\pi$.',
              model: {
                alt: 'Цилиндр, вписанный в правильную четырёхугольную призму: окружность основания касается сторон квадрата',
                bodies: [prizma2, { kind: 'cylinder', base: P(0, 0, 0), r: 1, h: 5 }],
              },
              shagi: [
                {
                  title: 'Сечение основанием',
                  paras: ['В основании — круг, вписанный в квадрат со стороной $2$: его диаметр равен стороне.'],
                  formuly: ['r = 1'],
                },
                {
                  title: 'Боковая поверхность',
                  paras: ['Высота цилиндра равна высоте призмы.'],
                  formuly: ['S_{\\text{бок}} = 2\\pi\\cdot 1\\cdot 5 = 10\\pi,\\quad \\frac{S}{\\pi} = 10'],
                },
              ],
              otvet: 'Ответ: $10$.',
              chislo: 10,
              pereschet: () => 2 * (dlina(vertex(prizma2, 'A'), vertex(prizma2, 'B')) / 2) * dlina(vertex(prizma2, 'A'), vertex(prizma2, 'A1')),
            },
          },
          {
            vid: 'lovushka',
            title: 'Сторона квадрата — не диаметр, если квадрат внутри круга',
            neverno: ['«Призма вписана в цилиндр радиуса $5$ — сторона основания равна диаметру, $a = 10$». Так было бы, если бы цилиндр был внутри призмы.'],
            verno: ['Вершины квадрата лежат на окружности: диаметр $10$ — диагональ квадрата, $a^2 = \\frac{10^2}{2}$.'],
            risunki: {
              neverno: {
                alt: 'Цилиндр, вписанный в призму: диаметр равен стороне квадрата',
                bodies: [cilindrVPrizme, { kind: 'cylinder', base: P(0, 0, 0), r: R, h: 7 }],
              },
              verno: {
                alt: 'Призма, вписанная в цилиндр: диагональ основания равна диаметру',
                bodies: [{ kind: 'cylinder', base: P(0, 0, 0), r: R, h: 7, glass: true }, prizmaVCilindre],
                lines: [{ a: pv('A'), b: pv('C') }],
              },
            },
            zadacha: {
              uslovie:
                'Правильная четырёхугольная призма вписана в цилиндр, радиус основания которого равен $5$. Найдите квадрат стороны основания призмы.',
              reshenie: ['Диагональ квадрата — диаметр $10$; квадрат стороны — половина квадрата диагонали.'],
              formuly: ['a^2 = \\frac{100}{2} = 50'],
              otvet: 'Ответ: $50$.',
              chislo: 50,
              pereschet: () => dlina(pv('A'), pv('B')) ** 2,
            },
          },
        ],
      },
    ],
  };
}
