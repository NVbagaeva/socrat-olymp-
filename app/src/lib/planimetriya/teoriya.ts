/**
 * Рисунки теории, вкладки «О задании» и лайфхаков задания №1 — по
 * ключу. Только данные: рисует движок (render.ts). Часть сцен — свои
 * (смежные и вертикальные углы, параллельные прямые, особые
 * треугольники), остальные берутся у прототипов на их образце в
 * нужном режиме: так рисунок теории и рисунок задачи — одно и то же.
 */

import { POROG, poUglam, pryamougolnyy, trapeciya } from './figury';
import { polar } from './geom';
import { prototip } from './stseny';
import {
  duga,
  gr,
  mn,
  oblast,
  okr,
  otr,
  pryam,
  pryamaya,
  shtrih,
  tochka,
  tri,
  ug,
} from './stseny/dsl';
import type { Nabor, Params } from './stseny/dsl';
import type { EOtrezok, Optsii, Rezhim, Scena, T2 } from './types';

export interface RisunokTeorii {
  scena: Scena;
  optsii: Optsii;
}

const UCHITEL: Rezhim = { rezhim: 'uchitel' };

function izPrototipa(id: number, nabor: Nabor = {}, rezhim: Rezhim = UCHITEL): RisunokTeorii {
  const p = prototip(id);
  return {
    scena: p.stsena({ ...p.primer, ...nabor } as Params, POROG),
    optsii: { rezhim, chisla: true },
  };
}

const sCh = (scena: Scena): RisunokTeorii => ({ scena, optsii: { rezhim: UCHITEL, chisla: true } });

/** Подпись отрезка буквой или числом (без линии — линия уже нарисована). */
const zn = (a: string, b: string, znachenie: string, o: Partial<EOtrezok> = {}): EOtrezok => ({
  tip: 'otrezok',
  a,
  b,
  tolkoShtrihi: true,
  vydelit: 'dano',
  znachenie,
  ...o,
});

const RAD = Math.PI / 180;
const kr = (gradus: number) => ({ naDuge: { okr: 'w', gradus } });

