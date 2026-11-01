import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Kristall } from '@/components/landing/kristall/Kristall';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { OnlaynStart } from '@/components/variant/online/OnlaynStart';
import { Ikonka, type IkonkaId } from '@/components/variant/online/onlayn/Ikonka';
import '@/components/variant/online/onlayn/onlayn.css';
import { VARIANT_HREF, VARIANT_SCREEN } from '@/content/variant';
import { ONLINE_TEXT } from '@/content/variantOnline/text';

const T = ONLINE_TEXT.nachalo;

const IKONKI_CHIPOV: readonly IkonkaId[] = ['sloi', 'kniga', 'galka', 'stolbiki'];

export const metadata: Metadata = {
  title: `${T.title} — Будет на ЕГЭ`,
  description: T.lead,
};

/**
 * «Решить вариант онлайн» из меню «Варианты» — в «Стеклянной сцене»:
 * свечения позади стекла, стеклянные чипы и карточки, кристалл с
 * подписью высоты. Ученик выбирает режим и сразу решает новый вариант с
 * автопроверкой — без ссылки от учителя. Шапка, боковое меню и подвал —
 * общие для внутренних страниц (AppShell).
 */
export default function Page() {
  return (
    <AppShell active="variant">
      <main className="app-main onl">
        <div className="onl__aura" aria-hidden="true">
          <span className="onl__aura-siniy" />
          <span className="onl__aura-oranzh" />
        </div>

        <Breadcrumbs
          items={[
            { label: VARIANT_SCREEN.crumbs.home, href: '/' },
            { label: VARIANT_SCREEN.title, href: VARIANT_HREF },
            { label: T.crumb },
          ]}
        />

        <header className="onl-geroy">
          <div className="onl-geroy__tekst">
            <h1 className="t-h1 onl-geroy__title">{T.title}</h1>
            <p className="onl-geroy__lead">{T.lead}</p>
          </div>
          <ul className="onl-chipy">
            {T.chips.map((chip, i) => (
              <li key={chip} className="onl-chip">
                <Ikonka id={IKONKI_CHIPOV[i] ?? 'galka'} />
                {chip}
              </li>
            ))}
          </ul>
          <Kristall
            className="onl-geroy__kristall"
            podpisi={[{ id: 'h', text: T.kristall.podpis }]}
            hint={T.kristall.hint}
            sizes="(max-width: 759.98px) 261px, 420px"
          />
        </header>

        <OnlaynStart />

        <aside className="onl-uchitel">
          <Ikonka id="shapochka" className="onl-uchitel__znak" />
          <p className="onl-uchitel__tekst">
            <b>{T.teacher.lead}</b> {T.teacher.text}
          </p>
          <Link className="onl-btn onl-btn--kontur" href={VARIANT_HREF}>
            {T.teacher.button}
            <Ikonka id="strelka" />
          </Link>
        </aside>
      </main>
    </AppShell>
  );
}
