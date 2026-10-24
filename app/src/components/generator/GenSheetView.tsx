'use client';

import { clsx } from 'clsx';
import { useRef, useState } from 'react';
import { GEN_UI } from '@/content/generatorUi';
import type { GenConfig, GenExtras, GenTask } from '@/lib/generator/obshchiy/types';
import { GenIcon } from './GenIcons';

export type TaskAction = 'swap' | 'level' | 'remove' | 'menu' | 'up' | 'down';

/**
 * Лист в предпросмотре — так, как его получит ученик: шапка «Будет на
 * ЕГЭ», поля «Фамилия, имя» и «Дата», задачи со строкой ответа. Ни
 * одной служебной пометки. Лист учителя — те же задачи с решением и
 * ответом, источник — одной строкой внизу.
 *
 * Действия над задачей: на компьютере — колонка значков на поле справа
 * и ручка перетаскивания слева по наведению (ручка понимает и ↑ ↓), на
 * телефоне — кнопка «⋯» и долгое нажатие, там же «Выше» и «Ниже».
 */
/** «2026-10-24» → «24.10.2026»; пусто — пустая линия. */
function dataText(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m === null ? '' : `${m[3]}.${m[2]}.${m[1]}`;
}

export function GenSheetView({
  config,
  tasks,
  subtitle,
  teacher,
  demo,
  live,
  extras,
  qr,
  onAction,
  onMove,
}: {
  config: GenConfig;
  tasks: GenTask[];
  subtitle: string;
  teacher: boolean;
  demo: boolean;
  live: boolean;
  /** «Дополнительно»: учитель и дата в шапке. null — пример листа. */
  extras: GenExtras | null;
  /** QR-код на лист ученика, SVG. */
  qr: string | null;
  onAction: (pos: string, action: TaskAction) => void;
  /** Перетаскивание: задача pos встаёт на место to (номер в листе с нуля). */
  onMove: (pos: string, to: number) => void;
}) {
  const timer = useRef<number | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [drop, setDrop] = useState<{ i: number; after: boolean } | null>(null);
  const endDrag = () => {
    setDrag(null);
    setDrop(null);
  };
  const bankNos = tasks.filter((t) => t.fromBank).map((t) => t.no);
  const cancel = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  return (
    <article
      className={clsx('gen-paper', demo && 'is-demo', live && 'is-live')}
      aria-label={demo ? GEN_UI.primerLista : undefined}
    >
      <header className="gen-paper__head">
        <span className="gen-paper__logo" aria-hidden="true">
          <GenIcon name="pen" />
        </span>
        <span className="gen-paper__brand">
          Будет на
          <br />
          ЕГЭ
        </span>
        <span className="gen-paper__div" aria-hidden="true" />
        <span className="gen-paper__course">
          <b>{config.sheet.course}</b>
          <br />
          {(extras?.teacher ?? config.sheet.teacher) === ''
            ? null
            : GEN_UI.uchitelPodpis(extras?.teacher ?? config.sheet.teacher)}
        </span>
        <span className="gen-paper__motto">{GEN_UI.motto}</span>
      </header>
      <div className="gen-paper__title">
        <span className="gen-paper__chip">{config.sheet.chip}</span>
        <h3>{config.sheet.title}</h3>
        {qr === null ? null : (
          <span
            className="gen-paper__qr"
            role="img"
            aria-label={GEN_UI.dop.qr}
            dangerouslySetInnerHTML={{ __html: qr }}
          />
        )}
      </div>
      <p className="gen-paper__sub">
        {demo ? GEN_UI.primerLista : subtitle}
        {teacher && !demo ? ` · ${GEN_UI.resheniya}` : ''}
      </p>
      <div className="gen-paper__fields">
        <b>{GEN_UI.familiya}</b>
        <span />
        <b>{GEN_UI.data}</b>
        <span className="gen-paper__date">{dataText(extras?.date ?? '')}</span>
      </div>
      <ol className="gen-paper__list">
        {tasks.map((t, i) => [
          t.lead === undefined ? null : (
            <li
              key={`lead-${t.pos}`}
              className="gen-lead"
              dangerouslySetInnerHTML={{ __html: t.lead }}
            />
          ),
          <li
            key={t.pos}
            className={clsx(
              'gen-task',
              drag === t.pos && 'is-dragging',
              drop?.i === i && (drop.after ? 'is-drop-after' : 'is-drop-before'),
            )}
            onDragOver={(e) => {
              if (drag === null) return;
              e.preventDefault();
              const r = e.currentTarget.getBoundingClientRect();
              const after = e.clientY > r.top + r.height / 2;
              if (drop?.i !== i || drop.after !== after) setDrop({ i, after });
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (drag === null || drop === null) return;
              const from = tasks.findIndex((x) => x.pos === drag);
              let to = drop.i + (drop.after ? 1 : 0);
              if (from < to) to -= 1;
              if (from >= 0 && to !== from) onMove(drag, to);
              endDrag();
            }}
            onPointerDown={(e) => {
              if (!live || e.pointerType !== 'touch' || (e.target as HTMLElement).closest('button'))
                return;
              cancel();
              timer.current = window.setTimeout(() => {
                timer.current = null;
                onAction(t.pos, 'menu');
              }, 500);
            }}
            onPointerUp={cancel}
            onPointerCancel={cancel}
            onPointerLeave={cancel}
            onContextMenu={(e) => {
              if (
                live &&
                timer.current === null &&
                e.nativeEvent instanceof PointerEvent &&
                e.nativeEvent.pointerType === 'touch'
              )
                e.preventDefault();
            }}
          >
            <span className="gen-task__no">{t.no}</span>
            <div className="gen-task__body">
              <div className="gen-task__q" dangerouslySetInnerHTML={{ __html: t.questionHtml }} />
              {teacher ? (
                <div className="gen-task__sol">
                  <div dangerouslySetInnerHTML={{ __html: t.solutionHtml }} />
                  <p className="gen-task__ans-key">
                    {GEN_UI.otvet}: <b dangerouslySetInnerHTML={{ __html: t.answerHtml }} />
                  </p>
                </div>
              ) : (
                <p className="gen-task__ans">
                  {GEN_UI.otvet}: <span />
                </p>
              )}
            </div>
            {live ? (
              <>
                {tasks.length > 1 ? (
                  <button
                    type="button"
                    className="gen-task__grip"
                    draggable
                    title={GEN_UI.peretashchit}
                    aria-label={`${GEN_UI.peretashchit}: ${t.no}`}
                    onDragStart={(e) => {
                      const li = e.currentTarget.closest('li');
                      if (li !== null) e.dataTransfer.setDragImage(li, 24, 20);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', t.pos);
                      setDrag(t.pos);
                    }}
                    onDragEnd={endDrag}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        onAction(t.pos, e.key === 'ArrowUp' ? 'up' : 'down');
                      }
                    }}
                  >
                    <GenIcon name="grip" />
                  </button>
                ) : null}
                <div className="gen-task__tools" role="toolbar" aria-label={GEN_UI.zadacha(t.no)}>
                  <button
                    type="button"
                    title={GEN_UI.zamenit}
                    aria-label={`${GEN_UI.zamenit}: ${t.no}`}
                    onClick={() => onAction(t.pos, 'swap')}
                  >
                    <GenIcon name="swap" />
                  </button>
                  <button
                    type="button"
                    title={GEN_UI.drugoyUroven}
                    aria-label={`${GEN_UI.drugoyUroven}: ${t.no}`}
                    onClick={() => onAction(t.pos, 'level')}
                  >
                    <GenIcon name="star" />
                  </button>
                  <button
                    type="button"
                    title={GEN_UI.ubrat}
                    aria-label={`${GEN_UI.ubrat}: ${t.no}`}
                    onClick={() => onAction(t.pos, 'remove')}
                  >
                    <GenIcon name="x" />
                  </button>
                </div>
                <button
                  type="button"
                  className="gen-task__more"
                  aria-label={GEN_UI.zadacha(t.no)}
                  onClick={() => onAction(t.pos, 'menu')}
                >
                  <GenIcon name="dots" />
                </button>
              </>
            ) : null}
          </li>,
        ])}
      </ol>
      {teacher && !demo ? (
        <p className="gen-paper__src">{GEN_UI.istochnikStroka(bankNos, tasks.length)}</p>
      ) : null}
    </article>
  );
}
