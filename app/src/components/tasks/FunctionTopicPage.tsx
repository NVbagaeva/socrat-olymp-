import Image from 'next/image';
import { Badge, Breadcrumbs, HandNote } from '@/components/ui';
import { tasksPage } from '@/content/tasks';
import { bankSets, type ExamSection, type Subtopic } from '@/content/sections';
import { TopicAbout } from './TopicAbout';
import { TopicProgress } from './TopicProgress';
import { theoryBodies } from './theory';
import { TopicTabs } from './TopicTabs';

export interface FunctionTopicPageProps {
  section: ExamSection;
  subtopic: Subtopic;
}

/**
 * Страница типа функции — один шаблон на все шесть.
 *
 * Отличаются они только данными из конфига, поэтому шести страниц
 * в проекте нет и не будет: маршрут один, содержимое приходит из
 * data/functionTypes.ts.
 */
export function FunctionTopicPage({ section, subtopic }: FunctionTopicPageProps) {
  const { topic } = section;
  const base = `${tasksPage.href}/${section.slug}/${subtopic.id}`;

  /* Подготовительные наборы берутся из данных движка: числа заданий
     считаются по составу набора и нигде не записаны руками. */
  const prep = bankSets(subtopic)
    .filter((set) => set.kind === 'prep')
    .map(({ id, title, subtitle, count }) => ({ id, title, subtitle, count }));

  return (
    <main className="app-main">
      <Breadcrumbs
        items={[
          { label: 'Задания', href: tasksPage.href },
          { label: `№${section.no}. ${section.subtitle}`, href: `${tasksPage.href}/${section.slug}` },
          { label: subtopic.title },
        ]}
      />

      <header className="topic-head">
        <div className="topic-head__text">
          <div className="topic-head__title">
            <h1 className="t-h1">{subtopic.title}</h1>
            <Badge tone="info">{topic.badge}</Badge>
          </div>
          <p className="topic-head__lead">{topic.lead}</p>
        </div>

        {/* Портрет — декор: alt пустой, цитата рядом текстом. */}
        <figure className="topic-quote">
          <figcaption className="topic-quote__text">
            <HandNote>«{topic.quote.text}»</HandNote>
            <span className="topic-quote__author">— {topic.quote.author}</span>
          </figcaption>
          <Image
            className="topic-quote__art"
            src="/images/bust-galileo.webp"
            alt=""
            width={814}
            height={700}
          />
        </figure>

        {/* Прогресс по разделам кабинета. С числом пунктов теории этой
            подтемы он не связан: это разные счётчики. */}
        <TopicProgress />
      </header>

      <TopicTabs
        about={<TopicAbout section={section} />}
        theory={subtopic.theory}
        bodies={theoryBodies}
        prep={prep}
        tutorsHref={`${base}/dlya-repetitorov/`}
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
