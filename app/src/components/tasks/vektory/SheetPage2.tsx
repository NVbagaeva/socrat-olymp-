'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { REPETITORY_2 } from '@/content/vektory';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { checkKitSheet, kitFootLabel, printKitSheet } from '@/lib/komplekt';
import { keySpec2, parseSheetQuery2, sheetSpec2 } from '@/lib/vektory/sheet2';

declare global {
  interface Window {
    sheetTypeset?: (root: ParentNode) => number;
    sheetPaginate?: () => void;
    sheetPagination?: { pages?: number; error?: string } | undefined;
  }
}

export interface SheetPage2Props {
  /** Что печатать: лист ученика, лист с решениями или ключ ответов банка. */
  vid: 'uchenik' | 'uchitel' | 'klyuch';
}

function specJson(html: string): string {
  const open = html.indexOf('<script type="application/json" id="sheet-spec">');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  return html.slice(start, end);
}

/**
 * Лист для печати задания №2, собранный в браузере — тот же приём,
 * что у SheetPage8: задачи считает движок №2 по адресу, формулы
 * свёрстаны KaTeX при генерации, лист раскладывает lib/sheet.
 *
 * Листы ученика и учителя после раскладки сами открывают окно
 * печати, как у №8 и №12. Ключ ответов банка — нет: репетитор
 * сначала смотрит таблицу, а печать или сохранение в PDF запускает
 * кнопкой; та же кнопка есть и на листах, если окно печати закрыли.
 * В сам отпечаток кнопка не попадает (только @media screen).
 */
export function SheetPage2({ vid }: SheetPage2Props) {
  const query = useSearchParams();
  const params = parseSheetQuery2(query);
  const [spec, setSpec] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  /* Предупреждение комплекта перед печатью (lib/komplekt.ts). */
  const [warning, setWarning] = useState<string | null>(null);
  const withAnswers = vid !== 'uchenik';

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.sheetTheme = params.theme;
    root.dataset.sheetLayout = vid === 'klyuch' ? 'single' : params.layout;
    return () => {
      delete root.dataset.sheetTheme;
      delete root.dataset.sheetLayout;
    };
  }, [params.theme, params.layout, vid]);

  useEffect(() => {
    if (vid !== 'klyuch' && params.prototypes.length === 0) {
      return;
    }
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    const built = vid === 'klyuch' ? keySpec2(params.theme) : sheetSpec2(params, withAnswers);
    /* Код комплекта — в колонтитул; отпечаток условий — в «Мои комплекты». */
    const kit = checkKitSheet(query, '2', withAnswers ? 'teacher' : 'student', built);
    const html = buildDocument({ ...built, kit: kitFootLabel(kit.code) }, {});
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
        if (vid !== 'klyuch' && window.sheetPagination.error === undefined) {
          printKitSheet(warning);
        }
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [spec, done, vid, warning]);

  return (
    <>
      <div className="z2-print-bar" data-print-bar>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => window.print()}
          disabled={!done}
        >
          {REPETITORY_2.pechat}
        </button>
        <span className="z2-print-bar__lead">{REPETITORY_2.pechatLead}</span>
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
