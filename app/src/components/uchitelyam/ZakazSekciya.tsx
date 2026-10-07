import { CELI, uchitelyam } from '@/content/uchitelyam';
import { Cel } from './Cel';
import { ZagruzkaStroka } from './ZagruzkaStroka';
import { ZakazForma } from './ZakazForma';

const { forma: t } = uchitelyam;

/** Экран 12. Заголовок, строка загрузки и форма. */
export function ZakazSekciya() {
  return (
    <section className="band band--soft" id="zakaz" aria-labelledby="zakaz-title">
      <div className="wrap svc-zakaz">
        <div className="svc-zakaz__head">
          <h2 className="svc-h2" id="zakaz-title">
            {t.title}
          </h2>
          <p className="svc-sub">{t.lead}</p>
          <ZagruzkaStroka className="svc-status--card" />
          <Cel name={CELI.forma} />
        </div>
        <ZakazForma />
      </div>
    </section>
  );
}
