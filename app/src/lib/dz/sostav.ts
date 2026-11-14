/**
 * Состав ДЗ — то, что репетитор собирает в конструкторе, держит в
 * черновике и сохраняет шаблоном: пункты-правила и настройки, без
 * готовых задач. Задачи собираются из состава при выдаче
 * (lib/dz/sborka): зерно ставится тогда же и фиксируется в пункте.
 *
 * Пункт:
 *   - карточки — набор (подтема колоды) целиком или выбранные карточки;
 *   - опорные — блок навыка целиком или выбранные задачи блока;
 *   - тренажёр — правило «типы × сколько» (тип или вся группа) или
 *     конкретная задача (ref задачи тренажёра).
 * У опорных и правила тренажёра — «каждому свои аналоги» или «один
 * набор на всех». Конкретные задачи и карточки — одинаковые у всех.
 */

import type { AttemptsLimit, Istochnik, SolutionsWhen } from './types';
import { MINUT } from './vremya';

export type PunktSostava =
  | {
      id: string;
      ist: 'kartochki';
      no: number;
      podtema: string;
      /** null — весь набор. */
      kartochki: string[] | null;
    }
  | {
      id: string;
      ist: 'opornye';
      no: number;
      blok: string;
      /** null — весь блок. */
      zadachi: string[] | null;
      kazhdomu: boolean;
    }
  | {
      id: string;
      ist: 'trenazher';
      no: number;
      /** Прототипы: один тип или вся группа. */
      tipy: string[];
      /** Группа, если выбрана целиком: название пункта. */
      gruppa?: string;
      skolko: number;
      kazhdomu: boolean;
    }
  | {
      id: string;
      ist: 'zadacha';
      no: number;
      /** Конкретная задача тренажёра: «8.A|seed|base», «F012». */
      ref: string;
      /** Тип задачи. */
      tip: string;
    };

/** Настройки, которые хранит шаблон (без срока и получателей). */
export interface NastroykiSostava {
  attemptsLimit: AttemptsLimit;
  solutionsWhen: SolutionsWhen;
  showMemo: boolean;
  showExample: boolean;
  noHints: boolean;
  note: string;
}

export interface Sostav {
  v: 1;
  punkty: PunktSostava[];
  nastroyki: NastroykiSostava;
}

/** Настройки по умолчанию: «Запомни» и пример выключены (решение владельца). */
export const NASTROYKI_PO_UMOLCHANIYU: NastroykiSostava = {
  attemptsLimit: null,
  solutionsWhen: 'after_submit',
  showMemo: false,
  showExample: false,
  noHints: false,
  note: '',
};

export function pustoySostav(): Sostav {
  return { v: 1, punkty: [], nastroyki: { ...NASTROYKI_PO_UMOLCHANIYU } };
}

/** Новый id пункта: только для списка в конструкторе. */
export function novyyId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Источник пункта в базе (конкретная задача — тоже тренажёр). */
export function istochnikPunkta(p: PunktSostava): Istochnik {
  return p.ist === 'zadacha' ? 'trenazher' : p.ist;
}

/** Ключ «что за пункт»: повторно тот же пункт не добавляется. */
export function klyuchPunkta(p: PunktSostava): string {
  switch (p.ist) {
    case 'kartochki':
      return `k:${p.no}:${p.podtema}:${p.kartochki?.join(',') ?? '*'}`;
    case 'opornye':
      return `o:${p.no}:${p.blok}:${p.zadachi?.join(',') ?? '*'}`;
    case 'trenazher':
      return `t:${p.no}:${p.tipy.join(',')}`;
    case 'zadacha':
      return `z:${p.no}:${p.ref}`;
  }
}

/** Сколько в разделе: размеры наборов и блоков (из каталога). */
export interface Razmery {
  /** «7:kvadratnye» → число карточек набора. */
  nabor: (no: number, podtema: string) => number;
  /** «8:stepeni-korni» → число задач блока. */
  blok: (no: number, slug: string) => number;
}

export interface Schet {
  zadach: number;
  naborov: number;
  kartochek: number;
  minut: number;
}

