/**
 * Группа II. Условная вероятность по дереву случайного эксперимента.
 *
 *   6.3  дерево с вероятностями на рёбрах, события $A$ и $B$ заданы
 *        наборами исходов (овалы на рисунке) → $P(A\mid B)$.
 *
 * Параметры: `rod` — родитель каждого ребра (−1 — из корня $S$), `ps` —
 * вероятности рёбер в целых долях `den`, `a` и `b` — первый и последний
 * лист событий $A$ и $B$ (номера листьев в порядке обхода, события —
 * подряд стоящие листья, как овалы на рисунке ЕГЭ), `vop` — что
 * спрашивают: $P(A\mid B)$ или $P(B\mid A)$, `sj` — сюжет.
 */

import {
  arr,
  delimDesyatichnye,
  etapy,
  iSpisok,
  num,
  otvetLine,
  plus,
  pt,
  q,
  str,
  strOpt,
  sumQ,
  mul,
  div,
  tq,
  vopros,
  type Q,
} from '../kit';
import type { Params, Prototype, Ris, Tema, VetvDereva } from '../types';

export const IMENA_LISTYEV = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

export interface SyuzhetDereva {
  key: string;
  tema: Tema;
  plot: string;
  /** Что за эксперимент: одна-две фразы. */
  opyt: string;
}

export const SYUZHETY_P03: SyuzhetDereva[] = [
  {
    key: 'keisy',
    tema: 'igry',
    plot: 'кейсы в игре',
    opyt: 'Игрок открывает кейсы: сначала обычный, а потом — в зависимости от того, что выпало, — следующий.',
  },
  {
    key: 'penalti',
    tema: 'sport',
    plot: 'серия пенальти',
    opyt: 'Футболист бьёт пенальти, а потом, в зависимости от результата, ещё один удар.',
  },
  {
    key: 'marshrut',
    tema: 'dostavka',
    plot: 'маршрут курьера',
    opyt: 'Курьер выбирает маршрут, а затем на каждом маршруте может попасть или не попасть в пробку.',
  },
  {
    key: 'prognoz',
    tema: 'pogoda',
    plot: 'прогноз погоды',
    opyt: 'Синоптики моделируют погоду: сначала — будет ли облачно утром, затем — что будет днём.',
  },
  {
    key: 'rekomendacii',
    tema: 'socseti',
    plot: 'рекомендации ленты',
    opyt: 'Соцсеть показывает пользователю видео: сначала выбирает тему, затем — автора внутри темы.',
  },
  {
    key: 'bilety',
    tema: 'ekzameny',
    plot: 'билеты на экзамене',
    opyt: 'На устном экзамене ученик тянет билет из одной из стопок, а затем отвечает на дополнительный вопрос.',
  },
  {
    key: 'akciya',
    tema: 'magaziny',
    plot: 'акция в магазине',
    opyt: 'Покупатель участвует в акции магазина: сначала крутит барабан, а затем, в зависимости от результата, выбирает конверт.',
  },
  {
    key: 'peresadka',
    tema: 'transport',
    plot: 'поездка с пересадкой',
    opyt: 'Школьник едет на олимпиаду: сначала выбирает, на чём добраться до пересадки, а потом — как ехать дальше.',
  },
  {
    key: 'raspisanie',
    tema: 'shkola',
    plot: 'замена урока',
    opyt: 'В расписании могут поставить замену: сначала решается, какой урок заменят, затем — кто его проведёт.',
  },
  {
    key: 'seans',
    tema: 'kofeynya',
    plot: 'выбор сеанса',
    opyt: 'Друзья выбирают кинотеатр, а затем — фильм из тех, что идут в нём вечером.',
  },
];

const PO_KLYUCHU = new Map(SYUZHETY_P03.map((s) => [s.key, s]));

/* ── Дерево по параметрам ─────────────────────────────────────────── */

interface Derevo {
  vetki: VetvDereva[];
  /** Номера рёбер-листьев в порядке обхода. */
  listya: number[];
  /** Путь к листу: номера рёбер от корня. */
  puti: number[][];
  /** Вероятность листа — точной дробью. */
  pLista: Q[];
}

