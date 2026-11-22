import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/ui';
import type { Crumb } from '@/components/ui';
import '@/components/tasks/steklo/steklo.css';
import './stsena.css';

export interface Tabletka {
  text: string;
  /** Значок слева: звезда у балла, часы у времени. */
  ikonka?: ReactNode;
  /** Тёплая таблетка — у балла, как на макете. */
  ton?: 'blue' | 'warm';
}

export interface StsenaShapkaProps {
  /** Крошки одной строкой. На телефоне и планшете скрыты: их место занимает переключатель. */
  crumbs: Crumb[];
  /**
   * Переключатель раздела «№3 Стереометрия ▾» — только на телефоне и
   * планшете, над шапкой. На компьютере навигацию по разделам не
   * дублируем: её хватает в крошках и в содержании.
   */
  pereklyuchatel?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** Таблетки под описанием: «Часть 1», «1 балл», «≈ 3 минуты». */
  tabletki?: readonly Tabletka[];
  /** Строка прогресса: «Решено 12 из 92» с полосой — клиентский островок. */
  progress?: ReactNode;
  /** Под прогрессом: кнопка «Продолжить подготовку» у №12. */
  actions?: ReactNode;
  /** Обложка справа: картинка, оживающая в 3D (ObjomnayaOblozhka). */
  media?: ReactNode;
  className?: string;
}

/**
 * Шапка раздела «Стеклянная сцена»: крошки, большая стеклянная карточка
 * с заголовком, описанием, таблетками и прогрессом слева и обложкой
 * справа. Свечение за обложкой, тёплый отсвет в углу и тень — CSS
 * (stsena.css), не картинка.
 *
 * Компонент общий; подключён пока только к №3 (ShellStereo). Лента
 * вкладок — общая RazdelTabs с модификатором topic-tabs-row--stsena.
 */
export function StsenaShapka({
  crumbs,
  pereklyuchatel,
  title,
  lead,
  tabletki,
  progress,
  actions,
  media,
  className,
}: StsenaShapkaProps) {
  return (
    <>
      <Breadcrumbs items={crumbs} className="stsena-crumbs" />
      {pereklyuchatel === undefined ? null : (
        <div className="stsena-pereklyuchatel">{pereklyuchatel}</div>
      )}
      <header className={clsx('stsena', media === undefined && 'stsena--text', className)}>
        <div className="stsena__text">
          <h1 className="t-h1 stsena__title">{title}</h1>
          {lead === undefined ? null : <p className="stsena__lead">{lead}</p>}
          {tabletki === undefined || tabletki.length === 0 ? null : (
            <ul className="stsena__tabletki">
              {tabletki.map((t) => (
                <li
                  key={t.text}
                  className={clsx('stsena__tabletka', t.ton === 'warm' && 'stsena__tabletka--warm')}
                >
                  {t.ikonka === undefined ? null : (
                    <span className="stsena__tabletka-ik" aria-hidden="true">
                      {t.ikonka}
                    </span>
                  )}
                  {t.text}
                </li>
              ))}
            </ul>
          )}
          {progress === undefined ? null : <div className="stsena__progress">{progress}</div>}
          {actions === undefined ? null : <div className="stsena__actions">{actions}</div>}
        </div>
        {media === undefined ? null : <div className="stsena__media">{media}</div>}
      </header>
    </>
  );
}

/** Звезда — у таблетки «1 балл». */
export function ZvezdaIkonka() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" />
    </svg>
  );
}

/** Часы — у таблетки «≈ 3 минуты». */
export function ChasyIkonka() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
