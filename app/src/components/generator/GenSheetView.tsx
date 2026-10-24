'use client';

import { clsx } from 'clsx';
import { useRef } from 'react';
import { GEN_UI } from '@/content/generatorUi';
import type { GenConfig, GenTask } from '@/lib/generator/obshchiy/types';
import { GenIcon } from './GenIcons';

export type TaskAction = 'swap' | 'level' | 'remove' | 'menu';

/**
 * Лист в предпросмотре — так, как его получит ученик: шапка «Будет на
 * ЕГЭ», поля «Фамилия, имя» и «Дата», задачи со строкой ответа. Ни
 * одной служебной пометки. Лист учителя — те же задачи с решением и
 * ответом, источник — одной строкой внизу.
 *
 * Действия над задачей: на компьютере — колонка значков на поле справа
 * по наведению, на телефоне — кнопка «⋯» и долгое нажатие.
 */
export function GenSheetView({
  config,
  tasks,
  subtitle,
  teacher,
  demo,
  live,
  onAction,
}: {
  config: GenConfig;
  tasks: GenTask[];
  subtitle: string;
  teacher: boolean;
  demo: boolean;
  live: boolean;
  onAction: (pos: string, action: TaskAction) => void;
}) {
  const timer = useRef<number | null>(null);
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
          {GEN_UI.uchitelPodpis(config.sheet.teacher)}
        </span>
        <span className="gen-paper__motto">{GEN_UI.motto}</span>
      </header>
      <div className="gen-paper__title">
        <span className="gen-paper__chip">{config.sheet.chip}</span>
        <h3>{config.sheet.title}</h3>
      </div>
      <p className="gen-paper__sub">
        {demo ? GEN_UI.primerLista : subtitle}
        {teacher && !demo ? ` · ${GEN_UI.resheniya}` : ''}
      </p>
      <div className="gen-paper__fields">
        <b>{GEN_UI.familiya}</b>
        <span />
        <b>{GEN_UI.data}</b>
        <span className="gen-paper__date" />
      </div>
      <ol className="gen-paper__list">
        {tasks.map((t) => (
          <li
            key={t.pos}
            className="gen-task"
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
          </li>
        ))}
      </ol>
      {teacher && !demo ? (
        <p className="gen-paper__src">{GEN_UI.istochnikStroka(bankNos, tasks.length)}</p>
      ) : null}
    </article>
  );
}
