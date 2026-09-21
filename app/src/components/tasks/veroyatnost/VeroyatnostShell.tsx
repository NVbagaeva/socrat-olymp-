import { AppShell } from '@/components/layout/AppShell';
import { Badge, Breadcrumbs } from '@/components/ui';
import { tasksPage } from '@/content/tasks';
import { type VeroyatnostSection } from '@/content/veroyatnost';
import { TUTORS_TAIL } from '@/content/vkladki';
import { RazdelTabs } from '../RazdelTabs';

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
  const base = `${tasksPage.href}/${section.slug}`;

  return (
    <AppShell active="tasks">
      <main className="app-main veroyatnost-main">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(section.no)}` },
          ]}
        />

        {/* В заголовке стоит название темы, а номер задания — в
            крошках: страница задания здесь и есть страница темы,
            промежуточного выбора раздела, как в №3, у неё нет. */}
        <header className="section-head veroyatnost-head">
          <div className="section-head__text">
            <div className="section-head__title">
              <h1 className="t-h1">{section.title}</h1>
              <Badge tone="info">{section.badge}</Badge>
            </div>
            <p className="section-head__lead">{section.lead}</p>
          </div>
        </header>

        <RazdelTabs
          base={base}
          tabs={section.tabs}
          tutorsTail={TUTORS_TAIL}
          {...(section.tutors === undefined ? {} : { tutors: section.tutors })}
        />

        <div className="section-panel veroyatnost-panel">{children}</div>
      </main>
    </AppShell>
  );
}
