/**
 * База, задание №16 «Вычисления и преобразования»: прототипы задач.
 *
 * Прототип — «Задание N» сборника (29 типов) в четырёх разделах:
 * I степени, II корни, III логарифмы, IV тригонометрия. Задачи — готовые
 * аналоги (analogi.ts), проверенные по ключу; исходники задачника на
 * сайт не идут. Параметры задачи — номер исходника и аналога, условие
 * строится из записи аналога.
 *
 * Разбор (razbory-*.ts) идёт по свойствам и считает точно в дробях;
 * proverka — независимо: та же запись считается «в лоб» числами Math
 * (vychislitel.ts) и округляется до записи бланка.
 */

import type { Rng } from '@/lib/veroyatnost/generator';
import type { GruppaBazy, Params, Prototip, Resheno } from '../types';
import { ANALOGI_16, type Analog } from './analogi';
import { zapisQ } from './drob';
import type { Resh, Vid } from './obshchee';
import { VIDY_KORNI } from './razbory-korni';
import { VIDY_LOG } from './razbory-log';
import { pokaz, VIDY_STEPENI } from './razbory-stepeni';
import { VIDY_TRIG } from './razbory-trig';
import { poschitat, poschitatUslovie, vZapis } from './vychislitel';

export const GRUPPY_16: GruppaBazy[] = [
  { id: 'I', nazvanie: 'Степени', znak: 'a^{n}', ton: 'blue' },
  { id: 'II', nazvanie: 'Корни', znak: '\\sqrt{ab}', ton: 'orange' },
  { id: 'III', nazvanie: 'Логарифмы', znak: '\\log_{a}b', ton: 'green' },
  { id: 'IV', nazvanie: 'Тригонометрия', znak: '\\sin\\alpha', ton: 'navy' },
];

/** Задание сборника: группа, название, виды записей. */
const ZADANIYA: { n: number; gruppa: string; title: string; vidy: Vid[] }[] = [
  { n: 1, gruppa: 'I', title: 'Дроби из степеней', vidy: VIDY_STEPENI },
  { n: 2, gruppa: 'I', title: 'Сумма произведений на степени', vidy: VIDY_STEPENI },
  { n: 3, gruppa: 'I', title: 'Степени отрицательных чисел и десяти', vidy: VIDY_STEPENI },
  { n: 4, gruppa: 'I', title: 'Отрицательные показатели', vidy: VIDY_STEPENI },
  { n: 5, gruppa: 'I', title: 'Степень в степени', vidy: VIDY_STEPENI },
  { n: 6, gruppa: 'I', title: 'Степени $0{,}1$ и $0{,}01$', vidy: VIDY_STEPENI },
  { n: 7, gruppa: 'I', title: 'Разрядные слагаемые', vidy: VIDY_STEPENI },
  { n: 8, gruppa: 'I', title: 'Сумма с $10^{-1}$ и $10^{-2}$', vidy: VIDY_STEPENI },
  { n: 9, gruppa: 'I', title: 'Частное в стандартном виде', vidy: VIDY_STEPENI },
  { n: 10, gruppa: 'I', title: 'Стандартный вид числа', vidy: VIDY_STEPENI },
  { n: 11, gruppa: 'II', title: 'Произведение и частное корней', vidy: VIDY_KORNI },
  { n: 12, gruppa: 'II', title: 'Множитель перед корнем', vidy: VIDY_KORNI },
  { n: 13, gruppa: 'II', title: 'Корни в дроби', vidy: VIDY_KORNI },
  { n: 14, gruppa: 'II', title: 'Корень из степеней', vidy: VIDY_KORNI },
  { n: 15, gruppa: 'II', title: 'Скобки с корнями', vidy: VIDY_KORNI },
  {
    n: 16,
    gruppa: 'II',
    title: 'Разность квадратов: $k\\sqrt{a}$ и $\\sqrt{b}$',
    vidy: VIDY_KORNI,
  },
  { n: 17, gruppa: 'II', title: 'Разность квадратов с множителями', vidy: VIDY_KORNI },
  { n: 18, gruppa: 'III', title: 'Сумма логарифмов', vidy: VIDY_LOG },
  { n: 19, gruppa: 'III', title: 'Разность логарифмов', vidy: VIDY_LOG },
  { n: 20, gruppa: 'III', title: 'Логарифм логарифма', vidy: VIDY_LOG },
  { n: 21, gruppa: 'III', title: 'Логарифм суммы с логарифмом', vidy: VIDY_LOG },
  { n: 22, gruppa: 'III', title: 'Вынос показателя, основание-корень', vidy: VIDY_LOG },
  { n: 23, gruppa: 'III', title: 'Логарифмическое тождество', vidy: VIDY_LOG },
  { n: 24, gruppa: 'III', title: 'Тождество с отрицательным показателем', vidy: VIDY_LOG },
  { n: 25, gruppa: 'IV', title: '$\\sin\\alpha$ по $\\cos\\alpha$', vidy: VIDY_TRIG },
  { n: 26, gruppa: 'IV', title: '$\\cos\\alpha$ по $\\sin\\alpha$', vidy: VIDY_TRIG },
  {
    n: 27,
    gruppa: 'IV',
    title: '$\\mathrm{tg}\\,\\alpha$ по синусу или косинусу',
    vidy: VIDY_TRIG,
  },
  { n: 28, gruppa: 'IV', title: 'Формулы приведения', vidy: VIDY_TRIG },
  {
    n: 29,
    gruppa: 'IV',
    title: '$\\mathrm{tg}\\,\\alpha \\cdot \\mathrm{ctg}\\,\\alpha$',
    vidy: VIDY_TRIG,
  },
];

