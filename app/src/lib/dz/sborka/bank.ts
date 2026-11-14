/**
 * «Банковые» разделы в ДЗ (№6, №7, №10): задачи тренажёра — из банка
 * раздела (исходные и аналоги), ответ и разбор строит решатель прототипа
 * по параметрам, как на листе учителя; опорные — свои задачи блока без
 * зерна, в ДЗ идёт сама задача. Работает в браузере репетитора при
 * выдаче. Чем разделы различаются — в конфигурации (r6, r7, r10).
 */

import type { ReactNode } from 'react';
import { typeset } from '@/lib/tex';
import type { Shag } from '@/components/tasks/steklo';
import type { VoprosPodskazki } from '@/components/tasks/trening/PodskazkaVoprosy';
import { zamok } from '../katalog/zamok';
import type { BlokKat, KatalogRazdela } from '../katalog/types';
import type { HwUnitInput, RazborDz, ShagDz, VidDz } from '../types';
import { chisloEge, peremeshat, poKrugu } from './obshchee';

/** Задача файла прототипа (без ответа). */
export interface ZadachaBankaDz {
  id: string;
  prototypeId: string;
  source: string;
  no?: number;
  text: string;
  /** Вопрос после рисунка (№6). */
  posle?: string;
  params: Record<string, unknown>;
}

interface Reshenie {
  answer: number;
  vychisleniya: readonly { tekst: string; tex?: string }[];
}

export interface KonfigBanka<S extends Reshenie, P> {
  /** Данные раздела в браузере: индекс и файлы прототипов. */
  dannye: () => Promise<{
    zagruzitIndeks(): Promise<{ id: string; p: string }[]>;
    zagruzitZadachi(prototipy: string[]): Promise<Map<string, ZadachaBankaDz>>;
  }>;
  /** Решатель прототипов (тяжёлый модуль — лениво). */
  prototip: () => Promise<(id: string) => P & { solve(params: never): S }>;
  shagi: (s: S) => Shag[];
  voprosy: (s: S) => VoprosPodskazki[];
  /** Заголовок панели «Считаем с умом» под шагами. */
  schitaem: string;
  /** Рисунок условия (№6: диаграмма, дерево, таблица; №10: мост) — React. */
  risunok?: (z: ZadachaBankaDz, p: P) => ReactNode | null;
  /** Откуда задача — для листа учителя. */
  istochnik: (z: ZadachaBankaDz) => string;
}

