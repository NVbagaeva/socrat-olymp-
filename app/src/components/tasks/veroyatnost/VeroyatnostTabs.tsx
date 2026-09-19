'use client';

import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { Tabs } from '@/components/ui';
import type { VeroyatnostSection } from '@/content/veroyatnost';
import { TutorMenu } from '../TutorMenu';

export interface VeroyatnostTabsProps {
  /** Адрес раздела без хвоста: /zadaniya/4. */
  base: string;
  tabs: VeroyatnostSection['tabs'];
  /** Меню «Для репетиторов»: есть — в ленте появляется его кнопка. */
  tutors?: VeroyatnostSection['tutors'];
}

/**
 * Лента вкладок раздела теории вероятностей.
 *
 * Вкладки — ссылки, а не кнопки: каждая живёт в адресе, поэтому
 * работают «назад» и «вперёд», ссылку на вкладку можно отправить,
 * а открыть её в новой вкладке браузера — обычным способом.
 *
 * Сама лента лежит в layout, а не в странице: при переходе между
 * вкладками React её не пересобирает, и крошки с заголовком
 * остаются на месте. Устройство то же, что у вкладок задания №3.
 *
 * «Для репетиторов» — кнопка меню в той же ленте, тот же TutorMenu,
 * что у задания №12: меню стоит последним и панель не переключает.
 */
/** Хвост адреса материалов: /dlya-repetitorov/ — как у задания №12. */
export const TUTORS_TAIL = 'dlya-repetitorov/';

export function VeroyatnostTabs({ base, tabs, tutors }: VeroyatnostTabsProps) {
  const pathname = usePathname();
  const strip = useRef<HTMLDivElement>(null);

  /* Активна та вкладка, чей хвост стоит в адресе; если хвоста нет —
     та, что живёт на самом адресе раздела. Сравнение по хвосту, а не
     по вхождению строки. */
  const tail = pathname.replace(base, '').replace(/^\/+/, '');
  /* Заход по адресу материалов открывает первую вкладку с раскрытым
     меню — то же, что делает страница темы задания №12. Адрес известен
     и на сборке, поэтому разметка сервера и первая отрисовка совпадают. */
  const [menu, setMenu] = useState(tail === TUTORS_TAIL);
  const active =
    tabs.find((tab) => tab.tail !== '' && tail.startsWith(tab.tail)) ??
    tabs.find((tab) => tab.tail === '');

  const lenta = (
    <Tabs
      className="veroyatnost-tabs"
      label="Разделы темы"
      value={active?.id ?? ''}
      items={tabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        href: `${base}/${tab.tail}`,
      }))}
    />
  );

  if (tutors === undefined) {
    return lenta;
  }

  return (
    <TutorMenu
      items={tutors.items}
      label={tutors.title}
      open={menu}
      onOpenChange={setMenu}
      stripRef={strip}
    >
      {lenta}
    </TutorMenu>
  );
}
