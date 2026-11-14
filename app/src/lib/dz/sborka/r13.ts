/**
 * №13 в ДЗ (экономическая задача). Задачу строит генератор раздела по
 * прототипу и зерну (lib/zadanie13/generate.ts) — тот же, что у тренажёра
 * и опорных: условие с таблицей, ответ числом, подсказка по шагам,
 * решение разметкой раздела (reshenieHtml, стили reshenie13.css).
 *
 * Тренажёр — сначала зерна банка (BANK_13), без повторов между
 * учениками, дальше новые зерна от зерна выдачи. Ключ — как в тренажёре:
 * «A-01|b3».
 *
 * Опорные — по постоянным id задач блока (opornye/sostav.ts): аналог —
 * тот же прототип на новом зерне (решение владельца). «Определи тип»
 * (блок 17) — выбор схемы из четырёх.
 */

import { typeset } from '@/lib/tex';
import type { BlokKat, KatalogRazdela } from '../katalog/types';
import type { HwUnitInput, RazborDz, VidDz, VoprosDz } from '../types';
import { chisloEge, peremeshat, poKrugu } from './obshchee';
import type { SborshchikRazdela } from './razdely';

const TIPY = ['A', 'B', 'C', 'D'] as const;

async function moduli() {
  const [gen, bank, html, reshenie, seal, types, bloki] = await Promise.all([
    import('@/lib/zadanie13/generate'),
    import('@/lib/zadanie13/bank'),
    import('@/lib/zadanie13/html'),
    import('@/lib/zadanie13/reshenieHtml'),
    import('@/lib/zadanie13/opornye/seal'),
    import('@/lib/zadanie13/types'),
    import('@/lib/zadanie13/opornye/bloki'),
  ]);
  return { gen, bank, html, reshenie, seal, types, bloki };
}
type M = Awaited<ReturnType<typeof moduli>>;
type Task13 = ReturnType<M['gen']['generate']>;

function uslovie(m: M, t: Task13): string {
  const tekst = t.condition
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => `<p>${typeset(line)}</p>`)
    .join('');
  const tablica =
    t.conditionTable === undefined
      ? ''
      : m.html.tablitsaHtml(m.html.kletkiUsloviya(t.conditionTable));
  return tekst + tablica;
}

function voprosy(m: M, t: Task13): VoprosDz[] {
  return m.seal.shagiHtml(t.hints).map((h) => ({
    voprosHtml: h.question,
    variantyHtml: h.options,
    verno: h.correct,
    ...(h.comment === null ? {} : { kommentariyHtml: h.comment }),
  }));
}

function razbor(m: M, t: Task13): RazborDz {
  return {
    shagi: [{ chto: m.reshenie.reshenieHtml(t.solution, t.tableModel), tex: '' }],
    delimost: [],
  };
}

/** Задача ответом числом: условие, подсказка, решение. */
function zadachaChislom(
  m: M,
  t: Task13,
): Pick<HwUnitInput, 'answerKind' | 'questionHtml' | 'view' | 'answer' | 'razbor'> {
  const v = voprosy(m, t);
  return {
    answerKind: 'number',
    questionHtml: uslovie(m, t),
    view: { tekst: true, ...(v.length === 0 ? {} : { voprosy: v }) },
    answer: chisloEge(t.answer),
    razbor: razbor(m, t),
  };
}

/** «Определи тип»: условие, ответ — номер схемы. */
function zadachaTip(
  m: M,
  t: Task13,
): Pick<HwUnitInput, 'answerKind' | 'questionHtml' | 'view' | 'answer' | 'razbor'> {
  const imena = m.types.TYPE_NAMES;
  return {
    answerKind: 'choice',
    questionHtml: uslovie(m, t),
    view: {
      tekst: true,
      varianty: TIPY.map((x, i) => ({ number: String(i + 1), label: imena[x] })),
    },
    answer: String(TIPY.indexOf(t.type) + 1),
    razbor: {
      shagi: [
        { zag: 'Называем схему', chto: `<p>Это ${imena[t.type].toLowerCase()}.</p>`, tex: '' },
      ],
      delimost: [],
    },
  };
}

function tipHtml(kat: KatalogRazdela, proto: string): string {
  return kat.trenazher.flatMap((g) => g.tipy).find((t) => t.id === proto)?.nazvanieHtml ?? proto;
}

function edinitsa(
  m: M,
  kat: KatalogRazdela,
  proto: string,
  seed: string,
  izBanka: boolean,
  studentId: string | null,
): HwUnitInput | null {
  let t: Task13;
  try {
    t = m.gen.generate(proto, seed);
  } catch {
    return null;
  }
  const z = zadachaChislom(m, t);
  return {
    ...z,
    studentId,
    kind: proto,
    ref: `${proto}|${seed}`,
    view: { ...z.view, tipHtml: tipHtml(kat, proto) },
    source: izBanka ? `банк раздела, ${proto}` : `новая задача прототипа ${proto}`,
  };
}

