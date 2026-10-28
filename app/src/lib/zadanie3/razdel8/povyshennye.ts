/**
 * Раздел VIII для «Вариантов повышенной сложности»: шар в цилиндре и
 * конус в шаре — те же формы, что P03-85, P03-86, P03-90 и P03-91, но
 * свои: свой разбор, без вариантов банка (условие — то же, что в разделе). Раздел
 * вариантов считает ответы в браузере, и прототипы банка с их
 * вариантами в его код не попадают (test:secrets).
 *
 * В список прототипов раздела (тренажёр, банк, «Собрать вариант») они
 * не входят. Проверка по модели — у прототипов банка той же формы.
 */

import { box } from '../../solid/figures';
import { surfaceArea } from '../../solid/measure';
import { unlabelled } from '../../solid/drawings/common';
import { type Model } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';
import { cube, cubeVolume, cylinderOverBallArea, inradiusOfCube } from './common';
import { ballInCube, ballInCylinder, sphereAroundCone } from './drawings';
import { ru } from '../format';
import { type Prototype, num } from '../types';

/** Общее у четырёх: свои, в банк не входят, вариантов нет. */
const SVOI = {
  razdel: 'VIII',
  status: 'добавить',
  dopustimo: (p: Parameters<Prototype['otvet']>[0]) => num(p, 'V') > 0,
  varianty: [],
} as const;

/* ── Цилиндр около шара: объём цилиндра ─────────────────────────── */

export const PV03_CILINDR: Prototype = {
  ...SVOI,
  id: 'PV03-cilindr',
  /* Номера задачника — у прототипа банка той же формы. */
  zadachnik: [298, 301],
  nazvanie: 'Цилиндр около шара: объём цилиндра',
  tip: 'объём описанного цилиндра по объёму шара',
  format: 'десятичная',
  uslovie: (p) =>
    `Шар, объём которого равен ${ru(num(p, 'V'))}, вписан в цилиндр. Найдите объём цилиндра.`,
  otvet: (p) => num(p, 'V') * 1.5,
  poModeli: (p) => num(p, 'V') * 1.5,
  chertezh: () => ballInCylinder('Шар, вписанный в цилиндр'),
  shagi: (p) => {
    const V = num(p, 'V');
    return [
      {
        text: 'Пусть $R$ — радиус шара. Тогда у цилиндра радиус основания $R$ и высота $2R$: $V_{\\text{цил}} = \\pi R^2\\cdot 2R = 2\\pi R^3$, а $V_{\\text{шара}} = \\tfrac43\\pi R^3$. Отношение: $2 : \\tfrac43 = \\tfrac32$.',
      },
      { text: `$V_{\\text{цил}} = \\tfrac32\\cdot ${ru(V)} = ${ru(V * 1.5)}$.`, value: V * 1.5 },
    ];
  },
};

/* ── Шар в цилиндре: объём шара ─────────────────────────────────── */

export const PV03_SHAR: Prototype = {
  ...SVOI,
  id: 'PV03-shar',
  /* Номера задачника — у прототипа банка той же формы. */
  zadachnik: [302, 305],
  nazvanie: 'Шар в цилиндре: объём шара',
  tip: 'объём вписанного шара по объёму цилиндра',
  format: 'десятичная',
  uslovie: (p) =>
    `Цилиндр, объём которого равен ${ru(num(p, 'V'))}, описан около шара. Найдите объём шара.`,
  otvet: (p) => (num(p, 'V') * 2) / 3,
  poModeli: (p) => (num(p, 'V') * 2) / 3,
  chertezh: () => ballInCylinder('Цилиндр, описанный около шара'),
  shagi: (p) => {
    const V = num(p, 'V');
    return [
      {
        text: 'Радиус основания цилиндра равен радиусу шара $R$, высота — диаметру $2R$: $V_{\\text{цил}} = 2\\pi R^3$, $V_{\\text{шара}} = \\tfrac43\\pi R^3$, то есть шар занимает $\\tfrac23$ цилиндра.',
      },
      {
        text: `$V_{\\text{шара}} = \\tfrac23\\cdot ${ru(V)} = ${ru((V * 2) / 3)}$.`,
        value: (V * 2) / 3,
      },
    ];
  },
};

/* ── Конус в шаре (радиус основания = радиус шара) ──────────────── */

/* Условие — как в разделе: формулировка вариантов 1–6 не меняется. */
const KONUS_V_SHARE = 'Конус вписан в шар. Радиус основания конуса равен радиусу шара. ';

const PROVERKA_KONUSA =
  'Радиус основания конуса равен радиусу шара $R$, высота — тоже $R$ (от центра до вершины): $V_{\\text{кон}} = \\tfrac13\\pi R^2\\cdot R = \\tfrac13\\pi R^3$, $V_{\\text{шара}} = \\tfrac43\\pi R^3$ — ровно в 4 раза больше.';

