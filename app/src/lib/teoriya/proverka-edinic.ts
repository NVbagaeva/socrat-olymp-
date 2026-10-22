/**
 * «Проверь себя» в общей теории единиц (№10 и №11): задачи с выбором
 * ответа и генератор «Ещё такое же».
 *
 * Каждая задача — шаблон: функция от источника случайных чисел. Первый
 * экземпляр (seed 0) собран из чисел, выбранных для теории; остальные —
 * новые числа того же вида. Неверные варианты не придумываются руками:
 * они строятся из типичных ошибок (не то действие, не тот множитель,
 * сложение вместо умножения, сдвиг запятой), и к каждому привязана своя
 * подсказка — без готового ответа.
 *
 * Модуль чистый: его берут сервер (готовит закрытые экземпляры для
 * страницы) и автотест (pnpm test:edinicy-proverka). В браузер уходят
 * не эти функции, а уже набранные варианты с отпечатком ответа.
 *
 * Тексты — с $…$ (KaTeX). Числа — через d(): запятая, тысячи — тонким
 * пробелом внутри формулы, поэтому «10 800» не рвётся.
 */

import { d, nice, round9 } from '../zadanie11/num';
import type { Rng } from '../veroyatnost/generator';

/** Вид ошибки: по нему выбирается подсказка. */
export type Oshibka = 'deystvie' | 'mnozhitel' | 'slozhenie' | 'zapyataya' | 'drugoe';

export interface VariantZadachi {
  /** Подпись на плитке: строка с $…$. */
  tekst: string;
  verno: boolean;
  /** Подсказка к этой ошибке (у верного варианта — нет). */
  podskazka?: string;
  oshibka?: Oshibka;
}

export interface ZadachaProverki {
  uslovie: string;
  varianty: VariantZadachi[];
  /** Разбор: одна-две строки — какая единица больше, умножаем или делим. */
  razbor: string[];
  /** Значение верного ответа — для автотеста «красивого» числа. */
  znachenie?: number;
}

export interface ShablonProverki {
  id: string;
  /** Тип А — «Что делаем?», тип Б — «Сколько?». */
  tip: 'deystvie' | 'skolko';
  /** seed 0 — числа теории, остальные — «Ещё такое же». */
  sozdat(r: Rng, nomer: number): ZadachaProverki;
}

/* ── Единицы ──────────────────────────────────────────────────── */

interface Para {
  /** Большая и меньшая единицы: обозначение и слово во мн. ч. */
  bol: { ed: string; slovo: string };
  men: { ed: string; slovo: string };
  /** Сколько меньших в большей. */
  f: number;
  /** «Не тот множитель»: что путают с f. */
  lozh: number[];
  vremya?: boolean;
}

const P = {
  chMin: {
    bol: { ed: 'ч', slovo: 'часы' },
    men: { ed: 'мин', slovo: 'минуты' },
    f: 60,
    lozh: [100, 10],
    vremya: true,
  },
  minS: {
    bol: { ed: 'мин', slovo: 'минуты' },
    men: { ed: 'с', slovo: 'секунды' },
    f: 60,
    lozh: [100, 10],
    vremya: true,
  },
  kmM: {
    bol: { ed: 'км', slovo: 'километры' },
    men: { ed: 'м', slovo: 'метры' },
    f: 1000,
    lozh: [100, 10],
  },
  mSm: {
    bol: { ed: 'м', slovo: 'метры' },
    men: { ed: 'см', slovo: 'сантиметры' },
    f: 100,
    lozh: [1000, 10],
  },
  kgG: {
    bol: { ed: 'кг', slovo: 'килограммы' },
    men: { ed: 'г', slovo: 'граммы' },
    f: 1000,
    lozh: [10, 100],
  },
  tKg: {
    bol: { ed: 'т', slovo: 'тонны' },
    men: { ed: 'кг', slovo: 'килограммы' },
    f: 1000,
    lozh: [100, 10],
  },
} satisfies Record<string, Para>;

