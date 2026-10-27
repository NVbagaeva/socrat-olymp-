/**
 * №3, теория, глава 1 «Как читать и строить чертёж». Умение: читать —
 * понимать, что на чертеже настоящее, а что искажено проекцией.
 */

import { box, dir, polygonStart, pyramid, regularPolygon, tetrahedron, vertex } from '../../solid/figures';
import { polyhedronEdges, type Model } from '../../solid/model';
import { dlina, P, seredina } from './schet';
import type { GlavaDannye } from './tipy';

/** Куб ABCDA₁B₁C₁D₁ с ребром a и доступом к вершинам по имени. */
function kub(a: number) {
  const body = box(a, a, a);
  return { body, v: (n: string) => vertex(body, n) };
}

/** Правильная четырёхугольная пирамида: сторона основания s, высота h. */
function piramida4(s: number, h: number) {
  const body = pyramid(regularPolygon(4, s / Math.SQRT2, 0, polygonStart(4)), P(0, 0, h));
  return { body, v: (n: string) => vertex(body, n), O: P(0, 0, 0) };
}

export function glava1(): GlavaDannye {
  /* Раздел 1: середина и центр грани. */
  const k4 = kub(4);
  const M = seredina(k4.v('A'), k4.v('A1'));
  const k6 = kub(6);
  const O6 = seredina(k6.v('A'), k6.v('C'));
  const k5 = kub(5);

  /* Раздел 2: пирамида, все рёбра 6. */
  const p6 = piramida4(6, Math.sqrt(18));
  const [S, A, O] = [p6.v('S'), p6.v('A'), p6.O];

  /* Раздел 3: удачные и неудачные ракурсы. */
  const kd = kub(3);
  const kubDiag = (rakurs?: { azimuth: number; elevation: number }): Model => ({
    alt: 'Куб с диагональю BD₁',
    bodies: [kd.body],
    lines: [{ a: kd.v('B'), b: kd.v('D1') }],
    ...(rakurs === undefined ? {} : { rakurs }),
  });
  const tetr = tetrahedron(4);
  const tetrM = (rakurs?: { azimuth: number; elevation: number }): Model => ({
    alt: 'Правильный тетраэдр ABCD',
    bodies: [tetr],
    ...(rakurs === undefined ? {} : { rakurs }),
  });
  const cil = (rakurs?: { azimuth: number; elevation: number }): Model => ({
    alt: 'Цилиндр',
    bodies: [{ kind: 'cylinder', base: P(0, 0, 0), r: 2, h: 4 }],
    ...(rakurs === undefined ? {} : { rakurs }),
  });
  const p4 = piramida4(4, 5);
  const pirM = (rakurs?: { azimuth: number; elevation: number }): Model => ({
    alt: 'Правильная четырёхугольная пирамида с высотой SO',
    bodies: [p4.body],
    marks: [{ p: p4.O, label: 'O' }],
    lines: [{ a: p4.v('S'), b: p4.O }],
    ...(rakurs === undefined ? {} : { rakurs }),
  });

  /* Лайфхак: правильная треугольная пирамида, сторона 6√3, высота 8. */
  const tri = pyramid(regularPolygon(3, 6, 0, polygonStart(3)), P(0, 0, 8));

  return {
    id: 'chertezh',
    lead: 'Умение: читать чертёж — понимать, что на нём сохранилось от настоящего тела, а что исказила проекция.',
    razdely: [
      {
        id: 'g1-proekciya',
        title: 'Параллельное проецирование: что сохраняется',
        bloki: [
          {
            vid: 'ideya',
            paras: [
              'Стереометрический чертёж — это параллельная проекция: тело как будто отбрасывает тень на лист параллельными лучами. Одни свойства тень сохраняет, другие — нет. Опираться в решении можно только на первые.',
            ],
          },
          {
            vid: 'opredelenie',
            plashka: 'Сохраняется',
            paras: [
              'Параллельные прямые остаются параллельными. Отношение отрезков на одной прямой не меняется: середина ребра на чертеже — середина, точка, делящая ребро в отношении $1 : 2$, делит его так же.',
            ],
          },
          {
            vid: 'opredelenie',
            plashka: 'Не сохраняется',
            paras: [
              'Длины и углы. Квадратная грань куба рисуется параллелограммом, прямой угол может выглядеть тупым, окружность основания цилиндра — эллипсом. Измерять на чертеже нельзя: длины и углы берутся из условия и из свойств тела.',
            ],
          },
          {
            vid: 'risunki',
            items: [
              {
                model: {
                  alt: 'Куб: середина M ребра AA₁ и центр O грани ABCD',
                  bodies: [k4.body],
                  marks: [
                    { p: M, label: 'M' },
                    { p: seredina(k4.v('A'), k4.v('C')), label: 'O' },
                  ],
                  lines: [
                    { a: k4.v('A'), b: k4.v('C') },
                    { a: k4.v('B'), b: k4.v('D') },
                  ],
                },
                podpis: 'Середина ребра и центр грани на чертеже — тоже середина и центр.',
              },
              {
                model: cil(),
                podpis: 'Окружность основания цилиндра рисуется эллипсом.',
              },
            ],
          },
          {
            vid: 'vazhno',
            title: 'Важно: середина на чертеже — середина и в пространстве',
            zadacha: {
              uslovie:
                'Ребро куба $ABCDA_1B_1C_1D_1$ равно $4$, точка $M$ — середина ребра $AA_1$. Найдите квадрат длины отрезка $BM$.',
              reshenie: [
                'Ребро $AA_1$ перпендикулярно грани $ABCD$, поэтому треугольник $ABM$ прямоугольный с прямым углом при $A$; $AM = 2$ — половина ребра.',
              ],
              formuly: ['BM^2 = AB^2 + AM^2 = 16 + 4 = 20'],
              otvet: 'Ответ: $20$.',
              chislo: 20,
              pereschet: () => dlina(k4.v('B'), M) ** 2,
            },
          },
          {
            vid: 'layfhak',
            title: 'Лайфхак: центр грани — точка пересечения её диагоналей',
            zadacha: {
              uslovie:
                'Ребро куба $ABCDA_1B_1C_1D_1$ равно $6$, точка $O$ — центр грани $ABCD$. Найдите квадрат длины отрезка $A_1O$.',
              reshenie: [
                'Строим диагонали грани — они пересекаются в $O$. $AO$ — половина диагонали квадрата, а $AA_1$ перпендикулярно грани.',
              ],
              formuly: ['AO^2 = \\left(\\frac{6\\sqrt{2}}{2}\\right)^2 = 18,\\quad A_1O^2 = 18 + 36 = 54'],
              otvet: 'Ответ: $54$.',
              chislo: 54,
              pereschet: () => dlina(k6.v('A1'), O6) ** 2,
            },
          },
          {
            vid: 'lovushka',
            title: 'угол на чертеже — не угол тела',
            neverno: ['«На чертеже угол $BAD$ тупой — значит, в кубе он тупой, и треугольник $ABD$ не прямоугольный».'],
            verno: [
              'Грань куба — квадрат, и угол $BAD$ прямой при любом ракурсе. Проекция углы искажает, поэтому прямой угол берём из свойств тела, а не «на глаз».',
            ],
            risunki: {
              neverno: {
                alt: 'Куб: угол BAD на чертеже выглядит тупым',
                bodies: [k5.body],
                lines: [{ a: k5.v('B'), b: k5.v('D') }],
                notes: [{ p: P(0.9, 0.9, 0), text: '?' }],
              },
              verno: {
                alt: 'Куб: угол BAD прямой, треугольник ABD прямоугольный',
                bodies: [k5.body],
                lines: [{ a: k5.v('B'), b: k5.v('D') }],
                sections: [{ points: [k5.v('A'), k5.v('B'), k5.v('D')] }],
                angles: [{ at: k5.v('A'), u: dir(k5.v('A'), k5.v('B')), v: dir(k5.v('A'), k5.v('D')) }],
              },
            },
            zadacha: {
              uslovie: 'Ребро куба $ABCDA_1B_1C_1D_1$ равно $5$. Найдите квадрат длины диагонали грани $BD$.',
              reshenie: ['Треугольник $ABD$ прямоугольный: угол $BAD$ — угол квадрата.'],
              formuly: ['BD^2 = 5^2 + 5^2 = 50'],
              otvet: 'Ответ: $50$.',
              chislo: 50,
              pereschet: () => dlina(k5.v('B'), k5.v('D')) ** 2,
            },
          },
        ],
      },
      {
        id: 'g1-vidimost',
        title: 'Видимое и невидимое',
        bloki: [
          {
            vid: 'abzacy',
            paras: [
              'Рёбра, которые закрыты гранями, рисуют пунктиром. Пунктир — такое же настоящее ребро той же длины, просто оно позади. Отрезки внутри тела — высота пирамиды, диагональ куба — тоже невидимы и тоже рисуются пунктиром.',
              'Ребро видно, если видна хотя бы одна из двух граней, которые в нём сходятся.',
            ],
          },
          {
            vid: 'primer',
            primer: {
              id: 'g1-vysota-piramidy',
              title: 'Высота пирамиды — невидимый отрезок',
              uslovie:
                'Все рёбра правильной четырёхугольной пирамиды $SABCD$ равны $6$. Найдите квадрат её высоты $SO$.',
              model: {
                alt: 'Правильная четырёхугольная пирамида SABCD: высота SO внутри, треугольник SOA',
                bodies: [p6.body],
                marks: [{ p: O, label: 'O', shag: 1 }],
                lines: [
                  { a: S, b: O, shag: 1 },
                  { a: O, b: A, shag: 2 },
                ],
                sections: [{ points: [S, O, A], shag: 2 }],
                angles: [{ at: O, u: dir(O, A), v: dir(O, S), shag: 3 }],
                measures: [{ a: S, b: A, text: '6' }],
              },
              shagiChertezha: [
                'Высота $SO$ — внутри пирамиды, поэтому пунктир. $O$ — центр квадрата.',
                'Треугольник $SOA$: $OA$ — половина диагонали основания.',
                'Высота перпендикулярна основанию: угол $SOA$ прямой.',
              ],
              ploskiy: {
                vershiny: ['O', 'A', 'S'],
                kateti: [3 * Math.SQRT2, Math.sqrt(18)],
                podpisi: { a: '3√2', b: '?', c: '6' },
                iskomoe: 'b',
                alt: 'Прямоугольный треугольник SOA: катет OA = 3√2, гипотенуза SA = 6, катет SO — искомый',
              },
              shagi: [
                {
                  title: 'Читаем',
                  paras: [
                    'Пирамида правильная: вершина проецируется в центр квадрата $O$. Высота $SO$ — пунктиром: она внутри тела.',
                  ],
                },
                {
                  title: 'Рисуем',
                  paras: ['Треугольник $SOA$ с прямым углом при $O$: $SA = 6$, $OA$ — половина диагонали квадрата со стороной $6$.'],
                },
                {
                  title: 'Считаем',
                  paras: ['Здесь $OA = 3\\sqrt{2}$ — половина диагонали $AC = 6\\sqrt{2}$.'],
                  formuly: ['OA^2 = \\left(3\\sqrt{2}\\right)^2 = 18', 'SO^2 = SA^2 - OA^2 = 36 - 18 = 18'],
                },
              ],
              otvet: 'Ответ: $18$.',
              chislo: 18,
              pereschet: () => dlina(S, O) ** 2,
            },
          },
          {
            vid: 'vazhno',
            title: 'Важно: на чертеже куба пунктиром — три ребра',
            paras: ['Из двенадцати рёбер куба при обычном ракурсе не видны три — те, что сходятся в дальней нижней вершине.'],
            zadacha: {
              uslovie: 'Сколько рёбер куба видно на обычном чертеже, где три ребра нарисованы пунктиром?',
              reshenie: ['У куба $12$ рёбер, пунктиром — $3$.'],
              otvet: 'Ответ: $9$.',
              chislo: 9,
              pereschet: () => polyhedronEdges(k4.body.faces).length - 3,
            },
          },
          {
            vid: 'lovushka',
            title: 'пунктирное ребро — тоже ребро',
            neverno: ['«Пунктир — вспомогательная линия, при подсчёте рёбер её не учитываю». У пирамиды выходит $6$ рёбер вместо $8$.'],
            verno: [
              'Пунктиром рисуют невидимые рёбра тела — они настоящие. Вспомогательные построения на чертежах сайта выделены другим цветом.',
            ],
            zadacha: {
              uslovie: 'Все рёбра правильной четырёхугольной пирамиды равны $5$. Найдите сумму длин всех её рёбер.',
              reshenie: ['Четыре ребра основания и четыре боковых — всего восемь, считая невидимые.'],
              formuly: ['8\\cdot 5 = 40'],
              otvet: 'Ответ: $40$.',
              chislo: 40,
              pereschet: () => polyhedronEdges(p4.body.faces).length * 5,
            },
          },
        ],
      },
      {
        id: 'g1-rakurs',
        title: 'Неудачно и удачно',
        lead: 'Одно и то же тело можно нарисовать так, что чертёж помогает, — и так, что мешает.',
        bloki: [
          {
            vid: 'abzacy',
            paras: [
              'Удачный ракурс: никакие две вершины не сливаются, рёбра не ложатся друг на друга, нужный треугольник виден целиком. Тела вращения рисуют немного сверху — чтобы основания были эллипсами, а не отрезками.',
            ],
          },
          {
            vid: 'risunki',
            items: [
              { model: kubDiag({ azimuth: 45, elevation: 35.26 }), podpis: 'Смотрим вдоль диагонали: она сжалась в точку.', ocenka: 'neudachno' },
              { model: kubDiag(), podpis: 'Диагональ $BD_1$ видна целиком.', ocenka: 'udachno' },
              { model: tetrM({ azimuth: 30, elevation: 89 }), podpis: 'Сверху тетраэдр похож на плоский треугольник.', ocenka: 'neudachno' },
              { model: tetrM(), podpis: 'Видны все шесть рёбер и вершина.', ocenka: 'udachno' },
              { model: cil({ azimuth: 30, elevation: 2 }), podpis: 'Сбоку основания — отрезки, цилиндр стал прямоугольником.', ocenka: 'neudachno' },
              { model: cil(), podpis: 'Немного сверху: основания — эллипсы.', ocenka: 'udachno' },
              { model: pirM({ azimuth: 45, elevation: 4 }), podpis: 'Почти сбоку: высота слилась с ребром.', ocenka: 'neudachno' },
              { model: pirM(), podpis: 'Высота $SO$ видна отдельно от рёбер.', ocenka: 'udachno' },
            ],
          },
          {
            vid: 'layfhak',
            title: 'Лайфхак: сначала основание и его центр, потом высота',
            paras: [
              'Центр правильного треугольника — точка пересечения медиан; от вершины до центра — $\\frac{2}{3}$ медианы, то есть радиус описанной окружности $R = \\frac{a}{\\sqrt{3}}$.',
            ],
            zadacha: {
              uslovie:
                'Сторона основания правильной треугольной пирамиды равна $6\\sqrt{3}$, высота — $8$. Найдите боковое ребро.',
              reshenie: [
                'Вершина проецируется в центр основания $O$, $OA = R = \\frac{6\\sqrt{3}}{\\sqrt{3}} = 6$. Треугольник $SOA$ прямоугольный: катеты $6$ и $8$ — тройка $6,\\ 8,\\ 10$.',
              ],
              otvet: 'Ответ: $10$.',
              chislo: 10,
              pereschet: () => dlina(vertex(tri, 'S'), vertex(tri, 'A')),
            },
          },
        ],
      },
    ],
  };
}
