import { AppShell } from '@/components/layout/AppShell';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { ChasyIkonka, RisunokRazdela, StsenaShapka, ZvezdaIkonka } from '@/components/tasks/stsena';
import { ProgressStseny3 } from '@/components/tasks/zadanie3/ProgressStseny3';
import { tasksPage } from '@/content/tasks';
import { STSENA } from '@/content/stsena';
import { STEREO, vkladkiStereo, type StereoNo } from '@/content/stereo/zadaniya';
import { TABLETKI3 } from '@/content/zadanie3/spravka';
import { ZADANIYA } from '@/lib/paths';
import { BANK } from '@/lib/zadanie3';
import { KubSharOblozhka } from './KubSharOblozhka';
import { StereoDrugie, StereoNav } from './StereoNav';
import './stereo.css';
import './metodika.css';

/**
 * Оболочка стереометрии — одна на №3 и №15: шапка «Стеклянная сцена»,
 * лента вкладок и блок «Стереометрия в другой части» внизу. Вызывается
 * из layout маршрута: при смене вкладки остаётся на месте.
 *
 * Крошки одной строкой, переключатель раздела — только на телефоне и
 * планшете. Обложка у №3 — стеклянный куб, оживающий в 3D; у №15 —
 * мотив раздела, нарисованный кодом, пока нет своей иллюстрации
 * (docs/stereometry-images.md, этап 6).
 *
 * Балл, время и прогресс пока есть только у №3: у №15 этих данных в
 * разделе нет, и выдумывать их нечем.
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
  const tabletki =
    no === '3'
      ? [
          { text: z.badge },
          { text: TABLETKI3.ball, ikonka: <ZvezdaIkonka />, ton: 'warm' as const },
          { text: TABLETKI3.vremya, ikonka: <ChasyIkonka /> },
        ]
      : [{ text: z.badge }];

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <StsenaShapka
          crumbs={crumbs}
          pereklyuchatel={<StereoNav no={no} kratko />}
          title={z.title}
          lead={z.lead}
          tabletki={tabletki}
          {...(no === '3' ? { progress: <ProgressStseny3 iz={BANK.length} /> } : {})}
          media={
            no === '3' ? (
              <KubSharOblozhka />
            ) : (
              <RisunokRazdela no={z.no} label={`${STSENA.oblozhka}: ${z.title}`} />
            )
          }
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