const ED = (x: number, ed: string): string => `$${d(x)}\\text{ ${ed}}$`;
const FAKT = (p: Para): string => `$1\\text{ ${p.bol.ed}}=${d(p.f)}\\text{ ${p.men.ed}}$`;
const zaglavnaya = (s: string): string => (s[0]?.toUpperCase() ?? '') + s.slice(1);

/* ── Подсказки к ошибкам ──────────────────────────────────────── */

/** Предложный падеж: «в минутах», «в метрах». */
function mestn(slovo: string): string {
  const m: Record<string, string> = {
    часы: 'часах',
    минуты: 'минутах',
    секунды: 'секундах',
    километры: 'километрах',
    метры: 'метрах',
    сантиметры: 'сантиметрах',
    килограммы: 'килограммах',
    граммы: 'граммах',
    тонны: 'тоннах',
  };
  return m[slovo] ?? slovo;
}

/** Нужно умножить (большая → меньшая), а ученик разделил. */
function razdelilVmestoUmnozhit(p: Para): string {
  return `Ты разделил, а нужно умножить. ${zaglavnaya(p.bol.slovo)} — большая единица, ${p.men.slovo} — меньшая: из большей в меньшую умножаем. Проверь: в ${mestn(p.men.slovo)} число должно получиться больше, чем в ${mestn(p.bol.slovo)}.`;
}

/** Нужно разделить (меньшая → большая), а ученик умножил. */
function umnozhilVmestoRazdelit(p: Para): string {
  return `Ты умножил, а нужно разделить. ${zaglavnaya(p.men.slovo)} — меньшая единица, ${p.bol.slovo} — большая: из меньшей в большую делим. Число в ${mestn(p.bol.slovo)} должно быть меньше.`;
}

/** «Что делаем?»: выбрали обратное действие. */
function naoborot(p: Para, vniz: boolean): string {
  return vniz
    ? `Наоборот: ${p.bol.slovo} — большая единица, ${p.men.slovo} — меньшая, а из большей в меньшую умножаем. В ${mestn(p.men.slovo)} число должно получиться больше.`
    : `Наоборот: ${p.men.slovo} — меньшая единица, ${p.bol.slovo} — большая, а из меньшей в большую делим. В ${mestn(p.bol.slovo)} число должно получиться меньше.`;
}

function neTotMnozhitel(p: Para, lozh: number): string {
  return `Проверь опорный факт: ${FAKT(p)}, а не $${d(lozh)}$. Множитель берём из него.`;
}

function slozhil(p: Para): string {
  const kazhdyy =
    p.bol.ed === 'ч'
      ? 'каждый час — это $60$ минут'
      : `в каждом $1\\text{ ${p.bol.ed}}$ — $${d(p.f)}\\text{ ${p.men.ed}}$`;
  return `Единицы не складывают: ${FAKT(p)} значит, что ${kazhdyy}, поэтому нужно умножить.`;
}

function vychel(p: Para): string {
  return `Единицы не вычитают: ${FAKT(p)} значит, что в каждой большей единице $${d(p.f)}$ меньших. Сколько раз по $${d(p.f)}$ помещается — столько больших: делим.`;
}

const ZAPYATAYA =
  'Посмотри на число ещё раз: проверь, сколько нулей у множителя и сколько знаков после запятой получилось.';

/* ── Числа ────────────────────────────────────────────────────── */

/** Конечная десятичная дробь, не длиннее 5 значащих цифр. */
export function krasivoe(x: number): boolean {
  if (!Number.isFinite(x) || x <= 0 || !nice(x, 6)) {
    return false;
  }
  const cifry = String(round9(x)).replace('.', '').replace(/^0+/, '').replace(/0+$/, '');
  return cifry.length <= 5;
}

/** Дробь для неверного варианта: конечная, не слишком длинная. */
function godnoe(x: number): boolean {
  return Number.isFinite(x) && nice(x, 7) && x !== 0;
}

interface Kandidat {
  x: number;
  oshibka: Oshibka;
  podskazka: string;
}

