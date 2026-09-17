'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { Button, Input } from '@/components/ui';
import { sameNumber } from '@/lib/answer';
import type { TrainerTask } from '@/lib/trainer';
import { RightIcon, WrongIcon } from '../prep/PrepIcons';

export interface TrainerScreenProps {
  /** Десять заданий подхода, собранные на сборке. */
  tasks: TrainerTask[];
}

/* Обе плашки обратной связи: заголовки дословные, без «Неверно». */
const VERDICT = {
  right: { title: 'Верно!' },
  wrong: { title: 'Есть ошибка' },
};

/**
 * Экран задания тренажёра.
 *
 * Ученик видит условие, чертёж и одно поле — для итогового ответа:
 * решает он на бумаге, как и на экзамене. Промежуточных полей здесь
 * нет, они появятся в цепочке подсказки.
 *
 * Все задания подхода приходят готовыми пропсами и живут на одном
 * экране: смена задания — это состояние, а не переход по адресу.
 */
export function TrainerScreen({ tasks }: TrainerScreenProps) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);

  const found = tasks[index];
  if (found === undefined) {
    /* Набор пуст — показывать нечего. В данных такого не бывает, но
       обращение по индексу в TypeScript честно необязательно. */
    return null;
  }
  const task: TrainerTask = found;
  const total = tasks.length;
  const last = index === total - 1;
  const ready = value.trim() !== '';

  function check() {
    setChecked(sameNumber(value, task.answer) ? 'right' : 'wrong');
  }

  function next() {
    setIndex(index + 1);
    setValue('');
    setChecked(null);
  }

  return (
    <section className="ttask">
      <p className="ttask__count">
        Задание <b>{task.no}</b> из {total}
      </p>

      {/* Полоса подхода: пройденные задания залиты, текущее подсвечено. */}
      <ol className="ttask__bar" aria-hidden="true">
        {tasks.map((item, i) => (
          <li
            key={item.id}
            className={clsx('ttask__dot', i < index && 'is-done', i === index && 'is-current')}
          />
        ))}
      </ol>

      <article className="ptask__card">
        <div className="ptask__text">
          {/* Условие собрал движок, формулы набрал KaTeX — обе
              на сборке. */}
          <div className="ptask__question" dangerouslySetInnerHTML={{ __html: task.questionHtml }} />
          {task.chartSvg === null ? null : (
            <span className="chart ptask__chart" dangerouslySetInnerHTML={{ __html: task.chartSvg }} />
          )}
        </div>
      </article>

      <div className="ttask__answer">
        <p className="ptask__label" id="ttask-answer-label">
          Ваш ответ:
        </p>
        <Input
          className="ttask__input"
          value={value}
          state={checked === null ? 'default' : checked === 'right' ? 'success' : 'error'}
          inputMode="text"
          autoComplete="off"
          aria-labelledby="ttask-answer-label"
          readOnly={checked === 'right'}
          onChange={(event) => {
            setValue(event.target.value);
            /* Ученик правит ответ — прошлая отметка уже не про него. */
            if (checked === 'wrong') {
              setChecked(null);
            }
          }}
        />

        {checked === null ? null : (
          <div className={clsx('tverdict', `tverdict--${checked}`)} role="status">
            <p className="tverdict__title">
              <span className="tverdict__ico">
                {checked === 'right' ? <RightIcon /> : <WrongIcon />}
              </span>
              {VERDICT[checked].title}
            </p>
            {/* Пояснение пришло вместе с заданием: при ошибке оно
                говорит, что проверить, и ответа не выдаёт. */}
            <p
              className="tverdict__text"
              dangerouslySetInnerHTML={{
                __html: checked === 'right' ? task.rightHint : task.wrongHint,
              }}
            />
          </div>
        )}

        <div className="ttask__actions">
          {checked === 'right' ? (
            last ? null : <Button onClick={next}>Следующее задание →</Button>
          ) : (
            <Button onClick={check} disabled={!ready}>
              Проверить
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
