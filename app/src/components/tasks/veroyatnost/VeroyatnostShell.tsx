import { AppShell } from '@/components/layout/AppShell';
import { RisunokRazdela, StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { STSENA } from '@/content/stsena';
import { tasksPage } from '@/content/tasks';
import { type VeroyatnostSection } from '@/content/veroyatnost';
import { IllyustratsiyaShapki } from '../IllyustratsiyaShapki';
import { RazdelTabs } from '../RazdelTabs';
import { ZADANIYA } from '@/lib/paths';

export interface VeroyatnostShellProps {
  section: VeroyatnostSection;
  children: React.ReactNode;
}

/**
 * Оболочка раздела теории вероятностей: шапка «Стеклянная сцена» и
 * лента вкладок. Одна на задания №4 и №5 — устроены они одинаково, и
 * второй копии этой разметки быть не должно.
 *
 * Вызывается из layout маршрута, а не из страницы: при переходе
 * между вкладками React оставляет оболочку на месте, поэтому шапка
 * не мигает и не исчезает.
 *
 * Обложка: своя иллюстрация, если она есть (№4), иначе мотив раздела,
 * нарисованный кодом (№5).
 */
export function VeroyatnostShell({ section, children }: VeroyatnostShellProps) {
  const base = `${ZADANIYA}/${section.slug}`;
  const no = String(Number(section.no));

  return (
    <AppShell active="tasks">
      <main className="app-main veroyatnost-main">
        {/* В заголовке стоит название темы, а номер задания — в
            крошках: страница задания здесь и есть страница темы,
            промежуточного выбора раздела, как в №3, у неё нет. */}
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${no}` },
          ]}
          title={section.title}
          lead={section.lead}
          tabletki={tabletkiRazdela({
            ...(section.badge === undefined ? {} : { chast: section.badge }),
          })}
          media={
            section.art === undefined ? (
              <RisunokRazdela no={no} label={`${STSENA.oblozhka}: ${section.title}`} />
            ) : (
              <IllyustratsiyaShapki art={section.art} />
            )
          }
        />

        {/* «Для репетиторов» — обычная вкладка ленты со своей страницей,
            меню материалов в ленте больше нет. */}
        <RazdelTabs base={base} tabs={section.tabs} className="topic-tabs-row--stsena" />

        <div className="section-panel veroyatnost-panel">{children}</div>
      </main>
    </AppShell>
  );
}
