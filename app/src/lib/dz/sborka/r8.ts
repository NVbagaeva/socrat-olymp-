/**
 * №8 в ДЗ: задачи тренажёра (генератор с зерном, банк — lib/dz/z08.ts)
 * и опорные задачи (микро-задачи блоков, аналог — новое зерно).
 * Работает в браузере репетитора при выдаче.
 */

import { podskazkaTipa } from '@/content/vychisleniya8/tipy';
import { SKILL_FORMULA } from '@/content/vychisleniya';
import { typeset } from '@/lib/tex';
import { parseTaskId, taskId } from '@/lib/vychisleniya/ids';
import { prepBlockBySlug, prepMicroById } from '@/lib/vychisleniya/prep/blocks';
import { generatePrep } from '@/lib/vychisleniya/prep/generate';
import { razborData } from '@/lib/vychisleniya/razbor';
import { skillOfPrototype } from '@/lib/vychisleniya/skills';
import { analog8, build8, byKinds, type Built8 } from '../z08';
import type { BlokKat, KatalogRazdela } from '../katalog/types';
import type { HwUnitInput, VidDz } from '../types';
import { chisloEge, poKrugu } from './obshchee';

function vid8(b: Built8, names: Record<string, string>): VidDz {
  const podskazka = podskazkaTipa(b.kind);
  const skill = skillOfPrototype(b.kind);
  const formula = skill === undefined ? undefined : SKILL_FORMULA[skill.id];
  return {
    tipHtml: names[b.kind] ?? b.kind,
    ...(podskazka === null ? {} : { podskazka: typeset(podskazka) }),
    ...(formula === undefined ? {} : { zapomni: typeset(`$${formula}$`) }),
  };
}

function unit8(b: Built8, names: Record<string, string>, studentId: string | null): HwUnitInput {
  return {
    studentId,
    kind: b.kind,
    ref: b.ref,
    answerKind: 'number',
    questionHtml: b.questionHtml,
    view: vid8(b, names),
    answer: b.answer,
    razbor: b.razbor,
    source: b.source,
  };
}

/** Разобранный пример типа: своя задача на постоянном зерне, у всех одна. */
function primer8(kind: string): VidDz['primer'] | undefined {
  const b = build8(taskId(kind, `primer-${kind}`, null));
  return b === null ? undefined : { uslovieHtml: b.questionHtml, razbor: b.razbor, otvet: b.answer };
}

function imena(k: KatalogRazdela): Record<string, string> {
  return Object.fromEntries(k.trenazher.flatMap((g) => g.tipy.map((t) => [t.id, t.nazvanieHtml])));
}

/** Пример — у первой задачи каждого типа в пункте. */
function sPrimerami(units: HwUnitInput[]): HwUnitInput[] {
  const byli = new Set<string>();
  return units.map((u) => {
    if (byli.has(`${u.studentId}:${u.kind}`)) return u;
    byli.add(`${u.studentId}:${u.kind}`);
    const primer = primer8(u.kind);
    return primer === undefined ? u : { ...u, view: { ...u.view, primer } };
  });
}

/**
 * Правило тренажёра: skolko задач по типам по кругу, на каждого из
 * students (или один набор — students = [null]).
 */
export function trenazher8(
  k: KatalogRazdela,
  tipy: readonly string[],
  skolko: number,
  students: readonly (string | null)[],
): HwUnitInput[] {
  const names = imena(k);
  const order = poKrugu(tipy, skolko);
  const perKind = new Map<string, number>();
  for (const t of order) perKind.set(t, (perKind.get(t) ?? 0) + 1);
  /* По каждому типу — столько наборов, сколько учеников; банк без повторов. */
  const sets = new Map<string, Built8[][]>();
  for (const [kind, n] of perKind) sets.set(kind, byKinds([kind], n, students.length));
  const units: HwUnitInput[] = [];
  students.forEach((student, s) => {
    const used = new Map<string, number>();
    for (const kind of order) {
      const i = used.get(kind) ?? 0;
      used.set(kind, i + 1);
      const b = sets.get(kind)?.[s]?.[i];
      if (b !== undefined) units.push(unit8(b, names, student));
    }
  });
  return sPrimerami(units);
}

/** Конкретная задача тренажёра: у всех одна. */
export function zadacha8(k: KatalogRazdela, ref: string): HwUnitInput[] {
  const b = build8(ref);
  return b === null ? [] : sPrimerami([unit8(b, imena(k), null)]);
}

/** Работа над ошибками: аналог задачи (тот же тип и уровень, новые числа). */
export function analogZadachi8(k: KatalogRazdela, ref: string, studentId: string, avoid: Set<string>): HwUnitInput | null {
  const b = analog8(ref, avoid);
  return b === null ? null : unit8(b, imena(k), studentId);
}

/** Опорная задача №8 по зерну: условие, ответ, решение, варианты, формула-подсказка. */
function opornaya8(
  blok: BlokKat,
  microId: string,
  zerno: string,
  studentId: string | null,
): HwUnitInput | null {
  const micro = prepMicroById(microId);
  const block = prepBlockBySlug(blok.slug);
  if (micro === undefined || block === undefined) return null;
  const g = generatePrep(microId, zerno);
  const choice = micro.answerType === 'choice';
  return {
    studentId,
    kind: microId,
    ref: `${microId}|${zerno}`,
    answerKind: choice ? 'choice' : 'number',
    questionHtml: typeset(g.uslovie),
    view: {
      tipHtml: micro.nazvanie,
      podskazka: typeset(`$${micro.formula}$`),
      zapomni: blok.zapomniHtml,
      ...(micro.choices === undefined ? {} : { varianty: micro.choices }),
    },
    answer: choice ? String(g.otvet) : chisloEge(Number(g.otvet)),
    razbor: razborData(g.razbor),
    source: `опорная ${microId}`,
  };
}

/**
 * Опорные задачи блока №8: аналоги с новым зерном. zerno — зерно
 * пункта; у каждого ученика своё (kazhdomu) или одно на всех.
 */
export function opornye8(
  blok: BlokKat,
  zadachi: readonly string[],
  zerno: string,
  students: readonly (string | null)[],
): HwUnitInput[] {
  return students.flatMap((student, s) =>
    zadachi
      .map((id) => opornaya8(blok, id, `${zerno}:${s}`, student))
      .filter((u): u is HwUnitInput => u !== null),
  );
}

/** Работа над ошибками в опорной №8: аналог с новым зерном. */
export function analogOpornoy8(blok: BlokKat, ref: string, zerno: string, studentId: string): HwUnitInput | null {
  const microId = ref.split('|')[0] ?? '';
  return opornaya8(blok, microId, zerno, studentId);
}

export { parseTaskId };
