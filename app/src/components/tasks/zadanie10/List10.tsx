'use client';

import { useEffect, useState } from 'react';
import { PrintSheet } from '@/components/tasks/generator/PrintSheet';
import { useAdres } from '@/lib/zadanie10/adres';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { sheetWithSpace, spaceOfQuery } from '@/lib/sheetSpace';
import { zagruzitIndeks, zagruzitZadachi, type ZadachaLite } from '@/lib/zadanie10/dannye';
import {
  modelUroka,
  parseUrokQuery,
  parseZapros,
  sobratList,
  type ModelLista,
} from '@/lib/zadanie10/sborka';
import { sheetSpec10, type Vid10 } from '@/lib/zadanie10/sheet10';
import type { Prototype } from '@/lib/zadanie10/types';
import type { IllInfo } from './Zadacha10';

interface Gotovo {
  model: ModelLista;
  zadachi: Map<string, ZadachaLite>;
  proto: (id: string) => Prototype;
}

/**
 * Печатный лист №10 — генератора (по запросу в адресе) и урока (m=u) —
 * на общем шаблоне листов (lib/sheet, sheet10.ts): страницы A4, шапка,
 * место для решения (sp=). Вид листа — параметр l (uchenik / uchitel),
 * иллюстрации — у урока или по k=1.
 */
export function List10({ ill }: { ill: Record<string, IllInfo> }) {
  const adres = useAdres();
  const vid: Vid10 = new URLSearchParams(adres).get('l') === 'uchitel' ? 'uchitel' : 'uchenik';
  const [gotovo, setGotovo] = useState<Gotovo | null>(null);
  const [oshibka, setOshibka] = useState<string | null>(null);
  const [kartinki, setKartinki] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    void (async () => {
      try {
        const indeks = await zagruzitIndeks();
        let model: ModelLista | null = null;
        if (q.get('m') === 'u') {
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
        setKartinki(model.kartinki || q.get('k') === '1');
        const ids = model.bloki.flatMap((b) => [...b.spiski.flat(), ...(b.primery ?? [])]);
        const protoIds = [...new Set(indeks.filter((x) => ids.includes(x.id)).map((x) => x.p))];
        const [zadachi, mod] = await Promise.all([
          zagruzitZadachi(protoIds),
          import('@/lib/zadanie10/prototypes'),
        ]);
        setGotovo({ model, zadachi, proto: mod.prototype });
      } catch (e) {
        setOshibka((e as Error).message);
      }
    })();
  }, []);

  if (oshibka) {
    return <p role="alert">{oshibka}</p>;
  }
  if (gotovo === null) {
    return <p>Собираем лист…</p>;
  }
  const { model, zadachi, proto } = gotovo;
  return (
    <PrintSheet
      theme="color"
      layout="single"
      buildKey={`${vid}:${adres}`}
      build={() => {
        const sborka = { model, zadachi, proto, ill, kartinki };
        /* Место для решения (sp=) — только у листа ученика. */
        const spec = sheetWithSpace(
          sheetSpec10(sborka, vid),
          spaceOfQuery(new URLSearchParams(adres)),
          vid === 'uchenik',
          () => sheetSpec10(sborka, 'uchitel'),
        );
        return { html: buildDocument({ ...spec, kit: `Код: ${model.kod}` }, {}), warning: null };
      }}
    />
  );
}
