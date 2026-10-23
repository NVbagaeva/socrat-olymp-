import { OPORNYE_1 } from '@/content/zadanie1';
import { BANK_FIPI } from '@/lib/planimetriya/bank/fipi';
import type { PoolBlok } from '@/lib/planimetriya/prep/pool';
import { PROTOTIPY } from '@/lib/planimetriya/stseny';
import { TaskCountIcon } from '../prep/PrepIcons';
import { PrepCardLink } from '../prep/PrepScroll';
import { Opornye1Meter } from './Opornye1Counter';
import { Razbor1 } from './Razbor1';
import { paramsZadachi } from './RazborTipa1';

export interface Opornye1ListProps {
  bloki: PoolBlok[];
  listHref: string;
}

const BLOKI_PROTOTIPOV: [string, string][] = [
  ['I', 'Углы в треугольнике'],
  ['II', 'Четырёхугольники и точки пересечения'],
  ['III', 'Площадь, теорема Пифагора'],
  ['IV', 'Подобие, средняя линия'],
  ['V', 'Синус, косинус, тангенс'],
  ['VI', 'Центральные и вписанные углы, касательные'],
  ['VII', 'Вписанная окружность'],
  ['VIII', 'Описанная окружность'],
  ['IX', 'Теорема синусов'],
  ['X', 'Дополнительные темы (не из открытого банка)'],
];

/**
 * Список вкладки «Опорные задачи» №1: карточки блоков тренировок
 * (номер, название, описание, счётчик — без формул), под ними —
 * разобранная задача на каждый прототип. Разборы свёрнуты по блокам
 * прототипов: страница длинная, открывают нужный.
 */
export function Opornye1List({ bloki, listHref }: Opornye1ListProps) {
  return (
    <>
      <h3 className="t-h3 z1-prep__sub" id="z1-trenirovki">
        {OPORNYE_1.trenirovkiTitle}
      </h3>
      <p className="z1-prep__lead">{OPORNYE_1.trenirovkiLead}</p>
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
                <Opornye1Meter id={b.id} total={b.zadachi.length} title={b.nazvanie} />
                <span className="prep-card__start">Начать →</span>
              </span>
            </PrepCardLink>
          </li>
        ))}
      </ul>

      <section className="z1-razobrannye" aria-labelledby="z1-razobrannye-title">
        <h3 className="t-h3 z1-prep__sub" id="z1-razobrannye-title">
          {OPORNYE_1.razobrannyeTitle}
        </h3>
        <p className="z1-prep__lead">{OPORNYE_1.razobrannyeLead}</p>
        {BLOKI_PROTOTIPOV.map(([blok, nazvanie]) => (
          <details className="z1-op-group" key={blok}>
            <summary className="z1-op-group__title">
              <span className="z1-op-group__code" aria-hidden="true">
                {blok}
              </span>
              {nazvanie}
            </summary>
            {PROTOTIPY.filter((p) => p.blok === blok).map((p) => {
              const n = BANK_FIPI.find((z) => z.proto === p.id)?.n ?? 0;
              return (
                <Razbor1
                  key={p.id}
                  id={`op-${p.id}`}
                  proto={p.id}
                  params={paramsZadachi(p.id, n)}
                  title={
                    n > 0 ? `Прототип ${p.id} · задача ${n} открытого банка` : `Прототип ${p.id}`
                  }
                />
              );
            })}
          </details>
        ))}
      </section>
    </>
  );
}
