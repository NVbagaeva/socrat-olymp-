'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Tabs } from '@/components/ui';
import type { RazdelTab } from '@/content/vkladki';
import type { TutorMaterial } from '@/content/sections';
import { TutorMenu } from './TutorMenu';
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
export function RazdelTabs({ base, tabs, tutors, tutorsTail }: RazdelTabsProps) {
  const pathname = usePathname();
  const strip = useRef<HTMLDivElement>(null);
  const tail = pathname.replace(base, '').replace(/^\/+/, '');
  /* Адрес известен и на сборке, поэтому разметка сервера и первая
     отрисовка совпадают. */
  const [menu, setMenu] = useState(tutorsTail !== undefined && tail === tutorsTail);

  const active =
    tabs.find((tab) => tab.tail !== '' && tail.startsWith(tab.tail)) ??
    tabs.find((tab) => tab.tail === '');

  /* На узком экране лента шире окна и прокручивается вбок. Активная
     вкладка может оказаться за правым краем, и страница открывалась бы
     с непонятного места ленты — подводим её к виду сразу. Прокручивается
     сама лента, а не страница: inline для горизонтали, block: 'nearest'
     чтобы страница не дёргалась к ленте. */
  useEffect(() => {
    const lenta = strip.current;
    const knopka = lenta?.querySelector('[aria-selected="true"]');
    if (lenta === null || knopka === null || knopka === undefined) {
      return;
    }
    if (lenta.scrollWidth > lenta.clientWidth) {
      knopka.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  }, [active?.id]);

  const lenta = (
    <Tabs
      className="tabs--lenta"
      label="Разделы темы"
      value={active?.id ?? ''}
      items={tabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        icon: tab.icon === undefined ? undefined : <VkladkaIkonka name={tab.icon} />,
        href: `${base}/${tab.tail}`,
      }))}
    />
  );

  /* Плашка ленты — одна и та же обёртка в обоих случаях: и когда
     меню материалов есть, и когда его нет. Иначе оформление плашки
     пришлось бы описывать дважды. */
  if (tutors === undefined) {
    return (
      <div className="topic-tabs-row">
        <div className="topic-tabs" ref={strip}>
          {lenta}
        </div>
      </div>
    );
  }

  return (
    <TutorMenu
      items={[...tutors.items]}
      label={tutors.title}
      open={menu}
      onOpenChange={setMenu}
      stripRef={strip}
    >
      {lenta}
    </TutorMenu>
  );
}