const SVOI: Record<string, () => RisunokTeorii> = {
  smezhnye: () =>
    sCh({
      tochki: { A: [-5, 0], O: [0, 0], B: [5, 0], C: polar(58, 5) },
      elementy: [
        otr('A', 'B'),
        otr('O', 'C'),
        ug('C', 'O', 'B', { vydelit: 'dano', znachenie: 'α' }),
        ug('A', 'O', 'C', { vydelit: 'dano', dugi: 2, znachenie: '180° − α' }),
      ],
    }),
  vertikalnye: () =>
    sCh({
      tochki: { A: polar(200, 5), B: polar(20, 5), C: polar(140, 5), D: polar(320, 5), O: [0, 0] },
      elementy: [
        otr('A', 'B'),
        otr('C', 'D'),
        ug('B', 'O', 'C', { vydelit: 'dano', znachenie: 'α' }),
        ug('A', 'O', 'D', { vydelit: 'dano', znachenie: 'α' }),
        ug('C', 'O', 'A', { dugi: 2 }),
        ug('D', 'O', 'B', { dugi: 2 }),
      ],
    }),
  parallelnye: () =>
    sCh({
      tochki: {
        A: [-6, 0],
        B: [6, 0],
        C: [-6, 4],
        D: [6, 4],
        M: [-1.6, 0],
        N: [1.6, 4],
        P: [-2.8, -1.5],
        Q: [2.8, 5.5],
      },
      elementy: [
        otr('A', 'B'),
        otr('C', 'D'),
        otr('P', 'Q'),
        ug('B', 'M', 'N', { vydelit: 'dano', znachenie: 'α' }),
        ug('C', 'N', 'M', { vydelit: 'dano', znachenie: 'α' }),
        ug('D', 'N', 'M', { dugi: 2, znachenie: '180° − α' }),
      ],
      bezPodpisi: ['A', 'B', 'C', 'D', 'P', 'Q'],
    }),
  'summa-uglov': () =>
    sCh({
      tochki: poUglam(52, 63),
      elementy: [
        tri('A', 'B', 'C'),
        ug('C', 'A', 'B', { znachenie: 'α' }),
        ug('A', 'B', 'C', { dugi: 2, znachenie: 'β' }),
        ug('A', 'C', 'B', { dugi: 3, znachenie: 'γ' }),
      ],
    }),
  'tri-elementa': () =>
    sCh({
      tochki: {
        ...poUglam(38, 70),
        H: { osnovanie: ['C', 'A', 'B'] },
        L: { bissektrisa: ['C', 'A', 'B'] },
        M: { seredina: ['A', 'B'] },
      },
      elementy: [
        tri('A', 'B', 'C'),
        otr('C', 'H'),
        pryam('C', 'H', 'B'),
        otr('C', 'L'),
        ug('A', 'C', 'L', { dugi: 1 }),
        ug('L', 'C', 'B', { dugi: 1 }),
        otr('C', 'M'),
        shtrih('A', 'M', 2),
        shtrih('M', 'B', 2),
      ],
    }),
  pifagor: () =>
    sCh({
      tochki: pryamougolnyy(37, 'katety'),
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        { tip: 'otrezok', a: 'C', b: 'B', tolkoShtrihi: true, vydelit: 'dano', znachenie: 'a' },
        { tip: 'otrezok', a: 'A', b: 'C', tolkoShtrihi: true, vydelit: 'dano', znachenie: 'b' },
        { tip: 'otrezok', a: 'A', b: 'B', tolkoShtrihi: true, vydelit: 'dano', znachenie: 'c' },
      ],
    }),
  trig: () =>
    sCh({
      tochki: pryamougolnyy(37, 'katety'),
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        ug('A', 'B', 'C', { vydelit: 'iskomoe' }),
        {
          tip: 'otrezok',
          a: 'C',
          b: 'B',
          tolkoShtrihi: true,
          vydelit: 'dano',
          znachenie: 'прилежащий',
        },
        {
          tip: 'otrezok',
          a: 'A',
          b: 'C',
          tolkoShtrihi: true,
          vydelit: 'dano',
          znachenie: 'противолежащий',
        },
        {
          tip: 'otrezok',
          a: 'A',
          b: 'B',
          tolkoShtrihi: true,
          vydelit: 'dano',
          znachenie: 'гипотенуза',
        },
      ],
    }),
  '30-60-90': () =>
    sCh({
      tochki: pryamougolnyy(30, 'katety'),
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        ug('A', 'B', 'C', { vydelit: 'dano', znachenie: '30°' }),
        ug('C', 'A', 'B', { vydelit: 'dano', dugi: 2, znachenie: '60°' }),
        { tip: 'otrezok', a: 'A', b: 'C', tolkoShtrihi: true, vydelit: 'dano', znachenie: 'a' },
        { tip: 'otrezok', a: 'A', b: 'B', tolkoShtrihi: true, vydelit: 'dano', znachenie: '2a' },
        { tip: 'otrezok', a: 'C', b: 'B', tolkoShtrihi: true, vydelit: 'dano', znachenie: 'a√3' },
      ],
    }),
  '45-45-90': () =>
    sCh({
      tochki: pryamougolnyy(45, 'katety'),
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        ug('A', 'B', 'C', { vydelit: 'dano', znachenie: '45°' }),
        ug('C', 'A', 'B', { vydelit: 'dano', znachenie: '45°' }),
        {
          tip: 'otrezok',
          a: 'A',
          b: 'C',
          tolkoShtrihi: true,
          shtrihi: 1,
          vydelit: 'dano',
          znachenie: 'a',
        },
        {
          tip: 'otrezok',
          a: 'C',
          b: 'B',
          tolkoShtrihi: true,
          shtrihi: 1,
          vydelit: 'dano',
          znachenie: 'a',
        },
        { tip: 'otrezok', a: 'A', b: 'B', tolkoShtrihi: true, vydelit: 'dano', znachenie: 'a√2' },
      ],
    }),
  parallelogramm: () =>
    sCh({
      tochki: {
        A: [0, 0],
        B: polar(62, 6),
        C: [6 * Math.cos(62 * (Math.PI / 180)) + 10, 6 * Math.sin(62 * (Math.PI / 180))],
        D: [10, 0],
        O: { seredina: ['A', 'C'] },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C'),
        otr('B', 'D'),
        shtrih('A', 'O', 1),
        shtrih('O', 'C', 1),
        shtrih('B', 'O', 2),
        shtrih('O', 'D', 2),
        ug('D', 'A', 'B', { znachenie: 'α' }),
        ug('B', 'C', 'D', { znachenie: 'α' }),
        ug('A', 'B', 'C', { dugi: 2, znachenie: '180° − α' }),
      ],
    }),
  'na-diametr': () =>
    sCh({
      tochki: {
        O: [0, 0],
        A: { naDuge: { okr: 'w', gradus: 180 } },
        B: { naDuge: { okr: 'w', gradus: 0 } },
        C: { naDuge: { okr: 'w', gradus: 115 } },
      },
      okruzhnosti: { w: { centr: 'O', radius: 5 } },
      elementy: [
        okr('w'),
        otr('A', 'B'),
        otr('C', 'A'),
        otr('C', 'B'),
        tochka('O'),
        pryam('A', 'C', 'B', { vydelit: 'iskomoe' }),
      ],
    }),
  'odna-duga': () =>
    sCh({
      tochki: {
        O: [0, 0],
        A: { naDuge: { okr: 'w', gradus: 215 } },
        B: { naDuge: { okr: 'w', gradus: 325 } },
        C: { naDuge: { okr: 'w', gradus: 70 } },
        D: { naDuge: { okr: 'w', gradus: 130 } },
      },
      okruzhnosti: { w: { centr: 'O', radius: 5 } },
      elementy: [
        okr('w'),
        otr('C', 'A'),
        otr('C', 'B'),
        otr('D', 'A'),
        otr('D', 'B'),
        ug('A', 'C', 'B', { znachenie: 'α' }),
        ug('A', 'D', 'B', { znachenie: 'α' }),
        { tip: 'duga', okr: 'w', ot: 'A', do: 'B', sloy: 'reshenie', znachenie: '2α' },
      ],
      bezPodpisi: ['O'],
    }),
  'otrezki-kasatelnyh': () =>
    sCh({
      tochki: {
        O: [0, 0],
        C: [9, 0],
        A: { kasanie: { iz: 'C', okr: 'w', storona: 1 } },
        B: { kasanie: { iz: 'C', okr: 'w', storona: -1 } },
      },
      okruzhnosti: { w: { centr: 'O', radius: 4 } },
      elementy: [
        okr('w'),
        tochka('O'),
        pryamaya('C', 'A', { zaA: 0, zaB: 0.3 }),
        pryamaya('C', 'B', { zaA: 0, zaB: 0.3 }),
        shtrih('C', 'A', 1),
        shtrih('C', 'B', 1),
        otr('O', 'A'),
        otr('O', 'B'),
        pryam('O', 'A', 'C'),
        pryam('O', 'B', 'C'),
      ],
    }),
  'tupoy-ugol': () =>
    sCh({
      tochki: { ...poUglam(25, 30), D: { naPryamoy: ['B', 'C', 1.5] } },
      elementy: [
        tri('A', 'B', 'C'),
        { tip: 'prodolzhenie', a: 'B', b: 'C', doTochki: 'D', sploshnoe: true },
        ug('A', 'C', 'B', { vydelit: 'dano', znachenie: 'α' }),
        ug('A', 'C', 'D', { dugi: 2, znachenie: '180° − α' }),
      ],
    }),

  /* ── Новые сцены теории по справочнику ─────────────────────────── */

  'vidy-uglov': () =>
    sCh({
      tochki: {
        O1: [0, 0],
        A1: [3.4, 0],
        B1: polar(50, 3.4),
        O2: [6, 0],
        A2: [9.4, 0],
        B2: [6, 3.4],
        O3: [12.6, 0],
        A3: [16, 0],
        B3: [12.6 + 3.4 * Math.cos(130 * RAD), 3.4 * Math.sin(130 * RAD)],
      },
      elementy: [
        otr('O1', 'A1'),
        otr('O1', 'B1'),
        ug('A1', 'O1', 'B1', { vydelit: 'dano', znachenie: 'острый' }),
        otr('O2', 'A2'),
        otr('O2', 'B2'),
        pryam('A2', 'O2', 'B2'),
        otr('O3', 'A3'),
        otr('O3', 'B3'),
        ug('A3', 'O3', 'B3', { vydelit: 'dano', znachenie: 'тупой' }),
      ],
      podpisi: false,
    }),
  neravenstvo: () =>
    sCh({
      tochki: poUglam(48, 64),
      elementy: [tri('A', 'B', 'C'), zn('B', 'C', 'a'), zn('A', 'C', 'b'), zn('A', 'B', 'c')],
    }),
  'bolshaya-storona': () =>
    sCh({
      tochki: poUglam(28, 46),
      elementy: [
        tri('A', 'B', 'C'),
        otr('A', 'B', { vydelit: 'iskomoe' }),
        ug('A', 'C', 'B', { vydelit: 'iskomoe', znachenie: 'больший' }),
      ],
    }),
  geron: () =>
    sCh({
      tochki: poUglam(48, 64),
      elementy: [
        oblast(['A', 'B', 'C'], { vydelit: 'iskomoe' }),
        tri('A', 'B', 'C'),
        zn('B', 'C', 'a'),
        zn('A', 'C', 'b'),
        zn('A', 'B', 'c'),
      ],
    }),
  'ploshchad-R': () =>
    sCh({
      tochki: { ...poUglam(55, 70), O: { centrOpisannoy: ['A', 'B', 'C'] } },
      okruzhnosti: { w: { opisannaya: ['A', 'B', 'C'] } },
      elementy: [
        okr('w'),
        tri('A', 'B', 'C'),
        tochka('O'),
        otr('O', 'A', { vydelit: 'iskomoe' }),
        zn('O', 'A', 'R', { vydelit: 'iskomoe' }),
      ],
    }),
  'pravilnyy-treugolnik': () =>
    sCh({
      tochki: {
        ...poUglam(60, 60),
        M: { seredina: ['A', 'B'] },
        O: { centrOpisannoy: ['A', 'B', 'C'] },
      },
      elementy: [
        tri('A', 'B', 'C'),
        otr('C', 'M'),
        pryam('C', 'M', 'B'),
        otr('O', 'A', { vydelit: 'iskomoe' }),
        tochka('O'),
        zn('O', 'A', 'R', { vydelit: 'iskomoe' }),
        zn('O', 'M', 'r'),
        shtrih('A', 'C', 1, { tolkoShtrihi: true }),
        shtrih('C', 'B', 1, { tolkoShtrihi: true }),
        shtrih('A', 'B', 1, { tolkoShtrihi: true }),
      ],
      podpisi: ['A', 'B', 'C', 'O', 'M'],
    }),
  podobnye: () => {
    const t = poUglam(40, 65, 6);
    const k = 1.6;
    const sdvig = (p: T2): T2 => [p[0] * k + 8, p[1] * k];
    return sCh({
      tochki: { A: t.A, B: t.B, C: t.C, A1: sdvig(t.A), B1: sdvig(t.B), C1: sdvig(t.C) },
      elementy: [
        tri('A', 'B', 'C'),
        tri('A1', 'B1', 'C1', { vydelit: 'iskomoe' }),
        ug('C', 'A', 'B'),
        ug('C1', 'A1', 'B1'),
        ug('A', 'B', 'C', { dugi: 2 }),
        ug('A1', 'B1', 'C1', { dugi: 2 }),
        zn('A', 'B', 'a₁'),
        zn('A1', 'B1', 'a₂'),
      ],
    });
  },
  ravnye: () => {
    const t = poUglam(45, 62, 6);
    const sdvig = (p: T2): T2 => [p[0] + 8, p[1]];
    return sCh({
      tochki: { A: t.A, B: t.B, C: t.C, A1: sdvig(t.A), B1: sdvig(t.B), C1: sdvig(t.C) },
      elementy: [
        tri('A', 'B', 'C'),
        tri('A1', 'B1', 'C1'),
        shtrih('A', 'B', 1, { tolkoShtrihi: true }),
        shtrih('A1', 'B1', 1, { tolkoShtrihi: true }),
        shtrih('B', 'C', 2, { tolkoShtrihi: true }),
        shtrih('B1', 'C1', 2, { tolkoShtrihi: true }),
        shtrih('A', 'C', 3, { tolkoShtrihi: true }),
        shtrih('A1', 'C1', 3, { tolkoShtrihi: true }),
      ],
    });
  },
  mediany: () =>
    sCh({
      tochki: {
        ...poUglam(52, 58),
        K: { seredina: ['B', 'C'] },
        L: { seredina: ['A', 'C'] },
        N: { seredina: ['A', 'B'] },
        M: {
          peresechenie: [
            ['A', 'K'],
            ['B', 'L'],
          ],
        },
      },
      elementy: [
        tri('A', 'B', 'C'),
        otr('A', 'K'),
        otr('B', 'L'),
        otr('C', 'N'),
        tochka('M'),
        zn('A', 'M', '2x', { vydelit: 'iskomoe' }),
        zn('M', 'K', 'x'),
        shtrih('B', 'K', 1, { tolkoShtrihi: true }),
        shtrih('K', 'C', 1, { tolkoShtrihi: true }),
      ],
      podpisi: ['A', 'B', 'C', 'M', 'K'],
    }),
  'mediana-ploshchad': () =>
    sCh({
      tochki: { ...poUglam(55, 50), M: { seredina: ['A', 'B'] } },
      elementy: [
        oblast(['A', 'M', 'C'], { vydelit: 'dano' }),
        oblast(['M', 'B', 'C'], { vydelit: 'iskomoe' }),
        tri('A', 'B', 'C'),
        otr('C', 'M'),
        shtrih('A', 'M', 1, { tolkoShtrihi: true }),
        shtrih('M', 'B', 1, { tolkoShtrihi: true }),
      ],
    }),
  'bissektrisa-delit': () =>
    sCh({
      tochki: { ...poUglam(62, 40), L: { bissektrisa: ['C', 'A', 'B'] } },
      elementy: [
        tri('A', 'B', 'C'),
        otr('C', 'L', { vydelit: 'iskomoe' }),
        ug('A', 'C', 'L'),
        ug('L', 'C', 'B'),
        zn('A', 'L', 'm'),
        zn('L', 'B', 'n'),
        zn('A', 'C', 'b'),
        zn('C', 'B', 'a'),
      ],
    }),
  'bissektrisy-45': () =>
    sCh({
      tochki: {
        ...pryamougolnyy(34),
        I: { centrVpisannoy: ['A', 'B', 'C'] },
        K: { naPryamoy: ['A', 'I', 1.45] },
      },
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        otr('A', 'K'),
        otr('B', 'I'),
        ug('B', 'A', 'I'),
        ug('I', 'A', 'C'),
        ug('A', 'B', 'I', { dugi: 2 }),
        ug('I', 'B', 'C', { dugi: 2 }),
        ug('K', 'I', 'B', { vydelit: 'iskomoe', znachenie: '45°' }),
      ],
      podpisi: ['A', 'B', 'C', 'I'],
    }),
  seredinnyy: () =>
    sCh({
      tochki: {
        ...poUglam(58, 66),
        O: { centrOpisannoy: ['A', 'B', 'C'] },
        N: { seredina: ['A', 'B'] },
        K: { seredina: ['B', 'C'] },
      },
      okruzhnosti: { w: { opisannaya: ['A', 'B', 'C'] } },
      elementy: [
        okr('w'),
        tri('A', 'B', 'C'),
        tochka('O'),
        otr('O', 'N'),
        otr('O', 'K'),
        pryam('O', 'N', 'B'),
        pryam('O', 'K', 'C'),
        otr('O', 'A', { vydelit: 'iskomoe' }),
        otr('O', 'B', { vydelit: 'iskomoe' }),
        otr('O', 'C', { vydelit: 'iskomoe' }),
        shtrih('A', 'N', 1, { tolkoShtrihi: true }),
        shtrih('N', 'B', 1, { tolkoShtrihi: true }),
      ],
      podpisi: ['A', 'B', 'C', 'O'],
    }),
  'vpisannaya-treugolnik': () =>
    sCh({
      tochki: {
        ...poUglam(60, 50),
        I: { centrVpisannoy: ['A', 'B', 'C'] },
        H: { osnovanie: ['I', 'A', 'B'] },
      },
      okruzhnosti: { w: { vpisannaya: ['A', 'B', 'C'] } },
      elementy: [
        okr('w'),
        tri('A', 'B', 'C'),
        tochka('I'),
        otr('I', 'H', { vydelit: 'iskomoe' }),
        pryam('I', 'H', 'B'),
        zn('I', 'H', 'r', { vydelit: 'iskomoe' }),
      ],
      podpisi: ['A', 'B', 'C', 'I'],
    }),
  'summa-360': () =>
    sCh({
      tochki: { A: [0, 0], B: [1.5, 5.5], C: [8, 6.5], D: [10, 0] },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        ug('D', 'A', 'B'),
        ug('A', 'B', 'C', { dugi: 2 }),
        ug('B', 'C', 'D', { dugi: 3 }),
        ug('C', 'D', 'A', { vydelit: 'iskomoe' }),
      ],
    }),
  'ploshchad-diagonali': () =>
    sCh({
      tochki: {
        A: [0, 0],
        B: [2, 5.5],
        C: [9, 6.5],
        D: [10, 0],
        O: {
          peresechenie: [
            ['A', 'C'],
            ['B', 'D'],
          ],
        },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C', { vydelit: 'iskomoe' }),
        otr('B', 'D', { vydelit: 'iskomoe' }),
        ug('C', 'O', 'D', { vydelit: 'dano', znachenie: 'φ' }),
        zn('A', 'O', 'd₁'),
        zn('O', 'B', 'd₂'),
      ],
      podpisi: ['A', 'B', 'C', 'D'],
    }),
  varinon: () =>
    sCh({
      tochki: {
        A: [0, 0],
        B: [1.5, 6],
        C: [8.5, 7],
        D: [11, 0],
        K: { seredina: ['A', 'B'] },
        L: { seredina: ['B', 'C'] },
        M: { seredina: ['C', 'D'] },
        N: { seredina: ['D', 'A'] },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        mn(['K', 'L', 'M', 'N'], { vydelit: 'iskomoe' }),
        shtrih('A', 'K', 1, { tolkoShtrihi: true }),
        shtrih('K', 'B', 1, { tolkoShtrihi: true }),
        shtrih('C', 'M', 2, { tolkoShtrihi: true }),
        shtrih('M', 'D', 2, { tolkoShtrihi: true }),
      ],
    }),
  'ugly-trapecii': () =>
    sCh({
      tochki: trapeciya(12, 6, 5, 2),
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        ug('D', 'A', 'B', { znachenie: 'α' }),
        ug('A', 'B', 'C', { dugi: 2, znachenie: '180° − α' }),
      ],
    }),
  'ploshchad-trapecii': () =>
    sCh({
      tochki: { ...trapeciya(12, 6, 5, 2), H: { osnovanie: ['B', 'A', 'D'] } },
      elementy: [
        oblast(['A', 'B', 'C', 'D'], { vydelit: 'iskomoe' }),
        mn(['A', 'B', 'C', 'D']),
        otr('B', 'H'),
        pryam('B', 'H', 'D'),
        zn('A', 'D', 'a'),
        zn('B', 'C', 'b'),
        zn('B', 'H', 'h'),
      ],
      podpisi: ['A', 'B', 'C', 'D'],
    }),
  zamechatelnoe: () =>
    sCh({
      tochki: {
        ...trapeciya(12, 5, 5, 4),
        K: {
          peresechenie: [
            ['A', 'B'],
            ['D', 'C'],
          ],
        },
        O: {
          peresechenie: [
            ['A', 'C'],
            ['B', 'D'],
          ],
        },
        E: { seredina: ['B', 'C'] },
        F: { seredina: ['A', 'D'] },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('B', 'K'),
        otr('C', 'K'),
        otr('A', 'C'),
        otr('B', 'D'),
        otr('K', 'F', { vydelit: 'iskomoe' }),
        tochka('O'),
        tochka('E'),
        tochka('F'),
      ],
    }),
  'romb-diagonali': () =>
    sCh({
      tochki: {
        A: [0, 0],
        B: [3, 4],
        C: [8, 4],
        D: [5, 0],
        O: {
          peresechenie: [
            ['A', 'C'],
            ['B', 'D'],
          ],
        },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C', { vydelit: 'iskomoe' }),
        otr('B', 'D', { vydelit: 'iskomoe' }),
        pryam('C', 'O', 'D'),
        shtrih('A', 'B', 1),
        shtrih('B', 'C', 1),
        shtrih('C', 'D', 1),
        shtrih('D', 'A', 1),
      ],
      podpisi: ['A', 'B', 'C', 'D', 'O'],
    }),
  pryamougolnik: () =>
    sCh({
      tochki: { A: [0, 0], B: [0, 6], C: [10, 6], D: [10, 0], O: { seredina: ['A', 'C'] } },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C', { vydelit: 'iskomoe' }),
        otr('B', 'D', { vydelit: 'iskomoe' }),
        pryam('B', 'A', 'D'),
        shtrih('A', 'O', 1, { tolkoShtrihi: true }),
        shtrih('O', 'C', 1, { tolkoShtrihi: true }),
        shtrih('B', 'O', 1, { tolkoShtrihi: true }),
        shtrih('O', 'D', 1, { tolkoShtrihi: true }),
      ],
    }),
  'dlina-okruzhnosti': () =>
    sCh({
      tochki: { O: [0, 0], A: kr(200), B: kr(20) },
      okruzhnosti: { w: { centr: 'O', radius: 5 } },
      elementy: [okr('w', { vydelit: 'iskomoe' }), tochka('O'), otr('O', 'B'), zn('O', 'B', 'R')],
      podpisi: ['O'],
    }),
  sektor: () =>
    sCh({
      tochki: { O: [0, 0], A: kr(10), B: kr(80) },
      okruzhnosti: { w: { centr: 'O', radius: 5 } },
      elementy: [
        okr('w'),
        otr('O', 'A'),
        otr('O', 'B'),
        ug('A', 'O', 'B', { vydelit: 'dano', znachenie: 'α' }),
        duga('w', 'A', 'B', { vydelit: 'iskomoe' }),
        zn('O', 'A', 'R'),
      ],
      podpisi: ['O', 'A', 'B'],
    }),
  'khordy-peresechenie': () =>
    sCh({
      tochki: {
        O: [0, 0],
        A: kr(150),
        B: kr(345),
        C: kr(60),
        D: kr(240),
        E: {
          peresechenie: [
            ['A', 'B'],
            ['C', 'D'],
          ],
        },
      },
      okruzhnosti: { w: { centr: 'O', radius: 5 } },
      elementy: [okr('w'), otr('A', 'B'), otr('C', 'D', { vydelit: 'iskomoe' }), tochka('E')],
      podpisi: ['A', 'B', 'C', 'D', 'E'],
    }),
  'diametr-khorda': () =>
    sCh({
      tochki: {
        O: [0, 0],
        A: kr(200),
        B: kr(340),
        M: { seredina: ['A', 'B'] },
        P: kr(90),
        Q: kr(270),
      },
      okruzhnosti: { w: { centr: 'O', radius: 5 } },
      elementy: [
        okr('w'),
        otr('A', 'B'),
        otr('P', 'Q', { vydelit: 'iskomoe' }),
        pryam('B', 'M', 'P'),
        tochka('O'),
        shtrih('A', 'M', 1, { tolkoShtrihi: true }),
        shtrih('M', 'B', 1, { tolkoShtrihi: true }),
      ],
      podpisi: ['O', 'A', 'B', 'M'],
    }),
  'kasanie-okruzhnostey': () =>
    sCh({
      tochki: { O1: [0, 0], O2: [7, 0], C: [4.5, 0] },
      okruzhnosti: { w: { centr: 'O1', radius: 4.5 }, v: { centr: 'O2', radius: 2.5 } },
      elementy: [
        okr('w'),
        okr('v'),
        otr('O1', 'O2', { vydelit: 'iskomoe' }),
        tochka('O1'),
        tochka('O2'),
        tochka('C'),
        zn('O1', 'C', 'R'),
        zn('C', 'O2', 'r'),
      ],
    }),
  'mezhdu-khordami': () =>
    sCh({
      tochki: {
        O: [0, 0],
        A: kr(160),
        B: kr(330),
        C: kr(60),
        D: kr(250),
        E: {
          peresechenie: [
            ['A', 'B'],
            ['C', 'D'],
          ],
        },
      },
      okruzhnosti: { w: { centr: 'O', radius: 5 } },
      elementy: [
        okr('w'),
        otr('A', 'B'),
        otr('C', 'D'),
        duga('w', 'D', 'B', { vydelit: 'dano' }),
        duga('w', 'C', 'A', { vydelit: 'dano' }),
        ug('B', 'E', 'D', { vydelit: 'iskomoe', znachenie: 'φ' }),
      ],
      podpisi: ['A', 'B', 'C', 'D', 'E'],
    }),
  /* Лайфхаки. */
  'bissektrisy-smezhnyh': () =>
    sCh({
      tochki: {
        A: [-6, 0],
        B: [6, 0],
        O: [0, 0],
        C: polar(70, 6),
        K: polar(35, 5),
        L: polar(125, 5),
      },
      elementy: [
        otr('A', 'B'),
        otr('O', 'C'),
        otr('O', 'K'),
        otr('O', 'L'),
        ug('B', 'O', 'K'),
        ug('K', 'O', 'C'),
        ug('C', 'O', 'L', { dugi: 2 }),
        ug('L', 'O', 'A', { dugi: 2 }),
        pryam('K', 'O', 'L', { vydelit: 'iskomoe' }),
      ],
      podpisi: ['O'],
    }),
  'proekciya-trapecii': () =>
    sCh({
      tochki: { ...trapeciya(12, 6, 5, 3), H: { osnovanie: ['B', 'A', 'D'] } },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('B', 'H'),
        pryam('B', 'H', 'D'),
        otr('A', 'H', { vydelit: 'iskomoe' }),
        zn('A', 'H', '(a − b)/2', { vydelit: 'iskomoe' }),
        shtrih('A', 'B', 1, { tolkoShtrihi: true }),
        shtrih('C', 'D', 1, { tolkoShtrihi: true }),
      ],
      podpisi: ['A', 'B', 'C', 'D', 'H'],
    }),
  'ravnye-khordy': () =>
    sCh({
      tochki: {
        O: [0, 0],
        A: kr(120),
        B: kr(60),
        C: kr(250),
        D: kr(190),
        M: { osnovanie: ['O', 'A', 'B'] },
        N: { osnovanie: ['O', 'C', 'D'] },
      },
      okruzhnosti: { w: { centr: 'O', radius: 5 } },
      elementy: [
        okr('w'),
        otr('A', 'B'),
        otr('C', 'D'),
        otr('O', 'M', { vydelit: 'iskomoe' }),
        otr('O', 'N', { vydelit: 'iskomoe' }),
        pryam('O', 'M', 'B'),
        pryam('O', 'N', 'D'),
        tochka('O'),
        shtrih('A', 'B', 1, { tolkoShtrihi: true }),
        shtrih('C', 'D', 1, { tolkoShtrihi: true }),
      ],
      podpisi: ['O', 'A', 'B', 'C', 'D'],
    }),
  'parallelnye-khordy': () =>
    sCh({
      tochki: { O: [0, 0], A: kr(150), B: kr(30), C: kr(205), D: kr(335) },
      okruzhnosti: { w: { centr: 'O', radius: 5 } },
      elementy: [
        okr('w'),
        otr('A', 'B'),
        otr('C', 'D'),
        duga('w', 'C', 'A', { vydelit: 'iskomoe' }),
        duga('w', 'B', 'D', { vydelit: 'iskomoe' }),
      ],
      podpisi: ['A', 'B', 'C', 'D'],
    }),
  'r-pryamougolnogo': () =>
    sCh({
      tochki: {
        ...pryamougolnyy(37, 'katety'),
        I: { centrVpisannoy: ['A', 'B', 'C'] },
        H: { osnovanie: ['I', 'C', 'B'] },
      },
      okruzhnosti: { w: { vpisannaya: ['A', 'B', 'C'] } },
      elementy: [
        okr('w'),
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        otr('I', 'H', { vydelit: 'iskomoe' }),
        zn('I', 'H', 'r', { vydelit: 'iskomoe' }),
        zn('C', 'B', 'a'),
        zn('A', 'C', 'b'),
        zn('A', 'B', 'c'),
      ],
      podpisi: ['A', 'B', 'C'],
    }),
};

