import Image from 'next/image';
import type { ReactNode } from 'react';
import { OPORNYE } from '@/content/opornye';
import { EmptyState, HandNote, type Crumb } from '@/components/ui';
import { prepSkillsFor } from '@/content/prepSkills';
import { tasksPage } from '@/content/tasks';
import { PODTEMA_SKORO, type ExamSection, type Subtopic } from '@/content/sections';
import { subtopicBuilt } from '@/data/functionTypes';
import { findManifestFamily } from '@/lib/generator/manifest';
import { prepSkillTotal } from '@/lib/prep';
import { aboutScene } from '@/lib/scenes';
import type { ProgressPlan } from '@/lib/topicProgress';
import { typeset } from '@/lib/tex';
import { prototypeSkills } from './configurator/skillItems';
import { GeneratorTab } from './generator';
import { MethodsTab, metodyFor } from './MethodsTab';
import { PrepSkills } from './prep';
import { TrainerShell } from './trainer';
import { TopicAbout } from './TopicAbout';
import { TopicProgress } from './TopicProgress';
import { theoryBodies } from './theory';
import { ShapkaRazdela } from './ShapkaRazdela';
import { TopicTabs } from './TopicTabs';

import { assetUrl } from '@/lib/assetUrl';
import { href, ZADANIYA } from '@/lib/paths';
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
  const base = `${ZADANIYA}/${section.slug}/${subtopic.id}`;
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

  /* Пункты кольца прогресса — вкладки подтемы с содержанием. Пустые
     разделы теории, вкладка методов без методов, опорные задачи и
     тренажёр без наборов в счёт не идут. Ключи отметок свои у каждой
     подтемы: подтемы друг на друга не влияют. */
  const theoryKey = `theory:${section.slug}:${subtopic.id}`;
  const methodsKey = `methods:${section.slug}:${subtopic.id}`;
  const plan: ProgressPlan = {
    theory: subtopic.theory.filter((block) => block.status !== 'empty').map((block) => block.id),
    methods: subtopic.methods === true ? metodyFor(subtopic.id).map((metod) => metod.id) : [],
    prep: hasPrep
      ? prepSkillsFor(subtopic.id).map((skill) => ({
          id: skill.id,
          total: prepSkillTotal(subtopic.id, skill.id),
        }))
      : [],
    trainer: hasTrainer ? prototypeSkills(findManifestFamily(subtopic.id)).map((skill) => skill.id) : [],
  };

  /* Разметка теории — только разделов этой подтемы. Словарь theoryBodies
     общий на все подтемы, и целиком он весил в странице гиперболы
     ≈640 КБ чужой теории (линейная и квадратичная функции). */
  const ownBodies = Object.fromEntries(
    subtopic.theory.flatMap((block) => {
      const body = block.body === undefined ? undefined : theoryBodies[block.body];
      return block.body === undefined || body === undefined ? [] : [[block.body, body] as const];
    }),
  );

  return (
    <main className="app-main">
      <ShapkaRazdela
        className="topic-head"
        crumbs={[
          { label: 'Задания', href: tasksPage.href },
          {
            label: `№${section.no}. ${section.subtitle}`,
            href: href(ZADANIYA, section.slug),
          },
          { label: subtopic.title, href: trail.length === 0 ? undefined : base + '/' },
          ...trail,
        ]}
        /* Шапка по признаку подтемы: H1 общий на задание, название
           подтемы — подзаголовком. Без признака H1 — сама подтема. */
        title={
          subtopic.head === undefined
            ? subtopic.title
            : `Задание №${section.no}. ${section.subtitle}`
        }
        subtitle={
          subtopic.head === undefined ? undefined : (
            <p className="t-h3 topic-head__subtitle">{subtopic.head.subtitle}</p>
          )
        }
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
          <>
            {/* Портрет — декор: alt пустой, цитата рядом текстом. */}
            <Image
              className="topic-head__art"
              src={assetUrl('/images/bust-galileo.webp')}
              alt=""
              width={814}
              height={700}
            />

            {/* Прогресс подтемы: пункты — её вкладки с содержанием,
                изучено — то, что ученик сделал, а не открыл. */}
            <TopicProgress plan={plan} theoryKey={theoryKey} methodsKey={methodsKey} />
          </>
        }
      />

      <TopicTabs
        initial={initialTab}
        about={<TopicAbout section={section} about={about} scene={aboutScene(subtopic.id)} />}
        theory={subtopic.theory.map((block) => ({ ...block, titleHtml: typeset(block.title) }))}
        bodies={ownBodies}
        trackKey={theoryKey}
        methods={
          subtopic.methods === true ? (
            <MethodsTab type={subtopic.id} base={base} trackKey={methodsKey} />
          ) : undefined
        }
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
              src={assetUrl('/images/pyramid-network.webp')}
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
