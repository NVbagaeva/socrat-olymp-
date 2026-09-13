'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Badge, EmptyState, Tabs } from '@/components/ui';

export interface SubtopicView {
  slug: string;
  name: string;
  /** Формула, уже свёрстанная KaTeX на сборке. */
  formulaHtml: string;
  status: 'active' | 'soon';
  /** Адрес подтемы. У закрытой ссылки нет. */
  href: string | null;
  /** Чертёж движка строкой. null — движок такую кривую не умеет. */
  chartSvg: string | null;
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

function SubtopicCard({ item }: { item: SubtopicView }) {
  const body = (
    <>
      <span className="subtopic__head">
        <span className="subtopic__name">{item.name}</span>
        {/* Формула свёрстана на сборке: обычным текстом она не выводится. */}
        <span
          className="subtopic__formula"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: item.formulaHtml }}
        />
      </span>

      {item.chartSvg !== null ? (
        <span
          className="subtopic__chart"
          dangerouslySetInnerHTML={{ __html: item.chartSvg }}
        />
      ) : null}

      {item.status === 'soon' ? (
        <span className="subtopic__meta">
          <Badge>Скоро</Badge>
        </span>
      ) : (
        /* Стрелка — span, а не кнопка: карточка уже ссылка, вложенный
           элемент управления сломал бы обход с клавиатуры. */
        <span className="subtopic__go" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M5 12h13M12 6l6 6-6 6" />
          </svg>
        </span>
      )}
    </>
  );

  if (item.href === null) {
    return (
      <span className="subtopic subtopic--soon" aria-disabled="true">
        {body}
      </span>
    );
  }
  return (
    <Link className="subtopic" href={item.href}>
      {body}
    </Link>
  );
}

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
                <SubtopicCard item={item} />
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
