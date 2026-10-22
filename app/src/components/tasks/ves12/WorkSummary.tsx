'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui';
import { RazdelIkonka } from '@/components/tasks/razdely/RazdelIkonka';
import { zachyotText } from '@/content/ves12';
import { minutesLabel, tasksLabel, variantsLabel, type WorkPlan } from '@/lib/ves12/work';
import type { WorkPreview } from '@/lib/ves12/build';
import { TemplateIcon } from './icons';

export interface WorkMain {
  disabled: boolean;
  /** Почему кнопка неактивна. */
  hint: string | null;
  building: boolean;
  /** Работа собрана и настройки не менялись: кнопка — «Скачать для печати». */
  downloadHref: string | null;
  onBuild: () => void;
}

export interface WorkSummaryProps {
  title: string;
  plan: WorkPlan;
  variants: number;
  minutes: number;
  preview: WorkPreview | null;
  /** Превью относится к текущим настройкам. */
  previewFresh: boolean;
  main: WorkMain;
}

/** Главная кнопка: одна в каждый момент. */
function MainButton({ main, short = false }: { main: WorkMain; short?: boolean }) {
  if (main.downloadHref !== null) {
    return (
      <a
        className="btn btn--primary zs-main"
        href={main.downloadHref}
        target="_blank"
        rel="noopener"
        data-testid="zachyot-main"
        data-main="download"
      >
        {zachyotText.download}
      </a>
    );
  }
  return (
    <Button
      className="zs-main"
      disabled={main.disabled}
      loading={main.building}
      onClick={main.onBuild}
      data-testid="zachyot-main"
      data-main="build"
    >
      {short ? zachyotText.buildShort : zachyotText.build}
    </Button>
  );
}

/** Мини-лист: настоящая первая страница собранного варианта или скелет. */
function Preview({ title, preview, fresh, building }: { title: string; preview: WorkPreview | null; fresh: boolean; building: boolean }) {
  const shown = preview !== null && fresh ? preview : null;
  return (
    <div className={clsx('zs-preview', shown === null && 'is-empty')} data-testid="zachyot-preview">
      <div className="zs-preview__head">
        <span>{title}</span>
        <span>Вариант 1</span>
      </div>
      {shown === null ? (
        <div className="zs-preview__skeleton" aria-hidden={building ? undefined : true}>
          <span />
          <span />
          <span />
          <p className="zs-preview__note">{building ? zachyotText.previewBuilding : zachyotText.previewEmpty}</p>
        </div>
      ) : (
        <ol className="zs-preview__tasks">
          {shown.tasks.map((task) => (
            <li key={task.no} className="zs-preview__task">
              <span className="zs-preview__no">{task.no}</span>
              <div className="zs-preview__q" dangerouslySetInnerHTML={{ __html: task.html }} />
              {task.svg === null ? null : (
                <div className="zs-preview__fig" dangerouslySetInnerHTML={{ __html: task.svg }} />
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * Сводка работы. На компьютере — липкая колонка справа: крупно задачи,
 * варианты и минуты, включённые типы, превью и главная кнопка. На
 * телефоне — нижняя панель «N задач · M мин» и кнопка; «подробнее»
 * выдвигает ту же сводку целиком.
 */
export function WorkSummary({ title, plan, variants, minutes, preview, previewFresh, main }: WorkSummaryProps) {
  const [open, setOpen] = useState(false);
  const body = (
    <>
      <div className="zs-stats">
        <span className="zs-stat">
          <TemplateIcon name="sheet" />
          <b data-testid="zachyot-total">{plan.perVariant}</b> {tasksLabel(plan.perVariant).split(' ')[1]}
        </span>
        <span className="zs-stat">
          <TemplateIcon name="sliders" />
          <b data-testid="zachyot-variants">{variants}</b> {variantsLabel(variants).split(' ')[1]}
        </span>
        <span className="zs-stat">
          <TemplateIcon name="clock" />
          <b>{minutes}</b> {minutesLabel(minutes).split(' ')[1]}
        </span>
      </div>
      <h4 className="zs-sum__sub">{zachyotText.included}</h4>
      {plan.types.length === 0 ? (
        <p className="zs-hint">{zachyotText.emptyHint}</p>
      ) : (
        <ul className="zs-sum__types">
          {plan.types.map((item) => (
            <li key={item.type.id}>
              <RazdelIkonka icon={item.type.icon} sizes="32px" className="zs-sum__ico" />
              <span className="zs-sum__name">{item.type.title}</span>
              <span className="zs-sum__n">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
      <h4 className="zs-sum__sub">{zachyotText.preview}</h4>
      <Preview title={title} preview={preview} fresh={previewFresh} building={main.building} />
    </>
  );

  return (
    <>
      <aside className="zs-sum" aria-label={zachyotText.summary}>
        <h3 className="zs-sum__title">{zachyotText.summary}</h3>
        {body}
        <MainButton main={main} />
        {main.hint === null ? null : <p className="zs-hint zs-sum__hint">{main.hint}</p>}
      </aside>

      {/* Телефон: нижняя панель. */}
      <div className={clsx('zs-bar', open && 'is-open')}>
        {open ? <div className="zs-bar__details">{body}</div> : null}
        <div className="zs-bar__row">
          <span className="zs-bar__ico">
            <TemplateIcon name="sheet" />
          </span>
          <span className="zs-bar__text">
            <b>
              {tasksLabel(plan.perVariant)} · {minutes} мин
            </b>
            <button type="button" className="zs-link" aria-expanded={open} onClick={() => setOpen(!open)}>
              {open ? '▾' : '▴'} {zachyotText.details}
            </button>
          </span>
          <MainButton main={main} short />
        </div>
        {main.hint === null ? null : <p className="zs-hint zs-bar__hint">{main.hint}</p>}
      </div>
    </>
  );
}
