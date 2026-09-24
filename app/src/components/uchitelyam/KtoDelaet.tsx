import { uchitelyam } from '@/content/uchitelyam';

const { ktoDelaet: t } = uchitelyam;

/** Экран 8. Короткая полоса об авторе со ссылкой на «Об авторе». */
export function KtoDelaet() {
  return (
    <section className="band" aria-labelledby="kto-title">
      <div className="wrap svc-kto">
        <img src={t.photo} alt={t.name} width="160" height="160" loading="lazy" decoding="async" />
        <div>
          <p className="svc-eyebrow" id="kto-title">
            {t.title}
          </p>
          <h2 className="svc-h3">{t.name}</h2>
          <p>{t.text}</p>
          <a className="svc-link" href={t.link.href}>
            {t.link.label} →
          </a>
        </div>
      </div>
    </section>
  );
}
