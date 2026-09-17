'use client';

import { useCallback, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useDismiss } from '@/lib/dismiss';
import { requestTabScroll } from '@/lib/tabScroll';
import { trainerModes, trainerPage, type TrainerMode } from '@/content/trainerModes';
import { ChevronIcon, DocIcon, ModeIcon } from './TrainerIcons';

export interface TrainerMenuProps {
  /** Адрес вкладки: от него считаются адреса режимов. */
  base: string;
  /** Выбранный режим. Пусто — строка выбора ещё закрыта. */
  mode: TrainerMode | null;
}

/**
 * Выбор типа заданий.
 *
 * В закрытом состоянии — строка «Выберите тип заданий», по нажатию
 * под ней раскрывается список из четырёх режимов. Правила закрытия
 * те же, что у меню «Для репетиторов»: повторное нажатие, щелчок мимо
 * и Escape — они и живут в общем хуке.
 *
 * Режим выбран — на месте строки стоит плашка с его названием, а само
 * меню открывается ею же: сменить тип можно, не возвращаясь назад.
 */
export function TrainerMenu({ base, mode }: TrainerMenuProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useDismiss({ open, onClose: close, menu, trigger });

  return (
    <div className="tmode">
      <button
        type="button"
        className={clsx('tmode__pick', mode !== null && 'is-chosen')}
        ref={trigger}
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={() => setOpen(!open)}
      >
        <span className="tmode__icon" aria-hidden="true">
          {mode === null ? <DocIcon /> : <ModeIcon id={mode.icon} />}
        </span>
        <span className="tmode__text">
          <span className="tmode__title">
            {mode === null ? trainerPage.pickTitle : `${trainerPage.title} · ${mode.title}`}
          </span>
          {mode === null ? <span className="tmode__lead">{trainerPage.pickLead}</span> : null}
        </span>
        <span className="tmode__chevron" aria-hidden="true">
          <ChevronIcon />
        </span>
      </button>

      {open ? (
        <div className="tmode__menu" id={`${id}-list`} ref={menu} role="group"
             aria-label={trainerPage.pickTitle}>
          <ul className="tmode__list">
            {trainerModes.map((item) => (
              <li key={item.id}>
                {/* Каждый режим — свой адрес: работают «назад»
                    и открытие в новой вкладке. */}
                <Link
                  className={clsx('tmode-card', item.id === mode?.id && 'is-current')}
                  href={`${base}${item.id}/`}
                  scroll={false}
                  aria-current={item.id === mode?.id ? 'true' : undefined}
                  onClick={() => {
                    setOpen(false);
                    requestTabScroll('.tmode');
                  }}
                >
                  <span className="tmode-card__icon" aria-hidden="true">
                    <ModeIcon id={item.icon} />
                  </span>
                  <span className="tmode-card__text">
                    <span className="tmode-card__title">{item.title}</span>
                    <span className="tmode-card__lead">{item.lead}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
