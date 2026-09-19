'use client';

import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { Tabs } from '@/components/ui';
import type { VychisleniyaTab } from '@/content/vychisleniya';
import type { TutorMaterial } from '@/content/sections';
import { TutorMenu } from '../TutorMenu';

export interface VychisleniyaTabsProps {
  /** Адрес раздела без хвоста: /zadaniya/8. */
  base: string;
  tabs: readonly VychisleniyaTab[];
  tutors: { title: string; items: TutorMaterial[] };
}

/**
 * Лента вкладок задания №8. Вкладки — ссылки на свои адреса, как у
 * заданий №3 и №4: работают «назад», копирование адреса и открытие
 * в новой вкладке. «Для репетиторов» — кнопка меню в той же ленте.
 */
export function VychisleniyaTabs({ base, tabs, tutors }: VychisleniyaTabsProps) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const strip = useRef<HTMLDivElement>(null);

  const tail = pathname.replace(base, '').replace(/^\/+/, '');
  const active =
    tabs.find((tab) => tab.tail !== '' && tail.startsWith(tab.tail)) ??
    tabs.find((tab) => tab.tail === '');

  return (
    <TutorMenu items={tutors.items} label={tutors.title} open={menu} onOpenChange={setMenu} stripRef={strip}>
      <Tabs
        className="z8-tabs"
        label="Разделы темы"
        value={active?.id ?? ''}
        items={tabs.map((tab) => ({ id: tab.id, label: tab.label, href: `${base}/${tab.tail}` }))}
      />
    </TutorMenu>
  );
}