export function derevo(p: Params): Derevo {
  const rod = arr(p, 'rod');
  const ps = arr(p, 'ps');
  const den = num(p, 'den');
  const deti = new Map<number, number[]>();
  rod.forEach((r, i) => deti.set(r, [...(deti.get(r) ?? []), i]));
  const listya: number[] = [];
  const puti: number[][] = [];
  const obhod = (i: number, put: number[]) => {
    const sled = deti.get(i) ?? [];
    if (sled.length === 0) {
      listya.push(i);
      puti.push([...put, i]);
      return;
    }
    sled.forEach((c) => obhod(c, [...put, i]));
  };
  (deti.get(-1) ?? []).forEach((c) => obhod(c, []));
  const imya = new Map(listya.map((l, j) => [l, IMENA_LISTYEV[j] as string]));
  /* Порядок рёбер в рисунке — порядок обхода: тогда листья встают слева направо как a, b, c… */
  const poryadok: number[] = [];
  const dobavit = (i: number) => {
    poryadok.push(i);
    (deti.get(i) ?? []).forEach(dobavit);
  };
  (deti.get(-1) ?? []).forEach(dobavit);
  const vetki: VetvDereva[] = poryadok.map((i) => ({
    id: `v${i}`,
    parent: (rod[i] as number) < 0 ? null : `v${rod[i] as number}`,
    p: pt(ps[i] as number, den),
    pv: (ps[i] as number) / den,
    imya: imya.get(i) ?? '',
  }));
  const pLista = puti.map((put) => put.reduce((s, i) => mul(s, q(ps[i] as number, den)), q(1)));
  return { vetki, listya, puti, pLista };
}

function interval(p: Params, key: string): [number, number] {
  const v = arr(p, key);
  return [v[0] as number, v[1] as number];
}

function sobytie(p: Params, key: string): number[] {
  const [a, b] = interval(p, key);
  const out: number[] = [];
  for (let i = a; i <= b; i += 1) {
    out.push(i);
  }
  return out;
}

function risDereva(p: Params, extra?: { vydelit?: number[]; proizvedeniya?: boolean }): Ris {
  const d = derevo(p);
  const id = (j: number) => `v${d.listya[j] as number}`;
  return {
    vid: 'derevo',
    vetki: d.vetki,
    sobytiya: [
      { imya: 'A', listya: sobytie(p, 'a').map(id) },
      { imya: 'B', listya: sobytie(p, 'b').map(id) },
    ],
    ...(extra?.vydelit ? { vydelit: extra.vydelit.map(id) } : {}),
    ...(extra?.proizvedeniya ? { proizvedeniya: true } : {}),
  };
}

const imenaTex = (js: readonly number[]) => js.map((j) => `$${IMENA_LISTYEV[j] as string}$`);

/** Вероятность листа в TeX как произведение по пути: 0{,}6\cdot0{,}4. */
function proizvedenieTex(p: Params, put: readonly number[]): string {
  const ps = arr(p, 'ps');
  const den = num(p, 'den');
  return put.map((i) => pt(ps[i] as number, den)).join('\\cdot');
}

/* ── Прототип ──────────────────────────────────────────────────────── */

