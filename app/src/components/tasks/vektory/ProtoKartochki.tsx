import type { SkillItem } from '../configurator';
import { typeset } from '@/lib/tex';
import { BANK } from '@/lib/vektory/bank';
import { generate } from '@/lib/vektory/generate';
import { PROTOTYPES } from '@/lib/vektory/prototypes';
import type { Prototype, Risunok as RisunokConfig } from '@/lib/vektory/types';
import { Formula } from '../vychisleniya/Formula';
import { Risunok } from './Risunok';

/** Мини-рисунок прототипа: первый вариант банка, окно по векторам. */
export function miniRisunok(p: Prototype): RisunokConfig | null {
  const variant = BANK.find((e) => e.prototype === p.id)?.variants[0];
  if (variant === undefined) {
    return null;
  }
  const task = generate(p.id, variant.seed);
  return task.risunok === null
    ? null
    : { ...task.risunok, window: 'tight', alt: `Пример рисунка к прототипу ${p.id}` };
}

/**
 * Карточки прототипов для конфигураторов тренажёра и генератора:
 * собираются на сервере, названия набраны KaTeX, миниатюра — рисунок
 * движка по первому варианту банка или формула. Число заданий —
 * размер банка прототипа.
 */
export function protoKartochki(): SkillItem[] {
  const perPrototype = new Map(BANK.map((entry) => [entry.prototype, entry.variants.length]));
  return PROTOTYPES.map((p) => {
    const mini = miniRisunok(p);
    return {
      id: p.id,
      title: p.nazvanie,
      titleHtml: typeset(p.nazvanie),
      code: p.id,
      count: perPrototype.get(p.id) ?? 0,
      levels: [],
      chart:
        mini === null ? (
          <Formula className="z2-formula" tex={p.formula} />
        ) : (
          <Risunok className="z2-mini" config={mini} />
        ),
    };
  });
}
