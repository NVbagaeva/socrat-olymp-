/**
 * Карточки по теории задания №3 «Стереометрия».
 *
 * `source` — якорь раздела главы теории №3 (lib/stereo/glavy:
 * «g3-kub», «g6-k» …), туда ведёт «Повторить теорию». Радиусы
 * окружностей квадрата и правильного треугольника в главах №3 не
 * выписаны — эта карточка помечена «добавлено».
 *
 * Чертежи — модели движка стереометрии (lib/solid). Примеры с числами
 * свои, не задачи ЕГЭ и не примеры из глав; ответы и формулы
 * проверяет scripts/verify_cards.
 */

import {
  box,
  polygonStart,
  pyramid,
  regularPolygon,
  regularPrism,
  regularPyramid,
  vertex,
} from '@/lib/solid/figures';
import type { Model } from '@/lib/solid/model';
import {
  dlina,
  obemMnogogrannika,
  P,
  ploshchadMnogougolnika,
  ploshchadPoverhnosti,
  seredina,
} from '@/lib/stereo/glavy/schet';
import type { Kartochka, Koloda, ProverkaFormuly } from '@/lib/kartochki/tipy';
import { DOBAVLENO } from '@/lib/kartochki/tipy';

const B = 'база' as const;
const E = 'важно для ЕГЭ' as const;

/* ── Чертежи ── */

function parallelepiped(): Model {
  const b = box(3, 4, 5);
  return {
    alt: 'Прямоугольный параллелепипед с рёбрами a, b, c и диагональю d',
    view: 'cabinet',
    bodies: [b],
    lines: [{ a: vertex(b, 'A'), b: vertex(b, 'C1'), label: 'd' }],
    sections: [{ points: [vertex(b, 'A'), vertex(b, 'C'), vertex(b, 'C1')] }],
  };
}

function prizma3(): Model {
  return {
    alt: 'Правильная треугольная призма: основания — равные правильные треугольники, боковые рёбра перпендикулярны основаниям',
    bodies: [regularPrism(3, 3, 5)],
  };
}

/** Правильная четырёхугольная пирамида: высота SO, апофема SM, отрезок OM. */
function piramida4(): Model {
  const body = pyramid(regularPolygon(4, 6 / Math.SQRT2, 0, polygonStart(4)), P(0, 0, 4));
  const O = P(0, 0, 0);
  const M = seredina(vertex(body, 'A'), vertex(body, 'B'));
  const S = vertex(body, 'S');
  return {
    alt: 'Правильная пирамида SABCD: высота SO, апофема SM, отрезок OM — радиус вписанной окружности основания',
    rakurs: { azimuth: 28, elevation: 14 },
    bodies: [body],
    marks: [
      { p: O, label: 'O' },
      { p: M, label: 'M' },
    ],
    lines: [
      { a: S, b: O, label: 'h' },
      { a: O, b: M, label: 'r' },
      { a: S, b: M, label: 'l' },
    ],
    sections: [{ points: [S, O, M] }],
  };
}

function cilindr(): Model {
  return {
    alt: 'Цилиндр: радиус основания r и высота h',
    bodies: [{ kind: 'cylinder', base: P(0, 0, 0), r: 3, h: 5 }],
    lines: [
      { a: P(0, 0, 0), b: P(3, 0, 0), label: 'r' },
      { a: P(0, 0, 0), b: P(0, 0, 5), label: 'h' },
    ],
  };
}

function konus(): Model {
  return {
    alt: 'Конус: радиус основания r, высота h и образующая l',
    bodies: [{ kind: 'cone', base: P(0, 0, 0), r: 3, h: 4 }],
    lines: [
      { a: P(0, 0, 0), b: P(3, 0, 0), label: 'r' },
      { a: P(0, 0, 0), b: P(0, 0, 4), label: 'h' },
      { a: P(0, 0, 4), b: P(3, 0, 0), label: 'l' },
    ],
    sections: [{ points: [P(0, 0, 4), P(0, 0, 0), P(3, 0, 0)] }],
  };
}

function shar(): Model {
  return {
    alt: 'Шар с центром O и радиусом R',
    bodies: [{ kind: 'sphere', center: P(0, 0, 0), r: 3, equator: true }],
    marks: [{ p: P(0, 0, 0), label: 'O' }],
    lines: [{ a: P(0, 0, 0), b: P(3, 0, 0), label: 'R' }],
  };
}

function sharVKube(): Model {
  const k = box(6, 6, 6);
  const O = P(3, 3, 3);
  return {
    alt: 'Шар, вписанный в куб: касается всех граней, радиус — половина ребра',
    bodies: [k, { kind: 'sphere', center: O, r: 3 }],
    marks: [{ p: O, label: 'O' }],
    lines: [{ a: O, b: P(3, 3, 0), label: 'R' }],
  };
}

function cilindrOkoloShara(): Model {
  return {
    alt: 'Цилиндр, описанный около шара: радиус основания равен радиусу шара, высота — диаметру',
    bodies: [
      { kind: 'cylinder', base: P(0, 0, 0), r: 2, h: 4, glass: true },
      { kind: 'sphere', center: P(0, 0, 2), r: 2 },
    ],
  };
}

