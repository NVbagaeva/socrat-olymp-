import { AppShell } from '@/components/layout/AppShell';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { SectionHeader } from '@/components/tasks/shapka/SectionHeader';
import { STEREO, vkladkiStereo, type StereoNo } from '@/content/stereo/zadaniya';
import { razdelBase } from '@/lib/paths';
import { StereoDrugie, StereoNav } from './StereoNav';
import './stereo.css';
import './metodika.css';

/**
 * Оболочка стереометрии — одна на обе части: общая шапка раздела
 * (SectionHeader), лента вкладок и блок «Стереометрия в другой части»
 * внизу. Вызывается из layout маршрута: при смене вкладки остаётся на
 * месте. Переключатель раздела — только на телефоне и планшете.
 */
export function ShellStereo({ no, children }: { no: StereoNo; children: React.ReactNode }) {
  const z = STEREO[no];
  const base = `${razdelBase(z.slug)}`;
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <SectionHeader
          kod={no === '3' ? 'stereometriya' : 'stereometriya-dokazatelstvo'}
          pereklyuchatel={<StereoNav no={no} kratko />}
        />
        <RazdelTabs
          base={base}
          tabs={vkladkiStereo(no)}
          className="topic-tabs-row--stsena"
          bezPary
        />
        <div className="section-panel">
          {children}
          <StereoDrugie no={no} />
        </div>
      </main>
    </AppShell>
  );
}
