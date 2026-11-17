'use client';

import { useCallback } from 'react';
import { MathPole } from '@/components/chast2/MathPole';

/**
 * Поле формулы сборника: то же поле MathLive, что в части 2, но со
 * своей экранной клавиатурой — кнопки √, ⁿ√, дробь, степень, π, ∞, ∪,
 * модуль, промежутки и буквы условия. Клавиатура у MathLive одна на
 * страницу: раскладка ставится, когда фокус приходит в поле сборника.
 */

const KLAVIATURA = {
  label: '√ π ∞',
  tooltip: 'Корни, дроби, промежутки',
  rows: [
    [
      { latex: 'x' },
      { latex: 'a' },
      { latex: 'b' },
      { latex: 'c' },
      { latex: '\\frac{#@}{#?}', label: 'дробь', class: 'small' },
      { latex: '\\sqrt{#0}' },
      { latex: '\\sqrt[#?]{#0}' },
      { latex: '#@^{#?}', label: 'xⁿ' },
      { latex: '|#0|', label: '|x|' },
      { latex: '\\pi' },
    ],
    ['[7]', '[8]', '[9]', '[/]', { latex: '(' }, { latex: ')' }, { latex: '[' }, { latex: ']' }, { latex: ';', label: ';' }, { latex: '\\infty' }],
    ['[4]', '[5]', '[6]', '[*]', '[+]', '[-]', { latex: '\\cup' }, { latex: '\\le' }, { latex: '\\ge' }, { latex: '+\\infty', label: '+∞', class: 'small' }],
    ['[1]', '[2]', '[3]', '[0]', { latex: '{,}', label: ',' }, { latex: 'm' }, { latex: 'n' }, '[left]', '[right]', '[backspace]'],
  ],
};

interface MvkWindow {
  mathVirtualKeyboard?: { layouts: unknown };
}

function postavitKlaviaturu() {
  const w = window as unknown as MvkWindow;
  if (w.mathVirtualKeyboard !== undefined) {
    w.mathVirtualKeyboard.layouts = [KLAVIATURA, 'alphabetic'];
  }
}

export function SbornikPole({
  value,
  onChange,
  label,
  placeholder,
  readOnly = false,
  testId,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
  readOnly?: boolean;
  testId?: string;
}) {
  const onFocus = useCallback(() => postavitKlaviaturu(), []);
  return (
    <span className="sb-pole" onFocusCapture={onFocus} onPointerDownCapture={onFocus}>
      <MathPole
        value={value}
        onChange={onChange}
        label={label}
        placeholder={placeholder}
        readOnly={readOnly}
        testId={testId}
      />
    </span>
  );
}
