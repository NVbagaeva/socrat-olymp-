import { graphNotFunction } from '@/content/theoryLinear';

/**
 * Раздел «Когда график не функция».
 *
 * Заголовок с бейджем рисует общая разметка блока теории, поэтому
 * раздел начинается сразу с плашки: она стоит в строке заголовка,
 * у правого края, и попадает туда сеткой самого блока.
 */
export function GraphNotFunction() {
  const { hint } = graphNotFunction;

  return (
    <div className="nofn">
      <p className="nofn__hint">{hint}</p>
      <div className="nofn__rest" />
    </div>
  );
}
