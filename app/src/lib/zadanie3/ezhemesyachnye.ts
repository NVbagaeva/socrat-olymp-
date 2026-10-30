/**
 * Задание №3 для раздела «Ежемесячные варианты»: прототипы той же
 * формы, что прототипы разделов I, II и VIII, с числами и сюжетами
 * вариантов. В список прототипов раздела (тренажёр, банк, «Собрать
 * вариант») не входят — их берёт только раздел вариантов.
 *
 * Ответ считается дважды: формулой прототипа (`otvet`) и по
 * координатам трёхмерной модели (`poModeli`). Чертёж строится по
 * числам условия, пропорции тела — настоящие.
 */

import { box, regularPrism, vertex } from '../solid/figures';
import { angleBetweenLines, distance } from '../solid/measure';
import { stepBody } from '../solid/drawings/steps';
import { edge, prismModel } from '../solid/drawings/common';
import { type Model, type Polyhedron } from '../solid/model';
import { type Vec3 } from '../solid/vec';
import { ru } from './format';
import { type Params, type Prototype, num } from './types';

const SVOI = {
  status: 'добавить',
  varianty: [],
} as const;

const dir = (a: Vec3, b: Vec3): Vec3 => [b[0] - a[0], b[1] - a[1], b[2] - a[2]];

/* ── Ступенчатый многогранник: тангенс угла в боковой грани ─────── */

/**
 * Ступенька: W — вся длина, d — глубина, h — высота низкой части,
 * w — длина высокой части, t — на сколько высокая часть выше низкой.
 */
function stupen(p: Params): Polyhedron {
  const W = num(p, 'W');
  const w = num(p, 'w');
  const h = num(p, 'h');
  const t = num(p, 't');
  const d = num(p, 'd');
  const body = stepBody({ W, H: h + t, w, h, depth: d });
  /* Вершины stepBody: профиль спереди (y = 0), затем сзади (y = d):
     (0,0) (W,0) (W,h) (w,h) (w,H) (0,H). */
  body.names = ['A', 'B', 'B1', 'E', 'G', 'K', 'D', 'C', 'C1', 'F', 'H', 'L'];
  return body;
}

/** Угол FGE: G — верх высокой части спереди, E — под ней на ступеньке, F — за E в глубину. */
export const EV03_STUPEN_UGOL: Prototype = {
  ...SVOI,
  id: 'EV03-stupen-ugol',
  razdel: 'I',
  zadachnik: [9, 10],
  nazvanie: 'Ступенчатый многогранник: тангенс угла в боковой грани',
  tip: 'тангенс угла прямоугольного треугольника на грани ступеньки',
  format: 'десятичная',
  uslovie: () =>
    'Найдите тангенс угла $FGE$ многогранника, изображённого на рисунке. Все двугранные углы многогранника прямые.',
  dopustimo: (p) =>
    num(p, 'w') > 0 &&
    num(p, 'w') < num(p, 'W') &&
    num(p, 'h') > 0 &&
    num(p, 't') > 0 &&
    num(p, 'd') > 0,
  otvet: (p) => num(p, 'd') / num(p, 't'),
  poModeli: (p) => {
    const b = stupen(p);
    const G = vertex(b, 'G');
    const u = angleBetweenLines(dir(G, vertex(b, 'F')), dir(G, vertex(b, 'E')));
    return Math.tan((u * Math.PI) / 180);
  },
  chertezh: (p) => {
    const b = stupen(p);
    const W = num(p, 'W');
    const w = num(p, 'w');
    const h = num(p, 'h');
    const t = num(p, 't');
    const d = num(p, 'd');
    const P = (x: number, y: number, z: number): Vec3 => [x, y, z];
    return {
      ...prismModel(
        `Ступенчатый многогранник, все двугранные углы прямые: длина ${W}, глубина ${d}, высокая часть длиной ${w} выше низкой на ${t}, низкая часть высотой ${h}; отрезок FG`,
        b,
        { lines: [edge(b, 'F', 'G')] },
      ),
      measures: [
        { a: P(0, 0, 0), b: P(W, 0, 0), text: ru(W) },
        { a: P(W, 0, 0), b: P(W, d, 0), text: ru(d) },
        { a: P(W, d, h), b: P(W, d, 0), text: ru(h) },
        { a: P(w, d, h), b: P(W, d, h), text: ru(W - w) },
        { a: P(0, 0, h + t), b: P(w, 0, h + t), text: ru(w) },
        { a: P(w, 0, h + t), b: P(w, 0, h), text: ru(t) },
      ],
    } satisfies Model;
  },
  shagi: (p) => {
    const d = num(p, 'd');
    const t = num(p, 't');
    return [
      {
        text: 'Все двугранные углы прямые, поэтому грани — прямоугольники. Точки $E$, $F$, $G$ лежат в одной грани $EFHG$ высокой части, $\\angle GEF=90^\\circ$.',
      },
      {
        text: `$GE$ — высота, на которую высокая часть поднимается над ступенькой: $GE=${ru(t)}$. $EF$ — ребро, параллельное $BC$: $EF=BC=${ru(d)}$.`,
      },
      {
        text: `В прямоугольном треугольнике $FGE$ тангенс угла $G$ — противолежащий катет на прилежащий: $\\operatorname{tg}\\angle FGE=\\dfrac{EF}{GE}=\\dfrac{${ru(d)}}{${ru(t)}}=${ru(d / t)}$.`,
        value: d / t,
      },
    ];
  },
};

