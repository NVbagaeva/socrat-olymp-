'use client';

import { useEffect, useState } from 'react';
import { PrintSheet } from '@/components/tasks/generator/PrintSheet';
import { GENERATOR7_TEXTS } from '@/content/generator7';
import { GENERATOR_7 } from '@/content/zadanie7';
import { adresListaUchenika, qrSvg } from '@/lib/generator/qr';
import { checkKitSheet, kitFootLabel } from '@/lib/komplekt';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { listSheetVse, sShapkoy } from '@/lib/sheetList';
import { sheetWithSpace, spaceOfQuery } from '@/lib/sheetSpace';
import { zagruzitIndeks, zagruzitZadachi, type ZadachaLite } from '@/lib/zadanie7/dannye';
import {
  modelUroka,
  parseUrokQuery,
  parseZapros,
  parseZaprosKlyuchi,
  sobratList,
  sobratListKlyuchi,
  type ModelLista,
} from '@/lib/zadanie7/sborka';
import { sheetSpec7, type Sborka7, type Vid7 } from '@/lib/zadanie7/sheet7';

const T = GENERATOR_7;

export type { Vid7 };

interface Gotovo {
  sborka: Sborka7;
  kit: { code: string | null; warning: string | null };
  query: string;
}

/**
 * Печатный лист №7 — генератора (по запросу в адресе) и урока
 * (?kod=…&u=…) — на общем шаблоне листов (lib/sheet, sheet7.ts):
 * страницы A4, шапка, место для решения (sp=). Лист ученика — условия и
 * строка ответа; лист учителя — те же задачи с ответами и разбором по
 * шагам, этапы «ОДЗ» и «Отбор корней» выделены. Оба собираются из
 * одного запроса, поэтому задачи совпадают. Решения строит решатель
 * прототипа в браузере: данные без ответов.
 */
export function List7({ vid }: { vid: Vid7 | 'vse' }) {
  const [gotovo, setGotovo] = useState<Gotovo | null>(null);
  const [oshibka, setOshibka] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    void (async () => {
      try {
        const indeks = await zagruzitIndeks();
        let model: ModelLista | null = null;
        const u = parseUrokQuery(q);
        const zk = parseZaprosKlyuchi(q);
        if (u) {
          model = modelUroka(u.kod, u.no, u.n, indeks);
        } else if (zk) {
          /* Адрес общего генератора (ps=2): задачи по ключам позиций. */
          model = sobratListKlyuchi(zk, indeks);
        } else {
          const z = parseZapros(q);
          if (z) {
            model = sobratList(z, indeks);
          }
        }
        if (model === null) {
          setOshibka(T.plohayaSsylka);
          return;
        }
        const ids = model.bloki.flatMap((b) => [...b.spiski.flat(), ...(b.primery ?? [])]);
        const protoIds = [...new Set(indeks.filter((x) => ids.includes(x.id)).map((x) => x.p))];
        const [zadachi, mod] = await Promise.all([
          zagruzitZadachi(protoIds),
          import('@/lib/zadanie7/prototypes'),
        ]);
        const reshit = (z: ZadachaLite) => mod.prototype(z.prototypeId).solve(z.params);
        /* Отпечаток листа для комплекта: условия, у учителя — и ответы. */
        const tasks = ids.flatMap((id) => {
          const z = zadachi.get(id);
          return z
            ? [
                {
                  questionHtml: z.text,
                  ...(vid === 'uchenik' ? {} : { answer: String(reshit(z).answer) }),
                },
              ]
            : [];
        });
        const kit = checkKitSheet(q, '7', vid === 'uchenik' ? 'student' : 'teacher', {
          blocks: [{ tasks }],
        });
        setGotovo({ sborka: { model, zadachi, reshit }, kit, query: q.toString() });
      } catch (e) {
        setOshibka((e as Error).message);
      }
    })();
  }, [vid]);

  if (oshibka) {
    return <p role="alert">{oshibka}</p>;
  }
  if (gotovo === null) {
    return <p>{T.sobiraem}</p>;
  }
  const { sborka, kit, query } = gotovo;
  return (
    <PrintSheet
      theme="color"
      layout="single"
      buildKey={`${vid}:${query}`}
      build={async () => {
        const shapka = sborka.model.shapka;
        /* QR-код («Дополнительно» генератора) ведёт на лист ученика того же набора. */
        const qr =
          shapka?.qr === true
            ? await qrSvg(adresListaUchenika(window.location.href)).catch(() => undefined)
            : undefined;
        const list = (v: Vid7) =>
          sShapkoy(sheetSpec7(sborka, v), shapka, GENERATOR7_TEXTS.podzagolovok, qr);
        const kod = kitFootLabel(kit.code) ?? `Код: ${sborka.model.kod}`;
        if (vid === 'vse') {
          const spec = listSheetVse(list('uchenik'), list('uchitel'));
          return { html: buildDocument({ ...spec, kit: kod }, {}), warning: kit.warning };
        }
        /* Место для решения (sp=) — только у листа ученика. */
        const spec = sheetWithSpace(
          list(vid),
          spaceOfQuery(new URLSearchParams(query)),
          vid === 'uchenik',
          () => sheetSpec7(sborka, 'uchitel'),
        );
        return { html: buildDocument({ ...spec, kit: kod }, {}), warning: kit.warning };
      }}
    />
  );
}
