import { OPORNYE_2 } from '@/content/vektory';
import type { OpornyePool } from '@/lib/vektory/opornye';
import type { PoolBlok } from '@/lib/vektory/prep/pool';
import { TaskCountIcon } from '../prep/PrepIcons';
import { PrepCardLink } from '../prep/PrepScroll';
import { Opornye2Meter } from './Opornye2Counter';
import { RazobrannyeZadachi } from './RazobrannyeZadachi';

export interface Opornye2ListProps {
  bloki: PoolBlok[];
  listHref: string;
  pool: OpornyePool;
}

/**
 * Список вкладки «Опорные задачи»: карточки блоков тренировок
 * (номер, название, формула, счётчик), под ними — разобранные
 * задачи по прототипам.
 */
export function Opornye2List({ bloki, listHref, pool }: Opornye2ListProps) {
  return (
    <>
      <h3 className="t-h3 z2-prep__sub" id="z2-trenirovki">
        {OPORNYE_2.trenirovkiTitle}
      </h3>
      <p className="z2-prep__lead">{OPORNYE_2.trenirovkiLead}</p>
      <ul className="prep__grid">
        {bloki.map((b) => (
          <li key={b.id}>
            <PrepCardLink className="prep-card" href={`${listHref}${b.slug}/`}>
              <span className="prep-card__no" aria-hidden="true">
                {b.no}
              </span>
              <span className="prep-card__text">
                <span className="prep-card__title">{b.nazvanie}</span>
                <span className="prep-card__lead">{b.lead}</span>
              </span>
              <span className="prep-card__count">
                <TaskCountIcon />
                {b.zadachi.length} заданий
              </span>
              <span className="prep-card__bottom">
                <Opornye2Meter id={b.id} total={b.zadachi.length} title={b.nazvanie} />
                <span className="prep-card__start">Начать →</span>
              </span>
            </PrepCardLink>
          </li>
        ))}
      </ul>

      <RazobrannyeZadachi pool={pool} />
    </>
  );
}
