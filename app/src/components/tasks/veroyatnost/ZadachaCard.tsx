import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Button } from '@/components/ui';
import type { Znak } from '@/lib/veroyatnost/pool';
import type { Razbor } from '@/lib/veroyatnost/razbor';
import type { Illyustratsiya } from '@/lib/veroyatnost/types';
import { KoordinatnayaPryamaya } from './KoordinatnayaPryamaya';

/**
 * Карточка задачи заданий №4 и №5 — по утверждённому макету.
 *
 * Сверху слева плашка с типом задачи, под ней условие антиквой и
 * иллюстрация справа, ниже блок «Решение» на голубой подложке с
 * нумерованными шагами, внизу две кнопки: «Показать ответ» и
 * «Следующая». Карточка собирается из частей, потому что тренажёр
 * и подготовительные задачи кладут между условием и решением своё:
 * поле ответа, вердикт, счёт подхода. Сами части одни на оба экрана
 * и на витрину.
 */

export type ZadachaProps = ComponentPropsWithRef<'article'>;

export function Zadacha({ className, children, ...rest }: ZadachaProps) {
  return (
    <article className={clsx('zadacha', className)} {...rest}>
      {children}
    </article>
  );
}

/* ── Плашка типа ────────────────────────────────────────────────── */

function ZnakPryamaya() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 10h14" strokeLinecap="round" />
      <path d="M13 6.5 17 10l-4 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 7.5v5M8.5 7.5v5M12 7.5v5" strokeLinecap="round" />
    </svg>
  );
}

function ZnakZadacha() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 2.5 16.5 6.25v7.5L10 17.5 3.5 13.75v-7.5L10 2.5Z" strokeLinejoin="round" />
      <path d="M3.5 6.25 10 10l6.5-3.75M10 10v7.5" strokeLinejoin="round" />
    </svg>
  );
}

export interface ZadachaShapkaProps {
  /** Тип задачи на плашке: «Координатная прямая». */
  tip: string;
  znak?: Znak;
  /** Справа от плашки: номер задачи, ссылка «Ещё вариант». */
  children?: ReactNode;
}

export function ZadachaShapka({ tip, znak = 'zadacha', children }: ZadachaShapkaProps) {
  return (
    <header className="zadacha__shapka">
      <span className="zadacha__tip">
        {znak === 'pryamaya' ? <ZnakPryamaya /> : <ZnakZadacha />}
        {tip}
      </span>
      {children !== undefined ? <span className="zadacha__meta">{children}</span> : null}
    </header>
  );
}

/* ── Условие ────────────────────────────────────────────────────── */

export interface ZadachaUslovieProps {
  /** Условие: HTML, формулы набраны на сборке. */
  html: string;
  illyustratsiya?: Illyustratsiya;
}

/**
 * Условие слева, иллюстрация справа. Библиотека картинок ещё
 * собирается, поэтому у задачи без картинки справа стоит место под
 * неё тех же пропорций — раскладка карточки не меняется, когда
 * картинки приедут.
 */
export function ZadachaUslovie({ html, illyustratsiya }: ZadachaUslovieProps) {
  return (
    <div className="zadacha__uslovie-ryad zadacha__uslovie-ryad--s-kartinkoy">
      <p className="zadacha__uslovie" dangerouslySetInnerHTML={{ __html: html }} />
      {illyustratsiya !== undefined ? (
        <img
          className="zadacha__kartinka"
          src={illyustratsiya.src}
          alt={illyustratsiya.alt}
          loading="lazy"
        />
      ) : (
        <div className="zadacha__kartinka zadacha__kartinka--mesto" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="5" y="7" width="30" height="26" rx="4" />
            <circle cx="14" cy="16" r="3" />
            <path d="m5 29 9-8 6 6 5-4 10 8" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

/* ── Решение ────────────────────────────────────────────────────── */

export interface ReshenieProps {
  razbor: Razbor;
}

export function Reshenie({ razbor }: ReshenieProps) {
  return (
    <section className="reshenie" aria-label="Решение">
      <h3 className="reshenie__zagolovok">Решение</h3>
      {razbor.pryamaya !== undefined ? (
        <div className="reshenie__chertezh-okno">
          <KoordinatnayaPryamaya className="reshenie__chertezh" pryamaya={razbor.pryamaya} />
        </div>
      ) : null}
      <ol className="reshenie__shagi">
        {razbor.shagi.map((shag, i) => (
          <li className="reshenie__shag" key={i}>
            <span className="reshenie__nomer" aria-hidden="true">
              {i + 1}
            </span>
            <div className="reshenie__telo">
              {shag.slova !== '' ? (
                <p className="reshenie__slova" dangerouslySetInnerHTML={{ __html: shag.slova }} />
              ) : null}
              {shag.formula !== null ? (
                <div
                  className="reshenie__formula"
                  dangerouslySetInnerHTML={{ __html: shag.formula }}
                />
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ── Кнопки ─────────────────────────────────────────────────────── */

function Strelka() {
  return (
    <svg
      className="zadacha__strelka"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 10h13M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface ZadachaKnopkiProps {
  /** «Показать ответ»: раскрывает решение, повторное нажатие прячет. */
  pokazat: { otkryto: boolean; onClick: () => void };
  /** «Следующая»: у тренажёра — дальше по подходу, у списка — к следующей карточке. */
  dalshe: { label?: string; onClick: () => void; disabled?: boolean };
}

export function ZadachaKnopki({ pokazat, dalshe }: ZadachaKnopkiProps) {
  return (
    <div className="zadacha__knopki">
      <Button size="lg" onClick={pokazat.onClick} aria-expanded={pokazat.otkryto}>
        {pokazat.otkryto ? 'Скрыть ответ' : 'Показать ответ'}
        <Strelka />
      </Button>
      <Button
        variant="secondary"
        size="lg"
        className="zadacha__knopka-kontur"
        onClick={dalshe.onClick}
        disabled={dalshe.disabled}
      >
        {dalshe.label ?? 'Следующая'}
        <Strelka />
      </Button>
    </div>
  );
}
