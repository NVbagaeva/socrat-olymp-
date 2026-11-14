/**
 * Разделы-генераторы в ДЗ (№2, №9): задачу строит генератор прототипа
 * по зерну. Тренажёр — сначала проверенные зерна банка раздела (без
 * повторов между учениками), дальше — новые зерна от зерна выдачи;
 * опорные — аналог с новым зерном (решение владельца). Рисунки —
 * движками разделов, в снимок уходит готовый SVG. Работает в браузере
 * репетитора при выдаче. Чем разделы различаются — в конфигурации
 * (r2, r9).
 */

import { typeset } from '@/lib/tex';
import type { BlokKat, KatalogRazdela } from '../katalog/types';
import type { HwUnitInput, RazborDz, ShagDz, VidDz, VoprosDz } from '../types';
import { chisloEge, peremeshat, poKrugu } from './obshchee';

/** Подсказка-вопрос генератора: вопрос и кнопки, одна верная. */
export interface VoprosGen {
  vopros: string;
  knopki: { tekst: string; verno: boolean; pochemu?: string }[];
  itog?: string;
}

export interface ZadachaGen<R> {
  uslovie: string;
  risunok: R | null;
  otvet: number;
  shagi: { zagolovok: string; stroki: string[] }[];
  podskazka?: VoprosGen[];
}

export interface OpornayaGen<R> {
  uslovie: string;
  risunok: R | null;
  /** Число или номер варианта (у выбора). */
  otvet: number | string;
  razbor: string[];
  /** Варианты выбора: номер и подпись с формулами. */
  varianty?: { number: string; label: string }[];
  podskazka?: VoprosGen[];
}

export interface KonfigGen<R> {
  /** Модули раздела (тяжёлые — лениво). */
  moduli: () => Promise<{
    generate(proto: string, seed: string): ZadachaGen<R>;
    risunok(r: R, rezhim: 'uchenik' | 'uchitel'): string;
    /** Проверенные зерна банка раздела для прототипа. */
    bank(proto: string): string[];
    opornaya(id: string, seed: string): OpornayaGen<R>;
    /** Название микро-задачи и формула-подсказка (TeX без $), если есть. */
    mikro(id: string): { nazvanie: string; formula?: string; vybor: boolean } | undefined;
  }>;
  istochnik: (proto: string, seed: string, izBanka: boolean) => string;
}

function voprosy(list: readonly VoprosGen[] | undefined): VoprosDz[] {
  return (list ?? [])
    .map((q) => ({
      voprosHtml: typeset(q.vopros),
      variantyHtml: q.knopki.map((k) => typeset(k.tekst)),
      verno: q.knopki.findIndex((k) => k.verno),
      ...(q.itog === undefined || q.itog === '' ? {} : { kommentariyHtml: typeset(q.itog) }),
    }))
    .filter((q) => q.verno >= 0);
}

