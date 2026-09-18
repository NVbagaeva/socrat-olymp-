import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui';

export interface SubtopicCardProps {
  /** Название подтемы или раздела. */
  name: string;
  /** Адрес. null — подтема ещё не открыта, карточка не кликается. */
  href: string | null;
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
 */
export function SubtopicCard({ name, href, formulaHtml, media, meta }: SubtopicCardProps) {
  const body = (
    <>
      {media !== undefined ? (
        <span className="subtopic__media" aria-hidden="true">
          {media}
        </span>
      ) : null}

      <span className="subtopic__head">
        <span className="subtopic__name">{name}</span>
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

      {href === null ? (
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
      <span className="subtopic subtopic--soon" aria-disabled="true">
        {body}
      </span>
    );
  }
  return (
    <Link className="subtopic" href={href}>
      {body}
    </Link>
  );
}
