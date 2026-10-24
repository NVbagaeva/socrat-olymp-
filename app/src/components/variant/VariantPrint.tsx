'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { VARIANT_SCREEN, WORK_KINDS } from '@/content/variant';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { POV_TITLE, POV_VERSION_LABEL } from '@/content/povyshennye';
import { povNomer, versiyaText } from '@/lib/povyshennye/kod';
import { loadMeta, payloadFromOpener, type PrintPayload } from '@/lib/variant/handoff';
import {
  buildSet,
  currentVersion,
  defaultMeta,
  readCode,
  sanitizeMeta,
} from '@/lib/variant/session';
import { variantSheetSpec, workTitle, type SheetChoice } from '@/lib/variant/sheets';

const CHOICES: readonly SheetChoice[] = ['uchenik', 'uchitel', 'razbor', 'vse'];

function specJson(html: string): string {
  const open = html.indexOf('<script type="application/json" id="sheet-spec">');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  return html.slice(start, end);
}

/** Набор: с экрана, открывшего вкладку; иначе — заново по коду. */
async function obtain(
  code: string,
  versiya: number | null,
): Promise<{
  payload: PrintPayload;
  warning: string | null;
  variantLabel?: (index: number) => string;
} | null> {
  const fromScreen = payloadFromOpener(code);
  if (fromScreen !== null) return { payload: fromScreen, warning: null };
  /* Варианты повышенной сложности: набор версий раздела, шапка — своя. */
  const pv = povNomer(code);
  if (pv !== null) {
    const { povSet } = await import('@/lib/povyshennye/set');
    const full = await povSet(pv);
    if (full === null) return null;
    /* Одна версия — её лист; без номера — все шесть подряд. */
    const set =
      versiya === null
        ? full
        : { ...full, variants: full.variants.filter((v) => v.index === versiya) };
    if (set.variants.length === 0) return null;
    const meta = { ...defaultMeta(), kind: 'custom', customTitle: POV_TITLE, duration: '' };
    return {
      payload: { set, meta, workTitle: POV_TITLE },
      warning: null,
      variantLabel: (i: number) => POV_VERSION_LABEL(versiyaText(pv, i)),
    };
  }
  const d = readCode(code);
  if (d === null) return null;
  const { set } = await buildSet(d.config, d.seed, d.zameny);
  const meta = sanitizeMeta(loadMeta());
  const now = currentVersion();
  return {
    payload: { set, meta, workTitle: workTitle(meta, WORK_KINDS) },
    warning: d.version === now ? null : VARIANT_SCREEN.codeOld(d.version, now),
  };
}

/**
 * Лист варианта для печати. Тот же шаблон, что у листов разделов:
 * buildDocument раскладывает куски, paginate.js — страницы A4 после
 * загрузки шрифтов, формулы набирает KaTeX. Готовый лист сразу уходит
 * в печать браузера: «Сохранить как PDF» — и файл на диске.
 */
export function VariantPrint() {
  const query = useSearchParams();
  const raw = query.get('list');
  const choice: SheetChoice = CHOICES.includes(raw as SheetChoice)
    ? (raw as SheetChoice)
    : 'uchenik';
  const code = query.get('kod') ?? '';
  const vRaw = Number(query.get('v'));
  const versiya = Number.isInteger(vRaw) && vRaw >= 1 ? vRaw : null;
  const [spec, setSpec] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  /* Варианты повышенной сложности: лист строгий, чертежи — цветные. */
  const chertezhiColor = povNomer(code) !== null;
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.sheetTheme = 'strict';
    root.dataset.sheetLayout = 'single';
    if (chertezhiColor) root.dataset.sheetChertezhi = 'color';
    return () => {
      delete root.dataset.sheetTheme;
      delete root.dataset.sheetLayout;
      delete root.dataset.sheetChertezhi;
    };
  }, [chertezhiColor]);

  useEffect(() => {
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    obtain(code, versiya)
      .then(async (got) => {
        if (!alive) return;
        if (got === null) {
          setFailed(true);
          return;
        }
        const { payload } = got;
        const built = variantSheetSpec(payload.set, payload.meta, choice, {
          workTitle: payload.workTitle,
          showCode: true,
          ...(got.variantLabel === undefined ? {} : { variantLabel: got.variantLabel }),
        });
        const html = buildDocument(built, {});
        await import('@/lib/sheet/paginate.js');
        if (alive) {
          setWarning(got.warning);
          setSpec(specJson(html));
        }
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [code, choice, versiya]);

  useEffect(() => {
    if (spec === null || done) return;
    window.sheetPagination = undefined;
    window.sheetPaginate?.();
    const timer = window.setInterval(() => {
      if (window.sheetPagination !== undefined) {
        window.clearInterval(timer);
        setDone(true);
        if (window.sheetPagination.error === undefined && warning === null) {
          window.print();
        }
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [spec, done, warning]);

  return (
    <>
      <div className="var-print-bar" data-print-bar>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => window.print()}
          disabled={!done}
        >
          {VARIANT_SCREEN.print}
        </button>
        <span className="var-print-bar__lead">
          {failed ? VARIANT_SCREEN.codeBad : (warning ?? VARIANT_SCREEN.downloadsNote)}
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
