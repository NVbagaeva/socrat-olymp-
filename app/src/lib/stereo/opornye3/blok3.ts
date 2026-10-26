/**
 * Опорные задачи №3, блок 3 «Пирамида». Умение — читать пирамиду:
 * куда падает высота, где апофема, а где боковое ребро, и какой из двух
 * рабочих треугольников с прямым углом при центре основания нужен.
 * Термины — как в главе 3 («Пирамида: куда проецируется вершина,
 * апофема»). Числа свои, ответы — по пифагоровым тройкам.
 *
 * У каждой задачи — пересчёт ответа по координатам того же чертежа
 * (pereschet): автотест сверяет его с ответом.
 */

import { dir, polygonStart, pyramid, regularPolygon, regularPyramid, vertex } from '../../solid/figures';
import type { Polyhedron } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';
import type { ShagPodskazki, ZadachaOp3 } from './tipy';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const dot = (u: Vec3, v: Vec3) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
const cross = (u: Vec3, v: Vec3): Vec3 => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const mid = (a: Vec3, b: Vec3): Vec3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
const okr = (x: number) => Math.round(x * 1e6) / 1e6;
const pryamoy = (a: Vec3, o: Vec3, b: Vec3) => Math.abs(dot(dir(o, a), dir(o, b))) < 1e-9;

/** Ракурс пониже — для пирамид, у которых высота меньше основания (как в главе 3). */
const NIZKO = { azimuth: 28, elevation: 14 };

/* ── Общие шаги подсказок ───────────────────────────────────────── */

const PERP_VYSOTA: ShagPodskazki = {
  n: 3,
  vopros: 'Почему угол при $O$ прямой?',
  varianty: [
    'Высота $SO$ перпендикулярна плоскости основания, а другой катет лежит в этой плоскости',
    'Боковые рёбра правильной пирамиды равны',
    'На чертеже угол выглядит прямым',
  ],
  verno: 0,
  vyvod: 'Прямая, перпендикулярная плоскости, перпендикулярна любой прямой в этой плоскости.',
};

/* ── Чертежи ────────────────────────────────────────────────────── */

/** Правильная четырёхугольная пирамида SABCD: сторона s, высота h; O — центр, M — середина AB. */
function piramida4(s: number, h: number) {
  const body = pyramid(regularPolygon(4, s / Math.SQRT2, 0, polygonStart(4)), [0, 0, h]);
  const v = (n: string) => vertex(body, n);
  const O: Vec3 = [0, 0, 0];
  const M = mid(v('A'), v('B'));
  return { body, v, O, M, S: v('S') };
}

/** Площадь боковой поверхности: сумма площадей граней при вершине (вершина — n-я). */
function bokovaya(body: Polyhedron, n: number): number {
  const S = body.vertices[n] as Vec3;
  let sum = 0;
  for (let k = 0; k < n; k += 1) {
    const a = body.vertices[k] as Vec3;
    const b = body.vertices[(k + 1) % n] as Vec3;
    sum += Math.hypot(...cross(dir(S, a), dir(S, b))) / 2;
  }
  return sum;
}

/* ── Задачи ─────────────────────────────────────────────────────── */

