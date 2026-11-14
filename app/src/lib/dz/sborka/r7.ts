/**
 * №7 в ДЗ: задачи тренажёра (банк ФИПИ и аналогов, ответ и разбор —
 * решатель прототипа по параметрам, как на листе учителя) и опорные
 * задачи блоков (свои задачи, зерна нет — в ДЗ идёт сама задача).
 * Работает в браузере репетитора при выдаче.
 */

import { SHAPKA7 } from '@/content/uravneniya7';
import { openText } from '@/lib/zadanie7/secret';
import { typeset } from '@/lib/tex';
import { shagiIzResheniya, voprosyIzResheniya } from '@/components/tasks/zadanie7/shagi7';
import type { BlokKat, KatalogRazdela } from '../katalog/types';
import type { HwUnitInput, RazborDz, ShagDz, VidDz } from '../types';
import { chisloEge, peremeshat, poKrugu } from './obshchee';

/* Данные и решатель — лениво: модуль тяжёлый и нужен только при выдаче. */
async function dannye() {
  const [d, p] = await Promise.all([
    import('@/lib/zadanie7/dannye'),
    import('@/lib/zadanie7/prototypes'),
  ]);
  return { ...d, prototype: p.prototype };
}

type Solved = ReturnType<Awaited<ReturnType<typeof dannye>>['prototype']>['solve'] extends (
  ...a: never[]
) => infer S
  ? S
  : never;

