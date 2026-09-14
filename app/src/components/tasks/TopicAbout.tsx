import Image from 'next/image';
import { Chart } from '@/components/graph/Chart';
import type { ExamSection, Formulation } from '@/content/sections';
import { katex } from '@/lib/graph/katex';
import { compareLinesScene } from '@/lib/scenes';
import { FormulationIcon } from './FormulationIcon';

/* Формулы вёрстываются на сборке: в браузер уходит готовая разметка,
   а не библиотека ради четырёх постоянных строк. */
function formulaHtml(tex: string): string {
  return katex.renderToString(tex, { throwOnError: false, displayMode: false });
}

function FormCard({ item }: { item: Formulation }) {
  return (
    <li className="form-card">
      <span className="form-card__no" aria-hidden="true">
        {item.no}
      </span>
      <span className="form-card__ico" aria-hidden="true">
        <FormulationIcon name={item.icon} />
      </span>
      <h4 className="form-card__title">{item.title}</h4>
      <p className="form-card__hint">{item.hint}</p>
      {item.formula !== undefined ? (
        <p
          className="form-card__formula"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: formulaHtml(item.formula) }}
        />
      ) : null}
      {item.example !== undefined ? <p className="form-card__example">{item.example}</p> : null}
    </li>
  );
}

/**
 * Вкладка «О задании».
 *
 * Все тексты приходят из конфига раздела: ни одной строки, написанной
 * в разметке, здесь нет. Чертёж рисует движок graph/.
 */
export function TopicAbout({ section }: { section: ExamSection }) {
  const { about } = section;

  return (
    <div className="about">
      <section className="about-lead">
        <div className="about-lead__text">
          <p className="about-lead__no">Задание №{section.no}</p>
          <h3 className="t-h3 about-lead__title">{about.title}</h3>
          <p className="about-lead__desc">{about.description}</p>
        </div>

        {/* Лампочка — декор рядом с текстом, поэтому alt пустой. */}
        <p className="subtopic-hint about-hint">
          <Image
            className="subtopic-hint__art"
            src="/images/lightbulb.webp"
            alt=""
            width={200}
            height={181}
          />
          {about.hint}
        </p>
      </section>

      <section className="about-forms">
        <h3 className="t-h4 about-sub">{about.formsTitle}</h3>
        <ul className="about-forms__list">
          {about.forms.map((item) => (
            <FormCard key={item.no} item={item} />
          ))}
        </ul>
      </section>

      <section className="about-skills">
        <div className="about-skills__text">
          <h3 className="t-h4 about-sub">{about.skillsTitle}</h3>
          <ul className="about-skills__list">
            {about.skills.map((skill) => (
              <li key={skill}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
                {skill}
              </li>
            ))}
          </ul>
        </div>

        {/* Чертёж из движка: две прямые с разными коэффициентами. */}
        <figure className="about-skills__chart">
          <Chart scene={compareLinesScene()} />
        </figure>
      </section>

      <section className="about-later">
        <h3 className="t-h4 about-sub">{about.later.title}</h3>
        <p className="about-later__text">{about.later.text}</p>
        {/* Задания №19 в проекте ещё нет: это анонс, а не ссылка.
            Поэтому span с aria-disabled, а не кнопка и не ссылка —
            в обход по Tab он не попадает и перехода не обещает. */}
        <span className="btn btn--secondary about-later__cta" aria-disabled="true">
          {about.later.action}
        </span>
      </section>
    </div>
  );
}
