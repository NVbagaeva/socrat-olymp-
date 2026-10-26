/**
 * Опорные задачи №3, блок 10 «Углы в многогранниках»: угол между
 * прямыми в кубе и правильной шестиугольной призме (перенос прямой
 * параллельно), угол между прямой и плоскостью через тангенс в рабочем
 * треугольнике. Числа и условия свои.
 *
 * У каждой задачи — пересчёт ответа по координатам того же чертежа
 * (pereschet): автотест сверяет его с ответом.
 */

import { box, regularPrism, vertex } from '../../solid/figures';
import type { Model, Polyhedron } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';
import type { PloskiyTreugolnik } from '../ploskiy';
import type { ShagPodskazki, ZadachaOp3 } from './tipy';

const raz = (a: Vec3, b: Vec3): Vec3 => [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
const dist = (a: Vec3, b: Vec3) => Math.hypot(...raz(a, b));
const dot = (u: Vec3, v: Vec3) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
const cross = (u: Vec3, v: Vec3): Vec3 => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const okr = (x: number) => Math.round(x * 1e6) / 1e6;
const same = (p: Vec3, q: Vec3) => dist(p, q) < 1e-9;

/** Косинус угла между прямыми ab и cd (не между векторами). */
function cosPryamyh(a: Vec3, b: Vec3, c: Vec3, d: Vec3): number {
  const u = raz(a, b);
  const v = raz(c, d);
  return Math.min(1, Math.abs(dot(u, v)) / (Math.hypot(...u) * Math.hypot(...v)));
}

/** Угол между прямыми ab и cd, градусы. */
function ugol(a: Vec3, b: Vec3, c: Vec3, d: Vec3): number {
  return okr((Math.acos(cosPryamyh(a, b, c, d)) * 180) / Math.PI);
}

/** Прямые ab и cd параллельны. */
function parallelny(a: Vec3, b: Vec3, c: Vec3, d: Vec3): boolean {
  return Math.hypot(...cross(raz(a, b), raz(c, d))) < 1e-9;
}

/* ── Общие шаги подсказок ───────────────────────────────────────── */

const PRYAMYE: ShagPodskazki = {
  n: 2,
  vopros: 'Каким может быть угол между прямыми?',
  varianty: ['От $0^\\circ$ до $90^\\circ$', 'Любым, от $0^\\circ$ до $180^\\circ$', 'Только острым, без $90^\\circ$'],
  verno: 0,
  vyvod: 'Если в треугольнике получился тупой угол, берём смежный с ним.',
};

const PERENOS: ShagPodskazki = {
  n: 2,
  vopros: 'Прямые на чертеже не пересекаются. Что делаем?',
  varianty: [
    'Заменяем одну прямую параллельной, проходящей через точку другой',
    'Считаем угол равным $90^\\circ$: скрещивающиеся прямые перпендикулярны',
    'Измеряем угол на чертеже транспортиром',
  ],
  verno: 0,
  vyvod: 'Угол между параллельными прямыми и третьей прямой одинаковый.',
};

const PERP_OSNOVANIE: ShagPodskazki = {
  n: 3,
  vopros: 'Почему угол рабочего треугольника прямой?',
  varianty: [
    'Боковое ребро перпендикулярно плоскости основания, а другая сторона лежит в основании',
    'На чертеже угол выглядит прямым',
    'Диагонали параллелепипеда равны',
  ],
  verno: 0,
  vyvod: 'Прямая, перпендикулярная плоскости, перпендикулярна любой прямой в этой плоскости.',
};

/* ── Чертежи ────────────────────────────────────────────────────── */

function kub(a: number): { body: Polyhedron; v: (n: string) => Vec3 } {
  const body = box(a, a, a);
  return { body, v: (n: string) => vertex(body, n) };
}

function shestigrannik(R: number, h: number): { body: Polyhedron; v: (n: string) => Vec3 } {
  const body = regularPrism(6, R, h);
  return { body, v: (n: string) => vertex(body, n) };
}

function parallelepiped(a: number, b: number, c: number, { alt }: { alt: string }, s: boolean): { model: Model; v: (n: string) => Vec3 } {
  const body = box(a, b, c);
  const v = (n: string) => vertex(body, n);
  return {
    v,
    model: {
      alt,
      bodies: [body],
      lines: [{ a: v('B1'), b: v('D') }],
      ...(s
        ? {
            measures: [
              { a: v('A'), b: v('B'), text: String(a) },
              { a: v('B'), b: v('C'), text: String(b) },
              { a: v('C'), b: v('C1'), text: String(c) },
            ],
          }
        : {}),
    },
  };
}

/* ── Задачи ─────────────────────────────────────────────────────── */

export function zadachiBloka10(): ZadachaOp3[] {
  const out: ZadachaOp3[] = [];

  /* 1. Нажми: куда перенести B₁C. */
  {
    const { body, v } = kub(4);
    const celi = [
      { id: 'A1D', points: [v('A1'), v('D')], label: '$A_1D$' },
      { id: 'A1D1', points: [v('A1'), v('D1')], label: '$A_1D_1$' },
      { id: 'A1C1', points: [v('A1'), v('C1')], label: '$A_1C_1$' },
      { id: 'A1C', points: [v('A1'), v('C')], label: '$A_1C$' },
    ];
    out.push({
      id: 'o3-10-01',
      kratko: 'Куда перенести прямую',
      blok: 'ugly',
      uroven: 1,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie:
        'В кубе $ABCDA_1B_1C_1D_1$ ищут угол между скрещивающимися прямыми $A_1B$ и $B_1C$. Нажмите на отрезок с концом в точке $A_1$, параллельный $B_1C$: на него удобно перенести прямую $B_1C$.',
      model: {
        alt: 'Куб ABCDA₁B₁C₁D₁ с диагоналями граней A₁B и B₁C',
        bodies: [body],
        lines: [
          { a: v('A1'), b: v('B') },
          { a: v('B1'), b: v('C') },
        ],
      },
      celi,
      otvet: 'A1D',
      podskazka: [
        {
          n: 2,
          vopros: 'В какой грани лежит $B_1C$?',
          varianty: ['В боковой грани $BB_1C_1C$', 'В верхнем основании', 'Ни в какой: это диагональ куба'],
          verno: 0,
          vyvod: '$B_1C$ — диагональ грани. Параллельная ей диагональ лежит в противоположной грани $AA_1D_1D$.',
        },
        {
          n: 2,
          vopros: 'Какой четырёхугольник образуют точки $A_1$, $B_1$, $C$, $D$?',
          varianty: ['Прямоугольник', 'Трапецию с основаниями $A_1B_1$ и $B_1C$', 'Это не плоская фигура'],
          verno: 0,
          vyvod: '$A_1B_1$ и $DC$ — равные параллельные рёбра, значит, $A_1B_1CD$ — прямоугольник, его противоположные стороны параллельны.',
        },
      ],
      uchitel: [
        { etap: 'Сечение $A_1B_1CD$', formuly: ['A_1B_1 \\parallel DC,\\ A_1B_1 = DC\\ \\Rightarrow\\ A_1B_1CD\\ \\text{— прямоугольник}'] },
        { etap: 'Перенос', formuly: ['B_1C \\parallel A_1D'] },
      ],
      uchenik: [
        { n: 1, chto: 'Куб: все грани — равные квадраты, $B_1C$ — диагональ боковой грани $BB_1C_1C$.' },
        {
          n: 2,
          chto: 'Ребро $A_1B_1$ равно и параллельно ребру $DC$, поэтому $A_1B_1CD$ — прямоугольник, и $B_1C \\parallel A_1D$. $A_1D_1$ параллельно ребру $B_1C_1$, а не диагонали $B_1C$; $A_1C_1$ и $A_1C$ ей тоже не параллельны.',
          formula: 'B_1C \\parallel A_1D',
        },
      ],
      pereschet: () => celi.find((c) => parallelny(c.points[0] as Vec3, c.points[1] as Vec3, v('B1'), v('C')))?.id ?? '',
    });
  }

  /* 2. Куб: угол между A₁C₁ и AD. */
  {
    const { body, v } = kub(4);
    out.push({
      id: 'o3-10-02',
      kratko: 'Диагональ грани и ребро',
      rabochaya: { points: [v('A1'), v('D1'), v('C1')], pryamoy: v('D1') },
      blok: 'ugly',
      uroven: 1,
      istochnik: 'new',
      vid: 'chislo',
      uslovie: 'В кубе $ABCDA_1B_1C_1D_1$ найдите угол между прямыми $A_1C_1$ и $AD$. Ответ дайте в градусах.',
      model: {
        alt: 'Куб ABCDA₁B₁C₁D₁ с диагональю верхней грани A₁C₁',
        bodies: [body],
        lines: [{ a: v('A1'), b: v('C1') }],
      },
      otvet: '45',
      podskazka: [
        PERENOS,
        {
          n: 2,
          vopros: 'Какое ребро верхней грани параллельно $AD$?',
          varianty: ['$A_1D_1$', '$A_1B_1$', '$C_1D_1$'],
          verno: 0,
          vyvod: 'Искомый угол — угол $C_1A_1D_1$ в треугольнике $A_1D_1C_1$.',
        },
        {
          n: 4,
          vopros: 'Какой треугольник $A_1D_1C_1$?',
          varianty: ['Прямоугольный и равнобедренный', 'Правильный', 'Тупоугольный'],
          verno: 0,
          vyvod: 'Катеты — равные рёбра квадрата, прямой угол при $D_1$: острые углы равны.',
        },
      ],
      uchitel: [
        { etap: 'Перенос', formuly: ['AD \\parallel A_1D_1\\ \\Rightarrow\\ \\angle(A_1C_1, AD) = \\angle C_1A_1D_1'] },
        { etap: 'Треугольник $A_1D_1C_1$', formuly: ['A_1D_1 = D_1C_1,\\ \\angle A_1D_1C_1 = 90^\\circ\\ \\Rightarrow\\ \\angle C_1A_1D_1 = 45^\\circ'] },
      ],
      uchenik: [
        { n: 2, chto: 'Прямые $A_1C_1$ и $AD$ не пересекаются. Переносим $AD$ вверх: ей параллельно ребро $A_1D_1$.', formula: 'AD \\parallel A_1D_1' },
        { n: 3, chto: 'Верхняя грань — квадрат, угол $A_1D_1C_1$ прямой.' },
        { n: 5, chto: 'Диагональ квадрата делит его угол пополам.', formula: '\\angle C_1A_1D_1 = 90^\\circ : 2 = 45^\\circ' },
      ],
      pereschet: () => ugol(v('A1'), v('C1'), v('A'), v('D')),
    });
  }

  /* 3. Почему 60°: три диагонали граней. */
  {
    const { body, v } = kub(4);
    const varianty = [
      'Треугольник $BC_1D$ правильный: его стороны — диагонали равных квадратов',
      'Диагональ грани образует с ребром угол $45^\\circ$',
      'Соседние грани куба перпендикулярны, значит, и диагонали в них перпендикулярны',
      'На чертеже угол похож на $60^\\circ$',
    ];
    out.push({
      id: 'o3-10-03',
      kratko: 'Почему угол $60^\\circ$',
      blok: 'ugly',
      uroven: 1,
      istochnik: 'new',
      vid: 'vybor',
      uslovie: 'В кубе $ABCDA_1B_1C_1D_1$ угол между прямыми $BC_1$ и $DC_1$ равен $60^\\circ$. Почему?',
      model: {
        alt: 'Куб ABCDA₁B₁C₁D₁ с диагоналями граней BC₁ и DC₁ из вершины C₁',
        bodies: [body],
        lines: [
          { a: v('B'), b: v('C1') },
          { a: v('D'), b: v('C1') },
        ],
      },
      varianty,
      otvet: '0',
      podskazka: [
        {
          n: 2,
          vopros: 'Какой отрезок замыкает треугольник с $BC_1$ и $DC_1$?',
          varianty: ['$BD$ — диагональ нижнего основания', '$BB_1$ — боковое ребро', '$AC_1$ — диагональ куба'],
          verno: 0,
          vyvod: 'Треугольник $BC_1D$: все три его стороны — диагонали граней куба.',
        },
        {
          n: 4,
          vopros: 'Что можно сказать о сторонах треугольника $BC_1D$?',
          varianty: ['Все три равны', 'Равны только две', 'Одна из них — гипотенуза'],
          verno: 0,
          vyvod: 'Грани куба — равные квадраты, их диагонали равны.',
        },
      ],
      uchitel: [
        { etap: 'Треугольник $BC_1D$', formuly: ['BC_1 = C_1D = BD = a\\sqrt2'] },
        { etap: 'Угол', formuly: ['\\triangle BC_1D\\ \\text{— правильный}\\ \\Rightarrow\\ \\angle BC_1D = 60^\\circ'] },
      ],
      uchenik: [
        { n: 2, chto: 'Прямые $BC_1$ и $DC_1$ пересекаются в $C_1$. Достраиваем треугольник отрезком $BD$.' },
        {
          n: 4,
          chto: 'Все стороны треугольника $BC_1D$ — диагонали равных квадратов, он правильный, и все его углы по $60^\\circ$. Угол $45^\\circ$ — это угол между диагональю и ребром, а прямые в соседних гранях не обязаны быть перпендикулярны.',
          formula: 'BC_1 = C_1D = BD',
        },
      ],
      pereschet: () => {
        const s = [dist(v('B'), v('C1')), dist(v('C1'), v('D')), dist(v('B'), v('D'))] as const;
        return Math.abs(s[0] - s[1]) < 1e-9 && Math.abs(s[1] - s[2]) < 1e-9 ? '0' : '?';
      },
    });
  }

  /* 4. Шестиугольная призма: угол между BC и D₁E₁ — выбор. */
  {
    const { body, v } = shestigrannik(4, 5);
    const varianty = ['$120^\\circ$', '$60^\\circ$', '$30^\\circ$', '$0^\\circ$: прямые параллельны'];
    out.push({
      id: 'o3-10-04',
      kratko: 'Стороны шестиугольника',
      blok: 'ugly',
      uroven: 1,
      istochnik: 'new',
      vid: 'vybor',
      uslovie:
        'Дана правильная шестиугольная призма $ABCDEFA_1B_1C_1D_1E_1F_1$. Чему равен угол между прямыми $BC$ и $D_1E_1$?',
      model: {
        alt: 'Правильная шестиугольная призма ABCDEFA₁B₁C₁D₁E₁F₁',
        bodies: [body],
      },
      varianty,
      otvet: '1',
      podskazka: [
        PRYAMYE,
        {
          n: 2,
          vopros: 'Куда удобно перенести прямую $D_1E_1$?',
          varianty: ['В $DE$ — ребро нижнего основания', 'В $EF$', 'В $A_1B_1$'],
          verno: 0,
          vyvod: '$D_1E_1 \\parallel DE$, теперь обе прямые в одном шестиугольнике.',
        },
        {
          n: 4,
          vopros: 'Чему равен угол правильного шестиугольника?',
          varianty: ['$120^\\circ$', '$108^\\circ$', '$135^\\circ$'],
          verno: 0,
          vyvod: 'Продолжим $BC$ и $ED$ до пересечения: вместе со стороной $CD$ получится треугольник, у которого углы при $C$ и $D$ — смежные с углами шестиугольника.',
        },
      ],
      uchitel: [
        { etap: 'Перенос', formuly: ['D_1E_1 \\parallel DE'] },
        { etap: 'Треугольник из продолжений', formuly: ['180^\\circ - 120^\\circ = 60^\\circ', '\\angle(BC, DE) = 180^\\circ - 60^\\circ - 60^\\circ = 60^\\circ'] },
      ],
      uchenik: [
        { n: 2, chto: 'Переносим $D_1E_1$ в нижнее основание: $D_1E_1 \\parallel DE$.' },
        {
          n: 4,
          chto: 'Продолжения $BC$ и $ED$ вместе с $CD$ дают треугольник с углами $60^\\circ$ при $C$ и при $D$ — он правильный. Угол $120^\\circ$ — это угол между отрезками, а не прямыми; параллельна $BC$ противоположная сторона $EF$, а не $DE$.',
          formula: '\\angle(BC, DE) = 60^\\circ',
        },
      ],
      pereschet: () => String(varianty.findIndex((t) => t.startsWith(`$${Math.round(ugol(v('B'), v('C'), v('D1'), v('E1')))}^`))),
    });
  }

  /* 5. Нажми: рабочий треугольник угла между B₁D и основанием. */
  {
    const { model, v } = parallelepiped(4, 3, 5, { alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁ с диагональю B₁D' }, false);
    const celi = [
      { id: 'B1AD', points: [v('B1'), v('A'), v('D')], label: 'треугольник $B_1AD$' },
      { id: 'B1BD', points: [v('B1'), v('B'), v('D')], label: 'треугольник $B_1BD$' },
      { id: 'B1CD', points: [v('B1'), v('C'), v('D')], label: 'треугольник $B_1CD$' },
    ];
    out.push({
      id: 'o3-10-05',
      kratko: 'Угол прямой с основанием',
      rabochaya: { points: [v('B1'), v('B'), v('D')], pryamoy: v('B') },
      blok: 'ugly',
      uroven: 2,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie:
        'Нужен угол между диагональю $B_1D$ прямоугольного параллелепипеда и плоскостью основания $ABC$. Все три треугольника в списке прямоугольные. Нажмите на тот, в котором этот угол — острый угол при вершине $D$.',
      model,
      celi,
      otvet: 'B1BD',
      podskazka: [
        {
          n: 2,
          vopros: 'Угол между прямой и плоскостью — это угол между прямой и…',
          varianty: ['её проекцией на плоскость', 'любой прямой в этой плоскости', 'перпендикуляром к плоскости'],
          verno: 0,
          vyvod: 'Нужна проекция $B_1D$ на основание.',
        },
        {
          n: 3,
          vopros: 'Куда проецируется точка $B_1$ на плоскость основания?',
          varianty: ['В точку $B$', 'В точку $A$', 'В точку $C$'],
          verno: 0,
          vyvod: 'Ребро $BB_1$ перпендикулярно основанию, проекция $B_1D$ — диагональ основания $BD$.',
        },
      ],
      uchitel: [
        { etap: 'Проекция', formuly: ['BB_1 \\perp (ABC)\\ \\Rightarrow\\ BD\\ \\text{— проекция}\\ B_1D'] },
        { etap: 'Угол', formuly: ['\\angle(B_1D, (ABC)) = \\angle B_1DB,\\quad \\angle B_1BD = 90^\\circ'] },
      ],
      uchenik: [
        { n: 2, chto: 'Угол между прямой и плоскостью — угол между прямой и её проекцией. Опускаем перпендикуляр из $B_1$ на основание.' },
        {
          n: 3,
          chto: 'Перпендикуляр — ребро $B_1B$, проекция $B_1D$ — это $BD$. В треугольнике $B_1AD$ угол при $D$ — это угол с плоскостью грани $ABB_1A_1$, в $B_1CD$ — с гранью $BCC_1B_1$.',
          formula: '\\angle(B_1D, (ABC)) = \\angle B_1DB',
        },
      ],
      pereschet: () => {
        const B1 = v('B1');
        const proekciya: Vec3 = [B1[0], B1[1], 0];
        return celi.find((c) => c.points.some((p) => same(p, proekciya)))?.id ?? '';
      },
    });
  }

  /* 6. Плоский чертёж: тангенс угла B₁D с основанием, 8 × 6 × 15. */
  {
    const { model, v } = parallelepiped(8, 6, 15, { alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁: AB = 8, BC = 6, CC₁ = 15, диагональ B₁D' }, true);
    const ploskie: PloskiyTreugolnik[] = [
      { vershiny: ['B', 'D', 'B1'], kateti: [10, 15], podpisi: { a: '10', b: '15' }, iskomoe: 'ugolC', alt: 'Прямой угол при B, катеты BD = 10 и BB₁ = 15, искомый угол при B₁' },
      { vershiny: ['B', 'D', 'B1'], kateti: [10, 15], podpisi: { a: '10', b: '15' }, iskomoe: 'ugolB', alt: 'Прямой угол при B, катеты BD = 10 и BB₁ = 15, искомый угол при D' },
      { vershiny: ['B', 'D', 'B1'], kateti: [8, 15], podpisi: { a: '8', b: '15' }, iskomoe: 'ugolB', alt: 'Прямой угол при B, катеты BD = 8 и BB₁ = 15, искомый угол при D' },
    ];
    out.push({
      id: 'o3-10-06',
      kratko: 'Плоский чертёж для тангенса',
      rabochaya: { points: [v('B1'), v('B'), v('D')], pryamoy: v('B') },
      blok: 'ugly',
      uroven: 2,
      istochnik: 'new',
      vid: 'ploskiy',
      uslovie:
        'В прямоугольном параллелепипеде $ABCDA_1B_1C_1D_1$ известно, что $AB = 8$, $BC = 6$, $CC_1 = 15$. Какой плоский чертёж нужен, чтобы найти тангенс угла между прямой $B_1D$ и плоскостью $ABC$?',
      model,
      ploskie,
      otvet: '1',
      podskazka: [
        {
          n: 2,
          vopros: 'Какой отрезок — проекция $B_1D$ на основание?',
          varianty: ['$BD$', '$AD$', '$B_1D_1$'],
          verno: 0,
          vyvod: 'Искомый угол — угол $B_1DB$, он при вершине $D$.',
        },
        PERP_OSNOVANIE,
        {
          n: 5,
          vopros: 'Чему равна диагональ основания $BD$?',
          varianty: ['$10$', '$8$', '$14$'],
          verno: 0,
          vyvod: 'Тройка $6, 8, 10$.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник $B_1BD$', formuly: ['BB_1 \\perp (ABC)\\ \\Rightarrow\\ \\angle B_1BD = 90^\\circ'] },
        { etap: 'Катеты', formuly: ['BD = \\sqrt{8^2 + 6^2} = 10,\\quad BB_1 = 15'] },
      ],
      uchenik: [
        { n: 2, chto: 'Проекция $B_1D$ на основание — $BD$, искомый угол — при вершине $D$.' },
        { n: 3, chto: 'Ребро $BB_1$ перпендикулярно основанию: прямой угол при $B$.' },
        {
          n: 4,
          chto: 'Катеты — $BD = 10$ (не ребро $8$) и $BB_1 = 15$, отмечен угол при $D$. На первом чертеже отмечен угол при $B_1$ — это угол с вертикальным ребром, а не с основанием.',
        },
      ],
      pereschet: () => {
        const BD = Math.round(dist(v('B'), v('D')));
        return String(ploskie.findIndex((p) => p.vershiny[1] === 'D' && p.iskomoe === 'ugolB' && p.podpisi.a === String(BD)));
      },
    });
  }

  /* 7. Тангенс угла между B₁D и основанием: 9, 12, 6. */
  {
    const { model, v } = parallelepiped(9, 12, 6, { alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁: AB = 9, BC = 12, CC₁ = 6, диагональ B₁D' }, true);
    out.push({
      id: 'o3-10-07',
      kratko: 'Тангенс угла с основанием',
      rabochaya: { points: [v('B1'), v('B'), v('D')], pryamoy: v('B') },
      blok: 'ugly',
      uroven: 2,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'В прямоугольном параллелепипеде $ABCDA_1B_1C_1D_1$ известно, что $AB = 9$, $BC = 12$, $CC_1 = 6$. Найдите тангенс угла между прямой $B_1D$ и плоскостью $ABC$.',
      model,
      otvet: '0,4',
      podskazka: [
        {
          n: 2,
          vopros: 'В каком треугольнике искомый угол — острый угол при $D$?',
          varianty: ['$B_1BD$', '$B_1AD$', '$B_1CD$'],
          verno: 0,
          vyvod: '$BD$ — проекция $B_1D$ на основание.',
        },
        PERP_OSNOVANIE,
        {
          n: 4,
          vopros: 'Тангенс угла $B_1DB$ — это…',
          varianty: ['$\\dfrac{BB_1}{BD}$', '$\\dfrac{BD}{BB_1}$', '$\\dfrac{BB_1}{B_1D}$'],
          verno: 0,
          vyvod: 'Противолежащий катет делим на прилежащий.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник $B_1BD$', formuly: ['BB_1 \\perp (ABC)\\ \\Rightarrow\\ \\angle B_1BD = 90^\\circ'] },
        { etap: 'Тангенс', formuly: ['BD = \\sqrt{9^2 + 12^2} = 15', '\\operatorname{tg}\\angle B_1DB = \\dfrac{6}{15} = 0{,}4'] },
      ],
      uchenik: [
        { n: 2, chto: 'Проекция $B_1D$ на основание — диагональ $BD$, угол с плоскостью — $\\angle B_1DB$.' },
        { n: 3, chto: 'Ребро $BB_1 = CC_1 = 6$ перпендикулярно основанию: прямой угол при $B$.' },
        { n: 5, chto: 'Тройка $9, 12, 15$, затем противолежащий катет на прилежащий.', formula: '\\operatorname{tg}\\angle B_1DB = \\dfrac{6}{15} = 0{,}4' },
      ],
      pereschet: () => {
        const u = raz(v('D'), v('B1'));
        return okr(Math.abs(u[2]) / Math.hypot(u[0], u[1]));
      },
    });
  }

  /* 8. Шестиугольная призма: угол между AC и E₁F₁. */
  {
    const { body, v } = shestigrannik(4, 5);
    out.push({
      id: 'o3-10-08',
      kratko: 'Малая диагональ и сторона',
      blok: 'ugly',
      uroven: 2,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'В правильной шестиугольной призме $ABCDEFA_1B_1C_1D_1E_1F_1$ найдите угол между прямыми $AC$ и $E_1F_1$. Ответ дайте в градусах.',
      model: {
        alt: 'Правильная шестиугольная призма ABCDEFA₁B₁C₁D₁E₁F₁ с диагональю основания AC',
        bodies: [body],
        lines: [{ a: v('A'), b: v('C') }],
      },
      otvet: '30',
      podskazka: [
        PERENOS,
        {
          n: 2,
          vopros: 'Какой стороне нижнего основания параллельна $E_1F_1$?',
          varianty: ['$BC$ — противоположной стороне', '$AB$', '$CD$'],
          verno: 0,
          vyvod: '$E_1F_1 \\parallel EF \\parallel BC$: искомый угол — угол $ACB$ треугольника $ABC$.',
        },
        {
          n: 4,
          vopros: 'Какой треугольник $ABC$?',
          varianty: ['Равнобедренный с углом $120^\\circ$ при $B$', 'Правильный', 'Прямоугольный с прямым углом при $B$'],
          verno: 0,
          vyvod: '$AB = BC$ — стороны шестиугольника, угол между ними — угол шестиугольника.',
        },
      ],
      uchitel: [
        { etap: 'Перенос', formuly: ['E_1F_1 \\parallel EF \\parallel BC\\ \\Rightarrow\\ \\angle(AC, E_1F_1) = \\angle ACB'] },
        { etap: 'Треугольник $ABC$', formuly: ['AB = BC,\\ \\angle ABC = 120^\\circ', '\\angle ACB = \\dfrac{180^\\circ - 120^\\circ}{2} = 30^\\circ'] },
      ],
      uchenik: [
        { n: 1, chto: 'Призма правильная: в основаниях правильные шестиугольники, противоположные стороны параллельны.' },
        { n: 2, chto: 'Переносим $E_1F_1$ в нижнее основание: $E_1F_1 \\parallel EF$, а $EF \\parallel BC$. Теперь угол — между $AC$ и $BC$.', formula: '\\angle(AC, E_1F_1) = \\angle ACB' },
        { n: 5, chto: 'Треугольник $ABC$ равнобедренный, угол при вершине $B$ — угол шестиугольника.', formula: '\\angle ACB = (180^\\circ - 120^\\circ) : 2 = 30^\\circ' },
      ],
      pereschet: () => ugol(v('A'), v('C'), v('E1'), v('F1')),
    });
  }

  /* 9. Куб: скрещивающиеся B₁D₁ и A₁B. */
  {
    const { body, v } = kub(4);
    out.push({
      id: 'o3-10-09',
      kratko: 'Скрещивающиеся диагонали граней',
      blok: 'ugly',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie: 'В кубе $ABCDA_1B_1C_1D_1$ найдите угол между прямыми $B_1D_1$ и $A_1B$. Ответ дайте в градусах.',
      model: {
        alt: 'Куб ABCDA₁B₁C₁D₁ с диагоналями граней B₁D₁ и A₁B',
        bodies: [body],
        lines: [
          { a: v('B1'), b: v('D1') },
          { a: v('A1'), b: v('B') },
        ],
      },
      otvet: '60',
      podskazka: [
        PERENOS,
        {
          n: 2,
          vopros: 'Какой отрезок через точку $B$ параллелен $B_1D_1$?',
          varianty: ['$BD$', '$BC_1$', '$BA$'],
          verno: 0,
          vyvod: '$BB_1D_1D$ — прямоугольник, $B_1D_1 \\parallel BD$. Угол ищем между $A_1B$ и $BD$.',
        },
        {
          n: 4,
          vopros: 'Какой треугольник $A_1BD$?',
          varianty: ['Правильный', 'Прямоугольный с прямым углом при $B$', 'Равнобедренный с прямым углом при $A_1$'],
          verno: 0,
          vyvod: '$A_1B$, $BD$ и $A_1D$ — диагонали равных квадратов.',
        },
      ],
      uchitel: [
        { etap: 'Перенос', formuly: ['B_1D_1 \\parallel BD\\ \\Rightarrow\\ \\angle(B_1D_1, A_1B) = \\angle A_1BD'] },
        { etap: 'Треугольник $A_1BD$', formuly: ['A_1B = BD = A_1D = a\\sqrt2\\ \\Rightarrow\\ \\angle A_1BD = 60^\\circ'] },
      ],
      uchenik: [
        { n: 2, chto: 'Прямые не пересекаются. $BB_1D_1D$ — прямоугольник, поэтому переносим $B_1D_1$ в $BD$: теперь прямые пересекаются в $B$.', formula: 'B_1D_1 \\parallel BD' },
        { n: 4, chto: 'Достраиваем треугольник $A_1BD$: все стороны — диагонали граней куба, он правильный.' },
        { n: 5, chto: 'Все углы правильного треугольника равны.', formula: '\\angle A_1BD = 60^\\circ' },
      ],
      pereschet: () => ugol(v('B1'), v('D1'), v('A1'), v('B')),
    });
  }

  /* 10. Шестиугольная призма: тангенс угла между CC₁ и AD₁. */
  {
    const { body, v } = shestigrannik(3, 4);
    out.push({
      id: 'o3-10-10',
      kratko: 'Тангенс угла в призме',
      rabochaya: { points: [v('A'), v('D'), v('D1')], pryamoy: v('D') },
      blok: 'ugly',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'В правильной шестиугольной призме $ABCDEFA_1B_1C_1D_1E_1F_1$ сторона основания равна $3$, боковое ребро равно $4$. Найдите тангенс угла между прямыми $CC_1$ и $AD_1$.',
      model: {
        alt: 'Правильная шестиугольная призма: сторона основания 3, боковое ребро 4, отрезок AD₁',
        bodies: [body],
        lines: [{ a: v('A'), b: v('D1') }],
        measures: [
          { a: v('A'), b: v('B'), text: '3' },
          { a: v('A'), b: v('A1'), text: '4' },
        ],
      },
      otvet: '1,5',
      podskazka: [
        {
          n: 2,
          vopros: 'Какое ребро параллельно $CC_1$ и пересекает $AD_1$?',
          varianty: ['$DD_1$', '$BB_1$', '$CD$'],
          verno: 0,
          vyvod: 'Все боковые рёбра параллельны. $DD_1$ и $AD_1$ пересекаются в $D_1$: угол ищем в треугольнике $ADD_1$.',
        },
        {
          n: 3,
          vopros: 'Где прямой угол в треугольнике $ADD_1$?',
          varianty: ['При $D$: ребро $DD_1$ перпендикулярно основанию', 'При $A$', 'При $D_1$'],
          verno: 0,
          vyvod: 'Искомый угол — $\\angle AD_1D$, противолежащий катет — $AD$.',
        },
        {
          n: 5,
          vopros: 'Чему равна большая диагональ $AD$?',
          varianty: ['$6$', '$3\\sqrt3$', '$3$'],
          verno: 0,
          vyvod: 'Шестиугольник — шесть правильных треугольников, $AD$ — две их стороны.',
        },
      ],
      uchitel: [
        { etap: 'Перенос', formuly: ['CC_1 \\parallel DD_1\\ \\Rightarrow\\ \\angle(CC_1, AD_1) = \\angle AD_1D'] },
        {
          etap: 'Рабочий треугольник $ADD_1$',
          formuly: ['DD_1 \\perp (ABC)\\ \\Rightarrow\\ \\angle ADD_1 = 90^\\circ', 'AD = 2\\cdot 3 = 6', '\\operatorname{tg}\\angle AD_1D = \\dfrac{AD}{DD_1} = \\dfrac{6}{4} = 1{,}5'],
        },
      ],
      uchenik: [
        { n: 2, chto: 'Прямые $CC_1$ и $AD_1$ скрещиваются. Переносим $CC_1$ в параллельное ему ребро $DD_1$ — оно проходит через точку $D_1$ прямой $AD_1$.', formula: 'CC_1 \\parallel DD_1' },
        { n: 3, chto: 'Ребро $DD_1$ перпендикулярно основанию, $AD$ лежит в основании: угол $ADD_1$ прямой.' },
        { n: 4, chto: 'Угол при $D_1$: противолежащий катет — $AD$, прилежащий — $DD_1$. Не перепутать с углом при $A$.' },
        { n: 5, chto: 'Большая диагональ — две стороны шестиугольника.', formula: '\\operatorname{tg}\\angle AD_1D = \\dfrac{6}{4} = 1{,}5' },
      ],
      pereschet: () => {
        const c = cosPryamyh(v('C'), v('C1'), v('A'), v('D1'));
        return okr(Math.sqrt(1 - c * c) / c);
      },
    });
  }

  /* От простых к сложным: по уровню, внутри уровня — как написаны.
     Ключ — по месту в блоке. */
  return out
    .map((z, at) => ({ z, at }))
    .sort((p, q) => p.z.uroven - q.z.uroven || p.at - q.at)
    .map(({ z }, i) => ({ ...z, id: `o3-10-${String(i + 1).padStart(2, '0')}` }));
}
