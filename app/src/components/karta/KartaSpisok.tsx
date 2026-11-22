import { clsx } from 'clsx';
import Link from 'next/link';
import { KARTA_TEKST, oblastDlyaDiktora } from '@/content/karta/teksty';
import { oZadaniiHref, opornyeHref, razdelInfo, trenazherHref } from '@/lib/karta/katalog';
import type { Karta, SostoyanieOblasti } from '@/lib/karta/model';
import { nomerRazdela } from '@/content/struktura';
import { KartaTropinka } from './KartaOkoshko';
import type { ZakladkiKarty } from './KartaPanel';

/**
 * «Карта ЕГЭ» на телефоне: та же карта, но путь сверху вниз. Острова
 * широкой схемы на узком экране превращались в мелкие подписи, которые
 * налезали друг на друга, поэтому здесь — список разделов по частям
 * экзамена, соединённый линией пути. У каждого раздела номер, название
 * (переносится целиком), значок и слово состояния — не только цвет.
 * Нажатие раскрывает раздел на месте: темы и кнопки тренировки.
 *
 * Эффектов на каждом узле нет (ни размытия стекла, ни анимированных
 * теней): список листается плавно и на слабом телефоне.
 */
export function KartaSpisok({
  karta,
  vybran,
  sleduyushchaya,
  vernulis,
  zakladki,
  onVybor,
}: {
  karta: Karta;
  /** Раскрытый раздел. */
  vybran: number | null;
  sleduyushchaya: number | null;
  /** Раздел, на который только что вернулись: мягкая подсветка. */
  vernulis: number | null;
  zakladki: ZakladkiKarty | null;
  onVybor: (no: number | null) => void;
}) {
  return (
    <div className="karta-ps" aria-label={KARTA_TEKST.spisok.nazvanie} role="region">
      {([1, 2] as const).map((chast) => {
        const oblasti = karta.oblasti.filter((o) => o.chast === chast);
        if (oblasti.length === 0) return null;
        return (
          <section key={chast} className="karta-ps__chast" aria-labelledby={`karta-ps-${chast}`}>
            <h2 className="karta-ps__zagolovok" id={`karta-ps-${chast}`}>
              <span>{KARTA_TEKST.chast(chast)}</span>
              <span className="karta-ps__itog">
                {KARTA_TEKST.materik(karta.osvoenoChast[chast], karta.vsegoChast[chast])}
              </span>
            </h2>
            <ol className="karta-ps__put">
              {oblasti.map((o) => (
                <Uzel
                  key={o.no}
                  oblast={o}
                  otkryt={vybran === o.no}
                  sleduyushchaya={sleduyushchaya === o.no}
                  vernulis={vernulis === o.no}
                  zakladki={zakladki}
                  onVybor={onVybor}
                />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

/** Значок состояния: галочка, кольцо с долей, пустой круг, часы. */
function Metka({ oblast }: { oblast: SostoyanieOblasti }) {
  const s = oblast.sostoyanie;
  return (
    <span className="karta-ps__metka" aria-hidden="true">
      <svg viewBox="0 0 32 32">
        {s === 'osvoeno' ? (
          <>
            <circle className="karta-ps__krug" cx="16" cy="16" r="14" />
            <path className="karta-ps__znak" d="M9.5 16.5l4.5 4.5 8.5-9.5" />
          </>
        ) : s === 'v-processe' ? (
          <>
            <circle className="karta-ps__krug" cx="16" cy="16" r="14" />
            <circle
              className="karta-ps__dolya"
              cx="16"
              cy="16"
              r="10"
              pathLength={100}
              strokeDasharray={`${Math.max(4, oblast.procent)} 100`}
              transform="rotate(-90 16 16)"
            />
          </>
        ) : s === 'ne-nachato' ? (
          <circle className="karta-ps__krug" cx="16" cy="16" r="14" />
        ) : (
          <>
            <circle className="karta-ps__krug" cx="16" cy="16" r="14" />
            <path className="karta-ps__znak" d="M16 9v7l4.5 3" />
          </>
        )}
      </svg>
    </span>
  );
}

function statusSlovom(o: SostoyanieOblasti): string {
  if (o.sostoyanie === 'v-processe') return `${KARTA_TEKST.spisok.vProcesse} · ${o.procent} %`;
  return KARTA_TEKST.spisok.status[o.sostoyanie];
}

function Uzel({
  oblast,
  otkryt,
  sleduyushchaya,
  vernulis,
  zakladki,
  onVybor,
}: {
  oblast: SostoyanieOblasti;
  otkryt: boolean;
  sleduyushchaya: boolean;
  vernulis: boolean;
  zakladki: ZakladkiKarty | null;
  onVybor: (no: number | null) => void;
}) {
  const { no } = oblast;
  const nazvanie = razdelInfo(no).nazvanie;
  const s = oblast.sostoyanie;
  const detaliId = `karta-ps-detali-${no}`;
  const trenazher = trenazherHref(no, oblast.tekushchaya ?? undefined);
  const opornye = opornyeHref(no);
  const vZakladkah = zakladki?.est(no) ?? false;
  return (
    <li
      className={clsx(
        'karta-ps__uzel',
        `karta-ps__uzel--${s}`,
        otkryt && 'is-otkryt',
        sleduyushchaya && 'is-sleduyushchaya',
        oblast.povtorit && 'is-povtorit',
        vernulis && 'is-vernulis',
      )}
      data-no={no}
    >
      <button
        type="button"
        className="karta-ps__knopka"
        data-cel={`oblast:${no}`}
        aria-expanded={otkryt}
        aria-controls={detaliId}
        aria-label={oblastDlyaDiktora({
          no,
          nazvanie,
          sostoyanie: s,
          procent: oblast.procent,
          povtoritGruppy: oblast.povtoritGruppy,
          sleduyushchaya,
        })}
        onClick={() => onVybor(otkryt ? null : no)}
      >
        <Metka oblast={oblast} />
        <span className="karta-ps__tekst" aria-hidden="true">
          <span className="karta-ps__imya">
            <b>№{nomerRazdela(no)}</b> {nazvanie}
          </span>
          <span className="karta-ps__status">
            {statusSlovom(oblast)}
            {oblast.povtorit ? (
              <span className="karta-ps__povtorit"> · {KARTA_TEKST.spisok.povtorit}</span>
            ) : null}
          </span>
          {sleduyushchaya ? (
            <span className="karta-ps__dalee">{KARTA_TEKST.legenda.sleduyushchaya}</span>
          ) : null}
        </span>
        <svg className="karta-ps__strelka" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {otkryt ? (
        <div className="karta-ps__detali" id={detaliId}>
          {s === 'skoro' ? (
            <p className="karta-ps__zametka">{KARTA_TEKST.skoroChto}</p>
          ) : s === 'pozzhe' ? (
            <p className="karta-ps__zametka">{KARTA_TEKST.pozzheChto}</p>
          ) : (
            <KartaTropinka oblast={oblast} />
          )}
          {s === 'skoro' ? null : (
            <div className="karta-ps__knopki">
              {trenazher === null || s === 'pozzhe' ? null : (
                <Link className="karta-knopka karta-knopka--glavnaya" href={trenazher}>
                  {oblast.popytok > 0 ? KARTA_TEKST.prodolzhit : KARTA_TEKST.nachat}
                </Link>
              )}
              {opornye === null ? null : (
                <Link className="karta-knopka" href={opornye}>
                  {KARTA_TEKST.opornye}
                </Link>
              )}
              <Link className="karta-knopka" href={oZadaniiHref(no)}>
                {KARTA_TEKST.oZadanii}
              </Link>
              {zakladki === null ? null : (
                <button
                  type="button"
                  className={clsx(
                    'karta-panel__zakladka karta-ps__zakladka',
                    vZakladkah && 'is-est',
                  )}
                  aria-pressed={vZakladkah}
                  aria-label={
                    vZakladkah ? KARTA_TEKST.zakladka.ubrat : KARTA_TEKST.zakladka.dobavit
                  }
                  onClick={() => zakladki.pereklyuchit(no)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.5 4.5h11v15.5l-5.5-4-5.5 4z" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}
