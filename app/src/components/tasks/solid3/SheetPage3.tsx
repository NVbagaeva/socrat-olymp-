'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SHEET_3 } from '@/content/sheet3';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { sheetWithSpace, spaceOfQuery } from '@/lib/sheetSpace';
import type { ZadachaPechati } from '@/lib/zadanie3/pechat-dannye';
import { type Vid, parametryIz, specLista } from '@/lib/zadanie3/pechat';
import { pechatat } from '@/lib/sheet/pechat';

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

export interface SheetPage3Props {
  vid: Vid;
  razdel: string;
  zadachi: ZadachaPechati[];
}

/**
 * Лист задания №3 для печати — тот же приём, что у SheetPage2: набор
 * задач по адресу, лист раскладывает lib/sheet. Чертежи — статичный
 * SVG из сценариев (lib/chertezh3); у ученика без вспомогательных
 * построений, у учителя — с ними, плюс решения и ответы.
 */
export function SheetPage3({ vid, razdel, zadachi }: SheetPage3Props) {
  const query = useSearchParams();
  const params = parametryIz(query);
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
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    const tex = (t: string) => katex.renderToString(t, { throwOnError: false });
    /* Место для решения (sp=) — только у листа ученика. */
    const built = sheetWithSpace(
      specLista(zadachi, razdel, params, vid, tex),
      spaceOfQuery(query),
      vid === 'uchenik',
      () => specLista(zadachi, razdel, params, 'uchitel', tex),
    );
    const html = buildDocument(built, {});
    import('@/lib/sheet/paginate.js').then(() => {
      if (alive) setSpec(specJson(html));
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
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [spec, done]);

  return (
    <>
      <div className="z3-print-bar" data-print-bar>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void pechatat()}
          disabled={!done}
        >
          {SHEET_3.pechat}
        </button>
        <span className="z3-print-bar__lead">{SHEET_3.pechatLead}</span>
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
