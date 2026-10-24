'use client';

import { clsx } from 'clsx';
import { useEffect, useState } from 'react';

/** Клавиша экранной клавиатуры. */
export type KeypadKey =
  '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | '-' | 'erase';

export interface AnswerKeypadProps {
  onKey: (key: KeypadKey) => void;
  label: string;
  /** Подписи клавиш для скринридера. */
  names: { minus: string; comma: string; erase: string };
  disabled?: boolean;
}

const ROWS: KeypadKey[][] = [
  ['1', '2', '3', '-'],
  ['4', '5', '6', ','],
  ['7', '8', '9', 'erase'],
  ['0'],
];

/**
 * Клавиатура для ответа ЕГЭ: цифры, запятая, минус, стереть.
 *
 * Нужна на телефоне: у системной цифровой клавиатуры iPhone нет минуса,
 * а «decimal» на разных телефонах то с запятой, то с точкой. Поле ответа
 * при этом открывается с inputMode="none" — системная клавиатура не
 * всплывает и не закрывает задачу.
 *
 * Кнопки не забирают фокус (preventDefault на pointerdown): курсор
 * остаётся в поле, и ввод с клавиатуры компьютера тоже работает.
 */
export function AnswerKeypad({ onKey, label, names, disabled = false }: AnswerKeypadProps) {
  const name = (k: KeypadKey) =>
    k === '-' ? names.minus : k === ',' ? names.comma : k === 'erase' ? names.erase : k;
  const face = (k: KeypadKey) => (k === '-' ? '−' : k === 'erase' ? '⌫' : k);
  return (
    <div className="keypad" role="group" aria-label={label}>
      {ROWS.flat().map((k) => (
        <button
          key={k}
          type="button"
          className={clsx(
            'keypad__key',
            k === '0' && 'keypad__key--zero',
            !/\d/.test(k) && 'keypad__key--sign',
          )}
          aria-label={name(k)}
          disabled={disabled}
          data-key={k}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => onKey(k)}
        >
          {face(k)}
        </button>
      ))}
    </div>
  );
}

/** Применить клавишу к строке ответа. */
export function applyKey(value: string, key: KeypadKey): string {
  if (key === 'erase') return value.slice(0, -1);
  if (key === '-') return value.startsWith('-') ? value.slice(1) : `-${value}`;
  if (key === ',') {
    if (/[.,]/.test(value)) return value;
    return /\d$/.test(value) ? `${value},` : `${value}0,`;
  }
  return value.length >= 20 ? value : value + key;
}

/**
 * Палец, а не мышь: на таких экранах показывается своя клавиатура.
 * До гидратации — false (разметка сборки одна для всех).
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return coarse;
}
