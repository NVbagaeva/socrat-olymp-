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
import katex from 'katex';
import '@/lib/graph/katex-makrosy.js';
import { texPlain, typesetText } from '@/lib/tex';
import { BANK_4, BANK_5 } from '@/lib/veroyatnost/index';
import { BLOKI_4, BLOKI_5 } from '@/lib/veroyatnost/blocks';
import { prep4Pool, prep5Pool, type PrepPoolBlok } from '@/lib/veroyatnost/pool';
import { otkrytRazbor, type PodskazkaShag } from '@/lib/veroyatnost/razbor';
import { openText as openText45 } from '@/lib/veroyatnost/secret';
import { RAZDELY as RAZDELY3 } from '@/lib/zadanie3';
import { BLOKI_3, zadachiBloka } from '@/lib/stereo/opornye3/bloki';
import { SHAGI as SHAGI3 } from '@/lib/stereo/opornye3/seal';
import type { ZadachaOp3 } from '@/lib/stereo/opornye3/tipy';
import { renderPloskiy } from '@/lib/stereo/ploskiy';
import { renderSolid } from '@/lib/solid/render';
import { BLOKI3_NAZVANIYA } from '@/content/zadanie3/navyki';
import { otvetVeroyatnosti, razborVeroyatnosti } from '../sborka/r4-5';
import { prepSubtopicParams } from '@/content/sections';
import { buildPrepTasks, findPrepSkill, prepSkillIds } from '@/lib/prep';
import { trenazherConfig12, zadachi12 } from '@/lib/ves12/trenazher12';
import { functionTypes } from '@/data/functionTypes';
import type { TrenazherConfig } from '@/lib/trenazher/types';
import type { Shablon12 } from '../sborka/r12';
import { prototypes as PROTOTYPES13 } from '@/lib/zadanie13/generate';
import { trenazherConfig13 } from '@/lib/zadanie13/trenazher/filtry13';
import { BLOKI_13, zadachiBloka as zadachiBloka13 } from '@/lib/zadanie13/opornye/bloki';
import { sealZadacha13 } from '@/lib/zadanie13/opornye/seal';
import { PROTOTYPE_BY_ID as PROTO13 } from '@/lib/zadanie13/proto';
import { GRUPPY as GRUPPY9 } from '@/lib/proizvodnaya/skills';
import { PREP_BLOCKS as BLOKI9 } from '@/lib/proizvodnaya/prep/blocks';
import { fixedSeed as fixedSeed9, generatePrepById } from '@/lib/proizvodnaya/prep/generate';
import type { RazborDz, VoprosDz } from '../types';
import type {
  BlokKat,
  GruppaKat,
  KartochkaKat,
  KatalogRazdela,
  PodtemaKat,
  ResheniyaKatalog,
} from './types';
import { zamok } from './zamok';

/** Разделы, из которых уже можно собирать ДЗ. */
export const RAZDELY_DZ = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

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

/* ── №4 и №5: опорные — задачи конспекта, тренажёр — прототипы банка ── */

/** Опорные №4/№5: условие с чертежом или картинкой, ответ, разбор и подсказка закрыты. */
function opornye45(bloki: readonly PrepPoolBlok[]): BlokKat[] {
  return bloki.map((b) => ({
    slug: b.id,
    nazvanie: b.nazvanie,
    zapomniHtml: typesetText(b.tip),
    zadachi: b.zadachi.map((z) => {
      const r = otkrytRazbor(z.steps, z.seal);
      const kartinka = z.illustration ?? z.model?.illustration;
      const podskazka =
        z.podskazka === undefined
          ? undefined
          : (JSON.parse(openText45(z.podskazka, z.seal)) as PodskazkaShag[]);
      const voprosy: VoprosDz[] | undefined = podskazka?.map((h) => ({
        voprosHtml: h.question,
        variantyHtml: h.options,
        verno: h.correct,
        ...(h.comment === null ? {} : { kommentariyHtml: h.comment }),
      }));
      return {
        id: z.id,
        uslovieHtml:
          `<p>${z.uslovie}</p>` +
          (z.risunok === undefined ? '' : `<div class="trn-risunok">${z.risunok}</div>`) +
          (kartinka === undefined
            ? ''
            : `<div class="trn-risunok rdz-kartinka"><img src="${kartinka.path}" alt="${kartinka.alt.replace(/"/g, '&quot;')}" loading="lazy" decoding="async"></div>`),
        podskazkaHtml: '',
        klyuch: zamok.sealText(otvetVeroyatnosti(r.otvet), z.id),
        razbor: zamok.sealText(
          JSON.stringify(
            razborVeroyatnosti({
              metod: r.metod,
              shagi: r.shagi.map((s) => ({
                etap: s.etap,
                text: s.text,
                ...(s.tex === undefined ? {} : { tex: s.tex }),
              })),
            }),
          ),
          z.id,
        ),
        ...(voprosy === undefined
          ? {}
          : { voprosy: zamok.sealText(JSON.stringify(voprosy), z.id) }),
      };
    }),
  }));
}

