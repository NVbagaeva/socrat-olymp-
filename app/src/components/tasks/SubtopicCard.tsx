'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui';
import { RazdelIkonka } from '@/components/tasks/razdely/RazdelIkonka';
import type { IkonkaRazdela } from '@/components/tasks/razdely/types';
import { pickSubtopic, useSubtopicPicked } from '@/lib/subtopicPick';

export interface SubtopicCardProps {
  /** Название подтемы или раздела. */
  name: string;
  /** Адрес. null — страниц у подтемы нет, карточка не кликается. */
  href: string | null;
  /**
   * Подтема ещё не открыта: бейдж «Скоро» вместо стрелки. С адресом
   * это предпросмотр — карточка ведёт на страницы, но бейдж остаётся.
   */
  soon?: boolean;
  /** Подпись под названием: у №12 — название графика, «График — парабола». */
  caption?: string;
  /**
   * Иконка раздела (у №12). Не задана — раскладка прежняя: текст и
   * стрелка без картинки. С иконкой: на компьютере текст слева, иконка
   * справа сверху, стрелка внизу справа; на телефоне иконка слева.
   */
  icon?: IkonkaRazdela | undefined;
  /**
   * Формула, свёрстанная KaTeX на сборке. Есть у типов функций
   * задания №12; у разделов стереометрии формулы нет.
   */
  formulaHtml?: string;
  /**
   * Чертёж-миниатюра. Есть у разделов стереометрии. Декоративный:
   * карточка целиком — ссылка, и отдельного описания ему не нужно.
   */
  media?: ReactNode;
  /**
   * Строка под названием: сколько прототипов, сколько решено.
   * Не задана — строки нет. Прогресс, которого нет, не выдумывается.
   */
  meta?: ReactNode;
}

/**
 * Карточка подтемы раздела.
 *
 * Одна на задание №12 и на задание №3: и типы функций, и разделы
 * стереометрии выбираются одинаково, поэтому вид, состояния и обход
 * с клавиатуры у них общие. Отличается только начинка — у №12
 * формула, у №3 чертёж и число прототипов, и то и другое приходит
 * сюда готовым.
 *
 * Стрелка в покое серая: синей она становится только у карточки, на
 * которую нажали последней (lib/subtopicPick.ts). Иначе на странице
 * все стрелки синие сразу, и выделение ничего не выделяет.
 */
export function SubtopicCard({
  name,
  href,
  soon = href === null,
  caption,
  icon,
  formulaHtml,
  media,
  meta,
}: SubtopicCardProps) {
  const picked = useSubtopicPicked(href);
  const body = (
    <>
      {icon === undefined ? null : (
        <RazdelIkonka
          icon={icon}
          sizes="(min-width: 768px) 112px, 88px"
          soon={soon}
          className="subtopic__ico"
        />
      )}
      {media !== undefined ? (
        <span className="subtopic__media" aria-hidden="true">
          {media}
        </span>
      ) : null}

      <span className="subtopic__head">
        <span className="subtopic__name">{name}</span>
        {caption === undefined ? null : <span className="subtopic__caption">{caption}</span>}
        {/* Формула свёрстана на сборке: обычным текстом она не выводится. */}
        {formulaHtml !== undefined ? (
          <span
            className="subtopic__formula"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: formulaHtml }}
          />
        ) : null}
      </span>

      {meta !== undefined ? <span className="subtopic__note">{meta}</span> : null}

      {soon ? (
        <span className="subtopic__meta">
          <Badge>Скоро</Badge>
        </span>
      ) : (
        /* Стрелка — span, а не кнопка: карточка уже ссылка, вложенный
           элемент управления сломал бы обход с клавиатуры. */
        <span className="subtopic__go" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M5 12h13M12 6l6 6-6 6" />
          </svg>
        </span>
      )}
    </>
  );

  if (href === null) {
    return (
      <span
        className={
          icon === undefined
            ? 'subtopic subtopic--soon'
            : 'subtopic subtopic--soon subtopic--ikonka'
        }
        aria-disabled="true"
      >
        {body}
      </span>
    );
  }
  return (
    <Link
      className={clsx('subtopic', picked && 'is-picked', icon !== undefined && 'subtopic--ikonka')}
      href={href}
      onClick={() => pickSubtopic(href)}
    >
      {body}
    </Link>
  );
}
