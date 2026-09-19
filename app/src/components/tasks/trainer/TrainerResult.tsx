import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { trainerKindTitle, trainerResult } from '@/content/trainerModes';

/** Чем закончилось задание: решено само или пройдено по подсказке. */
export type TrainerMark = 'right' | 'hinted';

/** Итогу нужен от задания только его тип. */
export interface ResultTask {
  kind: string;
}

export interface TrainerResultProps {
  tasks: readonly ResultTask[];
  marks: Record<number, TrainerMark>;
  /** Сколько раз ответ не сошёлся: и в поле ответа, и на шагах. */
  misses: number;
  /** Сколько секунд заняла тренировка. */
  seconds: number;
  /** Куда ведёт кнопка возврата. */
  backHref: string;
  /** Собрать новый подход: другие задания и другой порядок. */
  onAgain: () => void;
  /**
   * Название типа задания по его идентификатору — для статистики.
   * По умолчанию — наборы движка задания №12.
   */
  kindTitle?: Record<string, string>;
}

/** «5 мин 12 с». Часы не нужны: подход столько не длится. */
function timeText(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return minutes === 0 ? `${rest} с` : `${minutes} мин ${rest} с`;
}

interface KindRow {
  title: string;
  right: number;
  total: number;
}

/* Задания одного типа идут одной строкой в том порядке, в котором
   встретились: в смешанном режиме это порядок самой тренировки. */
function kindRows(
  tasks: readonly ResultTask[],
  marks: Record<number, TrainerMark>,
  kindTitle: Record<string, string>,
): KindRow[] {
  const rows: KindRow[] = [];
  tasks.forEach((task, index) => {
    const title = kindTitle[task.kind] ?? task.kind;
    const found = rows.find((row) => row.title === title);
    const row = found ?? { title, right: 0, total: 0 };
    if (found === undefined) {
      rows.push(row);
    }
    row.total += 1;
    if (marks[index] === 'right') {
      row.right += 1;
    }
  });
  return rows;
}

/**
 * Итог тренировки.
 *
 * Считается только то, что ученик сделал сам: задача, пройденная
 * по шагам подсказки, в правильные не идёт и стоит отдельной строкой.
 */
export function TrainerResult({
  tasks,
  marks,
  misses,
  seconds,
  backHref,
  onAgain,
  kindTitle = trainerKindTitle,
}: TrainerResultProps) {
  const total = tasks.length;
  const right = tasks.filter((_, index) => marks[index] === 'right').length;
  const hinted = tasks.filter((_, index) => marks[index] === 'hinted').length;
  const percent = total === 0 ? 0 : Math.round((right / total) * 100);

  return (
    <section className="tdone">
      {/* Кубок — акцент, а не главный объект экрана: высота примерно
          как два ряда текста. */}
      <Image
        className="tdone__cup"
        src="/images/trophy-glass.webp"
        alt={trainerResult.trophyAlt}
        width={1147}
        height={1201}
      />

      <header className="tdone__head">
        <h3 className="tdone__title">{trainerResult.title}</h3>
        <p className="tdone__lead">{trainerResult.lead}</p>
      </header>

      <div className="tdone__score">
        <p className="tdone__cell">
          <span className="tdone__big">
            {right} / {total}
          </span>
          <span className="tdone__cap">{trainerResult.scoreLabel}</span>
        </p>
        <p className="tdone__cell">
          <span className="tdone__big">{percent}%</span>
          <span className="tdone__cap">{trainerResult.percentLabel}</span>
        </p>
      </div>

      <dl className="tdone__rows">
        <div className="tdone__row">
          <dt>{trainerResult.rows.total}</dt>
          <dd>{total}</dd>
        </div>
        <div className="tdone__row">
          <dt>{trainerResult.rows.right}</dt>
          <dd>{right}</dd>
        </div>
        <div className="tdone__row">
          <dt>{trainerResult.rows.wrong}</dt>
          <dd>{misses}</dd>
        </div>
        <div className="tdone__row">
          <dt>{trainerResult.rows.hinted}</dt>
          <dd>{hinted}</dd>
        </div>
        <div className="tdone__row">
          <dt>{trainerResult.rows.time}</dt>
          <dd>{timeText(seconds)}</dd>
        </div>
      </dl>

      <section className="tdone__kinds">
        <h4 className="tdone__kinds-title">{trainerResult.kinds}</h4>
        <ul className="tdone__list">
          {kindRows(tasks, marks, kindTitle).map((row) => (
            <li className="tkind" key={row.title}>
              <span className="tkind__name">{row.title}</span>
              <span className="tkind__bar">
                <span
                  className="tkind__fill"
                  style={{ width: `${row.total === 0 ? 0 : (row.right / row.total) * 100}%` }}
                />
              </span>
              <span className="tkind__score">
                {row.right}/{row.total}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="tdone__actions">
        <Button onClick={onAgain}>{trainerResult.again}</Button>
        <Link className="btn btn--ghost" href={backHref}>
          {trainerResult.back}
        </Link>
      </div>
    </section>
  );
}
