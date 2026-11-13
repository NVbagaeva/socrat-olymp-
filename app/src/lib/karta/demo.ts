/**
 * Три тестовых ученика «Карты ЕГЭ»: «пусто», «середина», «почти всё».
 * Журналы собираются из строк исходов по типам из каталога — чтобы
 * проверки и снимки экрана смотрели на одни и те же данные. Гостю карта
 * их не показывает: у него — журналы его браузера.
 */

import { EMPTY_LOG, addAttempt, type LogOutcome, type ProgressLog } from '@/lib/progressLog/model';
import { KARTA_RAZDELY } from './katalog';
import type { Zhurnaly } from './model';

export type DemoUchenik = 'pusto' | 'seredina' | 'pochti-vsyo';

/** «Сейчас» для демо: от него отсчитываются даты попыток. */
export const DEMO_NOW = Date.UTC(2026, 10, 12, 12, 0, 0);
const DEN = 24 * 60 * 60 * 1000;

const BUKVY: Record<string, LogOutcome> = { r: 'right', h: 'hinted', w: 'wrong', v: 'revealed' };

/**
 * Журнал раздела: исходы по типам (строка из r/h/w/v) и сколько дней
 * назад была последняя попытка. Попытки идут подряд с шагом в минуту.
 */
function zhurnal(no: number, ishody: Record<string, string>, dneyNazad: number): ProgressLog {
  let log = EMPTY_LOG;
  let n = 0;
  const vsego = Object.values(ishody).reduce((s, t) => s + t.length, 0);
  for (const [kind, stroka] of Object.entries(ishody)) {
    for (const b of stroka) {
      n += 1;
      log = addAttempt(log, {
        id: `demo-${no}-${n}`,
        task: `${kind}|demo${n}`,
        kind,
        outcome: BUKVY[b] ?? 'wrong',
        seconds: 45,
        at: DEMO_NOW - dneyNazad * DEN - (vsego - n) * 60_000,
      });
    }
  }
  return log;
}

/** Все типы раздела с одинаковым исходом. */
function vse(no: number, stroka: string, dneyNazad: number, krome: string[] = []): ProgressLog {
  const r = KARTA_RAZDELY.find((x) => x.no === no);
  const ishody: Record<string, string> = {};
  for (const g of r?.gruppy ?? []) {
    for (const t of g.tipy) if (!krome.includes(t)) ishody[t] = stroka;
  }
  return zhurnal(no, ishody, dneyNazad);
}

/** Типы группы раздела по её id. */
function tipyGruppy(no: number, gruppa: string): readonly string[] {
  return KARTA_RAZDELY.find((x) => x.no === no)?.gruppy.find((g) => g.id === gruppa)?.tipy ?? [];
}

function poGruppam(no: number, plan: Record<string, string | string[]>, dneyNazad: number) {
  const ishody: Record<string, string> = {};
  for (const [gruppa, stroki] of Object.entries(plan)) {
    tipyGruppy(no, gruppa).forEach((t, i) => {
      const s = Array.isArray(stroki) ? stroki[Math.min(i, stroki.length - 1)] : stroki;
      if (s !== undefined && s !== '') ishody[t] = s;
    });
  }
  return zhurnal(no, ishody, dneyNazad);
}

export function demoZhurnaly(uchenik: DemoUchenik): Zhurnaly {
  if (uchenik === 'pusto') return {};
  if (uchenik === 'seredina') {
    return {
      /* №1–4 освоены (один тип в №1 — с давней ошибкой, но освоен). */
      1: vse(1, 'rrrrw', 20),
      2: vse(2, 'rrrr', 14),
      3: vse(3, 'wrrrr', 10),
      4: vse(4, 'rrr', 6),
      /* №8 как в макете: степени и корни освоены, логарифмы — 3 из 5 и
         ошибки, тригонометрия и буквенные не начаты. */
      8: poGruppam(
        8,
        {
          stepeni: 'rrrrr',
          korni: 'rrrrw',
          logarifmy: ['rrrww', 'wrrrw', 'rrrhw', 'rwwr', 'wwr'],
        },
        1,
      ),
      /* №6: пара попыток — просто начато. */
      6: poGruppam(6, { I: ['rw'] }, 3),
    };
  }
  /* Почти всё: часть 1 целиком, в части 2 освоены №14 и №18, №19 в работе. */
  return {
    1: vse(1, 'rrrr', 40),
    2: vse(2, 'rrrrr', 35),
    3: vse(3, 'rrrwr', 30),
    4: vse(4, 'rrrr', 28),
    5: vse(5, 'rrrr', 27),
    6: vse(6, 'rrrr', 25),
    7: vse(7, 'rrrr', 24),
    8: vse(8, 'rrrrw', 22),
    9: vse(9, 'rrrr', 20),
    10: vse(10, 'rrrr', 18),
    11: vse(11, 'rrrr', 16),
    12: vse(12, 'rrrrr', 14),
    13: vse(13, 'rrrw', 12),
    14: vse(14, 'rrr', 9),
    18: vse(18, 'rrrr', 6, tipyGruppy(18, 'ploshchadi').slice(1)),
    19: poGruppam(19, { m1: 'rrr', m2: 'rrw', m3: 'rwr', m4: 'wrrh' }, 1),
  };
}
