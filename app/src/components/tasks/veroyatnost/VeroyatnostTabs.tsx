'use client';

import { usePathname } from 'next/navigation';
import { Tabs } from '@/components/ui';
import { VEROYATNOST_TABS } from '@/content/veroyatnost';

export interface VeroyatnostTabsProps {
  /** Адрес раздела без хвоста: /zadaniya/4. */
  base: string;
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
 */
export function VeroyatnostTabs({ base }: VeroyatnostTabsProps) {
  const pathname = usePathname();
  /* Активна та вкладка, чей хвост стоит в адресе; если хвоста нет —
     теория. Сравнение по хвосту, а не по вхождению строки. */
  const tail = pathname.replace(base, '').replace(/^\/+/, '');
  const active = VEROYATNOST_TABS.find((tab) => tab.tail !== '' && tail.startsWith(tab.tail));

  return (
    <Tabs
      className="veroyatnost-tabs"
      label="Разделы темы"
      value={active?.id ?? 'teoriya'}
      items={VEROYATNOST_TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        href: `${base}/${tab.tail}`,
      }))}
    />
  );
}
