import { clsx } from 'clsx';
import Link from 'next/link';
import { PROLIV_BEZ_SVYAZOK, PROLIV_TEKST } from '@/content/karta/proliv';
import { KARTA_TEKST } from '@/content/karta/teksty';
import { oZadaniiHref, opornyeHref, razdelInfo, trenazherHref } from '@/lib/karta/katalog';
import type { Karta, ProlivSvodka, SostoyanieOblasti } from '@/lib/karta/model';
import { ZnachokZadaniya } from './znachki';

export interface ZakladkiKarty {
  est: (no: number) => boolean;
  pereklyuchit: (no: number) => void;
}

function Strelka() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Zakryt({ onZakryt }: { onZakryt: () => void }) {
  return (
    <button
      type="button"
      className="karta-panel__zakryt"
      onClick={onZakryt}
      aria-label={KARTA_TEKST.zakryt}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}

/** Панель раздела: прогресс по группам, «Стоит повторить», кнопки, закладка. */
export function PanelOblasti({
  oblast,
  zakladki,
  onZakryt,
}: {
  oblast: SostoyanieOblasti;
  zakladki: ZakladkiKarty | null;
  onZakryt: () => void;
}) {
  const { no } = oblast;
  const nazvanie = razdelInfo(no).nazvanie;
  const vZakladkah = zakladki?.est(no) ?? false;
  const trenazher = trenazherHref(no, oblast.tekushchaya ?? undefined);
  const opornye = opornyeHref(no);
  const net = oblast.sostoyanie === 'skoro';
  const pozzhe = oblast.sostoyanie === 'pozzhe';
  return (
    <>
      <header className="karta-panel__shapka">
        <span className="karta-panel__znak" aria-hidden="true">
          <svg viewBox="-12 -12 24 24">
            <ZnachokZadaniya no={no} />
          </svg>
        </span>
        <h2 className="karta-panel__nazvanie" id="karta-panel-nazvanie">
          <span>№{no}</span> {nazvanie}
        </h2>
        {zakladki === null || net ? null : (
          <button
            type="button"
            className={clsx('karta-panel__zakladka', vZakladkah && 'is-est')}
            aria-pressed={vZakladkah}
            aria-label={vZakladkah ? KARTA_TEKST.zakladka.ubrat : KARTA_TEKST.zakladka.dobavit}
            onClick={() => zakladki.pereklyuchit(no)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6.5 4.5h11v15.5l-5.5-4-5.5 4z" />
            </svg>
          </button>
        )}
        <Zakryt onZakryt={onZakryt} />
      </header>

      {net ? (
        <p className="karta-panel__zametka">{KARTA_TEKST.skoroChto}</p>
      ) : pozzhe ? (
        <>
          <p className="karta-panel__zametka">
            <b>{KARTA_TEKST.pozzhe}.</b> {KARTA_TEKST.pozzheChto}
          </p>
          <div className="karta-panel__knopki">
            <Link className="karta-knopka karta-knopka--glavnaya" href={oZadaniiHref(no)}>
              {KARTA_TEKST.otkrytRazdel}
              <Strelka />
            </Link>
            {opornye === null ? null : (
              <Link className="karta-knopka" href={opornye}>
                {KARTA_TEKST.opornye}
              </Link>
            )}
          </div>
        </>
      ) : (
        <>
          <section className="karta-panel__blok" aria-labelledby="karta-panel-progress">
            <h3 className="karta-panel__podzagolovok" id="karta-panel-progress">
              {KARTA_TEKST.progressPoTipam}
            </h3>
            <ul className="karta-polosy">
              {oblast.gruppy.map((g) => (
                <li
                  key={g.id}
                  className={clsx('karta-polosa', g.sostoyanie === 'osvoeno' && 'is-osvoeno')}
                >
                  <span className="karta-polosa__imya">{g.nazvanie}</span>
                  <span
                    className="karta-polosa__shkala"
                    role="img"
                    aria-label={`освоено ${g.osvoeno} из ${g.vsego} типов`}
                  >
                    <span style={{ width: `${g.procent}%` }} />
                  </span>
                  <span className="karta-polosa__procent">{g.procent} %</span>
                </li>
              ))}
            </ul>
          </section>
          {oblast.povtoritGruppy.length > 0 ? (
            <p className="karta-panel__povtorit">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <circle cx="12" cy="12" r="4.5" />
                <circle cx="12" cy="12" r="0.9" />
              </svg>
              <span>
                <b>{KARTA_TEKST.stoitPovtorit}</b> {oblast.povtoritGruppy.join(', ').toLowerCase()}
              </span>
            </p>
          ) : null}
          <div className="karta-panel__knopki">
            {trenazher === null ? null : (
              <Link className="karta-knopka karta-knopka--glavnaya" href={trenazher}>
                {oblast.popytok > 0 ? KARTA_TEKST.prodolzhit : KARTA_TEKST.nachat}
                <Strelka />
              </Link>
            )}
            {opornye === null ? null : (
              <Link className="karta-knopka" href={opornye}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 4l8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4" />
                </svg>
                {KARTA_TEKST.opornye}
              </Link>
            )}
          </div>
        </>
      )}
    </>
  );
}

/** Карточка «Переход ко второй части». */
export function PanelProliva({
  svodka,
  onChast2,
  onOblast,
  onZakryt,
}: {
  svodka: ProlivSvodka;
  onChast2: () => void;
  onOblast: (no: number) => void;
  onZakryt: () => void;
}) {
  return (
    <>
      <header className="karta-panel__shapka">
        <h2 className="karta-panel__nazvanie" id="karta-panel-nazvanie">
          {PROLIV_TEKST.zagolovok}
        </h2>
        <Zakryt onZakryt={onZakryt} />
      </header>
      <p className={clsx('karta-panel__itog', svodka.mozhno && 'is-mozhno')}>
        <b>{svodka.mozhno ? PROLIV_TEKST.mozhno : PROLIV_TEKST.podtyanut}</b>
        <span>
          {KARTA_TEKST.materik(svodka.osvoeno, svodka.vsego)} в части 1
          {svodka.mozhno ? '' : ` — для второй части хорошо бы ${svodka.porog}`}
        </span>
      </p>
      <ul className="karta-svyazki">
        {svodka.zadaniya.map((z) => {
          const podtyanut = z.nuzhny.filter((n) => !n.gotovo);
          return (
            <li
              key={z.no}
              className={clsx('karta-svyazka', z.nuzhny.length > 0 && z.gotovo && 'is-gotovo')}
            >
              <button
                type="button"
                className="karta-svyazka__zadanie"
                onClick={() => onOblast(z.no)}
              >
                №{z.no} {razdelInfo(z.no).nazvanie}
              </button>
              <span className="karta-svyazka__chto">
                {z.nuzhny.length === 0 ? (
                  PROLIV_BEZ_SVYAZOK
                ) : z.gotovo ? (
                  PROLIV_TEKST.gotovo
                ) : (
                  <>
                    {PROLIV_TEKST.nuzhno}:{' '}
                    {podtyanut.map((n, i) => (
                      <span key={n.no}>
                        {i > 0 ? ', ' : ''}
                        <button
                          type="button"
                          className="karta-svyazka__ssylka"
                          onClick={() => onOblast(n.no)}
                        >
                          №{n.no}
                        </button>
                      </span>
                    ))}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="karta-panel__knopki">
        <button type="button" className="karta-knopka karta-knopka--glavnaya" onClick={onChast2}>
          {PROLIV_TEKST.knopka}
          <Strelka />
        </button>
      </div>
    </>
  );
}

/** Сводка материка: «Освоено 4 из 13» и его области списком. */
export function PanelMaterika({
  chast,
  karta,
  onOblast,
  onZakryt,
}: {
  chast: 1 | 2;
  karta: Karta;
  onOblast: (no: number) => void;
  onZakryt: () => void;
}) {
  const oblasti = karta.oblasti.filter((o) => o.chast === chast);
  return (
    <>
      <header className="karta-panel__shapka">
        <h2 className="karta-panel__nazvanie" id="karta-panel-nazvanie">
          {KARTA_TEKST.chast(chast)}
        </h2>
        <Zakryt onZakryt={onZakryt} />
      </header>
      <p className="karta-panel__itog is-mozhno">
        <b>{KARTA_TEKST.materik(karta.osvoenoChast[chast], karta.vsegoChast[chast])}</b>
      </p>
      <ul className="karta-spisok">
        {oblasti.map((o) => (
          <li key={o.no}>
            <button
              type="button"
              className={clsx('karta-spisok__oblast', `karta-spisok__oblast--${o.sostoyanie}`)}
              onClick={() => onOblast(o.no)}
            >
              <span className="karta-spisok__nomer">{o.no}</span>
              <span className="karta-spisok__imya">{razdelInfo(o.no).nazvanie}</span>
              <span className="karta-spisok__status">
                {o.sostoyanie === 'v-processe'
                  ? `${o.procent} %`
                  : KARTA_TEKST.status[o.sostoyanie]}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
