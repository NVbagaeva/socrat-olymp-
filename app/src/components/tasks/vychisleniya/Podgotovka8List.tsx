import type { PrepPoolBlock } from '@/lib/vychisleniya/prep/pool';
import { TaskCountIcon } from '../prep/PrepIcons';
import { PrepCardLink } from '../prep/PrepScroll';
import { Podgotovka8Meter } from './Podgotovka8Counter';

export interface Podgotovka8ListProps {
  blocks: PrepPoolBlock[];
  listHref: string;
}

/** Карточки блоков подготовки: номер, название, формула, счётчик. */
export function Podgotovka8List({ blocks, listHref }: Podgotovka8ListProps) {
  return (
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
            <span className="prep-card__chart z8-card-formula" dangerouslySetInnerHTML={{ __html: block.formulaHtml }} />
            <span className="prep-card__count">
              <TaskCountIcon />
              {block.zadachi.length} заданий
            </span>
            <span className="prep-card__bottom">
              <Podgotovka8Meter id={block.id} total={block.zadachi.length} title={block.nazvanie} />
              <span className="prep-card__start">Начать →</span>
            </span>
          </PrepCardLink>
        </li>
      ))}
    </ul>
  );
}
