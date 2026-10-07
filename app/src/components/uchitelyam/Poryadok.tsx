import { uchitelyam } from '@/content/uchitelyam';

const { poryadok: t } = uchitelyam;

/** Экран 7. Пять шагов в раскладке блока «Мы взяли на себя…» главной. */
export function Poryadok() {
  return (
    <section className="band band--soft" aria-labelledby="poryadok-title">
      <div className="wrap">
        <div className="band__head">
          <h2 id="poryadok-title">{t.title}</h2>
        </div>
        <ol className="steps svc-steps">
          {t.steps.map((step) => (
            <li className="step" key={step.no}>
              <b>{step.no}</b>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="svc-note-line">{t.podpis}</p>
      </div>
    </section>
  );
}
