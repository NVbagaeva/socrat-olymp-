import { AppShell } from '@/components/layout/AppShell';
import { StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { SHAPKA1 } from '@/content/planimetriya1';
import { tasksPage } from '@/content/tasks';
import { ZADANIE1 } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';
import { typeset } from '@/lib/tex';
import { RazdelTabs } from '../RazdelTabs';
import { Trezubets } from './Trezubets';

/**
 * Оболочка задания №1: шапка «Стеклянная сцена» и липкая лента вкладок,
 * как у №6 и №7. Вызывается из layout маршрута: при переходе между
 * вкладками остаётся на месте.
 *
 * Справа в шапке (на телефоне — под текстом) — живая композиция «лемма
 * о трезубце», её можно вращать (Trezubets), поэтому мотив, нарисованный
 * кодом, сюда не ставится. Широкая иллюстрация раздела (стеклянная
 * подставка с чертежами) стоит обложкой в шапке вкладки «О задании» —
 * там она видна целиком и на телефоне (OZadanii1). Кольца прогресса в
 * шапке нет: прогресс — по группам на «О задании» и в тренажёре.
 */
export function Shell1({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE1.slug}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(ZADANIE1.no)}` },
          ]}
          title={ZADANIE1.title}
          lead={ZADANIE1.lead}
          tabletki={tabletkiRazdela({ chast: ZADANIE1.badge })}
          media={
            <Trezubets label={SHAPKA1.ariaLabel} hintHtml={typeset(SHAPKA1.trezubetsPodpis)} />
          }
        />
        <RazdelTabs base={base} tabs={ZADANIE1.tabs} className="topic-tabs-row--stsena" />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
