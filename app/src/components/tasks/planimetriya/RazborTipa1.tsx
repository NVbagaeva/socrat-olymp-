import { Tex } from '@/components/ui/Tex';
import { OPORNYE } from '@/content/opornye';
import { O_ZADANII_1, type Tip1 } from '@/content/zadanie1';
import { BANK_FIPI } from '@/lib/planimetriya/bank/fipi';
import { prototip } from '@/lib/planimetriya/stseny';
import type { Params } from '@/lib/planimetriya/stseny/dsl';
import { ANALYSIS_ATTR, ANALYSIS_WORDS } from '../about/AnalysisPage';
import { Razbor1 } from './Razbor1';

/** Числа задачи: задача открытого банка по номеру или образец прототипа. */
export function paramsZadachi(proto: number, n: number): Params {
  const p = prototip(proto);
  const z = BANK_FIPI.find((x) => x.n === n);
  return { ...p.primer, ...(z?.params ?? {}) } as Params;
}

/**
 * Страница разбора типа задач №1: два разобранных примера. Блок
 * помечен ANALYSIS_ATTR — вкладка «О задании» вставляет его под
 * плашку (TypesDisclosure), без скриптов на страницу ведёт ссылка.
 */
export function RazborTipa1({ tip, base }: { tip: Tip1; base: string }) {
  return (
    <main className="app-main about-razbor z1-razbor-page">
      <h1 className="t-h2 about-razbor__title">
        <Tex text={tip.title} />
      </h1>
      <div className="about-type__examples" {...{ [ANALYSIS_ATTR]: tip.id }}>
        {tip.primery.map(([proto, n]) => (
          <Razbor1
            key={`${proto}-${n}`}
            proto={proto}
            params={paramsZadachi(proto, n)}
            title={O_ZADANII_1.primerTitle(n)}
            wide
          />
        ))}
      </div>
      <div className="about-type__foot">
        <a className="btn btn--secondary" href={`${base}/#${tip.id}`}>
          {ANALYSIS_WORDS.back}
        </a>
        <a className="btn btn--primary" href={`${base}/${OPORNYE.tail}${tip.prep}/`}>
          {ANALYSIS_WORDS.practice}
        </a>
      </div>
    </main>
  );
}
