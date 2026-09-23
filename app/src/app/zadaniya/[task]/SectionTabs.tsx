'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EmptyState, Tabs } from '@/components/ui';
import { SubtopicCard } from '@/components/tasks/SubtopicCard';
import { VKLADKI_OGLAVLENIYA } from '@/content/vkladki';
import { VkladkaIkonka } from '@/components/tasks/VkladkaIkonka';

export interface SubtopicView {
  slug: string;
  name: string;
  /** Формула, уже свёрстанная KaTeX на сборке. */
  formulaHtml: string;
  status: 'active' | 'soon';
  /** Адрес подтемы. Нет ни у закрытой, ни у той, чьи страницы не собраны. */
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

/* Список лежит в конфиге, как у остальных разделов. Состав у этой
   ленты свой: здесь вкладки переключают содержимое одной страницы,
   а не ведут в разделы темы. */
const TABS = VKLADKI_OGLAVLENIYA.map((tab) => ({
  id: tab.id,
  label: tab.label,
  ...(tab.icon === undefined ? {} : { icon: <VkladkaIkonka name={tab.icon} /> }),
}));

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
      <div className="topic-tabs-row">
        <div className="topic-tabs">
          <Tabs
            className="tabs--lenta"
            items={TABS}
            value={active}
            onValueChange={select}
            label="Разделы задания"
          />
        </div>
      </div>

      <div className="section-panel">
        {active === 'subtopics' ? (
          <ul className="subtopics-grid">
            {subtopics.map((item) => (
              <li key={item.slug}>
                <SubtopicCard
                  name={item.name}
                  href={item.href}
                  soon={item.status === 'soon'}
                  formulaHtml={item.formulaHtml}
                />
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
