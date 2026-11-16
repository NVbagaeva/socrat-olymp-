'use client';

import { useEffect, useState } from 'react';
import { PrintSheet } from '@/components/tasks/generator/PrintSheet';
import { GENERATOR_BAZY as T } from '@/content/baza/generator';
import { modelListaBazy, parseZaprosBazy, prototipyLista } from '@/lib/baza/generatorBazy';
import { dannyeBrauzera } from '@/lib/baza/predprosmotrBazy';
import { sheetSpecBazy, type SborkaBazy } from '@/lib/baza/sheetBazy';
import { adresListaUchenika, qrSvg } from '@/lib/generator/qr';
import type { GenConfig } from '@/lib/generator/obshchiy/types';
import { checkKitSheet, kitFootLabel } from '@/lib/komplekt';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { listSheetVse, sShapkoy, type ListVid } from '@/lib/sheetList';
import { sheetWithSpace, spaceOfQuery, vseWithSpace } from '@/lib/sheetSpace';

interface Gotovo {
  sborka: SborkaBazy;
  kit: { code: string | null; warning: string | null };
  query: string;
}

/**
 * Печатный лист генератора базы по адресу набора (ps=2) на общем
 * шаблоне листов (lib/sheet, lib/baza/sheetBazy.ts): страницы A4, шапка,
 * место для решения (sp=). Лист ученика, лист учителя и «всё одним
 * файлом» собираются из одного адреса, поэтому задачи совпадают. Ответы
 * и разбор считает решатель прототипа в браузере: в данных их нет.
 */
export function ListBazy({ config, vid }: { config: GenConfig; vid: ListVid | 'vse' }) {
  const [gotovo, setGotovo] = useState<Gotovo | null>(null);
  const [oshibka, setOshibka] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    void (async () => {
      try {
        const z = parseZaprosBazy(q, config);
        if (z === null) {
          setOshibka(T.plohayaSsylka);
          return;
        }
        const model = modelListaBazy(z, config);
        const dannye = await dannyeBrauzera(config.id)(prototipyLista(model));
        /* Отпечаток листа для комплекта: условия, у учителя — и ответы. */
        const ids = model.bloki.flatMap((b) => [...b.spiski.flat(), ...(b.primery ?? [])]);
        const tasks = ids.flatMap((id) => {
          const x = dannye.zadacha(id);
          return x === undefined
            ? []
            : [
                {
                  questionHtml: x.text,
                  ...(vid === 'uchenik' ? {} : { answer: dannye.reshit(x).otvet }),
                },
              ];
        });
        const kit = checkKitSheet(q, config.scope, vid === 'uchenik' ? 'student' : 'teacher', {
          blocks: [{ tasks }],
        });
        setGotovo({ sborka: { config, model, dannye }, kit, query: q.toString() });
      } catch (e) {
        setOshibka((e as Error).message);
      }
    })();
  }, [config, vid]);

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
        const qr = shapka.qr
          ? await qrSvg(adresListaUchenika(window.location.href)).catch(() => undefined)
          : undefined;
        const list = (v: ListVid) => sShapkoy(sheetSpecBazy(sborka, v), shapka, T.podzagolovok, qr);
        const kod = kitFootLabel(kit.code) ?? `Код: ${sborka.model.kod}`;
        const space = spaceOfQuery(new URLSearchParams(query));
        if (vid === 'vse') {
          /* Место для решения (sp=) — у листа ученика в начале файла. */
          const spec = vseWithSpace(listSheetVse(list('uchenik'), list('uchitel')), space);
          return { html: buildDocument({ ...spec, kit: kod }, {}), warning: kit.warning };
        }
        /* Место для решения (sp=) — только у листа ученика. */
        const spec = sheetWithSpace(list(vid), space, vid === 'uchenik', () =>
          sheetSpecBazy(sborka, 'uchitel'),
        );
        return { html: buildDocument({ ...spec, kit: kod }, {}), warning: kit.warning };
      }}
    />
  );
}
