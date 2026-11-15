import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs } from '@/components/ui';
import { Steklo } from '@/components/ustnyySchet/Steklo';
import {
  MoyaStatistika,
  RekordFormata,
  SvodkaPriyoma,
} from '@/components/ustnyySchet/VitrinaKlient';
import '@/components/ustnyySchet/ustnyy.css';
import { USTNYY } from '@/content/ustnyySchet';
import { FORMATY } from '@/lib/ustnyySchet/formaty';
import { href, USTNYY as USTNYY_HREF, USTNYY_TAIL } from '@/lib/paths';
import { GRUPPY, priyomyGruppy } from '@/lib/ustnyySchet/registry';
import { tipograf } from '@/lib/tipograf';
import { reytingHref, trenirovkaHref } from '@/lib/ustnyySchet/zapros';

export const metadata: Metadata = {
  title: USTNYY.meta.title,
  description: USTNYY.meta.description,
};

const T = USTNYY;

/**
 * Витрина устного счёта: быстрый старт, приёмы по группам, таблица
 * умножения, зачётные форматы и личная статистика. Раздел общий для
 * профиля и базы.
 */
export default function UstnyySchetPage() {
  return (
    <AppShell active="ustnyy">
      <main className="app-main us-stranica">
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: T.crumbs }]} />

        <header className="us-hero">
          <div className="us-hero__tekst">
            <h1 className="t-h1">{T.nazvanie}</h1>
            <p className="us-hero__lead">{tipograf(T.lead)}</p>
            <div className="us-hero__start">
              <Link
                className="btn btn--primary btn--lg"
                href={trenirovkaHref({
                  nabor: {
                    tip: 'deystviya',
                    ids: ['slozhenie', 'vychitanie', 'umnozhenie', 'delenie'],
                  },
                  rezhim: { tip: 'seriya', n: 10 },
                  go: true,
                })}
              >
                {T.bystryyStart}
              </Link>
              <span className="us-hero__pod">{T.bystryyStartLead}</span>
            </div>
          </div>
          <Steklo />
        </header>

        <MoyaStatistika />

        <section className="us-blok" aria-labelledby="us-priyomy">
          <h2 id="us-priyomy" className="t-h2">
            {T.priyomyZag}
          </h2>
          {GRUPPY.map((g) => (
            <div key={g} className="us-gruppa">
              <h3 className="t-h3 us-gruppa__zag">{T.gruppy[g].nazvanie}</h3>
              <p className="us-gruppa__lead">{tipograf(T.gruppy[g].lead)}</p>
              <ul className="us-karty">
                {priyomyGruppy(g).map((p) => (
                  <li key={p.id}>
                    <Link className="us-karta" href={href(USTNYY_HREF, p.id)}>
                      <span className="us-karta__zag">{T.priyomy[p.id].nazvanie}</span>
                      <span className="us-karta__lead">{tipograf(T.priyomy[p.id].kratko)}</span>
                      <SvodkaPriyoma id={p.id} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="us-blok" aria-labelledby="us-tablica">
          <h2 id="us-tablica" className="t-h2">
            {T.tablicaZag}
          </h2>
          <Link className="us-karta us-karta--shir" href={href(USTNYY_HREF, USTNYY_TAIL.tablica)}>
            <span className="us-karta__zag">{T.tablicaZag}</span>
            <span className="us-karta__lead">{tipograf(T.tablicaLead)}</span>
            <span className="us-karta__strelka">{T.tablicaKnopka} →</span>
          </Link>
        </section>

        <section className="us-blok" aria-labelledby="us-formaty">
          <h2 id="us-formaty" className="t-h2">
            {T.formatyZag}
          </h2>
          <p className="us-blok__lead">{tipograf(T.formatyLead)}</p>
          <ul className="us-formaty">
            <li className="us-format us-format--vyzov">
              <p className="us-format__zag">{T.formaty['vyzov-dnya'].nazvanie}</p>
              <p className="us-format__lead">{T.formaty['vyzov-dnya'].kratko}</p>
              <div className="us-format__niz">
                <Link className="btn btn--primary btn--sm" href={reytingHref('vyzov-dnya')}>
                  {T.vReyting}
                </Link>
              </div>
            </li>
            {FORMATY.map((f) => (
              <li key={f.id} className="us-format">
                <p className="us-format__zag">{T.formaty[f.id].nazvanie}</p>
                <p className="us-format__lead">{T.formaty[f.id].kratko}</p>
                <RekordFormata id={f.id} />
                <div className="us-format__niz">
                  <Link
                    className="btn btn--secondary btn--sm"
                    href={trenirovkaHref({ nabor: { tip: 'format', id: f.id } })}
                  >
                    {T.trenirovatsya}
                  </Link>
                  <Link className="btn btn--ghost btn--sm" href={reytingHref(f.id)}>
                    {T.vReyting}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <Link className="us-karta__strelka" href={href(USTNYY_HREF, USTNYY_TAIL.reyting)}>
            {T.reytingSsylka} →
          </Link>
        </section>
      </main>
    </AppShell>
  );
}