function escape(text: string): string {
  return text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Решение решателя → решение ДЗ: шаги с ОДЗ и отбором, «Считаем с умом». */
function razbor7(s: Solved): RazborDz {
  const shagi: ShagDz[] = shagiIzResheniya(s).map((sh) => ({
    chto: sh.chtoHtml,
    tex: sh.formulaHtml,
    ...(sh.zagolovok === undefined ? {} : { zag: sh.zagolovokHtml ?? escape(sh.zagolovok) }),
    ...(sh.ton === undefined ? {} : { ton: sh.ton }),
  }));
  const posle =
    s.vychisleniya.length === 0
      ? undefined
      : `<details class="trn-posle"><summary class="stk-summary">${escape(SHAPKA7.schitaem)}<span class="stk-shevron" aria-hidden="true"></span></summary><ul>${s.vychisleniya
          .map(
            (c) =>
              `<li><span>${typeset(c.tekst)}</span>${
                c.tex === undefined || c.tex === ''
                  ? ''
                  : `<span class="trn-posle__tex">${typeset(`$${c.tex}$`)}</span>`
              }</li>`,
          )
          .join('')}</ul></details>`;
  return { shagi, delimost: [], ...(posle === undefined ? {} : { posle }) };
}

interface Z7 {
  id: string;
  prototypeId: string;
  source: 'fipi' | 'analog';
  no?: number;
  text: string;
  params: Record<string, number | string>;
}

function imena(k: KatalogRazdela): Record<string, string> {
  return Object.fromEntries(k.trenazher.flatMap((g) => g.tipy.map((t) => [t.id, t.nazvanieHtml])));
}

async function unit7(
  z: Z7,
  names: Record<string, string>,
  studentId: string | null,
  d: Awaited<ReturnType<typeof dannye>>,
): Promise<HwUnitInput> {
  const s = d.prototype(z.prototypeId).solve(z.params);
  const view: VidDz = {
    tipHtml: names[z.prototypeId] ?? z.prototypeId,
    tekst: true,
    voprosy: voprosyIzResheniya(s),
  };
  return {
    studentId,
    kind: z.prototypeId,
    ref: z.id,
    answerKind: 'number',
    questionHtml: typeset(z.text),
    view,
    answer: chisloEge(s.answer),
    razbor: razbor7(s),
    source: z.source === 'fipi' && z.no !== undefined ? `ФИПИ № ${z.no}` : `аналог ${z.id}`,
  };
}

/** Пример — у первой задачи каждого типа: другая задача того же прототипа. */
async function sPrimerami(
  units: HwUnitInput[],
  vse: Map<string, Z7>,
  d: Awaited<ReturnType<typeof dannye>>,
): Promise<HwUnitInput[]> {
  const zanyato = new Set(units.map((u) => u.ref));
  const byli = new Set<string>();
  const out: HwUnitInput[] = [];
  for (const u of units) {
    const key = `${u.studentId}:${u.kind}`;
    if (byli.has(key)) {
      out.push(u);
      continue;
    }
    byli.add(key);
    const z = [...vse.values()].find((x) => x.prototypeId === u.kind && !zanyato.has(x.id));
    if (z === undefined) {
      out.push(u);
      continue;
    }
    const s = d.prototype(z.prototypeId).solve(z.params);
    out.push({
      ...u,
      view: {
        ...u.view,
        primer: { uslovieHtml: typeset(z.text), razbor: razbor7(s), otvet: chisloEge(s.answer) },
      },
    });
  }
  return out;
}

/**
 * Правило тренажёра: skolko задач по типам по кругу из банка, по зерну;
 * у каждого ученика свои, пока хватает банка (дальше — повторы).
 */
export async function trenazher7(
  k: KatalogRazdela,
  tipy: readonly string[],
  skolko: number,
  zerno: string,
  students: readonly (string | null)[],
): Promise<HwUnitInput[]> {
  const d = await dannye();
  const vse = (await d.zagruzitZadachi([...tipy])) as Map<string, Z7>;
  const names = imena(k);
  const ochered = new Map<string, Z7[]>(
    tipy.map((t) => [
      t,
      peremeshat(
        [...vse.values()].filter((z) => z.prototypeId === t),
        `${zerno}:${t}`,
      ),
    ]),
  );
  const order = poKrugu(tipy, skolko);
  const units: HwUnitInput[] = [];
  /* Счётчик по типу: подряд по перемешанному банку — без повторов, пока хватает. */
  const shag = new Map<string, number>();
  for (const student of students) {
    for (const t of order) {
      const q = ochered.get(t) ?? [];
      if (q.length === 0) continue;
      const i = shag.get(t) ?? 0;
      shag.set(t, i + 1);
      const z = q[i % q.length] as Z7;
      units.push(await unit7(z, names, student, d));
    }
  }
  return sPrimerami(units, vse, d);
}

/** Задача банка по id («F012», «P05-a07»): ищется по индексу. */
async function zadachaPoId(id: string, d: Awaited<ReturnType<typeof dannye>>): Promise<Z7 | null> {
  const indeks = await d.zagruzitIndeks();
  const stroka = indeks.find((z) => z.id === id);
  if (stroka === undefined) return null;
  const vse = (await d.zagruzitZadachi([stroka.p])) as Map<string, Z7>;
  return vse.get(id) ?? null;
}

/** Конкретная задача тренажёра. */
export async function zadacha7(k: KatalogRazdela, ref: string): Promise<HwUnitInput[]> {
  const d = await dannye();
  const z = await zadachaPoId(ref, d);
  if (z === null) return [];
  const vse = (await d.zagruzitZadachi([z.prototypeId])) as Map<string, Z7>;
  return sPrimerami([await unit7(z, imena(k), null, d)], vse, d);
}

/**
 * Работа над ошибками: другая задача банка того же прототипа (у №7
 * зерна нет — аналог берётся из банка).
 */
export async function analogZadachi7(
  k: KatalogRazdela,
  ref: string,
  studentId: string,
  zerno: string,
  avoid: Set<string>,
): Promise<HwUnitInput | null> {
  const d = await dannye();
  const z = await zadachaPoId(ref, d);
  if (z === null) return null;
  avoid.add(z.id);
  const vse = (await d.zagruzitZadachi([z.prototypeId])) as Map<string, Z7>;
  const drugie = peremeshat(
    [...vse.values()].filter((x) => x.prototypeId === z.prototypeId && !avoid.has(x.id)),
    `${zerno}:${ref}`,
  );
  const vybor = drugie[0];
  if (vybor === undefined) return null;
  avoid.add(vybor.id);
  return unit7(vybor, imena(k), studentId, d);
}

/** Опорная задача №7: сама задача блока (зерна нет), ответ и разбор открыты из каталога. */
export function opornaya7(blok: BlokKat, id: string, studentId: string | null): HwUnitInput | null {
  const z = blok.zadachi.find((x) => x.id === id);
  if (z === undefined || z.klyuch === undefined || z.razbor === undefined) return null;
  return {
    studentId,
    kind: id,
    ref: `${blok.slug}:${id}`,
    answerKind: 'number',
    questionHtml: z.uslovieHtml,
    view: {
      tipHtml: blok.nazvanie,
      tekst: true,
      podskazka: z.podskazkaHtml,
      zapomni: blok.zapomniHtml,
    },
    answer: openText(z.klyuch, id),
    razbor: JSON.parse(openText(z.razbor, id)) as RazborDz,
    source: `опорная ${blok.slug} ${id}`,
  };
}

export function opornye7(blok: BlokKat, zadachi: readonly string[]): HwUnitInput[] {
  return zadachi.map((id) => opornaya7(blok, id, null)).filter((u): u is HwUnitInput => u !== null);
}
