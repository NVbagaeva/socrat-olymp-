'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PECHAT_11 } from '@/content/repetitory11';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { parseSheetQuery11, sheetSpec11, sobratList, type VidLista } from '@/lib/zadanie11/sheet11';
import type { UslovieBanka } from '@/lib/zadanie11/trenazher/sessiya';

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
 * Лист для печати задания №11, собранный в браузере — тот же приём,
 * что у SheetPage2: задачи считает движок №11 по адресу, формулы
 * свёрстаны KaTeX, лист раскладывает lib/sheet. После раскладки
 * открывается окно печати: «Сохранить как PDF». Условия банка
 * приходят со страницы без ответов.
 */
export function SheetPage11({ vid, bank }: { vid: VidLista; bank: UslovieBanka[] }) {
  const query = useSearchParams();
  const params = parseSheetQuery11(query);
  const [spec, setSpec] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.sheetTheme = params.theme;
    root.dataset.sheetLayout = 'single';
    return () => {
      delete root.dataset.sheetTheme;
      delete root.dataset.sheetLayout;
    };
  }, [params.theme]);

  useEffect(() => {
    if (params.rezhim !== 'marshrut' && params.sostav.length === 0) {
      return;
    }
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    const html = buildDocument(sheetSpec11(params, sobratList(params, bank), vid), {});
    import('@/lib/sheet/paginate.js').then(() => {
      if (alive) {
        setSpec(specJson(html));
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vid, query.toString()]);

  useEffect(() => {
    if (spec === null || done) {
      return;
    }
    window.sheetPagination = undefined;
    window.sheetPaginate?.();
    const timer = window.setInterval(() => {
      if (window.sheetPagination !== undefined) {
        window.clearInterval(timer);
        setDone(true);
        if (window.sheetPagination.error === undefined) {
          window.print();
        }
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [spec, done]);

  return (
    <>
      <div className="z11-print-bar" data-print-bar>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => window.print()}
          disabled={!done}
        >
          {PECHAT_11.knopka}
        </button>
        <span className="z11-print-bar__lead">{PECHAT_11.lead}</span>
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
