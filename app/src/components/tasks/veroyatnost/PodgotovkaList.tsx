import { PODGOTOVKA_SLOVA, type Zadanie } from '@/content/veroyatnost';
import type { PrepPoolBlok } from '@/lib/veroyatnost/pool';
import { TaskCountIcon } from '../prep/PrepIcons';
import { PrepCardLink } from '../prep/PrepScroll';
import { PodgotovkaMeter } from './PodgotovkaSchet';

export interface PodgotovkaListProps {
  zadanie: Zadanie;
  bloki: PrepPoolBlok[];
  /** Адрес вкладки опорных задач: /zadaniya/4/opornye-zadachi/. */
  listHref: string;
}

/**
 * Карточки блоков конспекта: номер по порядку, название, приём блока
 * и счёт решённого. Порядок — авторский: блоки конспекта идут
 * последовательностью, а не каталогом, и номер об этом напоминает.
 */
export function PodgotovkaList({ zadanie, bloki, listHref }: PodgotovkaListProps) {
  return (
    <ul className="prep__grid">
      {bloki.map((blok, i) => (
        <li key={blok.id}>
          <PrepCardLink className="prep-card" href={`${listHref}${blok.id}/`}>
            <span className="prep-card__no" aria-hidden="true">
              {i + 1}
            </span>
            <span className="prep-card__text">
              <span className="prep-card__title">{blok.nazvanie}</span>
              <span className="prep-card__lead">{blok.tip}</span>
            </span>
            <span className="prep-card__count">
              <TaskCountIcon />
              {PODGOTOVKA_SLOVA.zadach(blok.zadachi.length)}
            </span>
            <span className="prep-card__bottom">
              <PodgotovkaMeter
                zadanie={zadanie}
                zadachi={blok.zadachi.map((zadacha) => zadacha.id)}
                title={blok.nazvanie}
              />
              <span className="prep-card__start">Начать →</span>
            </span>
          </PrepCardLink>
        </li>
      ))}
    </ul>
  );
}
