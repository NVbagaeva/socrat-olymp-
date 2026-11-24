import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { findSection } from '@/content/sections';
import { VKLADKI_12 } from '@/content/vkladki';
import { href, razdelBase, ZADANIYA } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';

/**
 * Оболочка хаба «Графики функций»: общая шапка раздела (SectionHeader)
 * с кнопкой «Продолжить подготовку» и лента вкладок — то же устройство,
 * что у остальных разделов. Вызывается из layout маршрута: при переходе
 * между вкладками остаётся на месте.
 */
export function Shell12({ children }: { children: React.ReactNode }) {
  const section = findSection('12');
  if (section === undefined) {
    throw new Error('Нет раздела 12 в content/sections.ts');
  }
  const base = `${razdelBase(section.slug)}`;

  /* Первая открытая подтема — единственный осмысленный переход.
     «Продолжить с места, где остановился» не делаем: хранилища
     прогресса в проекте нет, это была бы имитация. */
  const entry = section.subtopics.find((item) => item.status === 'active');

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <SectionHeader
          kod="grafiki-funkciy"
          actions={
            entry === undefined ? null : (
              <Link
                className="btn btn--primary section-head__cta"
                href={href(ZADANIYA, section.slug, entry.id)}
              >
                Продолжить подготовку
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h13M12 6l6 6-6 6" />
                </svg>
              </Link>
            )
          }
        />
        <RazdelTabs base={base} tabs={VKLADKI_12} className="topic-tabs-row--stsena" bezPary />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
