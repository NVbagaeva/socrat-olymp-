'use client';

import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Tabs } from '@/components/ui';
import type { RazdelTab } from '@/content/vkladki';
import type { TutorMaterial } from '@/content/sections';
import { TutorMenu } from './TutorMenu';
import { TabsRow } from './TabsRow';
import { useVkladkaPerehod } from './useVkladkaPerehod';
import { sessionText } from './session/text';
import { hasActiveScope, scopeOfPath } from '@/lib/trainerSession/scope';
import { useActiveTrainerScopes } from '@/lib/trainerSession/store';
import { VkladkaIkonka } from './VkladkaIkonka';

export interface RazdelTabsProps {
  /** Адрес раздела без хвоста: /zadaniya/4, /zadaniya/3/konus. */
  base: string;
  tabs: readonly RazdelTab[];
  /** Материалы для репетитора. Не заданы — меню в ленте нет. */
  tutors?: { title: string; items: readonly TutorMaterial[] };
  /**
   * Хвост адреса, на котором меню материалов открывается сразу.
   * Задан — заход по ссылке на материалы открывает первую вкладку
   * с раскрытым меню.
   */
  tutorsTail?: string;
  /**
   * Слева в строке ленты, прилипает вместе с ней: плашка «раздел ▾»
   * с меню разделов (RazdelyNav), как у №12.
   */
  before?: ReactNode;
}

/**
 * Лента вкладок раздела — одна на все задания.
 *
 * Раньше у №3, №4, №5, №8 и подтем №12 были свои ленты с одинаковой
 * логикой и почти одинаковым оформлением; они разъезжались при каждой
 * правке. Теперь лента одна, а разделы отличаются только списком
 * вкладок в конфиге.
 *
 * Вкладки — ссылки, а не кнопки: каждая живёт в адресе, поэтому
 * работают «назад» и «вперёд», ссылку можно отправить, а открыть
 * в новой вкладке браузера — обычным способом.
 *
 * Активна та вкладка, чей хвост стоит в адресе; если хвоста нет —
 * та, что живёт на самом адресе раздела. Сравнение по хвосту, а не
 * по вхождению строки: иначе «trenazher» нашёлся бы и внутри
 * «trenazher/uznay-metod».
 */
export function RazdelTabs({ base, tabs, tutors, tutorsTail, before }: RazdelTabsProps) {
  const pathname = usePathname();
  /* Узел ленты нужен меню материалов. Активную вкладку в видимую часть
     ленты подводит общая строка (TabsRow). */
  const strip = useRef<HTMLDivElement>(null);
  /* Плавный переход между вкладками (styles/perehody.css). */
  const perehod = useVkladkaPerehod();
  const tail = pathname.replace(base, '').replace(/^\/+/, '');
  /* Адрес известен и на сборке, поэтому разметка сервера и первая
     отрисовка совпадают. */
  const [menu, setMenu] = useState(tutorsTail !== undefined && tail === tutorsTail);

  const active =
    tabs.find((tab) => tab.tail !== '' && tail.startsWith(tab.tail)) ??
    tabs.find((tab) => tab.tail === '');

  /* Метка на «Тренажёре»: в нём осталась незавершённая тренировка. */
  const sessions = useActiveTrainerScopes();
  const trainerActive = hasActiveScope(sessions, scopeOfPath(base));

  const lenta = (
    <Tabs
      className="tabs--lenta"
      label="Разделы темы"
      value={active?.id ?? ''}
      onLinkClick={perehod}
      items={tabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        icon: tab.icon === undefined ? undefined : <VkladkaIkonka name={tab.icon} />,
        href: `${base}/${tab.tail}`,
        ...(tab.id === 'trenazher' && trainerActive ? { badge: sessionText.menuDot } : {}),
      }))}
    />
  );

  /* Плашка ленты — одна и та же обёртка в обоих случаях: и когда
     меню материалов есть, и когда его нет. Иначе оформление плашки
     пришлось бы описывать дважды. */
  if (tutors === undefined) {
    return (
      <TabsRow>
        {() => (
          <>
            {before}
            <div className="topic-tabs">{lenta}</div>
          </>
        )}
      </TabsRow>
    );
  }

  return (
    <TutorMenu
      items={[...tutors.items]}
      label={tutors.title}
      open={menu}
      onOpenChange={setMenu}
      stripRef={strip}
      before={before}
    >
      {lenta}
    </TutorMenu>
  );
}
