'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SHEET_21 } from '@/content/sheet21';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { adresListaUchenika, qrSvg } from '@/lib/generator/qr';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { checkKitSheet, kitFootLabel, printKitSheet } from '@/lib/komplekt';
import { pechatat } from '@/lib/sheet/pechat';
import { sheetWithSpace, spaceOfQuery, vseWithSpace } from '@/lib/sheetSpace';
import { parseSheetQuery21, sheetSpec21, sheetSpecVse21 } from '@/lib/zadanie21/sheet21';

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
 * Лист для печати, собранный в браузере — тот же приём, что у №2:
 * задачи считает движок по адресу, формулы свёрстаны KaTeX, лист
 * раскладывает lib/sheet. После раскладки сам открывает окно печати.
 */
export function SheetPage21({ vid }: { vid: 'uchenik' | 'uchitel' | 'vse' }) {
  const query = useSearchParams();
  const params = parseSheetQuery21(query);
  const [spec, setSpec] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const withAnswers = vid !== 'uchenik';

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.sheetTheme = params.theme;
    root.dataset.sheetLayout = params.layout;
    return () => {
      delete root.dataset.sheetTheme;
      delete root.dataset.sheetLayout;
    };
  }, [params.theme, params.layout]);

  useEffect(() => {
    if (params.sostav.length === 0) return;
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    const qr =
      params.qr === true
        ? qrSvg(adresListaUchenika(window.location.href)).catch(() => undefined)
        : Promise.resolve(undefined);
    void qr.then((svg) => {
      if (!alive) return;
      const sobrat = () =>
        vid === 'vse' ? sheetSpecVse21(params, svg) : sheetSpec21(params, withAnswers, svg);
      const built = sobrat();
      const kit = checkKitSheet(query, '21', withAnswers ? 'teacher' : 'student', built);
      const space = spaceOfQuery(query);
      const printed =
        vid === 'vse'
          ? vseWithSpace(built, space)
          : sheetWithSpace(built, space, !withAnswers, () => sheetSpec21(params, true, svg));
      const html = buildDocument({ ...printed, kit: kitFootLabel(kit.code) }, {});
      void import('@/lib/sheet/paginate.js').then(() => {
        if (alive) {
          setWarning(kit.warning);
          setSpec(specJson(html));
        }
      });
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
      <div className="z21-print-bar" data-print-bar>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void pechatat()}
          disabled={!done}
        >
          {SHEET_21.pechat}
        </button>
        <span className="z21-print-bar__lead">{SHEET_21.pechatLead}</span>
      </div>
      <div id="sheet-measure" />
      <div id="sheet-pages" />
      {spec === null ? null : (
        <script
          id="sheet-spec"
          type="application/json"
          dangerouslySetInnerHTML={{ __html: spec }}
        />
      )}
    </>
  );
}
