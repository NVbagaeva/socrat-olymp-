/**
 * База, задание №12, часть 1: чертежи условий.
 *
 * Чертёж строится движком планиметрии профиля (lib/planimetriya/render):
 * тот же вид, что у чертежей №1 профиля, — линии, дуги углов, штрихи
 * равенства, подписи вершин курсивом. Сцена — по числам задачи: углы и
 * длины настоящие, только слишком острый угол (меньше 14°) рисуется
 * шире, чтобы его было видно. Данные условия подписаны на чертеже,
 * искомое выделено цветом и отмечено «?».
 *
 * narisovat() проверяет результат: движок не нашёл нарушений (подписи
 * не налезают, фигура не вырождена), SVG разбирается — теги закрыты по
 * порядку, — и на нём есть все буквы вершин из условия. Ошибка —
 * исключение: такой чертёж не попадёт в банк.
 */

import { RAD, add, angleOf, intersect, mul, polar, rotate, sub } from '@/lib/planimetriya/geom';
import { pustoyOtchet, renderPlan } from '@/lib/planimetriya/render';
import { mn, otr, prod, pryam, shtrih, tri, ug } from '@/lib/planimetriya/stseny/dsl';
import type { Element, Scena, T2 } from '@/lib/planimetriya/types';

/** Наименьший угол на чертеже: острее — рисуется этот. */
const MIN_UGOL = 14;

/** Градусы для подписи на чертеже: «37°», «14,5°». */
const gr = (x: number): string => `${String(Math.round(x * 100) / 100).replace('.', ',')}°`;
const ch = (x: number): string => String(x).replace('.', ',');

/* ── Проверка SVG ─────────────────────────────────────────────── */

/**
 * SVG разбирается: каждый открытый тег закрыт в обратном порядке,
 * атрибуты в кавычках, корень — один <svg>. Возвращает тексты
 * элементов <text> (подписи).
 */
export function razobratSvg(svg: string): string[] {
  const stek: string[] = [];
  const teksty: string[] = [];
  const re = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>|([^<]+)/g;
  let pos = 0;
  let korney = 0;
  let tekushiyTekst: string[] | null = null;
  for (let m = re.exec(svg); m !== null; m = re.exec(svg)) {
    if (m.index !== pos) throw new Error(`SVG: не разобран кусок у ${pos}`);
    pos = re.lastIndex;
    const [, zakr, imya, , sam, tekst] = m;
    if (tekst !== undefined) {
      if (stek.length === 0) throw new Error('SVG: текст вне корня');
      if (tekushiyTekst !== null) tekushiyTekst.push(tekst);
      continue;
    }
    if (imya === undefined) continue;
    if (zakr === '/') {
      if (stek.pop() !== imya) throw new Error(`SVG: </${imya}> не по порядку`);
      if (imya === 'text' && tekushiyTekst !== null) {
        teksty.push(tekushiyTekst.join(''));
        tekushiyTekst = null;
      }
      continue;
    }
    if (stek.length === 0) {
      korney += 1;
      if (imya !== 'svg') throw new Error(`SVG: корень <${imya}>`);
    }
    if (sam === '/') continue;
    stek.push(imya);
    if (imya === 'text') tekushiyTekst = [];
  }
  if (pos !== svg.length) throw new Error('SVG: хвост не разобран');
  if (stek.length !== 0) throw new Error(`SVG: не закрыт <${stek[stek.length - 1]}>`);
  if (korney !== 1) throw new Error(`SVG: корней ${korney}`);
  if (!/viewBox="[-\d. ]+"/.test(svg)) throw new Error('SVG: нет viewBox');
  return teksty;
}

/**
 * Чертёж сцены. bukvy — буквы вершин, названные в условии: каждая
 * обязана стоять на чертеже подписью.
 */
