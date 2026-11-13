import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { Chart } from '@/components/graph/Chart';
import { findSection } from '@/content/sections';
import { tasksPage } from '@/content/tasks';
import { VKLADKI_12 } from '@/content/vkladki';
import { lineScene } from '@/lib/scenes';
import { href, ZADANIYA } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';
import { ZadanieHero } from '../ZadanieHero';

/**
 * Оболочка задания №12: шапка «Стеклянная сцена» с иллюстрацией и
 * лента вкладок — устройство то же, что у №9–11. Вызывается из layout
 * маршрута: при переходе между вкладками остаётся на месте.
 *
 * Рукописной подписи под иллюстрацией больше нет: в новой шапке её не
 * держит ни один раздел.
 */
export function Shell12({ children }: { children: React.ReactNode }) {
  const section = findSection('12');
  if (section === undefined) {
    throw new Error('Нет раздела 12 в content/sections.ts');
  }
  const base = `${ZADANIYA}/${section.slug}`;

  /* Первая открытая подтема — единственный осмысленный переход.
     «Продолжить с места, где остановился» не делаем: хранилища
     прогресса в проекте нет, это была бы имитация. */
  const entry = section.subtopics.find((item) => item.status === 'active');

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${section.no}` },
          ]}
          title={section.title}
          lead={section.description}
          tabletki={tabletkiRazdela({
            ...(section.badge === undefined ? {} : { chast: section.badge }),
          })}
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
          media={
            section.hero === undefined ? (
              <Chart
                className="section-head__chart"
                scene={lineScene({ k: 0.5, b: 1, half: 6, label: 'y = f(x)' })}
              />
            ) : (
              <ZadanieHero task={section.hero} />
            )
          }
        />
        <RazdelTabs base={base} tabs={VKLADKI_12} className="topic-tabs-row--stsena" />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
