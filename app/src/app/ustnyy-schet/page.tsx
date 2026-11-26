import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { ShapkaKarkas } from '@/components/tasks/shapka/ShapkaKarkas';
import '@/components/tasks/shapka/shapka.css';
import { Breadcrumbs } from '@/components/ui';
import { KartaPriyoma } from '@/components/ustnyySchet/KartaPriyoma';
import { MiniTablica } from '@/components/ustnyySchet/MiniTablica';
import { UstnyyScena } from '@/components/ustnyySchet/UstnyyScena';
import {
  MoyaStatistika,
  OsvoenoGruppy,
  RekordFormata,
} from '@/components/ustnyySchet/VitrinaKlient';
import { VyzovStart } from '@/components/ustnyySchet/VyzovStart';
import '@/components/ustnyySchet/ustnyy.css';
import { USTNYY } from '@/content/ustnyySchet';
import { FORMATY } from '@/lib/ustnyySchet/formaty';
import { href, USTNYY as USTNYY_HREF, USTNYY_TAIL } from '@/lib/paths';
import { kartinkaUs, type KartinkaUs, type KartinkaUsId } from '@/lib/ustnyySchet/kartinki';
import { GRUPPY, priyomyGruppy } from '@/lib/ustnyySchet/registry';
import type { GruppaId, Priyom } from '@/lib/ustnyySchet/types';
import { shagHtml, tekstHtml, voprosHtml } from '@/lib/ustnyySchet/vyvod';
import { tipograf } from '@/lib/tipograf';
import { reytingHref, trenirovkaHref } from '@/lib/ustnyySchet/zapros';

export const metadata: Metadata = {
  title: USTNYY.meta.title,
  description: USTNYY.meta.description,
};

const T = USTNYY;

const BYSTRYY_START = trenirovkaHref({
  nabor: { tip: 'deystviya', ids: ['slozhenie', 'vychitanie', 'umnozhenie', 'delenie'] },
  rezhim: { tip: 'seriya', n: 10 },
  go: true,
});

/** Стеклянная картинка с размерами и ленивой загрузкой. */
function Kartinka({ k, className, sizes }: { k: KartinkaUs; className: string; sizes: string }) {
  return (
    <img
      className={className}
      src={k.src}
      srcSet={k.srcSet}
      sizes={sizes}
      width={k.width}
      height={k.height}
      alt=""
      loading="lazy"
      decoding="async"
    />
  );
}

/**
 * Карточка приёма: пример — первый разобранный пример теории (iz с
 * фиксированными данными), оборот — короткая цепочка его разбора.
 */
function kartaDannye(p: Priyom) {
  const t = T.priyomy[p.id];
  const ex = t.primery[0];
  const primer = ex === undefined ? null : p.iz(ex.d, ex.uroven ?? 1, ex.v);
  let primerHtml = '';
  let razborHtml = '';
  if (primer !== null) {
    const ravno = primer.v !== 'obr' && primer.v !== 'kv' && primer.deystvie !== 'uravneniya';
    primerHtml = voprosHtml({ ...primer, tex: ravno ? `${primer.tex} = \\text{?}` : primer.tex });
    const shagi = p.razbor(primer).filter((s) => s.cep.length > 0);
    /* Самая длинная цепочка — в ней видно приём; у уравнений — подбор корней. */
    const glavnyy =
      shagi.find((s) => /Подбираем|Подходит|Второй корень|Возвращаемся/.test(s.tekst ?? '')) ??
      [...shagi].sort((a, b) => b.cep.length - a.cep.length)[0];
    if (glavnyy !== undefined) {
      const h = shagHtml(glavnyy);
      razborHtml =
        (h.tekst === null ? '' : `<span class="us-flip__tekst">${h.tekst}</span>`) + h.cep;
    }
  }
  return {
    id: p.id,
    nazvanie: t.nazvanie,
    kratkoHtml: tekstHtml(t.kratko),
    primerHtml,
    razborHtml,
    uchitsyaHref: href(USTNYY_HREF, p.id),
    trenHref: trenirovkaHref({ nabor: { tip: 'priyomy', ids: [p.id] } }),
  };
}

