'use client';

import { useState } from 'react';
import type { TrainerTask } from '@/lib/trainer';
import { PrepSolution } from '../prep/PrepSolution';

/**
 * Разбор задания на итоговом экране: тот же, что открывает кнопка
 * «Показать решение» во время тренировки, и верный ответ над ним.
 */
export function TrainerReview({ task }: { task: TrainerTask }) {
  const [step, setStep] = useState(0);
  const option = task.options?.find((item) => item.number === task.answer);
  return (
    <div className="tsum__answer">
      <p>
        Верный ответ:{' '}
        {option === undefined ? (
          <b>{task.answer}</b>
        ) : (
          <>
            <b>{option.number}</b>{' '}
            <span dangerouslySetInnerHTML={{ __html: option.html }} />
          </>
        )}
      </p>
      {task.solution === null ? (
        task.rightHint === '' ? null : (
          <p dangerouslySetInnerHTML={{ __html: task.rightHint }} />
        )
      ) : (
        <PrepSolution
          steps={task.solution}
          tip={task.method?.tip ?? ''}
          step={step}
          onStep={setStep}
          onClose={() => setStep(0)}
        />
      )}
    </div>
  );
}
