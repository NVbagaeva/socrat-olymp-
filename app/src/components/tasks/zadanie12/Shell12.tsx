import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Chart } from '@/components/graph/Chart';
import { HandNote } from '@/components/ui';
import { findSection } from '@/content/sections';
import { tasksPage } from '@/content/tasks';
import { VKLADKI_12 } from '@/content/vkladki';
import { lineScene } from '@/lib/scenes';
import { href, ZADANIYA } from '@/lib/paths';
import { RazdelTabs } from '../RazdelTabs';
import { ShapkaRazdela } from '../ShapkaRazdela';
import { ZadanieHero } from '../ZadanieHero';

/**
 * Оболочка задания №12: крошки, заголовок с иллюстрацией и лента
 * вкладок — устройство то же, что у №9–11. Вызывается из layout
 * маршрута: при переходе между вкладками остаётся на месте.
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
        <ShapkaRazdela
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${section.no}` },
          ]}
          title={section.title}
          {...(section.hero === undefined ? {} : { className: 'section-head--hero' })}
          {...(section.badge === undefined ? {} : { badge: section.badge })}
          lead={section.description}
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
            <>
              {section.hero === undefined ? (
                <Chart
                  className="section-head__chart"
                  scene={lineScene({ k: 0.5, b: 1, half: 6, label: 'y = f(x)' })}
                />
              ) : (
                <ZadanieHero task={section.hero} />
              )}
              <HandNote className="section-head__note">Функции описывают мир вокруг нас</HandNote>
            </>
          }
        />
        <RazdelTabs base={base} tabs={VKLADKI_12} />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
