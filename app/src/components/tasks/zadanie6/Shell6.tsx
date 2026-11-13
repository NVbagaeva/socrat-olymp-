import { AppShell } from '@/components/layout/AppShell';
import { RisunokRazdela, StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { tasksPage } from '@/content/tasks';
import { SHAPKA6 } from '@/content/sluchainye6';
import { STSENA } from '@/content/stsena';
import { ZADANIE6 } from '@/content/zadanie6';
import { ZADANIYA } from '@/lib/paths';
import { PROTOTYPES } from '@/lib/zadanie6/prototypes';
import { IllyustratsiyaShapki } from '../IllyustratsiyaShapki';
import { RazdelTabs } from '../RazdelTabs';

/**
 * Оболочка задания №6: шапка «Стеклянная сцена» и липкая лента вкладок
 * (RazdelTabs). Вызывается из layout маршрута — при переходе между
 * вкладками остаётся на месте, как у №7 и №10.
 *
 * Обложка: своя картинка, пока её нет — мотив раздела, нарисованный
 * кодом. Балл и время в таблетках — из тех же `SHAPKA6.fakty`, что
 * показывает вкладка «О задании».
 */
export function Shell6({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE6.slug}`;
  const no = String(Number(ZADANIE6.no));
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${no}` },
          ]}
          title={ZADANIE6.title}
          lead={ZADANIE6.lead}
          tabletki={tabletkiRazdela({
            chast: ZADANIE6.badge,
            fakty: SHAPKA6.fakty(PROTOTYPES.length),
          })}
          media={
            ZADANIE6.art ? (
              <IllyustratsiyaShapki art={ZADANIE6.art} />
            ) : (
              <RisunokRazdela no={no} label={`${STSENA.oblozhka}: ${ZADANIE6.title}`} />
            )
          }
        />
        <RazdelTabs base={base} tabs={ZADANIE6.tabs} className="topic-tabs-row--stsena" />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
