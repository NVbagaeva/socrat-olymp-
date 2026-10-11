import { Tex } from '@/components/ui/Tex';
import { OPORNYE } from '@/content/opornye';
import { O_ZADANII_1, type Tip1 } from '@/content/zadanie1';
import { POROG } from '@/lib/planimetriya/figury';
import { renderPlan } from '@/lib/planimetriya/render';
import { prototip } from '@/lib/planimetriya/stseny';
import type { Params } from '@/lib/planimetriya/stseny/dsl';
import { ANALYSIS_ATTR, ANALYSIS_WORDS } from '../about/AnalysisPage';
import { TypesDisclosure, type TypeItem } from '../about/TypesDisclosure';
import { Phrases } from '../theory/Phrases';
import { phrases } from '../theory/quadratic/markup';

const HEADING_ID = 'z1-tipy-title';

/** Адрес страницы разбора типа. */
export function razborHref(base: string, id: string): string {
  return `${base}/razbor/${id}/`;
}

/** Миниатюра плашки: чертёж условия прототипа, как на листе ученика. */
function mini(t: Tip1): string {
  const p = prototip(t.mini);
  return renderPlan(p.stsena(p.primer as Params, POROG), { shirina: 150, vysota: 96 });
}

/**
 * Вкладка «О задании» задания №1: что проверяет задание и формат
 * ответа, плашки типов задач (блоки I–IX) — по клику под плашкой
 * раскрывается разбор с двумя задачами, как у квадратичной функции
 * (TypesDisclosure, страницы разборов — /zadaniya/1/razbor/…), и
 * типичные ошибки.
 */
export function OZadanii1({ base }: { base: string }) {
  /* Плашки — типы I–IX открытого банка; тип X (темы курса) только в тренажёре. */
  const items: TypeItem[] = O_ZADANII_1.tipy
    .filter((t) => t.tolkoTrenazher !== true)
    .map((t) => ({
      id: t.id,
      label: t.title.replace(/\$/g, ''),
      href: razborHref(base, t.id),
      practiceHref: `${base}/${OPORNYE.tail}${t.prep}/`,
      trainerHref: null,
      card: (
        <>
          <span className="form-card__no" aria-hidden="true">
            {t.blok}
          </span>
          <h4 className="form-card__title">
            <Tex text={t.title} />
          </h4>
          <p className="form-card__hint">
            <Tex text={t.hint} />
          </p>
          <div className="form-card__foot">
            <span className="pl-wrap z1-mini" dangerouslySetInnerHTML={{ __html: mini(t) }} />
            <span className="form-card__go about-type__arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </span>
          </div>
        </>
      ),
    }));

  return (
    <div className="z1-about">
      <section className="z1-about__lead">
        <h2 className="t-h2 z1-about__title">{O_ZADANII_1.title}</h2>
        <p className="z1-about__text">{O_ZADANII_1.lead}</p>
      </section>

      <section className="z1-format" aria-labelledby="z1-format-title">
        <h3 className="t-h4 z1-about__sub" id="z1-format-title">
          {O_ZADANII_1.format.title}
        </h3>
        <p className="z1-format__text">
          <Phrases parts={phrases(O_ZADANII_1.format.text)} />
        </p>
      </section>

      <section className="about-forms about-types" aria-labelledby={HEADING_ID}>
        <h3 className="t-h4 about-sub" id={HEADING_ID}>
          {O_ZADANII_1.tipyTitle}
        </h3>
        <p className="z1-about__text">{O_ZADANII_1.tipyLead}</p>
        <TypesDisclosure
          items={items}
          headingId={HEADING_ID}
          attr={ANALYSIS_ATTR}
          words={{ ...ANALYSIS_WORDS }}
        />
      </section>

      <section className="z1-oshibki" aria-labelledby="z1-oshibki-title">
        <h3 className="t-h4 z1-about__sub" id="z1-oshibki-title">
          {O_ZADANII_1.oshibkiTitle}
        </h3>
        <ul className="z1-oshibki__list">
          {O_ZADANII_1.oshibki.map((o) => (
            <li className="z1-oshibka" key={o.id}>
              <h4 className="z1-oshibka__title">{o.title}</h4>
              <p className="z1-oshibka__text">
                <Phrases parts={phrases(o.text)} />
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
