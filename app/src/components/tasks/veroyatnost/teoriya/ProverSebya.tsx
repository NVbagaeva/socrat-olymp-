'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { variantMatches, type VoprosSeal } from '@/lib/veroyatnost/teoriya';
import { VariantyOtveta, type VariantSostoyanie } from './VariantyOtveta';

export interface ProverSebyaProps {
  /** Вопросы с отпечатками верных ответов. */
  voprosy: readonly VoprosSeal[];
  /** Подписи вариантов — одни на все вопросы блока. */
  otvety: readonly string[];
  lead: string;
  knopka: string;
}

/**
 * Блок самопроверки: несколько вопросов, у каждого ряд вариантов,
 * и одна кнопка на весь блок.
 *
 * Ученик отмечает варианты в любом порядке и проверяет всё разом.
 * Кнопка стоит под вопросами: сначала ответы, потом проверка.
 * После проверки кнопки замирают и подсвечиваются: выбранный верный —
 * зелёным, выбранный неверный — красным, а рядом видно верный.
 * Счёта нет намеренно: подсветки довольно, а «4 из 6» превращает
 * разбор темы в оценку.
 *
 * Верных ответов в разметке нет: у вопроса лежит отпечаток, нажатый
 * вариант сверяется с ним в браузере.
 */
export function ProverSebya({ voprosy, otvety, lead, knopka }: ProverSebyaProps) {
  const [vybor, setVybor] = useState<Record<string, string>>({});
  const [provereno, setProvereno] = useState(false);

  /* Проверять нечего, пока не отмечен ни один вариант. */
  const estVybor = Object.keys(vybor).length > 0;

  function otmetit(id: string, variant: string): void {
    if (provereno) {
      return;
    }
    setVybor((was) => ({ ...was, [id]: variant }));
  }

  /** Вердикт одного варианта одного вопроса — после проверки. */
  function sostoyanie(vopros: VoprosSeal, variant: string): VariantSostoyanie {
    if (!provereno) {
      return null;
    }
    const verny = variantMatches(variant, vopros.seal);
    if (vybor[vopros.id] === variant) {
      return verny ? 'correct' : 'incorrect';
    }
    /* Верный вариант виден и тогда, когда ученик выбрал другой. */
    return verny ? 'answer' : null;
  }

  return (
    <div className="vcheck">
      <p className="vcheck__lead">{lead}</p>

      <ol className="vcheck__grid">
        {voprosy.map((vopros, i) => (
          <li className="vcheck-card" key={vopros.id}>
            <p className="vcheck-card__text">
              <span className="vcheck-card__no" aria-hidden="true">
                {i + 1}
              </span>
              {vopros.text}
            </p>
            <VariantyOtveta
              className="vcheck-card__otvety"
              otvety={otvety}
              vybor={vybor[vopros.id] ?? null}
              onPick={(variant) => otmetit(vopros.id, variant)}
              itog={(variant) => sostoyanie(vopros, variant)}
              disabled={provereno}
              label={vopros.text}
            />
          </li>
        ))}
      </ol>

      {/* Кнопка под вопросами, а не над ними: сначала ученик отвечает
          на все шесть, и только потом проверяет. Сверху она звала
          нажать раньше, чем было что проверять. */}
      <div className="vcheck__niz">
        <Button
          className="vcheck__go"
          variant="secondary"
          size="sm"
          disabled={provereno || !estVybor}
          onClick={() => setProvereno(true)}
        >
          {knopka}
        </Button>
      </div>
    </div>
  );
}
