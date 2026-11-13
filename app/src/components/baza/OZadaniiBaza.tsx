import { BAZA_TEXT, OTVET_TEXT, pasport } from '@/content/baza/razdely';
import type { ExamTask } from '@/content/tasks';

/**
 * «О задании» базы: формат задания — как записывается ответ, сколько
 * баллов, место в экзамене. Данные — паспорт задания (content/baza).
 */
export function FormatZadaniya({ task }: { task: ExamTask }) {
  const T = BAZA_TEXT.format;
  const rows = [
    [T.otvet, OTVET_TEXT[pasport(task.slug).otvet]],
    [T.ball, T.ballText],
    [T.ekzamen, T.ekzamenText],
  ] as const;
  return (
    <section className="baza-format" aria-labelledby="baza-format-title">
      <h2 id="baza-format-title" className="t-h4">
        {T.title}
      </h2>
      <dl className="baza-format__list">
        {rows.map(([name, text]) => (
          <div key={name} className="baza-format__row">
            <dt>{name}</dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
