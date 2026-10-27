'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PECHAT_13 } from '@/content/generator13';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { checkKitSheet, kitFootLabel, printKitSheet } from '@/lib/komplekt';
import { qrSvg } from '@/lib/generator/qr';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { sheetWithSpace, spaceOfQuery } from '@/lib/sheetSpace';
import { sobratList13 } from '@/lib/zadanie13/gen/list';
import { onlaynHref13, parseGenQuery13, sQr13, vsegoZadach13 } from '@/lib/zadanie13/gen/params';
import { sheetSpec13, type VidPechati13 } from '@/lib/zadanie13/gen/sheet';

function specJson(html: string): string {
  const open = html.indexOf('<script type="application/json" id="sheet-spec">');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  return html.slice(start, end);
}

/**
 * Лист для печати задания №13, собранный в браузере — как у №11:
 * задачи считает движок №13 по адресу, формулы свёрстаны KaTeX, лист
 * раскладывает lib/sheet, затем открывается окно печати. На листе
 * ученика у названия QR-код онлайн-версии того же набора: ученик
 * решает и проверяет ответы, ответов в адресе нет.
 */
export function SheetPage13({ vid }: { vid: VidPechati13 }) {
  const query = useSearchParams();
  const params = parseGenQuery13(query);
  const [spec, setSpec] = useState<string | null>(null);
  const [done, setDone] = useState(false);
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
    if (vsegoZadach13(params) === 0) {
      return;
    }
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    /* QR — у названия листа ученика, ведёт в онлайн-набор. */
    const qr = !sQr13(params, vid)
      ? Promise.resolve(undefined)
      : qrSvg(new URL(onlaynHref13(params), window.location.origin).toString()).catch(
          () => undefined,
        );
    void qr.then((svg) => {
      if (!alive) return;
      const built = sheetSpec13(params, sobratList13(params), vid, svg);
      const kit = checkKitSheet(query, '13', vid === 'uchenik' ? 'student' : 'teacher', built);
      /* Место для решения (sp=) — только у листа ученика. */
      const printed = sheetWithSpace(built, spaceOfQuery(query), vid === 'uchenik', () =>
        sheetSpec13(params, sobratList13(params), 'uchitel'),
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
      <div className="z13-print-bar" data-print-bar>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => window.print()}
          disabled={!done}
        >
          {PECHAT_13.knopka}
        </button>
        <span className="z13-print-bar__lead">{PECHAT_13.lead}</span>
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
