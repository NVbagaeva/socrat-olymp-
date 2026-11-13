import { ShagiResheniya, type Shag } from '../steklo';
import { OPORNYE2 } from '@/content/vektory2';
import type { OpornayaZadacha, ShagHtml } from '@/lib/vektory/opornye';
import { RisunokSvg } from './shagi2';

function shagi(spisok: ShagHtml[]): Shag[] {
  return spisok.map((s) => ({
    zagolovokHtml: s.zagolovokHtml,
    chtoHtml: s.strokiHtml.map((line) => `<p>${line}</p>`).join(''),
    formulaHtml: '',
  }));
}

/**
 * «Повышенная сложность: косинус с тремя знаками» на вкладке «Опорные
 * задачи» №2 — прежний блок, содержание без правок (lib/vektory/
 * opornye.ts): пояснение и три разобранные задачи с рисунком с катетами.
 */
export function TriZnaka2({
  poyasnenieHtml,
  zadachi,
}: {
  poyasnenieHtml: string[];
  zadachi: OpornayaZadacha[];
}) {
  return (
    <section className="kz-razdel z2-tri" aria-labelledby="z2-tri-title">
      <div className="kz-razdel__head">
        <h3 className="stk-h3" id="z2-tri-title">
          {OPORNYE2.triZnaka.title}
        </h3>
        <p className="stk-lead">{OPORNYE2.triZnaka.lead}</p>
      </div>
      <div className="z2-tri__poyasnenie stk-glass">
        {poyasnenieHtml.map((html, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: html }} />
        ))}
      </div>
      {zadachi.map((z, i) => (
        <article className="z2-tri__zadacha stk-glass" key={i}>
          <h4 className="stk-h4" dangerouslySetInnerHTML={{ __html: z.nazvanieHtml }} />
          <div className="kz-uslovie" dangerouslySetInnerHTML={{ __html: z.uslovieHtml }} />
          {z.risunokSvg === null ? null : (
            <div className="kz-primer__risunok">
              <RisunokSvg svg={z.risunokSvg} />
            </div>
          )}
          <ShagiResheniya shagi={shagi(z.shagi)} />
        </article>
      ))}
    </section>
  );
}
