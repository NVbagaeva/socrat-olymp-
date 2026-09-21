import type { ReactElement } from 'react';
import { NavIcon } from '@/components/ui';
import type { VkladkaIcon } from '@/content/vkladki';
import { HintIcon } from './prep/PrepIcons';

/**
 * Значок вкладки по имени из конфига.
 *
 * Мишень, гантель и раскрытая книга добавлены в общий набор NavIcon:
 * они рисуются тем же приёмом и той же толщиной, что остальные значки
 * набора. Остальные значки взяты из тех, что в проекте уже были.
 *
 * Книга здесь контурная, не та залитая, что стоит в теории: в ленте
 * она соседствует с мишенью и лампочкой, и заливка выбивалась.
 */
const ZNACHKI: Record<VkladkaIcon, ReactElement> = {
  sheet: <NavIcon name="materials" />,
  book: <NavIcon name="book" />,
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
