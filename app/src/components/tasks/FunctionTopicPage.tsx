import Image from 'next/image';
import type { ReactNode } from 'react';
import { OPORNYE } from '@/content/opornye';
import { Badge, Breadcrumbs, EmptyState, HandNote, type Crumb } from '@/components/ui';
import { prepSkillsFor } from '@/content/prepSkills';
import { tasksPage } from '@/content/tasks';
import { PODTEMA_SKORO, type ExamSection, type Subtopic } from '@/content/sections';
import { subtopicBuilt } from '@/data/functionTypes';
import { findManifestFamily } from '@/lib/generator/manifest';
import { aboutScene } from '@/lib/scenes';
import { prototypeSkills } from './configurator';
import { GeneratorTab } from './generator';
import { MethodsTab } from './MethodsTab';
import { PrepSkills } from './prep';
import { TrainerShell } from './trainer';
import { TopicAbout } from './TopicAbout';
import { TopicProgress } from './TopicProgress';
import { theoryBodies } from './theory';
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
  /* Вкладка ведёт по адресу только тогда, когда за ней есть материал
     этой подтемы: у опорных задач — список навыков, у тренажёра
     и генератора — наборы прототипов в данных движка. Иначе вкладка
     остаётся на месте и показывает пустое состояние: нажатие не
     уводит на 404, а до нажатия не показываются навыки чужой подтемы.
     Адреса под вкладки собираются по тем же условиям (lib/prep.ts,
     content/sections.ts). У закрытой подтемы страниц нет вовсе. */
  const built = subtopicBuilt(subtopic);
  const hasPrep = built && prepSkillsFor(subtopic.id).length > 0;
  const hasTrainer = built && prototypeSkills(findManifestFamily(subtopic.id)).length > 0;
  /* Чем подтема отличается от линейной — признаками в её конфиге;
     не задано — берётся общее для раздела. Плашка-подсказка вкладки
     «О задании» у раздела одна, подтема её не переопределяет. */
  const about =
    subtopic.about === undefined ? section.about : { ...subtopic.about, hint: section.about.hint };
  const tutors =
    subtopic.tutors === undefined ? section.tutors : { ...section.tutors, items: subtopic.tutors };

  return (
    <main className="app-main">
      <Breadcrumbs
        items={[
          { label: 'Задания', href: tasksPage.href },
          {
            label: `№${section.no}. ${section.subtitle}`,
            href: `${tasksPage.href}/${section.slug}`,
          },
          { label: subtopic.title, href: trail.length === 0 ? undefined : base + '/' },
          ...trail,
        ]}
      />

      <header className="topic-head">
        <div className="topic-head__text">
          <div className="topic-head__title">
            {/* Шапка по признаку подтемы: H1 общий на задание, название
                подтемы — подзаголовком. Без признака H1 — сама подтема. */}
            <h1 className="t-h1">
              {subtopic.head === undefined
                ? subtopic.title
                : `Задание №${section.no}. ${section.subtitle}`}
            </h1>
            <Badge tone="info">{topic.badge}</Badge>
          </div>
          {subtopic.head === undefined ? null : (
            <p className="t-h3 topic-head__subtitle">{subtopic.head.subtitle}</p>
          )}
          <p className="topic-head__lead">{topic.lead}</p>

          {/* Цитата стоит строкой под подзаголовком, а не колонкой
              рядом: деля ширину, они ломали друг друга. */}
          <figure className="topic-quote">
            <blockquote className="topic-quote__text">
              <HandNote>«{topic.quote.text}»</HandNote>
            </blockquote>
            <figcaption className="topic-quote__author">— {topic.quote.author}</figcaption>
          </figure>
        </div>

        {/* Портрет — декор: alt пустой, цитата рядом текстом. */}
        <Image
          className="topic-head__art"
          src="/images/bust-galileo.webp"
          alt=""
          width={814}
          height={700}
        />

        {/* Прогресс по разделам теории темы. Общее число — длина того же
            списка, из которого строится «Содержание»: второго источника
            у этой пары нет. */}
        {/* Кольцо: у подтемы с признаком — честный счёт по разделам,
            до конца которых ученик долистал; иначе витринное число. */}
        <TopicProgress
          total={subtopic.theory.length}
          trackKey={subtopic.theoryProgress === true ? `${section.slug}:${subtopic.id}` : undefined}
        />
      </header>

      <TopicTabs
        initial={initialTab}
        about={<TopicAbout section={section} about={about} scene={aboutScene(subtopic.id)} />}
        theory={subtopic.theory}
        bodies={theoryBodies}
        trackKey={subtopic.theoryProgress === true ? `${section.slug}:${subtopic.id}` : undefined}
        methods={subtopic.methods === true ? <MethodsTab /> : undefined}
        prep={
          prep ??
          (hasPrep ? (
            <PrepSkills type={subtopic.id} base={base} />
          ) : (
            <EmptyState
              title={PODTEMA_SKORO.prep.title}
              description={PODTEMA_SKORO.prep.description}
            />
          ))
        }
        prepHref={hasPrep ? `${base}/${OPORNYE.tail}` : null}
        trainer={
          trainer ??
          (hasTrainer ? (
            <TrainerShell subtopic={subtopic} base={`${base}/trenazher/`} />
          ) : (
            <EmptyState
              title={PODTEMA_SKORO.trainer.title}
              description={PODTEMA_SKORO.trainer.description}
            />
          ))
        }
        trainerHref={hasTrainer ? `${base}/trenazher/` : null}
        generator={hasTrainer ? <GeneratorTab subtopic={subtopic} base={base} /> : undefined}
        tutors={tutors}
        tutorsEmpty={PODTEMA_SKORO.tutors}
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
