import Image from 'next/image';
import { Badge, Breadcrumbs, HandNote } from '@/components/ui';
import { tasksPage } from '@/content/tasks';
import { type ExamSection, type Subtopic } from '@/content/sections';
import { PrepSkills } from './prep';
import { TopicAbout } from './TopicAbout';
import { TopicProgress } from './TopicProgress';
import { theoryBodies } from './theory';
import { TopicTabs } from './TopicTabs';

export interface FunctionTopicPageProps {
  section: ExamSection;
  subtopic: Subtopic;
  /** Вкладка, открытая при заходе: у /podgotovka/ это своя. */
  initialTab?: string;
}

/**
 * Страница типа функции — один шаблон на все шесть.
 *
 * Отличаются они только данными из конфига, поэтому шести страниц
 * в проекте нет и не будет: маршрут один, содержимое приходит из
 * data/functionTypes.ts.
 */
export function FunctionTopicPage({ section, subtopic, initialTab }: FunctionTopicPageProps) {
  const { topic } = section;
  const base = `${tasksPage.href}/${section.slug}/${subtopic.id}`;


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
        <TopicProgress total={subtopic.theory.length} />
      </header>

      <TopicTabs
        initial={initialTab}
        about={<TopicAbout section={section} />}
        theory={subtopic.theory}
        bodies={theoryBodies}
        prep={<PrepSkills base={base} />}
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
