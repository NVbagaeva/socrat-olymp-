import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TaskStub, stubTitle } from '@/components/tasks/TaskStub';
import { taskHasPage, tasks, type ExamTask } from '@/content/tasks';
import '../zadaniya.css';
import './section.css';

/* Неоткрытое задание со страницей-заглушкой (stub в content/tasks.ts).
   Своего раздела у него нет — по его адресу собирается заглушка.
   Открытые задания, №12 в том числе, живут в своих папках. */
function stubTask(slug: string): ExamTask | undefined {
  return tasks.find(
    (task: ExamTask) => task.slug === slug && task.status !== 'ready' && taskHasPage(task),
  );
}

/* Статический экспорт: список страниц известен до сборки и считается
   из конфига. Незаявленные адреса не собираются и не открываются. */
export function generateStaticParams() {
  return tasks
    .filter((task) => stubTask(task.slug) !== undefined)
    .map((task) => ({ task: task.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ task: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const task = stubTask((await params).task);
  return task === undefined ? {} : { title: `${stubTitle(task)} — Будет на ЕГЭ` };
}

export default async function StubPage({ params }: { params: Params }) {
  const task = stubTask((await params).task);
  if (task === undefined) {
    notFound();
  }
  return <TaskStub task={task} />;
}