export function sozdatGenerator<R>(k: KonfigGen<R>) {
  type M = Awaited<ReturnType<KonfigGen<R>['moduli']>>;

  function razbor(m: M, z: ZadachaGen<R>): RazborDz {
    const shagi: ShagDz[] = z.shagi.map((s) => ({
      chto: s.stroki.map((l) => `<p>${typeset(l)}</p>`).join(''),
      tex: '',
      ...(s.zagolovok === '' ? {} : { zag: typeset(s.zagolovok) }),
    }));
    const ris = z.risunok === null ? '' : m.risunok(z.risunok, 'uchitel');
    return {
      shagi,
      delimost: [],
      ...(ris === '' ? {} : { posle: `<div class="trn-risunok">${ris}</div>` }),
    };
  }

  function uslovie(m: M, text: string, r: R | null): string {
    const ris = r === null ? '' : m.risunok(r, 'uchenik');
    return typeset(text) + (ris === '' ? '' : `<div class="trn-risunok">${ris}</div>`);
  }

  function edinitsa(
    m: M,
    kat: KatalogRazdela,
    proto: string,
    seed: string,
    izBanka: boolean,
    studentId: string | null,
  ): HwUnitInput | null {
    let z: ZadachaGen<R>;
    try {
      z = m.generate(proto, seed);
    } catch {
      return null;
    }
    const tipHtml =
      kat.trenazher.flatMap((g) => g.tipy).find((t) => t.id === proto)?.nazvanieHtml ?? proto;
    const v = voprosy(z.podskazka);
    const view: VidDz = { tipHtml, tekst: true, ...(v.length === 0 ? {} : { voprosy: v }) };
    return {
      studentId,
      kind: proto,
      ref: `${proto}|${seed}`,
      answerKind: 'number',
      questionHtml: uslovie(m, z.uslovie, z.risunok),
      view,
      answer: chisloEge(z.otvet),
      razbor: razbor(m, z),
      source: k.istochnik(proto, seed, izBanka),
    };
  }

  /** Пример типа — своя задача на постоянном зерне, у всех одна. */
  function sPrimerami(m: M, units: HwUnitInput[]): HwUnitInput[] {
    const byli = new Set<string>();
    return units.map((u) => {
      const key = `${u.studentId}:${u.kind}`;
      if (byli.has(key)) return u;
      byli.add(key);
      try {
        const z = m.generate(u.kind, `primer-${u.kind}`);
        return {
          ...u,
          view: {
            ...u.view,
            primer: {
              uslovieHtml: uslovie(m, z.uslovie, z.risunok),
              razbor: razbor(m, z),
              otvet: chisloEge(z.otvet),
            },
          },
        };
      } catch {
        return u;
      }
    });
  }

  async function trenazher(
    kat: KatalogRazdela,
    tipy: readonly string[],
    skolko: number,
    zerno: string,
    students: readonly (string | null)[],
  ): Promise<HwUnitInput[]> {
    const m = await k.moduli();
    const ochered = new Map(tipy.map((t) => [t, peremeshat(m.bank(t), `${zerno}:${t}`)]));
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
    const m = await k.moduli();
    const [proto = '', seed = ''] = ref.split('|');
    const u = edinitsa(m, kat, proto, seed, m.bank(proto).includes(seed), null);
    return u === null ? [] : sPrimerami(m, [u]);
  }

  /** Работа над ошибками: тот же прототип, новое зерно. */
  async function analogZadachi(
    kat: KatalogRazdela,
    ref: string,
    studentId: string,
    zerno: string,
  ): Promise<HwUnitInput | null> {
    const m = await k.moduli();
    const proto = ref.split('|')[0] ?? '';
    for (let i = 0; i < 20; i += 1) {
      const u = edinitsa(m, kat, proto, `${zerno}:${i}`, false, studentId);
      if (u !== null) return u;
    }
    return null;
  }

  function opornaya(
    m: M,
    blok: BlokKat,
    id: string,
    seed: string,
    studentId: string | null,
  ): HwUnitInput | null {
    const info = m.mikro(id);
    if (info === undefined) return null;
    let z: OpornayaGen<R>;
    try {
      z = m.opornaya(id, seed);
    } catch {
      return null;
    }
    const v = voprosy(z.podskazka);
    const ris = z.risunok === null ? '' : m.risunok(z.risunok, 'uchitel');
    return {
      studentId,
      kind: id,
      ref: `${id}|${seed}`,
      answerKind: info.vybor ? 'choice' : 'number',
      questionHtml: uslovie(m, z.uslovie, z.risunok),
      view: {
        tipHtml: info.nazvanie,
        tekst: true,
        zapomni: blok.zapomniHtml,
        ...(info.formula === undefined ? {} : { podskazka: typeset(`$${info.formula}$`) }),
        ...(v.length === 0 ? {} : { voprosy: v }),
        ...(z.varianty === undefined
          ? {}
          : { varianty: z.varianty.map((x) => ({ number: x.number, label: x.label })) }),
      },
      answer: info.vybor ? String(z.otvet) : chisloEge(Number(z.otvet)),
      razbor: {
        shagi: z.razbor.map((l) => ({ chto: `<p>${typeset(l)}</p>`, tex: '' })),
        delimost: [],
        ...(ris === '' ? {} : { posle: `<div class="trn-risunok">${ris}</div>` }),
      },
      source: `опорная ${id}`,
    };
  }

  /** Опорные блока: аналоги с новым зерном, у каждого ученика — своё (s). */
  async function opornyeAsync(
    blok: BlokKat,
    ids: readonly string[],
    zerno: string,
    students: readonly (string | null)[],
  ): Promise<HwUnitInput[]> {
    const m = await k.moduli();
    return students.flatMap((student, s) =>
      ids
        .map((id) => opornaya(m, blok, id, `${zerno}:${s}`, student))
        .filter((u): u is HwUnitInput => u !== null),
    );
  }

  return { trenazher, zadacha, analogZadachi, opornyeAsync, opornaya, moduli: k.moduli };
}
