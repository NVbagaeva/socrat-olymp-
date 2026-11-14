/**
 * «Карта ЕГЭ»: состояния областей, рекомендация и прогноз — чистые
 * функции, без браузера. Данные — только общий журнал попыток
 * (lib/progressLog); раздел без журнала — «прогресс появится позже».
 *
 * Правила (утверждены владельцем):
 *   тип освоен        — в последних пяти попытках типа верных три и больше
 *                       («верно» — с первой попытки, без подсказки, решение
 *                       не открывалось);
 *   стоит повторить   — в последних пяти попытках типа ошибок две и больше
 *                       (ошибка или открытое решение) либо тип освоен, но
 *                       не решался больше 21 дня;
 *   область освоена   — освоено не меньше 80 % её типов;
 *   в процессе        — попытки есть, но до освоения не дошло; процент —
 *                       доля освоенных типов;
 *   рекомендуем       — область «в процессе» с самой свежей попыткой, иначе
 *                       первая неначатая по номеру (сначала часть 1);
 *   прогноз           — сумма по заданиям «балл задания × доля верных в
 *                       последних пяти попытках, усреднённая по типам»,
 *                       переведённая в тестовые баллы по шкале сайта.
 */

import { estRazdel, maxBall } from '@/content/struktura';
import { TESTOVYJ_RABOTY } from '@/content/variantOnline/shkala';
import { PROLIV_POROG, PROLIV_SVYAZKI } from '@/content/karta/proliv';
import { isMistake, kindStats, type LogOutcome, type ProgressLog } from '@/lib/progressLog/model';

/** Сколько последних попыток типа смотреть. */
export const OKNO = 5;
/** Сколько верных в окне — тип освоен. */
export const VERNYH_DLYA_OSVOENIYA = 3;
/** Доля освоенных типов — область освоена. */
export const DOLYA_OBLASTI = 0.8;
/** Через сколько дней без решения освоенный тип стоит повторить. */
export const DNEY_DO_POVTORA = 21;
/** Когда показывать прогноз: всего попыток и областей с попытками. */
export const PROGNOZ_POPYTOK = 30;
export const PROGNOZ_OBLASTEY = 3;

const DEN = 24 * 60 * 60 * 1000;

/** Тема-«город» раздела: группа типов с вкладки «О задании». */
export interface KartaGruppa {
  id: string;
  nazvanie: string;
  /** Типы журнала (kind), которые входят в группу. */
  tipy: readonly string[];
}

/**
 * gotov  — раздел пишет в журнал, прогресс считается;
 * pozzhe — раздел на сайте есть, тренажёра ещё нет: «Прогресс появится позже»;
 * skoro  — раздела ещё нет: «неоткрытая земля».
 */
export type StatusRazdela = 'gotov' | 'pozzhe' | 'skoro';

export interface KartaRazdel {
  no: number;
  chast: 1 | 2;
  /** Место области по порядку карты (остров); нет — по номеру. */
  poryadok?: number;
  status: StatusRazdela;
  gruppy: readonly KartaGruppa[];
}

/** Журналы разделов: номер задания → журнал. Нет ключа — попыток нет. */
export type Zhurnaly = Readonly<Record<number, ProgressLog | undefined>>;

export interface SostoyanieTipa {
  id: string;
  /** Сколько задач типа закрыто за всё время. */
  popytok: number;
  /** Исходы последних попыток, от старых к новым (не больше OKNO). */
  poslednie: LogOutcome[];
  osvoen: boolean;
  povtorit: boolean;
  /** Доля верных в окне: недостающие попытки считаются неверными. */
  p: number;
  /** Когда решался в последний раз, мс; 0 — неизвестно. */
  lastAt: number;
}

export type Sostoyanie = 'ne-nachato' | 'v-processe' | 'osvoeno';

export interface SostoyanieGruppy {
  id: string;
  nazvanie: string;
  vsego: number;
  osvoeno: number;
  /** Доля освоенных типов, проценты. */
  procent: number;
  sostoyanie: Sostoyanie;
  povtorit: boolean;
}

export interface SostoyanieOblasti {
  no: number;
  chast: 1 | 2;
  /** pozzhe и skoro — по статусу раздела, остальное — по журналу. */
  sostoyanie: Sostoyanie | 'pozzhe' | 'skoro';
  /** Доля освоенных типов, проценты. */
  procent: number;
  vsego: number;
  osvoeno: number;
  povtorit: boolean;
  /** Названия групп, которые стоит повторить. */
  povtoritGruppy: string[];
  gruppy: SostoyanieGruppy[];
  /** Группа, с которой продолжать: первая неосвоенная. null — всё освоено или групп нет. */
  tekushchaya: string | null;
  popytok: number;
  lastAt: number;
  /** Ожидаемая доля верных ответов по заданию. */
  p: number;
}

