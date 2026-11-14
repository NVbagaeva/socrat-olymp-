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
import { BLOKI_OPORNYH } from '@/lib/zadanie7/opornye';
import { GROUPS as GROUPS7, PROTOTYPES as PROTOTYPES7 } from '@/lib/zadanie7/prototypes';
import { sealText as sealText7 } from '@/lib/zadanie7/secret';
import { PREP_BLOCKS } from '@/lib/vychisleniya/prep/blocks';
import { fixedSeed, generatePrep } from '@/lib/vychisleniya/prep/generate';
import { GROUPS as GROUPS8, SKILLS as SKILLS8 } from '@/lib/vychisleniya/skills';
import { names8Html } from '@/lib/vychisleniya/names';
import { tasks } from '@/content/tasks';
import type { RazborDz } from '../types';
import type { BlokKat, KartochkaKat, KatalogRazdela, PodtemaKat } from './types';

/** Разделы, из которых уже можно собирать ДЗ. */
export const RAZDELY_DZ = [7, 8] as const;

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
          return { ...k, klyuch: otpechatok.sealText(src.verno ? 'da' : 'net', k.id), oborot: k.zakryto };
        }
        if (src?.type === 'vychislenie') {
          const norm = normalizeEge(src.otvet);
          if (norm === null) throw new Error(`Карточка ${k.id}: ответ «${src.otvet}» не в записи ЕГЭ`);
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

function opornye7(): BlokKat[] {
  return BLOKI_OPORNYH.map((b) => ({
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
        klyuch: sealText7(chislo(z.answer), z.id),
        razbor: sealText7(JSON.stringify(razbor), z.id),
      };
    }),
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

export function katalog(no: number): KatalogRazdela | null {
  if (no === 7) {
    return {
      no,
      nazvanie: nazvanieRazdela(no),
      kartochki: kartochki(no),
      opornye: opornye7(),
      trenazher: GROUPS7.map((g) => ({
        id: g.id,
        nazvanie: g.title,
        tipy: PROTOTYPES7.filter((p) => p.group === g.id).map((p) => ({
          id: p.id,
          nazvanieHtml: typeset(p.title),
        })),
      })),
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
