import { Tex } from '@/components/ui/Tex';
import type { Formulation } from '@/content/sections';
import { RichExampleBlock } from '../theory/rich/RichExample';

/** Метка блока разбора: по ней вкладка «О задании» находит его в странице. */
export const ANALYSIS_ATTR = 'data-razbor';

export const ANALYSIS_WORDS = {
  back: 'К типам задач',
  practice: 'Потренироваться',
  open: 'Открыть разбор',
  close: 'Свернуть разбор',
  loading: 'Загружаем разбор…',
  failed: 'Разбор не загрузился.',
  page: 'Открыть отдельной страницей',
};

/** Адрес страницы разбора и адрес «Потренироваться». */
export function analysisHref(base: string, id: string): string {
  return `${base}/razbor/${id}/`;
}

export function practiceHref(base: string, trainer: string): string {
  return `${base}/trenazher/${trainer}/`;
}

/**
 * Страница разбора типа задачи: примеры в оформлении теории и ссылки
 * назад к типам задач и в тренажёр этого типа. Блок примеров помечен
 * ANALYSIS_ATTR — его же вкладка «О задании» вставляет под плашку.
 */
export function AnalysisPage({ form, base }: { form: Formulation; base: string }) {
  const analysis = form.analysis;
  if (analysis === undefined) {
    return null;
  }
  return (
    <main className="app-main about-razbor">
      <h1 className="t-h2 about-razbor__title">
        <Tex text={form.title} />
      </h1>
      <div className="about-type__examples" {...{ [ANALYSIS_ATTR]: analysis.id }}>
        {analysis.examples.map((example) => (
          <RichExampleBlock key={example.title} block={example} wide />
        ))}
      </div>
      <div className="about-type__foot">
        <a className="btn btn--secondary" href={`${base}/#${analysis.id}`}>
          {ANALYSIS_WORDS.back}
        </a>
        <a className="btn btn--primary" href={practiceHref(base, analysis.trainer)}>
          {ANALYSIS_WORDS.practice}
        </a>
      </div>
    </main>
  );
}