/** Типы тренажёра №4/№5: блоки задачника и прототипы. */
function trenazher45(
  bloki: readonly { id: string; nazvanie: string }[],
  bank: readonly { id: string; blok: string; nazvanie: string }[],
): GruppaKat[] {
  return bloki
    .map((b) => ({
      id: b.id,
      nazvanie: b.nazvanie,
      tipy: bank
        .filter((p) => p.blok === b.id)
        .map((p) => ({ id: p.id, nazvanieHtml: typesetText(p.nazvanie) })),
    }))
    .filter((g) => g.tipy.length > 0);
}

/* ── №3: опорные блоков, тренажёр — разделы задачника ────────────── */

function formula3(tex: string): string {
  return katex.renderToString(tex, { throwOnError: false, displayMode: true });
}

/** Варианты и ответ опорной №3: число — как есть; выбор, касание, плоский чертёж — номером. */
function otvet3(z: ZadachaOp3): { klyuch: string; varianty?: { number: string; label: string }[] } {
  const nomera = (labels: readonly string[]) =>
    labels.map((label, i) => ({ number: String(i + 1), label }));
  if (z.vid === 'vybor' && z.varianty !== undefined) {
    return {
      klyuch: String(Number(z.otvet) + 1),
      varianty: nomera(z.varianty.map((v) => typeset(v))),
    };
  }
  if (z.vid === 'ploskiy' && z.ploskie !== undefined) {
    return {
      klyuch: String(Number(z.otvet) + 1),
      varianty: nomera(
        z.ploskie.map((p) => `<span class="rdz-ploskiy">${renderPloskiy(p, 'ekran')}</span>`),
      ),
    };
  }
  if (z.vid === 'nazhmi' && z.celi !== undefined) {
    const i = z.celi.findIndex((c) => c.id === z.otvet);
    if (i < 0) throw new Error(`опорная ${z.id}: цели ${z.otvet} нет`);
    return { klyuch: String(i + 1), varianty: nomera(z.celi.map((c) => typeset(c.label))) };
  }
  return { klyuch: chislo(Number(z.otvet.replace(',', '.'))) };
}

function opornye3(): BlokKat[] {
  return BLOKI_3.filter((b) => b.gotov).map((b) => ({
    slug: b.slug,
    nazvanie: BLOKI3_NAZVANIYA[b.slug] ?? b.nazvanie,
    zapomniHtml: '',
    zadachi: zadachiBloka(b.id).map((z) => {
      const o = otvet3(z);
      const razbor: RazborDz = {
        shagi: z.uchenik.map((s) => ({
          zag: SHAGI3[s.n - 1] ?? '',
          chto: typeset(s.chto),
          tex: s.formula === undefined ? '' : formula3(s.formula),
        })),
        delimost: [],
      };
      const voprosy: VoprosDz[] = z.podskazka.map((s) => ({
        voprosHtml: typeset(s.vopros),
        variantyHtml: s.varianty.map((v) => typeset(v)),
        verno: s.verno,
        kommentariyHtml: typeset(s.vyvod),
      }));
      return {
        id: z.id,
        nazvanie: typeset(z.kratko),
        uslovieHtml:
          typeset(z.uslovie) +
          `<div class="trn-risunok rdz-ch3">${renderSolid(z.model, { tema: 'ekran' })}</div>`,
        podskazkaHtml: '',
        ...(o.varianty === undefined ? {} : { varianty: o.varianty }),
        klyuch: zamok.sealText(o.klyuch, z.id),
        razbor: zamok.sealText(JSON.stringify(razbor), z.id),
        ...(voprosy.length === 0 ? {} : { voprosy: zamok.sealText(JSON.stringify(voprosy), z.id) }),
      };
    }),
  }));
}

function trenazher3(): GruppaKat[] {
  return RAZDELY3.map((r) => ({
    id: r.nomer,
    nazvanie: `${r.nomer}. ${r.nazvanie}`,
    tipy: r.prototipy.map((p) => ({ id: p.id, nazvanieHtml: typeset(p.nazvanie) })),
  }));
}

/* ── №12 и №13: типы тренажёра — из конфигурации общего тренажёра ── */

function gruppyTrenazhera(c: TrenazherConfig): GruppaKat[] {
  return c.temy
    .map((t) => ({
      id: t.id,
      nazvanie: t.title,
      tipy: t.podtipy.map((p) => ({ id: p.id, nazvanieHtml: p.titleHtml ?? typeset(p.title) })),
    }))
    .filter((g) => g.tipy.length > 0);
}

/**
 * Опорные №12: навыки подтем — блоки «подтема/навык». Задачи движка
 * без зерна, id постоянные (данные graph/). В каталоге — только условие
 * для просмотра, без чертежа: с чертежами задач и шагов разбора это
 * десятки мегабайт. Задачу с чертежом, ответом и разбором собирает при
 * выдаче тот же движок в браузере (sborka/r12.ts).
 */
