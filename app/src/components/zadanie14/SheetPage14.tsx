'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SHEET_14 } from '@/content/generator14';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { checkKitSheet, kitFootLabel, printKitSheet } from '@/lib/komplekt';
import { pechatat } from '@/lib/sheet/pechat';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { sheetWithSpace, spaceOfQuery } from '@/lib/sheetSpace';
import { parseQuery14 } from '@/lib/zadanie14/generator14';
import { sheetSpec14, type VidPechati14 } from '@/lib/zadanie14/sheet14';

function specJson(html: string): string {
  const open = html.indexOf('<script type="application/json" id="sheet-spec">');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  return html.slice(start, end);
}

/**
 * Лист печати №14, собранный в браузере по адресу набора — как у №13:
 * задачи считает тот же код, что предпросмотр генератора, формулы и
 * подписи окружностей набраны KaTeX, лист раскладывает lib/sheet.
 * Место для решения (клетка или линейка) — только у листа ученика.
 */
export function SheetPage14({ vid }: { vid: VidPechati14 }) {
  const query = useSearchParams();
  const [spec, setSpec] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.sheetTheme = 'color';
    root.dataset.sheetLayout = 'single';
    return () => {
      delete root.dataset.sheetTheme;
      delete root.dataset.sheetLayout;
    };
  }, []);

  useEffect(() => {
    const p = parseQuery14(query);
    if (p === null) return;
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    const built = sheetSpec14(p, vid);
    const kit = checkKitSheet(query, '14', vid === 'uchenik' ? 'student' : 'teacher', built);
    const printed = sheetWithSpace(built, spaceOfQuery(query), vid === 'uchenik', () =>
      sheetSpec14(p, 'uchitel'),
    );
    const html = buildDocument({ ...printed, kit: kitFootLabel(kit.code) }, {});
    void import('@/lib/sheet/paginate.js').then(() => {
      if (alive) {
        setWarning(kit.warning);
        setSpec(specJson(html));
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vid, query.toString()]);

  useEffect(() => {
    if (spec === null || done) return;
    window.sheetPagination = undefined;
    window.sheetPaginate?.();
    const timer = window.setInterval(() => {
      if (window.sheetPagination !== undefined) {
        window.clearInterval(timer);
        setDone(true);
        if (window.sheetPagination.error === undefined) printKitSheet(warning);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [spec, done, warning]);

  return (
    <>
      <div className="z14-print-bar" data-print-bar>
        <button type="button" className="btn btn--primary" onClick={() => void pechatat()} disabled={!done}>
          {SHEET_14.pechat}
        </button>
        <span className="z14-print-bar__lead">{SHEET_14.pechatLead}</span>
      </div>
      <div id="sheet-measure" />
      <div id="sheet-pages" />
      {spec === null ? null : (
        <script id="sheet-spec" type="application/json" dangerouslySetInnerHTML={{ __html: spec }} />
      )}
    </>
  );
}