export function narisovat(scena: Scena, bukvy: readonly string[], alt: string): string {
  const otchet = pustoyOtchet();
  const svg = renderPlan(scena, { chisla: true, alt }, otchet);
  if (otchet.problems.length > 0) {
    throw new Error(`чертёж «${alt}»: ${otchet.problems.join('; ')}`);
  }
  const teksty = razobratSvg(svg);
  for (const b of bukvy) {
    if (!teksty.includes(b)) throw new Error(`чертёж «${alt}»: нет подписи ${b}`);
  }
  return svg;
}

/** Буквы вершин в условии: заглавные латинские вне слов. */
export function bukvyUsloviya(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\$([^$]*)\$/g)) {
    const formula = (m[1] ?? '').replace(/\\[a-zA-Z]+/g, ' ');
    for (const b of formula.match(/[A-Z]/g) ?? []) out.add(b);
  }
  return [...out];
}

/** Углы треугольника для чертежа: каждый не меньше MIN_UGOL, сумма 180°. */
function vidimye(ugly: readonly number[], summa = 180): number[] {
  const out = ugly.map((u) => Math.max(u, MIN_UGOL));
  for (let i = 0; i < 6; i += 1) {
    const lishnee = out.reduce((s, u) => s + u, 0) - summa;
    if (Math.abs(lishnee) < 1e-9) break;
    const zapas = out.map((u) => Math.max(0, u - MIN_UGOL));
    const vsego = zapas.reduce((s, z) => s + z, 0);
    for (let k = 0; k < out.length; k += 1) out[k] = out[k]! - (lishnee * zapas[k]!) / vsego;
  }
  return out;
}

const shematichno = (s: Scena, da: boolean): Scena => (da ? { ...s, skhematichno: true } : s);

const peresech = (a: T2, da: T2, b: T2, db: T2): T2 => {
  const p = intersect(a, add(a, da), b, add(b, db));
  if (p === null) throw new Error('прямые не пересекаются');
  return p;
};

/* ── I. Углы ───────────────────────────────────────────────────── */

/**
 * Луч MD — биссектриса угла CMB, M на прямой AB. polovina — угол DMC.
 * dano — какой угол подписан, iskomoe — какой ищут.
 */
export function risBissektrisaNaPryamoy(
  polovina: number,
  dano: { ugol: 'DMC' | 'CMA'; znachenie: number },
  iskomoe: 'CMA' | 'DMB',
): string {
  const v = Math.min(Math.max(polovina, MIN_UGOL), 90 - MIN_UGOL / 2);
  const UG: Record<string, [string, string, string]> = {
    DMC: ['D', 'M', 'C'],
    CMA: ['C', 'M', 'A'],
    DMB: ['B', 'M', 'D'],
  };
  const elementy: Element[] = [otr('A', 'B'), otr('M', 'C'), otr('M', 'D')];
  const [a1, v1, b1] = UG[dano.ugol]!;
  const [a2, v2, b2] = UG[iskomoe]!;
  if (dano.ugol !== 'DMC') elementy.push(ug('D', 'M', 'C'));
  if (iskomoe !== 'DMB') elementy.push(ug('B', 'M', 'D'));
  elementy.push(ug(a1, v1, b1, { vydelit: 'dano', znachenie: gr(dano.znachenie) }));
  elementy.push(ug(a2, v2, b2, { vydelit: 'iskomoe', znachenie: '?' }));
  return narisovat(
    shematichno(
      {
        tochki: {
          M: [0, 0],
          A: [-6, 0],
          B: [6, 0],
          D: polar(v, 5),
          C: polar(2 * v, 5),
        },
        elementy,
      },
      v !== polovina,
    ),
    ['A', 'B', 'C', 'D', 'M'],
    'Прямая, точка на ней и два луча из этой точки',
  );
}

