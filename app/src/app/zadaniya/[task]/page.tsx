import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { TaskStub, stubTitle } from '@/components/tasks/TaskStub';
import { chastiStarykh, novyyAdres } from '@/content/pereezd';
import { taskHasPage, tasks, vseRazdely, type ExamTask } from '@/content/tasks';
import { kodAdresa } from '@/lib/paths';
import '../zadaniya.css';
import './section.css';

/* Неоткрытое задание со страницей-заглушкой (stub в content/tasks.ts):
   своего раздела у него нет — по адресу его кода собирается заглушка.
   Открытые задания живут в своих папках по коду раздела. */
function stubTask(kod: string): ExamTask | undefined {
  return tasks.find(
    (task: ExamTask) =>
      kodAdresa(task.slug) === kod && task.status !== 'ready' && taskHasPage(task),
  );
}

/* Статический экспорт: список страниц известен до сборки. Кроме
   заглушек неоткрытых заданий — прежние адреса разделов по номеру
   (/zadaniya/7/): «Страница переехала» на адрес по коду. */
export function generateStaticParams() {
  const zaglushki = tasks
    .map((task) => kodAdresa(task.slug))
    .filter((kod) => stubTask(kod) !== undefined)
    .map((kod) => ({ task: kod }));
  const starye = chastiStarykh()
    .filter((ch) => ch.length === 1)
    .map(([task]) => ({ task: task! }));
  return [...zaglushki, ...starye];
}
export const dynamicParams = false;

type Params = Promise<{ task: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { task: param } = await params;
  const task = stubTask(param);
  if (task !== undefined) return { title: `${stubTitle(task)} — Будет на ЕГЭ` };
  return REDIRECT_METADATA;
}

export default async function TaskPage({ params }: { params: Params }) {
  const { task: param } = await params;
  const task = stubTask(param);
  if (task !== undefined) return <TaskStub task={task} />;
  const kuda = novyyAdres(`/zadaniya/${param}/`);
  if (kuda === undefined) notFound();
  const razdel = vseRazdely.find((r) => r.slug === param);
  return <RedirectPage href={kuda} title={razdel?.name ?? 'Банк заданий'} />;
}
