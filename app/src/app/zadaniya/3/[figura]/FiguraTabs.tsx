'use client';

import { usePathname } from 'next/navigation';
import { Tabs } from '@/components/ui';

export interface FiguraTabsProps {
  /** Адрес раздела без хвоста: /zadaniya/3/konus. */
  base: string;
}

/* Вкладки раздела. Хвост адреса и есть идентификатор вкладки:
   теория живёт на самом адресе раздела, остальные — в подпапках. */
const TABS = [
  { id: 'teoriya', label: 'Теория', tail: '' },
  { id: 'podgotovka', label: 'Подготовительные задачи', tail: 'podgotovka/' },
  { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/' },
];

/**
 * Лента вкладок раздела.
 *
 * Вкладки — ссылки, а не кнопки: каждая живёт в адресе, поэтому
 * работают «назад» и «вперёд», ссылку на вкладку можно отправить,
 * а открыть её в новой вкладке браузера — обычным способом.
 *
 * Сама лента лежит в layout, а не в странице: при переходе между
 * вкладками React её не пересобирает, и крошки с заголовком и
 * чертежом остаются на месте.
 */
export function FiguraTabs({ base }: FiguraTabsProps) {
  const pathname = usePathname();
  /* Активна та вкладка, чей хвост стоит в адресе; если хвоста нет —
     теория. Сравнение по сегментам, а не по вхождению строки. */
  const tail = pathname.replace(base, '').replace(/^\/+/, '');
  const active = TABS.find((tab) => tab.tail !== '' && tail.startsWith(tab.tail));

  return (
    <Tabs
      className="figura-tabs"
      label="Разделы темы"
      value={active?.id ?? 'teoriya'}
      items={TABS.map((tab) => ({ id: tab.id, label: tab.label, href: `${base}/${tab.tail}` }))}
    />
  );
}
