import Image from 'next/image';
import { Badge, Breadcrumbs, HandNote } from '@/components/ui';
import { tasksPage } from '@/content/tasks';
import type { ExamSection, Subtopic } from '@/content/sections';
import { TopicProgress } from './TopicProgress';

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

        <TopicProgress />
      </header>
    </main>
  );
}