/** Собрать варианты: верный + три ошибки по порядку, все разные. */
function varianty(verno: number, ed: string, kandidaty: Kandidat[]): VariantZadachi[] | null {
  const out: VariantZadachi[] = [{ tekst: ED(verno, ed), verno: true }];
  const byli = new Set([d(verno)]);
  for (const k of kandidaty) {
    if (out.length === 4) break;
    const x = round9(k.x);
    if (!godnoe(x) || byli.has(d(x))) continue;
    byli.add(d(x));
    out.push({ tekst: ED(x, ed), verno: false, oshibka: k.oshibka, podskazka: k.podskazka });
  }
  return out.length === 4 ? out : null;
}

/** Перемешать варианты (Фишер — Йейтс по источнику задачи). */
export function peremeshat<T>(r: Rng, list: readonly T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = r.int(0, i);
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/* ── Тип Б: «Сколько?» ────────────────────────────────────────── */

type VidOshibki =
  'f/x' | 'x/f' | 'x*f' | 'x*lozh0' | 'x/lozh0' | 'x/lozh1' | 'x+f' | 'x-f' | 'otv*10' | 'otv/10';

function kandidat(p: Para, x: number, otvet: number, vid: VidOshibki, vniz: boolean): Kandidat {
  const [l0 = 100, l1 = 10] = p.lozh;
  switch (vid) {
    case 'f/x':
      return { x: p.f / x, oshibka: 'deystvie', podskazka: razdelilVmestoUmnozhit(p) };
    case 'x/f':
      return { x: x / p.f, oshibka: 'deystvie', podskazka: razdelilVmestoUmnozhit(p) };
    case 'x*f':
      return { x: x * p.f, oshibka: 'deystvie', podskazka: umnozhilVmestoRazdelit(p) };
    case 'x*lozh0':
      return { x: x * l0, oshibka: 'mnozhitel', podskazka: neTotMnozhitel(p, l0) };
    case 'x/lozh0':
      return { x: x / l0, oshibka: 'mnozhitel', podskazka: neTotMnozhitel(p, l0) };
    case 'x/lozh1':
      return { x: x / l1, oshibka: 'mnozhitel', podskazka: neTotMnozhitel(p, l1) };
    case 'x+f':
      return { x: x + p.f, oshibka: 'slozhenie', podskazka: slozhil(p) };
    case 'x-f':
      return { x: x - p.f, oshibka: 'slozhenie', podskazka: vychel(p) };
    case 'otv*10':
      return { x: otvet * 10, oshibka: 'zapyataya', podskazka: ZAPYATAYA };
    case 'otv/10':
      return { x: otvet / 10, oshibka: 'zapyataya', podskazka: ZAPYATAYA };
    default:
      return { x: vniz ? x / p.f : x * p.f, oshibka: 'drugoe', podskazka: ZAPYATAYA };
  }
}

/** Запасные ошибки — если какая-то из основных совпала с другой. */
const ZAPAS_VNIZ: VidOshibki[] = ['x/f', 'x*lozh0', 'otv*10', 'otv/10', 'x+f'];
const ZAPAS_VVERH: VidOshibki[] = ['x*f', 'x/lozh0', 'x/lozh1', 'otv*10', 'otv/10'];

/**
 * «Сколько?»: из большей в меньшую (vniz) или обратно. Первый
 * экземпляр — числа теории (x0, пара p0), дальше — новые числa из
 * набора x и пар своей «семьи».
 */
function skolko(
  id: string,
  vniz: boolean,
  semya: { p: Para; xs: number[] }[],
  pervyy: { p: Para; x: number },
  oshibki: VidOshibki[],
): ShablonProverki {
  return {
    id,
    tip: 'skolko',
    sozdat(r, nomer) {
      for (let popytka = 0; popytka < 200; popytka += 1) {
        const s = r.pick(semya);
        const { p, x } = nomer === 0 ? pervyy : { p: s.p, x: r.pick(s.xs) };
        const otvet = round9(vniz ? x * p.f : x / p.f);
        if (!krasivoe(otvet)) continue;
        const ed = vniz ? p.men.ed : p.bol.ed;
        const vid = [...oshibki, ...(vniz ? ZAPAS_VNIZ : ZAPAS_VVERH)];
        const v = varianty(
          otvet,
          ed,
          vid.map((o) => kandidat(p, x, otvet, o, vniz)),
        );
        if (v === null) continue;
        const otkuda = vniz ? p.bol : p.men;
        const kuda = vniz ? p.men : p.bol;
        return {
          uslovie: `Сколько ${rod(kuda.slovo)} в ${ED(x, otkuda.ed)}?`,
          varianty: peremeshat(r, v),
          razbor: [
            `${FAKT(p)}. ${zaglavnaya(otkuda.slovo)} — ${vniz ? 'большая' : 'меньшая'} единица, ${kuda.slovo} — ${vniz ? 'меньшая' : 'большая'}: ${vniz ? 'из большей в меньшую — умножаем' : 'из меньшей в большую — делим'}.`,
            `$${d(x)}${vniz ? '\\cdot' : ':'}${d(p.f)}=${d(otvet)}\\text{ ${ed}}$.`,
          ],
          znachenie: otvet,
        };
      }
      throw new Error(`проверь себя ${id}: не собрать задачу`);
    },
  };
}

function rod(slovo: string): string {
  const m: Record<string, string> = {
    часы: 'часов',
    минуты: 'минут',
    секунды: 'секунд',
    километры: 'километров',
    метры: 'метров',
    сантиметры: 'сантиметров',
    килограммы: 'килограммов',
    граммы: 'граммов',
    тонны: 'тонн',
  };
  return m[slovo] ?? slovo;
}

/* ── Тип А: «Что делаем?» ─────────────────────────────────────── */

function chtoDelaem(
  id: string,
  vniz: boolean,
  semya: { p: Para; xs: number[] }[],
  pervyy: { p: Para; x: number },
): ShablonProverki {
  return {
    id,
    tip: 'deystvie',
    sozdat(r, nomer) {
      const s = r.pick(semya);
      const { p, x } = nomer === 0 ? pervyy : { p: s.p, x: r.pick(s.xs) };
      const [l0 = 100] = p.lozh;
      const otkuda = vniz ? p.bol : p.men;
      const kuda = vniz ? p.men : p.bol;
      const verno = vniz ? `умножить на $${d(p.f)}$` : `разделить на $${d(p.f)}$`;
      const obratno = vniz ? `разделить на $${d(p.f)}$` : `умножить на $${d(p.f)}$`;
      const v: VariantZadachi[] = [
        { tekst: verno, verno: true },
        {
          tekst: obratno,
          verno: false,
          oshibka: 'deystvie',
          podskazka: naoborot(p, vniz),
        },
        {
          tekst: `${vniz ? 'умножить' : 'разделить'} на $${d(l0)}$`,
          verno: false,
          oshibka: 'mnozhitel',
          podskazka: neTotMnozhitel(p, l0),
        },
        {
          tekst: `${vniz ? 'разделить' : 'умножить'} на $${d(l0)}$`,
          verno: false,
          oshibka: 'drugoe',
          podskazka: `Здесь не то действие и не то число. Сначала реши, какая единица больше, потом вспомни опорный факт: ${FAKT(p)}.`,
        },
      ];
      return {
        uslovie: `Переводим ${ED(x, otkuda.ed)} в ${kuda.slovo === 'часы' ? 'часы' : kuda.slovo}. Что нужно сделать?`,
        varianty: peremeshat(r, v),
        razbor: [
          `${zaglavnaya(otkuda.slovo)} — ${vniz ? 'большая' : 'меньшая'} единица, ${kuda.slovo} — ${vniz ? 'меньшая' : 'большая'}: ${vniz ? 'из большей в меньшую — умножаем' : 'из меньшей в большую — делим'}.`,
          `${FAKT(p)}, поэтому ${vniz ? 'умножаем' : 'делим'} на $${d(p.f)}$: $${d(x)}${vniz ? '\\cdot' : ':'}${d(p.f)}=${d(round9(vniz ? x * p.f : x / p.f))}$.`,
        ],
      };
    },
  };
}

/* ── Блок 1: семь задач ───────────────────────────────────────── */

const CHASY = [2, 3, 4, 5, 6, 7, 8, 1.5, 2.5, 0.5, 0.25, 0.75, 3.5];
const MINUTY = [120, 180, 240, 300, 90, 150, 30, 45, 15, 75, 210, 270, 360];
const KM = [1.2, 2.5, 3.4, 0.8, 4.25, 7.2, 0.35, 12, 6.5, 0.05];
const GRAMMY = [3500, 2500, 750, 1200, 4800, 250, 6400, 900, 1750, 50];
const M_SM = [1.5, 2.4, 0.6, 3, 0.85, 4.2];
const SM = [150, 240, 60, 300, 85, 420, 35];
const T = [1.5, 2.4, 0.6, 3, 0.85, 4.2, 12];
const KG = [1500, 2400, 600, 3000, 850, 4200, 12000];
const SEK = [120, 180, 90, 240, 30, 150, 300];

export const PROVERKA_KAK_PEREVODIT: readonly ShablonProverki[] = [
  chtoDelaem(
    'kak-1',
    true,
    [
      { p: P.kmM, xs: KM },
      { p: P.chMin, xs: CHASY },
      { p: P.tKg, xs: T },
    ],
    {
      p: P.kmM,
      x: 7.2,
    },
  ),
  chtoDelaem(
    'kak-2',
    false,
    [
      { p: P.chMin, xs: MINUTY },
      { p: P.kgG, xs: GRAMMY },
      { p: P.mSm, xs: SM },
    ],
    {
      p: P.chMin,
      x: 150,
    },
  ),
  skolko(
    'kak-3',
    true,
    [
      { p: P.chMin, xs: [2, 3, 4, 5, 6, 10, 12] },
      { p: P.minS, xs: [2, 3, 4, 5, 6, 10, 12] },
    ],
    { p: P.chMin, x: 5 },
    ['f/x', 'x*lozh0', 'x+f'],
  ),
  skolko(
    'kak-4',
    false,
    [
      { p: P.chMin, xs: MINUTY },
      { p: P.minS, xs: SEK },
    ],
    { p: P.chMin, x: 180 },
    ['x*f', 'x-f', 'otv*10'],
  ),
  skolko(
    'kak-5',
    true,
    [
      { p: P.kmM, xs: KM },
      { p: P.mSm, xs: M_SM },
      { p: P.tKg, xs: T },
    ],
    { p: P.kmM, x: 2.5 },
    ['x/f', 'x*lozh0', 'otv*10'],
  ),
  skolko(
    'kak-6',
    false,
    [
      { p: P.kgG, xs: GRAMMY },
      { p: P.tKg, xs: KG },
      { p: P.mSm, xs: SM },
    ],
    { p: P.kgG, x: 3500 },
    ['x*f', 'x/lozh0', 'x/lozh1'],
  ),
  skolko(
    'kak-7',
    true,
    [
      { p: P.chMin, xs: [1.5, 2.5, 0.5, 0.25, 0.75, 3.5, 1.25] },
      { p: P.minS, xs: [1.5, 2.5, 0.5, 0.25, 0.75, 3.5] },
    ],
    { p: P.chMin, x: 1.5 },
    ['x*lozh0', 'x+f', 'f/x'],
  ),
];

/* ── Блок 2: км/ч ↔ м/с ───────────────────────────────────────── */

const VYVOD_36 =
  'Числитель умножаем на $1000$, знаменатель — на $3600$: получается деление на $3{,}6$, а не умножение.';

export const PROVERKA_SOSTAVNYE: readonly ShablonProverki[] = [
  {
    id: 'sost-1',
    tip: 'skolko',
    sozdat(r, nomer) {
      const v = nomer === 0 ? 36 : r.pick([18, 54, 72, 90, 108, 144, 180]);
      const otvet = round9((v * 1000) / 3600);
      const k: Kandidat[] = [
        { x: v * 3.6, oshibka: 'deystvie', podskazka: VYVOD_36 },
        {
          x: otvet * 10,
          oshibka: 'mnozhitel',
          podskazka: 'Проверь знаменатель: $1\\text{ ч}=3600\\text{ с}$, а не $360$.',
        },
        {
          x: v / 3600,
          oshibka: 'deystvie',
          podskazka:
            'Числитель тоже переводим: $1\\text{ км}=1000\\text{ м}$ — километры в метры, умножаем на $1000$.',
        },
      ];
      return {
        uslovie: `Переведите $${d(v)}\\text{ км/ч}$ в $\\text{м/с}$.`,
        varianty: peremeshat(r, varianty(otvet, 'м/с', k) ?? []),
        razbor: [
          'Скорость — дробь: числитель $1\\text{ км}=1000\\text{ м}$ (умножаем), знаменатель $1\\text{ ч}=3600\\text{ с}$ (умножаем).',
          `$${d(v)}\\text{ км/ч}=\\dfrac{${d(v)}\\cdot1000\\text{ м}}{3600\\text{ с}}=${d(otvet)}\\text{ м/с}$.`,
        ],
        znachenie: otvet,
      };
    },
  },
  {
    id: 'sost-2',
    tip: 'skolko',
    sozdat(r, nomer) {
      const v = nomer === 0 ? 5 : r.pick([10, 15, 20, 25, 30, 2.5, 7.5]);
      const otvet = round9((v * 3600) / 1000);
      const k: Kandidat[] = [
        {
          x: Math.round((v / 3.6) * 10) / 10,
          oshibka: 'deystvie',
          podskazka:
            'Ты разделил на $3{,}6$, а из м/с в км/ч скорость растёт: числитель делим на $1000$, знаменатель делим на $3600$ — в итоге умножаем на $3{,}6$.',
        },
        {
          x: v * 60,
          oshibka: 'mnozhitel',
          podskazka:
            'Так получились метры в минуту. А нужны километры в час: $1\\text{ м}=\\dfrac{1}{1000}\\text{ км}$, $1\\text{ с}=\\dfrac{1}{3600}\\text{ ч}$.',
        },
        {
          x: v / 1000,
          oshibka: 'deystvie',
          podskazka:
            'Знаменатель тоже переводим: $1\\text{ с}=\\dfrac{1}{3600}\\text{ ч}$ — делить на такую дробь значит умножать на $3600$.',
        },
      ];
      return {
        uslovie: `Переведите $${d(v)}\\text{ м/с}$ в $\\text{км/ч}$.`,
        varianty: peremeshat(r, varianty(otvet, 'км/ч', k) ?? []),
        razbor: [
          'Скорость — дробь: $1\\text{ м}=\\dfrac{1}{1000}\\text{ км}$, $1\\text{ с}=\\dfrac{1}{3600}\\text{ ч}$ — из меньших в большие, делим.',
          `$${d(v)}\\text{ м/с}=${d(v)}\\cdot\\dfrac{3600}{1000}\\text{ км/ч}=${d(otvet)}\\text{ км/ч}$.`,
        ],
        znachenie: otvet,
      };
    },
  },
];

/* ── Блок 3: степени десяти ───────────────────────────────────── */

const st = (e: number | string): string => `$10^{${e}}$`;
const DOP_PODSKAZKA = {
  peremnozhil:
    'Показатели при умножении степеней не перемножают, а складывают: $a^m\\cdot a^n=a^{m+n}$.',
  vychel: 'При умножении показатели складывают, а не вычитают.',
  osnovanie: 'Основание не меняется: $10$ остаётся $10$, складываем только показатели.',
  slozhilDel: 'При делении показатели вычитают: $a^m:a^n=a^{m-n}$.',
  naoborot: 'Из показателя делимого вычитаем показатель делителя, а не наоборот.',
  peremnozhilDel: 'Показатели не перемножают: при делении их вычитают.',
};

function stepen(id: string, sozdat: (r: Rng, nomer: number) => ZadachaProverki): ShablonProverki {
  return {
    id,
    tip: 'skolko',
    sozdat: (r, nomer) => {
      const z = sozdat(r, nomer);
      return { ...z, varianty: peremeshat(r, z.varianty) };
    },
  };
}

export const PROVERKA_STEPENI: readonly ShablonProverki[] = [
  stepen('st-1', (r, n) => {
    const [a, b] =
      n === 0
        ? [3, 4]
        : r.pick([
            [2, 5],
            [4, 5],
            [3, 6],
            [2, 7],
            [5, 3],
          ] as const);
    return {
      uslovie: `$10^{${a}}\\cdot10^{${b}}=\\;?$`,
      varianty: [
        { tekst: st(a + b), verno: true },
        {
          tekst: st(a * b),
          verno: false,
          oshibka: 'deystvie',
          podskazka: DOP_PODSKAZKA.peremnozhil,
        },
        { tekst: st(a - b), verno: false, oshibka: 'deystvie', podskazka: DOP_PODSKAZKA.vychel },
        {
          tekst: `$100^{${a + b}}$`,
          verno: false,
          oshibka: 'drugoe',
          podskazka: DOP_PODSKAZKA.osnovanie,
        },
      ],
      razbor: [
        'Основание одинаковое — показатели складываем.',
        `$10^{${a}}\\cdot10^{${b}}=10^{${a}+${b}}=10^{${a + b}}$.`,
      ],
    };
  }),
  stepen('st-2', (r, n) => {
    const [a, b] =
      n === 0
        ? [9, 6]
        : r.pick([
            [8, 3],
            [7, 2],
            [9, 4],
            [6, 2],
            [10, 7],
          ] as const);
    return {
      uslovie: `$10^{${a}}:10^{${b}}=\\;?$`,
      varianty: [
        { tekst: st(a - b), verno: true },
        {
          tekst: st(a + b),
          verno: false,
          oshibka: 'deystvie',
          podskazka: DOP_PODSKAZKA.slozhilDel,
        },
        { tekst: st(b - a), verno: false, oshibka: 'deystvie', podskazka: DOP_PODSKAZKA.naoborot },
        {
          tekst: st(a * b),
          verno: false,
          oshibka: 'deystvie',
          podskazka: DOP_PODSKAZKA.peremnozhilDel,
        },
      ],
      razbor: [
        'При делении показатели вычитаем: из показателя делимого — показатель делителя.',
        `$10^{${a}}:10^{${b}}=10^{${a}-${b}}=10^{${a - b}}$.`,
      ],
    };
  }),
  stepen('st-3', (r, n) => {
    const a = n === 0 ? 6 : r.pick([2, 3, 4, 5, 8, 9]);
    return {
      uslovie: `$10^{${a}}\\cdot10^{-${a}}=\\;?$`,
      varianty: [
        { tekst: '$1$', verno: true },
        {
          tekst: st(-2 * a),
          verno: false,
          oshibka: 'deystvie',
          podskazka: 'Показатели складываем с их знаками: $' + a + '+(-' + a + ')$.',
        },
        {
          tekst: st(2 * a),
          verno: false,
          oshibka: 'deystvie',
          podskazka: 'Минус у второго показателя не теряем: $' + a + '+(-' + a + ')$.',
        },
        {
          tekst: '$0$',
          verno: false,
          oshibka: 'drugoe',
          podskazka:
            'Сумма показателей $0$, а $10^0$ — это не $0$. Вспомни, чему равна нулевая степень.',
        },
      ],
      razbor: [
        'Показатели складываем: противоположные числа дают $0$.',
        `$10^{${a}}\\cdot10^{-${a}}=10^{${a}+(-${a})}=10^0=1$.`,
      ],
    };
  }),
  stepen('st-4', (r, n) => {
    const a = n === 0 ? 3 : r.pick([2, 4, 5]);
    const drob = 10 ** -a;
    return {
      uslovie: `$10^{-${a}}=\\;?$`,
      varianty: [
        { tekst: `$${d(drob)}$`, verno: true },
        {
          tekst: `$-${d(10 ** a)}$`,
          verno: false,
          oshibka: 'drugoe',
          podskazka:
            'Минус в показателе не делает число отрицательным — он «переворачивает» его в дробь: $10^{-n}=\\dfrac{1}{10^n}$.',
        },
        {
          tekst: `$${d(drob / 10)}$`,
          verno: false,
          oshibka: 'zapyataya',
          podskazka: `Посчитай нули: $10^{${a}}$ — это $1$ и ${a === 2 ? 'два нуля' : a === 3 ? 'три нуля' : a === 4 ? 'четыре нуля' : 'пять нулей'}, а в дроби столько же знаков после запятой.`,
        },
        {
          tekst: `$-${d(drob)}$`,
          verno: false,
          oshibka: 'drugoe',
          podskazka:
            'Дробь верная, но знак лишний: степень положительного числа всегда положительна.',
        },
      ],
      razbor: [
        'Отрицательный показатель — это дробь: единица, делённая на ту же степень с плюсом.',
        `$10^{-${a}}=\\dfrac{1}{10^{${a}}}=${d(drob)}$.`,
      ],
    };
  }),
  stepen('st-5', (r, n) => {
    const [a, b] =
      n === 0
        ? [3, 2]
        : r.pick([
            [4, 1],
            [2, 3],
            [5, 2],
            [1, 4],
          ] as const);
    return {
      uslovie: `$10^{${a}}:10^{-${b}}=\\;?$`,
      varianty: [
        { tekst: st(a + b), verno: true },
        {
          tekst: st(a - b),
          verno: false,
          oshibka: 'deystvie',
          podskazka: `Вычитаем отрицательное — значит прибавляем: $${a}-(-${b})=${a}+${b}$.`,
        },
        {
          tekst: st(-(a + b)),
          verno: false,
          oshibka: 'deystvie',
          podskazka: 'Из показателя делимого вычитаем показатель делителя, а не наоборот.',
        },
        {
          tekst: st(-(a * b)),
          verno: false,
          oshibka: 'deystvie',
          podskazka: 'Показатели не перемножают: при делении их вычитают.',
        },
      ],
      razbor: [
        'При делении показатели вычитаем; вычесть отрицательное — значит прибавить.',
        `$10^{${a}}:10^{-${b}}=10^{${a}-(-${b})}=10^{${a + b}}$.`,
      ],
    };
  }),
  stepen('st-6', (r, n) => {
    const [osn, a] =
      n === 0
        ? [2, 3]
        : r.pick([
            [3, 2],
            [2, 4],
            [5, 2],
            [4, 2],
            [2, 5],
          ] as const);
    const zn = osn ** a;
    return {
      uslovie: `$${osn}^{-${a}}=\\;?$`,
      varianty: [
        { tekst: `$\\dfrac{1}{${zn}}$`, verno: true },
        {
          tekst: `$-${zn}$`,
          verno: false,
          oshibka: 'drugoe',
          podskazka:
            'Минус в показателе не делает число отрицательным — он «переворачивает» его в дробь.',
        },
        {
          tekst: `$-${osn * a}$`,
          verno: false,
          oshibka: 'drugoe',
          podskazka:
            'Степень — не умножение основания на показатель. И минус в показателе даёт дробь, а не отрицательное число.',
        },
        {
          tekst: `$\\dfrac{1}{${osn * a}}$`,
          verno: false,
          oshibka: 'deystvie',
          podskazka: `Дробь — верно, но в знаменателе степень: $${osn}^{${a}}$, а не $${osn}\\cdot${a}$.`,
        },
      ],
      razbor: [
        'Отрицательный показатель — это дробь с той же степенью в знаменателе.',
        `$${osn}^{-${a}}=\\dfrac{1}{${osn}^{${a}}}=\\dfrac{1}{${zn}}$.`,
      ],
    };
  }),
];

export const NABORY_PROVERKI = {
  'kak-perevodit': PROVERKA_KAK_PEREVODIT,
  sostavnye: PROVERKA_SOSTAVNYE,
  stepeni: PROVERKA_STEPENI,
} as const;

export type NaborProverki = keyof typeof NABORY_PROVERKI;
