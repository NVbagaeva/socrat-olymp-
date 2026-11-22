import { Tex } from '@/components/ui/Tex';
import type { DanoRow } from '@/lib/zadanie10/types';

/**
 * Таблица «Дано» задачи №10: обозначение, значение с единицами и что
 * это. Та же таблица, что в прежнем разборе (Razbor10), — теперь она
 * стоит в первом шаге решения «Стеклянной сцены». На узком экране
 * прокручивается внутри своей рамки, страница не едет.
 */
export function Dano10({ dano }: { dano: readonly DanoRow[] }) {
  return (
    <div className="z10-dano-scroll" role="region" aria-label="Что дано" tabIndex={0}>
      <table className="z10-dano">
        <thead>
          <tr>
            <th scope="col">Величина</th>
            <th scope="col">Значение</th>
            <th scope="col">Что это</th>
          </tr>
        </thead>
        <tbody>
          {dano.map((r) => (
            <tr key={`${r.oboz}-${r.znach}`}>
              <td>
                <Tex text={`$${r.oboz}$`} />
              </td>
              <td>
                <Tex text={`$${r.znach}$`} />
                {r.ed ? <span className="z10-dano__ed"> {r.ed}</span> : null}
              </td>
              <td>
                <Tex text={r.smysl} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
