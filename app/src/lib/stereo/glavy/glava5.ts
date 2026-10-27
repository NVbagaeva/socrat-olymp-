/**
 * №3, теория, глава 5 «Тела вращения»: цилиндр, конус, шар и их осевые
 * сечения, боковая и полная поверхность, часть тела по сектору, ответ
 * в единицах π.
 */

import { dir, sektorCilindra, sektorKonusa } from '../../solid/figures';
import type { Model } from '../../solid/model';
import { ortho } from '../../solid/project';
import { dlina, P, pri } from './schet';
import type { GlavaDannye } from './tipy';

/** Конус с вершиной S над центром O; A — точка окружности основания. */
function konus(r: number, h: number) {
  const O = P(0, 0, 0);
  const S = P(0, 0, h);
  const A = ortho.circlePoint(O, r, 0);
  return { O, S, A, telo: { kind: 'cone' as const, base: O, r, h } };
}

export function glava5(): GlavaDannye {
  const k10 = konus(6, 8);
  const k13 = konus(5, 12);
  const lovKonus = (verno: boolean): Model => ({
    alt: verno
      ? 'Конус: образующая SA — гипотенуза треугольника SOA'
      : 'Конус: высота SO, ошибочно принятая за образующую',
    bodies: [k13.telo],
    marks: [
      { p: k13.O, label: 'O' },
      { p: k13.S, label: 'S' },
      { p: k13.A, label: 'A' },
    ],
    lines: verno
      ? [
          { a: k13.S, b: k13.O },
          { a: k13.O, b: k13.A },
          { a: k13.S, b: k13.A },
        ]
      : [{ a: k13.S, b: k13.O }],
    ...(verno
      ? {
          sections: [{ points: [k13.S, k13.O, k13.A] }],
          angles: [{ at: k13.O, u: dir(k13.O, k13.A), v: dir(k13.O, k13.S) }],
        }
      : {}),
  });

  return {
    id: 'vrashcheniya',
    lead: 'Цилиндр, конус и шар: всё считается в осевом сечении, а ответ часто просят в единицах $\\pi$.',
    razdely: [
      {
        id: 'g5-elementy',
        title: 'Цилиндр, конус, шар; осевое сечение',
        bloki: [
          {
            vid: 'ideya',
            paras: [
              'Тело вращения получается, когда плоская фигура поворачивается вокруг оси. Разрежьте тело плоскостью через ось — и увидите эту фигуру: у цилиндра прямоугольник $2r \\times h$, у конуса равнобедренный треугольник, у шара круг радиуса $R$.',
            ],
          },
          {
            vid: 'opredelenie',
            plashka: 'Конус',
            paras: ['Высота $h$, радиус основания $r$ и образующая $l$ образуют прямоугольный треугольник; образующая — гипотенуза.'],
            formuly: ['l^2 = r^2 + h^2'],
          },
          {
            vid: 'primer',
            primer: {
              id: 'g5-konus',
              title: 'Высота конуса',
              uslovie: 'Образующая конуса равна $10$, радиус основания — $6$. Найдите высоту конуса.',
              model: {
                alt: 'Конус с вершиной S: высота SO, радиус OA и образующая SA',
                bodies: [k10.telo],
                marks: [
                  { p: k10.O, label: 'O' },
                  { p: k10.S, label: 'S' },
                  { p: k10.A, label: 'A' },
                ],
                lines: [
                  { a: k10.S, b: k10.A, shag: 1 },
                  { a: k10.O, b: k10.A, shag: 1 },
                  { a: k10.S, b: k10.O, shag: 2 },
                ],
                sections: [{ points: [k10.S, k10.O, k10.A], shag: 2 }],
                angles: [{ at: k10.O, u: dir(k10.O, k10.A), v: dir(k10.O, k10.S), shag: 2 }],
              },
              shagiChertezha: [
                'Образующая $SA = 10$ и радиус $OA = 6$.',
                'Высота $SO$ перпендикулярна основанию: треугольник $SOA$ прямоугольный.',
              ],
              ploskiy: {
                vershiny: ['O', 'A', 'S'],
                kateti: [6, 8],
                podpisi: { a: '6', b: '?', c: '10' },
                iskomoe: 'b',
                alt: 'Прямоугольный треугольник SOA: катет OA = 6, гипотенуза SA = 10, катет SO — искомый',
              },
              shagi: [
                {
                  title: 'Рисуем',
                  paras: ['Половина осевого сечения — треугольник $SOA$ с прямым углом при $O$.'],
                },
                {
                  title: 'Считаем',
                  paras: ['Тройка $6,\\ 8,\\ 10$ — это $3,\\ 4,\\ 5$, умноженная на $2$.'],
                  formuly: ['SO^2 = 10^2 - 6^2 = 64,\\quad SO = 8'],
                },
              ],
              otvet: 'Ответ: $8$.',
              chislo: 8,
              pereschet: () =>
                pri(
                  [
                    [dlina(k10.S, k10.A), 10],
                    [dlina(k10.O, k10.A), 6],
                  ],
                  dlina(k10.S, k10.O),
                ),
            },
          },
          {
            vid: 'lovushka',
            title: 'Образующая — не высота',
            neverno: ['«Высота $12$ — значит, и образующая $12$». Высота идёт по оси, образующая — по боковой поверхности, она длиннее.'],
            verno: ['Образующая — гипотенуза треугольника с катетами $h$ и $r$.'],
            risunki: { neverno: lovKonus(false), verno: lovKonus(true) },
            zadacha: {
              uslovie: 'Высота конуса равна $12$, радиус основания — $5$. Найдите образующую.',
              reshenie: ['Тройка $5,\\ 12,\\ 13$.'],
              formuly: ['l^2 = 5^2 + 12^2 = 169,\\quad l = 13'],
              otvet: 'Ответ: $13$.',
              chislo: 13,
              pereschet: () => dlina(k13.S, k13.A),
            },
          },
        ],
      },
      {
        id: 'g5-poverhnost',
        title: 'Боковая и полная поверхность',
        bloki: [
          {
            vid: 'formuly',
            title: 'Поверхности тел вращения',
            stroki: [
              { podpis: 'Цилиндр: боковая — развёртка-прямоугольник $2\\pi r \\times h$', tex: 'S_{\\text{бок}} = 2\\pi rh' },
              { podpis: 'Цилиндр: полная — плюс два круга', tex: 'S = 2\\pi rh + 2\\pi r^2 = 2\\pi r(r + h)' },
              { podpis: 'Конус: боковая', tex: 'S_{\\text{бок}} = \\pi rl' },
              { podpis: 'Конус: полная — плюс круг основания', tex: 'S = \\pi r(r + l)' },
              { podpis: 'Шар', tex: 'S = 4\\pi R^2' },
            ],
          },
          {
            vid: 'primer',
            primer: {
              id: 'g5-cilindr',
              title: 'Полная поверхность цилиндра',
              uslovie:
                'Радиус основания цилиндра равен $3$, высота — $5$. Найдите площадь полной поверхности цилиндра, делённую на $\\pi$.',
              model: {
                alt: 'Цилиндр с радиусом основания 3 и высотой 5',
                bodies: [{ kind: 'cylinder', base: P(0, 0, 0), r: 3, h: 5 }],
                lines: [
                  { a: P(0, 0, 0), b: ortho.circlePoint(P(0, 0, 0), 3, 0), label: '3' },
                  { a: ortho.circlePoint(P(0, 0, 0), 3, 0), b: ortho.circlePoint(P(0, 0, 5), 3, 0), label: '5' },
                ],
              },
              shagi: [
                {
                  title: 'Боковая поверхность',
                  paras: [],
                  formuly: ['S_{\\text{бок}} = 2\\pi\\cdot 3\\cdot 5 = 30\\pi'],
                },
                {
                  title: 'Два основания',
                  paras: [],
                  formuly: ['2\\pi r^2 = 2\\pi\\cdot 9 = 18\\pi'],
                },
                {
                  title: 'Складываем и делим на $\\pi$',
                  paras: [],
                  formuly: ['S = 48\\pi,\\quad \\frac{S}{\\pi} = 48'],
                },
              ],
              otvet: 'Ответ: $48$.',
              chislo: 48,
              pereschet: () => (2 * Math.PI * 3 * 5 + 2 * Math.PI * 3 ** 2) / Math.PI,
            },
          },
          {
            vid: 'vazhno',
            title: 'Важно: развёртка боковой поверхности цилиндра — прямоугольник',
            paras: ['Одна его сторона — длина окружности основания, другая — высота. Радиус для этого не нужен.'],
            zadacha: {
              uslovie:
                'Длина окружности основания цилиндра равна $6$, высота — $4$. Найдите площадь боковой поверхности цилиндра.',
              reshenie: ['Площадь прямоугольника-развёртки.'],
              formuly: ['S_{\\text{бок}} = 6\\cdot 4 = 24'],
              otvet: 'Ответ: $24$.',
              chislo: 24,
              pereschet: () => {
                const r = 6 / (2 * Math.PI);
                return 2 * Math.PI * r * 4;
              },
            },
          },
        ],
      },
      {
        id: 'g5-sektor',
        title: 'Часть тела по сектору',
        bloki: [
          {
            vid: 'ideya',
            paras: [
              'Если от цилиндра, конуса или шара отрезали часть двумя плоскостями через ось, эта часть — доля от целого тела. Доля равна центральному углу, делённому на полный угол $360^\\circ$.',
            ],
          },
          { vid: 'formula', tex: 'V_{\\text{части}} = V\\cdot\\frac{\\alpha}{360^\\circ}' },
          {
            vid: 'risunki',
            items: [
              {
                model: {
                  alt: 'Часть цилиндра с центральным углом AOB = 120°: треть цилиндра',
                  bodies: [sektorCilindra(3, 4, 120, 260)],
                },
                podpis: 'Угол $120^\\circ$ — треть полного оборота: треть цилиндра.',
              },
              {
                model: {
                  alt: 'Часть конуса с центральным углом AOB = 60°: шестая часть конуса',
                  bodies: [sektorKonusa(3, 5, 60, 210)],
                },
                podpis: 'Угол $60^\\circ$ — шестая часть оборота: шестая часть конуса.',
              },
              {
                model: {
                  alt: 'Цилиндр, из которого вырезана четверть: осталась часть с углом 270°',
                  bodies: [sektorCilindra(3, 4, 270, 0)],
                },
                podpis: 'Вырезали четверть — осталось $\\frac{270^\\circ}{360^\\circ} = \\frac{3}{4}$ цилиндра.',
              },
            ],
          },
          {
            vid: 'layfhak',
            title: 'Лайфхак: сначала сократите долю',
            paras: ['$\\frac{120^\\circ}{360^\\circ} = \\frac{1}{3}$, $\\frac{60^\\circ}{360^\\circ} = \\frac{1}{6}$, $\\frac{90^\\circ}{360^\\circ} = \\frac{1}{4}$ — дальше деление в уме.'],
            zadacha: {
              uslovie:
                'Объём цилиндра равен $72$. Найдите объём части цилиндра с центральным углом $120^\\circ$.',
              reshenie: ['Доля — треть.'],
              formuly: ['V = 72\\cdot\\frac{1}{3} = 24'],
              otvet: 'Ответ: $24$.',
              chislo: 24,
              pereschet: () => (72 * 120) / 360,
            },
          },
          {
            vid: 'lovushka',
            title: 'Полный угол — $360^\\circ$, а не $180^\\circ$',
            neverno: ['«Доля — $\\frac{60}{180} = \\frac{1}{3}$, объём части — $18$». Полуокружность — только половина полного оборота.'],
            verno: ['Делим на $360^\\circ$: доля $\\frac{1}{6}$.'],
            zadacha: {
              uslovie:
                'Объём конуса равен $54$. Найдите объём части конуса с центральным углом $60^\\circ$.',
              reshenie: ['Доля — шестая часть.'],
              formuly: ['V = 54\\cdot\\frac{1}{6} = 9'],
              otvet: 'Ответ: $9$.',
              chislo: 9,
              pereschet: () => (54 * 60) / 360,
            },
          },
        ],
      },
      {
        id: 'g5-pi',
        title: 'Ответ в единицах пи',
        bloki: [
          {
            vid: 'ideya',
            paras: [
              'Когда в условии «делённую на $\\pi$», не подставляйте $3{,}14$: оставляйте $\\pi$ множителем до конца, а в бланк пишите коэффициент перед ним.',
            ],
          },
          {
            vid: 'primer',
            primer: {
              id: 'g5-shar',
              title: 'Объём шара',
              uslovie: 'Радиус шара равен $3$. Найдите объём шара, делённый на $\\pi$.',
              model: {
                alt: 'Шар с центром O и радиусом 3',
                bodies: [{ kind: 'sphere', center: P(0, 0, 0), r: 3, equator: true }],
                marks: [{ p: P(0, 0, 0), label: 'O' }],
                lines: [{ a: P(0, 0, 0), b: ortho.circlePoint(P(0, 0, 0), 3, 0), label: '3' }],
              },
              shagi: [
                {
                  title: 'Подставляем',
                  paras: [],
                  formuly: ['V = \\frac{4}{3}\\pi R^3 = \\frac{4}{3}\\pi\\cdot 27 = 36\\pi'],
                },
                {
                  title: 'Делим на $\\pi$',
                  paras: [],
                  formuly: ['\\frac{V}{\\pi} = 36'],
                },
              ],
              otvet: 'Ответ: $36$.',
              chislo: 36,
              pereschet: () => ((4 / 3) * Math.PI * 3 ** 3) / Math.PI,
            },
          },
          {
            vid: 'layfhak',
            title: 'Лайфхак: поверхность шара — четыре больших круга',
            paras: ['$S = 4\\pi R^2$, а $\\pi R^2$ — площадь большого круга. Радиус искать не нужно.'],
            zadacha: {
              uslovie: 'Площадь большого круга шара равна $5$. Найдите площадь поверхности шара.',
              reshenie: ['Поверхность — четыре площади большого круга.'],
              formuly: ['S = 4\\cdot 5 = 20'],
              otvet: 'Ответ: $20$.',
              chislo: 20,
              pereschet: () => {
                const R = Math.sqrt(5 / Math.PI);
                return 4 * Math.PI * R ** 2;
              },
            },
          },
          {
            vid: 'lovushka',
            title: 'В бланк — коэффициент, а не $\\pi$',
            neverno: ['«$V = 12\\pi \\approx 37{,}68$» — в бланке ошибка: спрашивали объём, делённый на $\\pi$.'],
            verno: ['Делим на $\\pi$ и пишем $12$.'],
            zadacha: {
              uslovie:
                'Радиус основания цилиндра равен $2$, высота — $3$. Найдите объём цилиндра, делённый на $\\pi$.',
              reshenie: ['Объём цилиндра — площадь основания на высоту.'],
              formuly: ['V = \\pi\\cdot 2^2\\cdot 3 = 12\\pi,\\quad \\frac{V}{\\pi} = 12'],
              otvet: 'Ответ: $12$.',
              chislo: 12,
              pereschet: () => (Math.PI * 2 ** 2 * 3) / Math.PI,
            },
          },
        ],
      },
    ],
  };
}
