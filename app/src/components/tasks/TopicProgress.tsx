'use client';

import { useId, useState } from 'react';
import { ProgressRing } from '@/components/ui';
import { METODY } from '@/content/metody';
import { OPORNYE } from '@/content/opornye';
import { usePrepProgress } from '@/lib/prepProgress';
import { useSectionsRead } from '@/lib/theoryRead';
import {
  itemDetail,
  progressSummary,
  progressText,
  type ProgressLabels,
  type ProgressPlan,
} from '@/lib/topicProgress';
import { useTrainerProgress } from '@/lib/trainerProgress';

export interface TopicProgressProps {
  /** Что есть в подтеме: разделы, методы, навыки, типы заданий. */
  plan: ProgressPlan;
  /** Ключ прочитанной теории: «theory:12:rational». */
  theoryKey: string;
  /** Ключ прочитанных методов: «methods:12:rational». */
  methodsKey: string;
}

/* Названия пунктов — как у вкладок подтемы. */
const LABELS: ProgressLabels = {
  theory: 'Теория',
  methods: METODY.title,
  prep: OPORNYE.title,
  trainer: 'Тренажёр',
};

/**
 * Прогресс подтемы в шапке: кольцо, подпись и список пунктов.
 *
 * Пункты — вкладки подтемы с содержанием, условия пройденного —
 * в lib/topicProgress.ts. Отметки читаются из хранилищ браузера
 * (теория и методы, опорные задачи, тренажёр); у каждой подтемы свои
 * ключи, поэтому подтемы друг на друга не влияют. На сервере хранилищ
 * нет, и первая отрисовка показывает ноль — как и у нового ученика.
 *
 * По нажатию на кольцо раскрывается список пунктов: что пройдено,
 * что нет и сколько осталось.
 */
export function TopicProgress({ plan, theoryKey, methodsKey }: TopicProgressProps) {
  const theoryRead = useSectionsRead(theoryKey);
  const methodsRead = useSectionsRead(methodsKey);
  const prep = usePrepProgress();
  const trainer = useTrainerProgress();
  const [open, setOpen] = useState(false);
  const listId = useId();

  const summary = progressSummary(plan, { theoryRead, methodsRead, prep, trainer }, LABELS);
  const text = progressText(summary);

  return (
    <div className="topic-progress">
      <button
        type="button"
        className="topic-progress__toggle"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
      >
        <ProgressRing value={summary.percent} label="пройдено" srLabel={text} />
        <span className="topic-progress__text">
          {text}
          <span className="topic-progress__more">{open ? 'Скрыть список' : 'Что пройдено'}</span>
        </span>
      </button>

      {open ? (
        <ul className="topic-progress__list" id={listId}>
          {summary.items.map((item) => (
            <li
              key={item.id}
              className={item.complete ? 'topic-progress__item is-done' : 'topic-progress__item'}
            >
              <span className="topic-progress__mark" aria-hidden="true">
                {item.complete ? (
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M5 12.5 10 17.5 19 7" />
                  </svg>
                ) : null}
              </span>
              <span className="topic-progress__label">
                {item.label}
                <span className="sr-only">{item.complete ? ' — пройдено' : ' — не пройдено'}</span>
                <span className="topic-progress__detail">{itemDetail(item)}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
