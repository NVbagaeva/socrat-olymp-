import { uchitelyam } from '@/content/uchitelyam';
import { ZagruzkaStroka } from './ZagruzkaStroka';

const { srochnost: t } = uchitelyam;

/** Экран 6. Три срока, правило отсчёта и строка загрузки. */
export function Srochnost() {
  return (
    <section className="band" id="sroki" aria-labelledby="sroki-title">
      <div className="wrap">
        <div className="band__head">
          <h2 id="sroki-title">{t.title}</h2>
          <p>{t.lead}</p>
        </div>
        <ul className="svc-sroki">
          {t.items.map((item) => (
            <li key={item.srok}>
              <p className="svc-sroki__srok">{item.srok}</p>
              <p className="svc-sroki__nadbavka">{item.nadbavka}</p>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
        <div className="svc-sroki__zagruzka">
          <ZagruzkaStroka className="svc-status--card" />
          <p className="svc-note-line">{t.limit}</p>
        </div>
      </div>
    </section>
  );
}
