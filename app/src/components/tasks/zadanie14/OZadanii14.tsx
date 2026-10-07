import { Tex } from '@/components/ui/Tex';
import { O_ZADANII_14 } from '@/content/zadanie14';

/** «1 балл», «2 балла», «0 баллов». */
function bally(n: number): string {
  const [one, few, many] = O_ZADANII_14.bally;
  const word = n === 1 ? one : n >= 2 && n <= 4 ? few : many;
  return `${n} ${word}`;
}

/* Линейные пиктограммы 24×24 — тем же способом нарисованы значки
   навигации сайта: обводка currentColor, без заливки. */
const VID_ICON: Record<string, React.ReactNode> = {
  trig: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M3 12h18M12 3v18M12 12l5.7-4" />
    </>
  ),
  pokaz: <path d="M4 20c6 0 10-4 14-16M3 20h18" />,
  log: <path d="M4 20c2-8 5-12 16-14M4 3v17h17" />,
  kombo: (
    <>
      <circle cx="9" cy="12" r="5.5" />
      <circle cx="15" cy="12" r="5.5" />
    </>
  ),
};

function Pic({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      className={className === undefined ? 'z14-pic' : `z14-pic ${className}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * Вкладка «О задании» задания №14: формат условия, критерии
 * оценивания, виды уравнений, способы отбора корней и типичные
 * потери баллов; справа — «С чего начать». Устройство колонок — как
 * у №11. Тексты — content/zadanie14.ts.
 */
export function OZadanii14() {
  const t = O_ZADANII_14;
  return (
    <div className="z14-about">
      <div className="z14-about__main">
        <section className="z14-about__lead">
          <h2 className="t-h2 z14-about__title">{t.title}</h2>
          <p className="z14-about__answer">{t.lead}</p>
          <p className="z14-about__text">{t.about}</p>
        </section>

        <div className="z14-pair">
          <section className="z14-card" aria-labelledby="z14-primer">
            <h3 className="t-h4 z14-about__sub" id="z14-primer">
              {t.primerTitle}
            </h3>
            <ol className="z14-primer">
              {t.primer.map((p) => (
                <li key={p.punkt} className="z14-primer__item">
                  <span className="z14-primer__punkt">{p.punkt}</span>
                  <Tex text={p.text} />
                </li>
              ))}
            </ol>
          </section>

          <section className="z14-card" aria-labelledby="z14-kriterii">
            <h3 className="t-h4 z14-about__sub" id="z14-kriterii">
              {t.kriteriiTitle}
            </h3>
            <ul className="z14-kriterii">
              {t.kriterii.map((k) => (
                <li key={k.bally} className={`z14-kriterii__item z14-kriterii__item--${k.bally}`}>
                  <span className="z14-kriterii__bally">{bally(k.bally)}</span>
                  <Tex className="z14-kriterii__text" text={k.text} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section aria-labelledby="z14-vidy">
          <h3 className="t-h4 z14-about__sub" id="z14-vidy">
            {t.vidyTitle}
          </h3>
          <ul className="z14-vidy">
            {t.vidy.map((v) => (
              <li key={v.id} className="z14-vid">
                <span className="z14-vid__icon">
                  <Pic>{VID_ICON[v.id]}</Pic>
                </span>
                <span className="z14-vid__body">
                  <span className="z14-vid__name">{v.nazvanie}</span>
                  <Tex className="z14-vid__desc" text={v.opisanie} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="z14-otbor">
          <h3 className="t-h4 z14-about__sub" id="z14-otbor">
            {t.otborTitle}
          </h3>
          <ol className="z14-otbor">
            {t.otbor.map((o, i) => (
              <li key={o.nazvanie} className="z14-otbor__item">
                <span className="z14-otbor__no" aria-hidden="true">
                  {i + 1}
                </span>
                <span>
                  <Tex className="z14-otbor__name" text={o.nazvanie} />
                  <Tex className="z14-otbor__text" text={o.text} />
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="z14-oshibki" aria-labelledby="z14-oshibki">
          <h3 className="t-h4 z14-about__sub" id="z14-oshibki">
            {t.oshibkiTitle}
          </h3>
          <ul className="z14-oshibki__list">
            {t.oshibki.map((o) => (
              <li key={o}>
                <Tex text={o} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="z14-start" aria-labelledby="z14-start-title">
        <h3 className="z14-start__title" id="z14-start-title">
          <Pic className="z14-start__flag">
            <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
          </Pic>
          {t.start.title}
        </h3>
        <ol className="z14-start__list">
          {t.start.shagi.map((shag, i) => (
            <li className="z14-start__step" key={shag.title}>
              <span className="z14-start__no" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <span className="z14-start__step-title">{shag.title}</span>
                <span className="z14-start__step-text">{shag.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="z14-sovet">
          <p className="z14-sovet__title">{t.start.sovetTitle}</p>
          <p className="z14-sovet__text">{t.start.sovet}</p>
        </div>
      </aside>
    </div>
  );
}