/* ── Диагональ прямоугольного параллелепипеда: прямой ствол ────── */

export const EV03_STVOL: Prototype = {
  ...SVOI,
  id: 'EV03-stvol',
  razdel: 'I',
  zadachnik: [1, 8],
  nazvanie: 'Диагональ прямоугольного параллелепипеда: сюжет',
  tip: 'длина диагонали по трём рёбрам',
  format: 'целое',
  uslovie: (p) =>
    `Метростроевцы прокладывают прямой вентиляционный ствол от люка на площади до точки тоннеля. ` +
    `Эта точка находится на ${ru(num(p, 'a'))} м восточнее люка, на ${ru(num(p, 'b'))} м севернее и на ${ru(num(p, 'c'))} м ниже. ` +
    `Какой длины будет ствол? Ответ дайте в метрах.`,
  dopustimo: (p) => num(p, 'a') > 0 && num(p, 'b') > 0 && num(p, 'c') > 0,
  otvet: (p) => Math.hypot(num(p, 'a'), num(p, 'b'), num(p, 'c')),
  poModeli: (p) => {
    const b = box(num(p, 'a'), num(p, 'b'), num(p, 'c'));
    return distance(vertex(b, 'A1'), vertex(b, 'C'));
  },
  chertezh: (p) => {
    const a = num(p, 'a');
    const bb = num(p, 'b');
    const c = num(p, 'c');
    const b = box(a, bb, c);
    b.names = b.vertices.map(() => null);
    const P = (x: number, y: number, z: number): Vec3 => [x, y, z];
    return prismModel(
      `Прямоугольный параллелепипед ${ru(a)} на ${ru(bb)} на ${ru(c)}: ствол — его диагональ от верхнего угла до противоположного нижнего`,
      b,
      {
        lines: [{ a: P(0, 0, c), b: P(a, bb, 0) }],
        marks: [
          { p: P(0, 0, c), label: 'люк' },
          { p: P(a, bb, 0), label: 'тоннель' },
        ],
        measures: [
          { a: P(0, 0, 0), b: P(a, 0, 0), text: `${ru(a)} м` },
          { a: P(a, 0, 0), b: P(a, bb, 0), text: `${ru(bb)} м` },
          { a: P(0, 0, c), b: P(0, 0, 0), text: `${ru(c)} м` },
        ],
      },
    );
  },
  shagi: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    const osn = a * a + b * b;
    const L = Math.sqrt(osn + c * c);
    return [
      {
        text: `Люк и точка тоннеля — противоположные вершины прямоугольного параллелепипеда с рёбрами ${ru(a)}, ${ru(b)} и ${ru(c)} м; ствол — его диагональ.`,
      },
      {
        text: `Квадрат диагонали «горизонтального» прямоугольника: $${ru(a)}^2+${ru(b)}^2=${ru(osn)}$.`,
        value: osn,
      },
      {
        text: `Ствол — гипотенуза прямоугольного треугольника с катетами — этой диагональю и глубиной ${ru(c)} м: $\\sqrt{${ru(osn)}+${ru(c)}^2}=\\sqrt{${ru(osn + c * c)}}=${ru(L)}$.`,
        value: L,
      },
    ];
  },
};

/* ── Шар в шаре: доля оболочки ──────────────────────────────────── */

