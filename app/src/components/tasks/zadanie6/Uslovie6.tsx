import { Tex } from '@/components/ui/Tex';
import type { Uslovie } from '@/lib/zadanie6/types';
import { Ris6 } from './Ris6';

/** Условие №6: текст, рисунок (таблица, запись, диаграмма, дерево) и вопрос после рисунка. */
export function Uslovie6({ u }: { u: Uslovie }) {
  return (
    <div className="z6-uslovie">
      <p className="z6-uslovie__text">
        <Tex text={u.text} />
      </p>
      {u.ris ? <Ris6 ris={u.ris} /> : null}
      {u.posle ? (
        <p className="z6-uslovie__text">
          <Tex text={u.posle} />
        </p>
      ) : null}
    </div>
  );
}
