'use client';

import { useEffect, useState } from 'react';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { printKitSheet } from '@/lib/komplekt';

declare global {
  interface Window {
    sheetTypeset?: (root: ParentNode) => number;
    sheetPaginate?: () => void;
    sheetPagination?: { pages?: number; error?: string } | undefined;
  }
}

export interface BuiltSheet {
  /** Документ шаблона lib/sheet/ (buildDocument). */
  html: string;
  /** Предупреждение перед печатью; null — печатать молча. */
  warning: string | null;
}

export interface PrintSheetProps {
  /**
   * Собрать лист. null — собирать нечего (адрес без параметров).
   * Promise — когда листу нужно дождаться чего-то (QR-код генератора).
   */
  build: () => BuiltSheet | null | Promise<BuiltSheet | null>;
  /** Ключ сборки: сменился — лист собирается заново. */
  buildKey: string;
  theme: 'color' | 'print';
  layout: 'single' | 'double';
}

/** Спецификация набора из готового документа шаблона. */
function specJson(html: string): string {
  const open = html.indexOf('<script type="application/json" id="sheet-spec">');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  return html.slice(start, end);
}

/**
 * Лист для печати, собранный в браузере: общий ход для листов
 * генераторов и зачётной работы.
 *
 * Тот же шаблон, что печатает сборник в CI: buildDocument собирает
 * куски листа, paginate.js раскладывает их по страницам A4 после
 * загрузки шрифтов, формулы набирает KaTeX. Готовый лист сразу уходит
 * в печать браузера: «Сохранить как PDF» — и файл на диске.
 */
export function PrintSheet({ build, buildKey, theme, layout }: PrintSheetProps) {
  const [spec, setSpec] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  /* Тема и раскладка — атрибуты на <html>: так их читает theme.css. */
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.sheetTheme = theme;
    root.dataset.sheetLayout = layout;
    return () => {
      delete root.dataset.sheetTheme;
      delete root.dataset.sheetLayout;
    };
  }, [theme, layout]);

  /* Сборка, затем модуль набора страниц. Спецификация кладётся в
     документ только после загрузки модуля, иначе он запустился бы сам,
     до готовности. */
  useEffect(() => {
    window.sheetTypeset = (root) => upgrade(root, katex);
    let alive = true;
    void Promise.resolve(build()).then((built) => {
      if (built === null || !alive) {
        return;
      }
      import('@/lib/sheet/paginate.js').then(() => {
        if (alive) {
          setWarning(built.warning);
          setSpec(specJson(built.html));
        }
      });
    });
    return () => {
      alive = false;
    };
    /* Лист собирается по ключу: параметры приходят из адреса. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildKey]);

  /* Спецификация в документе — запускаем набор и ждём отчёт. */
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
        <script id="sheet-spec" type="application/json" dangerouslySetInnerHTML={{ __html: spec }} />
      )}
    </>
  );
}
