import { clsx } from 'clsx';
import { THEME, renderGraph } from '@/lib/graph/renderer.js';
import { typeset } from '@/lib/tex';
import { theoryFigure, type TheoryFigureId } from '@/lib/theoryFigures';

/** Кегль подписи по умолчанию, пиксели натурального размера чертежа. */
const LABEL_SIZE = 17;
/** Мельче этого подпись не становится и на узком экране. */
const LABEL_MIN = 11;

interface Box {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

/**
 * Чертёж теории с подписями KaTeX.
 *
 * SVG рисует движок graph/ — своего чертежа здесь нет. Подписи стоят
 * поверх, отдельным слоем, и набраны KaTeX на сборке: внутрь SVG
 * KaTeX не встраивается, а математика на сайте — только KaTeX.
 *
 * Место подписи считается тем же правилом, что у движка: поле pad и
 * клетка cell пикселей. Позиции — в процентах от размера чертежа, кегль
 * — в долях ширины контейнера (cqw): при уменьшении рисунка на телефоне
 * подписи уменьшаются вместе с ним и не уезжают с места.
 */
export function KatexFigure({ id, className }: { id: TheoryFigureId; className?: string }) {
  const figure = theoryFigure(id);
  const scene = figure.scene as { window: Box; cell?: number };
  const geometry = THEME.geometry as { pad: number; cell: number };
  const cell = scene.cell ?? geometry.cell;
  const w = scene.window;
  const width = (w.xmax - w.xmin) * cell + geometry.pad * 2;
  const height = (w.ymax - w.ymin) * cell + geometry.pad * 2;
  const svg = renderGraph(figure.scene) as string;

  return (
    <figure className={clsx('kfig', className)} style={{ maxWidth: `${width}px` }}>
      <span className="kfig__svg" dangerouslySetInnerHTML={{ __html: svg }} />
      {figure.labels.map((label, index) => {
        const x = geometry.pad + (label.at[0] - w.xmin) * cell + (label.dx ?? 0);
        const y = geometry.pad + (w.ymax - label.at[1]) * cell + (label.dy ?? 0);
        const size = label.size ?? LABEL_SIZE;
        const shift =
          label.anchor === 'left'
            ? '0, -50%'
            : label.anchor === 'right'
              ? '-100%, -50%'
              : '-50%, -50%';
        return (
          <span
            key={index}
            className={clsx('kfig__label', `kfig__label--${label.tone ?? 'ink'}`)}
            style={{
              left: `${((x / width) * 100).toFixed(3)}%`,
              top: `${((y / height) * 100).toFixed(3)}%`,
              fontSize: `clamp(${LABEL_MIN}px, ${((size / width) * 100).toFixed(3)}cqw, ${size}px)`,
              transform: `translate(${shift})`,
            }}
            dangerouslySetInnerHTML={{ __html: typeset(label.text) }}
          />
        );
      })}
    </figure>
  );
}
