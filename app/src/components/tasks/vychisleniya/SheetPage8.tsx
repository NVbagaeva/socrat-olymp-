'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { parseSheetQuery8, sheetSpec8 } from '@/lib/vychisleniya/sheet8';

declare global {
  interface Window {
    sheetTypeset?: (root: ParentNode) => number;
    sheetPaginate?: () => void;
    sheetPagination?: { pages?: number; error?: string } | undefined;
  }
}

export interface SheetPage8Props {
  withAnswers: boolean;
}

function specJson(html: string): string {
  const open = html.indexOf('<script type="application/json" id="sheet-spec">');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  return html.slice(start, end);
}

/**
 * Лист для печати задания №8, собранный в браузере — тот же приём,
 * что у SheetPage.tsx задания №12, свой компонент: источник задач
 * другой (движок №8), а формулы условий и разбора уже свёрстаны
 * KaTeX в момент генерации, upgrade() здесь подчищает то немногое,
 * что могло остаться неразобранным (декоративные метки шаблона).
 */
export function SheetPage8({ withAnswers }: SheetPage8Props) {
  const query = useSearchParams();
  const params = parseSheetQuery8(query);
  const [spec, setSpec] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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
    if (params.skills.length === 0) {
      return;
    }
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    const html = buildDocument(sheetSpec8(params, withAnswers), {});
    import('@/lib/sheet/paginate.js').then(() => {
      if (alive) {
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
          window.print();
        }
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [spec, done]);

  return (
    <>
      <div id="sheet-measure" />
      <div id="sheet-pages" />
      {spec === null ? null : <script id="sheet-spec" type="application/json" dangerouslySetInnerHTML={{ __html: spec }} />}
    </>
  );
}
