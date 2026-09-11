import { landing } from '@/content/landing';

const { how } = landing;

export function HowSection() {
  return (
    <section className="band band--soft" id="how">
      <div className="wrap">
        <div className="band__head">
          <h2>{how.title}</h2>
        </div>
        <ol className="steps">
          {how.steps.map((step) => (
            <li className="step" key={step.no}>
              <b>{step.no}</b>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
