import { AppShell } from '@/components/layout/AppShell';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { PROIZVODNAYA } from '@/content/proizvodnaya';
import { razdelBase } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';

/**
 * Оболочка раздела «Производная и первообразная»: общая шапка раздела (SectionHeader) и
 * липкая лента вкладок (RazdelTabs). Номер, заголовок, чипы, картинка и
 * кольцо прогресса — в шапке, одинаковой у всех разделов. Вызывается из
 * layout маршрута: при переходе между вкладками остаётся на месте.
 */
export function ProizvodnayaShell({ children }: { children: React.ReactNode }) {
  const base = `${razdelBase(PROIZVODNAYA.slug)}`;

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <SectionHeader kod="proizvodnaya" />

        <RazdelTabs
          base={base}
          tabs={PROIZVODNAYA.tabs}
          className="topic-tabs-row--stsena"
          {...(PROIZVODNAYA.tutors.items.length === 0 ? {} : { tutors: PROIZVODNAYA.tutors })}
          bezPary
        />

        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
