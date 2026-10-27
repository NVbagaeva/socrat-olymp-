'use client';

import { useEffect, useRef, useState } from 'react';
import type * as MathLive from 'mathlive';
import type { MathfieldElement } from 'mathlive';
import { Input } from '@/components/ui';

export interface MathPoleProps {
  /** Запись в TeX: «\frac{7\pi}{2}». */
  value: string;
  onChange: (value: string) => void;
  label: string;
  readOnly?: boolean;
  placeholder?: string;
  testId?: string;
}

type Mod = typeof MathLive;

let ready: Promise<Mod | null> | null = null;

/**
 * MathLive один раз на страницу: шрифты — те же KaTeX, что уже
 * подключены сайтом (katex.min.css), звуков нет — внешних запросов
 * поле не делает.
 */
function loadMathLive(): Promise<Mod | null> {
  ready ??= import('mathlive').then(
    (m) => {
      m.MathfieldElement.fontsDirectory = null;
      m.MathfieldElement.soundsDirectory = null;
      return m;
    },
    () => null,
  );
  return ready;
}

/**
 * Поле формулы: дроби, корни, π, степени. На телефоне — экранная
 * клавиатура MathLive, на компьютере — набор с клавиатуры («sqrt»,
 * «pi», «/» → дробь). Не загрузился MathLive — обычное поле, запись
 * вроде «7pi/2» автопроверка тоже разбирает.
 */
export function MathPole({
  value,
  onChange,
  label,
  readOnly = false,
  placeholder,
  testId,
}: MathPoleProps) {
  const host = useRef<HTMLSpanElement>(null);
  const field = useRef<MathfieldElement | null>(null);
  const change = useRef(onChange);
  useEffect(() => {
    change.current = onChange;
  }, [onChange]);
  const [mode, setMode] = useState<'loading' | 'math' | 'text'>('loading');

  useEffect(() => {
    let alive = true;
    void loadMathLive().then((m) => {
      if (!alive || host.current === null) return;
      if (m === null) {
        setMode('text');
        return;
      }
      const mf = new m.MathfieldElement();
      mf.setAttribute('aria-label', label);
      if (testId !== undefined) mf.setAttribute('data-testid', testId);
      mf.className = 'c2-math';
      /* Свойства поля доступны только после вставки в документ. */
      host.current.replaceChildren(mf);
      mf.mathVirtualKeyboardPolicy = 'auto';
      mf.smartFence = true;
      mf.menuItems = [];
      mf.value = value;
      mf.readOnly = readOnly;
      if (placeholder !== undefined) mf.placeholder = placeholder;
      mf.addEventListener('input', () => change.current(mf.value));
      field.current = mf;
      setMode('math');
    });
    return () => {
      alive = false;
      field.current?.remove();
      field.current = null;
    };
    /* Поле создаётся один раз; значение и «только чтение» — ниже. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mf = field.current;
    if (mf === null) return;
    if (mf.value !== value) mf.value = value;
    mf.readOnly = readOnly;
  }, [value, readOnly, mode]);

  if (mode === 'text') {
    return (
      <Input
        className="c2-math c2-math--text"
        value={value}
        readOnly={readOnly}
        aria-label={label}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        data-testid={testId}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return <span ref={host} className="c2-math-host" data-mode={mode} />;
}
