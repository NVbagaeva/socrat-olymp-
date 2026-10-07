import { uchitelyam } from '@/content/uchitelyam';

const { otzyvy: t } = uchitelyam;

/**
 * Экран 9. Только настоящие отзывы с письменного согласия авторов.
 * Пока их нет — честная строка о запуске и счётчик ошибок из журнала.
 */
export function Otzyvy() {
  const { zadachSdano, oshibokPosleSdachi } = t.schetchik;
  return (
    <section className="band band--soft" aria-labelledby="otzyvy-title">
      <div className="wrap">
        <div className="band__head">
          <h2 id="otzyvy-title">{t.title}</h2>
        </div>
        {t.items.length > 0 ? (
          <ul className="svc-otzyvy">
            {t.items.map((o) => (
              <li key={o.imya + o.text.slice(0, 20)}>
                <blockquote>{o.text}</blockquote>
                <p>
                  <b>{o.imya}</b>, {o.kto}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="svc-otzyvy__zapusk">{t.zapusk}</p>
        )}
        <p className="svc-schetchik">
          {zadachSdano > 0 ? t.schetchikText(oshibokPosleSdachi, zadachSdano) : t.schetchikPustoy}
        </p>
      </div>
    </section>
  );
}
