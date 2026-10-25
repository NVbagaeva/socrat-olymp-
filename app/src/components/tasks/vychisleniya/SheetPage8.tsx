'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { adresListaUchenika, qrSvg } from '@/lib/generator/qr';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { sheetWithSpace, spaceOfQuery, vseWithSpace } from '@/lib/sheetSpace';
import { checkKitSheet, kitFootLabel, printKitSheet } from '@/lib/komplekt';
import { parseSheetQuery8, sheetSpec8, sheetSpecVse8 } from '@/lib/vychisleniya/sheet8';

declare global {
  interface Window {
    sheetTypeset?: (root: ParentNode) => number;
    sheetPaginate?: () => void;
    sheetPagination?: { pages?: number; error?: string } | undefined;
  }
}

export interface SheetPage8Props {
  /** Что печатать: лист ученика, лист с ответами или всё одним файлом. */
  vid: 'uchenik' | 'uchitel' | 'vse';
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
export function SheetPage8({ vid }: SheetPage8Props) {
  const withAnswers = vid !== 'uchenik';
  const query = useSearchParams();
  const params = parseSheetQuery8(query);
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
    if (params.skills.length === 0) {
      return;
    }
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    /* QR-код («Дополнительно» генератора) ведёт на лист ученика того же набора. */
    const qr =
      params.qr === true
        ? qrSvg(adresListaUchenika(window.location.href)).catch(() => undefined)
        : Promise.resolve(undefined);
    void qr.then((svg) => {
      if (!alive) return;
      const built =
        vid === 'vse' ? sheetSpecVse8(params, svg) : sheetSpec8(params, withAnswers, svg);
      /* Код комплекта — в колонтитул; отпечаток условий — в «Мои комплекты». */
      const kit = checkKitSheet(query, '8', withAnswers ? 'teacher' : 'student', built);
      /* Место для решения (sp=) — только у листа ученика. */
      const space = spaceOfQuery(query);
      const printed =
        vid === 'vse'
          ? vseWithSpace(built, space)
          : sheetWithSpace(built, space, !withAnswers, () => sheetSpec8(params, true, svg));
      const html = buildDocument({ ...printed, kit: kitFootLabel(kit.code) }, {});
      import('@/lib/sheet/paginate.js').then(() => {
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
