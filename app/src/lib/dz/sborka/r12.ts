/**
 * №12 в ДЗ (графики функций). Тренажёр — шаблоны наборов движка graph/
 * («12Q.B-07»): задача собирается тем же кодом, что у тренажёра
 * (lib/trainerSession.ts, zadachaShablona) — условие, чертёж, ответ,
 * разбор опорных задач. Зерно — от зерна выдачи, у каждого ученика своё;
 * дословные задачи банка ФИПИ на любом зерне те же. Ключ в ДЗ —
 * «шаблон|seed»; с кнопки тренажёра приходит один шаблон — зерно тогда
 * постоянное («dz:шаблон»).
 *
 * Опорные — задачи навыков подтем без зерна (id движка «P12-1-01»
 * постоянные, лежат в данных graph/): в ДЗ идёт сама задача. Собирает её
 * при выдаче тот же движок, что страницу навыка (lib/prep.ts,
 * buildPrepTasks): условие с чертежом, ответ, разбор с чертежами шагов —
 * в каталоге им места нет. Блок — «подтема/навык».
 */

import { typeset } from '@/lib/tex';
import type { PrepBlock, PrepStep, PrepZakrytoe } from '@/lib/prep';
import type { TrainerTask } from '@/lib/trainer';
import { normalizeEge } from '@/lib/otvet/proverkaDz';
import type { BlokKat, KatalogRazdela } from '../katalog/types';
import type { HwUnitInput, ShagDz } from '../types';
import { peremeshat, poKrugu } from './obshchee';
import type { SborshchikRazdela } from './razdely';

/** Шаблон тренажёра в каталоге: ключ и набор (прототип). */
export interface Shablon12 {
  k: string;
  p: string;
}

function blokHtml(b: PrepBlock): string {
  switch (b.type) {
    case 'text':
      return `<p>${typeset(b.html)}</p>`;
    case 'formula':
      return `<p>${b.html}</p>`;
    case 'answer':
      return `<p><b>${b.html}</b></p>`;
    case 'chart':
      return `<div class="trn-risunok rdz-graf">${b.svg}</div>`;
    case 'callout':
      return `<div class="rdz-vynoska"><p><b>${typeset(b.title)}</b></p>${b.blocks.map(blokHtml).join('')}</div>`;
    case 'details':
      return `<details class="trn-posle"><summary class="stk-summary">${typeset(b.title)}<span class="stk-shevron" aria-hidden="true"></span></summary>${b.blocks.map(blokHtml).join('')}</details>`;
    default:
      return '';
  }
}

/** Разбор опорных задач и тренажёра №12 (PrepStep[]) → шаги решения ДЗ. */
export function shagiPrep12(steps: readonly PrepStep[]): ShagDz[] {
  return steps.map((s) => ({
    zag: s.titleHtml ?? typeset(s.title),
    chto: s.blocks.map(blokHtml).join(''),
    tex: '',
  }));
}

/** Ответ задачи №12 → ключ ДЗ: номер варианта или число в записи ЕГЭ. */
export function otvet12(answer: string, vybor: boolean): string | null {
  return vybor ? answer : normalizeEge(answer);
}

async function moduli() {
  const { zadachaShablona } = await import('@/lib/trainerSession');
  return { zadachaShablona, cache: new Map() as Parameters<typeof zadachaShablona>[2] };
}
type M = Awaited<ReturnType<typeof moduli>>;

function shablony(kat: KatalogRazdela): Shablon12[] {
  return (kat.bankTrenazhera ?? []) as Shablon12[];
}

function tipHtml(kat: KatalogRazdela, set: string): string {
  return kat.trenazher.flatMap((g) => g.tipy).find((t) => t.id === set)?.nazvanieHtml ?? set;
}

