import { clsx } from 'clsx';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Metka, Polosa, ShagiResheniya, Znak, type Shag, type Ton } from '../steklo';
import './karta.css';

/**
 * Карта задания — вкладка «О задании» в «Стеклянной сцене».
 *
 * Шапка (что проверяет, баллы, минуты, чем опасно), группы типов с
 * прогрессом ученика, карточки типов с разобранным примером, блок
 * формул с примерами и сворачиваемая панель. Компоненты ничего не
 * знают о номере задания: тексты, формулы (уже набранные KaTeX) и
 * прогресс приходят пропсами, так что те же карточки пойдут на №7,
 * №5 и остальные разделы.
 *
 * Раскрытия — на <details>: работают без JS и в статической сборке.
 */

export interface Fakt {
  znachenie: string;
  podpis: string;
}

export function KartaShapka({
  nadzagolovok,
  zagolovok,
  lead,
  fakty,
  opasnoTitle,
  opasno,
  oblozhka,
  oblozhkaShirokaya = false,
}: {
  nadzagolovok: string;
  zagolovok: string;
  lead: string;
  fakty: Fakt[];
  opasnoTitle: string;
  /** Пункты «чем опасно», HTML (формулы набраны). */
  opasno: string[];
  /** Обложка раздела — крупно рядом с заголовком (готовая картинка). */
  oblozhka?: ReactNode;
  /**
   * Обложка — широкая картинка (шапка №1, 1567×1004), а не квадратная
   * иконка: на телефоне и планшете она во всю ширину над текстом,
   * целиком; на компьютере — справа, в половину шапки.
   */
  oblozhkaShirokaya?: boolean;
}) {
  return (
    <header
      className={clsx(
        'kz-shapka stk-glass',
        oblozhka !== undefined && 'kz-shapka--oblozhka',
        oblozhka !== undefined && oblozhkaShirokaya && 'kz-shapka--shirokaya',
      )}
    >
      {oblozhka === undefined ? null : <div className="kz-shapka__oblozhka">{oblozhka}</div>}
      <div className="kz-shapka__text">
        <p className="stk-nad">{nadzagolovok}</p>
        <h2 className="kz-h2">{zagolovok}</h2>
        <p className="stk-lead">{lead}</p>
      </div>
      <ul className="kz-fakty">
        {fakty.map((f) => (
          <li className="kz-fakt" key={f.podpis}>
            <b>{f.znachenie}</b>
            <span>{f.podpis}</span>
          </li>
        ))}
      </ul>
      <div className="kz-opasno">
        <p className="kz-opasno__zag">{opasnoTitle}</p>
        <ul>
          {opasno.map((line, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: line }} />
          ))}
        </ul>
      </div>
    </header>
  );
}

export interface GruppaProgress {
  resheno: number;
  verno: number;
  /** Из последних пяти попыток две и больше неверных. */
  povtorit: boolean;
}

export interface KartaGruppaLabels {
  tipov: (n: number) => string;
  povtorit: string;
  neNachato: string;
  resheno: (resheno: number, verno: number) => string;
}

/** Мини-прогресс группы: «решено · верно», полоса, метка «Стоит повторить». */
export function KartaGruppaProgress({
  progress,
  labels,
}: {
  /** null — прогресс ещё не прочитан (первая отрисовка). */
  progress: GruppaProgress | null;
  labels: KartaGruppaLabels;
}) {
  const nachato = progress !== null && progress.resheno > 0;
  const dolya = nachato ? progress.verno / progress.resheno : 0;
  return (
    <>
      <span className="kz-gruppa__schet">
        {nachato ? labels.resheno(progress.resheno, progress.verno) : labels.neNachato}
      </span>
      <Polosa dolya={dolya} ton={progress?.povtorit === true ? 'terra' : 'blue'} />
      {progress?.povtorit === true ? <Metka ton="terra">{labels.povtorit}</Metka> : null}
    </>
  );
}

/**
 * Карточка группы: значок, название, число типов, мини-прогресс;
 * внутри — типы. Прогресс приходит готовым узлом: это маленький
 * клиентский островок, а сама карточка с типами и примерами остаётся
 * серверной разметкой и в данные клиента не попадает.
 */
export function KartaGruppa({
  id,
  nazvanie,
  znakHtml,
  znak,
  ton,
  tipov,
  progress,
  labels,
  open = false,
  children,
}: {
  id: string;
  nazvanie: string;
  znakHtml: string;
  /** Значок-фигура вместо формулы (стереометрия). */
  znak?: ReactNode;
  ton: Ton;
  tipov: number;
  progress: ReactNode;
  labels: Pick<KartaGruppaLabels, 'tipov'>;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      className={clsx('kz-gruppa stk-glass', `stk-ton--${ton}`)}
      id={`gruppa-${id}`}
      open={open}
    >
      <summary className="kz-gruppa__summary stk-summary">
        <Znak html={znakHtml} figura={znak} ton={ton} />
        <span className="kz-gruppa__text">
          <span className="kz-gruppa__nazvanie" dangerouslySetInnerHTML={{ __html: nazvanie }} />
          <span className="kz-gruppa__tipov">{labels.tipov(tipov)}</span>
        </span>
        <span className="kz-gruppa__progress">{progress}</span>
        <span className="stk-shevron" aria-hidden="true" />
      </summary>
      <div className="kz-tipy">{children}</div>
    </details>
  );
}

