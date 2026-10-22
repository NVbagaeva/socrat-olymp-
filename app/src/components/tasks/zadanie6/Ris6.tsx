import { EilerDiagramma } from '@/components/probability/EilerDiagramma';
import { ProbabilityTree } from '@/components/probability/ProbabilityTree';
import { Tex } from '@/components/ui/Tex';
import type { Ris } from '@/lib/zadanie6/types';
import { Tablica6 } from './Tablica6';

/**
 * Рисунок задачи №6 по её модели: диаграмма Эйлера и дерево — общие
 * движки components/probability, таблица — Tablica6, запись
 * $X\sim(\ldots)$ — матрица KaTeX. Выделения (точки, исходы $A\cap B$,
 * произведения под листьями) приходят только из разбора.
 */
export function Ris6({ ris }: { ris: Ris }) {
  switch (ris.vid) {
    case 'eiler':
      return (
        <figure className="z6-ris z6-ris--eiler">
          <EilerDiagramma
            tochki={ris.tochki.map((t) => ({
              x: texChislo(t.x),
              ...(t.p ? { p: texChislo(t.p) } : {}),
            }))}
            zerno={ris.zerno}
            {...(ris.vydelit ? { highlighted: ris.vydelit } : {})}
          />
        </figure>
      );
    case 'derevo':
      return (
        <figure className="z6-ris z6-ris--derevo">
          <ProbabilityTree
            branches={ris.vetki.map((v) => ({
              id: v.id,
              parent: v.parent,
              label: v.imya,
              p: v.pv,
              pLabel: texChislo(v.p),
            }))}
            rootLabel="S"
            leafLabelsMath
            events={ris.sobytiya.map((s) => ({ name: s.imya, leaves: s.listya }))}
            {...(ris.vydelit ? { highlightedPaths: ris.vydelit } : {})}
            showProducts={ris.proizvedeniya ?? false}
            alt={`Дерево эксперимента: ${ris.sobytiya.map((s) => `событие ${s.imya}`).join(', ')}`}
          />
        </figure>
      );
    case 'tablica':
      return <Tablica6 t={ris.tablica} className="z6-ris" />;
    case 'zapis':
      return (
        <div className="z6-ris z6-zapis">
          <Tex text={`$\\displaystyle ${ris.tex}$`} />
        </div>
      );
  }
}

/** Число из TeX в подпись рисунка: «0{,}05» → «0,05», «-3» → «−3». */
function texChislo(t: string): string {
  return t.replace(/\{,\}/g, ',').replace(/\\,/g, ' ').replace(/^-/, '−');
}
