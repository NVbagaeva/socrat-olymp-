import Image from 'next/image';
import { AppShell } from '@/components/layout/AppShell';
import { taskParts, tasksPage } from '@/content/tasks';
import { ZADANIE14 } from '@/content/zadanie14';
import { assetUrl } from '@/lib/assetUrl';
import { RazdelTabs } from '../RazdelTabs';
import { ShapkaRazdela } from '../ShapkaRazdela';

/**
 * Оболочка задания №14: крошки, заголовок, иллюстрация и лента
 * вкладок — устройство то же, что у №11. Вызывается из layout
 * маршрута: при переходе между вкладками остаётся на месте.
 *
 * Крошки — как у заглушек второй части: «Банк заданий ЕГЭ / Часть 2 /
 * Задание №14». Кольца прогресса пока нет: считать нечего, задач
 * в разделе ещё нет.
 */
export function Shell14({ children }: { children: React.ReactNode }) {
  const base = `${tasksPage.href}/${ZADANIE14.slug}`;
  const part = taskParts[1];
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="z14-head"
          crumbs={[
            { label: tasksPage.stub.crumb, href: `${tasksPage.href}/` },
            { label: part.title, href: `${tasksPage.href}/?part=${part.part}` },
            { label: `Задание №${Number(ZADANIE14.no)}` },
          ]}
          title={ZADANIE14.title}
          badge={ZADANIE14.badge}
          lead={ZADANIE14.lead}
          media={
            /* Та же иконка, что на плашке банка, — декор. */
            <Image
              className="z14-head__art"
              src={assetUrl(`/images/task-${ZADANIE14.no}.svg`)}
              alt=""
              width={180}
              height={180}
            />
          }
        />
        <RazdelTabs base={base} tabs={ZADANIE14.tabs} />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
