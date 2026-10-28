'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PECHAT_1 } from '@/content/repetitory1';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { adresListaUchenika, qrSvg } from '@/lib/generator/qr';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { sheetWithSpace, spaceOfQuery, vseWithSpace } from '@/lib/sheetSpace';
import { checkKitSheet, kitFootLabel, printKitSheet } from '@/lib/komplekt';
import { parseSheetQuery1, sheetSpec1, sobratList, type VidLista } from '@/lib/planimetriya/sheet1';
import type { UslovieBanka } from '@/lib/planimetriya/trenazher/sessiya';
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

/**
 * Лист для печати задания №1, собранный в браузере — тот же приём,
 * что у SheetPage11: задачи и чертежи считает движок №1 по адресу,
 * формулы свёрстаны KaTeX, лист раскладывает lib/sheet. После
 * раскладки открывается окно печати: «Сохранить как PDF». Числа
 * задач банка приходят со страницы без ответов.
 */
export function SheetPage1({ vid, bank }: { vid: VidLista; bank: UslovieBanka[] }) {
  const query = useSearchParams();
  const params = parseSheetQuery1(query);
  const [spec, setSpec] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  /* Предупреждение комплекта перед печатью (lib/komplekt.ts). */
  const [warning, setWarning] = useState<string | null>(null);

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
    if (params.rezhim !== 'urok' && params.sostav.length === 0) {
      return;
    }
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    /* QR-код («Дополнительно») ведёт на лист ученика того же набора. */
    const qr =
      params.dop?.qr === true
        ? qrSvg(adresListaUchenika(window.location.href)).catch(() => undefined)
        : Promise.resolve(undefined);
    void qr.then((svg) => {
      if (!alive) return;
      const built = sheetSpec1(params, sobratList(params, bank), vid, svg);
      /* Код комплекта — в колонтитул; отпечаток условий — в «Мои комплекты». */
      const kit = checkKitSheet(query, '1', vid === 'uchenik' ? 'student' : 'teacher', built);
      /* Место для решения (sp=) — только у листа ученика. */
      const space = spaceOfQuery(query);
      const printed =
        vid === 'vse'
          ? vseWithSpace(built, space)
          : sheetWithSpace(built, space, vid === 'uchenik', () =>
              sheetSpec1(params, sobratList(params, bank), 'uchitel', svg),
            );
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
      <div className="z1-print-bar" data-print-bar>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void pechatat()}
          disabled={!done}
        >
          {PECHAT_1.knopka}
        </button>
        <span className="z1-print-bar__lead">{PECHAT_1.lead}</span>
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
