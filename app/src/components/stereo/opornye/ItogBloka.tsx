'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { OPORNYE_3 } from '@/content/stereo/opornye3';
import { IkGalochka, IkKniga, IkKrestik, IkPovtor, IkStrelka } from '../metodika/Ikonki';

export interface PlitkaItoga {
  no: number;
  kratkoHtml: string;
  /** Миниатюра чертежа задачи (SVG, «стекло», без подписей). */
  miniatyura: string;
  verno: boolean;
}

/**
 * Итог блока опорных задач: «8 из 10» с процентом и полосой, плитки
 * задач (номер, верно / ошибка, миниатюра чертежа, короткое
 * название), ошибки с «Перерешать ошибки», «Повторить теорию» и
 * «Следующий шаг».
 */
export function ItogBloka({
  nazvanie,
  plitki,
  teoriyaHref,
  listHref,
  trenazherHref,
  onOtkryt,
}: {
  nazvanie: string;
  plitki: readonly PlitkaItoga[];
  teoriyaHref: string;
  listHref: string;
  trenazherHref: string;
  /** Открыть задачу по месту в блоке (с нуля). */
  onOtkryt: (index: number) => void;
}) {
  const total = plitki.length;
  const right = plitki.filter((p) => p.verno).length;
  const oshibki = plitki.filter((p) => !p.verno);
  const t = OPORNYE_3.itog;
  return (
    <div className="o3-itog2">
      <section className="o3-itog2__shapka" role="status">
        <span className="o3-itog2__znak" aria-hidden="true">
          <IkGalochka />
        </span>
        <div className="o3-itog2__zag">
          <p className="o3-itog2__title">{t.title}</p>
          <p className="o3-itog2__blok">{nazvanie}</p>
        </div>
        <div className="o3-itog2__schet">
          <p className="o3-itog2__n">
            <b>{right}</b> из {total}
          </p>
          <p className="o3-itog2__proc">{t.procent(right, total)}</p>
        </div>
        <div
          className="o3-polosa o3-polosa--uspeh o3-itog2__polosa"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={right}
          aria-label={t.procent(right, total)}
        >
          <span style={{ width: `${(100 * right) / total}%` }} />
        </div>
      </section>

      <section className="o3-itog2__rez" aria-labelledby="o3-itog2-rez">
        <h3 className="o3-itog2__h" id="o3-itog2-rez">
          {t.rezultaty}
        </h3>
        <ul className="o3-plitki">
          {plitki.map((p, i) => (
            <li key={p.no}>
              <button
                type="button"
                className={clsx('o3-plitka', p.verno ? 'is-right' : 'is-wrong')}
                onClick={() => onOtkryt(i)}
              >
                <span className="o3-plitka__verh">
                  <span className="o3-plitka__no">{p.no}</span>
                  <span className="o3-plitka__st" aria-hidden="true">
                    {p.verno ? <IkGalochka /> : <IkKrestik />}
                  </span>
                  <span className="sr-only">{p.verno ? t.verno : t.oshibka}</span>
                </span>
                <span
                  className="o3-plitka__ris"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: p.miniatyura }}
                />
                <span className="o3-plitka__t" dangerouslySetInnerHTML={{ __html: p.kratkoHtml }} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {oshibki.length === 0 ? null : (
        <section className="o3-itog2__oshibki">
          <span className="o3-itog2__krug o3-itog2__krug--oshibka" aria-hidden="true">
            <IkKrestik />
          </span>
          <div className="o3-itog2__tekst">
            <p className="o3-itog2__st">
              {t.oshibki} <span className="o3-itog2__nomera">{oshibki.map((p) => p.no).join(', ')}</span>
            </p>
            <p className="o3-itog2__lead">{t.oshibkiLead}</p>
          </div>
          <button
            type="button"
            className="btn o3-btn-oshibki"
            onClick={() => onOtkryt(plitki.findIndex((p) => !p.verno))}
          >
            <IkPovtor />
            {t.pereresit}
            <IkStrelka />
          </button>
        </section>
      )}

      <section className="o3-itog2__teoriya">
        <span className="o3-itog2__krug o3-itog2__krug--teoriya" aria-hidden="true">
          <IkKniga />
        </span>
        <div className="o3-itog2__tekst">
          <p className="o3-itog2__st">{t.teoriyaTitle}</p>
          <p className="o3-itog2__lead">{t.teoriyaLead}</p>
        </div>
        <Link className="btn btn--secondary o3-btn-strelka" href={teoriyaHref}>
          {t.kTeorii}
          <IkStrelka />
        </Link>
      </section>

      <section className="o3-itog2__dalshe">
        <span className="o3-itog2__krug o3-itog2__krug--dalshe" aria-hidden="true">
          <IkStrelka />
        </span>
        <div className="o3-itog2__tekst">
          <p className="o3-itog2__st">{t.dalsheTitle}</p>
          <p className="o3-itog2__lead">{t.dalsheLead}</p>
        </div>
        <div className="o3-itog2__knopki">
          <Link className="btn btn--secondary" href={listHref}>
            {t.kBlokam}
          </Link>
          <Link className="btn btn--primary o3-btn-strelka" href={trenazherHref}>
            {t.vTrenazher}
            <IkStrelka />
          </Link>
        </div>
      </section>
    </div>
  );
}
