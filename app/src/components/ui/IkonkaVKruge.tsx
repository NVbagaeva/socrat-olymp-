import { clsx } from 'clsx';
import { useId } from 'react';
import type { ReactNode } from 'react';
import './ikonka-v-kruge.css';

/**
 * Значок в светло-голубом стеклянном круге — общая рамка значков
 * разделов: тела №3 (stereo/IkonkaTela), блоки №1
 * (planimetriya/IkonkaBloka1), темы генераторов (generator/IkonkiTem).
 *
 * Рамка одна: круг, viewBox 0 0 40 40, рисунок в рамке ≈ 24×24, заливка
 * «стекло» — свой градиент у каждого значка. Рисунок собирается из
 * классов ikonka-v-kruge.css (IT ниже), цвета — только из токенов.
 */

/** Классы частей рисунка. */
export const IT = {
  /** Видимая линия: ребро, контур, график. */
  v: 'it-v',
  /** Невидимое ребро, вспомогательная линия — тонкий пунктир. */
  h: 'it-h',
  /** Акцент — главное в теме, оранжевым. */
  a: 'it-a',
  /** Акцент пунктиром. */
  ah: 'it-a it-a--h',
  /** Отмеченная точка — оранжевая с белой каймой. */
  t: 'it-t',
  /** Узел, точка графика — синяя заливка. */
  p: 'it-p',
  /** Ось координат. */
  o: 'it-o',
  /** Белая заливка поверх стекла: колёса, карандаш. */
  w: 'it-w',
  /** Буква или число: курсив, синий. */
  x: 'it-x',
  /** Буква или число акцентом. */
  xa: 'it-x it-x--a',
  /** Прямой шрифт: «log», цифры. */
  xr: 'it-x it-x--r',
} as const;

export interface IkonkaVKrugeProps {
  /** Рисунок; steklo — url(#…) заливки «стекло» этого значка. */
  risunok: (steklo: string) => ReactNode;
  /** Подпись для чтения с экрана; нет — значок скрыт (название рядом текстом). */
  label?: string;
  className?: string;
}

export function IkonkaVKruge({ risunok, label, className }: IkonkaVKrugeProps) {
  /* Своя заливка у каждого значка: id из useId без двоеточий — так
     ссылку url(#…) понимают все браузеры, включая Safari. */
  const id = `it-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <span
      className={clsx('ikonka-tela', className)}
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    >
      <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" className="it-g0" />
            <stop offset="1" className="it-g1" />
          </linearGradient>
        </defs>
        {risunok(`url(#${id})`)}
      </svg>
    </span>
  );
}

/** Запасной значок — метка (римская цифра, буква) в том же круге. */
export function IkonkaNomer({
  nomer,
  label,
  className,
}: {
  nomer: string;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={clsx('ikonka-tela ikonka-tela--nomer', className)}
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    >
      <span aria-hidden="true" className="no-math-check">
        {nomer}
      </span>
    </span>
  );
}