/** Пример типа — задача того же прототипа на постоянном зерне. */
function sPrimerami(m: M, units: HwUnitInput[]): HwUnitInput[] {
  const byli = new Set<string>();
  return units.map((u) => {
    const key = `${u.studentId}:${u.kind}`;
    if (byli.has(key)) return u;
    byli.add(key);
    try {
      const z = zadachaChislom(m, m.gen.generate(u.kind, `primer-${u.kind}`));
      return z.razbor === null || z.answer === null
        ? u
        : {
            ...u,
            view: {
              ...u.view,
              primer: { uslovieHtml: z.questionHtml, razbor: z.razbor, otvet: z.answer },
            },
          };
    } catch {
      return u;
    }
  });
}

function bankZeren(m: M, proto: string): string[] {
  return m.bank.BANK_13.filter(([id]) => id === proto).map(([, seed]) => seed);
}

async function trenazher(
  kat: KatalogRazdela,
  tipy: readonly string[],
  skolko: number,
  zerno: string,
  students: readonly (string | null)[],
): Promise<HwUnitInput[]> {
  const m = await moduli();
  const ochered = new Map(tipy.map((t) => [t, peremeshat(bankZeren(m, t), `${zerno}:${t}`)]));
  const order = poKrugu(tipy, skolko);
  const units: HwUnitInput[] = [];
  const shag = new Map<string, number>();
  for (const [s, student] of students.entries()) {
    const vidno = new Set<string>();
    for (const [j, t] of order.entries()) {
      const q = ochered.get(t) ?? [];
      let u: HwUnitInput | null = null;
      /* Сначала банк — подряд без повторов; кончился — новые зерна. */
      for (let popytka = 0; u === null && popytka < 20; popytka += 1) {
        const i = shag.get(t) ?? 0;
        shag.set(t, i + 1);
        const izBanka = i < q.length;
        const seed = izBanka ? (q[i] as string) : `${zerno}:${s}:${j}:${popytka}`;
        const c = edinitsa(m, kat, t, seed, izBanka, student);
        if (c !== null && !vidno.has(c.questionHtml)) u = c;
      }
      if (u !== null) {
        vidno.add(u.questionHtml);
        units.push(u);
      }
    }
  }
  return sPrimerami(m, units);
}

async function zadacha(kat: KatalogRazdela, ref: string): Promise<HwUnitInput[]> {
  const m = await moduli();
  const [proto = '', seed = ''] = ref.split('|');
  const u = edinitsa(m, kat, proto, seed, bankZeren(m, proto).includes(seed), null);
  return u === null ? [] : sPrimerami(m, [u]);
}

/** Работа над ошибками: тот же прототип, новое зерно. */
async function analogZadachi(
  kat: KatalogRazdela,
  ref: string,
  studentId: string,
  zerno: string,
): Promise<HwUnitInput | null> {
  const m = await moduli();
  const proto = ref.split('|')[0] ?? '';
  for (let i = 0; i < 20; i += 1) {
    const u = edinitsa(m, kat, proto, `${zerno}:${ref}:${i}`, false, studentId);
    if (u !== null) return u;
  }
  return null;
}

/** Опорная по постоянному id: прототип задачи блока на зерне выдачи. */
function opornaya(
  m: M,
  blok: BlokKat,
  id: string,
  seed: string,
  studentId: string | null,
): HwUnitInput | null {
  const z = m.bloki.zadachaPoId13(id);
  if (z === undefined) return null;
  /* Новое зерно может не подойти прототипу — тогда следующее. */
  for (let i = 0; i < 20; i += 1) {
    const s = i === 0 ? seed : `${seed}:${i}`;
    let t: Task13;
    try {
      t = m.gen.generate(z.prototypeId, s);
    } catch {
      continue;
    }
    const gotovo = z.blok.vid === 'tip' ? zadachaTip(m, t) : zadachaChislom(m, t);
    const view: VidDz = {
      ...gotovo.view,
      tipHtml: blok.nazvanie,
      ...(blok.zapomniHtml === '' ? {} : { zapomni: blok.zapomniHtml }),
    };
    return {
      ...gotovo,
      view,
      studentId,
      kind: id,
      ref: `${id}|${s}`,
      source: `опорная ${id}`,
    };
  }
  return null;
}

async function opornye(
  blok: BlokKat,
  ids: readonly string[],
  zerno: string,
  students: readonly (string | null)[],
): Promise<HwUnitInput[]> {
  const m = await moduli();
  return students.flatMap((student, s) =>
    ids
      .map((id) => opornaya(m, blok, id, `${zerno}:${s}:${id}`, student))
      .filter((u): u is HwUnitInput => u !== null),
  );
}

export const SBORSHCHIK_13: SborshchikRazdela = {
  opornyeIzZerna: true,
  trenazher,
  zadacha,
  analogZadachi: (kat, ref, student, zerno) => analogZadachi(kat, ref, student, zerno),
  opornye,
  analogOpornoy: async (blok, kind, _ref, zerno, student) =>
    (await opornye(blok, [kind], zerno, [student]))[0] ?? null,
};
