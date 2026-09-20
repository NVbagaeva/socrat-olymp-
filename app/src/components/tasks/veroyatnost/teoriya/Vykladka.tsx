import { odnoyStrokoy, typeset } from '@/lib/tex';
import { VykladkaKlient } from './VykladkaKlient';

export interface VykladkaProps {
  /** Строки формулы, каждая — TeX без долларов, в порядке чтения. */
  stroki: readonly string[];
}

/**
 * Формула с запасными разрывами — выкладка, как в тетради.
 *
 * В данных формула хранится строками: где она рвётся, решает автор,
 * и рвётся она только по знаку «=», который на разрыве стоит дважды —
 * в конце оборванной строки и в начале следующей. Но разрыв — запас
 * на узкий экран, а не постоянная форма записи: помещается формула
 * в колонку целиком — показывается одной строкой, без повторных
 * знаков. Здесь набираются обе записи, а какую показать, решает
 * браузер по ширине колонки (VykladkaKlient). Прокрутки нет ни в
 * одном из случаев.
 */
export function Vykladka({ stroki }: VykladkaProps) {
  return (
    <VykladkaKlient
      odnoy={typeset(`$${odnoyStrokoy(stroki)}$`, true)}
      stroki={stroki.map((stroka) => typeset(`$${stroka}$`, true))}
    />
  );
}
