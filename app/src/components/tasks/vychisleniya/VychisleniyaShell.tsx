import { AppShell } from '@/components/layout/AppShell';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { VYCHISLENIYA } from '@/content/vychisleniya';
import { RazdelTabs } from '../RazdelTabs';
import { ZADANIYA } from '@/lib/paths';
import { HomeworkBanner8 } from '@/components/dz/Razdel8Dz';

/**
 * Оболочка раздела «Вычисления и преобразования»: общая шапка раздела (SectionHeader) и
 * липкая лента вкладок (RazdelTabs). Номер, заголовок, чипы, картинка и
 * кольцо прогресса — в шапке, одинаковой у всех разделов. Вызывается из
 * layout маршрута: при переходе между вкладками остаётся на месте.
 * Панель содержания — своя, под лентой.
 */
export function VychisleniyaShell({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${VYCHISLENIYA.slug}`;

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <SectionHeader kod="vychisleniya" />

        <RazdelTabs
          base={base}
          tabs={VYCHISLENIYA.tabs}
          tutors={VYCHISLENIYA.tutors}
          className="topic-tabs-row--stsena"
          bezPary
        />

        <div className="section-panel">
          {/* Ученику со входом — «У вас домашнее задание до …». Гостю — ничего. */}
          <HomeworkBanner8 />
          {children}
        </div>
      </main>
    </AppShell>
  );
}
