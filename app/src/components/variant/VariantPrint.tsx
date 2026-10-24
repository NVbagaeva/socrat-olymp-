'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { VARIANT_SCREEN, WORK_KINDS } from '@/content/variant';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { loadMeta, payloadFromOpener, type PrintPayload } from '@/lib/variant/handoff';
import { buildSet, currentVersion, readCode, sanitizeMeta } from '@/lib/variant/session';
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
): Promise<{ payload: PrintPayload; warning: string | null } | null> {
  const fromScreen = payloadFromOpener(code);
  if (fromScreen !== null) return { payload: fromScreen, warning: null };
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
  const [spec, setSpec] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [variants, setVariants] = useState(1);
  /* Крупные рисунки (по умолчанию) плотный режим не трогает: лист
     длиннее двух страниц на вариант — цена читаемого рисунка. */
  const [figures, setFigures] = useState<'large' | 'normal'>('large');

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.sheetTheme = 'strict';
    root.dataset.sheetLayout = 'single';
    return () => {
      delete root.dataset.sheetTheme;
      delete root.dataset.sheetLayout;
      delete root.dataset.sheetFigures;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    obtain(code)
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
        });
        const html = buildDocument(built, {});
        await import('@/lib/sheet/paginate.js');
        if (alive) {
          setWarning(got.warning);
          setVariants(payload.set.variants.length);
          setFigures(payload.meta.figures);
          document.documentElement.dataset.sheetFigures = payload.meta.figures;
          setSpec(specJson(html));
        }
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [code, choice]);

  useEffect(() => {
    if (spec === null || done) return;
    /* Лист ученика — 1–2 страницы на вариант. Не уложился — набор ещё раз
       в плотном режиме (кегль и рисунки чуть мельче, variant-sheet.css).
       Наружу (печать, проверки) отчёт пагинатора выходит только
       окончательный: промежуточный набор не виден. */
    const root = document.documentElement;
    delete root.dataset.sheetDense;
    let shown: typeof window.sheetPagination;
    /* Промежуточный отчёт виден только пагинатору: он дописывает в него
       поля сразу после присваивания, синхронно; микрозадача убирает отчёт
       раньше любого таймера и кадра, и опрос печати и проверок его не застаёт. */
    let pending: typeof window.sheetPagination;
    Object.defineProperty(window, 'sheetPagination', {
      configurable: true,
      get: () => pending ?? shown,
      set: (report: typeof window.sheetPagination) => {
        if (report === undefined) {
          shown = undefined;
          return;
        }
        const tooLong =
          choice === 'uchenik' &&
          figures === 'normal' &&
          report.error === undefined &&
          (report.pages ?? 0) > 2 * variants &&
          root.dataset.sheetDense === undefined;
        if (tooLong) {
          root.dataset.sheetDense = '1';
          pending = report;
          queueMicrotask(() => {
            pending = undefined;
          });
          window.setTimeout(() => window.sheetPaginate?.(), 0);
          return;
        }
        shown = report;
      },
    });
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
  }, [spec, done, warning, choice, variants, figures]);

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