/** Задачи с условием словами: «Найдите sin α, если …». */
const SLOVAMI = /^Найдите /;

function analog(n: number, p: Params): Analog {
  const k = p.k;
  const j = p.j;
  const a = (ANALOGI_16[n] ?? []).find((x) => x[0] === k && x[1] === j);
  if (a === undefined) throw new Error(`нет аналога ${n}: ${String(k)}.${String(j)}`);
  return a;
}

/** Десятичные запятые в формулах — {,}, чтобы KaTeX не ставил пробел. */
function zapyatye(t: string): string {
  return t.replace(/(\d),(\d)/g, '$1{,}$2');
}

function uslovie(zapis: string): string {
  if (SLOVAMI.test(zapis)) return pokaz(zapis);
  return `Найдите значение выражения $${zapyatye(pokaz(zapis))}$.`;
}

function reshit(vidy: Vid[], zapis: string): Resh {
  for (const v of vidy) {
    const m = v.re.exec(zapis);
    if (m !== null) return v.reshit(m, zapis);
  }
  throw new Error(`не узнана запись: «${zapis}»`);
}

function prototip(z: (typeof ZADANIYA)[number]): Prototip {
  const spisok = ANALOGI_16[z.n] ?? [];
  return {
    id: `P${String(z.n).padStart(2, '0')}`,
    gruppa: z.gruppa,
    title: z.title,
    tip: 'chislo',
    zadach: spisok.length,
    generate(rng: Rng) {
      const a = rng.pick(spisok);
      return { k: a[0], j: a[1] };
    },
    text: (p) => uslovie(analog(z.n, p)[2]),
    solve(p): Resheno {
      const r = reshit(z.vidy, analog(z.n, p)[2]);
      return { otvet: zapisQ(r.otvet), etapy: r.etapy, hints: r.hints };
    },
    proverka(p) {
      const zapis = analog(z.n, p)[2];
      return vZapis(SLOVAMI.test(zapis) ? poschitatUslovie(zapis) : poschitat(zapis));
    },
  };
}

export const PROTOTIPY_16: Prototip[] = ZADANIYA.map(prototip);
