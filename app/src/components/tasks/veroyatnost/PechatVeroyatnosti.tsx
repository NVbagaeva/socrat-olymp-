'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ListSlova } from '@/content/veroyatnost';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { buildDocument } from '@/lib/sheet/sheet.js';
import type { Pool } from '@/lib/veroyatnost/pool';
import { parseSheet4Query, sheet4Spec } from '@/lib/veroyatnost/sheet4';

declare global {
  interface Window {
    sheetTypeset?: (root: ParentNode) => number;
    sheetPaginate?: () => void;
    sheetPagination?: { pages?: number; error?: string } | undefined;
  }
}

export interface PechatVeroyatnostiProps {
  /** Банк задания: условия, отпечатки, закрытые разборы. */
  pool: Pool;
  /** Слова листа этого задания: название, колонтитул, разделы ответов. */
  list: ListSlova;
  /** Лист с ответами: те же задачи и таблица «Ответы» в конце. */
  withAnswers: boolean;
}

/** Спецификация набора из готового документа шаблона. */
function specJson(html: string): string {
  const open = html.indexOf('<script type="application/json" id="sheet-spec">');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  return html.slice(start, end);
}

/**
 * Лист заданий №4 и №5, собранный в браузере.
 *
 * Устройство то же, что у листа задания №12: buildDocument собирает
 * куски листа, paginate.js раскладывает их по страницам A4 после
 * загрузки шрифтов, формулы кратких решений набирает KaTeX, готовый
 * лист сразу отправляется в печать. Адрес страницы можно открыть
 * повторно — лист будет тем же. Одна страница на оба задания: разница
 * только в банке и в словах листа.
 */
export function PechatVeroyatnosti({ pool, list, withAnswers }: PechatVeroyatnostiProps) {
  const query = useSearchParams();
  const params = parseSheet4Query(query);
  const [spec, setSpec] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /* Тема и раскладка — атрибуты на <html>: так их читает theme.css. */
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.sheetTheme = params.theme;
    root.dataset.sheetLayout = params.layout;
    return () => {
      delete root.dataset.sheetTheme;
      delete root.dataset.sheetLayout;
    };
  }, [params.theme, params.layout]);

  /* Сборка: куски листа, затем модуль набора страниц. Спецификация
     кладётся в документ только после загрузки модуля, иначе он
     запустился бы сам, до готовности. */
  useEffect(() => {
    if (params.skills.length === 0) {
      return;
    }
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    const html = buildDocument(sheet4Spec(pool, params, withAnswers, list), {});
    import('@/lib/sheet/paginate.js').then(() => {
      if (alive) {
        setSpec(specJson(html));
      }
    });
    return () => {
      alive = false;
    };
    /* Параметры приходят из адреса и за жизнь страницы не меняются. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withAnswers, query.toString()]);

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