function opornye12(): BlokKat[] {
  return prepSubtopicParams().flatMap(({ type }) => {
    const podtema = functionTypes.find((t) => t.id === type)?.title ?? type;
    return prepSkillIds(type).flatMap((skillId) => {
      const skill = findPrepSkill(type, skillId);
      if (skill === undefined) return [];
      return [
        {
          slug: `${type}/${skillId}`,
          nazvanie: `${podtema}: ${texPlain(skill.title)}`,
          zapomniHtml: skill.tip === '' ? '' : typeset(skill.tip),
          zadachi: buildPrepTasks(skill).map((t) => ({
            id: t.id,
            uslovieHtml: t.questionHtml,
            podskazkaHtml: '',
          })),
        },
      ];
    });
  });
}

/** Опорные №13: блоки по постоянным id задач; предпросмотр — задача состава, при выдаче — аналог. */
function opornye13(): BlokKat[] {
  return BLOKI_13.map((b) => ({
    slug: b.slug,
    nazvanie: b.nazvanie,
    zapomniHtml: b.zapomni.map((z) => typeset(z)).join('<br>'),
    zadachi: zadachiBloka13(b).map((z) => {
      const s = sealZadacha13(z.prototypeId, z.seed, b.vid, z.no);
      return {
        id: z.id,
        nazvanie: typeset(PROTO13[z.prototypeId]?.title ?? z.prototypeId),
        uslovieHtml: s.uslovieHtml + (s.tablitsaHtml ?? ''),
        podskazkaHtml: '',
        ...(s.vybory === null ? {} : { varianty: s.vybory }),
        izZerna: true,
      };
    }),
  }));
}

function sobratKatalog(no: number): KatalogRazdela | null {
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
  if (no === 3) {
    return {
      no,
      nazvanie: nazvanieRazdela(no),
      kartochki: kartochki(no),
      opornye: opornye3(),
      trenazher: trenazher3(),
    };
  }
  if (no === 12) {
    return {
      no,
      nazvanie: nazvanieRazdela(no),
      kartochki: kartochki(no),
      opornye: opornye12(),
      trenazher: gruppyTrenazhera(trenazherConfig12()),
      bankTrenazhera: zadachi12().map((r): Shablon12 => ({ k: r.key, p: r.podtip })),
    };
  }
  if (no === 13) {
    return {
      no,
      nazvanie: nazvanieRazdela(no),
      kartochki: kartochki(no),
      opornye: opornye13(),
      trenazher: gruppyTrenazhera(trenazherConfig13(PROTOTYPES13(), typeset)),
    };
  }
  if (no === 4 || no === 5) {
    return {
      no,
      nazvanie: nazvanieRazdela(no),
      kartochki: kartochki(no),
      opornye: opornye45(no === 4 ? prep4Pool() : prep5Pool()),
      trenazher: no === 4 ? trenazher45(BLOKI_4, BANK_4) : trenazher45(BLOKI_5, BANK_5),
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

/* Каталог считается один раз на процесс: маршрут отдаёт из него два файла. */
const KESH = new Map<number, KatalogRazdela | null>();

export function katalog(no: number): KatalogRazdela | null {
  if (!KESH.has(no)) KESH.set(no, sobratKatalog(no));
  return KESH.get(no) ?? null;
}

/**
 * Каталог для просмотра (zNN.json): без ответов, разборов и подсказок
 * опорных — они нужны только при выдаче и лежат отдельным файлом
 * (zNN-r.json, resheniyaKatalog): с набранными формулами это бо́льшая
 * часть веса (у №3 — мегабайты).
 */
export function katalogLegkiy(no: number): KatalogRazdela | null {
  const k = katalog(no);
  if (k === null) return null;
  return {
    ...k,
    opornye: k.opornye.map((b) => ({
      ...b,
      zadachi: b.zadachi.map(({ klyuch: _k, razbor: _r, voprosy: _v, ...z }) => z),
    })),
  };
}

/** Закрытые ответы, разборы и подсказки опорных: id задачи → поля каталога. */
export function resheniyaKatalog(no: number): ResheniyaKatalog | null {
  const k = katalog(no);
  if (k === null) return null;
  const out: ResheniyaKatalog = {};
  for (const b of k.opornye) {
    for (const z of b.zadachi) {
      if (z.klyuch === undefined && z.razbor === undefined && z.voprosy === undefined) continue;
      out[`${b.slug}:${z.id}`] = {
        ...(z.klyuch === undefined ? {} : { klyuch: z.klyuch }),
        ...(z.razbor === undefined ? {} : { razbor: z.razbor }),
        ...(z.voprosy === undefined ? {} : { voprosy: z.voprosy }),
      };
    }
  }
  return out;
}