export const PV03_KONUS: Prototype = {
  ...SVOI,
  id: 'PV03-konus',
  /* Номера задачника — у прототипа банка той же формы. */
  zadachnik: [322, 325],
  nazvanie: 'Конус в шаре: объём конуса',
  tip: 'объём вписанного конуса по объёму шара',
  format: 'целое',
  uslovie: (p) => `${KONUS_V_SHARE}Объём шара равен ${ru(num(p, 'V'))}. Найдите объём конуса.`,
  otvet: (p) => num(p, 'V') / 4,
  poModeli: (p) => num(p, 'V') / 4,
  chertezh: () =>
    sphereAroundCone('Конус, вписанный в шар: радиус основания конуса равен радиусу шара'),
  shagi: (p) => {
    const V = num(p, 'V');
    return [
      { text: PROVERKA_KONUSA },
      { text: `$V_{\\text{кон}} = ${ru(V)} : 4 = ${ru(V / 4)}$.`, value: V / 4 },
    ];
  },
};

export const PV03_SHAR_OKOLO_KONUSA: Prototype = {
  ...SVOI,
  id: 'PV03-shar-okolo-konusa',
  /* Номера задачника — у прототипа банка той же формы. */
  zadachnik: [318, 321],
  nazvanie: 'Конус в шаре: объём шара',
  tip: 'объём шара по объёму вписанного конуса',
  format: 'целое',
  uslovie: (p) => `${KONUS_V_SHARE}Объём конуса равен ${ru(num(p, 'V'))}. Найдите объём шара.`,
  otvet: (p) => num(p, 'V') * 4,
  poModeli: (p) => num(p, 'V') * 4,
  chertezh: () =>
    sphereAroundCone('Конус, вписанный в шар: радиус основания конуса равен радиусу шара'),
  shagi: (p) => {
    const V = num(p, 'V');
    return [
      { text: PROVERKA_KONUSA },
      { text: `$V_{\\text{шара}} = 4\\cdot ${ru(V)} = ${ru(V * 4)}$.`, value: V * 4 },
    ];
  },
};

/* ── Куб, вписанный в шар: объём куба ──────────────────────────── */

/** Куб, вписанный в шар: вершины куба лежат на сфере. */
function cubeInBall(alt: string): Model {
  const a = 3.2;
  const cube = unlabelled(box(a, a, a));
  const center: Vec3 = [a / 2, a / 2, a / 2];
  return {
    alt,
    bodies: [cube, { kind: 'sphere', center, r: (a * Math.sqrt(3)) / 2, glass: true }],
  };
}

/** Радиус шара R = k√3 в TeX: «4{,}5\sqrt3». */
const rKoren3 = (k: number) => `${k === 1 ? '' : ru(k)}\\sqrt{3}`;

export const PV03_KUB_V_SHARE: Prototype = {
  ...SVOI,
  dopustimo: (p) => num(p, 'k') > 0,
  id: 'PV03-kub-v-share',
  /* Номера задачника — у прототипов раздела VIII о кубе и сфере. */
  zadachnik: [286, 289],
  nazvanie: 'Куб, вписанный в шар радиуса $k\\sqrt3$: объём куба',
  tip: 'объём куба по радиусу описанного шара',
  format: 'десятичная',
  uslovie: (p) => `Куб вписан в шар радиуса $${rKoren3(num(p, 'k'))}$. Найдите объём куба.`,
  otvet: (p) => (2 * num(p, 'k')) ** 3,
  /* Куб с ребром 2k — вершина на расстоянии R от центра, объём измеряется. */
  poModeli: (p) => {
    const a = 2 * num(p, 'k');
    const R = num(p, 'k') * Math.sqrt(3);
    const body = cube(a);
    const c: Vec3 = [a / 2, a / 2, a / 2];
    const v = body.vertices[0]!;
    if (Math.abs(Math.hypot(v[0] - c[0], v[1] - c[1], v[2] - c[2]) - R) > 1e-9)
      throw new Error('Вершина куба не на сфере');
    return Math.round(cubeVolume(a) * 1e6) / 1e6;
  },
  chertezh: () => cubeInBall('Куб, вписанный в шар'),
  shagi: (p) => {
    const k = num(p, 'k');
    const a = 2 * k;
    return [
      {
        text: `Вершины куба лежат на сфере, поэтому диагональ куба — диаметр шара: $d = 2R = ${rKoren3(2 * k)}$.`,
      },
      {
        text: `У куба с ребром $a$ диагональ равна $a\\sqrt3$, значит, $a = ${ru(a)}$.`,
        value: a,
      },
      { text: `Объём: $${ru(a)}^3 = ${ru(a ** 3)}$.`, value: a ** 3 },
    ];
  },
};

