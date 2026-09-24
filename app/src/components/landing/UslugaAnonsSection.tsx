'use client';

import { ByloStaloArt } from '@/components/uchitelyam/ByloStaloArt';
import { CELI } from '@/content/uchitelyam';
import { landing } from '@/content/landing';
import { cel } from '@/lib/metrika';

const { uslugaAnons: t } = landing;

/**
 * Анонс услуги «Материалы под ключ» сразу после блока «Мы взяли на себя…».
 * Утверждён мокапом этапа 1: белая подложка, кнопка второго уровня —
 * синяя кнопка на главной остаётся одна, «Создать вариант».
 */
export function UslugaAnonsSection() {
  return (
    <section className="band band--soft svc-promo" aria-labelledby="svc-promo-title">
      <div className="wrap split">
        <ByloStaloArt vid="anons" />
        <div>
          <p className="svc-promo__eyebrow">{t.eyebrow}</p>
          <h3 id="svc-promo-title">{t.title}</h3>
          <p>{t.text}</p>
          <div className="split__actions">
            <a className="btn btn--secondary" href={t.action.href} onClick={() => cel(CELI.anons)}>
              {t.action.label}
            </a>
          </div>
          <p className="svc-promo__price">{t.price}</p>
        </div>
      </div>
    </section>
  );
}
