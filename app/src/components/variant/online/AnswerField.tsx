'use client';

import { useId, useRef } from 'react';
import {
  AnswerKeypad,
  Button,
  Input,
  applyKey,
  useCoarsePointer,
  type KeypadKey,
} from '@/components/ui';
import type { FieldState } from '@/components/ui';
import { ONLINE_TEXT as T } from '@/content/variantOnline/text';
import { normalizeAnswer, type FormatProblem } from '@/lib/variant/online/normalize';

export interface AnswerFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Подсказка о формате — текст под полем. */
  problem: string | null;
  readOnly: boolean;
  state: FieldState;
  /** Кнопка «Проверить» (тренировка). null — кнопки нет. */
  action: { label: string; onClick: () => void; busy: boolean } | null;
  /** Контрольная: подсказка о формате по ходу ввода. */
  onFormat: (problem: FormatProblem | null) => void;
  /** Контрольная: ответ сохранён. */
  saved: boolean;
}

/**
 * Поле ответа ЕГЭ. На телефоне — своя клавиатура (цифры, запятая,
 * минус, стереть), системная не открывается. На компьютере — обычный
 * ввод. Неверная запись («1/2», буквы, пробелы) — подсказка о формате,
 * а не ошибка.
 */
export function AnswerField({
  value,
  onChange,
  problem,
  readOnly,
  state,
  action,
  onFormat,
  saved,
}: AnswerFieldProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const coarse = useCoarsePointer();

  const change = (next: string) => {
    onChange(next);
    if (action === null) {
      const n = normalizeAnswer(next);
      onFormat(n.ok || n.problem === 'empty' ? null : n.problem);
    }
  };

  const onKey = (key: KeypadKey) => {
    if (readOnly) return;
    change(applyKey(value, key));
  };

  return (
    <form
      className="vo-answer"
      onSubmit={(e) => {
        e.preventDefault();
        if (action !== null && !readOnly) action.onClick();
      }}
    >
      <label className="vo-answer__label" htmlFor={id}>
        {T.run.answer}
      </label>
      <div className="vo-answer__row">
        <Input
          ref={input}
          id={id}
          className="vo-answer__input"
          value={value}
          readOnly={readOnly}
          inputMode={coarse ? 'none' : 'decimal'}
          autoComplete="off"
          spellCheck={false}
          placeholder={T.run.placeholder}
          state={problem !== null ? 'error' : state}
          aria-describedby={`${id}-hint`}
          data-testid="vo-input"
          onChange={(e) => change(e.target.value)}
        />
        {action === null ? null : (
          <Button
            type="submit"
            loading={action.busy}
            disabled={readOnly || value.trim() === ''}
            data-testid="vo-check"
          >
            {action.label}
          </Button>
        )}
      </div>
      <p
        id={`${id}-hint`}
        className={problem === null ? 'vo-answer__hint' : 'vo-answer__hint is-problem'}
        aria-live="polite"
      >
        {problem ?? (saved ? T.run.saved : T.start.answerFormat)}
      </p>
      {coarse && !readOnly ? (
        <AnswerKeypad label={T.keypad.label} names={T.keypad} onKey={onKey} />
      ) : null}
    </form>
  );
}
