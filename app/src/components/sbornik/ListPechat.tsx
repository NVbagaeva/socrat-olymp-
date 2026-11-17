'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { sheetWithSpace, spaceOfQuery } from '@/lib/sheetSpace';
import { razobratZapros, sobratVarianty, specLista } from '@/lib/sbornik/list';
import { zagruzitTip } from '@/lib/sbornik/zagruzka';
import type { ZadachaHtml } from '@/lib/sbornik/types';

declare global {
  interface Window {
    sheetTypeset?: (root: ParentNode) => number;
    sheetPaginate?: () => void;
    sheetPagination?: { pages?: number; error?: string } | undefined;
  }
}

function specJson(html: string): string {
  const open = html.indexOf('<script type="application/json" id="sheet-spec">');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  return html.slice(start, end);
}

/**
 * Лист генератора сборника для печати: ученика (условия и строка
 * «Ответ») или учителя (решения по шагам и таблица ответов). Задачи
 * грузятся файлами типов, формулы уже набраны KaTeX на сборке.
 */
export function ListPechat({ glava }: { glava: number }) {
  const query = useSearchParams();
  const sOtvetami = query.get('vid') === 'uchitel';
  const [spec, setSpec] = useState<string | null>(null);
  const [oshibka, setOshibka] = useState<string | null>(null);
  const [gotovo, setGotovo] = useState(false);
  const p = razobratZapros(glava, query);

  useEffect(() => {
    if (p === null) return;
    const root = document.documentElement;
    root.dataset.sheetTheme = p.tema;
    root.dataset.sheetLayout = 'single';
    return () => {
      delete root.dataset.sheetTheme;
      delete root.dataset.sheetLayout;
    };
  }, [p?.tema]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (p === null) return;
    let alive = true;
    window.sheetTypeset = (node) => upgrade(node, katex);
    Promise.all(p.tipy.map((t) => zagruzitTip(t.tip).then((list) => [t.tip, list] as const)))
      .then((pary) => {
        if (!alive) return;
        const poTipam = new Map<string, readonly ZadachaHtml[]>(pary);
        const varianty = sobratVarianty(p, poTipam);
        const built = specLista(p, varianty, sOtvetami);
        const space = spaceOfQuery(query);
        const printed = sheetWithSpace(built, space, !sOtvetami, () => specLista(p, varianty, true));
        const html = buildDocument(printed, {});
        return import('@/lib/sheet/paginate.js').then(() => {
          if (alive) setSpec(specJson(html));
        });
      })
      .catch(() => alive && setOshibka('Не удалось загрузить задачи. Обновите страницу.'));
    return () => {
      alive = false;
    };
  }, [query.toString()]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (spec === null || gotovo) return;
    window.sheetPagination = undefined;
    window.sheetPaginate?.();
    const timer = window.setInterval(() => {
      if (window.sheetPagination !== undefined) {
        window.clearInterval(timer);
        setGotovo(true);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [spec, gotovo]);

  if (p === null) return <p className="sb-list-oshibka">В адресе листа нет задач. Соберите лист в генераторе.</p>;
  if (oshibka !== null) return <p className="sb-list-oshibka">{oshibka}</p>;
  return (
    <>
      <div id="sheet-measure" />
      <div id="sheet-pages" />
      {spec === null ? null : (
        <script id="sheet-spec" type="application/json" dangerouslySetInnerHTML={{ __html: spec }} />
      )}
    </>
  );
}
