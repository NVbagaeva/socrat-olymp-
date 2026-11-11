'use client';

import type { RazborHtml } from '@/lib/vychisleniya/razbor';
import './razbor8.css';

/**
 * Решение задачи №8 по шагам: у каждого шага — подпись «что делаем и
 * почему» и выкладка в KaTeX. Под шагами, если сокращение держится на
 * признаках делимости, — сворачиваемая панель с ними.
 */
export function Razbor8({ razbor, title = 'Решение' }: { razbor: RazborHtml; title?: string | null }) {
  return (
    <div className="z8-razbor" role="region" aria-label={title ?? 'Решение'}>
      {title === null ? null : <p className="z8-razbor__title">{title}</p>}
      <ol className="z8-shagi">
        {razbor.shagi.map((step, i) => (
          <li key={i} className="z8-shag">
            <span className="z8-shag__no" aria-hidden="true">
              {i + 1}
            </span>
            <div className="z8-shag__body">
              <p className="z8-shag__chto" dangerouslySetInnerHTML={{ __html: step.chto }} />
              <div className="z8-shag__tex" dangerouslySetInnerHTML={{ __html: step.tex }} />
            </div>
          </li>
        ))}
      </ol>
      {razbor.delimost.length === 0 ? null : (
        <details className="z8-delimost">
          <summary>Признаки делимости</summary>
          <ul>
            {razbor.delimost.map((item) => (
              <li key={item.title}>
                <b>{item.title}:</b> <span dangerouslySetInnerHTML={{ __html: item.html }} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