export interface Prognoz {
  /** Данных хватает, прогноз можно показывать. */
  gotov: boolean;
  /** Тестовый балл. */
  ball: number;
  /** Ожидаемый первичный балл (не округлён). */
  pervichnyy: number;
  popytok: number;
  oblastey: number;
}

export interface Karta {
  oblasti: SostoyanieOblasti[];
  /** Сколько областей освоено. */
  osvoeno: number;
  osvoenoChast: Record<1 | 2, number>;
  vsegoChast: Record<1 | 2, number>;
  /** Рекомендуемая следующей область. */
  sleduyushchaya: number | null;
  /** Рекомендуемый путь: освоенные области по номерам, затем следующая. */
  put: number[];
  prognoz: Prognoz;
}

/**
 * Последние попытки типа. Счётчики старого формата (без порядка
 * попыток) стоят раньше попыток журнала: если своих попыток меньше
 * окна, недостающие места занимают старые — верные в той же доле, что в
 * счётчике. Так прогресс, набранный до журнала, не обнуляется.
 */
function okno(recent: LogOutcome[], starye: { done: number; right: number }): LogOutcome[] {
  const mest = Math.min(OKNO - recent.length, starye.done);
  if (mest <= 0) return recent.slice(-OKNO);
  const vernyh = Math.round((mest * Math.min(starye.right, starye.done)) / starye.done);
  const iz: LogOutcome[] = [
    ...Array.from({ length: mest - vernyh }, (): LogOutcome => 'wrong'),
    ...Array.from({ length: vernyh }, (): LogOutcome => 'right'),
  ];
  return [...iz, ...recent];
}

/** Состояния всех типов журнала. now — текущее время, мс. */
export function sostoyaniyaTipov(
  log: ProgressLog | undefined,
  now: number,
): Map<string, SostoyanieTipa> {
  const out = new Map<string, SostoyanieTipa>();
  if (log === undefined) return out;
  for (const s of kindStats(log).values()) {
    /* Старые счётчики — всё, что не лежит в журнале отдельными попытками. */
    const vZhurnale = log.attempts.filter((a) => a.kind === s.kind);
    const starye = {
      done: s.done - vZhurnale.length,
      right: s.right - vZhurnale.filter((a) => a.outcome === 'right').length,
    };
    const poslednie = okno(s.recent, starye);
    const vernyh = poslednie.filter((o) => o === 'right').length;
    const osvoen = vernyh >= VERNYH_DLYA_OSVOENIYA;
    const davno = osvoen && s.lastAt > 0 && now - s.lastAt > DNEY_DO_POVTORA * DEN;
    out.set(s.kind, {
      id: s.kind,
      popytok: s.done,
      poslednie,
      osvoen,
      povtorit: s.recent.filter(isMistake).length >= 2 || davno,
      p: vernyh / OKNO,
      lastAt: s.lastAt,
    });
  }
  return out;
}

function sostoyanieOblasti(
  razdel: KartaRazdel,
  log: ProgressLog | undefined,
  now: number,
): SostoyanieOblasti {
  const pusto: SostoyanieOblasti = {
    no: razdel.no,
    chast: razdel.chast,
    sostoyanie: razdel.status === 'gotov' ? 'ne-nachato' : razdel.status,
    procent: 0,
    vsego: 0,
    osvoeno: 0,
    povtorit: false,
    povtoritGruppy: [],
    gruppy: [],
    tekushchaya: null,
    popytok: 0,
    lastAt: 0,
    p: 0,
  };
  if (razdel.status !== 'gotov') return pusto;

  const tipy = sostoyaniyaTipov(log, now);
  const vse = new Set<string>();
  const gruppy = razdel.gruppy.map((g): SostoyanieGruppy => {
    const svoi = g.tipy.map((id) => tipy.get(id));
    g.tipy.forEach((id) => vse.add(id));
    const osvoeno = svoi.filter((t) => t?.osvoen === true).length;
    const nachato = svoi.some((t) => t !== undefined && t.popytok > 0);
    const vsego = g.tipy.length;
    return {
      id: g.id,
      nazvanie: g.nazvanie,
      vsego,
      osvoeno,
      procent: vsego === 0 ? 0 : Math.round((100 * osvoeno) / vsego),
      sostoyanie:
        vsego > 0 && osvoeno === vsego ? 'osvoeno' : nachato ? 'v-processe' : 'ne-nachato',
      povtorit: svoi.some((t) => t?.povtorit === true),
    };
  });

  const svoi = [...vse].map((id) => tipy.get(id));
  const vsego = vse.size;
  const osvoeno = svoi.filter((t) => t?.osvoen === true).length;
  const popytok = svoi.reduce((n, t) => n + (t?.popytok ?? 0), 0);
  const dolya = vsego === 0 ? 0 : osvoeno / vsego;
  return {
    ...pusto,
    sostoyanie: dolya >= DOLYA_OBLASTI ? 'osvoeno' : popytok > 0 ? 'v-processe' : 'ne-nachato',
    procent: Math.round(100 * dolya),
    vsego,
    osvoeno,
    povtorit: gruppy.some((g) => g.povtorit),
    povtoritGruppy: gruppy.filter((g) => g.povtorit).map((g) => g.nazvanie),
    gruppy,
    tekushchaya: gruppy.find((g) => g.sostoyanie !== 'osvoeno')?.id ?? null,
    popytok,
    lastAt: svoi.reduce((m, t) => Math.max(m, t?.lastAt ?? 0), 0),
    p: vsego === 0 ? 0 : svoi.reduce((sum, t) => sum + (t?.p ?? 0), 0) / vsego,
  };
}

