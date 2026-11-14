import { AppShell } from '@/components/layout/AppShell';
import { LevelTabs } from '@/components/level/LevelTabs';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { VARIANT_BAZY as B } from '@/content/baza/variant';
import { VARIANT_SCREEN as T } from '@/content/variant';
import { assetUrl } from '@/lib/assetUrl';
import { levelInfo, type Level } from '@/lib/level';
import { VariantBazy } from './VariantBazy';
import { VariantScreen } from './VariantScreen';
import './sectionStyles';
import './variant.css';
import './online/online.css';

const ILL = (w: number, ext: string) => assetUrl(`/variant/tri-lista-${w}.${ext}`);

/**
 * «Собрать вариант»: генератор вариантов первой части (задания 1–13).
 * Всё считается в браузере — страница статическая. Подача — «Стеклянная
 * сцена»: шапка с иллюстрацией «три листа», плитки состава, чипы
 * настроек, окна (components/variant/okno) и панель «Сформировать».
 */
/**
 * Страница «Собрать вариант» уровня: шапка, первым шагом — выбор уровня
 * экзамена, ниже — сборщик. Одна разметка на /variant/ и /baza/variant/.
 */
export function VariantStranitsa({ level }: { level: Level }) {
  const info = levelInfo(level);
  const baza = level === 'base';
  return (
    <AppShell active="variant" level={level}>
      <main className="app-main var-stranica">
        <div className="var-aura" aria-hidden="true">
          <span className="var-aura__siniy" />
          <span className="var-aura__oranzh" />
        </div>
        <Breadcrumbs
          items={[
            { label: T.crumbs.home, href: info.home },
            { label: T.crumbs.bank, href: info.bank },
            { label: baza ? B.title : T.title },
          ]}
        />
        <header className="var-geroy">
          <div className="var-geroy__tekst">
            <h1 className="t-h1 var-geroy__title">{baza ? B.title : T.title}</h1>
            <p className="var-geroy__lead">{baza ? B.lead : T.leadKratko}</p>
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
        {/* Шаг 1 — уровень экзамена. Сегменты — ссылки: уровень живёт в адресе. */}
        <section className="var-uroven" aria-labelledby="var-uroven-h">
          <h2 id="var-uroven-h" className="var-uroven__title">
            {T.uroven.title}
          </h2>
          <LevelTabs level={level} to="variant" zadaniya label={T.uroven.title} />
        </section>
        {baza ? <VariantBazy /> : <VariantScreen />}
      </main>
    </AppShell>
  );
}