function izZadachi(
  t: TrainerTask,
): Pick<HwUnitInput, 'answerKind' | 'questionHtml' | 'view' | 'answer' | 'razbor'> | null {
  const vybor = t.options !== null && t.options.length > 0;
  const answer = otvet12(t.answer, vybor);
  if (answer === null) return null;
  const ris = t.chartSvg === null ? '' : `<div class="trn-risunok rdz-graf">${t.chartSvg}</div>`;
  const shagi =
    t.solution === null || t.solution.length === 0
      ? [{ chto: `<p>${t.rightHint}</p>`, tex: '' }]
      : shagiPrep12(t.solution);
  return {
    answerKind: vybor ? 'choice' : 'number',
    questionHtml: t.questionHtml + ris,
    view: vybor
      ? { varianty: (t.options ?? []).map((o) => ({ number: o.number, label: o.html })) }
      : {},
    answer,
    razbor: { shagi, delimost: [] },
  };
}

function edinitsa(
  m: M,
  kat: KatalogRazdela,
  key: string,
  seedFor: (attempt: number) => string,
  studentId: string | null,
): HwUnitInput | null {
  const t = m.zadachaShablona(key, seedFor, m.cache);
  if (t === null) return null;
  const z = izZadachi(t);
  if (z === null) return null;
  const set = key.split('-')[0] ?? key;
  return {
    ...z,
    studentId,
    kind: set,
    ref: `${key}|${t.origin?.seed ?? ''}`,
    view: { ...z.view, tipHtml: tipHtml(kat, set) },
    source: `шаблон ${key}`,
  };
}

/** Пример типа — другой шаблон того же набора на постоянном зерне. */
function sPrimerami(m: M, kat: KatalogRazdela, units: HwUnitInput[]): HwUnitInput[] {
  const byli = new Set<string>();
  const zanyato = new Set(units.map((u) => u.ref.split('|')[0]));
  return units.map((u) => {
    const key = `${u.studentId}:${u.kind}`;
    if (byli.has(key)) return u;
    byli.add(key);
    const shablon = shablony(kat).find((s) => s.p === u.kind && !zanyato.has(s.k));
    if (shablon === undefined) return u;
    const p = edinitsa(m, kat, shablon.k, (a) => `primer-${shablon.k}:${a}`, null);
    return p === null || p.answer === null || p.razbor === null
      ? u
      : {
          ...u,
          view: {
            ...u.view,
            primer: { uslovieHtml: p.questionHtml, razbor: p.razbor, otvet: p.answer },
          },
        };
  });
}

async function trenazher(
  kat: KatalogRazdela,
  tipy: readonly string[],
  skolko: number,
  zerno: string,
  students: readonly (string | null)[],
): Promise<HwUnitInput[]> {
  const m = await moduli();
  const ochered = new Map(
    tipy.map((t) => [
      t,
      peremeshat(
        shablony(kat).filter((s) => s.p === t),
        `${zerno}:${t}`,
      ),
    ]),
  );
  const order = poKrugu(tipy, skolko);
  const units: HwUnitInput[] = [];
  const shag = new Map<string, number>();
  for (const [s, student] of students.entries()) {
    const vidno = new Set<string>();
    for (const [j, t] of order.entries()) {
      const q = ochered.get(t) ?? [];
      if (q.length === 0) continue;
      let u: HwUnitInput | null = null;
      /* Шаблоны набора по кругу; дословная задача банка уже была — следующий. */
      for (let popytka = 0; u === null && popytka < q.length * 2; popytka += 1) {
        const i = shag.get(t) ?? 0;
        shag.set(t, i + 1);
        const shablon = q[i % q.length] as Shablon12;
        const c = edinitsa(m, kat, shablon.k, (a) => `${zerno}:${s}:${j}:${popytka}:${a}`, student);
        if (c !== null && !vidno.has(c.questionHtml)) u = c;
      }
      if (u !== null) {
        vidno.add(u.questionHtml);
        units.push(u);
      }
    }
  }
  return sPrimerami(m, kat, units);
}