export const EV03_KOZHURA: Prototype = {
  ...SVOI,
  id: 'EV03-kozhura',
  razdel: 'VIII',
  zadachnik: [302, 305],
  nazvanie: 'Шар и шар внутри: какую часть объёма занимает оболочка',
  tip: 'отношение объёмов подобных тел — куб отношения диаметров',
  format: 'десятичная',
  uslovie: (p) =>
    `Диаметр помело равен ${ru(num(p, 'D'))} см, а диаметр помело без кожуры — ${ru(num(p, 'd'))} см. ` +
    `Сколько процентов объёма помело занимает кожура? Помело с кожурой и без неё считайте шарами.`,
  dopustimo: (p) => num(p, 'd') > 0 && num(p, 'd') < num(p, 'D'),
  otvet: (p) => Math.round((1 - (num(p, 'd') / num(p, 'D')) ** 3) * 1e6) / 1e4,
  poModeli: (p) => {
    const V = (r: number) => (4 / 3) * Math.PI * r ** 3;
    return ((V(num(p, 'D') / 2) - V(num(p, 'd') / 2)) / V(num(p, 'D') / 2)) * 100;
  },
  chertezh: (p) => {
    const R = num(p, 'D') / 2;
    const r = num(p, 'd') / 2;
    const P = (x: number, y: number, z: number): Vec3 => [x, y, z];
    return {
      alt: `Шар диаметром ${ru(2 * R)} и внутри него шар диаметром ${ru(2 * r)} с тем же центром`,
      bodies: [
        { kind: 'sphere', center: P(0, 0, 0), r: R, glass: true },
        { kind: 'sphere', center: P(0, 0, 0), r, equator: true },
      ],
      lines: [
        { a: P(-R, 0, 0), b: P(R, 0, 0) },
        { a: P(0, 0, -r), b: P(0, 0, r) },
      ],
      measures: [
        { a: P(-R, 0, 0), b: P(R, 0, 0), text: `${ru(2 * R)} см` },
        { a: P(0, 0, r), b: P(0, 0, -r), text: `${ru(2 * r)} см` },
      ],
    } satisfies Model;
  },
  shagi: (p) => {
    const D = num(p, 'D');
    const d = num(p, 'd');
    const k = d / D;
    const k3 = Math.round(k ** 3 * 1e9) / 1e9;
    const otv = Math.round((1 - k3) * 1e6) / 1e4;
    return [
      {
        text: `Шары подобны с коэффициентом $\\dfrac{${ru(d)}}{${ru(D)}}=${ru(k)}$, объёмы подобных тел относятся как куб коэффициента подобия.`,
      },
      {
        text: `Мякоть занимает $${ru(k)}^3=${ru(k3)}$ объёма помело, то есть $${ru(Math.round(k3 * 1e6) / 1e4)}\\%$.`,
        value: k3,
      },
      {
        text: `Кожура — остальное: $100\\%-${ru(Math.round(k3 * 1e6) / 1e4)}\\%=${ru(otv)}\\%$.`,
        value: otv,
      },
    ];
  },
};

/* ── Правильная шестиугольная призма: тангенс угла между прямыми ─ */

function shestiugolnaya(p: Params): Polyhedron {
  /* У правильного шестиугольника радиус описанной окружности равен стороне. */
  return regularPrism(6, num(p, 'a'), num(p, 'h'), 'cabinet');
}

export const EV03_SHEST_TANGENS: Prototype = {
  ...SVOI,
  id: 'EV03-shest-tg',
  razdel: 'II',
  zadachnik: [110, 113],
  nazvanie: 'Правильная шестиугольная призма: тангенс угла между $C_1F$ и $AA_1$',
  tip: 'угол между диагональю и боковым ребром — переносом ребра',
  format: 'десятичная',
  uslovie: (p) =>
    `В правильной шестиугольной призме $ABCDEFA_1B_1C_1D_1E_1F_1$ сторона основания равна ${ru(num(p, 'a'))}, а боковое ребро равно ${ru(num(p, 'h'))}. ` +
    `Найдите тангенс угла между прямыми $C_1F$ и $AA_1$.`,
  dopustimo: (p) => num(p, 'a') > 0 && num(p, 'h') > 0,
  otvet: (p) => (2 * num(p, 'a')) / num(p, 'h'),
  poModeli: (p) => {
    const b = shestiugolnaya(p);
    const u = angleBetweenLines(
      dir(vertex(b, 'C1'), vertex(b, 'F')),
      dir(vertex(b, 'A'), vertex(b, 'A1')),
    );
    return Math.tan((u * Math.PI) / 180);
  },
  chertezh: (p) => {
    const b = shestiugolnaya(p);
    return prismModel(
      `Правильная шестиугольная призма ABCDEFA₁B₁C₁D₁E₁F₁, сторона основания ${ru(num(p, 'a'))}, боковое ребро ${ru(num(p, 'h'))}; выделены прямые C₁F и AA₁`,
      b,
      { lines: [edge(b, 'C1', 'F'), edge(b, 'A', 'A1')] },
    );
  },
  shagi: (p) => {
    const a = num(p, 'a');
    const h = num(p, 'h');
    return [
      {
        text: '$AA_1\\parallel CC_1$, поэтому угол между $C_1F$ и $AA_1$ равен углу $FC_1C$ в треугольнике $FCC_1$.',
      },
      {
        text: `Ребро $CC_1$ перпендикулярно основанию, значит, $\\angle FCC_1=90^\\circ$. $CF$ — большая диагональ правильного шестиугольника, она вдвое длиннее стороны: $CF=2\\cdot${ru(a)}=${ru(2 * a)}$.`,
        value: 2 * a,
      },
      {
        text: `$\\operatorname{tg}\\angle FC_1C=\\dfrac{CF}{CC_1}=\\dfrac{${ru(2 * a)}}{${ru(h)}}=${ru((2 * a) / h)}$.`,
        value: (2 * a) / h,
      },
    ];
  },
};
