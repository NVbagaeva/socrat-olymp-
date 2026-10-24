'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PECHAT_13 } from '@/content/generator13';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { kitCode, kitFootLabel, parseKitCode } from '@/lib/komplekt';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { kartochkiSpec13 } from '@/lib/zadanie13/gen/kartochki';

function specJson(html: string): string {
  const open = html.indexOf('<script type="application/json" id="sheet-spec">');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  return html.slice(start, end);
}

/**
 * Карточки «Определи тип» для печати: двадцать карточек по seed серии
 * (?seed=…&kit=…), формулы — KaTeX, раскладка — lib/sheet, затем окно
 * печати. Код серии печатается в подвале, как у листов уроков.
 */
export function KartochkiPage13() {
  const query = useSearchParams();
  const seed = query.get('seed') ?? 'kartochki';
  const theme = query.get('t') === 'print' ? 'print' : 'color';
  const teacher = (query.get('tc') ?? '').slice(0, 60);
  const [spec, setSpec] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.sheetTheme = theme;
    root.dataset.sheetLayout = 'single';
    return () => {
      delete root.dataset.sheetTheme;
      delete root.dataset.sheetLayout;
    };
  }, [theme]);

  useEffect(() => {
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    const parsed = parseKitCode(query.get('kit') ?? '');
    const kit = parsed === null ? null : kitFootLabel(kitCode(parsed.id, parsed.version));
    const html = buildDocument({ ...kartochkiSpec13(seed, theme, teacher), kit }, {});
    import('@/lib/sheet/paginate.js').then(() => {
      if (alive) setSpec(specJson(html));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.toString()]);

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