/** Параллельные m и n, секущие через точку P на m: углы 1, 2 и искомый 3. */
export function risParallelnye(u1: number, u2: number): string {
  const X: T2 = [0, 0];
  const Y: T2 = [6, 0];
  const P = peresech(X, polar(u1), Y, polar(180 - u2));
  const lev = Math.min(-1.6, P[0] - 2.2);
  const prav = Math.max(7.6, P[0] + 2.4);
  return narisovat(
    {
      tochki: {
        X,
        Y,
        P,
        m: [lev, P[1]],
        m2: [prav, P[1]],
        n: [lev, 0],
        n2: [prav, 0],
        E1: { naPryamoy: ['X', 'P', 1.3] },
        E2: { naPryamoy: ['Y', 'P', 1.3] },
        F1: { naPryamoy: ['P', 'X', 1.18] },
        F2: { naPryamoy: ['P', 'Y', 1.18] },
      },
      elementy: [
        otr('m', 'm2'),
        otr('n', 'n2'),
        otr('F1', 'E1'),
        otr('F2', 'E2'),
        ug('m2', 'P', 'E1', { vydelit: 'dano', znachenie: '1' }),
        ug('P', 'Y', 'X', { vydelit: 'dano', znachenie: '2' }),
        ug('X', 'P', 'Y', { vydelit: 'iskomoe', znachenie: '3' }),
      ],
      podpisi: ['m', 'n'],
    },
    ['m', 'n'],
    'Две параллельные прямые и две пересекающиеся секущие',
  );
}

/* ── II. Треугольник ───────────────────────────────────────────── */

/** AC = BC, внешний угол при B. */
export function risVneshniyRavnobedrennyy(vneshniy: number): string {
  const pri = 180 - vneshniy;
  const [vA, vB] = vidimye([pri, pri, 180 - 2 * pri]);
  const C = peresech([0, 0], polar(vA!), [10, 0], polar(180 - vB!));
  return narisovat(
    shematichno(
      {
        tochki: { A: [0, 0], B: [10, 0], C, E: { naPryamoy: ['A', 'B', 1.4] } },
        elementy: [
          tri('A', 'B', 'C'),
          shtrih('A', 'C', 1),
          shtrih('B', 'C', 1),
          prod('A', 'B', { doTochki: 'E', sploshnoe: true }),
          ug('C', 'B', 'E', { vydelit: 'dano', znachenie: gr(vneshniy) }),
          ug('A', 'C', 'B', { vydelit: 'iskomoe', znachenie: '?' }),
        ],
        podpisi: ['A', 'B', 'C'],
      },
      vA !== pri,
    ),
    ['A', 'B', 'C'],
    'Равнобедренный треугольник с внешним углом при вершине',
  );
}

/** Биссектриса AL: угол ALC и угол B даны, угол C искомый. */
export function risBissektrisaAL(uALC: number, uB: number): string {
  const uA = 2 * (uALC - uB);
  const uC = 180 - uB - uA;
  /* Угол A делится биссектрисой: на чертеже не меньше порога каждая половина. */
  const [p1, p2, vB, vC] = vidimye([uA / 2, uA / 2, uB, uC]);
  const vA = p1! + p2!;
  const A: T2 = [0, 0];
  const Cc: T2 = [10, 0];
  const B = peresech(A, polar(vA), Cc, polar(180 - vC!));
  return narisovat(
    shematichno(
      {
        tochki: { A, B, C: Cc, L: { bissektrisa: ['A', 'B', 'C'] } },
        elementy: [
          tri('A', 'B', 'C'),
          otr('A', 'L'),
          ug('B', 'A', 'L'),
          ug('L', 'A', 'C'),
          ug('A', 'L', 'C', { vydelit: 'dano', znachenie: gr(uALC) }),
          ug('A', 'B', 'C', { vydelit: 'dano', znachenie: gr(uB) }),
          ug('A', 'C', 'B', { vydelit: 'iskomoe', znachenie: '?' }),
        ],
      },
      vA !== uA || vB !== uB || vC !== uC,
    ),
    ['A', 'B', 'C', 'L'],
    'Треугольник ABC с биссектрисой AL',
  );
}

