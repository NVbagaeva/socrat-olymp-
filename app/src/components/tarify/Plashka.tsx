import { clsx } from 'clsx';
import Link from 'next/link';
import { tasksPage } from '@/content/tasks';
import { assetUrl } from '@/lib/assetUrl';
import {
  DO_EGE,
  PAYMENTS_ENABLED,
  TARIFY_TEXT,
  rubli,
  tsena,
  type Plashka as PlashkaData,
  type Rol,
  type Srok,
} from '@/lib/tarify/config';

/* Украшения — только готовые стеклянные картинки сайта. */
const KARTINKI: Record<'besplatno' | 'probnyy' | 'platnyy', string> = {
  besplatno: assetUrl('/images/tarify/piramida-320.webp'),
  probnyy: assetUrl('/images/tarify/kristall-320.webp'),
  platnyy: assetUrl('/images/tarify/kubok-320.webp'),
};

function Galka() {
  return (
    <svg className="tf-punkt__znak" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </svg>
  );
}
function Cherta() {
  return (
    <svg className="tf-punkt__znak" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M6 10h8" />
    </svg>
  );
}

export interface PlashkaProps {
  plashka: PlashkaData;
  /** Переопределить флаг оплаты — только для витрины. */
  oplata?: boolean;
  predprosmotr?: boolean;
  rol: Rol;
  srok: Srok;
  /** Дата покупки для цены «До ЕГЭ» (ГГГГ-ММ-ДД). */
  data?: string;
  className?: string;
}

export interface KnopkaTarifaProps {
  plashka: PlashkaData;
  rol: Rol;
  srok: Srok;
  /** Включена ли оплата. По умолчанию — флаг NEXT_PUBLIC_PAYMENTS_ENABLED. */
  oplata?: boolean;
  /**
   * Только для витрины: состояние «оплата включена» рисуется неактивным
   * макетом, без ссылки. Так на сайте нет ни одной активной кнопки оплаты,
   * пока флаг выключен, — даже на служебной странице.
   */
  predprosmotr?: boolean;
}

/** Куда ведёт кнопка при включённой оплате: регистрация с выбранным тарифом. */
export function hrefOplaty(id: PlashkaData['id'], rol: Rol, srok: Srok): string {
  const params = new URLSearchParams({ tarif: id, rol });
  if (id !== 'probnyy') params.set('srok', srok);
  return `/voyti/?${params.toString()}`;
}

/**
 * Кнопка плашки. Оплата выключена — активна только «Начать заниматься»,
 * остальные неактивны. Включена — ссылки на регистрацию с тарифом;
 * самой оплаты здесь нет, её добавит следующий PR.
 */
export function KnopkaTarifa({
  plashka,
  rol,
  srok,
  oplata = PAYMENTS_ENABLED,
  predprosmotr = false,
}: KnopkaTarifaProps) {
  const { knopki } = TARIFY_TEXT;
  if (plashka.id === 'besplatno') {
    return (
      <Link className="tf-knopka tf-knopka--steklo" href={tasksPage.href}>
        {knopki.nachat}
      </Link>
    );
  }
  const glavnaya = plashka.id !== 'probnyy';
  const vid = glavnaya ? 'tf-knopka--teplaya' : 'tf-knopka--sinyaya';
  if (!oplata) {
    return (
      <button type="button" className={clsx('tf-knopka', vid)} disabled data-oplata="vyklyuchena">
        {knopki.skoro}
      </button>
    );
  }
  const podpis = glavnaya ? knopki.oplatit : knopki.probnyy;
  if (predprosmotr) {
    return (
      <span className={clsx('tf-knopka', vid)} data-oplata="predprosmotr" aria-disabled="true">
        {podpis}
      </span>
    );
  }
  return (
    <Link
      className={clsx('tf-knopka', vid)}
      href={hrefOplaty(plashka.id, rol, srok)}
      data-oplata="vklyuchena"
    >
      {podpis}
    </Link>
  );
}

/** Стеклянная плашка тарифа: название, цена, для кого, пункты, кнопка. */
export function Plashka({
  plashka,
  rol,
  srok,
  data,
  oplata,
  predprosmotr,
  className,
}: PlashkaProps) {
  const platnyy = plashka.id === 'uchenik' || plashka.id === 'repetitor';
  const summa = platnyy ? tsena(rol, srok, data) : 0;
  const vid = platnyy ? 'platnyy' : plashka.id === 'probnyy' ? 'probnyy' : 'besplatno';

  return (
    <article className={clsx('tf-plashka', `tf-plashka--${vid}`, className)}>
      <img
        className="tf-plashka__kartinka"
        src={KARTINKI[vid]}
        alt=""
        width={160}
        height={160}
        /* Платная плашка видна в первом экране — её картинку не откладываем. */
        loading={platnyy ? 'eager' : 'lazy'}
        decoding="async"
      />
      {platnyy ? <p className="tf-plashka__metka">{TARIFY_TEXT.metkaGlavnoy}</p> : null}
      <h3 className="tf-plashka__nazvanie">{plashka.nazvanie}</h3>
      <p className="tf-plashka__tsena">
        <span className="tf-plashka__summa">{summa === null ? '—' : rubli(summa)}</span>
        <span className="tf-plashka__srok">
          {platnyy ? (srok === 'd30' ? TARIFY_TEXT.za30 : DO_EGE.podpis) : TARIFY_TEXT.bezKarty}
        </span>
      </p>
      <p className="tf-plashka__dlya">{plashka.dlyaKogo}</p>

      <ul className="tf-punkty">
        {plashka.vhodit.map((punkt) => (
          <li key={punkt} className="tf-punkt">
            <Galka />
            {punkt}
          </li>
        ))}
        {plashka.net.map((punkt) => (
          <li key={punkt} className="tf-punkt tf-punkt--net">
            <Cherta />
            {punkt}
          </li>
        ))}
      </ul>

      <div className="tf-plashka__niz">
        <KnopkaTarifa
          plashka={plashka}
          rol={rol}
          srok={srok}
          {...(oplata === undefined ? {} : { oplata })}
          {...(predprosmotr === undefined ? {} : { predprosmotr })}
        />
        {platnyy ? <p className="tf-plashka__snoska">{TARIFY_TEXT.bezAvtoprodleniya}</p> : null}
      </div>
    </article>
  );
}