const P03: Prototype = {
  id: 'P03',
  no: 3,
  group: 'II',
  title: 'Дерево эксперимента: условная вероятность',
  formula:
    '$P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)}$, вероятности исходов — произведения вдоль ветвей',
  skills: ['derevo'],
  istochnik: 'Условная вероятность, №1',
  ris: (p) => risDereva(p),
  uslovie(p) {
    const A = iSpisok(imenaTex(sobytie(p, 'a')));
    const B = iSpisok(imenaTex(sobytie(p, 'b')));
    const vop = str(p, 'vop', ['AB', 'BA'] as const);
    const chto = vop === 'AB' ? 'P(A\\mid B)' : 'P(B\\mid A)';
    const sj = strOpt(p, 'sj');
    const vstuplenie =
      sj === undefined
        ? 'На рисунке показано дерево некоторого случайного эксперимента.'
        : `${(PO_KLYUCHU.get(sj) as SyuzhetDereva).opyt} Дерево этого случайного эксперимента показано на рисунке.`;
    const es = (n: number) => (n === 1 ? 'элементарное событие' : 'элементарные события');
    return {
      text: `${vstuplenie} Событию $A$ благоприятствуют ${es(sobytie(p, 'a').length)} ${A}, а событию $B$ — ${es(sobytie(p, 'b').length)} ${B}. Найдите $${chto}$.`,
      ris: risDereva(p),
    };
  },
  solve(p) {
    const d = derevo(p);
    const vop = str(p, 'vop', ['AB', 'BA'] as const);
    const A = sobytie(p, 'a');
    const B = sobytie(p, 'b');
    const AB = A.filter((j) => B.includes(j));
    const [uslovie, imyaU, drugoe] = vop === 'AB' ? [B, 'B', 'A'] : [A, 'A', 'B'];
    const pAB = sumQ(AB.map((j) => d.pLista[j] as Q));
    const pU = sumQ(uslovie.map((j) => d.pLista[j] as Q));
    const pD = sumQ((vop === 'AB' ? A : B).map((j) => d.pLista[j] as Q));
    const otv = div(pAB, pU);
    const answer = otv.n / otv.m;
    const lst = (j: number) => IMENA_LISTYEV[j] as string;
    const stroki = d.listya.map(
      (_, j) =>
        `$P(${lst(j)})=${proizvedenieTex(p, d.puti[j] as number[])}=${tq(d.pLista[j] as Q)}$`,
    );
    const lozhnoe = div(pAB, pD);
    const ob = [...new Set([...A, ...B])].sort((x, y) => x - y);
    const tolkoOdno = ob.filter((j) => !AB.includes(j));
    const sumTex = (js: readonly number[]) => plus(js.map((j) => tq(d.pLista[j] as Q)));
    const chto = `P(${drugoe}\\mid ${imyaU})`;
    const pervyy = AB[0] as number;
    return {
      answer,
      etapy: etapy(
        {
          t: 'Находим вероятности элементарных событий',
          lines: [
            'Вероятность исхода — произведение вероятностей на рёбрах пути от $S$ к этому исходу:',
            ...stroki,
          ],
          ris: risDereva(p, { proizvedeniya: true }),
        },
        {
          t: `Находим событие $A\\cap B$`,
          lines: [
            `И в $A$, и в $B$ входят ${iSpisok(imenaTex(AB))}. Поэтому $P(A\\cap B)=${sumTex(AB)}=${tq(pAB)}$.`,
          ],
          ris: risDereva(p, { vydelit: AB, proizvedeniya: true }),
        },
        {
          t: `Находим $P(${imyaU})$`,
          lines: [
            `Событию $${imyaU}$ благоприятствуют ${iSpisok(imenaTex(uslovie))}: $P(${imyaU})=${sumTex(uslovie)}=${tq(pU)}$.`,
          ],
        },
        {
          t: 'Делим по формуле условной вероятности',
          lines: [
            `Знаем, что $${imyaU}$ случилось, — «сужаем мир» до $${imyaU}$: $${chto}=\\dfrac{P(A\\cap B)}{P(${imyaU})}=\\dfrac{${tq(pAB)}}{${tq(pU)}}=${tq(otv)}$.`,
            otvetLine(answer),
          ],
        },
      ),
      vychisleniya: delimDesyatichnye(pAB, pU, chto),
      hints: [
        vopros(
          `Как найти вероятность элементарного события $${lst(pervyy)}$?`,
          `перемножить вероятности на рёбрах пути от $S$ к $${lst(pervyy)}$`,
          [
            `сложить вероятности на рёбрах пути от $S$ к $${lst(pervyy)}$`,
            'взять вероятность последнего ребра',
          ],
          `$P(${lst(pervyy)})=${proizvedenieTex(p, d.puti[pervyy] as number[])}=${tq(d.pLista[pervyy] as Q)}$.`,
        ),
        vopros('Какие исходы входят и в $A$, и в $B$?', iSpisok(imenaTex(AB)), [
          iSpisok(imenaTex(ob)),
          iSpisok(imenaTex(tolkoOdno)),
          iSpisok(imenaTex(uslovie)),
        ]),
        vopros(
          `На что делим $P(A\\cap B)$, чтобы найти $${chto}$?`,
          `на $P(${imyaU})$`,
          [`на $P(${drugoe})$`, 'на $1$', `на $P(A)\\cdot P(B)$`],
          `Условие — то, что уже случилось: это $${imyaU}$.`,
        ),
        vopros(`Чему равна $${chto}$?`, `$${tq(otv)}$`, [
          `$${tq(lozhnoe)}$`,
          `$${tq(pAB)}$`,
          `$${tq(pU)}$`,
        ]),
      ],
    };
  },
  pereschet(p) {
    const rod = arr(p, 'rod');
    const ps = arr(p, 'ps');
    const den = num(p, 'den');
    /* Вероятность листа — произведение по пути вверх к корню, без решателя. */
    const pr = rod.map((_, i) => {
      let s = 1;
      let j = i;
      while (j >= 0) {
        s *= (ps[j] as number) / den;
        j = rod[j] as number;
      }
      return s;
    });
    const listya = derevo(p).listya;
    const pL = listya.map((i) => pr[i] as number);
    const [a0, a1] = interval(p, 'a');
    const [b0, b1] = interval(p, 'b');
    let pA = 0;
    let pB = 0;
    let pAB = 0;
    pL.forEach((v, j) => {
      const vA = j >= a0 && j <= a1;
      const vB = j >= b0 && j <= b1;
      if (vA) pA += v;
      if (vB) pB += v;
      if (vA && vB) pAB += v;
    });
    const vop = str(p, 'vop', ['AB', 'BA'] as const);
    return Math.round((pAB / (vop === 'AB' ? pB : pA)) * 1e9) / 1e9;
  },
  summy(p) {
    const rod = arr(p, 'rod');
    const ps = arr(p, 'ps');
    const den = num(p, 'den');
    const uzly = [...new Set(rod)];
    return uzly.map((u) => ({
      chto: u < 0 ? 'рёбра из корня' : `рёбра из вершины ${u}`,
      doli: rod.map((r, i) => (r === u ? (ps[i] as number) : -1)).filter((x) => x >= 0),
      nado: den,
    }));
  },
};

export const GRUPPA_II: Prototype[] = [P03];
