'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PECHAT_GEN_18 } from '@/content/generator18';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { adresListaUchenika, qrSvg } from '@/lib/generator/qr';
import { checkKitSheet, kitFootLabel, printKitSheet } from '@/lib/komplekt';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { sheetWithSpace, spaceOfQuery, vseWithSpace } from '@/lib/sheetSpace';
import {
  parseSheetQuery18,
  sheetSpec18,
  sobratList18,
  type VidLista,
} from '@/lib/zadanie18/gen/list18';
import type { Zadacha18 } from '@/lib/zadanie18/trenazher/bank';
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
 * Лист общего генератора №18 для печати — тот же приём, что у №3
 * (SheetPageGen3): задачи — по адресу из банка, собранного на сервере
 * страницы (ответы закрыты, лист учителя их открывает), чертёж — сцена
 * движка схем по числам варианта, лист раскладывает lib/sheet. После
 * раскладки открывается окно печати: «Сохранить как PDF».
 */
export function SheetPageGen18({ vid, bank }: { vid: VidLista; bank: Zadacha18[] }) {
  const query = useSearchParams();
  const est = (id: string) => bank.some((z) => z.tip === id);
  const params = parseSheetQuery18(query, est);
  const [spec, setSpec] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [oshibka, setOshibka] = useState(false);
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
    if (params.sostav.length === 0) return;
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    /* QR-код («Дополнительно») ведёт на лист ученика того же набора. */
    const qr = params.dop.qr
      ? qrSvg(adresListaUchenika(window.location.href)).catch(() => undefined)
      : Promise.resolve(undefined);
    void qr
      .then((svg) => {
        if (!alive) return;
        const list = sobratList18(params, bank);
        const built = sheetSpec18(params, list, vid, svg);
        /* Код комплекта — в колонтитул; отпечаток условий — в «Мои комплекты». */
        const kit = checkKitSheet(query, '18', vid === 'uchenik' ? 'student' : 'teacher', built);
        /* Место для решения (sp=) — только у листа ученика. */
        const space = spaceOfQuery(query);
        const printed =
          vid === 'vse'
            ? vseWithSpace(built, space)
            : sheetWithSpace(built, space, vid === 'uchenik', () =>
                sheetSpec18(params, list, 'uchitel', svg),
              );
        const html = buildDocument({ ...printed, kit: kitFootLabel(kit.code) }, {});
        return import('@/lib/sheet/paginate.js').then(() => {
          if (alive) {
            setWarning(kit.warning);
            setSpec(specJson(html));
          }
        });
      })
      .catch(() => {
        if (alive) setOshibka(true);
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
      <div className="z18-print-bar" data-print-bar>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void pechatat()}
          disabled={!done}
        >
          {PECHAT_GEN_18.knopka}
        </button>
        <span className="z18-print-bar__lead" role="status">
          {oshibka ? PECHAT_GEN_18.oshibka : done ? PECHAT_GEN_18.lead : PECHAT_GEN_18.zagruzka}
        </span>
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
