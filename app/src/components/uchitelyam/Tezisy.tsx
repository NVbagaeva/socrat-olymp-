import { uchitelyam } from '@/content/uchitelyam';

const { tezisy } = uchitelyam;

/** Экран 3. Четыре тезиса без карточек и иконок: «красиво» → «правильно». */
export function Tezisy() {
  return (
    <section className="band" aria-labelledby="tezisy-title">
      <div className="wrap">
        <div className="band__head">
          <h2 id="tezisy-title">{tezisy.title}</h2>
        </div>
        <ul className="svc-tezisy">
          {tezisy.items.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
