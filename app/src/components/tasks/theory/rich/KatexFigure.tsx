import { clsx } from 'clsx';
import { typeset } from '@/lib/tex';
import { theoryFigure, type TheoryFigureId } from '@/lib/theoryFigures';
import { LABEL_SIZE, layoutFigure } from '@/lib/theoryLabels';

/** Мельче этого подпись не становится и на узком экране. */
const LABEL_MIN = 11;

/**
 * Чертёж теории с подписями KaTeX.
 *
 * SVG рисует движок graph/ — своего чертежа здесь нет. Подписи стоят
 * поверх, отдельным слоем, и набраны KaTeX на сборке: внутрь SVG
 * KaTeX не встраивается, а математика на сайте — только KaTeX.
 *
 * Место подписи считает lib/theoryLabels.ts: подписи осей и надписи —
 * там, где их поставил автор; подписи точек (auto) подбирает общий
 * модуль размещения graph/labels.js, так что рамка не пересекает кривую,
 * оси, пунктиры и другие подписи. Позиции — в процентах от размера
 * чертежа, кегль — в долях ширины контейнера (cqw): при уменьшении
 * рисунка на телефоне подписи уменьшаются вместе с ним и не уезжают.
 */
export function KatexFigure({ id, className }: { id: TheoryFigureId; className?: string }) {
  const figure = theoryFigure(id);
  const layout = layoutFigure(figure);
  const { width, height } = layout;
  const leaders = layout.labels.filter((item) => item.leader !== null);

  return (
    <figure className={clsx('kfig', className)} style={{ maxWidth: `${width}px` }}>
      <span className="kfig__svg" dangerouslySetInnerHTML={{ __html: layout.svg }} />
      {leaders.length === 0 ? null : (
        <svg
          className="kfig__leaders"
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
          focusable="false"
        >
          {leaders.map((item, index) => (
            <line
              key={index}
              x1={item.leader!.x1}
              y1={item.leader!.y1}
              x2={item.leader!.x2}
              y2={item.leader!.y2}
            />
          ))}
        </svg>
      )}
      {layout.labels.map((item, index) => {
        const label = item.label;
        const size = label.size ?? LABEL_SIZE;
        return (
          <span
            key={index}
            className={clsx(
              'kfig__label',
              `kfig__label--${label.tone ?? 'ink'}`,
              item.auto && 'kfig__label--point',
            )}
            style={{
              left: `${((item.x / width) * 100).toFixed(3)}%`,
              top: `${((item.y / height) * 100).toFixed(3)}%`,
              fontSize: `clamp(${LABEL_MIN}px, ${((size / width) * 100).toFixed(3)}cqw, ${size}px)`,
              transform: 'translate(-50%, -50%)',
            }}
            dangerouslySetInnerHTML={{ __html: typeset(label.text) }}
          />
        );
      })}
    </figure>
  );
}
