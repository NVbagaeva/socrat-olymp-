'use client';

import { useEffect, useState } from 'react';
import { PrintSheet } from '@/components/tasks/generator/PrintSheet';
import { GENERATOR10_TEXTS } from '@/content/generator10';
import { adresListaUchenika, qrSvg } from '@/lib/generator/qr';
import { checkKitSheet, kitFootLabel } from '@/lib/komplekt';
import { useAdres } from '@/lib/zadanie10/adres';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { listSheetVse, sShapkoy } from '@/lib/sheetList';
import { sheetWithSpace, spaceOfQuery, vseWithSpace } from '@/lib/sheetSpace';
import { zagruzitIndeks, zagruzitZadachi, type ZadachaLite } from '@/lib/zadanie10/dannye';
import {
  modelUroka,
  parseUrokQuery,
  parseZapros,
  parseZaprosKlyuchi,
  sobratList,
  sobratListKlyuchi,
  type ModelLista,
} from '@/lib/zadanie10/sborka';
import { sheetSpec10, type Vid10 } from '@/lib/zadanie10/sheet10';
import type { Prototype } from '@/lib/zadanie10/types';
import type { IllInfo } from './Zadacha10';

interface Gotovo {
  model: ModelLista;
  zadachi: Map<string, ZadachaLite>;
  proto: (id: string) => Prototype;
  kartinki: boolean;
  kit: { code: string | null; warning: string | null };
}

/**
 * Печатный лист №10 — генератора (по запросу в адресе) и урока (m=u) —
 * на общем шаблоне листов (lib/sheet, sheet10.ts): страницы A4, шапка,
 * место для решения (sp=). Адрес общего генератора (ps=2) открывают
 * /pechat/, /pechat/otvety/ и /pechat/vse/ — вид листа задаёт страница
 * (vid); у прежнего адреса генератора (m=g) и урока вид — в l=uchenik|
 * uchitel. Иллюстрации — у урока, по k=1 прежнего адреса или по
 * «Картинкам сюжетов» (fl=1).
 */
export function List10({
  ill,
  vid: vidStranicy,
}: {
  ill: Record<string, IllInfo>;
  vid?: Vid10 | 'vse';
}) {
  const adres = useAdres();
  const vid: Vid10 | 'vse' =
    vidStranicy ?? (new URLSearchParams(adres).get('l') === 'uchitel' ? 'uchitel' : 'uchenik');
  const [gotovo, setGotovo] = useState<Gotovo | null>(null);
  const [oshibka, setOshibka] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    void (async () => {
      try {
        const indeks = await zagruzitIndeks();
        let model: ModelLista | null = null;
        const zk = parseZaprosKlyuchi(q);
        if (zk !== null) {
          model = sobratListKlyuchi(zk, indeks);
        } else if (q.get('m') === 'u') {
          const u = parseUrokQuery(q);
          if (u) {
            model = modelUroka(u.kod, u.no, u.n, indeks);
          }
        } else {
          const z = parseZapros(q);
          if (z) {
            model = sobratList(z, indeks);
          }
        }
        if (model === null) {
          setOshibka('Неверная ссылка на лист.');
          return;
        }
        /* У адреса ps=2 «k» — вид работы, картинки — в модели (fl). */
        const kartinki = model.kartinki || (zk === null && q.get('k') === '1');
        const ids = model.bloki.flatMap((b) => [...b.spiski.flat(), ...(b.primery ?? [])]);
        const protoIds = [...new Set(indeks.filter((x) => ids.includes(x.id)).map((x) => x.p))];
        const [zadachi, mod] = await Promise.all([
          zagruzitZadachi(protoIds),
          import('@/lib/zadanie10/prototypes'),
        ]);
        /* Отпечаток листа для комплекта: условия, у учителя — и ответы. */
        const tasks = ids.flatMap((id) => {
          const z = zadachi.get(id);
          return z
            ? [
                {
                  questionHtml: `${z.text} ${JSON.stringify(z.params)}`,
                  ...(vid === 'uchenik'
                    ? {}
                    : { answer: String(mod.prototype(z.prototypeId).solve(z.params).answer) }),
                },
              ]
            : [];
        });
        const kit = checkKitSheet(q, '10', vid === 'uchenik' ? 'student' : 'teacher', {
          blocks: [{ tasks }],
        });
        setGotovo({ model, zadachi, proto: mod.prototype, kartinki, kit });
      } catch (e) {
        setOshibka((e as Error).message);
      }
    })();
  }, [vid]);

  if (oshibka) {
    return <p role="alert">{oshibka}</p>;
  }
  if (gotovo === null) {
    return <p>Собираем лист…</p>;
  }
  const { model, zadachi, proto, kartinki, kit } = gotovo;
  return (
    <PrintSheet
      theme="color"
      layout="single"
      buildKey={`${vid}:${adres}`}
      build={async () => {
        const sborka = { model, zadachi, proto, ill, kartinki };
        const shapka = model.shapka;
        /* QR-код («Дополнительно» генератора) ведёт на лист ученика того же набора. */
        const qr =
          shapka?.qr === true
            ? await qrSvg(adresListaUchenika(window.location.href)).catch(() => undefined)
            : undefined;
        const list = (v: Vid10) =>
          sShapkoy(sheetSpec10(sborka, v), shapka, GENERATOR10_TEXTS.podzagolovok, qr);
        const kod = kitFootLabel(kit.code) ?? `Код: ${model.kod}`;
        const space = spaceOfQuery(new URLSearchParams(adres));
        /* Место для решения (sp=) — только у листа ученика. */
        const spec =
          vid === 'vse'
            ? vseWithSpace(listSheetVse(list('uchenik'), list('uchitel')), space)
            : sheetWithSpace(list(vid), space, vid === 'uchenik', () =>
                sheetSpec10(sborka, 'uchitel'),
              );
        return { html: buildDocument({ ...spec, kit: kod }, {}), warning: kit.warning };
      }}
    />
  );
}
