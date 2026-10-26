/**
 * №3, теория, глава 8 «Углы между прямыми в призме и кубе»: перенос
 * прямой, правильный шестиугольник, синус и тангенс угла.
 */

import { box, dir, regularPrism, vertex } from '../../solid/figures';
import type { Polyhedron } from '../../solid/model';
import { dlina, ugol, ugolPryamyh } from './schet';
import type { GlavaDannye } from './tipy';

function imena(body: Polyhedron) {
  return (n: string) => vertex(body, n);
}

export function glava8(): GlavaDannye {
  const kub = box(4, 4, 4);
  const k = imena(kub);

  const shest = regularPrism(6, 3, 4);
  const s = imena(shest);
  const shest3 = regularPrism(6, 3, 3);
  const t = imena(shest3);

  const par = box(6, 8, 5);
  const p = imena(par);
  const pr = box(3, 3, 6);
  const q = imena(pr);

  return {
    id: 'ugly',
    lead: 'Угол между прямыми в кубе и призме: перенести прямую так, чтобы прямые пересеклись, и найти угол в получившемся треугольнике.',
    razdely: [
      {
        id: 'g8-perenos',
        title: 'Перенос прямой',
        bloki: [
          {
            vid: 'ideya',
            paras: [
              'Скрещивающиеся прямые не пересекаются, но угол между ними есть: заменяем одну из них параллельной, проходящей через точку другой. Угол между прямыми — от $0^\\circ$ до $90^\\circ$; тупой угол треугольника заменяют смежным.',
            ],
          },
          {
            vid: 'primer',
            primer: {
              id: 'g8-kub',
              title: 'Две диагонали граней куба',
              uslovie: 'Найдите угол между прямыми $AB_1$ и $BC_1$ в кубе $ABCDA_1B_1C_1D_1$. Ответ дайте в градусах.',
              model: {
                alt: 'Куб: диагонали граней AB₁ и BC₁; BC₁ перенесена в AD₁, треугольник AB₁D₁',
                bodies: [kub],
                lines: [
                  { a: k('A'), b: k('B1') },
                  { a: k('B'), b: k('C1') },
                  { a: k('A'), b: k('D1'), shag: 1 },
                  { a: k('B1'), b: k('D1'), shag: 2 },
                ],
                sections: [{ points: [k('A'), k('B1'), k('D1')], shag: 2 }],
              },
              shagiChertezha: [
                'Переносим $BC_1$ в $AD_1$: $ABC_1D_1$ — прямоугольник, его стороны $BC_1$ и $AD_1$ параллельны.',
                'Треугольник $AB_1D_1$: все стороны — диагонали граней.',
              ],
              shagi: [
                {
                  title: 'Переносим',
                  paras: ['$BC_1 \\parallel AD_1$, поэтому искомый угол — угол $B_1AD_1$.'],
                },
                {
                  title: 'Узнаём треугольник',
                  paras: ['$AB_1$, $AD_1$, $B_1D_1$ — диагонали равных квадратов: треугольник правильный.'],
                  formuly: ['\\angle B_1AD_1 = 60^\\circ'],
                },
              ],
              otvet: 'Ответ: $60$.',
              chislo: 60,
              pereschet: () => ugolPryamyh(k('A'), k('B1'), k('B'), k('C1')),
            },
          },
          {
            vid: 'layfhak',
            title: 'Лайфхак: три диагонали граней из одной вершины — правильный треугольник',
            zadacha: {
              uslovie: 'Найдите угол между прямыми $A_1B$ и $A_1D$ в кубе $ABCDA_1B_1C_1D_1$. Ответ дайте в градусах.',
              reshenie: ['Прямые уже пересекаются в $A_1$. $A_1B$, $A_1D$ и $BD$ — диагонали граней: треугольник $A_1BD$ правильный.'],
              formuly: ['\\angle BA_1D = 60^\\circ'],
              otvet: 'Ответ: $60$.',
              chislo: 60,
              pereschet: () => ugolPryamyh(k('A1'), k('B'), k('A1'), k('D')),
            },
          },
          {
            vid: 'lovushka',
            title: 'Угол между прямыми не бывает тупым',
            neverno: ['«$C_1D_1 \\parallel CD$, а угол шестиугольника между сторонами — $120^\\circ$». Это угол между отрезками, а не между прямыми.'],
            verno: ['Угол между прямыми — острый из двух смежных: $180^\\circ - 120^\\circ = 60^\\circ$.'],
            zadacha: {
              uslovie:
                'В правильной шестиугольной призме $ABCDEFA_1B_1C_1D_1E_1F_1$ найдите угол между прямыми $AB$ и $C_1D_1$. Ответ дайте в градусах.',
              reshenie: [
                'Переносим $C_1D_1$ в $CD$. Продолжения $AB$ и $DC$ пересекаются, образуя с $BC$ правильный треугольник.',
              ],
              formuly: ['180^\\circ - 120^\\circ = 60^\\circ'],
              otvet: 'Ответ: $60$.',
              chislo: 60,
              pereschet: () => ugolPryamyh(s('A'), s('B'), s('C1'), s('D1')),
            },
          },
        ],
      },
      {
        id: 'g8-shestiugolnik',
        title: 'Правильный шестиугольник',
        bloki: [
          {
            vid: 'ideya',
            paras: [
              'Правильный шестиугольник со стороной $a$ — шесть правильных треугольников вокруг центра. Отсюда всё нужное: большая диагональ $AD = 2a$ параллельна сторонам $BC$ и $FE$, малая диагональ $AE = a\\sqrt{3}$ перпендикулярна стороне $AB$.',
            ],
          },
          {
            vid: 'formuly',
            title: 'Правильный шестиугольник: диагонали',
            stroki: [
              { podpis: 'Большая диагональ', tex: 'AD = 2a' },
              { podpis: 'Малая диагональ', tex: 'AC = AE = a\\sqrt{3}' },
              { podpis: 'Угол между большой и малой диагоналями из одной вершины', tex: '\\angle DAE = 30^\\circ' },
            ],
          },
          {
            vid: 'primer',
            primer: {
              id: 'g8-bc-ae',
              title: 'Сторона и малая диагональ',
              uslovie:
                'В правильной шестиугольной призме $ABCDEFA_1B_1C_1D_1E_1F_1$ найдите угол между прямыми $BC$ и $A_1E_1$. Ответ дайте в градусах.',
              model: {
                alt: 'Правильная шестиугольная призма: BC перенесена в AD, A₁E₁ — в AE, угол DAE',
                bodies: [shest],
                lines: [
                  { a: s('A1'), b: s('E1') },
                  { a: s('A'), b: s('E'), shag: 1 },
                  { a: s('A'), b: s('D'), shag: 1 },
                ],
                sections: [{ points: [s('A'), s('D'), s('E')], shag: 2 }],
              },
              shagiChertezha: [
                'Переносим обе прямые в нижнее основание: $A_1E_1 \\to AE$, $BC \\to AD$.',
                'Треугольник $ADE$: угол при $E$ прямой, $AD = 2\\,DE$.',
              ],
              shagi: [
                {
                  title: 'Переносим',
                  paras: ['$A_1E_1 \\parallel AE$, $BC \\parallel AD$: искомый угол — $\\angle DAE$.'],
                },
                {
                  title: 'Считаем в треугольнике',
                  paras: ['В треугольнике $ADE$ угол при $E$ прямой, катет $DE = a$ — половина гипотенузы $AD = 2a$.'],
                  formuly: ['\\sin\\angle DAE = \\frac{DE}{AD} = \\frac{1}{2},\\quad \\angle DAE = 30^\\circ'],
                },
              ],
              otvet: 'Ответ: $30$.',
              chislo: 30,
              pereschet: () => ugolPryamyh(s('B'), s('C'), s('A1'), s('E1')),
            },
          },
          {
            vid: 'vazhno',
            title: 'Важно: большая диагональ — две стороны',
            zadacha: {
              uslovie:
                'Все рёбра правильной шестиугольной призмы $ABCDEFA_1B_1C_1D_1E_1F_1$ равны $3$. Найдите квадрат длины отрезка $AD_1$.',
              reshenie: ['$AD = 2\\cdot 3 = 6$, ребро $DD_1$ перпендикулярно основанию.'],
              formuly: ['AD_1^2 = 6^2 + 3^2 = 45'],
              otvet: 'Ответ: $45$.',
              chislo: 45,
              pereschet: () => dlina(t('A'), t('D1')) ** 2,
            },
          },
        ],
      },
      {
        id: 'g8-tangens',
        title: 'Синус и тангенс угла',
        bloki: [
          {
            vid: 'ideya',
            paras: [
              'Когда угол не табличный, его спрашивают через синус, косинус или тангенс. Угол между прямой и плоскостью — угол между прямой и её проекцией: опускаем перпендикуляр и получаем прямоугольный треугольник.',
            ],
          },
          {
            vid: 'primer',
            primer: {
              id: 'g8-tg-diagonali',
              title: 'Тангенс угла между диагональю и основанием',
              uslovie:
                'В прямоугольном параллелепипеде $ABCDA_1B_1C_1D_1$ $AB = 6$, $AD = 8$, $AA_1 = 5$. Найдите тангенс угла между прямой $AC_1$ и плоскостью $ABC$.',
              model: {
                alt: 'Параллелепипед: диагональ AC₁, её проекция AC на основание и ребро CC₁',
                bodies: [par],
                lines: [
                  { a: p('A'), b: p('C1') },
                  { a: p('A'), b: p('C'), shag: 1 },
                ],
                sections: [{ points: [p('A'), p('C'), p('C1')], shag: 2 }],
                angles: [{ at: p('C'), u: dir(p('C'), p('A')), v: dir(p('C'), p('C1')), shag: 2 }],
                measures: [
                  { a: p('A'), b: p('B'), text: '6' },
                  { a: p('B'), b: p('C'), text: '8' },
                  { a: p('C'), b: p('C1'), text: '5' },
                ],
              },
              shagiChertezha: [
                'Проекция $AC_1$ на основание — $AC$: $C_1$ проецируется в $C$.',
                'Треугольник $ACC_1$, прямой угол при $C$; искомый — угол при $A$.',
              ],
              ploskiy: {
                vershiny: ['C', 'A', 'C1'],
                kateti: [10, 5],
                podpisi: { a: '10', b: '5' },
                iskomoe: 'ugolB',
                alt: 'Прямоугольный треугольник ACC₁: катеты AC = 10 и CC₁ = 5, искомый угол при A',
              },
              shagi: [
                {
                  title: 'Проекция',
                  paras: ['$CC_1$ перпендикулярно основанию, поэтому угол между $AC_1$ и плоскостью — угол $C_1AC$.'],
                },
                {
                  title: 'Катеты',
                  paras: ['Тройка $6,\\ 8,\\ 10$.'],
                  formuly: ['AC = 10,\\quad CC_1 = 5'],
                },
                {
                  title: 'Тангенс',
                  paras: ['Противолежащий катет делим на прилежащий.'],
                  formuly: ['\\operatorname{tg}\\angle C_1AC = \\frac{5}{10} = 0{,}5'],
                },
              ],
              otvet: 'Ответ: $0{,}5$.',
              chislo: 0.5,
              pereschet: () => Math.tan((ugol(p('C1'), p('A'), p('C')) * Math.PI) / 180),
            },
          },
          {
            vid: 'lovushka',
            title: 'Тангенс — противолежащий к прилежащему',
            neverno: ['«$\\operatorname{tg} = \\frac{AB}{BB_1} = \\frac{3}{6} = 0{,}5$». Перепутали катеты: $AB$ прилежит к углу при $A$.'],
            verno: ['Противолежащий углу при $A$ катет — $BB_1$, прилежащий — $AB$.'],
            zadacha: {
              uslovie:
                'В правильной четырёхугольной призме $ABCDA_1B_1C_1D_1$ $AB = 3$, $BB_1 = 6$. Найдите тангенс угла между прямой $AB_1$ и плоскостью $ABC$.',
              reshenie: ['Проекция $AB_1$ на основание — $AB$; треугольник $ABB_1$ прямоугольный с прямым углом при $B$.'],
              formuly: ['\\operatorname{tg}\\angle B_1AB = \\frac{BB_1}{AB} = \\frac{6}{3} = 2'],
              otvet: 'Ответ: $2$.',
              chislo: 2,
              pereschet: () => Math.tan((ugol(q('B1'), q('A'), q('B')) * Math.PI) / 180),
            },
          },
        ],
      },
    ],
  };
}
