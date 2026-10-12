/**
 * Подбор аналогов задания №6: по 50 на прототип — 30 «в стиле ФИПИ»
 * (нейтральная формулировка, как в исходнике) и 20 сюжетных.
 *
 * Правила:
 *   — 20 сюжетов прототипа — по два на каждую из десяти тем задания;
 *     один сюжет — не больше двух раз;
 *   — ответ для бланка: целое или конечная десятичная дробь (у 6.3 и
 *     6.13 — до четырёх знаков, у рублёвых 6.4, 6.5, 6.9 — до копеек,
 *     у остальных — до трёх);
 *   — у 50 аналогов не меньше 20 разных ответов, ни один не встречается
 *     больше трёх раз (исключение — 6.2, причина в ISKLYUCHENIYA);
 *   — нет двух задач с одинаковым набором чисел (отпечаток), в том числе
 *     совпадений с исходными задачами;
 *   — ответ решателя совпадает с независимым пересчётом прототипа;
 *   — вероятности сходятся ровно (Summa), проигрышных билетов не меньше 0,
 *     у Чебышёва $\varepsilon^2>D$.
 *
 * Подбор детерминированный (rngOf('z6-analog-<id>')): `pnpm build:bank-6`
 * перезаписывает data/zadanie6/analogi.json, самотест сверяет файл с
 * повторным подбором.
 */

import { rngOf } from '../../vychisleniya/rng';
import { SYUZHETY_P01, SYUZHETY_P02 } from '../prototypes/gruppa1';
import { SYUZHETY_P03 } from '../prototypes/gruppa2';
import { SYUZHETY_P04, SYUZHETY_P05, SYUZHETY_P09, TOVARY_SYUZHET } from '../prototypes/gruppa3';
import { SYUZHETY_P10 } from '../prototypes/gruppa4';
import { SYUZHETY_P12 } from '../prototypes/gruppa5';
import { prototype } from '../prototypes';
import type { BankItem, Params, Prototype, Tema } from '../types';
import { TEMY, velichinyTemy } from '../velichiny';
import { GENERATORY } from './generatory';

export { GENERATORY };

export const ANALOGOV = 50;
export const V_STILE_FIPI = 30;
export const SYUZHETNYH = 20;
export const RAZNYH_OTVETOV = 20;
export const POVTOROV_OTVETA = 3;
/** Сколько кандидатов перебирать на одну задачу. */
const KANDIDATOV = 4000;

export interface PravilaOtvetov {
  minRaznyh: number;
  maxPovtor: number;
}

/**
 * Прототипы, которым объективно не набрать 20 разных ответов.
 * 6.2: точек 5–10, ответ — m/n и должен быть конечной дробью, поэтому
 * n ∈ {5, 6, 8, 10}; разных значений m/n всего 15 (0,1; 0,125; 0,2; 0,25;
 * 0,3; 0,375; 0,4; 0,5; 0,6; 0,625; 0,7; 0,75; 0,8; 0,875; 0,9). На 50
 * задач при 15 ответах без четырёх повторов не обойтись.
 */
export const ISKLYUCHENIYA: Record<string, PravilaOtvetov & { prichina: string }> = {
  P02: {
    minRaznyh: 15,
    maxPovtor: 4,
    prichina:
      'точек на диаграмме 5–10, а ответ $\\dfrac{m}{n}$ — конечная дробь, поэтому $n\\in\\{5;\\,6;\\,8;\\,10\\}$ и разных ответов всего 15',
  },
};

export function pravila(id: string): PravilaOtvetov {
  return ISKLYUCHENIYA[id] ?? { minRaznyh: RAZNYH_OTVETOV, maxPovtor: POVTOROV_OTVETA };
}

/** Знаков после запятой в ответе. */
export function znakovOtveta(id: string): number {
  if (id === 'P03' || id === 'P13') {
    return 4;
  }
  /* Рубли — до копеек. */
  if (id === 'P04' || id === 'P05' || id === 'P09') {
    return 2;
  }
  return 3;
}

/** Ответ для бланка ЕГЭ: целое или конечная десятичная дробь. */
export function otvetEge(x: number, znakov = 3): boolean {
  const k = 10 ** znakov;
  return Number.isFinite(x) && Math.abs(x) < 1e6 && Math.abs(x * k - Math.round(x * k)) < 1e-7;
}

/** Все числа параметров одним списком (по возрастанию) — для отпечатка. */
export function chislaParametrov(p: Params): number[] {
  const out: number[] = [];
  for (const v of Object.values(p)) {
    if (typeof v === 'number') {
      out.push(v);
    } else if (Array.isArray(v)) {
      out.push(...v);
    }
  }
  return out.sort((a, b) => a - b);
}

/** Отпечаток задачи: прототип + набор чисел. Одинаковый набор чисел — одна задача. */
export function otpechatok(protoId: string, p: Params): string {
  return `${protoId}|${chislaParametrov(p).join(',')}`;
}

/** Сюжеты прототипа по темам: [тема] → ключи (первый, второй). */
export function syuzhetyPrototipa(id: string): Record<Tema, string[]> {
  const poTeme = (spisok: { key: string; tema?: Tema }[]) => {
    const out = {} as Record<Tema, string[]>;
    for (const tema of TEMY) {
      out[tema] = spisok.filter((s) => s.tema === tema).map((s) => s.key);
    }
    return out;
  };
  switch (id) {
    case 'P01':
      return poTeme(SYUZHETY_P01);
    case 'P02':
      return poTeme(SYUZHETY_P02);
    case 'P03':
      return poTeme(SYUZHETY_P03);
    case 'P04':
      return poTeme(SYUZHETY_P04);
    case 'P05':
      return poTeme(SYUZHETY_P05);
    case 'P08':
      return poTeme(TOVARY_SYUZHET);
    case 'P09':
      return poTeme(SYUZHETY_P09);
    case 'P10':
      return poTeme(SYUZHETY_P10);
    case 'P12':
      return poTeme(SYUZHETY_P12);
    default: {
      const out = {} as Record<Tema, string[]>;
      for (const tema of TEMY) {
        out[tema] = velichinyTemy(tema).map((v) => v.key);
      }
      return out;
    }
  }
}

