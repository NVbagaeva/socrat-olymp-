/**
 * Рисунки теории, вкладки «О задании» и лайфхаков задания №1 — по
 * ключу. Только данные: рисует движок (render.ts). Часть сцен — свои
 * (смежные и вертикальные углы, параллельные прямые, особые
 * треугольники), остальные берутся у прототипов на их образце в
 * нужном режиме: так рисунок теории и рисунок задачи — одно и то же.
 */

import { POROG, poUglam, pryamougolnyy } from './figury';
import { polar } from './geom';
import { prototip } from './stseny';
import { gr, mn, okr, otr, pryam, pryamaya, shtrih, tochka, tri, ug } from './stseny/dsl';
import type { Nabor, Params } from './stseny/dsl';
import type { Optsii, Rezhim, Scena } from './types';

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
