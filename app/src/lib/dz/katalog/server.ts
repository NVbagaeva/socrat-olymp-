/**
 * Каталог разделов для конструктора ДЗ — на сборке. Источник один с
 * вкладками раздела: колода карточек (content/kartochki, готовит
 * lib/kartochki/podgotovka), блоки опорных задач и типы тренажёра.
 * Отдаётся файлом /kabinet/dz-vydat/dannye/zNN.json
 * (app/kabinet/dz-vydat/dannye/[file]/route.ts).
 *
 * Разделы подключаются по одному (пилот — №7 и №8): RAZDELY_DZ.
 */

import { KOLODY } from '@/content/kartochki';
import { podgotovit } from '@/lib/kartochki/podgotovka';
import { otpechatok } from '@/lib/kartochki/otvet';
import { typeset } from '@/lib/tex';
import { normalizeEge } from '@/lib/otvet/proverkaDz';
import { BLOKI_OPORNYH as BLOKI6 } from '@/lib/zadanie6/opornye';
import { GROUPS as GROUPS6, PROTOTYPES as PROTOTYPES6 } from '@/lib/zadanie6/prototypes';
import { BLOKI_OPORNYH as BLOKI7 } from '@/lib/zadanie7/opornye';
import { GROUPS as GROUPS7, PROTOTYPES as PROTOTYPES7 } from '@/lib/zadanie7/prototypes';
import { BLOKI_OPORNYH as BLOKI10 } from '@/lib/zadanie10/opornye';
import { GROUPS as GROUPS10, PROTOTYPES as PROTOTYPES10 } from '@/lib/zadanie10/prototypes';
import { PREP_BLOCKS } from '@/lib/vychisleniya/prep/blocks';
import { fixedSeed, generatePrep } from '@/lib/vychisleniya/prep/generate';
import { GROUPS as GROUPS8, SKILLS as SKILLS8 } from '@/lib/vychisleniya/skills';
import { names8Html } from '@/lib/vychisleniya/names';
import { tasks } from '@/content/tasks';
import { dannyeTrenazhera1 } from '@/lib/planimetriya/trenazher/dannye';
import { BLOKI as BLOKI1 } from '@/lib/planimetriya/prep/bloki';
import {
  fixedSeed as fixedSeed1,
  generateMikro as generateMikro1,
} from '@/lib/planimetriya/prep/generate';
import { dannyeTrenazhera as dannyeTrenazhera11 } from '@/lib/zadanie11/trenazher/dannye';
import { BLOKI as BLOKI11 } from '@/lib/zadanie11/prep/bloki';
import {
  fixedSeed as fixedSeed11,
  generateMikro as generateMikro11,
} from '@/lib/zadanie11/prep/generate';
import { O_ZADANII as O_ZADANII_2 } from '@/content/vektory';
import { PROTOTYPES as PROTOTYPES2 } from '@/lib/vektory/prototypes';
import { BLOKI as BLOKI2 } from '@/lib/vektory/prep/bloki';
import { fixedSeed as fixedSeed2, generateMikro } from '@/lib/vektory/prep/generate';
import { PROTOTYPES as PROTOTYPES9 } from '@/lib/proizvodnaya/prototypes';
import { GRUPPY as GRUPPY9 } from '@/lib/proizvodnaya/skills';
import { PREP_BLOCKS as BLOKI9 } from '@/lib/proizvodnaya/prep/blocks';
import { fixedSeed as fixedSeed9, generatePrepById } from '@/lib/proizvodnaya/prep/generate';
import type { RazborDz } from '../types';
import type { BlokKat, GruppaKat, KartochkaKat, KatalogRazdela, PodtemaKat } from './types';
import { zamok } from './zamok';

/** Разделы, из которых уже можно собирать ДЗ. */
export const RAZDELY_DZ = [1, 2, 6, 7, 8, 9, 10, 11] as const;

/** «Банковые» разделы: банк задач с решателем прототипа и опорные без зерна. */
const BANKOVYE: Record<
  6 | 7 | 10,
  {
    bloki: readonly BlokBanka[];
    groups: readonly { id: string; title: string }[];
    prototypes: readonly { id: string; group: string; title: string }[];
  }
> = {
  6: { bloki: BLOKI6, groups: GROUPS6, prototypes: PROTOTYPES6 },
  7: { bloki: BLOKI7, groups: GROUPS7, prototypes: PROTOTYPES7 },
  10: { bloki: BLOKI10, groups: GROUPS10, prototypes: PROTOTYPES10 },
};