/** Медиана BM, высота BH, BC = BM; AC дано, AH искомое. */
export function risMedianaVysota(ac: number): string {
  return narisovat(
    {
      tochki: { A: [0, 0], C: [8, 0], M: [4, 0], H: [6, 0], B: [6, 3.6] },
      elementy: [
        tri('A', 'B', 'C'),
        otr('B', 'M', { shtrihi: 2 }),
        otr('B', 'H'),
        pryam('B', 'H', 'C'),
        shtrih('B', 'C', 2),
        otr('A', 'M', { shtrihi: 1, tolkoShtrihi: true }),
        otr('M', 'C', { shtrihi: 1, tolkoShtrihi: true }),
        otr('A', 'H', { vydelit: 'iskomoe', znachenie: '?' }),
        otr('A', 'C', { tolkoShtrihi: true, znachenie: ch(ac) }),
      ],
    },
    ['A', 'B', 'C', 'M', 'H'],
    `Треугольник ABC, медиана BM и высота BH, AC = ${ch(ac)}`,
  );
}

/**
 * Прямоугольный треугольник ABC с прямым углом C, катет BC вертикален.
 * ugolA — угол A (30° или 60°); вершина внешнего угла vneshniy — A
 * (продолжение CA за A) или B (продолжение CB за B).
 */
export function risPryamougolnyy(o: {
  ugolA: number;
  vneshniy: 'A' | 'B';
  dano: [string, string, number];
  iskomoe: [string, string];
}): string {
  const C: T2 = [Math.cos(o.ugolA * RAD) * 6, 0];
  const B: T2 = [C[0], Math.sin(o.ugolA * RAD) * 6];
  const vn = o.vneshniy;
  const velichina = vn === 'A' ? 180 - o.ugolA : 180 - (90 - o.ugolA);
  const elementy: Element[] = [
    tri('A', 'B', 'C'),
    pryam('A', 'C', 'B'),
    vn === 'A'
      ? prod('C', 'A', { doTochki: 'E', sploshnoe: true })
      : prod('C', 'B', { doTochki: 'E', sploshnoe: true }),
    vn === 'A'
      ? ug('B', 'A', 'E', { vydelit: 'dano', znachenie: gr(velichina) })
      : ug('A', 'B', 'E', { vydelit: 'dano', znachenie: gr(velichina) }),
    otr(o.dano[0], o.dano[1], { tolkoShtrihi: true, znachenie: ch(o.dano[2]) }),
    otr(o.iskomoe[0], o.iskomoe[1], { vydelit: 'iskomoe', znachenie: '?' }),
  ];
  return narisovat(
    {
      tochki: {
        A: [0, 0],
        B,
        C,
        E: vn === 'A' ? { naPryamoy: ['C', 'A', 1.45] } : { naPryamoy: ['C', 'B', 1.45] },
      },
      elementy,
      podpisi: ['A', 'B', 'C'],
    },
    ['A', 'B', 'C'],
    `Прямоугольный треугольник ABC с внешним углом при вершине ${vn}`,
  );
}

/**
 * Равнобедренный ABC (AB = BC, основание AC внизу) с углом 30° при
 * основании и отрезком BK (или BM) к основанию. Что подписано — в o.
 */
