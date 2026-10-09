import Image from 'next/image';
import { Chart } from '@/components/graph/Chart';
import { Tex } from '@/components/ui/Tex';
import type { ExamSection, Formulation, SectionAbout } from '@/content/sections';
import { katex } from '@/lib/graph/katex';
import { compareLinesScene, prepSkillScene, type PrepSkillSceneId } from '@/lib/scenes';
import { FormulationIcon } from './FormulationIcon';

import { assetUrl } from '@/lib/assetUrl';
/* Формулы вёрстываются на сборке: в браузер уходит готовая разметка,
   а не библиотека ради четырёх постоянных строк. */
function formulaHtml(tex: string): string {
  return katex.renderToString(tex, { throwOnError: false, displayMode: false });
}

function FormCard({ item, base }: { item: Formulation; base?: string }) {
  return (
    <li className={item.scene === undefined ? 'form-card' : 'form-card form-card--chart'}>
      <span className="form-card__no" aria-hidden="true">
        {item.no}
      </span>
      <span className="form-card__ico" aria-hidden="true">
        <FormulationIcon name={item.icon} />
      </span>
      <h4 className="form-card__title">
        <Tex text={item.title} />
      </h4>
      <p className="form-card__hint">
        <Tex text={item.hint} />
      </p>
      {item.formula !== undefined ? (
        <p
          className="form-card__formula"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: formulaHtml(item.formula) }}
        />
      ) : null}
      {item.example !== undefined ? (
        <p className="form-card__example">
          <Tex text={item.example} />
        </p>
      ) : null}
      {item.scene !== undefined || item.trainer !== undefined ? (
        <div className="form-card__foot">
          {item.scene !== undefined ? (
            <Chart className="form-card__chart" scene={prepSkillScene(item.scene as PrepSkillSceneId)} />
          ) : null}
          {item.trainer !== undefined && base !== undefined ? (
            <a
              className="form-card__go"
              href={`${base}/trenazher/${item.trainer}/`}
              aria-label={`Открыть тренажёр: ${item.title.replace(/\$/g, '')}`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </a>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export interface TopicAboutProps {
  section: ExamSection;
  /** Тексты вкладки. По умолчанию — вкладка раздела, одна на подтемы. */
  about?: SectionAbout;
  /** Сцена чертежа в блоке «Что нужно уметь». По умолчанию — две прямые. */
  scene?: unknown;
  /** Адрес подтемы: от него стрелки карточек ведут в тренажёр. */
  base?: string;
}

/**
 * Вкладка «О задании».
 *
 * Все тексты приходят из конфига раздела или подтемы: ни одной
 * строки, написанной в разметке, здесь нет. Чертёж рисует движок
 * graph/ по сцене, которую подобрала подтема.
 */
export function TopicAbout({
  section,
  about = section.about,
  scene = compareLinesScene(),
  base,
}: TopicAboutProps) {
  return (
    <div className="about">
      <section className="about-lead">
        <div className="about-lead__text">
          <p className="about-lead__no">Задание №{section.no}</p>
          <h3 className="t-h3 about-lead__title">
            <Tex text={about.title} />
          </h3>
          <p className="about-lead__desc">
            <Tex text={about.description} />
          </p>
        </div>

        {/* Лампочка — декор рядом с текстом, поэтому alt пустой. */}
        <p className="subtopic-hint about-hint">
          <Image
            className="subtopic-hint__art"
            src={assetUrl('/images/lightbulb.webp')}
            alt=""
            width={200}
            height={181}
          />
          <Tex text={about.hint} />
        </p>
      </section>

      <section className="about-forms">
        <h3 className="t-h4 about-sub">{about.formsTitle}</h3>
        <ul className="about-forms__list">
          {about.forms.map((item) => (
            <FormCard key={item.no} item={item} {...(base === undefined ? {} : { base })} />
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
                <Tex text={skill} />
              </li>
            ))}
          </ul>
        </div>

        {/* Чертёж из движка: у линейной две прямые, у квадратичной
            парабола и прямая. */}
        <figure className="about-skills__chart">
          <Chart scene={scene} />
        </figure>
      </section>

      <section className="about-later">
        <h3 className="t-h4 about-sub">{about.later.title}</h3>
        <p className="about-later__text">
          <Tex text={about.later.text} />
        </p>
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
