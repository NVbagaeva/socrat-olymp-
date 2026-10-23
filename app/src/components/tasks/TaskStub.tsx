import Image from 'next/image';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { taskBase, taskParts, tasksPage, type ExamTask } from '@/content/tasks';
import { VKLADKI_ZAGLUSHKI } from '@/content/vkladki';
import { assetUrl } from '@/lib/assetUrl';
import { RazdelTabs } from './RazdelTabs';
import { ShapkaRazdela } from './ShapkaRazdela';
import { href } from '@/lib/paths';

/** «Задание №15. Стереометрия» — заголовок заглушки. */
export function stubTitle(task: ExamTask): string {
  return `Задание №${Number(task.no)}. ${task.name}`;
}

/**
 * Страница неоткрытого задания: /zadaniya/{slug}/.
 *
 * Устроена как раздел — крошки, шапка, липкая лента вкладок, — чтобы
 * открытие раздела не меняло каркас страницы: вместо карточки «Раздел
 * в разработке» встанет содержимое вкладок. Иллюстрация — та же
 * иконка, что на плашке банка, только крупнее.
 */
export function TaskStub({ task }: { task: ExamTask }) {
  const part = taskParts.find((item) => item.part === task.part) ?? taskParts[0];
  const partHref = task.part === 1 ? tasksPage.href : href(tasksPage.href, `?part=${task.part}`);
  const { stub } = tasksPage;

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="task-stub-head"
          crumbs={[
            { label: stub.crumb, href: tasksPage.href },
            { label: part.title, href: partHref },
            { label: `Задание №${Number(task.no)}` },
          ]}
          title={stubTitle(task)}
          badge={stub.badge}
          badgeTone="neutral"
        />

        <RazdelTabs base={taskBase(task)} tabs={VKLADKI_ZAGLUSHKI} />

        <div className="section-panel">
          <section className="task-stub" aria-labelledby="task-stub-title">
            <div className="task-stub__art">
              {/* Иллюстрация — декор: название задания стоит рядом. */}
              <Image
                src={assetUrl(`/images/task-${task.no}.${task.icon ?? 'webp'}`)}
                alt=""
                width={240}
                height={240}
              />
            </div>
            <div className="task-stub__text">
              <h2 id="task-stub-title" className="t-h4">
                {stub.title}
              </h2>
              <p className="task-stub__lead">{stub.text}</p>
              <Link className="btn btn--primary task-stub__cta" href={partHref}>
                {stub.action}
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h13M12 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
