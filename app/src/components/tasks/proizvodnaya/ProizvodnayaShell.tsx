import { AppShell } from '@/components/layout/AppShell';
import { tasksPage } from '@/content/tasks';
import { PROIZVODNAYA } from '@/content/proizvodnaya';
import { ZADANIYA } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';
import { ShapkaRazdela } from '../ShapkaRazdela';

/**
 * Оболочка задания №9: крошки, заголовок и лента вкладок. Вызывается
 * из layout маршрута — при переходе между вкладками остаётся на месте.
 * Устройство то же, что у №2 и №8: лента вкладок липкая, правил
 * `position` здесь нет.
 */
export function ProizvodnayaShell({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${PROIZVODNAYA.slug}`;

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="z9-head"
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(PROIZVODNAYA.no)}` },
          ]}
          title={PROIZVODNAYA.title}
          badge={PROIZVODNAYA.badge}
          lead={PROIZVODNAYA.lead}
        />

        <RazdelTabs
          base={base}
          tabs={PROIZVODNAYA.tabs}
          {...(PROIZVODNAYA.tutors.items.length === 0 ? {} : { tutors: PROIZVODNAYA.tutors })}
        />

        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
