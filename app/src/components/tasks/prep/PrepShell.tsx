import Link from 'next/link';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { ProgressBar } from '@/components/ui';
import { prepPage, type PrepSkillId } from '@/content/prepSkills';
import { prepOverview } from '@/lib/prep';

export interface PrepShellProps {
  /** Адрес подтемы: от него считаются адреса списка и навыков. */
  base: string;
  /** Что открыто: список навыков или конкретный навык. */
  active: 'all' | PrepSkillId;
  /** Нижняя часть вкладки: карточки навыков или экран навыка. */
  children: ReactNode;
}

/**
 * Постоянная часть вкладки «Подготовительные задачи».
 *
 * Заголовок, счётчик и ряд навыков видны на любом экране вкладки:
 * и в списке, и внутри навыка. Раньше они лежали внутри списка и
 * уходили вместе с ним, из-за чего из навыка некуда было вернуться.
 *
 * Чипы — это навигация, а не фильтр: каждый ведёт на свой адрес,
 * поэтому работают кнопка «назад» и открытие в новой вкладке.
 */
export function PrepShell({ base, active, children }: PrepShellProps) {
  const overview = prepOverview();
  const listHref = `${base}/podgotovka/`;

  return (
    <section className="prep">
      <header className="prep__head">
        <h2 className="t-h2 prep__title">{prepPage.title}</h2>
        <p className="prep__lead">{prepPage.lead}</p>
        {/* Кольца здесь нет намеренно: оно стоит в шапке темы и
            считает другое. Два кольца на экране спорили бы. */}
        <p className="prep__counter">
          <b>{overview.solved}</b> из {overview.total} заданий
        </p>
        <ProgressBar
          className="prep__meter"
          value={overview.percent}
          label={`Подготовительные задачи: решено ${overview.solved} из ${overview.total}`}
        />
      </header>

      {/* Лента навыков: ниже 1024px прокручивается вбок, тень у правого
          края показывает, что прокручивать есть куда. */}
      <nav className="prep__chips" aria-label="Навыки">
        <Link
          className={clsx('chip', active === 'all' && 'is-active')}
          href={listHref}
          aria-current={active === 'all' ? 'page' : undefined}
        >
          {prepPage.allLabel}
        </Link>
        {overview.skills.map((view) => (
          <Link
            key={view.skill.id}
            className={clsx('chip', active === view.skill.id && 'is-active')}
            href={`${listHref}${view.skill.id}/`}
            aria-current={active === view.skill.id ? 'page' : undefined}
          >
            {view.skill.title}
          </Link>
        ))}
      </nav>

      {children}
    </section>
  );
}
