'use client';

/**
 * /kabinet/domashka/pechat/?id=…&list=uchenik|uchitel[&kletka=1][&uchenik=…] —
 * лист ученика или лист учителя домашнего задания.
 *
 * Задачи берутся из базы готовыми (lib/dz/print.ts): оба листа — из тех
 * же строк, ничего не генерируется заново. Лист собирается так же, как
 * листы №8 (SheetPage8): описание → buildDocument → набор страниц
 * paginate.js → окно печати, как только страницы готовы. Печатает только
 * репетитор, выдавший задание: ключи (ответы и решения) база отдаёт ему
 * одному.
 */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { EmptyState } from '@/components/ui';
import { dzError } from '@/content/dz';
import { DZ_PECHAT as T } from '@/content/dzPechat';
import { useSessionUser } from '@/lib/auth/session';
import type { HwFull } from '@/lib/dz/api';
import { DZ_HREF, homeworkHref, printHref } from '@/lib/dz/links';
import { printGroups, printSpec, readPrintQuery, withStudent } from '@/lib/dz/print';
import { sanitizeHtml } from '@/lib/dz/sanitize';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { pechatat } from '@/lib/sheet/pechat';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { NeedLogin, dzApi, errorCode } from './common';

declare global {
  interface Window {
    sheetTypeset?: (root: ParentNode) => number;
    sheetPaginate?: () => void;
    sheetPagination?: { pages?: number; error?: string } | undefined;
  }
}

type Loaded =
  | { kind: 'loading'; id: string }
  | { kind: 'missing'; id: string }
  | { kind: 'error'; id: string; message: string }
  | { kind: 'ok'; id: string; full: HwFull };

/** Описание листа из документа buildDocument — то, что читает paginate.js. */
function specJson(html: string): string {
  const open = html.indexOf('<script type="application/json" id="sheet-spec">');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  return html.slice(start, end);
}

/** Сообщение вместо листа: без оболочки сайта, как и сам лист. */
function Message({ children }: { children: ReactNode }) {
  return <main className="dz-print-message">{children}</main>;
}

function toKabinet() {
  return (
    <Link className="btn btn--secondary" href={DZ_HREF.kabinet}>
      {T.toKabinet}
    </Link>
  );
}

export function HomeworkPrintScreen() {
  const user = useSessionUser();
  const query = useSearchParams();
  const { id, list, grid, studentId, theme } = readPrintQuery(query);
  const tutorId = user?.role === 'tutor' ? user.id : null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  /* paginate.js загружен — можно класть описание и набирать страницы. */
  const [paginator, setPaginator] = useState(false);
  /* Описание, для которого страницы уже набраны. */
  const [done, setDone] = useState<string | null>(null);

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
    if (tutorId === null || id === '') return;
    let alive = true;
    void (async () => {
      try {
        const full = await (await dzApi()).loadHomework(id);
        if (!alive) return;
        /* Чужое ДЗ (ученика или другого репетитора) — без ключей: не печатаем. */
        setLoaded(
          full === null || full.hw.tutorId !== tutorId
            ? { kind: 'missing', id }
            : { kind: 'ok', id, full },
        );
      } catch (e) {
        if (alive) setLoaded({ kind: 'error', id, message: dzError(errorCode(e)) });
      }
    })();
    return () => {
      alive = false;
    };
  }, [tutorId, id]);

  const state: Loaded = loaded !== null && loaded.id === id ? loaded : { kind: 'loading', id };
  const full = state.kind === 'ok' ? state.full : null;

  const spec = useMemo(
    () =>
      full === null
        ? null
        : printSpec(full, { list, grid, studentId, theme, sanitize: sanitizeHtml }),
    [full, list, grid, studentId, theme],
  );
  const json = useMemo(() => (spec === null ? null : specJson(buildDocument(spec, {}))), [spec]);

  /* Ученики индивидуального ДЗ — для печати одного варианта. */
  const students = useMemo(
    () =>
      full === null
        ? []
        : printGroups(full).flatMap((group) => (group.student === null ? [] : [group.student])),
    [full],
  );

  useEffect(() => {
    if (json === null || paginator) return;
    let alive = true;
    void import('@/lib/sheet/paginate.js').then(() => {
      if (alive) setPaginator(true);
    });
    return () => {
      alive = false;
    };
  }, [json, paginator]);

  useEffect(() => {
    if (json === null || !paginator || done === json) return;
    window.sheetTypeset = (root) => upgrade(root, katex);
    window.sheetPagination = undefined;
    window.sheetPaginate?.();
    const timer = window.setInterval(() => {
      if (window.sheetPagination !== undefined) {
        window.clearInterval(timer);
        setDone(json);
        /* Как у листов №8: окно печати — сразу, как страницы набраны. */
        if (window.sheetPagination.error === undefined) void pechatat();
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [json, paginator, done]);

  if (user === null) {
    return (
      <Message>
        <NeedLogin text={T.needLogin} />
      </Message>
    );
  }
  if (user.role !== 'tutor') {
    return (
      <Message>
        <EmptyState title={T.tutorOnly} description={T.tutorOnlyText} action={toKabinet()} />
      </Message>
    );
  }
  if (id === '' || state.kind === 'missing') {
    return (
      <Message>
        <EmptyState title={T.notFound} description={T.notFoundText} action={toKabinet()} />
      </Message>
    );
  }
  if (state.kind === 'error') {
    return (
      <Message>
        <EmptyState title={T.loadError} description={state.message} action={toKabinet()} />
      </Message>
    );
  }
  if (state.kind === 'loading') {
    return (
      <Message>
        <p className="dz-print-message__wait">{T.loading}</p>
      </Message>
    );
  }
  if (json === null) {
    return (
      <Message>
        <EmptyState
          title={T.noTasks}
          description={T.noTasksText}
          action={
            <Link className="btn btn--secondary" href={homeworkHref(id)}>
              {T.back}
            </Link>
          }
        />
      </Message>
    );
  }

  const here = printHref(id, list, grid);
  return (
    <>
      <div className="dz-print-bar" data-print-bar>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void pechatat()}
          disabled={done !== json}
        >
          {T.print}
        </button>
        <span className="dz-print-bar__lead">
          {T.lead[list]}
          {list === 'uchenik' && grid ? ` ${T.grid}` : ''}
        </span>
        {students.length > 1 ? (
          <nav className="dz-print-bar__students" aria-label={T.students}>
            {/* Обычные ссылки: новый лист — новая загрузка и новое окно печати. */}
            <a
              href={withStudent(here, null)}
              aria-current={studentId === null ? 'page' : undefined}
            >
              {T.all}
            </a>
            {students.map((s) => (
              <a
                key={s.id}
                href={withStudent(here, s.id)}
                aria-current={studentId === s.id ? 'page' : undefined}
              >
                {s.name}
              </a>
            ))}
          </nav>
        ) : null}
        <Link className="dz-print-bar__back" href={homeworkHref(id)}>
          {T.back}
        </Link>
      </div>
      <div id="sheet-measure" />
      <div id="sheet-pages" />
      {paginator ? (
        <script
          id="sheet-spec"
          type="application/json"
          dangerouslySetInnerHTML={{ __html: json }}
        />
      ) : null}
    </>
  );
}
