import type { ReactElement } from 'react';
import { NavIcon } from '@/components/ui';
import type { VkladkaIcon } from '@/content/vkladki';
import { HintIcon } from './prep/PrepIcons';
import { BookIcon } from './theory/BookIcon';

/**
 * Значок вкладки по имени из конфига.
 *
 * Новых рисунков здесь нет: берутся те, что в проекте уже были.
 * Мишень и гантель добавлены в общий набор NavIcon — они рисуются
 * тем же приёмом и той же толщиной, что остальные значки набора.
 */
const ZNACHKI: Record<VkladkaIcon, ReactElement> = {
  sheet: <NavIcon name="materials" />,
  book: <BookIcon />,
  bulb: <HintIcon />,
  target: <NavIcon name="target" />,
  dumbbell: <NavIcon name="dumbbell" />,
  settings: <NavIcon name="settings" />,
  tasks: <NavIcon name="tasks" />,
  stats: <NavIcon name="stats" />,
  materials: <NavIcon name="materials" />,
};

export function VkladkaIkonka({ name }: { name: VkladkaIcon }) {
  return ZNACHKI[name];
}