export function risRavnobedrennyy30(o: {
  seredina: 'K' | 'M';
  /** Отметка у отрезка к основанию: высота, медиана, биссектриса. */
  vid: 'vysota' | 'mediana' | 'bissektrisa' | 'mediana-bissektrisa';
  vneshnie: readonly ('A' | 'C')[];
  ugolB?: boolean;
  dano: [string, string, number];
  iskomoe: [string, string];
  ravnyeStorony: boolean;
  alt: string;
}): string {
  const K = o.seredina;
  const A: T2 = [0, 0];
  const C: T2 = [2 * Math.sqrt(3) * 3, 0];
  const B: T2 = [Math.sqrt(3) * 3, 3];
  const elementy: Element[] = [tri('A', 'B', 'C'), otr('B', K)];
  if (o.ravnyeStorony) elementy.push(shtrih('A', 'B', 1), shtrih('B', 'C', 1));
  if (o.vid === 'vysota') elementy.push(pryam('B', K, 'C'));
  if (o.vid === 'mediana' || o.vid === 'mediana-bissektrisa') {
    elementy.push(otr('A', K, { shtrihi: 2, tolkoShtrihi: true }));
    elementy.push(otr(K, 'C', { shtrihi: 2, tolkoShtrihi: true }));
  }
  const tochki: Scena['tochki'] = { A, B, C, [K]: [B[0], 0] };
  if (o.vid === 'bissektrisa' || o.vid === 'mediana-bissektrisa') {
    elementy.push(ug('A', 'B', K, { radiusPx: 16 }), ug(K, 'B', 'C', { radiusPx: 16 }));
  }
  if (o.ugolB === true) {
    elementy.push(ug('A', 'B', 'C', { vydelit: 'dano', znachenie: '120°', radiusPx: 26 }));
  }
  for (const v of o.vneshnie) {
    const E = `E${v}`;
    tochki[E] = v === 'A' ? { naPryamoy: ['C', 'A', 1.16] } : { naPryamoy: ['A', 'C', 1.16] };
    elementy.push(prod(v === 'A' ? 'C' : 'A', v, { doTochki: E, sploshnoe: true }));
    elementy.push(ug('B', v, E, { vydelit: 'dano', znachenie: '150°' }));
  }
  const [d1, d2, dz] = o.dano;
  const naStorone = (a: string, b: string) => ['AB', 'BA', 'BC', 'CB', 'AC', 'CA'].includes(a + b);
  elementy.push(
    naStorone(d1, d2)
      ? otr(d1, d2, { tolkoShtrihi: true, znachenie: ch(dz) })
      : otr(d1, d2, { znachenie: ch(dz) }),
  );
  elementy.push(otr(o.iskomoe[0], o.iskomoe[1], { vydelit: 'iskomoe', znachenie: '?' }));
  const bukvy = ['A', 'B', 'C', K];
  return narisovat({ tochki, elementy, podpisi: bukvy }, bukvy, o.alt);
}

/** Равнобедренный ABC, AC — основание, BK — высота, P — середина BC; искомое KP. */
export function risSeredinaBC(ac: number, bk: number): string {
  const A: T2 = [0, 0];
  const C: T2 = [ac, 0];
  const K: T2 = [ac / 2, 0];
  const B: T2 = [ac / 2, bk];
  return narisovat(
    {
      tochki: { A, B, C, K, P: { seredina: ['B', 'C'] } },
      elementy: [
        tri('A', 'B', 'C'),
        otr('B', 'K', { znachenie: ch(bk) }),
        pryam('B', 'K', 'C'),
        otr('A', 'K', { shtrihi: 1, tolkoShtrihi: true }),
        otr('K', 'C', { shtrihi: 1, tolkoShtrihi: true }),
        otr('B', 'P', { shtrihi: 2, tolkoShtrihi: true }),
        otr('P', 'C', { shtrihi: 2, tolkoShtrihi: true }),
        otr('K', 'P', { vydelit: 'iskomoe', znachenie: '?' }),
      ],
    },
    ['A', 'B', 'C', 'K', 'P'],
    `Равнобедренный треугольник ABC с основанием ${ch(ac)} и высотой BK`,
  );
}

/* ── III. Четырёхугольники ─────────────────────────────────────── */

