'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { checkKitSheet, kitFootLabel, printKitSheet } from '@/lib/komplekt';
import { parseSheetQuery9, printSpec9, sheetSpec9 } from '@/lib/proizvodnaya/sheet9';

declare global {
  interface Window {
    sheetTypeset?: (root: ParentNode) => number;
    sheetPaginate?: () => void;
    sheetPagination?: { pages?: number; error?: string } | undefined;
  }
}

export interface SheetPage9Props {
  /** true — лист учителя: разбор по этапам, рисунок построений, таблица ответов. */
  withAnswers: boolean;
}

function specJson(html: string): string {
  const open = html.indexOf('<script type="application/json" id="sheet-spec">');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  return html.slice(start, end);
}

/**
 * Лист для печати задания №9, собранный в браузере — тот же приём,
 * что у SheetPage8: задачи и рисунки считает движок №9 по адресу,
 * формулы — заглушки `math`, которые KaTeX набирает перед раскладкой
 * по страницам (window.sheetTypeset), лист раскладывает lib/sheet.
 */
export function SheetPage9({ withAnswers }: SheetPage9Props) {
  const query = useSearchParams();
  const params = parseSheetQuery9(query);
  const [spec, setSpec] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  /* Предупреждение комплекта перед печатью (lib/komplekt.ts). */
  const [warning, setWarning] = useState<string | null>(null);

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
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    const built = sheetSpec9(params, withAnswers);
    /* Код комплекта — в колонтитул; отпечаток условий — в «Мои комплекты». */
    const kit = checkKitSheet(query, '9', withAnswers ? 'teacher' : 'student', built);
    const html = buildDocument({ ...printSpec9(built), kit: kitFootLabel(kit.code) }, {});
    import('@/lib/sheet/paginate.js').then(() => {
      if (alive) {
        setWarning(kit.warning);
        setSpec(specJson(html));
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withAnswers, query.toString()]);

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
          printKitSheet(warning);
        }
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [spec, done, warning]);

  return (
    <>
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