const kartochki: Kartochka[] = [
  /* ── Куб и параллелепипед ── */
  {
    id: '3-diagonal',
    task: 3,
    topic: 'kub',
    type: 'formula',
    front: 'Диагональ прямоугольного параллелепипеда с рёбрами $a$, $b$, $c$?',
    back: '$d^2 = a^2 + b^2 + c^2$',
    pochemu:
      'Дважды теорема Пифагора: сначала диагональ основания, потом треугольник с боковым ребром.',
    figure: { dvizhok: 'solid', model: parallelepiped },
    level: E,
    source: 'g3-kub',
  },
  {
    id: '3-diagonal-kuba',
    task: 3,
    topic: 'kub',
    type: 'formula',
    front: 'Диагональ куба и диагональ его грани через ребро $a$?',
    back: 'Диагональ куба $a\\sqrt3$, диагональ грани $a\\sqrt2$.',
    level: E,
    source: 'g3-kub',
  },
  {
    id: '3-parallelepiped',
    task: 3,
    topic: 'kub',
    type: 'formula',
    front: 'Объём и площадь поверхности прямоугольного параллелепипеда с рёбрами $a$, $b$, $c$?',
    back: '$V = abc$, $S = 2(ab + bc + ac)$',
    level: B,
    source: 'g4-formuly',
  },
  {
    id: '3-diagonal-v',
    task: 3,
    topic: 'kub',
    type: 'vychislenie',
    front: 'Рёбра прямоугольного параллелепипеда равны $2$, $3$ и $6$. Найдите его диагональ.',
    back: '$d = \\sqrt{4 + 9 + 36} = 7$',
    otvet: '7',
    proverka: () => {
      const b = box(2, 3, 6);
      return dlina(vertex(b, 'A'), vertex(b, 'C1'));
    },
    level: E,
    source: 'g3-kub',
  },
  {
    id: '3-kub-v',
    task: 3,
    topic: 'kub',
    type: 'vychislenie',
    front: 'Диагональ куба равна $4\\sqrt3$. Найдите объём куба.',
    back: 'Ребро $a = 4$, объём $4^3 = 64$.',
    otvet: '64',
    proverka: () => {
      /* Ребро подбираем по диагонали, объём — счётом по граням. */
      const a = (4 * Math.sqrt(3)) / dlina(vertex(box(1, 1, 1), 'A'), vertex(box(1, 1, 1), 'C1'));
      return obemMnogogrannika(box(a, a, a));
    },
    level: E,
    source: 'g3-kub',
  },
  {
    id: '3-poverhnost-v',
    task: 3,
    topic: 'kub',
    type: 'vychislenie',
    front:
      'Рёбра прямоугольного параллелепипеда равны $2$, $3$ и $4$. Найдите площадь его поверхности.',
    back: '$S = 2(6 + 12 + 8) = 52$',
    otvet: '52',
    proverka: () => ploshchadPoverhnosti(box(2, 3, 4)),
    level: B,
    source: 'g4-formuly',
  },
  {
    id: '3-diagonal-grani-l',
    task: 3,
    topic: 'kub',
    type: 'verno',
    front: 'Диагональ грани куба с ребром $a$ равна $a\\sqrt3$.',
    verno: false,
    back: 'Неверно: диагональ грани $a\\sqrt2$, а $a\\sqrt3$ — диагональ самого куба.',
    level: E,
    source: 'g3-kub',
  },

  /* ── Призма ── */
  {
    id: '3-prizma-v-formula',
    task: 3,
    topic: 'prizma',
    type: 'formula',
    front: 'Объём призмы?',
    back: '$V = S_{\\text{осн}} \\cdot h$',
    figure: { dvizhok: 'solid', model: prizma3 },
    level: B,
    source: 'g4-formuly',
  },
  {
    id: '3-prizma-bok',
    task: 3,
    topic: 'prizma',
    type: 'formula',
    front: 'Площадь боковой поверхности прямой призмы?',
    back: '$S_{\\text{бок}} = P \\cdot h$, где $P$ — периметр основания.',
    pochemu: 'Боковые грани — прямоугольники с общей высотой $h$.',
    level: E,
    source: 'g3-prizma',
  },
  {
    id: '3-pravilnaya-prizma',
    task: 3,
    topic: 'prizma',
    type: 'svoystvo',
    front: 'Какая призма называется правильной?',
    back: 'Прямая призма, в основании которой правильный многоугольник.',
    level: B,
    source: 'g3-prizma',
  },
  {
    id: '3-prizma-bok-v',
    task: 3,
    topic: 'prizma',
    type: 'vychislenie',
    front:
      'Сторона основания правильной треугольной призмы равна $4$, боковое ребро — $7$. Найдите площадь боковой поверхности.',
    back: '$3 \\cdot 4 \\cdot 7 = 84$',
    otvet: '84',
    proverka: () => {
      const p = regularPrism(3, 4 / Math.sqrt(3), 7);
      const osn = (z: number) => p.vertices.filter((v) => Math.abs(v[2] - z) < 1e-9);
      return (
        ploshchadPoverhnosti(p) - ploshchadMnogougolnika(osn(0)) - ploshchadMnogougolnika(osn(7))
      );
    },
    level: E,
    source: 'g3-prizma',
  },
  {
    id: '3-osnovaniya-l',
    task: 3,
    topic: 'prizma',
    type: 'verno',
    front: 'Площадь боковой поверхности призмы включает площади её оснований.',
    verno: false,
    back: 'Неверно: боковая поверхность — только боковые грани. С основаниями — это полная поверхность.',
    level: B,
    source: 'g3-prizma',
  },

  /* ── Пирамида ── */
  {
    id: '3-piramida-v-formula',
    task: 3,
    topic: 'piramida',
    type: 'formula',
    front: 'Объём пирамиды?',
    back: '$V = \\dfrac13\\, S_{\\text{осн}} \\cdot h$',
    pochemu: 'Пирамида — ровно треть призмы с тем же основанием и той же высотой.',
    level: B,
    source: 'g4-formuly',
  },
  {
    id: '3-proekciya-vershiny',
    task: 3,
    topic: 'piramida',
    type: 'svoystvo',
    front: 'Куда проецируется вершина правильной пирамиды?',
    back: 'В **центр основания** — центр его вписанной и описанной окружностей.',
    level: E,
    source: 'g3-piramida',
  },
  {
    id: '3-apofema',
    task: 3,
    topic: 'piramida',
    type: 'svoystvo',
    front: 'Что такое апофема правильной пирамиды?',
    back: 'Высота боковой грани, проведённая из вершины пирамиды.',
    level: E,
    source: 'g3-piramida',
  },
  {
    id: '3-treugolniki-piramidy',
    task: 3,
    topic: 'piramida',
    type: 'chertezh',
    front:
      'Правильная пирамида: как связаны высота $h$, апофема $l$ и радиус $r$ вписанной окружности основания? А боковое ребро $b$?',
    back: '$l^2 = h^2 + r^2$, $b^2 = h^2 + R^2$, где $R$ — радиус описанной окружности основания.',
    pochemu: 'Оба треугольника прямоугольные с прямым углом при центре основания $O$.',
    figure: { dvizhok: 'solid', model: piramida4 },
    level: E,
    source: 'g3-piramida',
  },
  {
    id: '3-piramida-bok',
    task: 3,
    topic: 'piramida',
    type: 'formula',
    front: 'Площадь боковой поверхности правильной пирамиды?',
    back: '$S_{\\text{бок}} = \\dfrac12\\, P \\cdot l$, где $P$ — периметр основания, $l$ — апофема.',
    level: E,
    source: 'g3-piramida',
  },
  {
    id: '3-apofema-v',
    task: 3,
    topic: 'piramida',
    type: 'vychislenie',
    front:
      'Сторона основания правильной четырёхугольной пирамиды равна $10$, высота — $12$. Найдите апофему.',
    back: '$r = 5$, $l = \\sqrt{12^2 + 5^2} = 13$',
    otvet: '13',
    proverka: () => {
      const body = pyramid(regularPolygon(4, 10 / Math.SQRT2, 0, polygonStart(4)), P(0, 0, 12));
      return dlina(vertex(body, 'S'), seredina(vertex(body, 'A'), vertex(body, 'B')));
    },
    level: E,
    source: 'g3-piramida',
  },
  {
    id: '3-piramida-v',
    task: 3,
    topic: 'piramida',
    type: 'vychislenie',
    front: 'Основание пирамиды — квадрат со стороной $3$, высота пирамиды — $5$. Найдите объём.',
    back: '$\\dfrac13 \\cdot 9 \\cdot 5 = 15$',
    otvet: '15',
    proverka: () =>
      obemMnogogrannika(
        pyramid(
          [
            [0, 0, 0],
            [3, 0, 0],
            [3, 3, 0],
            [0, 3, 0],
          ],
          P(1, 2, 5),
        ),
      ),
    level: B,
    source: 'g4-formuly',
  },
  {
    id: '3-vysota-apofema-l',
    task: 3,
    topic: 'piramida',
    type: 'verno',
    front: 'Высота правильной пирамиды и её апофема — один и тот же отрезок.',
    verno: false,
    back: 'Неверно: высота опущена в центр основания, апофема — в середину стороны основания. Апофема — гипотенуза, высота — катет.',
    level: E,
    source: 'g3-piramida',
  },
  {
    id: '3-radiusy-osnovaniya',
    task: 3,
    topic: 'piramida',
    type: 'formula',
    front:
      'Радиусы описанной и вписанной окружностей квадрата и правильного треугольника со стороной $a$?',
    back: 'Квадрат: $R = \\dfrac{a\\sqrt2}{2}$, $r = \\dfrac{a}{2}$. Треугольник: $R = \\dfrac{a\\sqrt3}{3}$, $r = \\dfrac{a\\sqrt3}{6}$.',
    pochemu: 'Это катеты рабочих треугольников правильной пирамиды.',
    level: E,
    source: DOBAVLENO,
  },
  {
    id: '3-shestiugolnik',
    task: 3,
    topic: 'piramida',
    type: 'svoystvo',
    front:
      'Правильный шестиугольник со стороной $a$: на что он делится и чему равна большая диагональ?',
    back: 'На шесть правильных треугольников со стороной $a$; большая диагональ $2a$, радиус описанной окружности $a$.',
    level: E,
    source: 'g8-shestiugolnik',
  },

  /* ── Цилиндр, конус, шар ── */
  {
    id: '3-cilindr-v',
    task: 3,
    topic: 'vrashcheniya',
    type: 'formula',
    front: 'Объём цилиндра?',
    back: '$V = \\pi r^2 h$',
    figure: { dvizhok: 'solid', model: cilindr },
    level: B,
    source: 'g10-vrashcheniya',
  },
  {
    id: '3-cilindr-s',
    task: 3,
    topic: 'vrashcheniya',
    type: 'formula',
    front: 'Боковая и полная поверхность цилиндра?',
    back: '$S_{\\text{бок}} = 2\\pi r h$, $S = 2\\pi r(r + h)$',
    level: E,
    source: 'g5-poverhnost',
  },
  {
    id: '3-konus-v',
    task: 3,
    topic: 'vrashcheniya',
    type: 'formula',
    front: 'Объём конуса?',
    back: '$V = \\dfrac13\\, \\pi r^2 h$',
    figure: { dvizhok: 'solid', model: konus },
    level: B,
    source: 'g10-vrashcheniya',
  },
  {
    id: '3-konus-s',
    task: 3,
    topic: 'vrashcheniya',
    type: 'formula',
    front: 'Образующая и боковая поверхность конуса?',
    back: '$l^2 = r^2 + h^2$, $S_{\\text{бок}} = \\pi r l$',
    level: E,
    source: 'g5-poverhnost',
  },
  {
    id: '3-shar',
    task: 3,
    topic: 'vrashcheniya',
    type: 'formula',
    front: 'Объём шара и площадь сферы радиуса $R$?',
    back: '$V = \\dfrac43\\, \\pi R^3$, $S = 4\\pi R^2$',
    figure: { dvizhok: 'solid', model: shar },
    level: E,
    source: 'g5-pi',
  },
  {
    id: '3-osevoe',
    task: 3,
    topic: 'vrashcheniya',
    type: 'svoystvo',
    front: 'Что представляют собой осевые сечения цилиндра и конуса?',
    back: 'У цилиндра — прямоугольник $2r \\times h$, у конуса — равнобедренный треугольник с основанием $2r$ и высотой $h$.',
    level: E,
    source: 'g5-elementy',
  },
  {
    id: '3-razvertka',
    task: 3,
    topic: 'vrashcheniya',
    type: 'svoystvo',
    front: 'Чем является развёртка боковой поверхности цилиндра?',
    back: 'Прямоугольником со сторонами $2\\pi r$ и $h$.',
    level: B,
    source: 'g5-poverhnost',
  },
  {
    id: '3-obrazuyushchaya-l',
    task: 3,
    topic: 'vrashcheniya',
    type: 'verno',
    front: 'Образующая конуса равна его высоте.',
    verno: false,
    back: 'Неверно: образующая — гипотенуза треугольника с катетами $h$ и $r$, она длиннее высоты.',
    level: E,
    source: 'g5-elementy',
  },
  {
    id: '3-obrazuyushchaya-v',
    task: 3,
    topic: 'vrashcheniya',
    type: 'vychislenie',
    front: 'Радиус основания конуса равен $9$, высота — $12$. Найдите образующую.',
    back: '$l = \\sqrt{81 + 144} = 15$',
    otvet: '15',
    proverka: () => dlina(P(0, 0, 12), P(9, 0, 0)),
    level: B,
    source: 'g5-elementy',
  },
  {
    id: '3-cilindr-pi-v',
    task: 3,
    topic: 'vrashcheniya',
    type: 'vychislenie',
    front:
      'Радиус основания цилиндра равен $3$, высота — $5$. Найдите объём цилиндра, делённый на $\\pi$.',
    back: '$\\dfrac{V}{\\pi} = 9 \\cdot 5 = 45$',
    otvet: '45',
    proverka: () => Math.round((obemMnogogrannika(regularPrism(6000, 3, 5)) / Math.PI) * 1e4) / 1e4,
    level: B,
    source: 'g10-vrashcheniya',
  },
  {
    id: '3-shar-pi-v',
    task: 3,
    topic: 'vrashcheniya',
    type: 'vychislenie',
    front: 'Радиус шара равен $6$. Найдите объём шара, делённый на $\\pi$.',
    back: '$\\dfrac{V}{\\pi} = \\dfrac43 \\cdot 216 = 288$',
    otvet: '288',
    proverka: () => Math.round(obemSharaChislenno(6) / Math.PI),
    level: E,
    source: 'g5-pi',
  },
  {
    id: '3-konus-pi-v',
    task: 3,
    topic: 'vrashcheniya',
    type: 'vychislenie',
    front:
      'Радиус основания конуса равен $3$, высота — $4$. Найдите объём конуса, делённый на $\\pi$.',
    back: '$\\dfrac{V}{\\pi} = \\dfrac13 \\cdot 9 \\cdot 4 = 12$',
    otvet: '12',
    proverka: () =>
      Math.round((obemMnogogrannika(regularPyramid(6000, 3, 4)) / Math.PI) * 1e4) / 1e4,
    level: B,
    source: 'g10-vrashcheniya',
  },

  /* ── Часть тела и ответ в π ── */
  {
    id: '3-sektor',
    task: 3,
    topic: 'sektor',
    type: 'svoystvo',
    front: 'Какую долю объёма цилиндра составляет его часть с центральным углом $\\alpha$?',
    back: '$\\dfrac{\\alpha}{360^\\circ}$ объёма всего цилиндра — так же и у конуса.',
    pochemu: 'Полный угол — $360^\\circ$, а не $180^\\circ$.',
    level: E,
    source: 'g5-sektor',
  },
  {
    id: '3-sektor-v',
    task: 3,
    topic: 'sektor',
    type: 'vychislenie',
    front: 'Объём цилиндра равен $48$. Найдите объём его части с центральным углом $90^\\circ$.',
    back: '$48 \\cdot \\dfrac{90^\\circ}{360^\\circ} = 12$',
    otvet: '12',
    proverka: () => (48 * 90) / 360,
    level: E,
    source: 'g5-sektor',
  },
  {
    id: '3-blank-pi',
    task: 3,
    topic: 'sektor',
    type: 'svoystvo',
    front: 'Получилось $V = 12\\pi$, а просят найти $\\dfrac{V}{\\pi}$. Что записать в бланк?',
    back: '$12$ — коэффициент при $\\pi$. Число $\\pi$ не подставляют.',
    level: E,
    source: 'g5-pi',
  },

  /* ── Подобие ── */
  {
    id: '3-podobie',
    task: 3,
    topic: 'podobie',
    type: 'svoystvo',
    front:
      'Все линейные размеры тела увеличили в $k$ раз. Как изменятся площадь поверхности и объём?',
    back: 'Площадь — в $k^2$ раз, объём — в $k^3$ раз.',
    pochemu: 'У площади два измерения, у объёма три.',
    level: E,
    source: 'g6-k',
  },
  {
    id: '3-podobie-v',
    task: 3,
    topic: 'podobie',
    type: 'vychislenie',
    front: 'Ребро куба увеличили в $2$ раза. Во сколько раз увеличилась площадь его поверхности?',
    back: '$2^2 = 4$',
    otvet: '4',
    proverka: () => ploshchadPoverhnosti(box(2, 2, 2)) / ploshchadPoverhnosti(box(1, 1, 1)),
    level: E,
    source: 'g6-k',
  },
  {
    id: '3-radius-v',
    task: 3,
    topic: 'podobie',
    type: 'vychislenie',
    front:
      'Радиус основания цилиндра увеличили в $2$ раза, высоту не меняли. Во сколько раз увеличился объём?',
    back: '$V = \\pi r^2 h$: радиус в квадрате, $2^2 = 4$.',
    otvet: '4',
    proverka: () =>
      obemMnogogrannika(regularPrism(400, 2, 3)) / obemMnogogrannika(regularPrism(400, 1, 3)),
    level: E,
    source: 'g6-k',
  },
  {
    id: '3-vysota-l',
    task: 3,
    topic: 'podobie',
    type: 'verno',
    front: 'Высоту цилиндра увеличили в $2$ раза — объём увеличился в $8$ раз.',
    verno: false,
    back: 'Неверно: объём увеличился в $2$ раза. В $k^3$ раз объём растёт, только если в $k$ раз меняются **все** размеры.',
    level: E,
    source: 'g6-k',
  },
  {
    id: '3-zhidkost-konus',
    task: 3,
    topic: 'podobie',
    type: 'svoystvo',
    front:
      'Сосуд-конус стоит вершиной вниз, жидкость налита до половины его высоты. Какую часть объёма сосуда она занимает?',
    back: '$\\dfrac18$: жидкость — подобный конус с коэффициентом $\\dfrac12$, объём в $2^3 = 8$ раз меньше.',
    pochemu: 'Доля высоты — не доля объёма.',
    level: E,
    source: 'g6-zhidkost',
  },
  {
    id: '3-zhidkost-v',
    task: 3,
    topic: 'podobie',
    type: 'vychislenie',
    front:
      'Вода в цилиндрическом сосуде стоит на высоте $16$. Её перелили в цилиндр с вдвое большим радиусом основания. На какой высоте будет уровень воды?',
    back: 'Площадь дна больше в $4$ раза, уровень ниже в $4$ раза: $16 : 4 = 4$.',
    otvet: '4',
    proverka: () => {
      const V = obemMnogogrannika(regularPrism(400, 1, 16));
      return V / obemMnogogrannika(regularPrism(400, 2, 1));
    },
    level: E,
    source: 'g6-zhidkost',
  },
  {
    id: '3-otsechenie-v',
    task: 3,
    topic: 'podobie',
    type: 'vychislenie',
    front:
      'Плоскость, параллельная основанию пирамиды, делит её высоту пополам. Объём пирамиды равен $40$. Найдите объём отсечённой верхней пирамиды.',
    back: '$k = \\dfrac12$, объём $40 \\cdot \\dfrac18 = 5$',
    otvet: '5',
    proverka: () => {
      const vsya = pyramid(regularPolygon(4, 2, 0, 0), P(0, 0, 2));
      const verh = pyramid(regularPolygon(4, 1, 1, 0), P(0, 0, 2));
      return (40 * obemMnogogrannika(verh)) / obemMnogogrannika(vsya);
    },
    level: E,
    source: 'g6-otsechenie',
  },

  /* ── Составные тела и части ── */
  {
    id: '3-sostavnye',
    task: 3,
    topic: 'sostavnye',
    type: 'svoystvo',
    front: 'Как найти объём составного многогранника из прямоугольных блоков?',
    back: 'Разбить на параллелепипеды и сложить их объёмы — или достроить до большого параллелепипеда и вычесть лишнее.',
    level: B,
    source: 'g4-sostavnye',
  },
  {
    id: '3-proekcii',
    task: 3,
    topic: 'sostavnye',
    type: 'svoystvo',
    front:
      'Площадь поверхности ступенчатого многогранника считают через проекции. Когда так нельзя?',
    back: 'Когда есть выемки или внутренние грани: проекции их не видят. Без них $S = 2(S_1 + S_2 + S_3)$ — удвоенная сумма трёх проекций.',
    level: E,
    source: 'g4-proekcii',
  },
  {
    id: '3-diagonalnaya-ploskost',
    task: 3,
    topic: 'sostavnye',
    type: 'svoystvo',
    front: 'Как диагональная плоскость $AA_1C_1C$ делит объём прямоугольного параллелепипеда?',
    back: '**Пополам**: получаются две равные треугольные призмы.',
    level: E,
    source: 'g4-chasti',
  },
  {
    id: '3-chast-v',
    task: 3,
    topic: 'sostavnye',
    type: 'vychislenie',
    front:
      'Объём прямоугольного параллелепипеда $ABCDA_1B_1C_1D_1$ равен $60$. Найдите объём треугольной пирамиды $A_1ABD$.',
    back: 'Основание $ABD$ — половина основания, пирамида — треть: $60 \\cdot \\dfrac12 \\cdot \\dfrac13 = 10$.',
    pochemu: 'Треть от половины, а не от целого.',
    otvet: '10',
    proverka: () => {
      const b = box(3, 4, 5);
      const v = (n: string) => vertex(b, n);
      const t = pyramid([v('A'), v('B'), v('D')], v('A1'));
      return (60 * obemMnogogrannika(t)) / obemMnogogrannika(b);
    },
    level: E,
    source: 'g4-chasti',
  },
  {
    id: '3-vychest-v',
    task: 3,
    topic: 'sostavnye',
    type: 'vychislenie',
    front: 'Из куба с ребром $4$ вырезали куб с ребром $2$. Найдите объём оставшейся части.',
    back: '$64 - 8 = 56$',
    otvet: '56',
    proverka: () => obemMnogogrannika(box(4, 4, 4)) - obemMnogogrannika(box(2, 2, 2)),
    level: B,
    source: 'g4-sostavnye',
  },
  {
    id: '3-tret-l',
    task: 3,
    topic: 'sostavnye',
    type: 'verno',
    front:
      'Пирамида с тем же основанием и той же высотой, что у призмы, занимает половину объёма призмы.',
    verno: false,
    back: 'Неверно: пирамида занимает **треть** объёма призмы.',
    level: E,
    source: 'g4-formuly',
  },

  /* ── Комбинации тел ── */
  {
    id: '3-kombinacii',
    task: 3,
    topic: 'kombinacii',
    type: 'svoystvo',
    front: 'С чего начать задачу на комбинацию тел?',
    back: 'С сечения: провести осевое (или подходящее) сечение и найти связь размеров на плоском рисунке.',
    level: B,
    source: 'g7-sechenie',
  },
  {
    id: '3-shar-kub',
    task: 3,
    topic: 'kombinacii',
    type: 'formula',
    front: 'Радиус шара, вписанного в куб с ребром $a$, и шара, описанного около него?',
    back: 'Вписанный: $R = \\dfrac{a}{2}$. Описанный: $R = \\dfrac{a\\sqrt3}{2}$ — половина диагонали куба.',
    figure: { dvizhok: 'solid', model: sharVKube },
    level: E,
    source: 'g7-shar-kub',
  },
  {
    id: '3-cilindr-shar',
    task: 3,
    topic: 'kombinacii',
    type: 'svoystvo',
    front: 'Цилиндр описан около шара радиуса $R$. Чему равны радиус основания и высота цилиндра?',
    back: '$r = R$, $h = 2R$.',
    figure: { dvizhok: 'solid', model: cilindrOkoloShara },
    level: E,
    source: 'g7-vrashcheniya',
  },
  {
    id: '3-konus-cilindr',
    task: 3,
    topic: 'kombinacii',
    type: 'svoystvo',
    front: 'У конуса и цилиндра общее основание и равные высоты. Как относятся их объёмы?',
    back: 'Объём конуса — **треть** объёма цилиндра.',
    level: E,
    source: 'g7-vrashcheniya',
  },
  {
    id: '3-shar-v-kube-v',
    task: 3,
    topic: 'kombinacii',
    type: 'vychislenie',
    front: 'Шар вписан в куб с ребром $3$. Найдите объём шара, делённый на $\\pi$.',
    back: '$R = 1{,}5$, $\\dfrac{V}{\\pi} = \\dfrac43 \\cdot 1{,}5^3 = 4{,}5$',
    otvet: '4,5',
    proverka: () => Math.round((obemSharaChislenno(3 / 2) / Math.PI) * 1e6) / 1e6,
    level: E,
    source: 'g7-shar-kub',
  },
  {
    id: '3-cilindr-v-prizme-v',
    task: 3,
    topic: 'kombinacii',
    type: 'vychislenie',
    front:
      'Цилиндр вписан в правильную четырёхугольную призму со стороной основания $4$ и высотой $5$. Найдите площадь боковой поверхности цилиндра, делённую на $\\pi$.',
    back: '$r = 2$, $\\dfrac{S_{\\text{бок}}}{\\pi} = 2 \\cdot 2 \\cdot 5 = 20$',
    pochemu: 'Окружность основания вписана в квадрат: радиус — половина стороны.',
    otvet: '20',
    proverka: () => {
      /* Боковая поверхность — периметр многоугольника-окружности на высоту. */
      const r = 4 / 2;
      const n = 6000;
      const per = n * 2 * r * Math.sin(Math.PI / n);
      return Math.round(((per * 5) / Math.PI) * 1e4) / 1e4;
    },
    level: E,
    source: 'g7-prizma',
  },
  {
    id: '3-opisannyy-shar-l',
    task: 3,
    topic: 'kombinacii',
    type: 'verno',
    front: 'Радиус шара, описанного около куба с ребром $a$, равен $\\dfrac{a}{2}$.',
    verno: false,
    back: 'Неверно: $\\dfrac{a}{2}$ — радиус вписанного шара. Описанный проходит через вершины: $R = \\dfrac{a\\sqrt3}{2}$.',
    level: E,
    source: 'g7-shar-kub',
  },
  {
    id: '3-bok-cilindra-l',
    task: 3,
    topic: 'kombinacii',
    type: 'verno',
    front:
      'У цилиндра, описанного около шара, площадь боковой поверхности равна площади поверхности шара.',
    verno: true,
    back: 'Верно: $2\\pi R \\cdot 2R = 4\\pi R^2$.',
    level: E,
    source: 'g7-vrashcheniya',
  },
];

