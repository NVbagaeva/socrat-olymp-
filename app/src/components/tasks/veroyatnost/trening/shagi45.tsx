import type { ReactNode } from 'react';
import type { Razbor } from '@/lib/veroyatnost/razbor';
import { ProbabilityTree } from '@/components/probability';
import { Vizualizatsiya, podpisRisunka } from '../../card/Vizualizatsiya';
import type { Shag } from '../../steklo';
import type { VoprosPodskazki } from '../../trening';
import type { PodskazkaShag } from '@/lib/veroyatnost/razbor';
import { VykladkaKlient } from '../VykladkaKlient';

/** Текст шага — простой текст банка: в разметку как есть, без тегов. */
function tekst(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Решение задачи №4 и №5 шагами «Стеклянной сцены». Содержание разбора
 * — дословно из банка: этап — название шага, пояснение — подпись,
 * формула — выкладка, которую карточка рвёт на строки по ширине
 * (VykladkaKlient, как и прежде). Формул отдельной строкой HTML нет:
 * выкладка встаёт в место рисунка шага.
 */
export function shagi45(razbor: Razbor): Shag[] {
  return razbor.shagi.map((s) => ({
    zagolovok: s.etap,
    chtoHtml: `<p>${tekst(s.text)}</p>`,
    formulaHtml: '',
    ...(s.vykladka === undefined
      ? {}
      : { risunok: <VykladkaKlient className="z45-vykladka" vykladka={s.vykladka} /> }),
  }));
}

/**
 * Рисунок метода с подсветкой благоприятного (движок
 * components/probability): после ответа или раскрытого решения — как
 * было на карточке задачи. У метода «Формула» рисунка нет.
 */
export function risunok45(razbor: Razbor, verno: boolean, podpis: string): ReactNode {
  if (razbor.parametry === undefined) {
    return null;
  }
  return (
    <figure className="z45-risunok" aria-label={podpis}>
      <figcaption className="z45-risunok__podpis">
        {podpisRisunka(razbor.parametry, razbor.podsvetka)}
      </figcaption>
      <Vizualizatsiya
        parametry={razbor.parametry}
        podsvetka={razbor.podsvetka}
        state={verno ? 'correct' : 'default'}
      />
    </figure>
  );
}

/** Подсказка-вопросы банка — в общем виде (уже набраны KaTeX на сборке). */
export function voprosy45(podskazka: readonly PodskazkaShag[]): VoprosPodskazki[] {
  return podskazka.map((h) => ({
    voprosHtml: h.question,
    variantyHtml: h.options,
    verno: h.correct,
    ...(h.comment === null ? {} : { kommentariyHtml: h.comment }),
  }));
}

/** Подписи дерева в подсказке (content/veroyatnost45.ts). */
export interface DerevoPodskazkiLabels {
  /** Пока дерево растёт. */
  rastyot: string;
  /** Когда подходящие пути подсвечены. */
  gotovo: string;
}

/**
 * Дерево в подсказке-вопросах: растёт по мере ответов. До первого
 * ответа — ветви первого уровня без вероятностей, каждый верный ответ
 * открывает следующую ступень (вероятности уровня, следующий уровень),
 * а когда пройдены все содержательные вопросы — подсвечены подходящие
 * пути. Произведений и суммы нет: число ответа подсказка не называет.
 *
 * Только у задач, которые решаются деревом (рисунок метода — дерево);
 * у остальных ничего не рисуется.
 */
export function DerevoPodskazki({
  razbor,
  otvecheno,
  voprosov,
  labels,
}: {
  razbor: Razbor | null;
  /** Сколько вопросов подсказки пройдено верно. */
  otvecheno: number;
  /** Сколько вопросов в подсказке; последний — как записать ответ. */
  voprosov: number;
  labels: DerevoPodskazkiLabels;
}): ReactNode {
  const parametry = razbor?.parametry;
  const podsvetka = razbor?.podsvetka;
  if (parametry?.method !== 'probability-tree' || voprosov === 0) {
    return null;
  }
  const roditel = new Map(parametry.branches.map((b) => [b.id, b.parent]));
  const glubina = (id: string): number => {
    let n = 1;
    let tek = roditel.get(id) ?? null;
    while (tek !== null) {
      n += 1;
      tek = roditel.get(tek) ?? null;
    }
    return n;
  };
  const urovney = Math.max(1, ...parametry.branches.map((b) => glubina(b.id)));
  /* Ступени: 0 — первый уровень без вероятностей, 1…urovney — уровни
     с вероятностями, urovney + 1 — подсвеченные пути. */
  const posledniy = urovney + 1;
  const soderzhatelnyh = Math.max(1, voprosov - 1);
  const stupen = otvecheno >= soderzhatelnyh ? posledniy : Math.min(otvecheno, posledniy);
  const gotovo = stupen === posledniy;
  return (
    <figure className="z45-derevo-podskazki" aria-live="polite">
      <figcaption className="z45-derevo-podskazki__podpis">
        {gotovo ? labels.gotovo : labels.rastyot}
      </figcaption>
      <ProbabilityTree
        className="pr-tree--po-shagam"
        levels={parametry.levels}
        branches={parametry.branches}
        {...(gotovo ? {} : { urovney: Math.max(1, stupen), sVeroyatnostyami: stupen })}
        {...(gotovo && podsvetka?.method === 'probability-tree'
          ? { highlightedPaths: podsvetka.highlightedPaths }
          : {})}
      />
    </figure>
  );
}
