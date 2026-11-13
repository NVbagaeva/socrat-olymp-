import { AppShell } from '@/components/layout/AppShell';
import { Solid } from '@/components/solid/Solid';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { VseRazdelyKnopka } from '@/components/tasks/razdely';
import { ChasyIkonka, StsenaShapka, ZvezdaIkonka } from '@/components/tasks/stsena';
import { ProgressStseny3 } from '@/components/tasks/zadanie3/ProgressStseny3';
import { HandNote } from '@/components/ui';
import { tasksPage } from '@/content/tasks';
import {
  DEKOR_STEREO,
  NAV_STEREO,
  STEREO,
  vkladkiStereo,
  type StereoNo,
} from '@/content/stereo/zadaniya';
import { TABLETKI3 } from '@/content/zadanie3/spravka';
import { THUMBS } from '@/lib/solid/drawings/thumbs';
import { ZADANIYA } from '@/lib/paths';
import { BANK } from '@/lib/zadanie3';
import { KubSharOblozhka } from './KubSharOblozhka';
import { StereoDrugie, StereoNav } from './StereoNav';
import './stereo.css';
import './metodika.css';

/**
 * Миниатюра в шапке — чертёж движка lib/solid, пока нет иллюстрации
 * (список картинок — docs/stereometry-images.md, этап 6).
 */
const MINIATYURA: Record<StereoNo, string> = { '3': 'thumb-VIII', '15': 'thumb-I' };

/**
 * Оболочка стереометрии — одна на №3 и №15: крошки, заголовок, лента
 * вкладок и блок «Стереометрия в другой части» внизу. Вызывается из
 * layout маршрута: при смене вкладки остаётся на месте.
 *
 * У №3 — шапка «Стеклянная сцена» (components/tasks/stsena): крошки
 * одной строкой, стеклянная карточка с таблетками, прогрессом и
 * обложкой-кубом, переключатель раздела только на телефоне, лента —
 * ровные стеклянные кнопки. У №15 пока прежняя шапка: кнопка «‹ Все
 * разделы», плашка «Задание №… ▾» в ленте (как у №12).
 */
export function ShellStereo({ no, children }: { no: StereoNo; children: React.ReactNode }) {
  const z = STEREO[no];
  const base = `${ZADANIYA}/${z.slug}`;
  const crumbs = [
    { label: 'Главная', href: '/' },
    {
      label: 'Банк заданий',
      href: z.part === 2 ? `${tasksPage.href}?part=2` : tasksPage.href,
    },
    { label: `№${z.no}` },
  ];
  if (no === '3') {
    return (
      <AppShell active="tasks">
        <main className="app-main">
          <StsenaShapka
            crumbs={crumbs}
            pereklyuchatel={<StereoNav no={no} kratko />}
            title={z.title}
            lead={z.lead}
            tabletki={[
              { text: z.badge },
              { text: TABLETKI3.ball, ikonka: <ZvezdaIkonka />, ton: 'warm' },
              { text: TABLETKI3.vremya, ikonka: <ChasyIkonka /> },
            ]}
            progress={<ProgressStseny3 iz={BANK.length} />}
            media={<KubSharOblozhka />}
          />
          <RazdelTabs base={base} tabs={vkladkiStereo(no)} className="topic-tabs-row--stsena" />
          <div className="section-panel">
            {children}
            <StereoDrugie no={no} />
          </div>
        </main>
      </AppShell>
    );
  }
  const model = THUMBS[MINIATYURA[no]];
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="stereo-head section-head--art"
          crumbs={crumbs}
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
        <RazdelTabs base={base} tabs={vkladkiStereo(no)} before={<StereoNav no={no} />} />
        <div className="section-panel">
          {children}
          <StereoDrugie no={no} />
        </div>
      </main>
    </AppShell>
  );
}