function nazvanieRazdela(no: number): string {
  return tasks.find((t) => Number(t.no) === no)?.name ?? `Задание ${no}`;
}

/** Колода раздела → наборы карточек с закрытыми ответами. */
function kartochki(no: number): PodtemaKat[] | null {
  const koloda = KOLODY.find((k) => k.task === no);
  if (koloda === undefined) return null;
  const gotovaya = podgotovit(koloda, `/zadaniya/${koloda.slug}/`);
  return gotovaya.podtemy.map((t) => ({
    id: t.id,
    titleHtml: t.title,
    kartochki: gotovaya.kartochki
      .filter((k) => k.topic === t.id)
      .map((k): KartochkaKat => {
        const src = koloda.kartochki.find((s) => s.id === k.id);
        if (src?.type === 'verno') {
          return {
            ...k,
            klyuch: otpechatok.sealText(src.verno ? 'da' : 'net', k.id),
            oborot: k.zakryto,
          };
        }
        if (src?.type === 'vychislenie') {
          const norm = normalizeEge(src.otvet);
          if (norm === null)
            throw new Error(`Карточка ${k.id}: ответ «${src.otvet}» не в записи ЕГЭ`);
          return { ...k, klyuch: otpechatok.sealText(norm, k.id), oborot: k.zakryto };
        }
        return k;
      }),
  }));
}

function chislo(x: number): string {
  const norm = normalizeEge(String(Math.round(x * 1e9) / 1e9));
  if (norm === null) throw new Error(`ответ ${x} не в записи ЕГЭ`);
  return norm;
}

/** Блок опорных «как в банковых разделах» (№6, 7, 10): свои задачи без зерна. */
interface BlokBanka {
  slug: string;
  nazvanie: string;
  zapomni: string;
  zadachi: { id: string; uslovie: string; answer: number; podskazka: string; razbor: string[] }[];
}

function opornyeBanka(bloki: readonly BlokBanka[]): BlokKat[] {
  return bloki.map((b) => ({
    slug: b.slug,
    nazvanie: b.nazvanie,
    zapomniHtml: typeset(b.zapomni),
    zadachi: b.zadachi.map((z) => {
      const razbor: RazborDz = {
        shagi: z.razbor.map((line) => ({ chto: typeset(line), tex: '' })),
        delimost: [],
      };
      return {
        id: z.id,
        uslovieHtml: typeset(z.uslovie),
        podskazkaHtml: typeset(z.podskazka),
        klyuch: zamok.sealText(chislo(z.answer), z.id),
        razbor: zamok.sealText(JSON.stringify(razbor), z.id),
      };
    }),
  }));
}

/** Типы тренажёра «банкового» раздела: группы и прототипы. */
function trenazherBanka(
  groups: readonly { id: string; title: string }[],
  prototypes: readonly { id: string; group: string; title: string }[],
): GruppaKat[] {
  return groups.map((g) => ({
    id: g.id,
    nazvanie: g.title,
    tipy: prototypes
      .filter((p) => p.group === g.id)
      .map((p) => ({ id: p.id, nazvanieHtml: typeset(p.title) })),
  }));
}

function opornye8(): BlokKat[] {
  return PREP_BLOCKS.map((b) => ({
    slug: b.slug,
    nazvanie: b.nazvanie,
    zapomniHtml: b.formuly.map((f) => typeset(`$${f}$`)).join('<br>'),
    zadachi: b.zadachi.map((m) => {
      const primer = generatePrep(m.id, fixedSeed(m));
      return {
        id: m.id,
        nazvanie: m.nazvanie,
        uslovieHtml: typeset(primer.uslovie),
        podskazkaHtml: typeset(`$${m.formula}$`),
        ...(m.choices === undefined ? {} : { varianty: m.choices }),
        izZerna: true,
      };
    }),
  }));
}

/** Опорные №2: микро-задачи с зерном, в каталоге — зафиксированный вариант для предпросмотра. */
function opornye2(): BlokKat[] {
  return BLOKI2.map((b) => ({
    slug: b.slug,
    nazvanie: b.nazvanie,
    zapomniHtml: b.formuly.map((f) => typeset(`$${f}$`)).join('<br>'),
    zadachi: b.zadachi.map((m) => ({
      id: m.id,
      nazvanie: m.nazvanie,
      uslovieHtml: typeset(generateMikro(m.id, fixedSeed2(m)).uslovie),
      podskazkaHtml: typeset(`$${m.formula}$`),
      izZerna: true,
    })),
  }));
}

