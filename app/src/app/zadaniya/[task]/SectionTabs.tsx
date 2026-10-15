'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef } from 'react';
import { useStickyTabs } from '@/components/tasks/useStickyTabs';
import { EmptyState, Tabs } from '@/components/ui';
import { bentoAll, bentoAttrs } from '@/lib/bento';
import { SubtopicCard } from '@/components/tasks/SubtopicCard';
import { VesRazdelCards } from '@/components/tasks/ves12/VesRazdelCards';
import { vesRazdel as vesRazdelText } from '@/content/ves12';
import { VKLADKI_OGLAVLENIYA } from '@/content/vkladki';
import { VkladkaIkonka } from '@/components/tasks/VkladkaIkonka';
import { TitleText } from '@/components/tasks/TitleText';
import { href } from '@/lib/paths';
import type { IkonkaRazdela } from '@/components/tasks/razdely/types';

export interface SubtopicView {
  slug: string;
  name: string;
  /** Название графика: «График — парабола». */
  caption?: string;
  /** Иконка раздела. Нет — карточка без иконки, как раньше. */
  icon?: IkonkaRazdela;
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
  /** Название и подзаголовок, набранные KaTeX на сборке. */
  titleHtml?: string;
  subtitleHtml?: string;
  count: number;
}

export interface SectionTabsProps {
  description: string;
  subtopics: SubtopicView[];
  prototypes: PrototypeView[];
  /** Блок «Весь раздел» над карточками подтем: зачётная и генератор (№12). */
  vesRazdel?: boolean;
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
export function SectionTabs({ description, subtopics, prototypes, vesRazdel = false }: SectionTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const strip = useRef<HTMLDivElement>(null);
  /* Лента прилипает к верху экрана (общий хук всех разделов). */
  useStickyTabs(strip);

  const sizes = bentoAll(subtopics.length);

  const requested = params.get('tab');
  const active = requested !== null && IDS.has(requested) ? requested : 'subtopics';

  function select(id: string) {
    /* scroll: false — вкладка меняет содержимое, а не место на странице. */
    /* href(): адрес всегда с «/» на конце, как у страниц экспорта. */
    router.replace(id === 'subtopics' ? href(pathname) : href(pathname, `?tab=${id}`), {
      scroll: false,
    });
  }

  return (
    <>
      <div className="topic-tabs-row">
        <div className="topic-tabs" ref={strip}>
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
        {active === 'subtopics' && vesRazdel ? (
          <>
            <VesRazdelCards place="page" />
            <h3 className="ves-or ves-or--page">{vesRazdelText.orType}</h3>
          </>
        ) : null}
        {active === 'subtopics' ? (
          /* Bento: карточки разного размера, ряды без дыр (lib/bento.ts). */
          <ul className="subtopics-grid subtopics-grid--bento">
            {subtopics.map((item, i) => (
              <li key={item.slug} {...bentoAttrs(sizes, i)}>
                <SubtopicCard
                  name={item.name}
                  {...(item.caption === undefined ? {} : { caption: item.caption })}
                  icon={item.icon}
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
                    <span className="proto__title">
                      <TitleText title={proto.title} html={proto.titleHtml} />
                    </span>
                    <span className="proto__subtitle">
                      <TitleText title={proto.subtitle} html={proto.subtitleHtml} />
                    </span>
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
