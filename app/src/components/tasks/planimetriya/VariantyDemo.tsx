'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Tex } from '@/components/ui/Tex';
import { POROG } from '@/lib/planimetriya/figury';
import { pustoyOtchet, renderPlan } from '@/lib/planimetriya/render';
import { PROTOTIPY } from '@/lib/planimetriya/stseny';
import type { Params } from '@/lib/planimetriya/stseny/dsl';
import { pereimenovat, sluchaynyyVariant } from '@/lib/planimetriya/variant';
import { rngOf } from '@/lib/vychisleniya/rng';

/**
 * Генератор вариантов на витрине: случайные числа условия, поворот,
 * отражение и переименование букв — с той же заменой в тексте
 * условия. Под рисунком — отчёт движка (нарушений быть не должно).
 */
export function VariantyDemo() {
  const [nomer, setNomer] = useState(1);
  const varianty = useMemo(() => {
    const rng = rngOf(`vitrina-${nomer}`);
    return Array.from({ length: 6 }, (_, i) => {
      const p = PROTOTIPY[(nomer * 7 + i * 13) % PROTOTIPY.length]!;
      const params = { ...p.primer, ...p.sluchaynye(rng) } as Params;
      const scena = p.stsena(params, POROG);
      const variant = sluchaynyyVariant(rng, Object.keys(scena.tochki), p.diapazon);
      const otchet = pustoyOtchet();
      const svg = renderPlan(scena, { variant }, otchet);
      return {
        p,
        svg,
        uslovie: pereimenovat(p.uslovie(params), variant.bukvy),
        variant,
        problems: otchet.problems,
      };
    });
  }, [nomer]);
  return (
    <div className="pl1__varianty">
      <Button onClick={() => setNomer((n) => n + 1)}>Новые варианты</Button>
      <div className="pl1__grid">
        {varianty.map((v, i) => (
          <figure className="pl1__card" key={`${nomer}-${i}`}>
            <span className="pl-wrap" dangerouslySetInnerHTML={{ __html: v.svg }} />
            <figcaption>
              <p className="t-sm pl1__meta">
                Прототип {v.p.id} · поворот {v.variant.povorot}°
                {v.variant.otrazhenie ? ' · отражение' : ''}
              </p>
              <Tex text={v.uslovie} className="pl1__uslovie" />
              <p className="t-sm pl1__meta">
                {v.problems.length === 0 ? 'Нарушений нет' : `Нарушения: ${v.problems.join('; ')}`}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