/* ── Прямой счёт для тел вращения ── */

/** Объём шара сечениями-кругами: Симпсон по высоте. */
function obemSharaChislenno(R: number): number {
  const n = 2000;
  const h = (2 * R) / n;
  let s = 0;
  for (let i = 0; i <= n; i += 1) {
    const z = -R + i * h;
    const krug = Math.PI * Math.max(0, R * R - z * z);
    s += krug * (i === 0 || i === n ? 1 : i % 2 === 1 ? 4 : 2);
  }
  return (s * h) / 3;
}

/** Площадь сферы как поверхности вращения: Симпсон по углу θ. */
function ploshchadSferyChislenno(R: number): number {
  const n = 2000;
  const h = Math.PI / n;
  let s = 0;
  for (let i = 0; i <= n; i += 1) {
    const t = i * h;
    s += 2 * Math.PI * R * Math.sin(t) * R * (i === 0 || i === n ? 1 : i % 2 === 1 ? 4 : 2);
  }
  return (s * h) / 3;
}

/** Многоугольник из многих сторон вместо окружности. */
const MNOGO = 6000;

const proverki: ProverkaFormuly[] = [
  {
    kartochka: '3-diagonal',
    sluchay: (rnd) => {
      const [a, b, c] = [1 + rnd() * 9, 1 + rnd() * 9, 1 + rnd() * 9];
      const t = box(a, b, c);
      return {
        poFormule: Math.sqrt(a * a + b * b + c * c),
        pryamo: dlina(vertex(t, 'A'), vertex(t, 'C1')),
      };
    },
  },
  {
    kartochka: '3-diagonal-kuba',
    sluchay: (rnd) => {
      const a = 1 + rnd() * 9;
      const t = box(a, a, a);
      return {
        poFormule: a * Math.sqrt(3) + a * Math.sqrt(2),
        pryamo: dlina(vertex(t, 'A'), vertex(t, 'C1')) + dlina(vertex(t, 'A'), vertex(t, 'C')),
      };
    },
  },
  {
    kartochka: '3-parallelepiped',
    sluchay: (rnd) => {
      const [a, b, c] = [1 + rnd() * 9, 1 + rnd() * 9, 1 + rnd() * 9];
      const t = box(a, b, c);
      return {
        poFormule: a * b * c + 2 * (a * b + b * c + a * c),
        pryamo: obemMnogogrannika(t) + ploshchadPoverhnosti(t),
      };
    },
  },
  {
    kartochka: '3-prizma-v-formula',
    sluchay: (rnd) => {
      const n = 3 + Math.floor(rnd() * 6);
      const R = 1 + rnd() * 5;
      const h = 1 + rnd() * 8;
      const t = regularPrism(n, R, h);
      const osn = ploshchadMnogougolnika(t.vertices.filter((v) => Math.abs(v[2]) < 1e-9));
      return { poFormule: osn * h, pryamo: obemMnogogrannika(t) };
    },
  },
  {
    kartochka: '3-prizma-bok',
    sluchay: (rnd) => {
      const n = 3 + Math.floor(rnd() * 6);
      const R = 1 + rnd() * 5;
      const h = 1 + rnd() * 8;
      const t = regularPrism(n, R, h);
      const niz = t.vertices.filter((v) => Math.abs(v[2]) < 1e-9);
      const P_ = n * dlina(niz[0]!, niz[1]!);
      return {
        poFormule: P_ * h,
        pryamo: ploshchadPoverhnosti(t) - 2 * ploshchadMnogougolnika(niz),
      };
    },
  },
  {
    kartochka: '3-piramida-v-formula',
    sluchay: (rnd) => {
      /* Вершина — в любой точке над основанием: объём от этого не зависит. */
      const a = 1 + rnd() * 6;
      const b = 1 + rnd() * 6;
      const h = 1 + rnd() * 8;
      const t = pyramid(
        [
          [0, 0, 0],
          [a, 0, 0],
          [a, b, 0],
          [0, b, 0],
        ],
        P(rnd() * a, rnd() * b, h),
      );
      return { poFormule: (a * b * h) / 3, pryamo: obemMnogogrannika(t) };
    },
  },
  {
    kartochka: '3-treugolniki-piramidy',
    sluchay: (rnd) => {
      const n = 3 + Math.floor(rnd() * 4);
      const R = 1 + rnd() * 5;
      const h = 1 + rnd() * 8;
      const t = regularPyramid(n, R, h);
      const A = t.vertices[0]!;
      const Bv = t.vertices[1]!;
      const S = t.vertices[n]!;
      const r = R * Math.cos(Math.PI / n);
      return {
        poFormule: Math.sqrt(h * h + r * r) + Math.sqrt(h * h + R * R),
        pryamo: dlina(S, seredina(A, Bv)) + dlina(S, A),
      };
    },
  },
  {
    kartochka: '3-piramida-bok',
    sluchay: (rnd) => {
      const n = 3 + Math.floor(rnd() * 4);
      const R = 1 + rnd() * 5;
      const h = 1 + rnd() * 8;
      const t = regularPyramid(n, R, h);
      const A = t.vertices[0]!;
      const Bv = t.vertices[1]!;
      const l = dlina(t.vertices[n]!, seredina(A, Bv));
      const osn = ploshchadMnogougolnika(t.vertices.slice(0, n));
      return { poFormule: 0.5 * n * dlina(A, Bv) * l, pryamo: ploshchadPoverhnosti(t) - osn };
    },
  },
  {
    kartochka: '3-radiusy-osnovaniya',
    sluchay: (rnd) => {
      const a = 1 + rnd() * 9;
      const kv = regularPolygon(4, (a * Math.SQRT2) / 2, 0, 0);
      const tr = regularPolygon(3, (a * Math.sqrt(3)) / 3, 0, 0);
      const O = P(0, 0, 0);
      return {
        poFormule: a / 2 + (a * Math.sqrt(3)) / 6 + a + a,
        pryamo:
          dlina(O, seredina(kv[0]!, kv[1]!)) +
          dlina(O, seredina(tr[0]!, tr[1]!)) +
          dlina(kv[0]!, kv[1]!) +
          dlina(tr[0]!, tr[1]!),
      };
    },
  },
  {
    kartochka: '3-shestiugolnik',
    sluchay: (rnd) => {
      const a = 1 + rnd() * 9;
      const t = regularPolygon(6, a, 0, 0);
      return { poFormule: a + 2 * a, pryamo: dlina(t[0]!, t[1]!) + dlina(t[0]!, t[3]!) };
    },
  },
  {
    kartochka: '3-cilindr-v',
    sluchay: (rnd) => {
      const r = 1 + rnd() * 5;
      const h = 1 + rnd() * 8;
      return {
        poFormule: Math.PI * r * r * h,
        pryamo: obemMnogogrannika(regularPrism(MNOGO, r, h)),
      };
    },
  },
  {
    kartochka: '3-cilindr-s',
    sluchay: (rnd) => {
      const r = 1 + rnd() * 5;
      const h = 1 + rnd() * 8;
      return {
        poFormule: 2 * Math.PI * r * (r + h),
        pryamo: ploshchadPoverhnosti(regularPrism(MNOGO, r, h)),
      };
    },
  },
  {
    kartochka: '3-konus-v',
    sluchay: (rnd) => {
      const r = 1 + rnd() * 5;
      const h = 1 + rnd() * 8;
      return {
        poFormule: (Math.PI * r * r * h) / 3,
        pryamo: obemMnogogrannika(regularPyramid(MNOGO, r, h)),
      };
    },
  },
  {
    kartochka: '3-konus-s',
    sluchay: (rnd) => {
      const r = 1 + rnd() * 5;
      const h = 1 + rnd() * 8;
      const t = regularPyramid(MNOGO, r, h);
      const bok = ploshchadPoverhnosti(t) - ploshchadMnogougolnika(t.vertices.slice(0, MNOGO));
      return { poFormule: Math.PI * r * Math.sqrt(r * r + h * h), pryamo: bok };
    },
  },
  {
    kartochka: '3-shar',
    sluchay: (rnd) => {
      const R = 1 + rnd() * 5;
      return {
        poFormule: (4 / 3) * Math.PI * R ** 3 + 4 * Math.PI * R * R,
        pryamo: obemSharaChislenno(R) + ploshchadSferyChislenno(R),
      };
    },
  },
  {
    kartochka: '3-shar-kub',
    sluchay: (rnd) => {
      const a = 1 + rnd() * 9;
      const t = box(a, a, a);
      const O = P(a / 2, a / 2, a / 2);
      /* Вписанный — до грани, описанный — до вершины. */
      return {
        poFormule: a / 2 + (a * Math.sqrt(3)) / 2,
        pryamo: dlina(O, P(a / 2, a / 2, 0)) + dlina(O, vertex(t, 'C1')),
      };
    },
  },
];

const KOLODA_3: Koloda = {
  task: 3,
  slug: '3',
  title: 'Стереометрия',
  teoriya: 'teoriya/',
  podtemy: [
    { id: 'kub', title: 'Куб и прямоугольный параллелепипед' },
    { id: 'prizma', title: 'Призма' },
    { id: 'piramida', title: 'Пирамида' },
    { id: 'vrashcheniya', title: 'Цилиндр, конус, шар' },
    { id: 'sektor', title: 'Часть тела и ответ в единицах $\\pi$' },
    { id: 'podobie', title: 'Подобие и уровень жидкости' },
    { id: 'sostavnye', title: 'Составные многогранники и части' },
    { id: 'kombinacii', title: 'Комбинации тел' },
  ],
  kartochki,
  proverki,
};

export default KOLODA_3;
