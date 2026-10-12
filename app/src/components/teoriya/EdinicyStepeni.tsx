import { clsx } from 'clsx';
import katex from 'katex';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Tex } from '@/components/ui/Tex';
import {
  chastEdinic,
  METKI_RAMOK,
  YAKOR_EDINIC,
  type BlokEdinic,
  type ChastEdinic,
  type MiniPrimer,
  type ShagRazbora,
  type SlotStepeni,
  type Stroka,
  type TipRamki,
} from '@/content/teoriya-edinicy';
import { kartinkaStepeni } from '@/lib/teoriya/illyustracii-stepeni';

/**
 * Общая теория «Единицы измерения» и «Степени десяти» (№10 и №11).
 *
 * Оформление — как в справочнике по планиметрии: цветная рамка по типу
 * блока с ярлыком на верхней границе («Определение» — синий, «Правило»
 * — бирюзовый, «Формула» — золотисто-оранжевый, «Важно» —
 * терракотовый), примеры — пунктирная серо-голубая рамка с кнопкой
 * «Пример ▸». Кнопка — <details>: работает без JavaScript.
 *
 * Тексты — content/teoriya-edinicy.ts, стили — styles/edinicy.css.
 * Формулы набирает KaTeX на сервере; единицы стоят внутри формул,
 * поэтому «км/ч» на телефоне не рвётся.
 */

function Formula({ tex }: { tex: string }) {
  return (
    <span
      className="ed-formula"
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, { throwOnError: true, displayMode: true }),
      }}
    />
  );
}

/** Выкладка из нескольких строк: «=…» продолжает предыдущую. */
function Vykladka({ tex }: { tex: readonly string[] }) {
  return (
    <span className="ed-vykladka">
      {tex.map((t) => (
        <Formula tex={t} key={t} />
      ))}
    </span>
  );
}

function Stroki({ stroki }: { stroki: readonly Stroka[] }) {
  return (
    <>
      {stroki.map((s, i) =>
        typeof s === 'string' ? (
          <p className="ed-p" key={i}>
            <Tex text={s} />
          </p>
        ) : (
          <Formula tex={s.f} key={i} />
        ),
      )}
    </>
  );
}

function Ramka({
  tip,
  metka,
  title,
  children,
}: {
  tip: TipRamki;
  metka?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className={`ed-ramka ed-ramka--${tip}`}>
      <span className="ed-ramka__metka">{metka ?? METKI_RAMOK[tip]}</span>
      {title === undefined ? null : (
        <h5 className="ed-ramka__title">
          <Tex text={title} />
        </h5>
      )}
      {children}
    </section>
  );
}

/** Кнопка «Пример ▸» и примеры под ней. */
function Primer({ knopka, children }: { knopka?: string; children: ReactNode }) {
  return (
    <details className="ed-primer">
      <summary className="ed-primer__knopka">
        <span className="ed-primer__otkryt">{knopka ?? 'Пример'} ▸</span>
        <span className="ed-primer__zakryt">Свернуть ▴</span>
      </summary>
      <div className="ed-primer__telo">{children}</div>
    </details>
  );
}