/* ── Параллелепипед, описанный около сферы: площадь поверхности ── */

export const PV03_PARALLELEPIPED_OKOLO_SFERY: Prototype = {
  ...SVOI,
  dopustimo: (p) => num(p, 'r') > 0,
  id: 'PV03-parallelepiped-okolo-sfery',
  /* Номера задачника — у прототипа банка той же формы (P03-83, там объём). */
  zadachnik: [290, 293],
  nazvanie: 'Параллелепипед около сферы: площадь поверхности',
  tip: 'площадь поверхности прямоугольного параллелепипеда, описанного около сферы',
  format: 'целое',
  uslovie: (p) =>
    `Прямоугольный параллелепипед описан около сферы радиуса ${ru(num(p, 'r'))}. Найдите площадь его поверхности.`,
  otvet: (p) => 24 * num(p, 'r') ** 2,
  poModeli: (p) => {
    const a = 2 * num(p, 'r');
    if (Math.abs(inradiusOfCube(a) - num(p, 'r')) > 1e-9)
      throw new Error('Сфера не касается всех граней');
    return Math.round(surfaceArea(cube(a)) * 1e6) / 1e6;
  },
  chertezh: () =>
    ballInCube('Прямоугольный параллелепипед, описанный около сферы: он оказывается кубом'),
  shagi: (p) => {
    const r = num(p, 'r');
    const a = 2 * r;
    return [
      {
        text: `Шар касается всех шести граней — так бывает только у куба: каждое ребро равно диаметру, $${ru(a)}$.`,
        value: a,
      },
      {
        text: `Поверхность куба — шесть квадратов: $6\\cdot ${ru(a)}^2 = ${ru(6 * a * a)}$.`,
        value: 6 * a * a,
      },
    ];
  },
};

/* ── Партия 5. Шар в цилиндре: поверхность шара по поверхности цилиндра ── */

/**
 * Шар вписан в цилиндр: по полной (vid 0) или боковой (vid 1) поверхности
 * цилиндра найти площадь поверхности шара. Подвох — высота цилиндра
 * равна диаметру, R = r; боковая поверхность 4πR² совпадает с поверхностью
 * шара, полная — 6πR², в полтора раза больше.
 */
export const PV03_SHAR_CILINDR_S: Prototype = {
  id: 'PV03-shar-cilindr-S',
  razdel: 'VIII',
  status: 'добавить',
  zadachnik: [294, 297],
  nazvanie: 'Шар в цилиндре: поверхность шара по поверхности цилиндра',
  tip: 'площадь поверхности вписанного шара по полной или боковой поверхности цилиндра',
  format: 'десятичная',
  uslovie: (p) =>
    `Шар вписан в цилиндр. Площадь ${num(p, 'vid') === 1 ? 'боковой' : 'полной'} поверхности цилиндра равна ${ru(num(p, 'S'))}. Найдите площадь поверхности шара.`,
  dopustimo: (p) => num(p, 'S') > 0,
  otvet: (p) =>
    num(p, 'vid') === 1 ? num(p, 'S') : Math.round(((num(p, 'S') * 2) / 3) * 1e9) / 1e9,
  /* По модели: боковая и полная поверхности измеренного цилиндра (r, 2r);
     поверхность шара — боковая (Архимед), отношение — как у P03-87. */
  poModeli: (p) =>
    Math.round((num(p, 'vid') === 1 ? num(p, 'S') : num(p, 'S') / cylinderOverBallArea(2.5)) * 1e6) /
    1e6,
  chertezh: () => ballInCylinder('Шар, вписанный в цилиндр'),
  shagi: (p) => {
    const S = num(p, 'S');
    const bok = num(p, 'vid') === 1;
    const ans = bok ? S : (S * 2) / 3;
    return [
      {
        text: 'Шар вписан в цилиндр: радиус основания цилиндра равен радиусу шара $R$, а высота — диаметру $2R$.',
      },
      bok
        ? {
            text: 'Боковая поверхность цилиндра: $2\\pi R\\cdot 2R=4\\pi R^2$ — ровно поверхность шара.',
          }
        : {
            text: 'Полная поверхность цилиндра: $2\\pi R\\cdot 2R+2\\pi R^2=6\\pi R^2$, а поверхность шара $4\\pi R^2$ — две трети от неё.',
          },
      {
        text: bok
          ? `Площадь поверхности шара равна ${ru(ans)}.`
          : `Площадь поверхности шара: $${ru(S)}\\cdot\\dfrac23=${ru(ans)}$.`,
        value: ans,
      },
    ];
  },
  varianty: [],
};