export function zadachiBloka3(): ZadachaOp3[] {
  const out: ZadachaOp3[] = [];

  /* 1. Нажми: апофема грани SAB. */
  {
    const { body, v, O, M, S } = piramida4(6, 5);
    const celi = [
      { id: 'SA', points: [S, v('A')], label: '$SA$' },
      { id: 'SO', points: [S, O], label: '$SO$' },
      { id: 'SM', points: [S, M], label: '$SM$' },
      { id: 'OM', points: [O, M], label: '$OM$' },
    ];
    out.push({
      id: 'o3-3-01',
      kratko: 'Где апофема',
      rabochaya: { points: [S, M, v('A')], pryamoy: M },
      blok: 'piramida',
      uroven: 1,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie:
        'В правильной пирамиде $SABCD$ точка $O$ — центр основания, $M$ — середина ребра $AB$. Нажмите на чертеже на апофему боковой грани $SAB$.',
      model: {
        alt: 'Правильная четырёхугольная пирамида SABCD, центр основания O, середина M ребра AB, отрезки SO, SM и OM',
        bodies: [body],
        rakurs: NIZKO,
        marks: [
          { p: O, label: 'O' },
          { p: M, label: 'M' },
        ],
        lines: [
          { a: S, b: O },
          { a: S, b: M },
          { a: O, b: M },
        ],
      },
      celi,
      otvet: 'SM',
      podskazka: [
        {
          n: 1,
          vopros: 'В какой плоскости лежит апофема грани $SAB$?',
          varianty: ['В плоскости грани $SAB$', 'В плоскости основания', 'Внутри пирамиды, через центр $O$'],
          verno: 0,
          vyvod: 'Апофема — высота боковой грани, она лежит в самой грани.',
        },
        {
          n: 2,
          vopros: 'Куда приходит апофема на стороне $AB$?',
          varianty: ['В её середину', 'В вершину $A$', 'В центр основания'],
          verno: 0,
          vyvod: 'Грань $SAB$ — равнобедренный треугольник, его высота из $S$ — и медиана.',
        },
      ],
      uchitel: [
        { etap: 'Апофема', formuly: ['SA = SB\\ \\Rightarrow\\ SM \\perp AB,\\ \\ AM = MB'] },
        { etap: 'Не путать', formuly: ['SA\\ \\text{— боковое ребро},\\ SO\\ \\text{— высота},\\ OM\\ \\text{— в основании}'] },
      ],
      uchenik: [
        { n: 1, chto: 'Апофема — высота боковой грани, проведённая из вершины $S$. Она лежит в грани $SAB$, поэтому $SO$ и $OM$ отпадают.' },
        { n: 2, chto: 'Грань равнобедренная, высота из $S$ падает в середину $AB$ — это $SM$. Ребро $SA$ тоже лежит в грани, но оно не перпендикулярно $AB$.', formula: 'SM \\perp AB' },
      ],
      pereschet: () => {
        const ab = dir(v('A'), v('B'));
        const found = celi.find((c) => {
          const [p, q] = c.points as [Vec3, Vec3];
          const naAB = Math.hypot(...cross(dir(v('A'), q), ab)) < 1e-9;
          return p === S && naAB && Math.abs(dot(dir(p, q), ab)) < 1e-9;
        });
        return found?.id ?? '';
      },
    });
  }

  /* 2. Куда падает высота правильной пирамиды. */
  {
    const { body, v } = piramida4(6, 7);
    const varianty = [
      'В точку пересечения диагоналей основания',
      'В середину стороны $AB$',
      'В вершину основания $A$',
      'В точку пересечения диагоналей, только если все рёбра пирамиды равны',
    ];
    out.push({
      id: 'o3-3-02',
      kratko: 'Куда падает высота',
      blok: 'piramida',
      uroven: 1,
      istochnik: 'new',
      vid: 'vybor',
      uslovie: 'Куда падает высота правильной четырёхугольной пирамиды $SABCD$, проведённая из вершины $S$?',
      model: { alt: 'Правильная четырёхугольная пирамида SABCD без высоты', bodies: [body] },
      varianty,
      otvet: '0',
      podskazka: [
        {
          n: 1,
          vopros: 'Что значит «правильная пирамида»?',
          varianty: [
            'В основании правильный многоугольник, вершина проецируется в его центр',
            'Все рёбра пирамиды равны',
            'Боковые грани — прямоугольные треугольники',
          ],
          verno: 0,
          vyvod: 'Высота правильной пирамиды падает в центр основания.',
        },
        {
          n: 1,
          vopros: 'Где центр квадрата?',
          varianty: ['В точке пересечения диагоналей', 'В середине стороны', 'В вершине'],
          verno: 0,
          vyvod: 'Центр квадрата — точка пересечения его диагоналей.',
        },
      ],
      uchitel: [{ etap: 'Центр основания', formuly: ['SO \\perp (ABC),\\ \\ O = AC \\cap BD'] }],
      uchenik: [
        { n: 1, chto: 'У правильной пирамиды вершина проецируется в центр основания. Для квадрата это точка пересечения диагоналей $O$.', formula: 'O = AC \\cap BD' },
        { n: 2, chto: 'В середину стороны приходит апофема, в вершину — боковое ребро: это не высота. Равенство всех рёбер не нужно — хватает правильности.' },
      ],
      pereschet: () => {
        const S = v('S');
        const proekciya: Vec3 = [S[0], S[1], 0];
        return dist(proekciya, mid(v('A'), v('C'))) < 1e-9 ? '0' : '?';
      },
    });
  }

  /* 3. Апофема по высоте и стороне: 10 и 12. */
  {
    const { body, v, O, M, S } = piramida4(10, 12);
    out.push({
      id: 'o3-3-03',
      kratko: 'Апофема по высоте',
      rabochaya: { points: [S, O, M], pryamoy: O },
      blok: 'piramida',
      uroven: 1,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Сторона основания правильной четырёхугольной пирамиды $SABCD$ равна $10$, высота $SO = 12$. Найдите апофему $SM$, где $M$ — середина $AB$.',
      model: {
        alt: 'Правильная четырёхугольная пирамида SABCD, высота SO = 12, сторона основания 10, апофема SM',
        bodies: [body],
        marks: [
          { p: O, label: 'O' },
          { p: M, label: 'M' },
        ],
        lines: [
          { a: S, b: O },
          { a: S, b: M },
        ],
        measures: [
          { a: v('B'), b: v('C'), text: '10' },
          { a: S, b: O, text: '12' },
        ],
      },
      otvet: '13',
      podskazka: [
        {
          n: 2,
          vopros: 'В каком треугольнике апофема $SM$ — гипотенуза, а высота — катет?',
          varianty: ['$SOM$', '$SOA$', '$SMA$'],
          verno: 0,
          vyvod: 'Второй катет — $OM$, от центра до середины стороны.',
        },
        PERP_VYSOTA,
        {
          n: 5,
          vopros: 'Чему равен катет $OM$?',
          varianty: ['Половине стороны', 'Стороне', 'Половине диагонали'],
          verno: 0,
          vyvod: '$OM = 5$; катеты $5$ и $12$ — знакомая пифагорова тройка.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник $SOM$', formuly: ['SO \\perp (ABC) \\Rightarrow \\angle SOM = 90^\\circ', 'OM = \\frac{1}{2}AD = 5'] },
        { etap: 'Счёт', formuly: ['SM = \\sqrt{5^2 + 12^2} = 13'] },
      ],
      uchenik: [
        { n: 1, chto: 'Пирамида правильная: высота падает в центр квадрата $O$.' },
        { n: 2, chto: 'Высота и апофема — в треугольнике $SOM$; апофема в нём гипотенуза.' },
        { n: 3, chto: '$SO$ перпендикулярна основанию, $OM$ лежит в основании.', formula: '\\angle SOM = 90^\\circ' },
        { n: 5, chto: '$OM$ — половина стороны, дальше тройка $5, 12, 13$.', formula: 'SM^2 = 25 + 144 = 169,\\quad SM = 13' },
      ],
      pereschet: () => okr(dist(S, M)),
    });
  }

  /* 4. Плоский чертёж: треугольник в боковой грани, сторона 16, ребро 17. */
  {
    const { body, v, M, S } = piramida4(16, Math.sqrt(17 ** 2 - 2 * 8 ** 2));
    const ploskie = [
      { vershiny: ['O', 'M', 'S'] as const, kateti: [8, 15] as const, podpisi: { a: '8', b: '?', c: '17' }, iskomoe: 'b' as const, alt: 'Прямой угол при O, катет OM = 8, гипотенуза SM = 17, катет SO — искомый' },
      { vershiny: ['M', 'A', 'S'] as const, kateti: [8, 17] as const, podpisi: { a: '8', b: '17', c: '?' }, iskomoe: 'c' as const, alt: 'Прямой угол при M, катеты MA = 8 и MS = 17, гипотенуза SA — искомая' },
      { vershiny: ['M', 'A', 'S'] as const, kateti: [8, 15] as const, podpisi: { a: '8', b: '?', c: '17' }, iskomoe: 'b' as const, alt: 'Прямой угол при M, катет MA = 8, гипотенуза SA = 17, катет SM — искомый' },
    ];
    out.push({
      id: 'o3-3-04',
      kratko: 'Треугольник в боковой грани',
      rabochaya: { points: [M, v('A'), S], pryamoy: M },
      blok: 'piramida',
      uroven: 2,
      istochnik: 'new',
      vid: 'ploskiy',
      uslovie:
        'В правильной пирамиде $SABCD$ сторона основания равна $16$, боковое ребро $SA = 17$, $M$ — середина $AB$. Какой плоский чертёж — рабочий треугольник для нахождения апофемы $SM$?',
      model: {
        alt: 'Правильная четырёхугольная пирамида SABCD, сторона основания 16, боковое ребро SA = 17, апофема SM',
        bodies: [body],
        rakurs: NIZKO,
        marks: [{ p: M, label: 'M' }],
        lines: [{ a: S, b: M }],
        measures: [
          { a: v('B'), b: v('C'), text: '16' },
          { a: S, b: v('A'), text: '17' },
        ],
      },
      ploskie,
      otvet: '2',
      podskazka: [
        {
          n: 2,
          vopros: 'Где лежат апофема $SM$ и ребро $SA$?',
          varianty: ['Обе в боковой грани $SAB$', 'Обе в плоскости $SOA$', 'Апофема в основании'],
          verno: 0,
          vyvod: 'Рабочий треугольник — $SMA$ в боковой грани, высота здесь не нужна.',
        },
        {
          n: 3,
          vopros: 'Где в треугольнике $SMA$ прямой угол?',
          varianty: ['При $M$', 'При $S$', 'При $A$'],
          verno: 0,
          vyvod: 'Апофема перпендикулярна стороне основания.',
        },
        {
          n: 4,
          vopros: 'Какая сторона треугольника $SMA$ — гипотенуза?',
          varianty: ['Боковое ребро $SA$', 'Апофема $SM$', 'Половина стороны $MA$'],
          verno: 0,
          vyvod: 'Апофема — катет, боковое ребро — гипотенуза.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник $SMA$', formuly: ['SA = SB \\Rightarrow SM \\perp AB,\\ \\ MA = \\frac{1}{2}AB = 8', 'SA = 17\\ \\text{— гипотенуза}'] },
      ],
      uchenik: [
        { n: 2, chto: 'Известны ребро $SA$ и сторона $AB$ — оба в грани $SAB$. Апофема там же, значит, рабочий треугольник $SMA$.' },
        { n: 3, chto: 'Грань равнобедренная, апофема — её высота: угол при $M$ прямой.', formula: '\\angle SMA = 90^\\circ' },
        { n: 4, chto: 'Против прямого угла — ребро $SA = 17$, катеты $MA = 8$ и искомая апофема. На первом чертеже ребро перепутано с апофемой, на втором ребро стало катетом.' },
      ],
      pereschet: () => {
        const SA = Math.round(dist(S, v('A')));
        const MA = Math.round(dist(M, v('A')));
        if (!pryamoy(S, M, v('A'))) return '?';
        const at = ploskie.findIndex(
          (p) => p.vershiny[0] === 'M' && p.vershiny[1] === 'A' && p.kateti[0] === MA && p.podpisi.c === String(SA) && p.podpisi.b === '?',
        );
        return String(at);
      },
    });
  }

  /* 5. Нажми: рабочий треугольник для бокового ребра по высоте и стороне. */
  {
    const { body, v, O, M, S } = piramida4(8, 7);
    const A = v('A');
    const celi = [
      { id: 'SOM', points: [S, O, M], label: 'треугольник $SOM$' },
      { id: 'SMA', points: [S, M, A], label: 'треугольник $SMA$' },
      { id: 'SOA', points: [S, O, A], label: 'треугольник $SOA$' },
    ];
    out.push({
      id: 'o3-3-05',
      kratko: 'Треугольник для бокового ребра',
      rabochaya: { points: [S, O, A], pryamoy: O },
      blok: 'piramida',
      uroven: 2,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie:
        'В правильной пирамиде $SABCD$ известны высота $SO$ и сторона основания. Нажмите на чертеже на рабочий треугольник, из которого сразу находится боковое ребро $SA$.',
      model: {
        alt: 'Правильная четырёхугольная пирамида SABCD: высота SO, середина M ребра AB, отрезки OA, OM и SM',
        bodies: [body],
        marks: [
          { p: O, label: 'O' },
          { p: M, label: 'M' },
        ],
        lines: [
          { a: S, b: O },
          { a: O, b: A },
          { a: O, b: M },
          { a: S, b: M },
        ],
      },
      celi,
      otvet: 'SOA',
      podskazka: [
        {
          n: 2,
          vopros: 'Какие из треугольников содержат ребро $SA$?',
          varianty: ['$SOA$ и $SMA$', 'Только $SOM$', 'Все три'],
          verno: 0,
          vyvod: 'В треугольнике $SOM$ бокового ребра нет.',
        },
        {
          n: 2,
          vopros: 'Чего не хватает в треугольнике $SMA$?',
          varianty: ['Апофемы $SM$ — она неизвестна', 'Стороны $MA$ — она неизвестна', 'Прямого угла'],
          verno: 0,
          vyvod: 'Высота в треугольник $SMA$ не входит, а в $SOA$ входит.',
        },
        PERP_VYSOTA,
      ],
      uchitel: [
        { etap: 'Рабочий треугольник $SOA$', formuly: ['SO \\perp (ABC) \\Rightarrow \\angle SOA = 90^\\circ', 'OA = \\frac{1}{2}AC,\\quad SA^2 = SO^2 + OA^2'] },
      ],
      uchenik: [
        { n: 2, chto: 'Нужен треугольник, где есть и высота $SO$, и ребро $SA$, а третья сторона считается по стороне основания. Это $SOA$: $OA$ — половина диагонали квадрата.' },
        { n: 3, chto: 'Высота перпендикулярна основанию, $OA$ лежит в нём. В $SOM$ нет ребра $SA$, в $SMA$ нет высоты — пришлось бы сначала искать апофему.', formula: '\\angle SOA = 90^\\circ' },
      ],
      pereschet: () => {
        const found = celi.find((c) => {
          const [p, q, r] = c.points as [Vec3, Vec3, Vec3];
          const est = (x: Vec3) => [p, q, r].includes(x);
          return est(S) && est(A) && est(O) && pryamoy(p, q, r);
        });
        return found?.id ?? '';
      },
    });
  }

  /* 6. Высота по боковому ребру и стороне: 8√2 и 17. */
  {
    const { body, v, O, S } = piramida4(8 * Math.SQRT2, 15);
    out.push({
      id: 'o3-3-06',
      kratko: 'Высота по боковому ребру',
      rabochaya: { points: [S, O, v('A')], pryamoy: O },
      blok: 'piramida',
      uroven: 2,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Сторона основания правильной четырёхугольной пирамиды $SABCD$ равна $8\\sqrt{2}$, боковое ребро равно $17$. Найдите высоту пирамиды.',
      model: {
        alt: 'Правильная четырёхугольная пирамида SABCD, сторона основания 8√2, боковое ребро SA = 17, высота SO',
        bodies: [body],
        marks: [{ p: O, label: 'O' }],
        lines: [{ a: S, b: O }],
        measures: [
          { a: v('B'), b: v('C'), text: '8√2' },
          { a: S, b: v('A'), text: '17' },
        ],
      },
      otvet: '15',
      podskazka: [
        {
          n: 2,
          vopros: 'В каком треугольнике есть и высота, и боковое ребро?',
          varianty: ['$SOA$', '$SOM$, $M$ — середина $AB$', '$SAB$'],
          verno: 0,
          vyvod: 'Гипотенуза — ребро $SA$, катеты — высота и половина диагонали $OA$.',
        },
        PERP_VYSOTA,
        {
          n: 5,
          vopros: 'Чему равна диагональ квадрата со стороной $8\\sqrt{2}$?',
          varianty: ['$16$', '$8$', '$8\\sqrt{2}$'],
          verno: 0,
          vyvod: 'Диагональ — сторона, умноженная на $\\sqrt{2}$; половина диагонали $OA = 8$.',
        },
      ],
      uchitel: [
        { etap: 'Основание', formuly: ['AC = 8\\sqrt{2}\\cdot\\sqrt{2} = 16,\\quad OA = 8'] },
        { etap: 'Рабочий треугольник $SOA$', formuly: ['SO \\perp (ABC) \\Rightarrow \\angle SOA = 90^\\circ', 'SO = \\sqrt{17^2 - 8^2} = 15'] },
      ],
      uchenik: [
        { n: 1, chto: 'Высота правильной пирамиды падает в центр квадрата $O$ — точку пересечения диагоналей.' },
        { n: 2, chto: 'Рабочий треугольник — $SOA$: ребро $SA$ в нём гипотенуза.' },
        { n: 3, chto: 'Высота перпендикулярна основанию, $OA$ лежит в нём.', formula: '\\angle SOA = 90^\\circ' },
        { n: 5, chto: 'Половина диагонали — $8$, дальше тройка $8, 15, 17$.', formula: 'SO^2 = (17 - 8)(17 + 8) = 225,\\quad SO = 15' },
      ],
      pereschet: () => okr(dist(S, O)),
    });
  }

  /* 7. Шестиугольная пирамида: сторона 7, высота 24 → ребро. */
  {
    const body = regularPyramid(6, 7, 24);
    const v = (n: string) => vertex(body, n);
    const S = v('S');
    const O: Vec3 = [0, 0, 0];
    out.push({
      id: 'o3-3-07',
      kratko: 'Шестиугольная пирамида',
      rabochaya: { points: [S, O, v('A')], pryamoy: O },
      blok: 'piramida',
      uroven: 2,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Сторона основания правильной шестиугольной пирамиды $SABCDEF$ равна $7$, высота $SO = 24$. Найдите боковое ребро $SA$.',
      model: {
        alt: 'Правильная шестиугольная пирамида SABCDEF, сторона основания 7, высота SO = 24',
        bodies: [body],
        marks: [{ p: O, label: 'O' }],
        lines: [{ a: S, b: O }],
        measures: [
          { a: v('A'), b: v('B'), text: '7' },
          { a: S, b: O, text: '24' },
        ],
      },
      otvet: '25',
      podskazka: [
        {
          n: 2,
          vopros: 'Какой треугольник — рабочий для ребра $SA$?',
          varianty: ['$SOA$', '$SAB$', '$SOM$, $M$ — середина $AB$'],
          verno: 0,
          vyvod: 'Катеты — высота $SO$ и отрезок $OA$ от центра до вершины.',
        },
        PERP_VYSOTA,
        {
          n: 5,
          vopros: 'Чему равно $OA$ в правильном шестиугольнике со стороной $7$?',
          varianty: ['$7$', '$14$', '$3{,}5$'],
          verno: 0,
          vyvod: 'Шестиугольник — шесть правильных треугольников с вершиной $O$: $OA$ равно стороне.',
        },
      ],
      uchitel: [
        { etap: 'Основание', formuly: ['\\triangle OAB\\ \\text{— правильный} \\Rightarrow OA = AB = 7'] },
        { etap: 'Рабочий треугольник $SOA$', formuly: ['SO \\perp (ABC) \\Rightarrow \\angle SOA = 90^\\circ', 'SA = \\sqrt{7^2 + 24^2} = 25'] },
      ],
      uchenik: [
        { n: 1, chto: 'Высота падает в центр шестиугольника $O$.' },
        { n: 2, chto: 'Рабочий треугольник $SOA$, ребро $SA$ — гипотенуза.' },
        { n: 3, chto: 'Высота перпендикулярна основанию, $OA$ лежит в нём.', formula: '\\angle SOA = 90^\\circ' },
        { n: 5, chto: 'От центра до вершины правильного шестиугольника — ровно сторона. Тройка $7, 24, 25$.', formula: 'SA^2 = 49 + 576 = 625,\\quad SA = 25' },
      ],
      pereschet: () => okr(dist(S, v('A'))),
    });
  }

  /* 8. Треугольная пирамида: катет апофемы — треть медианы. */
  {
    const body = regularPyramid(3, 6, 4);
    const v = (n: string) => vertex(body, n);
    const S = v('S');
    const O: Vec3 = [0, 0, 0];
    const A = v('A');
    const K = mid(v('B'), v('C'));
    const varianty = ['$OK = \\frac{1}{3}AK$', '$OK = \\frac{1}{2}AK$', '$OK = \\frac{2}{3}AK$', '$OK = AK$'];
    const doli = [1 / 3, 1 / 2, 2 / 3, 1];
    out.push({
      id: 'o3-3-08',
      kratko: 'Катет апофемы в треугольной',
      rabochaya: { points: [S, O, K], pryamoy: O },
      blok: 'piramida',
      uroven: 3,
      istochnik: 'new',
      vid: 'vybor',
      uslovie:
        'В правильной треугольной пирамиде $SABC$ точка $O$ — центр основания, $K$ — середина $BC$, $SK$ — апофема. Чему равен катет $OK$ рабочего треугольника $SOK$?',
      model: {
        alt: 'Правильная треугольная пирамида SABC, высота SO, медиана основания AK, апофема SK',
        bodies: [body],
        rakurs: NIZKO,
        marks: [
          { p: O, label: 'O' },
          { p: K, label: 'K' },
        ],
        lines: [
          { a: S, b: O },
          { a: A, b: K },
          { a: S, b: K },
        ],
      },
      varianty,
      otvet: '0',
      podskazka: [
        {
          n: 1,
          vopros: 'Что такое центр правильного треугольника?',
          varianty: ['Точка пересечения медиан', 'Середина медианы', 'Середина стороны'],
          verno: 0,
          vyvod: 'В правильном треугольнике медианы — и высоты, и биссектрисы; центр — их общая точка.',
        },
        {
          n: 2,
          vopros: 'В каком отношении точка пересечения медиан делит медиану, считая от вершины?',
          varianty: ['$2 : 1$', '$1 : 1$', '$1 : 2$'],
          verno: 0,
          vyvod: '$AO$ — две части, $OK$ — одна часть.',
        },
      ],
      uchitel: [
        { etap: 'Центр основания', formuly: ['O\\ \\text{— точка пересечения медиан},\\ \\ AO : OK = 2 : 1'] },
        { etap: 'Катеты', formuly: ['OK = \\frac{1}{3}AK\\ \\ (\\text{для апофемы}),\\qquad OA = \\frac{2}{3}AK\\ \\ (\\text{для ребра})'] },
      ],
      uchenik: [
        { n: 1, chto: 'Высота правильной треугольной пирамиды падает в точку пересечения медиан основания.' },
        { n: 2, chto: 'Медиана делится этой точкой $2 : 1$ от вершины. К середине стороны прилегает меньшая часть — треть медианы.', formula: 'OK = \\frac{1}{3}AK' },
        { n: 4, chto: 'Две трети медианы — это $OA$, катет для бокового ребра. Половина медианы получается, если перепутать центр с серединой медианы.' },
      ],
      pereschet: () => {
        const dolya = dist(O, K) / dist(A, K);
        return String(doli.findIndex((d) => Math.abs(d - dolya) < 1e-9));
      },
    });
  }

  /* 9. Треугольная пирамида: сторона 12√3, ребро 20 → высота. */
  {
    const body = regularPyramid(3, 12, 16);
    const v = (n: string) => vertex(body, n);
    const S = v('S');
    const O: Vec3 = [0, 0, 0];
    const A = v('A');
    out.push({
      id: 'o3-3-09',
      kratko: 'Высота треугольной пирамиды',
      rabochaya: { points: [S, O, A], pryamoy: O },
      blok: 'piramida',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Сторона основания правильной треугольной пирамиды $SABC$ равна $12\\sqrt{3}$, боковое ребро равно $20$. Найдите высоту пирамиды.',
      model: {
        alt: 'Правильная треугольная пирамида SABC, сторона основания 12√3, боковое ребро SA = 20, высота SO',
        bodies: [body],
        marks: [{ p: O, label: 'O' }],
        lines: [{ a: S, b: O }],
        measures: [
          { a: v('B'), b: v('C'), text: '12√3' },
          { a: S, b: A, text: '20' },
        ],
      },
      otvet: '16',
      podskazka: [
        {
          n: 2,
          vopros: 'Какой треугольник — рабочий?',
          varianty: ['$SOA$', '$SOK$, $K$ — середина $BC$', '$SBC$'],
          verno: 0,
          vyvod: 'Гипотенуза — ребро $SA$, катеты — высота и $OA$.',
        },
        PERP_VYSOTA,
        {
          n: 5,
          vopros: 'Какую часть медианы $AK$ составляет $OA$?',
          varianty: ['$\\frac{2}{3}$', '$\\frac{1}{2}$', '$\\frac{1}{3}$'],
          verno: 0,
          vyvod: 'Медиана правильного треугольника со стороной $12\\sqrt{3}$ равна $18$, две трети — $12$.',
        },
      ],
      uchitel: [
        { etap: 'Основание', formuly: ['AK = \\frac{\\sqrt{3}}{2}\\cdot 12\\sqrt{3} = 18,\\quad OA = \\frac{2}{3}\\cdot 18 = 12'] },
        { etap: 'Рабочий треугольник $SOA$', formuly: ['SO \\perp (ABC) \\Rightarrow \\angle SOA = 90^\\circ', 'SO = \\sqrt{20^2 - 12^2} = 16'] },
      ],
      uchenik: [
        { n: 1, chto: 'Высота падает в центр основания $O$ — точку пересечения медиан.' },
        { n: 2, chto: 'Рабочий треугольник $SOA$: ребро — гипотенуза, высота и $OA$ — катеты.' },
        { n: 3, chto: 'Высота перпендикулярна основанию, $OA$ лежит в нём.', formula: '\\angle SOA = 90^\\circ' },
        { n: 5, chto: 'Медиана (она же высота треугольника) — $18$. Центр делит её $2 : 1$, $OA = 12$. Тройка $12, 16, 20$ — это $3, 4, 5$, умноженная на $4$.', formula: 'SO^2 = (20 - 12)(20 + 12) = 256' },
      ],
      pereschet: () => okr(dist(S, O)),
    });
  }

  /* 10. Боковая поверхность через апофему: сторона 16, высота 6. */
  {
    const { body, v, O, M, S } = piramida4(16, 6);
    out.push({
      id: 'o3-3-10',
      kratko: 'Боковая поверхность',
      rabochaya: { points: [S, O, M], pryamoy: O },
      blok: 'piramida',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Сторона основания правильной четырёхугольной пирамиды $SABCD$ равна $16$, высота — $6$. Найдите площадь боковой поверхности пирамиды.',
      model: {
        alt: 'Правильная четырёхугольная пирамида SABCD, сторона основания 16, высота SO = 6',
        bodies: [body],
        rakurs: NIZKO,
        marks: [{ p: O, label: 'O' }],
        lines: [{ a: S, b: O }],
        measures: [
          { a: v('B'), b: v('C'), text: '16' },
          { a: S, b: O, text: '6' },
        ],
      },
      otvet: '320',
      podskazka: [
        {
          n: 4,
          vopros: 'Какой отрезок нужен для площади боковой грани?',
          varianty: ['Апофема', 'Высота пирамиды', 'Боковое ребро'],
          verno: 0,
          vyvod: 'Апофема — высота боковой грани: $S_{\\text{бок}} = \\frac{1}{2}P_{\\text{осн}}\\cdot l$.',
        },
        {
          n: 2,
          vopros: 'Из какого треугольника найти апофему?',
          varianty: ['$SOM$, $M$ — середина $AB$', '$SOA$', '$SAB$'],
          verno: 0,
          vyvod: 'Катеты — высота $SO$ и половина стороны $OM$.',
        },
        PERP_VYSOTA,
      ],
      uchitel: [
        { etap: 'Апофема из $SOM$', formuly: ['\\angle SOM = 90^\\circ,\\ \\ OM = 8', 'SM = \\sqrt{8^2 + 6^2} = 10'] },
        { etap: 'Боковая поверхность', formuly: ['S_{\\text{бок}} = \\frac{1}{2}\\cdot 64\\cdot 10 = 320'] },
      ],
      uchenik: [
        { n: 1, chto: 'Боковые грани — четыре равных равнобедренных треугольника с основанием $16$.' },
        { n: 4, chto: 'Высота боковой грани — апофема; высота пирамиды для площади грани не годится.', formula: 'S_{\\text{бок}} = \\frac{1}{2}P_{\\text{осн}}\\cdot SM' },
        { n: 3, chto: 'Апофема — гипотенуза треугольника $SOM$ с прямым углом при $O$, $M$ — середина $AB$.' },
        { n: 5, chto: '$OM = 8$, $SO = 6$ — тройка $6, 8, 10$. Периметр основания $64$.', formula: 'S_{\\text{бок}} = 32\\cdot 10' },
      ],
      pereschet: () => okr(bokovaya(body, 4)),
    });
  }

  /* От простых к сложным: по уровню, внутри уровня — как написаны.
     Ключ — по месту в блоке. */
  return out
    .map((z, at) => ({ z, at }))
    .sort((p, q) => p.z.uroven - q.z.uroven || p.at - q.at)
    .map(({ z }, i) => ({ ...z, id: `o3-3-${String(i + 1).padStart(2, '0')}` }));
}
