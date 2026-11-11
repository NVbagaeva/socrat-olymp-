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
  besplatno: '/images/pyramid-glass.webp',
  probnyy: '/images/glass/crystal-sharp.png',
  platnyy: '/images/trophy-glass.webp',
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
  rol: Rol;
  srok: Srok;
  /** Дата покупки для цены «До ЕГЭ» (ГГГГ-ММ-ДД). */
  data?: string;
  className?: string;
}

/**
 * Кнопка плашки. Оплата выключена — активна только «Начать заниматься»,
 * остальные неактивны. Включена — ссылки на регистрацию; самой оплаты
 * здесь нет, её добавит следующий PR.
 */
function Knopka({ plashka }: { plashka: PlashkaData }) {
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
  if (!PAYMENTS_ENABLED) {
    return (
      <button type="button" className={clsx('tf-knopka', vid)} disabled data-oplata="vyklyuchena">
        {knopki.skoro}
      </button>
    );
  }
  return (
    <Link
      className={clsx('tf-knopka', vid)}
      href={`/voyti/?tarif=${plashka.id}`}
      data-oplata="vklyuchena"
    >
      {glavnaya ? knopki.oplatit : knopki.probnyy}
    </Link>
  );
}

/** Стеклянная плашка тарифа: название, цена, для кого, пункты, кнопка. */
export function Plashka({ plashka, rol, srok, data, className }: PlashkaProps) {
  const platnyy = plashka.id === 'uchenik' || plashka.id === 'repetitor';
  const summa = platnyy ? tsena(rol, srok, data) : 0;
  const vid = platnyy ? 'platnyy' : plashka.id === 'probnyy' ? 'probnyy' : 'besplatno';

  return (
    <article className={clsx('tf-plashka', `tf-plashka--${vid}`, className)}>
      <img
        className="tf-plashka__kartinka"
        src={assetUrl(KARTINKI[vid])}
        alt=""
        width={160}
        height={160}
        loading="lazy"
        decoding="async"
      />
      {platnyy ? <p className="tf-plashka__metka">{TARIFY_TEXT.metkaGlavnoy}</p> : null}
      <h3 className="tf-plashka__nazvanie">{plashka.nazvanie}</h3>
      <p className="tf-plashka__tsena">
        <span className="tf-plashka__summa">{rubli(summa ?? 0)}</span>
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
        <Knopka plashka={plashka} />
        {platnyy ? <p className="tf-plashka__snoska">{TARIFY_TEXT.bezAvtoprodleniya}</p> : null}
      </div>
    </article>
  );
}