/** Дельтоид ABCD: AB = BC, AD = CD, углы B и D даны, угол A искомый. */
export function risDeltoid(uB: number, uD: number): string {
  const B: T2 = [0, 0];
  const D: T2 = [10, 0];
  const C = peresech(B, polar(uB / 2), D, polar(180 - uD / 2));
  const A: T2 = [C[0], -C[1]];
  return narisovat(
    {
      tochki: { A, B, C, D },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        shtrih('A', 'B', 1),
        shtrih('B', 'C', 1),
        shtrih('C', 'D', 2),
        shtrih('D', 'A', 2),
        ug('A', 'B', 'C', { vydelit: 'dano', znachenie: gr(uB) }),
        ug('C', 'D', 'A', { vydelit: 'dano', znachenie: gr(uD) }),
        ug('B', 'A', 'D', { vydelit: 'iskomoe', znachenie: '?' }),
      ],
    },
    ['A', 'B', 'C', 'D'],
    'Выпуклый четырёхугольник с двумя парами равных соседних сторон',
  );
}

/** Повернуть точки так, чтобы отрезок ot→k лёг горизонтально вправо. */
function gorizontalno(tochki: Record<string, T2>, ot: string, k: string): Record<string, T2> {
  const a = angleOf(sub(tochki[k]!, tochki[ot]!));
  const out: Record<string, T2> = {};
  for (const [n, p] of Object.entries(tochki)) out[n] = rotate(p, [0, 0], -a);
  return out;
}

/** Параллелограмм с AC = 2·AB и данным углом ACD; искомое — угол между диагоналями. */
export function risParallelogrammDiagonal(uACD: number): string {
  /* Угол между диагоналями (180° − x) : 2 тоже не уже порога. */
  const x = Math.min(Math.max(uACD, 20), 180 - 2 * MIN_UGOL);
  const A: T2 = [0, 0];
  const C: T2 = [2, 0];
  const B = polar(x, 1);
  const D = sub(add(A, C), B);
  const t = gorizontalno({ A, B, C, D, O: [1, 0] }, 'A', 'D');
  return narisovat(
    shematichno(
      {
        tochki: t,
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          otr('A', 'C'),
          otr('B', 'D'),
          shtrih('A', 'B', 1),
          otr('A', 'O', { shtrihi: 1, tolkoShtrihi: true }),
          otr('O', 'C', { shtrihi: 1, tolkoShtrihi: true }),
          ug('A', 'C', 'D', { vydelit: 'dano', znachenie: gr(uACD) }),
          ug('A', 'O', 'B', { vydelit: 'iskomoe', znachenie: '?' }),
        ],
        podpisi: ['A', 'B', 'C', 'D'],
      },
      x !== uACD,
    ),
    ['A', 'B', 'C', 'D'],
    'Параллелограмм ABCD с диагоналями AC и BD',
  );
}

/** Параллелограмм, биссектриса угла A пересекает BC в K. */
export function risBissektrisaParallelogramma(ab: number, bc: number): string {
  const ugolA = 58;
  const A: T2 = [0, 0];
  const D: T2 = [bc, 0];
  const B = polar(ugolA, ab);
  const C = add(B, D);
  const K = add(B, [ab, 0]);
  return narisovat(
    {
      tochki: { A, B, C, D, K },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'K'),
        ug('B', 'A', 'K'),
        ug('K', 'A', 'D'),
        otr('A', 'B', { tolkoShtrihi: true, znachenie: ch(ab) }),
        otr('K', 'C', { vydelit: 'iskomoe', znachenie: '?' }),
      ],
    },
    ['A', 'B', 'C', 'D', 'K'],
    'Параллелограмм и биссектриса его угла',
  );
}

