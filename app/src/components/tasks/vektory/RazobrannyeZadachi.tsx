import { FigureZoom } from '@/components/ui';
import { O_ZADANII, OPORNYE_2 } from '@/content/vektory';
import type { OpornayaZadacha, OpornyePool } from '@/lib/vektory/opornye';

/** Разобранная задача: условие, рисунок с катетами, шаги с заголовками. */
function Zadacha({ task, no }: { task: OpornayaZadacha; no: string }) {
  return (
    <article className="z2-op" id={`op-${task.prototype}-${no}`}>
      <h4 className="z2-op__title">
        <span className="z2-op__code" aria-hidden="true">
          {no}
        </span>
        <span dangerouslySetInnerHTML={{ __html: task.nazvanieHtml }} />
      </h4>
      <div className="z2-op__body">
        <p className="z2-op__uslovie" dangerouslySetInnerHTML={{ __html: task.uslovieHtml }} />
        {task.risunokSvg === null ? null : (
          <FigureZoom className="z2-op__pic" label={OPORNYE_2.risunok}>
            <span className="vp-wrap" dangerouslySetInnerHTML={{ __html: task.risunokSvg }} />
          </FigureZoom>
        )}
      </div>
      {/* Решение свёрнуто по умолчанию: сначала попытка, потом разбор.
          details — без скрипта, работает и с клавиатуры. */}
      <details className="z2-op__reshenie">
        <summary className="z2-op__summary">{OPORNYE_2.reshenie}</summary>
        <ol className="z2-shagi">
          {task.shagi.map((shag, i) => (
            <li className="z2-shag" key={i}>
              <p
                className="z2-shag__title"
                dangerouslySetInnerHTML={{ __html: shag.zagolovokHtml }}
              />
              {shag.strokiHtml.map((line, j) => (
                <p className="z2-shag__line" key={j} dangerouslySetInnerHTML={{ __html: line }} />
              ))}
            </li>
          ))}
        </ol>
      </details>
    </article>
  );
}

/**
 * Разобранные задачи по прототипам: по одной на каждый из
 * девятнадцати, группами A, B, C, и в конце блок повышенной
 * сложности (косинус с тремя знаками) с пояснением. Собраны на
 * сборке по зафиксированным seed (lib/vektory/opornye.ts); рисунки —
 * в режиме подсказки: катеты здесь уместны, это образец решения.
 */
export function RazobrannyeZadachi({ pool }: { pool: OpornyePool }) {
  return (
    <section className="z2-razobrannye" aria-labelledby="z2-razobrannye-title">
      <h3 className="t-h3 z2-prep__sub" id="z2-razobrannye-title">
        {OPORNYE_2.razobrannyeTitle}
      </h3>
      <p className="z2-prep__lead">{OPORNYE_2.razobrannyeLead}</p>

      {O_ZADANII.gruppy.map((gruppa) => (
        <section className="z2-op-group" key={gruppa.id} aria-labelledby={`z2-op-${gruppa.id}`}>
          <h4 className="z2-op-group__title" id={`z2-op-${gruppa.id}`}>
            <span className="z2-group__code" aria-hidden="true">
              {gruppa.id}
            </span>
            {gruppa.title}
          </h4>
          {pool.zadachi
            .filter((t) => t.gruppa === gruppa.id)
            .map((t) => (
              <Zadacha task={t} no={t.prototype} key={t.prototype} />
            ))}

          {gruppa.id === 'C' ? (
            <section className="z2-tri-znaka" aria-labelledby="z2-tri-znaka-title">
              <h4 className="z2-op-group__title z2-tri-znaka__title" id="z2-tri-znaka-title">
                {OPORNYE_2.triZnakaTitle}
              </h4>
              {pool.triZnaka.poyasnenieHtml.map((html, i) => (
                <p
                  className="z2-tri-znaka__text"
                  key={i}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ))}
              {pool.triZnaka.zadachi.map((t, i) => (
                <Zadacha task={t} no={String(i + 1)} key={i} />
              ))}
            </section>
          ) : null}
        </section>
      ))}
    </section>
  );
}
