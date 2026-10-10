import { Chart } from '@/components/graph/Chart';
import { Tex } from '@/components/ui/Tex';
import type { Formulation } from '@/content/sections';
import { typeScene, type TypeSceneId } from '@/lib/scenes';
import { ANALYSIS_ATTR, ANALYSIS_WORDS, analysisHref, practiceLinks } from './AnalysisPage';
import { FormulationIcon } from '../FormulationIcon';
import { TypesDisclosure, type TypeItem } from './TypesDisclosure';

const HEADING_ID = 'about-types-title';

export interface AboutTypesProps {
  title: string;
  /** Плашки с разбором: у каждой заполнено поле analysis. */
  forms: Formulation[];
  /** Адрес подтемы: от него ссылки в тренажёр. */
  base?: string;
}

/**
 * Блок «Типы задач в этом разделе» с разборами: плашка — миниатюра,
 * название и стрелка; по клику под ней открывается разбор с двумя
 * примерами (то же оформление, что примеры теории) и ссылкой в
 * тренажёр этого типа.
 *
 * Плашки собираются здесь, на сервере. Разборы — отдельные статические
 * страницы (AnalysisPage): формулы и рисунки там — готовая разметка, и
 * под плашку она подгружается по клику; в браузер не уходят ни KaTeX,
 * ни движок.
 */
export function AboutTypes({ title, forms, base }: AboutTypesProps) {
  const items: TypeItem[] = forms.flatMap((item) => {
    const analysis = item.analysis;
    if (analysis === undefined) {
      return [];
    }
    return [
      {
        id: analysis.id,
        label: item.title.replace(/\$/g, ''),
        href: analysisHref(base ?? '', analysis.id),
        practiceHref: practiceLinks(base ?? '', analysis).practice,
        trainerHref: practiceLinks(base ?? '', analysis).trainer,
        card: (
          <>
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
            <div className="form-card__foot">
              {item.typeScene === undefined ? (
                <span />
              ) : (
                <Chart
                  className="form-card__chart"
                  scene={typeScene(item.typeScene as TypeSceneId)}
                />
              )}
              <span className="form-card__go about-type__arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </span>
            </div>
          </>
        ),
      },
    ];
  });

  return (
    <section className="about-forms about-types" aria-labelledby={HEADING_ID}>
      <h3 className="t-h4 about-sub" id={HEADING_ID}>
        {title}
      </h3>
      <TypesDisclosure
        items={items}
        headingId={HEADING_ID}
        attr={ANALYSIS_ATTR}
        words={ANALYSIS_WORDS}
      />
    </section>
  );
}
