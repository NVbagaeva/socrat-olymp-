import type { ShagVyvodaHtml } from '@/lib/planimetriya/vyvod';

/**
 * Вывод вопросами: вопрос, который ученик задаёт себе сам, ответ
 * словами, выкладка и чертёж шага. Свойство карточки стоит после него —
 * как итог рассуждения.
 */
export function Vyvod1({ shagi, label }: { shagi: ShagVyvodaHtml[]; label: string }) {
  if (shagi.length === 0) return null;
  return (
    <section className="spr1-blok spr1-blok--vyvod spr1-vyvod">
      <span className="spr1-blok__label">{label}</span>
      <ol className="spr1-vyvod__shagi">
        {shagi.map((s, i) => (
          <li className="spr1-vyvod__shag" key={i}>
            <div className="spr1-vyvod__tekst">
              <p className="spr1-vyvod__vopros" dangerouslySetInnerHTML={{ __html: s.voprosHtml }} />
              <p className="spr1-vyvod__otvet" dangerouslySetInnerHTML={{ __html: s.otvetHtml }} />
              {s.texHtml.map((f, j) => (
                <span
                  className="spr1-blok__formula rich-formula"
                  key={j}
                  dangerouslySetInnerHTML={{ __html: f }}
                />
              ))}
            </div>
            {s.risunokSvg === null ? null : (
              <span
                className="pl-wrap spr1-vyvod__ris"
                dangerouslySetInnerHTML={{ __html: s.risunokSvg }}
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
