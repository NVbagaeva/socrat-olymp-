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

/**
 * Значок группы в стеклянном квадрате: формула (готовый HTML KaTeX)
 * или фигура — маленький рисунок тела (стереометрия, планиметрия).
 */
export function Znak({
  html,
  figura,
  ton,
  size = 'md',
  className,
}: {
  html: string;
  /** Рисунок вместо формулы: готовый узел (SVG). */
  figura?: ReactNode;
  ton: Ton;
  size?: 'md' | 'sm';
  className?: string;
}) {
  if (figura !== undefined) {
    return (
      <span
        className={clsx(
          'stk-znak stk-znak--figura',
          `stk-ton--${ton}`,
          size === 'sm' && 'stk-znak--sm',
          className,
        )}
        aria-hidden="true"
      >
        {figura}
      </span>
    );
  }
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
  /** Формула шага: HTML KaTeX. Пустая строка — шаг без выкладки. */
  formulaHtml: string;
  /** Короткое название шага над подписью: «ОДЗ», «Отбор корней» (уравнения). */
  zagolovok?: string;
  /** То же название, набранное KaTeX (у №6 в названии этапа бывает формула). */
  zagolovokHtml?: string;
  /**
   * Шаг, который нельзя пропустить: 'odz' — область допустимых значений,
   * 'otbor' — отбор корней. Выделяется цветом и на листе, и в тренажёре.
   * 'vnimanie' — «Внимание на формулировку» (№13): та же тёплая плашка.
   */
  ton?: 'odz' | 'otbor' | 'vnimanie';
  /** Таблица или рисунок шага (№6: таблица решения, дерево с выделением). */
  risunok?: ReactNode;
}

/** Признак делимости под решением: «На 4» и правило с примером (HTML). */
export interface PriznakDelimosti {
  title: string;
  html: string;
}

/**
 * Решение по шагам: номер, подпись «что делаем», формула. Под шагами,
 * если сокращение держится на признаках делимости, — сворачиваемая
 * панель с ними.
 */
export function ShagiResheniya({
  shagi,
  delimost = [],
  delimostTitle = 'Признаки делимости',
  className,
  posle,
}: {
  shagi: Shag[];
  delimost?: PriznakDelimosti[];
  delimostTitle?: string;
  className?: string;
  /** Под шагами: своя сворачиваемая панель раздела («Считаем с умом» у №7). */
  posle?: ReactNode;
}) {
  return (
    <div className={clsx('stk-reshenie', className)}>
      <ol className="stk-shagi">
        {shagi.map((shag, i) => (
          <li
            className={clsx('stk-shag', shag.ton !== undefined && `stk-shag--${shag.ton}`)}
            key={i}
          >
            {shag.zagolovokHtml !== undefined ? (
              <p
                className="stk-shag__zag"
                dangerouslySetInnerHTML={{ __html: shag.zagolovokHtml }}
              />
            ) : shag.zagolovok === undefined ? null : (
              <p className="stk-shag__zag">{shag.zagolovok}</p>
            )}
            <div className="stk-shag__chto" dangerouslySetInnerHTML={{ __html: shag.chtoHtml }} />
            <div
              className="stk-shag__formula"
              dangerouslySetInnerHTML={{ __html: shag.formulaHtml }}
            />
            {shag.risunok === undefined ? null : (
              <div className="stk-shag__risunok">{shag.risunok}</div>
            )}
          </li>
        ))}
      </ol>
      {delimost.length === 0 ? null : (
        <details className="stk-delimost">
          <summary className="stk-summary">
            {delimostTitle}
            <span className="stk-shevron" aria-hidden="true" />
          </summary>
          <ul>
            {delimost.map((item) => (
              <li key={item.title}>
                <b>{item.title}:</b> <span dangerouslySetInnerHTML={{ __html: item.html }} />
              </li>
            ))}
          </ul>
        </details>
      )}
      {posle}
    </div>
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
