import Image from 'next/image';
import type { ReactNode } from 'react';
import { OPORNYE } from '@/content/opornye';
import { EmptyState, HandNote, type Crumb } from '@/components/ui';
import { tasksPage } from '@/content/tasks';
import { PODTEMA_SKORO, type ExamSection, type Subtopic } from '@/content/sections';
import { findManifestFamily } from '@/lib/generator/manifest';
import { prototypeSkills } from './configurator';
import { GeneratorTab } from './generator';
import { PrepSkills } from './prep';
import { TrainerShell } from './trainer';
import { TopicAbout } from './TopicAbout';
import { theoryBodies } from './theory';
import { ShapkaRazdela } from './ShapkaRazdela';
import { TopicTabs } from './TopicTabs';

export interface FunctionTopicPageProps {
  section: ExamSection;
  subtopic: Subtopic;
  /**
   * Что открыто при заходе: у опорных задач своя вкладка, у
   * /dlya-repetitorov/ — раскрытое меню материалов.
   */
  initialTab?: string;
  /**
   * Содержимое вкладки подготовительных задач. По умолчанию это
   * список навыков; экран задачи подставляет себя сюда, чтобы шапка
   * темы, кольцо разделов и лента вкладок остались на месте.
   */
  prep?: ReactNode;
  /**
   * Содержимое вкладки тренажёра. По умолчанию это выбор типа
   * заданий; экран режима подставляет себя сюда, чтобы шапка темы
   * и лента вкладок остались на месте.
   */
  trainer?: ReactNode;
  /** Продолжение хлебных крошек: у экрана навыка это его название. */
  trail?: Crumb[];
}

/**
 * Страница типа функции — один шаблон на все шесть.
 *
 * Отличаются они только данными из конфига, поэтому шести страниц
 * в проекте нет и не будет: маршрут один, содержимое приходит из
 * data/functionTypes.ts.
 */
export function FunctionTopicPage({
  section,
  subtopic,
  initialTab,
  prep,
  trainer,
  trail = [],
}: FunctionTopicPageProps) {
  const { topic } = section;
  const base = `${tasksPage.href}/${section.slug}/${subtopic.id}`;
  /* Закрытая подтема: задач у неё нет, и страниц опорных задач и
     тренажёра в экспорте тоже нет — их адреса собираются только для
     открытых подтем (activeSubtopicParams). Поэтому вкладки остаются
     на месте, но ведут не по адресу, а к пустому состоянию: иначе
     нажатие уводило бы на 404, а до нажатия показывало бы навыки
     чужой подтемы — единственный собранный набор пока линейный. */
  const otkryta = subtopic.status === 'active';
  /* Вкладка «Генератор» есть только у семейства с наборами
     прототипов в данных движка: решает манифест, а не конфиг.
     У закрытой подтемы генерировать нечего. */
  const hasGenerator = otkryta && prototypeSkills(findManifestFamily(subtopic.id)).length > 0;

  return (
    <main className="app-main">
      <ShapkaRazdela
        className="topic-head"
        crumbs={[
          { label: 'Задания', href: tasksPage.href },
          {
            label: `№${section.no}. ${section.subtitle}`,
            href: `${tasksPage.href}/${section.slug}`,
          },
          { label: subtopic.title, href: trail.length === 0 ? undefined : base + '/' },
          ...trail,
        ]}
        title={subtopic.title}
        badge={topic.badge}
        lead={topic.lead}
        actions={
          /* Цитата стоит строкой под подзаголовком, а не колонкой
             рядом: деля ширину, они ломали друг друга. */
          <figure className="topic-quote">
            <blockquote className="topic-quote__text">
              <HandNote>«{topic.quote.text}»</HandNote>
            </blockquote>
            <figcaption className="topic-quote__author">— {topic.quote.author}</figcaption>
          </figure>
        }
        media={
          /* Портрет — декор: alt пустой, цитата рядом текстом. Кольца
             прогресса по теории здесь нет, пока нет честной отметки
             «раздел прочитан» (этап 4). */
          <Image
            className="topic-head__art"
            src="/images/bust-galileo.webp"
            alt=""
            width={814}
            height={700}
          />
        }
      />

      <TopicTabs
        initial={initialTab}
        about={<TopicAbout section={section} />}
        theory={subtopic.theory}
        bodies={theoryBodies}
        prep={
          prep ??
          (otkryta ? (
            <PrepSkills base={base} />
          ) : (
            <EmptyState
              title={PODTEMA_SKORO.prep.title}
              description={PODTEMA_SKORO.prep.description}
            />
          ))
        }
        prepHref={otkryta ? `${base}/${OPORNYE.tail}` : null}
        trainer={
          trainer ??
          (otkryta ? (
            <TrainerShell subtopic={subtopic} base={`${base}/trenazher/`} />
          ) : (
            <EmptyState
              title={PODTEMA_SKORO.trainer.title}
              description={PODTEMA_SKORO.trainer.description}
            />
          ))
        }
        trainerHref={otkryta ? `${base}/trenazher/` : null}
        generator={hasGenerator ? <GeneratorTab subtopic={subtopic} base={base} /> : undefined}
        tutors={section.tutors}
        contentsDecor={
          <div className="topic-side__decor" aria-hidden="true">
            <Image
              className="topic-side__pyramid"
              src="/images/pyramid-network.webp"
              alt=""
              width={1400}
              height={504}
            />
            <HandNote className="topic-side__note">{topic.note}</HandNote>
          </div>
        }
      />
    </main>
  );
}