/** Равнобедренная трапеция ABCD (AD ∥ BC, AB = CD), диагональ BD. */
export function risTrapeciya(uBDA: number, uBDC: number): string {
  const iskomyy = 180 - 2 * uBDA - uBDC;
  let a = uBDA;
  let b = uBDC;
  if (iskomyy < MIN_UGOL) {
    const k = (180 - MIN_UGOL) / (2 * a + b);
    a *= k;
    b *= k;
  }
  const g = a + b;
  const A: T2 = [0, 0];
  const D: T2 = [10, 0];
  const B = peresech(A, polar(g), D, polar(180 - a));
  const C: T2 = [10 - B[0], B[1]];
  return narisovat(
    shematichno(
      {
        tochki: { A, B, C, D },
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          otr('B', 'D'),
          shtrih('A', 'B', 1),
          shtrih('C', 'D', 1),
          ug('B', 'D', 'A', { vydelit: 'dano', znachenie: gr(uBDA) }),
          ug('B', 'D', 'C', { vydelit: 'dano', znachenie: gr(uBDC) }),
          ug('A', 'B', 'D', { vydelit: 'iskomoe', znachenie: '?' }),
        ],
      },
      a !== uBDA,
    ),
    ['A', 'B', 'C', 'D'],
    'Трапеция ABCD с равными боковыми сторонами и диагональю BD',
  );
}

/** Прямоугольная трапеция без букв: основания и угол 135°. */
export function risPryamougolnayaTrapeciya(verhnee: number, nizhnee: number): string {
  const h = nizhnee - verhnee;
  return narisovat(
    {
      tochki: { A: [0, 0], B: [0, h], C: [verhnee, h], D: [nizhnee, 0] },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        pryam('B', 'A', 'D'),
        pryam('A', 'B', 'C'),
        otr('B', 'C', { tolkoShtrihi: true, znachenie: ch(verhnee) }),
        otr('A', 'D', { tolkoShtrihi: true, znachenie: ch(nizhnee) }),
        ug('B', 'C', 'D', { vydelit: 'dano', znachenie: '135°' }),
        otr('A', 'B', { vydelit: 'iskomoe', znachenie: '?' }),
      ],
      podpisi: false,
    },
    [],
    `Прямоугольная трапеция с основаниями ${ch(verhnee)} и ${ch(nizhnee)}`,
  );
}

/** Параллелограмм с перпендикулярными диагоналями и углом A = 60°. */
export function risRombDiagonali(ab: number): string {
  const A: T2 = [0, 0];
  const D: T2 = [10, 0];
  const B = polar(60, 10);
  const C = add(B, D);
  return narisovat(
    {
      tochki: { A, B, C, D, O: mul(C, 0.5) },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C'),
        otr('B', 'D', { vydelit: 'iskomoe', znachenie: '?' }),
        pryam('C', 'O', 'D'),
        otr('A', 'B', { tolkoShtrihi: true, znachenie: ch(ab) }),
      ],
      podpisi: ['A', 'B', 'C', 'D'],
    },
    ['A', 'B', 'C', 'D'],
    'Параллелограмм ABCD с перпендикулярными диагоналями',
  );
}

/**
 * Ромб без букв, большая диагональ горизонтальна. summa — сумма двух
 * отмеченных углов (120° — два острых, 240° — два тупых); меньшая
 * диагональ — данная (число) или искомая (null).
 */
export function risRomb(summa: number, diagonal: number | null): string {
  const L: T2 = [-Math.sqrt(3) * 5, 0];
  const R: T2 = [Math.sqrt(3) * 5, 0];
  const T: T2 = [0, 5];
  const U: T2 = [0, -5];
  const ugly =
    summa < 180
      ? [ug('T', 'L', 'U', { vydelit: 'dano' }), ug('U', 'R', 'T', { vydelit: 'dano' })]
      : [ug('L', 'T', 'R', { vydelit: 'dano' }), ug('R', 'U', 'L', { vydelit: 'dano' })];
  return narisovat(
    {
      tochki: { L, R, T, U },
      elementy: [
        mn(['L', 'T', 'R', 'U']),
        otr('L', 'R'),
        diagonal === null
          ? otr('T', 'U', { vydelit: 'iskomoe', znachenie: '?' })
          : otr('T', 'U', { znachenie: ch(diagonal) }),
        ...ugly,
      ],
      podpisi: false,
    },
    [],
    `Ромб с отмеченными углами (их сумма ${summa}°) и диагоналями`,
  );
}
