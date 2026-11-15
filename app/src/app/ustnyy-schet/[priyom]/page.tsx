import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { KartochkiKvadratov } from '@/components/ustnyySchet/KartochkiKvadratov';
import { RazborShagi } from '@/components/ustnyySchet/RazborShagi';
import { SvodkaPriyoma } from '@/components/ustnyySchet/VitrinaKlient';
import '@/components/ustnyySchet/ustnyy.css';
import { USTNYY } from '@/content/ustnyySchet';
import { href, USTNYY as USTNYY_HREF } from '@/lib/paths';
import { estPriyom, PRIYOMY, priyom as priyomPo, priyomyGruppy } from '@/lib/ustnyySchet/registry';
import { tipograf } from '@/lib/tipograf';
import { UROVNI, type PriyomId } from '@/lib/ustnyySchet/types';
import { shagHtml, voprosHtml } from '@/lib/ustnyySchet/vyvod';
import { trenirovkaHref } from '@/lib/ustnyySchet/zapros';

interface Params {
  params: Promise<{ priyom: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return PRIYOMY.map((p) => ({ priyom: p.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { priyom } = await params;
  if (!estPriyom(priyom)) return {};
  const t = USTNYY.priyomy[priyom];
  return {
    title: `${t.nazvanie} — устный счёт — Будет на ЕГЭ`,
    description: `${t.kratko}. Правило, почему оно работает, разбор примеров и тренировка.`,
  };
}

const S = USTNYY.stranica;

/** Страница приёма: правило, почему работает, разборы, уровни и тренировка. */
export default async function PriyomPage({ params }: Params) {
  const { priyom: id } = await params;
  if (!estPriyom(id) || id === 'tablica') notFound();
  const pr = priyomPo(id);
  const t = USTNYY.priyomy[id];
  const gruppa = pr.gruppa === 'tablica' ? null : pr.gruppa;
  const primery = t.primery.map((ex) => {
    const p = pr.iz(ex.d, ex.uroven ?? 1, ex.v);
    return { vopros: voprosHtml(p), shagi: pr.razbor(p).map(shagHtml), ed: p.ed };
  });
  const drugie = gruppa === null ? [] : priyomyGruppy(gruppa).filter((x) => x.id !== id);
  const nabor = { tip: 'priyomy' as const, ids: [id as PriyomId] };

  return (
    <AppShell active="ustnyy">
      <main className="app-main us-stranica us-priyom">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: USTNYY.crumbs, href: href(USTNYY_HREF) },
            { label: t.nazvanie },
          ]}
        />
        <header className="us-priyom__shapka">
          {gruppa !== null && <p className="us-priyom__gruppa">{USTNYY.gruppy[gruppa].nazvanie}</p>}
          <h1 className="t-h1">{t.nazvanie}</h1>
          <SvodkaPriyoma id={id} />
        </header>

        <section className="us-pravilo" aria-labelledby="us-pravilo">
          <h2 id="us-pravilo" className="us-pravilo__metka">
            {S.pravilo}
          </h2>
          <p className="us-pravilo__formula">
            <Tex text={tipograf(t.pravilo)} />
          </p>
          <p className="us-pravilo__pochemu">
            <strong>{S.pochemu}.</strong> <Tex text={tipograf(t.pochemu)} />
          </p>
        </section>

        {id === 'kvadraty-11-30' && (
          <section className="us-blok" aria-labelledby="us-kartochki">
            <h2 id="us-kartochki" className="t-h2">
              {S.kartochkiZag}
            </h2>
            <p className="us-blok__lead">{S.kartochkiLead}</p>
            <KartochkiKvadratov />
          </section>
        )}

        <section className="us-blok" aria-labelledby="us-primery">
          <h2 id="us-primery" className="t-h2">
            {S.primery}
          </h2>
          <ol className="us-primery">
            {primery.map((p, i) => (
              <li key={i} className="us-primer">
                <p className="us-primer__vopros">
                  <span dangerouslySetInnerHTML={{ __html: p.vopros }} />
                  {p.ed === '%' ? ' в процентах' : ''}
                </p>
                <RazborShagi shagi={p.shagi} />
              </li>
            ))}
          </ol>
        </section>

        <section className="us-blok" aria-labelledby="us-trenirovka">
          <h2 id="us-trenirovka" className="t-h2">
            {S.trenirovka}
          </h2>
          <ul className="us-urovni">
            {UROVNI.map((u) => (
              <li key={u} className="us-uroven">
                <p className="us-uroven__zag">{USTNYY.urovenNazv[u - 1]}</p>
                <p className="us-uroven__lead">
                  <Tex text={tipograf(t.urovni[u - 1] ?? '')} />
                </p>
                <Link
                  className={u === 1 ? 'btn btn--primary btn--sm' : 'btn btn--secondary btn--sm'}
                  href={trenirovkaHref({
                    nabor,
                    rezhim: { tip: 'svobodnyy' },
                    nast: { uroven: u, desyatichnye: true, otricatelnye: true, predel: null },
                  })}
                >
                  {USTNYY.trenirovatsya}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {drugie.length > 0 && (
          <nav className="us-blok" aria-labelledby="us-drugie">
            <h2 id="us-drugie" className="t-h3">
              {S.drugie}
            </h2>
            <ul className="us-drugie">
              {drugie.map((d) => (
                <li key={d.id}>
                  <Link href={href(USTNYY_HREF, d.id)}>{USTNYY.priyomy[d.id].nazvanie}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </main>
    </AppShell>
  );
}
