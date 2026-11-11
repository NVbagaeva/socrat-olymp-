'use client';

import { clsx } from 'clsx';
import { PrepCardLink } from '@/components/tasks/prep/PrepScroll';
import { Metka, Polosa, Znak, type Ton } from '../steklo';
import { OPORNYE3 } from '@/content/zadanie3/navyki';
import { opornye3 } from '@/lib/stereo/opornye3/progress';
import { typeset } from '@/lib/tex';

export interface BlokNavyka3 {
  slug: string;
  nazvanie: string;
  /** Ключи задач блока: по ним считается «решено». */
  zadachi: string[];
  /** Значок блока — фигура, нарисованная движком (SVG); нет — пусто. */
  znak: string | null;
}

export interface NavykKartochki3 {
  id: string;
  nazvanie: string;
  lead: string;
  ton: Ton;
  bloki: BlokNavyka3[];
}

/**
 * Список опорных задач №3: семь навыков, под каждым — его блоки по
 * десять задач. На карточке блока — только название, значок и прогресс
 * ученика: ни формул, ни служебных меток. Прогресс — из хранилища
 * опорных задач (lib/stereo/opornye3/progress).
 */
export function Navyki3({ navyki, listHref }: { navyki: NavykKartochki3[]; listHref: string }) {
  const progress = opornye3.useProgress();
  return (
    <div className="z3-navyki">
      {navyki.map((navyk) => (
        <section
          className={clsx('z3-navyk', `stk-ton--${navyk.ton}`)}
          key={navyk.id}
          aria-labelledby={`z3-navyk-${navyk.id}`}
        >
          <div className="z3-navyk__head">
            <h3 className="stk-h4 z3-navyk__zag" id={`z3-navyk-${navyk.id}`}>
              <span dangerouslySetInnerHTML={{ __html: typeset(navyk.nazvanie) }} />
            </h3>
            <p className="z3-navyk__lead">
              {navyk.lead} · {OPORNYE3.blokov(navyk.bloki.length)}
            </p>
          </div>
          <ul className="z3-bloki">
            {navyk.bloki.map((blok) => {
              const vsego = blok.zadachi.length;
              const resheno = blok.zadachi.filter((id) => progress.outcomes[id] === 'right').length;
              const gotovo = resheno === vsego;
              return (
                <li key={blok.slug}>
                  <PrepCardLink
                    className={clsx('z3-blok stk-glass', gotovo && 'is-gotovo')}
                    href={`${listHref}${blok.slug}/`}
                  >
                    <Znak
                      html=""
                      figura={
                        blok.znak === null ? (
                          <span />
                        ) : (
                          <span
                            className="z3-figurka"
                            dangerouslySetInnerHTML={{ __html: blok.znak }}
                          />
                        )
                      }
                      ton={navyk.ton}
                    />
                    <span className="z3-blok__text">
                      <b>{blok.nazvanie}</b>
                      <span className="z3-blok__schet">
                        {resheno === 0 ? OPORNYE3.neNachato : OPORNYE3.zadach(resheno, vsego)}
                      </span>
                    </span>
                    {gotovo ? <Metka ton="green">{OPORNYE3.gotovo}</Metka> : null}
                    <span className="z3-blok__polosa">
                      <Polosa dolya={resheno / vsego} ton={gotovo ? 'green' : 'blue'} />
                    </span>
                  </PrepCardLink>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
