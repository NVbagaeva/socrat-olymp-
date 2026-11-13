import { AppShell } from '@/components/layout/AppShell';
import { RisunokRazdela, StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { tasksPage } from '@/content/tasks';
import { STSENA } from '@/content/stsena';
import { VYCHISLENIYA } from '@/content/vychisleniya';
import { SHAPKA8 } from '@/content/vychisleniya8/spravka';
import { RazdelTabs } from '../RazdelTabs';
import { ZADANIYA } from '@/lib/paths';
import { BANK_TOTAL } from '@/lib/vychisleniya/ids';
import { HomeworkBanner8 } from '@/components/dz/Razdel8Dz';
import { ProgressStseny8 } from './ProgressStseny8';

/**
 * Оболочка задания №8: шапка «Стеклянная сцена», лента вкладок и панель
 * содержания.
 *
 * Вызывается из layout маршрута: при переходе между вкладками React
 * оставляет оболочку на месте. Балл и время в таблетках — из тех же
 * `SHAPKA8.fakty`, что показывает вкладка «О задании».
 */
export function VychisleniyaShell({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${VYCHISLENIYA.slug}`;
  const no = String(Number(VYCHISLENIYA.no));

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${no}` },
          ]}
          title={VYCHISLENIYA.title}
          lead={VYCHISLENIYA.lead}
          tabletki={tabletkiRazdela({ chast: VYCHISLENIYA.badge, fakty: SHAPKA8.fakty })}
          progress={<ProgressStseny8 iz={BANK_TOTAL} />}
          media={<RisunokRazdela no={no} label={`${STSENA.oblozhka}: ${VYCHISLENIYA.title}`} />}
        />

        <RazdelTabs
          base={base}
          tabs={VYCHISLENIYA.tabs}
          tutors={VYCHISLENIYA.tutors}
          className="topic-tabs-row--stsena"
        />

        <div className="section-panel">
          {/* Ученику со входом — «У вас домашнее задание до …». Гостю — ничего. */}
          <HomeworkBanner8 />
          {children}
        </div>
      </main>
    </AppShell>
  );
}