async function zadacha(kat: KatalogRazdela, ref: string): Promise<HwUnitInput[]> {
  const m = await moduli();
  const [key = '', seed] = ref.split('|');
  const u = edinitsa(
    m,
    kat,
    key,
    seed === undefined || seed === ''
      ? (a) => `dz:${key}:${a}`
      : (a) => (a === 0 ? seed : `${seed}:${a}`),
    null,
  );
  return u === null ? [] : sPrimerami(m, kat, [u]);
}

/** Работа над ошибками: шаблон того же набора на новом зерне, другая задача. */
async function analogZadachi(
  kat: KatalogRazdela,
  ref: string,
  studentId: string,
  zerno: string,
): Promise<HwUnitInput | null> {
  const m = await moduli();
  const key = ref.split('|')[0] ?? '';
  const set = key.split('-')[0] ?? key;
  const byl = await zadacha(kat, ref);
  const staroe = byl[0]?.questionHtml;
  const kandidaty = [
    key,
    ...peremeshat(
      shablony(kat)
        .filter((s) => s.p === set && s.k !== key)
        .map((s) => s.k),
      `${zerno}:${ref}`,
    ),
  ];
  for (const k of kandidaty) {
    const u = edinitsa(m, kat, k, (a) => `${zerno}:${ref}:${a}`, studentId);
    if (u !== null && u.questionHtml !== staroe) return u;
  }
  return null;
}

/** Опорные блока «подтема/навык»: задачи навыка движком, ответ — от движка. */
async function opornye(blok: BlokKat, ids: readonly string[]): Promise<HwUnitInput[]> {
  const [type = '', skillId = ''] = blok.slug.split('/');
  const [prep, { openText }, gen] = await Promise.all([
    import('@/lib/prep'),
    import('@/lib/prepSecret'),
    import('@/lib/graph/generate.js'),
  ]);
  const skill = prep.findPrepSkill(type, skillId);
  if (skill === undefined) return [];
  const otvety = new Map(
    (gen.default.generateSet(skill.setId) as { id: string; answer: string }[]).map((t) => [
      t.id,
      t.answer,
    ]),
  );
  const zadachi = prep.buildPrepTasks(skill);
  return ids.flatMap((id): HwUnitInput[] => {
    const t = zadachi.find((x) => x.id === id);
    if (t === undefined) return [];
    const vybor = t.answerType === 'choice';
    const answer = otvet12(otvety.get(id) ?? '', vybor);
    if (answer === null) return [];
    const z = JSON.parse(openText(t.zakryto, t.seal)) as PrepZakrytoe;
    return [
      {
        studentId: null,
        kind: id,
        ref: `${blok.slug}:${id}`,
        answerKind: vybor ? 'choice' : 'number',
        questionHtml:
          t.questionHtml +
          (t.chartSvg === null ? '' : `<div class="trn-risunok rdz-graf">${t.chartSvg}</div>`),
        view: {
          tipHtml: blok.nazvanie,
          ...(t.hintHtml === null ? {} : { podskazka: t.hintHtml }),
          ...(blok.zapomniHtml === '' ? {} : { zapomni: blok.zapomniHtml }),
          ...(t.options === null
            ? {}
            : { varianty: t.options.map((o) => ({ number: o.number, label: o.html })) }),
        },
        answer,
        razbor: { shagi: z.steps === null ? [] : shagiPrep12(z.steps), delimost: [] },
        source: `опорная ${id}`,
      },
    ];
  });
}

export const SBORSHCHIK_12: SborshchikRazdela = {
  opornyeIzZerna: false,
  trenazher,
  zadacha,
  analogZadachi: (kat, ref, student, zerno) => analogZadachi(kat, ref, student, zerno),
  opornye: (blok, ids) => opornye(blok, ids),
  /* Зерна нет — в работу над ошибками идёт та же задача. */
  analogOpornoy: async (blok, kind, _ref, _zerno, student) => {
    const u = (await opornye(blok, [kind]))[0];
    return u === undefined ? null : { ...u, studentId: student };
  },
};
