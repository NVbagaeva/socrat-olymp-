import type { ReactNode } from 'react';
import { OPORNYE } from '@/content/opornye';
import { prepPage, type PrepSkillId } from '@/content/prepSkills';
import { prepOverview } from '@/lib/prep';
import { PrepChips } from './PrepChips';
import { PrepCounter } from './PrepCounter';
import { TabScrollOnMount } from '../TabScroll';

export interface PrepShellProps {
  /** Подтема: её список навыков. */
  type: string;
  /** Адрес подтемы: от него считаются адреса списка и навыков. */
  base: string;
  /** Что открыто: список навыков или конкретный навык. */
  active: 'all' | PrepSkillId;
  /** Нижняя часть вкладки: карточки навыков или экран навыка. */
  children: ReactNode;
}

/**
 * Постоянная часть вкладки «Опорные задачи».
 *
 * Заголовок, счётчик и ряд навыков видны на любом экране вкладки:
 * и в списке, и внутри навыка. Раньше они лежали внутри списка и
 * уходили вместе с ним, из-за чего из навыка некуда было вернуться.
 *
 * Чипы — это навигация, а не фильтр: каждый ведёт на свой адрес,
 * поэтому работают кнопка «назад» и открытие в новой вкладке.
 */
export function PrepShell({ type, base, active, children }: PrepShellProps) {
  const overview = prepOverview(type);
  const listHref = `${base}/${OPORNYE.tail}`;

  return (
    <section className="prep">
      <header className="prep__head">
        <h2 className="t-h2 prep__title">{prepPage.title}</h2>
        <p className="prep__lead">{prepPage.lead}</p>
        {/* Кольца здесь нет намеренно: оно стоит в шапке темы и
            считает другое. Два кольца на экране спорили бы.

            Счётчик клиентский: сколько решено, знает только браузер
            ученика. На сборке известны лишь длины наборов. */}
        <PrepCounter
          totals={overview.skills.map((view) => ({ id: view.skill.id, total: view.total }))}
        />
      </header>

      {/* Лента навыков: ниже 1024px прокручивается вбок, тень у правого
          края показывает, что прокручивать есть куда. */}
      <PrepChips
        allLabel={prepPage.allLabel}
        listHref={listHref}
        active={active}
        items={overview.skills.map((view) => ({
          id: view.skill.id,
          title: view.skill.title,
          href: `${listHref}${view.skill.id}/`,
        }))}
      />

      {/* На телефоне подводит открытый экран к верху видимой области:
          иначе после выбора навыка ученик остаётся на шапке темы. */}
      <TabScrollOnMount />

      {children}
    </section>
  );
}
