import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { VariantScreen } from '@/components/variant/VariantScreen';
import '@/components/variant/sectionStyles';
import '@/components/variant/variant.css';
import '@/components/variant/online/online.css';
import { VARIANT_SCREEN as T } from '@/content/variant';
import { tasksPage } from '@/content/tasks';
import { assetUrl } from '@/lib/assetUrl';

export const metadata: Metadata = {
  title: `${T.title} — Будет на ЕГЭ`,
  description: T.lead,
};

const ILL = (w: number, ext: string) => assetUrl(`/variant/tri-lista-${w}.${ext}`);

/**
 * «Собрать вариант»: генератор вариантов первой части (задания 1–13).
 * Всё считается в браузере — страница статическая. Подача — «Стеклянная
 * сцена»: шапка с иллюстрацией «три листа», плитки состава, чипы
 * настроек, окна (components/variant/okno) и панель «Сформировать».
 */
export default function VariantPage() {
  return (
    <AppShell active="variant">
      <main className="app-main var-stranica">
        <div className="var-aura" aria-hidden="true">
          <span className="var-aura__siniy" />
          <span className="var-aura__oranzh" />
        </div>
        <Breadcrumbs
          items={[
            { label: T.crumbs.home, href: '/' },
            { label: T.crumbs.bank, href: tasksPage.href },
            { label: T.title },
          ]}
        />
        <header className="var-geroy">
          <div className="var-geroy__tekst">
            <h1 className="t-h1 var-geroy__title">{T.title}</h1>
            <p className="var-geroy__lead">{T.leadKratko}</p>
          </div>
          {/* Три листа: ученику, учителю, разбор. Декоративная — alt пустой.
              В первом экране — грузится сразу. */}
          <picture className="var-geroy__ill">
            <source
              type="image/avif"
              srcSet={`${ILL(360, 'avif')} 360w, ${ILL(720, 'avif')} 720w`}
              sizes="(max-width: 767.98px) 45vw, 340px"
            />
            <source
              type="image/webp"
              srcSet={`${ILL(360, 'webp')} 360w, ${ILL(720, 'webp')} 720w`}
              sizes="(max-width: 767.98px) 45vw, 340px"
            />
            <img
              src={ILL(720, 'png')}
              alt=""
              width={1448}
              height={1086}
              loading="eager"
              decoding="async"
              draggable={false}
            />
          </picture>
        </header>
        <VariantScreen />
      </main>
    </AppShell>
  );
}