/** Рисунки из прототипов: [номер прототипа, числа, режим]. */
const IZ_PROTOTIPOV: Record<string, () => RisunokTeorii> = {
  vneshniy: () => izPrototipa(51),
  ravnobedrennyy: () => izPrototipa(1, {}, { rezhim: 'podskazka', shag: 1 }),
  'mediana-gipotenuza': () => izPrototipa(4, {}, { rezhim: 'podskazka', shag: 1 }),
  'vysota-bissektrisa': () => izPrototipa(6),
  'bissektrisa-mediana': () => izPrototipa(5),
  'vysota-mediana': () => izPrototipa(8),
  'bissektrisa-ugla': () => izPrototipa(9),
  'vysoty-peresechenie': () => izPrototipa(10),
  'bissektrisy-peresechenie': () => izPrototipa(11),
  romb: () => izPrototipa(13, {}, { rezhim: 'podskazka', shag: 1 }),
  'bissektrisa-parallelogramma': () => izPrototipa(53),
  'srednyaya-liniya-trapecii': () => izPrototipa(22),
  'serediny-diagonaley': () => izPrototipa(71),
  'ploshchad-parallelogramma': () => izPrototipa(14),
  'ploshchad-treugolnika': () => izPrototipa(16),
  'ploshchad-sinus': () => izPrototipa(17, {}, { rezhim: 'podskazka', shag: 1 }),
  'srednyaya-liniya': () => izPrototipa(19),
  otsechennyy: () => izPrototipa(21),
  'cos-ravnobedrennyy': () => izPrototipa(23),
  'osnovnoe-tozhdestvo': () => izPrototipa(28),
  kosinusov: () => izPrototipa(57),
  'vysota-gipotenuza': () => izPrototipa(55),
  'centralnyy-vpisannyy': () => izPrototipa(33),
  diametry: () => izPrototipa(34),
  'duga-dolya': () => izPrototipa(35),
  'kasatelnaya-radius': () => izPrototipa(37, {}, { rezhim: 'podskazka', shag: 2 }),
  'dve-kasatelnye': () => izPrototipa(39),
  'khorda-kasatelnaya': () => izPrototipa(60),
  sekushchie: () => izPrototipa(40),
  'kasatelnaya-sekushchaya': () => izPrototipa(58),
  'opisannyy-chetyrehugolnik': () => izPrototipa(42),
  'opisannaya-trapeciya': () => izPrototipa(44),
  'pryamougolnaya-trapeciya': () => izPrototipa(43),
  'vpisannyy-chetyrehugolnik': () => izPrototipa(47),
  'odna-duga-chetyrehugolnik': () => izPrototipa(45),
  'pravilnyy-shestiugolnik': () => izPrototipa(63),
  'r-pravilnogo': () => izPrototipa(64),
  'teorema-sinusov': () => izPrototipa(49),
  'ploshchad-pr': () => izPrototipa(66),
};

export const KLYUCHI_TEORII = [...Object.keys(SVOI), ...Object.keys(IZ_PROTOTIPOV)] as const;
export type RisunokTeoriiId = string;

export function risunokTeorii(id: string): RisunokTeorii {
  const f = SVOI[id] ?? IZ_PROTOTIPOV[id];
  if (f === undefined) throw new Error(`нет рисунка теории «${id}»`);
  return f();
}

/** Подпись угла в градусах для текстов, где нужен знак градуса. */
export { gr };