function MiniPrimery({ primery }: { primery: readonly MiniPrimer[] }) {
  return (
    <ul className="ed-primery">
      {primery.map((p) => (
        <li className="ed-primery__item" key={p.tex.join('')}>
          <Vykladka tex={p.tex} />
          <p className="ed-primery__podpis">
            <Tex text={p.podpis} />
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Разбор по шагам: каждый шаг — подпись и строка выкладки. */
export function ShagiRazbora({
  title,
  shagi,
  vyvod,
  istochnik,
  uslovie,
  otvet,
  children,
}: {
  title: string;
  shagi: readonly ShagRazbora[];
  vyvod?: string;
  istochnik?: string;
  uslovie?: string;
  otvet?: string;
  children?: ReactNode;
}) {
  return (
    <article className="ed-razbor">
      <h5 className="ed-razbor__title">
        <Tex text={title} />
      </h5>
      {istochnik === undefined ? null : <p className="ed-razbor__ist">{istochnik}</p>}
      {children}
      {uslovie === undefined ? null : (
        <p className="ed-p ed-razbor__uslovie">
          <Tex text={uslovie} />
        </p>
      )}
      <ol className="ed-razbor__shagi">
        {shagi.map((s) => (
          <li className="ed-razbor__shag" key={s.podpis}>
            <span className="ed-razbor__podpis">
              <Tex text={s.podpis} />
            </span>
            <Vykladka tex={s.tex} />
          </li>
        ))}
      </ol>
      {vyvod === undefined ? null : (
        <p className="ed-razbor__vyvod">
          <Tex text={`**Вывод:** ${vyvod}`} />
        </p>
      )}
      {otvet === undefined ? null : (
        <p className="ed-razbor__otvet">
          <Tex text={otvet} />
        </p>
      )}
    </article>
  );
}

/** Картинка автора; нет файла — ничего (никаких заглушек). */
export function KartinkaStepeni({ slot, className }: { slot: SlotStepeni; className?: string }) {
  const k = kartinkaStepeni(slot);
  if (k === null) {
    return null;
  }
  return (
    <picture className={clsx('ed-kartinka', `ed-kartinka--${slot}`, className)}>
      {k.webp === null ? null : (
        <source type="image/webp" srcSet={k.webp} sizes="(min-width: 768px) 280px, 60vw" />
      )}
      <img
        src={k.png}
        alt=""
        aria-hidden="true"
        width={k.width}
        height={k.height}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}

function Blok({ b, izBanka }: { b: BlokEdinic; izBanka?: ReactNode }): ReactNode {
  switch (b.vid) {
    case 'tekst': {
      const kartinka = b.illyustraciya ? <KartinkaStepeni slot={b.illyustraciya} /> : null;
      return (
        <div className={clsx('ed-tekst', kartinka !== null && 'ed-tekst--s-kartinkoy')}>
          <div>
            <Stroki stroki={b.paras} />
          </div>
          {kartinka}
        </div>
      );
    }
    case 'ramka':
      return (
        <Ramka
          tip={b.tip}
          {...(b.metka ? { metka: b.metka } : {})}
          {...(b.title ? { title: b.title } : {})}
        >
          <Stroki stroki={b.stroki} />
        </Ramka>
      );
    case 'strelki':
      return (
        <div className="ed-strelki">
          {b.strelki.map((s, i) => (
            <div className={`ed-strelka ed-strelka--${i === 0 ? 'vniz' : 'vverh'}`} key={s.otkuda}>
              <p className="ed-strelka__put">
                <span>{s.otkuda}</span>
                <svg className="ed-strelka__ikonka" viewBox="0 0 40 16" aria-hidden="true">
                  <path
                    d="M2 8h32M28 2l7 6-7 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="sr-only"> в </span>
                <span>{s.kuda}</span>
              </p>
              <p className="ed-strelka__deystvie">{s.deystvie.toUpperCase()}</p>
              <p className="ed-strelka__pochemu">{s.pochemu}</p>
            </div>
          ))}
        </div>
      );
    case 'fakty':
      return (
        <Ramka tip="teo" metka={b.title}>
          <div className="ed-fakty">
            {b.gruppy.map((g) => (
              <section className="ed-fakty__gruppa" key={g.title}>
                <h6 className="ed-fakty__title">{g.title}</h6>
                <ul className="ed-fakty__spisok">
                  {g.fakty.map((f) => (
                    <li key={f}>
                      <Tex text={`$${f}$`} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Ramka>
      );
    case 'primery':
      return (
        <Primer {...(b.knopka ? { knopka: b.knopka } : {})}>
          <MiniPrimery primery={b.primery} />
        </Primer>
      );
    case 'razbor': {
      const razbor = (
        <ShagiRazbora title={b.title} shagi={b.shagi} {...(b.vyvod ? { vyvod: b.vyvod } : {})} />
      );
      return b.svernut ? (
        <Primer>{razbor}</Primer>
      ) : (
        <div className="ed-primer ed-primer--otkryt">
          <span className="ed-primer__metka">Разбор</span>
          <div className="ed-primer__telo">{razbor}</div>
        </div>
      );
    }
    case 'dveKolonki':
      return (
        <Ramka tip={b.tip} {...(b.metka ? { metka: b.metka } : {})} title={b.title}>
          {b.vvod === undefined ? null : (
            <p className="ed-p">
              <Tex text={b.vvod} />
            </p>
          )}
          <div className="ed-kolonki">
            {b.kolonki.map((k) => (
              <section className="ed-kolonka" key={k.title}>
                <h6 className="ed-kolonka__title">{k.title}</h6>
                <Stroki stroki={k.stroki} />
              </section>
            ))}
          </div>
          <p className="ed-kolonki__vyvod">
            <Tex text={b.vyvod} />
          </p>
        </Ramka>
      );
    case 'pristavki': {
      const kartinki = (b.illyustracii ?? []).map((s) => <KartinkaStepeni slot={s} key={s} />);
      return (
        <Ramka tip="teo" metka="Приставки" title={b.title}>
          <p className="ed-p">
            <Tex text={b.vvod} />
          </p>
          <div className="ed-pristavki">
            <table className="ed-tablica">
              <thead>
                <tr>
                  <th scope="col">Приставка</th>
                  <th scope="col">Множитель</th>
                  <th scope="col">Пример</th>
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r) => (
                  <tr key={r.pristavka}>
                    <th scope="row">
                      {r.pristavka} <span className="ed-tablica__oboz">({r.oboz})</span>
                    </th>
                    <td>
                      <Tex text={`$${r.mnozhitel}$`} />
                    </td>
                    <td>
                      <Tex text={`$${r.primer}$`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {kartinki.some((k) => k !== null) ? (
              <div className="ed-pristavki__kartinki">{kartinki}</div>
            ) : null}
          </div>
          {b.posle ? <Stroki stroki={b.posle} /> : null}
        </Ramka>
      );
    }
    case 'izBanka':
      return izBanka ?? null;
    case 'gde':
      return (
        <Ramka tip="gde" metka={b.title}>
          <ul className="ed-gde">
            {b.punkty.map((p) => (
              <li key={p.tekst}>
                <Tex text={p.tekst} />
                {p.href === undefined ? null : (
                  <>
                    {' '}
                    <Link className="ed-gde__ssylka" href={p.href}>
                      {p.ssylka ?? 'Открыть'} →
                    </Link>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Ramka>
      );
    default:
      return null;
  }
}

/** Что остаётся в шпаргалке: правила, факты, таблицы. */
const KRATKO: ReadonlySet<BlokEdinic['vid']> = new Set(['ramka', 'strelki', 'fakty', 'pristavki']);

/** Одна часть теории: заголовок-якорь и блоки. */
export function ChastEdinicView({
  id,
  izBanka,
  kratko,
}: {
  id: ChastEdinic['id'];
  /** Пример из банка задания — встаёт на место блока izBanka. */
  izBanka?: ReactNode;
  /** Шпаргалка: только правила, факты и таблицы — без примеров. */
  kratko?: boolean;
}) {
  const c = chastEdinic(id);
  return (
    <section className="ed-chast" id={YAKOR_EDINIC(id)} aria-labelledby={`${YAKOR_EDINIC(id)}-h`}>
      <h4 className="ed-chast__title" id={`${YAKOR_EDINIC(id)}-h`}>
        <Tex text={c.title} />
      </h4>
      {c.bloki
        .filter((b) => !kratko || KRATKO.has(b.vid))
        .map((b, i) => (
          <Blok b={b} izBanka={izBanka} key={`${id}-${i}`} />
        ))}
    </section>
  );
}

/** Несколько частей подряд: №10 — все три, №11 — единицы и скорости. */
export function EdinicyStepeni({
  chasti,
  izBanka,
  kratko,
}: {
  chasti: readonly ChastEdinic['id'][];
  izBanka?: ReactNode;
  kratko?: boolean;
}) {
  return (
    <div className="ed-teoriya">
      {chasti.map((id) => (
        <ChastEdinicView
          id={id}
          key={id}
          {...(izBanka && !kratko ? { izBanka } : {})}
          {...(kratko ? { kratko } : {})}
        />
      ))}
    </div>
  );
}
