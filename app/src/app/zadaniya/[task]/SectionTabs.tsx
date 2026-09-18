'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EmptyState, Tabs } from '@/components/ui';
import { SubtopicCard } from '@/components/tasks/SubtopicCard';

export interface SubtopicView {
  slug: string;
  name: string;
  /** Формула, уже свёрстанная KaTeX на сборке. */
  formulaHtml: string;
  status: 'active' | 'soon';
  /** Адрес подтемы. У закрытой ссылки нет. */
  href: string | null;
}

export interface PrototypeView {
  id: string;
  title: string;
  subtitle: string;
  count: number;
}

export interface SectionTabsProps {
  description: string;
  subtopics: SubtopicView[];
  prototypes: PrototypeView[];
}

const TABS = [
  { id: 'subtopics', label: 'Подтемы' },
  { id: 'about', label: 'О задании' },
  { id: 'prototypes', label: 'Прототипы' },
  { id: 'stats', label: 'Статистика' },
  { id: 'materials', label: 'Материалы' },
];

const IDS = new Set(TABS.map((tab) => tab.id));

/**
 * Вкладки раздела. Активная вкладка лежит в адресе параметром tab,
 * поэтому ссылку на конкретную вкладку можно отправить. Переключение
 * идёт без перезагрузки: адрес меняется через replace.
 */
export function SectionTabs({ description, subtopics, prototypes }: SectionTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const requested = params.get('tab');
  const active = requested !== null && IDS.has(requested) ? requested : 'subtopics';

  function select(id: string) {
    /* scroll: false — вкладка меняет содержимое, а не место на странице. */
    router.replace(id === 'subtopics' ? pathname : `${pathname}?tab=${id}`, { scroll: false });
  }

  return (
    <>
      <Tabs items={TABS} value={active} onValueChange={select} label="Разделы задания" />

      <div className="section-panel">
        {active === 'subtopics' ? (
          <ul className="subtopics-grid">
            {subtopics.map((item) => (
              <li key={item.slug}>
                <SubtopicCard name={item.name} href={item.href} formulaHtml={item.formulaHtml} />
              </li>
            ))}
          </ul>
        ) : null}

        {active === 'about' ? <p className="section-about">{description}</p> : null}

        {active === 'prototypes' ? (
          prototypes.length === 0 ? (
            <EmptyState
              title="Материал готовится"
              description="Прототипов для этого задания в данных пока нет."
            />
          ) : (
            <ul className="proto-list">
              {prototypes.map((proto) => (
                <li className="proto" key={proto.id}>
                  <span className="proto__id">{proto.id}</span>
                  <span className="proto__text">
                    <span className="proto__title">{proto.title}</span>
                    <span className="proto__subtitle">{proto.subtitle}</span>
                  </span>
                  {/* Число берётся из состава набора движка, а не задаётся. */}
                  <span className="proto__count">{proto.count}</span>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {active === 'stats' ? (
          <EmptyState
            title="Статистика появится вместе с личным кабинетом"
            description="Хранилища результатов в проекте пока нет, поэтому показывать нечего."
          />
        ) : null}

        {active === 'materials' ? (
          <EmptyState title="Материалы готовятся" description="Раздел пока пуст." />
        ) : null}
      </div>
    </>
  );
}
