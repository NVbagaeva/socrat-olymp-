import { AppShell } from '@/components/layout/AppShell';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { type VeroyatnostSection } from '@/content/veroyatnost';
import { RazdelTabs } from '../RazdelTabs';
import { ZADANIYA } from '@/lib/paths';

export interface VeroyatnostShellProps {
  section: VeroyatnostSection;
  children: React.ReactNode;
}

/**
 * Оболочка раздела теории вероятностей: общая шапка раздела
 * (SectionHeader) и лента вкладок. Одна на обе темы вероятности —
 * устроены они одинаково, и второй копии этой разметки быть не должно.
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
        <SectionHeader kod={section.slug === '4' ? 'veroyatnost' : 'slozhnaya-veroyatnost'} />

        {/* «Для репетиторов» — обычная вкладка ленты со своей страницей,
            меню материалов в ленте больше нет. */}
        <RazdelTabs base={base} tabs={section.tabs} className="topic-tabs-row--stsena" bezPary />

        <div className="section-panel veroyatnost-panel">{children}</div>
      </main>
    </AppShell>
  );
}