const KARTINKA_GRUPPY: Record<GruppaId, KartinkaUsId> = {
  kvadraty: 'gruppa-kvadraty',
  umnozhenie: 'gruppa-umnozhenie',
  delenie: 'gruppa-delenie',
  slozhenie: 'gruppa-slozhenie',
  doli: 'gruppa-doli',
  uravneniya: 'gruppa-uravneniya',
};

/**
 * Витрина устного счёта: шапка со стеклянной сценой и «Реши за 10
 * секунд», личная статистика, приёмы по группам (карточки
 * переворачиваются), таблица умножения, зачётные форматы и рейтинг.
 * Раздел общий для профиля и базы.
 */
export default function UstnyySchetPage() {
  const reyting = kartinkaUs('reyting');
  const tablica = kartinkaUs('tablica');
  return (
    <AppShell active="ustnyy">
      <main className="app-main us-stranica us-vitrina">
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: T.crumbs }]} />

        <ShapkaKarkas className="shapka--ustnyy" title={T.nazvanie} media={<UstnyyScena />}>
          <p className="shapka__lead us-shapka__lead">{tipograf(T.lead)}</p>
          <div className="us-hero__start">
            <Link className="btn btn--primary btn--lg" href={BYSTRYY_START}>
              {T.bystryyStart}
            </Link>
            <span className="us-hero__pod">{T.bystryyStartLead}</span>
          </div>
          <VyzovStart />
        </ShapkaKarkas>

        <MoyaStatistika startHref={BYSTRYY_START} />

        <section className="us-blok" aria-labelledby="us-priyomy">
          <h2 id="us-priyomy" className="t-h2">
            {T.priyomyZag}
          </h2>
          {GRUPPY.map((g) => {
            const pr = priyomyGruppy(g);
            const gr = T.gruppy[g];
            return (
              <div key={g} className="us-gruppa" data-gruppa={g}>
                <div className="us-gruppa__shapka">
                  <Kartinka
                    k={kartinkaUs(KARTINKA_GRUPPY[g])}
                    className="us-gruppa__kartinka"
                    sizes="72px"
                  />
                  <div className="us-gruppa__tekst">
                    <h3 className="t-h3 us-gruppa__zag">
                      {gr.nazvanie}
                      {'novoe' in gr && gr.novoe === true && (
                        <span className="us-metka-novoe">{T.vitrina.novoe}</span>
                      )}
                    </h3>
                    <p className="us-gruppa__lead">{tipograf(gr.lead)}</p>
                    <OsvoenoGruppy ids={pr.map((p) => p.id)} />
                  </div>
                </div>
                <ul className="us-karty us-karty--flip">
                  {pr.map((p) => (
                    <li key={p.id}>
                      <KartaPriyoma {...kartaDannye(p)} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>

        <section className="us-blok" aria-labelledby="us-tablica">
          <h2 id="us-tablica" className="t-h2">
            {T.tablicaZag}
          </h2>
          <div className="us-tablica-karta">
            <div className="us-tablica-karta__tekst">
              <Kartinka k={tablica} className="us-tablica-karta__kartinka" sizes="120px" />
              <p className="us-tablica-karta__lead">{tipograf(T.tablicaLead)}</p>
              <p className="us-tablica-karta__pod">{T.vitrina.tablica.lead}</p>
              <div className="us-tablica-karta__knopki">
                <Link
                  className="btn btn--primary"
                  href={trenirovkaHref({
                    nabor: {
                      tip: 'tablica',
                      stroki: [2, 3, 4, 5, 6, 7, 8, 9],
                      obratnaya: 'net',
                      poryadok: 'vrazbros',
                    },
                  })}
                >
                  {T.vitrina.tablica.knopka}
                </Link>
                <Link className="btn btn--ghost" href={href(USTNYY_HREF, USTNYY_TAIL.tablica)}>
                  {T.vitrina.tablica.otkryt} →
                </Link>
              </div>
            </div>
            <MiniTablica />
          </div>
        </section>

        <section className="us-blok us-formaty-blok" aria-labelledby="us-formaty">
          <div className="us-formaty-blok__shapka">
            <Kartinka k={reyting} className="us-formaty-blok__kartinka" sizes="96px" />
            <div>
              <h2 id="us-formaty" className="t-h2">
                {T.formatyZag}
              </h2>
              <p className="us-blok__lead">{tipograf(T.formatyLead)}</p>
            </div>
          </div>
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
