import { AppShell } from '@/components/layout/AppShell';
import { RisunokRazdela, StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { tasksPage } from '@/content/tasks';
import { STSENA } from '@/content/stsena';
import { SHAPKA7 } from '@/content/uravneniya7';
import { ZADANIE7 } from '@/content/zadanie7';
import { ZADANIYA } from '@/lib/paths';
import { PROTOTYPES } from '@/lib/zadanie7/prototypes';
import { IllyustratsiyaShapki } from '../IllyustratsiyaShapki';
import { RazdelTabs } from '../RazdelTabs';

/**
 * Оболочка задания №7: шапка «Стеклянная сцена» и липкая лента вкладок
 * (RazdelTabs). Вызывается из layout маршрута — при переходе между
 * вкладками остаётся на месте, как у №10 и №11.
 *
 * Обложка: своя картинка, пока её нет — мотив раздела, нарисованный
 * кодом. Балл и время в таблетках — из тех же `SHAPKA7.fakty`, что
 * показывает вкладка «О задании».
 */
export function Shell7({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${ZADANIE7.slug}`;
  const no = String(Number(ZADANIE7.no));
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${no}` },
          ]}
          title={ZADANIE7.title}
          lead={ZADANIE7.lead}
          tabletki={tabletkiRazdela({
            chast: ZADANIE7.badge,
            fakty: SHAPKA7.fakty(PROTOTYPES.length),
          })}
          media={
            ZADANIE7.art ? (
              <IllyustratsiyaShapki art={ZADANIE7.art} />
            ) : (
              <RisunokRazdela no={no} label={`${STSENA.oblozhka}: ${ZADANIE7.title}`} />
            )
          }
        />
        <RazdelTabs base={base} tabs={ZADANIE7.tabs} className="topic-tabs-row--stsena" />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
