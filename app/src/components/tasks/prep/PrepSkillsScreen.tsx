import Image from 'next/image';
import type { ReactNode } from 'react';
import { prepPage } from '@/content/prepSkills';
import type { PrepSkillId } from '@/content/prepSkills';
import { PrepCardMeter } from './PrepCardMeter';
import { PrepCardLink } from './PrepScroll';
import { TaskCountIcon } from './PrepIcons';

export interface PrepSkillItem {
  id: PrepSkillId;
  no: string;
  title: string;
  lead: string;
  total: number;
  /** Адрес тренажёра навыка. */
  href: string;
  /** Миниатюра чертежа: её собирает движок на сервере. */
  chart: ReactNode;
  /** Формула рядом с чертежом, набранная KaTeX. Есть не у всех. */
  formula: ReactNode;
}

export interface PrepSkillsScreenProps {
  items: PrepSkillItem[];
}

/**
 * Экран списка навыков подготовительных задач.
 *
 * Один и тот же экран стоит вкладкой на странице темы и отдельной
 * страницей опорных задач: второй разметки для него в проекте нет.
 *
 * Заголовок вкладки, счётчик и ряд навыков живут в общей оболочке
 * PrepShell — они не принадлежат списку и не уходят вместе с ним.
 */
export function PrepSkillsScreen({ items }: PrepSkillsScreenProps) {
  return (
    <>
      <ul className="prep__grid">
        {items.map((item) => (
          <li key={item.id}>
            {/* Кликабельна вся карточка: «Начать» внутри — часть ссылки,
                а не вторая кнопка, иначе фокус ловил бы её отдельно. */}
            <PrepCardLink className="prep-card" href={item.href}>
              <span className="prep-card__no" aria-hidden="true">
                {item.no}
              </span>
              <span className="prep-card__text">
                <span className="prep-card__title">{item.title}</span>
                <span className="prep-card__lead">{item.lead}</span>
                {item.formula}
              </span>
              {/* Чертёж занимает две строки сетки — свою и строку
                  со счётчиком: иначе он один растягивал верхний ряд
                  и под описанием зияла пустота. */}
              <span className="prep-card__chart">{item.chart}</span>

              <span className="prep-card__count">
                <TaskCountIcon />
                {item.total} заданий
              </span>

              <span className="prep-card__bottom">
                <PrepCardMeter id={item.id} total={item.total} title={item.title} />
                <span className="prep-card__start">Начать →</span>
              </span>
            </PrepCardLink>
          </li>
        ))}
      </ul>

      <figure className="prep-quote">
        {/* Бюст — декор, подпись к нему не читается: автор назван
            текстом рядом. Фон у файла прозрачный. */}
        <Image
          className="prep-quote__art"
          src="/images/bust-aristotle-glass.webp"
          alt=""
          width={1027}
          height={1505}
          loading="lazy"
        />
        <div className="prep-quote__body">
          <blockquote className="prep-quote__text">«{prepPage.quote.text}»</blockquote>
          <figcaption className="prep-quote__author">— {prepPage.quote.author}</figcaption>
        </div>
      </figure>
    </>
  );
}