function sleduyushchaya(oblasti: readonly SostoyanieOblasti[]): number | null {
  const vProcesse = oblasti.filter((o) => o.sostoyanie === 'v-processe');
  if (vProcesse.length > 0) {
    return [...vProcesse].sort((a, b) => b.lastAt - a.lastAt || a.no - b.no)[0]?.no ?? null;
  }
  for (const chast of [1, 2] as const) {
    const novaya = oblasti.find((o) => o.chast === chast && o.sostoyanie === 'ne-nachato');
    if (novaya !== undefined) return novaya.no;
  }
  return null;
}

/** Первичный балл → тестовый по шкале сайта (первичных — по структуре экзамена). */
export function testovyyBall(pervichnyy: number): number {
  const k = Math.max(0, Math.min(TESTOVYJ_RABOTY.length - 1, Math.round(pervichnyy)));
  return TESTOVYJ_RABOTY[k] ?? 0;
}

function prognoz(oblasti: readonly SostoyanieOblasti[]): Prognoz {
  const pervichnyy = oblasti.reduce((sum, o) => sum + (estRazdel(o.no) ? (maxBall(o.no) ?? 0) : 0) * o.p, 0);
  const popytok = oblasti.reduce((n, o) => n + o.popytok, 0);
  const oblastey = oblasti.filter((o) => o.popytok > 0).length;
  return {
    gotov: popytok >= PROGNOZ_POPYTOK && oblastey >= PROGNOZ_OBLASTEY,
    ball: testovyyBall(pervichnyy),
    pervichnyy,
    popytok,
    oblastey,
  };
}

/** Вся карта по каталогу разделов и журналам ученика. */
export function postroitKartu(
  razdely: readonly KartaRazdel[],
  zhurnaly: Zhurnaly,
  now: number,
): Karta {
  const oblasti = [...razdely]
    .sort((a, b) => (a.poryadok ?? a.no) - (b.poryadok ?? b.no))
    .map((r) => sostoyanieOblasti(r, zhurnaly[r.no], now));
  const osvoennye = oblasti.filter((o) => o.sostoyanie === 'osvoeno');
  const sled = sleduyushchaya(oblasti);
  const chast = (n: 1 | 2) => oblasti.filter((o) => o.chast === n);
  return {
    oblasti,
    osvoeno: osvoennye.length,
    osvoenoChast: {
      1: osvoennye.filter((o) => o.chast === 1).length,
      2: osvoennye.filter((o) => o.chast === 2).length,
    },
    vsegoChast: { 1: chast(1).length, 2: chast(2).length },
    sleduyushchaya: sled,
    put: [...osvoennye.map((o) => o.no), ...(sled === null ? [] : [sled])],
    prognoz: prognoz(oblasti),
  };
}

export interface ProlivZadanie {
  no: number;
  /** Задания части 1, на которые оно опирается, и освоены ли они. */
  nuzhny: { no: number; gotovo: boolean }[];
  /** Все нужные задания освоены (или связок нет). */
  gotovo: boolean;
}

export interface ProlivSvodka {
  osvoeno: number;
  vsego: number;
  porog: number;
  /** Освоено достаточно, чтобы начинать вторую часть. */
  mozhno: boolean;
  zadaniya: ProlivZadanie[];
}

/** Карточка «Переход ко второй части». */
export function prolivSvodka(karta: Karta): ProlivSvodka {
  const osvoena = (no: number) => karta.oblasti.find((o) => o.no === no)?.sostoyanie === 'osvoeno';
  const zadaniya = karta.oblasti
    .filter((o) => o.chast === 2)
    .map((o): ProlivZadanie => {
      const nuzhny = (PROLIV_SVYAZKI[o.no] ?? []).map((no) => ({ no, gotovo: osvoena(no) }));
      return { no: o.no, nuzhny, gotovo: nuzhny.every((n) => n.gotovo) };
    });
  return {
    osvoeno: karta.osvoenoChast[1],
    vsego: karta.vsegoChast[1],
    porog: PROLIV_POROG,
    mozhno: karta.osvoenoChast[1] >= PROLIV_POROG,
    zadaniya,
  };
}