/** Счётчик над составом: «12 задач · 2 набора карточек · ≈ 35 минут». */
export function schet(punkty: readonly PunktSostava[], r: Razmery): Schet {
  let tr = 0;
  let op = 0;
  let naborov = 0;
  let kartochek = 0;
  for (const p of punkty) {
    if (p.ist === 'kartochki') {
      naborov += 1;
      kartochek += p.kartochki?.length ?? r.nabor(p.no, p.podtema);
    } else if (p.ist === 'opornye') {
      op += p.zadachi?.length ?? r.blok(p.no, p.blok);
    } else if (p.ist === 'trenazher') {
      tr += p.skolko;
    } else {
      tr += 1;
    }
  }
  const minut = Math.round(tr * MINUT.trenazher + op * MINUT.opornye + kartochek * MINUT.kartochka);
  return { zadach: tr + op, naborov, kartochek, minut };
}

/**
 * Сколько на ученика в пределе базы: задача — одна, набор карточек —
 * одна (docs/kabinet-dz-istochniki.md).
 */
export function vPredele(punkty: readonly PunktSostava[], r: Razmery): number {
  const s = schet(punkty, r);
  return s.zadach + s.naborov;
}

export const PREDEL = 60;

/** Название ДЗ по умолчанию: «ДЗ от 12.11». */
export function nazvaniePoUmolchaniyu(now = new Date()): string {
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `ДЗ от ${dd}.${mm}`;
}

/* ── Чтение состава из базы (черновик, шаблон) ───────────────────── */

function chislo(v: unknown, min: number, max: number): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : null;
}

function stroki(v: unknown): string[] | null {
  return Array.isArray(v) && v.every((s) => typeof s === 'string') ? (v as string[]) : null;
}

/** Пункт из JSON: неизвестное — отбрасывается. */
export function chitatPunkt(raw: unknown): PunktSostava | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o['id'] === 'string' ? o['id'] : novyyId();
  const no = chislo(o['no'], 1, 19);
  if (no === null) return null;
  switch (o['ist']) {
    case 'kartochki':
      return typeof o['podtema'] === 'string'
        ? { id, ist: 'kartochki', no, podtema: o['podtema'], kartochki: stroki(o['kartochki']) }
        : null;
    case 'opornye':
      return typeof o['blok'] === 'string'
        ? {
            id,
            ist: 'opornye',
            no,
            blok: o['blok'],
            zadachi: stroki(o['zadachi']),
            kazhdomu: o['kazhdomu'] === true,
          }
        : null;
    case 'trenazher': {
      const tipy = stroki(o['tipy']);
      const skolko = chislo(o['skolko'], 1, 60);
      return tipy !== null && tipy.length > 0 && skolko !== null
        ? {
            id,
            ist: 'trenazher',
            no,
            tipy,
            ...(typeof o['gruppa'] === 'string' ? { gruppa: o['gruppa'] } : {}),
            skolko,
            kazhdomu: o['kazhdomu'] === true,
          }
        : null;
    }
    case 'zadacha':
      return typeof o['ref'] === 'string' && typeof o['tip'] === 'string'
        ? { id, ist: 'zadacha', no, ref: o['ref'], tip: o['tip'] }
        : null;
    default:
      return null;
  }
}

export function chitatSostav(raw: unknown): Sostav {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const n = (typeof o['nastroyki'] === 'object' && o['nastroyki'] !== null
    ? o['nastroyki']
    : {}) as Record<string, unknown>;
  const limit = n['attemptsLimit'];
  const when = n['solutionsWhen'];
  return {
    v: 1,
    punkty: (Array.isArray(o['punkty']) ? o['punkty'] : [])
      .map(chitatPunkt)
      .filter((p): p is PunktSostava => p !== null),
    nastroyki: {
      attemptsLimit: limit === 1 || limit === 2 ? limit : null,
      solutionsWhen:
        when === 'instant' || when === 'after_due' || when === 'after_submit'
          ? when
          : 'after_submit',
      showMemo: n['showMemo'] === true,
      showExample: n['showExample'] === true,
      noHints: n['noHints'] === true,
      note: typeof n['note'] === 'string' ? n['note'].slice(0, 2000) : '',
    },
  };
}