/** Опорные №9: микро-задачи с зерном. */
function opornye9(): BlokKat[] {
  return BLOKI9.map((b) => ({
    slug: b.slug,
    nazvanie: b.nazvanie,
    zapomniHtml: b.zapomni.map((f) => typeset(f)).join('<br>'),
    zadachi: b.zadachi.map((m) => ({
      id: m.id,
      nazvanie: m.nazvanie,
      uslovieHtml: typeset(generatePrepById(m.id, fixedSeed9(m)).uslovie),
      podskazkaHtml: '',
      izZerna: true,
    })),
  }));
}

/** Типы общего тренажёра (№1, №11): разделы и подтипы. */
function trenazherObshchiy(
  razdely: readonly {
    id: string;
    nazvanie: string;
    podtipy: readonly { id: string; title: string }[];
  }[],
): GruppaKat[] {
  return razdely.map((r) => ({
    id: r.id,
    nazvanie: r.nazvanie,
    tipy: r.podtipy.map((p) => ({ id: p.id, nazvanieHtml: typeset(p.title) })),
  }));
}

export function katalog(no: number): KatalogRazdela | null {
  if (no === 1) {
    const d = dannyeTrenazhera1();
    return {
      no,
      nazvanie: nazvanieRazdela(no),
      kartochki: kartochki(no),
      opornye: BLOKI1.map((b) => ({
        slug: b.slug,
        nazvanie: b.nazvanie,
        zapomniHtml: b.formuly.map((f) => typeset(`$${f}$`)).join('<br>'),
        zadachi: b.zadachi.map((m) => ({
          id: m.id,
          nazvanie: m.nazvanie,
          uslovieHtml: typeset(generateMikro1(m.id, fixedSeed1(m.id)).uslovie),
          podskazkaHtml: typeset(`$${m.formula}$`),
          izZerna: true,
        })),
      })),
      trenazher: trenazherObshchiy(d.razdely),
      bankTrenazhera: d.bank.map((b) => ({ ...b })),
    };
  }
  if (no === 11) {
    const d = dannyeTrenazhera11();
    return {
      no,
      nazvanie: nazvanieRazdela(no),
      kartochki: kartochki(no),
      opornye: BLOKI11.map((b) => ({
        slug: b.slug,
        nazvanie: b.nazvanie,
        zapomniHtml: b.zapomni.map((f) => typeset(f)).join('<br>'),
        zadachi: b.zadachi.map((m) => ({
          id: m.id,
          nazvanie: m.nazvanie,
          uslovieHtml: typeset(generateMikro11(m.id, fixedSeed11(m)).uslovie),
          podskazkaHtml: '',
          izZerna: true,
        })),
      })),
      trenazher: trenazherObshchiy(d.razdely),
      bankTrenazhera: d.bank.map((b) => ({ ...b })),
    };
  }
  if (no === 2) {
    return {
      no,
      nazvanie: nazvanieRazdela(no),
      kartochki: kartochki(no),
      opornye: opornye2(),
      trenazher: O_ZADANII_2.gruppy.map((g) => ({
        id: g.id,
        nazvanie: g.title,
        tipy: PROTOTYPES2.filter((p) => p.gruppa === g.id).map((p) => ({
          id: p.id,
          nazvanieHtml: typeset(p.nazvanie),
        })),
      })),
    };
  }
  if (no === 9) {
    return {
      no,
      nazvanie: nazvanieRazdela(no),
      kartochki: kartochki(no),
      opornye: opornye9(),
      trenazher: GRUPPY9.map((g) => ({
        id: g.id,
        nazvanie: g.nazvanie,
        tipy: PROTOTYPES9.filter((p) => p.gruppa === g.id).map((p) => ({
          id: p.id,
          nazvanieHtml: typeset(p.nazvanie),
        })),
      })),
    };
  }
  if (no === 6 || no === 7 || no === 10) {
    const b = BANKOVYE[no];
    return {
      no,
      nazvanie: nazvanieRazdela(no),
      kartochki: kartochki(no),
      opornye: opornyeBanka(b.bloki),
      trenazher: trenazherBanka(b.groups, b.prototypes),
    };
  }
  if (no === 8) {
    const names = names8Html();
    return {
      no,
      nazvanie: nazvanieRazdela(no),
      kartochki: kartochki(no),
      opornye: opornye8(),
      trenazher: GROUPS8.map((g) => ({
        id: g.id,
        nazvanie: g.nazvanie,
        tipy: SKILLS8.filter((s) => s.group === g.id).flatMap((s) =>
          s.prototypes.map((id) => ({ id, nazvanieHtml: names[id] ?? id })),
        ),
      })),
    };
  }
  return null;
}
