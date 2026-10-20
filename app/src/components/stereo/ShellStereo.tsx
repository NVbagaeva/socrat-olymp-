import { AppShell } from '@/components/layout/AppShell';
import { Solid } from '@/components/solid/Solid';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { VseRazdelyKnopka } from '@/components/tasks/razdely';
import { HandNote } from '@/components/ui';
import { tasksPage } from '@/content/tasks';
import {
  DEKOR_STEREO,
  NAV_STEREO,
  STEREO,
  VKLADKI_STEREO,
  type StereoNo,
} from '@/content/stereo/zadaniya';
import { THUMBS } from '@/lib/solid/drawings/thumbs';
import { ZADANIYA } from '@/lib/paths';
import { StereoDrugie, StereoNav } from './StereoNav';
import './stereo.css';

/**
 * Миниатюра в шапке — чертёж движка lib/solid, пока нет иллюстрации
 * (список картинок — docs/stereometry-images.md, этап 6).
 */
const MINIATYURA: Record<StereoNo, string> = { '3': 'thumb-VIII', '15': 'thumb-I' };

/**
 * Оболочка стереометрии — одна на №3 и №15: крошки, кнопка «‹ Все
 * разделы», заголовок, лента вкладок с плашкой «Задание №… ▾» и блок
 * «Стереометрия в другой части» внизу. Вызывается из layout маршрута:
 * при смене вкладки остаётся на месте. Устройство то же, что у №11;
 * плашка и меню — те же, что у №12 (components/tasks/razdely).
 */
export function ShellStereo({ no, children }: { no: StereoNo; children: React.ReactNode }) {
  const z = STEREO[no];
  const base = `${ZADANIYA}/${z.slug}`;
  const model = THUMBS[MINIATYURA[no]];
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="stereo-head section-head--art"
          crumbs={[
            { label: 'Главная', href: '/' },
            {
              label: 'Банк заданий',
              href: z.part === 2 ? `${tasksPage.href}?part=2` : tasksPage.href,
            },
            { label: `№${z.no}` },
          ]}
          back={<VseRazdelyKnopka no={z.no} href={base + '/'} podpis={NAV_STEREO.vse} />}
          title={z.title}
          badge={z.badge}
          lead={z.lead}
          media={
            model === undefined ? undefined : (
              <>
                <Solid model={model} />
                <HandNote className="section-head__note">{DEKOR_STEREO.note}</HandNote>
              </>
            )
          }
        />
        <RazdelTabs base={base} tabs={VKLADKI_STEREO} before={<StereoNav no={no} />} />
        <div className="section-panel">
          {children}
          <StereoDrugie no={no} />
        </div>
      </main>
    </AppShell>
  );
}
