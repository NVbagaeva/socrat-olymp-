import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import './steklo.css';

/**
 * Кирпичи «Стеклянной сцены» для карты задания и тренажёра: значок
 * группы, полоса доли, метка, шаги решения. Без знания о номере
 * задания — те же кирпичи пойдут на №7, №5 и остальные разделы.
 *
 * Тон — цвет группы: синий, тёмно-синий, оранжевый, терракотовый,
 * зелёный. Значения токенов — в steklo.css.
 */

export type Ton = 'blue' | 'navy' | 'orange' | 'terra' | 'green';

export { Ikonka, type IkonkaName } from './Ikonka';

/** Значок группы: формула (готовый HTML KaTeX) в стеклянном квадрате. */
export function Znak({
  html,
  ton,
  size = 'md',
  className,
}: {
  html: string;
  ton: Ton;
  size?: 'md' | 'sm';
  className?: string;
}) {
  return (
    <span
      className={clsx('stk-znak', `stk-ton--${ton}`, size === 'sm' && 'stk-znak--sm', className)}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Полоса доли: верных среди решённых, решённых среди всех. */
export function Polosa({
  dolya,
  ton = 'blue',
  className,
}: {
  /** 0…1. */
  dolya: number;
  ton?: 'blue' | 'terra' | 'green';
  className?: string;
}) {
  const width = Math.round(Math.max(0, Math.min(1, dolya)) * 100);
  return (
    <span className={clsx('stk-polosa', `stk-polosa--${ton}`, className)} aria-hidden="true">
      <span style={{ width: `${width}%` }} />
    </span>
  );
}

/** Маленькая метка: «Стоит повторить», название типа над задачей. */
export function Metka({
  children,
  ton = 'blue',
  className,
}: {
  children: ReactNode;
  ton?: 'blue' | 'terra' | 'green' | 'grey';
  className?: string;
}) {
  return <span className={clsx('stk-metka', `stk-metka--${ton}`, className)}>{children}</span>;
}

export interface Shag {
  /** Что делаем и почему: HTML (формулы уже набраны). */
  chtoHtml: string;
  /** Формула шага: HTML KaTeX. */
  formulaHtml: string;
}

/** Решение по шагам: номер, подпись «что делаем», формула. */
export function ShagiResheniya({ shagi, className }: { shagi: Shag[]; className?: string }) {
  return (
    <ol className={clsx('stk-shagi', className)}>
      {shagi.map((shag, i) => (
        <li className="stk-shag" key={i}>
          <p className="stk-shag__chto" dangerouslySetInnerHTML={{ __html: shag.chtoHtml }} />
          <div
            className="stk-shag__formula"
            dangerouslySetInnerHTML={{ __html: shag.formulaHtml }}
          />
        </li>
      ))}
    </ol>
  );
}

/** Стеклянная карточка: общая поверхность. */
export function Steklo({
  children,
  className,
  warm = false,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  warm?: boolean;
  as?: 'div' | 'section' | 'article' | 'aside';
}) {
  return <Tag className={clsx('stk-glass', warm && 'stk-glass--warm', className)}>{children}</Tag>;
}
