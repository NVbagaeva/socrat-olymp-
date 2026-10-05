import type { ReactNode } from 'react';
import { TeoriyaShell } from '@/components/tasks/veroyatnost/teoriya/TeoriyaShell';
import { RAZDELY_TEORII } from '@/content/theoryVektory';
import { PROGRESS_2, TEORIYA_DEKOR_2 } from '@/content/vektory';
import { stsena, type StsenaId } from '@/lib/vektory/stseny';
import { QuadraticSection } from '../theory/quadratic/QuadraticSection';
import { Risunok } from './Risunok';

/** Рисунок карточки теории по ключу сцены: рисует движок №2. */
function figureFor(id: string): ReactNode {
  return <Risunok className="qth-card__chart z2-card-pic" config={stsena(id as StsenaId)} />;
}

/**
 * Вкладка «Теория» задания №2.
 *
 * Восемь разделов подряд на одной странице, содержание рядом — та
 * же оболочка, что у теории №4. Карточки разделов — разметка теории
 * №12 (QuadraticSection) со своими рисунками: вместо чертежа графика
 * в карточку ставится рисунок движка векторов по ключу сцены.
 * Тексты — content/theoryVektory.ts, сцены — lib/vektory/stseny.ts.
 *
 * Разделы, до конца которых ученик долистал, запоминаются под ключом
 * раздела и попадают в кольцо прогресса в шапке.
 */
export function Teoriya2({ vkladka }: { vkladka: string }) {
  /* Декор колонки содержания — сумма векторов без подписи: рядом
     стоит подпись словами, а сам рисунок для скринридера — украшение. */
  const { alt: _alt, ...dekorStsena } = stsena('slozhenie');
  const tela = Object.fromEntries(
    RAZDELY_TEORII.map((r) => [
      r.id,
      <QuadraticSection section={r.section} figureFor={figureFor} key={r.id} />,
    ]),
  );
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={RAZDELY_TEORII}
      tela={tela}
      dekor={{
        kartinka: <Risunok className="z2-dekor" config={dekorStsena} />,
        note: TEORIYA_DEKOR_2.note,
      }}
      trackKey={PROGRESS_2.teoriyaKey}
    />
  );
}