/** Подзаголовок внутри группы: «Формулы двойного угла». */
export function KartaPodgruppa({ children }: { children: ReactNode }) {
  return <p className="kz-podgruppa">{children}</p>;
}

/** Карточка типа: человеческое название, код мелко, внутри — разобранный пример. */
export function KartaTip({
  id,
  nazvanieHtml,
  lead,
  kod,
  open = false,
  children,
}: {
  id: string;
  /** Название, HTML (в названии может быть формула). */
  nazvanieHtml: string;
  lead?: string;
  /** Код прототипа: мелко справа, с подсказкой. */
  kod?: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="kz-tip" id={`tip-${id}`} open={open}>
      <summary
        className="kz-tip__summary stk-summary"
        title={kod === undefined ? undefined : `Тип ${kod}`}
      >
        <span className="kz-tip__text">
          <span className="kz-tip__nazvanie" dangerouslySetInnerHTML={{ __html: nazvanieHtml }} />
          {lead === undefined ? null : (
            <span className="kz-tip__lead" dangerouslySetInnerHTML={{ __html: lead }} />
          )}
        </span>
        <span className="stk-shevron" aria-hidden="true" />
      </summary>
      {children}
    </details>
  );
}

export interface KartaPrimerLabels {
  primer: string;
  otvet: string;
  lovushka: string;
  trenirovat: string;
  opornye: string;
}

/** Разобранный пример типа: условие, шаги, ловушка, ответ, две кнопки. */
export function KartaPrimer({
  risunok,
  uslovieHtml,
  shagi,
  otvet,
  opasnoHtml,
  trenirovatHref,
  opornyeHref,
  labels,
  posle,
}: {
  /** Чертёж к примеру: между условием и шагами (стереометрия). */
  risunok?: ReactNode;
  /** Под шагами: например, рисунок метода с подсветкой (№4, №5). */
  posle?: ReactNode;
  uslovieHtml: string;
  shagi: Shag[];
  otvet: string;
  /** «Где теряют балл», HTML. */
  opasnoHtml?: string;
  trenirovatHref: string;
  opornyeHref: string;
  labels: KartaPrimerLabels;
}) {
  return (
    <div className="kz-primer">
      <p className="kz-primer__metka">{labels.primer}</p>
      <div className="kz-uslovie" dangerouslySetInnerHTML={{ __html: uslovieHtml }} />
      {risunok === undefined ? null : <div className="kz-primer__risunok">{risunok}</div>}
      <ShagiResheniya shagi={shagi} posle={posle} />
      {opasnoHtml === undefined ? null : (
        <p className="kz-lovushka">
          <b>{labels.lovushka}.</b> <span dangerouslySetInnerHTML={{ __html: opasnoHtml }} />
        </p>
      )}
      <p className="kz-otvet">
        {labels.otvet}: <b>{otvet}</b>
      </p>
      <div className="kz-knopki">
        {/* Обычная ссылка, а не переход внутри приложения: тренажёр
            читает тип из адреса при входе — так же, как закладки. */}
        <a className="stk-btn stk-btn--primary" href={trenirovatHref}>
          {labels.trenirovat}
        </a>
        <Link className="stk-btn stk-btn--tihaya" href={opornyeHref}>
          {labels.opornye}
        </Link>
      </div>
    </div>
  );
}

export interface FormulaSPrimerom {
  /** Формула, HTML KaTeX. */
  html: string;
  /** Пример применения, HTML KaTeX. */
  primerHtml: string;
  /** Маленький чертёж к формуле: что в ней a, h, r. */
  risunok?: ReactNode;
}

/** Цветная рамка с формулами группы: каждая — с примером применения. */
export function FormulyRamka({
  nazvanie,
  ton,
  formuly,
  primerLabel = 'например',
}: {
  nazvanie: string;
  ton: Ton;
  formuly: FormulaSPrimerom[];
  primerLabel?: string;
}) {
  return (
    <section className={clsx('kz-ramka', `stk-ton--${ton}`)}>
      <h4 className="kz-ramka__plashka" dangerouslySetInnerHTML={{ __html: nazvanie }} />
      <ul className="kz-ramka__spisok">
        {formuly.map((f, i) => (
          <li key={i} className={f.risunok === undefined ? undefined : 'kz-ramka__s-risunkom'}>
            {f.risunok === undefined ? null : (
              <span className="kz-ramka__risunok">{f.risunok}</span>
            )}
            <span className="kz-ramka__formula" dangerouslySetInnerHTML={{ __html: f.html }} />
            <span className="kz-ramka__primer">
              <i>{primerLabel}</i> <span dangerouslySetInnerHTML={{ __html: f.primerHtml }} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Сворачиваемая стеклянная панель: заголовок в строке, внутри что угодно. */
export function Svernut({
  title,
  open = false,
  className,
  children,
}: {
  title: ReactNode;
  open?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <details className={clsx('kz-svernut stk-glass', className)} open={open}>
      <summary className="kz-svernut__summary stk-summary">
        <span className="kz-svernut__title">{title}</span>
        <span className="stk-shevron" aria-hidden="true" />
      </summary>
      <div className="kz-svernut__telo">{children}</div>
    </details>
  );
}