function escape(text: string): string {
  return text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** React → HTML (рисунки условия и шагов): в базу уходит готовая разметка. */
async function vHtml(node: ReactNode): Promise<string> {
  if (node === null || node === undefined || node === false) return '';
  const { renderToStaticMarkup } = await import('react-dom/server');
  return renderToStaticMarkup(node as React.ReactElement);
}

export function sozdatBank<S extends Reshenie, P>(k: KonfigBanka<S, P>) {
  async function razbor(s: S): Promise<RazborDz> {
    const shagi: ShagDz[] = [];
    for (const sh of k.shagi(s)) {
      const ris = sh.risunok === undefined ? '' : await vHtml(sh.risunok);
      shagi.push({
        chto: sh.chtoHtml + (ris === '' ? '' : `<div class="trn-risunok">${ris}</div>`),
        tex: sh.formulaHtml,
        ...(sh.zagolovok === undefined ? {} : { zag: sh.zagolovokHtml ?? escape(sh.zagolovok) }),
        ...(sh.ton === undefined ? {} : { ton: sh.ton }),
      });
    }
    const posle =
      s.vychisleniya.length === 0
        ? undefined
        : `<details class="trn-posle"><summary class="stk-summary">${escape(k.schitaem)}<span class="stk-shevron" aria-hidden="true"></span></summary><ul>${s.vychisleniya
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

  async function uslovie(z: ZadachaBankaDz, p: P): Promise<string> {
    const ris = k.risunok === undefined ? '' : await vHtml(k.risunok(z, p));
    return (
      typeset(z.text) +
      (ris === '' ? '' : `<div class="trn-risunok trn-risunok--shirokiy">${ris}</div>`) +
      (z.posle === undefined ? '' : `<div class="trn-uslovie--tekst">${typeset(z.posle)}</div>`)
    );
  }

  function imena(kat: KatalogRazdela): Record<string, string> {
    return Object.fromEntries(
      kat.trenazher.flatMap((g) => g.tipy.map((t) => [t.id, t.nazvanieHtml])),
    );
  }

  async function edinitsa(
    z: ZadachaBankaDz,
    names: Record<string, string>,
    studentId: string | null,
  ): Promise<HwUnitInput> {
    const proto = (await k.prototip())(z.prototypeId);
    const s = proto.solve(z.params as never);
    const view: VidDz = {
      tipHtml: names[z.prototypeId] ?? z.prototypeId,
      tekst: true,
      voprosy: k.voprosy(s),
    };
    return {
      studentId,
      kind: z.prototypeId,
      ref: z.id,
      answerKind: 'number',
      questionHtml: await uslovie(z, proto),
      view,
      answer: chisloEge(s.answer),
      razbor: await razbor(s),
      source: k.istochnik(z),
    };
  }

  /** Пример — у первой задачи каждого типа: другая задача того же прототипа. */
  async function sPrimerami(
    units: HwUnitInput[],
    vse: Map<string, ZadachaBankaDz>,
  ): Promise<HwUnitInput[]> {
    const zanyato = new Set(units.map((u) => u.ref));
    const byli = new Set<string>();
    const out: HwUnitInput[] = [];
    for (const u of units) {
      const key = `${u.studentId}:${u.kind}`;
      const z = byli.has(key)
        ? undefined
        : [...vse.values()].find((x) => x.prototypeId === u.kind && !zanyato.has(x.id));
      byli.add(key);
      if (z === undefined) {
        out.push(u);
        continue;
      }
      const proto = (await k.prototip())(z.prototypeId);
      const s = proto.solve(z.params as never);
      out.push({
        ...u,
        view: {
          ...u.view,
          primer: {
            uslovieHtml: await uslovie(z, proto),
            razbor: await razbor(s),
            otvet: chisloEge(s.answer),
          },
        },
      });
    }
    return out;
  }

  /** Правило «типы × сколько»: по кругу из банка, по зерну; у каждого свои, пока хватает. */
  async function trenazher(
    kat: KatalogRazdela,
    tipy: readonly string[],
    skolko: number,
    zerno: string,
    students: readonly (string | null)[],
  ): Promise<HwUnitInput[]> {
    const d = await k.dannye();
    const vse = await d.zagruzitZadachi([...tipy]);
    const names = imena(kat);
    const ochered = new Map(
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
        units.push(await edinitsa(q[i % q.length] as ZadachaBankaDz, names, student));
      }
    }
    return sPrimerami(units, vse);
  }

  async function poId(
    id: string,
  ): Promise<{ z: ZadachaBankaDz; vse: Map<string, ZadachaBankaDz> } | null> {
    const d = await k.dannye();
    const stroka = (await d.zagruzitIndeks()).find((z) => z.id === id);
    if (stroka === undefined) return null;
    const vse = await d.zagruzitZadachi([stroka.p]);
    const z = vse.get(id);
    return z === undefined ? null : { z, vse };
  }

  /** Конкретная задача банка. */
  async function zadacha(kat: KatalogRazdela, ref: string): Promise<HwUnitInput[]> {
    const r = await poId(ref);
    if (r === null) return [];
    return sPrimerami([await edinitsa(r.z, imena(kat), null)], r.vse);
  }

  /** Работа над ошибками: другая задача банка того же прототипа. */
  async function analogZadachi(
    kat: KatalogRazdela,
    ref: string,
    studentId: string,
    zerno: string,
    avoid: Set<string>,
  ): Promise<HwUnitInput | null> {
    const r = await poId(ref);
    if (r === null) return null;
    avoid.add(r.z.id);
    const vybor = peremeshat(
      [...r.vse.values()].filter((x) => x.prototypeId === r.z.prototypeId && !avoid.has(x.id)),
      `${zerno}:${ref}`,
    )[0];
    if (vybor === undefined) return null;
    avoid.add(vybor.id);
    return edinitsa(vybor, imena(kat), studentId);
  }

  return { trenazher, zadacha, analogZadachi };
}

/** Опорная задача блока (без зерна): ответ и разбор открыты из каталога. */
export function opornayaBanka(
  blok: BlokKat,
  id: string,
  studentId: string | null,
): HwUnitInput | null {
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
    answer: zamok.openText(z.klyuch, id),
    razbor: JSON.parse(zamok.openText(z.razbor, id)) as RazborDz,
    source: `опорная ${blok.slug} ${id}`,
  };
}

export function opornyeBanka(blok: BlokKat, zadachi: readonly string[]): HwUnitInput[] {
  return zadachi
    .map((id) => opornayaBanka(blok, id, null))
    .filter((u): u is HwUnitInput => u !== null);
}