/** Сюжет j-й сюжетной задачи (0…19): тема по кругу, вариант — второй проход. */
export function syuzhetZadachi(id: string, j: number): { tema: Tema; key: string } {
  const tema = TEMY[j % TEMY.length] as Tema;
  const klyuchi = syuzhetyPrototipa(id)[tema];
  const key = klyuchi[Math.floor(j / TEMY.length) % klyuchi.length];
  if (key === undefined) {
    throw new Error(`${id}: нет сюжета на тему ${tema}`);
  }
  return { tema, key };
}

/** Метка сюжета для галереи. */
export function metkaSyuzheta(id: string, key: string): string {
  const vse: { key: string; plot: string }[] = [
    ...SYUZHETY_P01,
    ...SYUZHETY_P02,
    ...SYUZHETY_P03,
    ...SYUZHETY_P04,
    ...SYUZHETY_P05,
    ...TOVARY_SYUZHET,
    ...SYUZHETY_P09,
    ...SYUZHETY_P10,
    ...SYUZHETY_P12,
  ];
  const spisok = ['P06', 'P07', 'P11', 'P13', 'P14', 'P15'].includes(id)
    ? TEMY.flatMap((t0) => velichinyTemy(t0))
    : vse;
  return spisok.find((s) => s.key === key)?.plot ?? key;
}

/** Проверки, которые не сводятся к ответу: суммы, ε² > D, допустимый ответ. */
export function dopustimo(proto: Prototype, params: Params, answer: number): boolean {
  if (!otvetEge(answer, znakovOtveta(proto.id))) {
    return false;
  }
  for (const s of proto.summy(params)) {
    if (s.doli.some((x) => !Number.isInteger(x) || x < 0)) {
      return false;
    }
    if (s.nado !== null && s.doli.reduce((a, b) => a + b, 0) !== s.nado) {
      return false;
    }
  }
  if (Math.abs(proto.pereschet(params) - answer) > 1e-9) {
    return false;
  }
  /* Вероятность в ответе — строго между 0 и 1. */
  if (['P01', 'P02', 'P03', 'P10', 'P11'].includes(proto.id) && !(answer > 0 && answer < 1)) {
    return false;
  }
  if (answer <= 0 && ['P04', 'P05', 'P08', 'P09', 'P12', 'P13', 'P14', 'P15'].includes(proto.id)) {
    return false;
  }
  return true;
}

/** Подобрать аналоги прототипа. zanyatye — отпечатки исходных задач. */
export function podobratAnalogi(protoId: string, zanyatye: readonly string[]): BankItem[] {
  const g = GENERATORY[protoId];
  if (g === undefined) {
    throw new Error(`нет генератора аналогов ${protoId}`);
  }
  const proto = prototype(protoId);
  const prav = pravila(protoId);
  const r = rngOf(`z6-analog-${protoId}`);
  const zanyato = new Set(zanyatye);
  const otvety = new Map<number, number>();
  const out: BankItem[] = [];
  const mozhnoPovtorov = ANALOGOV - prav.minRaznyh;
  let povtorov = 0;

  for (let i = 0; i < ANALOGOV; i += 1) {
    const syuzhet = i >= V_STILE_FIPI ? syuzhetZadachi(protoId, i - V_STILE_FIPI) : null;
    let vzyato = false;
    for (let k = 0; k < KANDIDATOV && !vzyato; k += 1) {
      const params = g(r, syuzhet?.key ?? null);
      if (params === null) {
        continue;
      }
      let answer: number;
      try {
        answer = proto.solve(params).answer;
      } catch {
        continue;
      }
      if (!dopustimo(proto, params, answer)) {
        continue;
      }
      const fp = otpechatok(protoId, params);
      if (zanyato.has(fp)) {
        continue;
      }
      const byl = otvety.get(answer) ?? 0;
      if (byl >= prav.maxPovtor || (byl > 0 && povtorov >= mozhnoPovtorov)) {
        continue;
      }
      /* Разнообразие: пока далеко до нормы разных ответов, повтор берём не сразу. */
      if (byl > 0 && k < KANDIDATOV / 4 && otvety.size < prav.minRaznyh) {
        continue;
      }
      zanyato.add(fp);
      otvety.set(answer, byl + 1);
      if (byl > 0) {
        povtorov += 1;
      }
      const u = proto.uslovie(params);
      out.push({
        id: `${protoId}-a${String(i + 1).padStart(2, '0')}`,
        prototypeId: protoId,
        source: 'analog',
        stil: syuzhet ? 'syuzhet' : 'fipi',
        ...(syuzhet ? { tema: syuzhet.tema, plot: metkaSyuzheta(protoId, syuzhet.key) } : {}),
        text: u.text,
        ...(u.posle ? { posle: u.posle } : {}),
        params,
        answer,
      });
      vzyato = true;
    }
    if (!vzyato) {
      throw new Error(
        `${protoId}: не подобрана задача №${i + 1}${syuzhet ? ` (${syuzhet.key})` : ''}`,
      );
    }
  }
  return out;
}
