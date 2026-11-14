/**
 * Раздел, у которого тренажёр — готовый список задач (№3, №4, №5):
 * задачи берутся из данных «Собрать вариант» (/variant/dannye/zNN.json),
 * ответ и разбор открываются отпечатком при выдаче, как на листе
 * учителя. Здесь — общее: подбор по типам и зерну, конкретная задача по
 * ключу тренажёра, аналог для работы над ошибками, пример к первой
 * задаче типа. Как собрать одну задачу — в конфигурации раздела.
 */

import type { KatalogRazdela } from '../katalog/types';
import type { HwUnitInput } from '../types';
import { peremeshat, poKrugu } from './obshchee';

/** Задача списка: ключ (как в тренажёре) и тип (прототип). */
export interface ZadachaSpiska {
  id: string;
  tip: string;
}

export type Postroennaya = Omit<HwUnitInput, 'studentId' | 'kind' | 'ref'>;

export interface KonfigSpiska<Z extends ZadachaSpiska> {
  zagruzit(): Promise<readonly Z[]>;
  postroit(z: Z): Promise<Postroennaya>;
}

export function sozdatSpisok<Z extends ZadachaSpiska>(k: KonfigSpiska<Z>) {
  let spisok: Promise<readonly Z[]> | null = null;
  const vse = (): Promise<readonly Z[]> => {
    spisok ??= k.zagruzit().catch((e: unknown) => {
      spisok = null;
      throw e;
    });
    return spisok;
  };

  function tipHtml(kat: KatalogRazdela, tip: string): string {
    return kat.trenazher.flatMap((g) => g.tipy).find((t) => t.id === tip)?.nazvanieHtml ?? tip;
  }

  async function edinitsa(
    kat: KatalogRazdela,
    z: Z,
    studentId: string | null,
  ): Promise<HwUnitInput> {
    const p = await k.postroit(z);
    return {
      ...p,
      studentId,
      kind: z.tip,
      ref: z.id,
      view: { ...p.view, tipHtml: tipHtml(kat, z.tip) },
    };
  }

  /** Пример — у первой задачи каждого типа: другая задача того же типа. */
  async function sPrimerami(
    units: HwUnitInput[],
    spisok: readonly Z[],
    kat: KatalogRazdela,
  ): Promise<HwUnitInput[]> {
    const zanyato = new Set(units.map((u) => u.ref));
    const byli = new Set<string>();
    const out: HwUnitInput[] = [];
    for (const u of units) {
      const key = `${u.studentId}:${u.kind}`;
      const z = byli.has(key)
        ? undefined
        : spisok.find((x) => x.tip === u.kind && !zanyato.has(x.id));
      byli.add(key);
      if (z === undefined) {
        out.push(u);
        continue;
      }
      const p = await edinitsa(kat, z, null);
      out.push(
        p.answer === null || p.razbor === null
          ? u
          : {
              ...u,
              view: {
                ...u.view,
                primer: { uslovieHtml: p.questionHtml, razbor: p.razbor, otvet: p.answer },
              },
            },
      );
    }
    return out;
  }

  /** «Типы × сколько»: по кругу, из перемешанного по зерну списка; у каждого свои, пока хватает. */
  async function trenazher(
    kat: KatalogRazdela,
    tipy: readonly string[],
    skolko: number,
    zerno: string,
    komu: readonly (string | null)[],
  ): Promise<HwUnitInput[]> {
    const spisok = await vse();
    const ochered = new Map(
      tipy.map((t) => [
        t,
        peremeshat(
          spisok.filter((z) => z.tip === t),
          `${zerno}:${t}`,
        ),
      ]),
    );
    const order = poKrugu(tipy, skolko);
    const shag = new Map<string, number>();
    const units: HwUnitInput[] = [];
    for (const student of komu) {
      for (const t of order) {
        const q = ochered.get(t) ?? [];
        if (q.length === 0) continue;
        const i = shag.get(t) ?? 0;
        shag.set(t, i + 1);
        units.push(await edinitsa(kat, q[i % q.length] as Z, student));
      }
    }
    return sPrimerami(units, spisok, kat);
  }

  /** Конкретная задача по ключу тренажёра. */
  async function zadacha(kat: KatalogRazdela, ref: string): Promise<HwUnitInput[]> {
    const spisok = await vse();
    const z = spisok.find((x) => x.id === ref);
    return z === undefined ? [] : sPrimerami([await edinitsa(kat, z, null)], spisok, kat);
  }

  /** Работа над ошибками: другая задача того же типа. */
  async function analogZadachi(
    kat: KatalogRazdela,
    ref: string,
    studentId: string,
    zerno: string,
    avoid: Set<string>,
  ): Promise<HwUnitInput | null> {
    const spisok = await vse();
    const z = spisok.find((x) => x.id === ref);
    if (z === undefined) return null;
    avoid.add(z.id);
    const vybor = peremeshat(
      spisok.filter((x) => x.tip === z.tip && !avoid.has(x.id)),
      `${zerno}:${ref}`,
    )[0];
    if (vybor === undefined) return null;
    avoid.add(vybor.id);
    return edinitsa(kat, vybor, studentId);
  }

  return { trenazher, zadacha, analogZadachi };
}
