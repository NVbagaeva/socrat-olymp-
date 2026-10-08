import Image from 'next/image';
import { AppShell } from '@/components/layout/AppShell';
import { tasksPage } from '@/content/tasks';
import { type VeroyatnostSection } from '@/content/veroyatnost';
import { ShapkaRazdela } from '../ShapkaRazdela';
import { RazdelTabs } from '../RazdelTabs';
import { ZADANIYA } from '@/lib/paths';

export interface VeroyatnostShellProps {
  section: VeroyatnostSection;
  children: React.ReactNode;
}

/**
 * Оболочка раздела теории вероятностей: крошки, заголовок и лента
 * вкладок. Одна на задания №4 и №5 — устроены они одинаково, и
 * второй копии этой разметки быть не должно.
 *
 * Вызывается из layout маршрута, а не из страницы: при переходе
 * между вкладками React оставляет оболочку на месте, поэтому шапка
 * не мигает и не исчезает.
 */
export function VeroyatnostShell({ section, children }: VeroyatnostShellProps) {
  const base = `${ZADANIYA}/${section.slug}`;

  return (
    <AppShell active="tasks">
      <main className="app-main veroyatnost-main">
        {/* В заголовке стоит название темы, а номер задания — в
            крошках: страница задания здесь и есть страница темы,
            промежуточного выбора раздела, как в №3, у неё нет. */}
        <ShapkaRazdela
          className="veroyatnost-head"
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(section.no)}` },
          ]}
          title={section.title}
          {...(section.badge === undefined ? {} : { badge: section.badge })}
          lead={section.lead}
          {...(section.art === undefined
            ? {}
            : {
                media: (
                  /* Картинка — декор: alt пустой, ничего сверх заголовка
                     она не сообщает. Размеры стоят настоящие, чтобы место
                     под неё держалось до загрузки и шапка не прыгала. */
                  <Image
                    className="veroyatnost-art"
                    src={section.art.src}
                    alt=""
                    width={section.art.width}
                    height={section.art.height}
                    priority
                  />
                ),
              })}
        />

        {/* «Для репетиторов» — обычная вкладка ленты со своей страницей,
            меню материалов в ленте больше нет. */}
        <RazdelTabs base={base} tabs={section.tabs} />

        <div className="section-panel veroyatnost-panel">{children}</div>
      </main>
    </AppShell>
  );
}
