import { landing, type Step } from '@/content/landing';

const { how } = landing;

export function HowSection() {
  return (
    <section className="band band--soft" id="how">
      <div className="wrap">
        <div className="band__head">
          <h2>{how.title}</h2>
        </div>
        <ol className="steps">
          {how.steps.map((step: Step) => (
            <li className="step" key={step.no}>
              <b>{step.no}</b>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              {step.link ? (
                <a className="svc-step-link" href={step.link.href}>
                  {step.link.label}
                </a>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
