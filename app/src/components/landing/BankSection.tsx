import { Badge } from '@/components/ui';
import { landing } from '@/content/landing';

const { bank } = landing;

export function BankSection() {
  return (
    <section className="band" id="bank">
      <div className="wrap">
        <div className="band__head">
          <h2>{bank.title}</h2>
          <p>{bank.lead}</p>
        </div>
        <ol className="dirs">
          {bank.directions.map((direction) => (
            <li className="dir" key={direction.no}>
              <span className="dir__no">{direction.no}</span>
              <span className="dir__nm">{direction.name}</span>
              <span className="dir__tag">
                {direction.badge ? <Badge tone="info">{direction.badge}</Badge> : null}
              </span>
            </li>
          ))}
        </ol>
        <p className="dirs__note">{bank.note}</p>
      </div>
    </section>
  );
}
