'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { ProgressBar } from '@/components/ui';
import { DOROZHKA_SLOVA, type Zadanie } from '@/content/veroyatnost';
import { assetUrl } from '@/lib/assetUrl';
import { requestTabScroll } from '@/lib/tabScroll';
import type { PrepPoolBlok } from '@/lib/veroyatnost/pool';
import { prepResheno, prepStore } from '@/lib/veroyatnost/prepProgress';
import { HintIcon, RightIcon } from '../prep/PrepIcons';
import { MetodIkonka } from './MetodIkonka';

export interface OpornyeDorozhkaProps {
  zadanie: Zadanie;
  bloki: PrepPoolBlok[];
  /** Адрес вкладки опорных задач: /zadaniya/4/opornye-zadachi/. */
  listHref: string;
  /** Адрес тренажёра: кнопка подсказки внизу. */
  trenazherHref: string;
}

/** Что с блоком: пройден, открыт сейчас или ещё впереди. */
type Sostoyanie = 'proyden' | 'tekushchiy' | 'vperedi';

/**
 * Дорожка блоков опорных задач задания №4 — по макету вкладки.
 *
 * Блоки идут шагами конспекта один за другим: слева кружок с номером
 * шага и линия к следующему, справа карточка блока — значок метода,
 * название, приём, полоса решённого и кнопка. Пройденный блок помечен
 * галочкой, первый непройденный — бейджем «Ты здесь», остальные
 * приглушены. В карточке справа — превью первой задачи блока с
 * объёмной картинкой. Внизу — подсказка: прошёл все блоки, иди в
 * тренажёр.
 *
 * Счёт решённого читается из хранилища подготовки задания, как и у
 * списка блоков: экран задачи и дорожка смотрят в одно место.
 */
export function OpornyeDorozhka({ zadanie, bloki, listHref, trenazherHref }: OpornyeDorozhkaProps) {
  const progress = prepStore(zadanie).useProgress();
  const resheno = bloki.map((blok) =>
    prepResheno(
      progress,
      blok.zadachi.map((zadacha) => zadacha.id),
    ),
  );
  /* «Ты здесь» — первый блок, где решено не всё. Все пройдены —
     бейджа нет: идти дальше некуда, подсказка внизу зовёт в тренажёр. */
  const tekushchiy = bloki.findIndex((blok, i) => (resheno[i] ?? 0) < blok.zadachi.length);

  return (
    <div className="vop">
      <ol className="vop__shagi">
        {bloki.map((blok, i) => {
          const vsego = blok.zadachi.length;
          const gotovo = resheno[i] ?? 0;
          const sostoyanie: Sostoyanie =
            gotovo >= vsego && vsego > 0
              ? 'proyden'
              : i === tekushchiy
                ? 'tekushchiy'
                : 'vperedi';
          const knopka =
            sostoyanie === 'proyden'
              ? DOROZHKA_SLOVA.knopka.povtorit
              : gotovo > 0
                ? DOROZHKA_SLOVA.knopka.prodolzhit
                : DOROZHKA_SLOVA.knopka.nachat;
          const pervaya = blok.zadachi[0];
          const href = `${listHref}${blok.id}/`;

          return (
            <li key={blok.id} className={clsx('vop__shag', `vop__shag--${sostoyanie}`)}>
              {/* Кружок шага и линия к следующему. */}
              <div className="vop__kruzhok" aria-hidden="true">
                <span className="vop__nomer">{i + 1}</span>
                {sostoyanie === 'proyden' ? (
                  <span className="vop__galka">
                    <RightIcon />
                  </span>
                ) : (
                  <span className="vop__tochka" />
                )}
                {i < bloki.length - 1 ? <span className="vop__liniya" /> : null}
              </div>

              <article className="vop-blok" aria-labelledby={`vop-${blok.id}`}>
                {sostoyanie === 'tekushchiy' ? (
                  <span className="vop-blok__zdes">{DOROZHKA_SLOVA.tyZdes}</span>
                ) : null}

                <div className="vop-blok__osnova">
                  {blok.metod === undefined ? null : (
                    <MetodIkonka
                      zadanie={zadanie}
                      metod={blok.metod}
                      size="lg"
                      className="vop-blok__ikonka"
                    />
                  )}
                  <div className="vop-blok__text">
                    <h3 className="vop-blok__title" id={`vop-${blok.id}`}>
                      {blok.nazvanie}
                    </h3>
                    <p className="vop-blok__lead">{blok.tip}</p>
                    <div className="vop-blok__niz">
                      {sostoyanie === 'proyden' ? (
                        <span className="vop-blok__proydeno">
                          {DOROZHKA_SLOVA.proydeno(vsego)}
                        </span>
                      ) : (
                        <span className="vop-blok__meter">
                          <ProgressBar
                            value={vsego === 0 ? 0 : (gotovo / vsego) * 100}
                            label={`${blok.nazvanie}: решено ${gotovo} из ${vsego}`}
                          />
                          <span className="vop-blok__schet no-math-check" aria-hidden="true">
                            {DOROZHKA_SLOVA.schet(gotovo, vsego)}
                          </span>
                        </span>
                      )}
                      <Link
                        className={clsx(
                          'btn',
                          sostoyanie === 'tekushchiy' ? 'btn--primary' : 'btn--secondary',
                          'vop-blok__knopka',
                        )}
                        href={href}
                        scroll={false}
                        onClick={() => requestTabScroll('.ptask__head')}
                      >
                        {knopka}
                        <span className="sr-only">: {blok.nazvanie}</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {pervaya === undefined ? null : (
                  <div className="vop-blok__preview">
                    <p className="sr-only">{DOROZHKA_SLOVA.preview}</p>
                    {/* Условие — готовая вёрстка: формулы набраны KaTeX на сборке. */}
                    <p
                      className="vop-blok__uslovie"
                      dangerouslySetInnerHTML={{ __html: pervaya.uslovie }}
                    />
                    {blok.kartinka === undefined ? null : (
                      <img
                        className="vop-blok__kartinka"
                        src={assetUrl(blok.kartinka.src)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ol>

      <aside className="vop__podskazka">
        <span className="vop__lampa" aria-hidden="true">
          <HintIcon />
        </span>
        <div className="vop__podskazka-text">
          <p className="vop__podskazka-title">{DOROZHKA_SLOVA.podskazka.title}</p>
          <p className="vop__podskazka-lead">{DOROZHKA_SLOVA.podskazka.text}</p>
        </div>
        <Link className="btn btn--primary vop__podskazka-knopka" href={trenazherHref}>
          {DOROZHKA_SLOVA.podskazka.knopka} →
        </Link>
      </aside>
    </div>
  );
}
