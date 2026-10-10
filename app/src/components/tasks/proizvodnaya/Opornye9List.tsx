import { OPORNYE_9 } from '@/content/proizvodnaya';
import type { PrepPoolBlock } from '@/lib/proizvodnaya/prep/pool';
import { TaskCountIcon } from '../prep/PrepIcons';
import { PrepCardLink } from '../prep/PrepScroll';
import { Opornye9Meter } from './Opornye9Counter';
import { RazobrannyeZadachi9 } from './RazobrannyeZadachi9';

export interface Opornye9ListProps {
  blocks: PrepPoolBlock[];
  listHref: string;
}

/**
 * Список вкладки «Опорные задачи»: карточки блоков (номер, название,
 * короткое описание, число заданий, прогресс) и под ними разобранные
 * задачи по типам. Формул на карточках нет — они внутри блока.
 */
export function Opornye9List({ blocks, listHref }: Opornye9ListProps) {
  return (
    <>
      {blocks.length === 0 ? (
        <p className="z9-about__hint">{OPORNYE_9.empty}</p>
      ) : (
        <ul className="prep__grid">
          {blocks.map((block) => (
            <li key={block.id}>
              <PrepCardLink className="prep-card" href={`${listHref}${block.slug}/`}>
                <span className="prep-card__no" aria-hidden="true">
                  {block.no}
                </span>
                <span className="prep-card__text">
                  <span className="prep-card__title">{block.nazvanie}</span>
                  <span className="prep-card__lead">{block.lead}</span>
                </span>
                <span className="prep-card__count">
                  <TaskCountIcon />
                  {block.zadachi.length} заданий
                </span>
                <span className="prep-card__bottom">
                  <Opornye9Meter
                    id={block.id}
                    total={block.zadachi.length}
                    title={block.nazvanie}
                  />
                  <span className="prep-card__start">Начать →</span>
                </span>
              </PrepCardLink>
            </li>
          ))}
        </ul>
      )}
      <RazobrannyeZadachi9 />
    </>
  );
}
