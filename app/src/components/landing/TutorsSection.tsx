import Link from 'next/link';
import { landing, TUTORS_ANCHOR } from '@/content/landing';

const { tutors } = landing;

/**
 * Блок для репетитора. Стоит после банка и короче ученических блоков:
 * продукт — система подготовки для ученика, репетитор пользуется ею же.
 * Карточек с таблицами классов и цифрами здесь нет — таких данных в
 * проекте нет.
 */
export function TutorsSection() {
  return (
    <section className="band" id={TUTORS_ANCHOR} aria-labelledby="tutors-title">
      <div className="wrap split split--top">
        <div>
          <p className="band__eyebrow">{tutors.eyebrow}</p>
          <h3 id="tutors-title">{tutors.title}</h3>
          <p>{tutors.lead}</p>
          <div className="split__actions">
            <Link className="btn btn--primary" href={tutors.primaryAction.href}>
              {tutors.primaryAction.label}
            </Link>
            <Link className="btn btn--secondary" href={tutors.secondaryAction.href}>
              {tutors.secondaryAction.label}
            </Link>
          </div>
          <p className="split__note">{tutors.note}</p>
        </div>

        <ul className="tools">
          {tutors.tools.map((tool) => (
            <li className="tool" key={tool.title}>
              <h4>{tool.title}</h4>
              <p>{tool.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
