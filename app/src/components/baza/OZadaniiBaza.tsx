import { BAZA_TEXT, OTVET_TEXT, pasport } from '@/content/baza/razdely';
import Link from 'next/link';
import { Tex } from '@/components/ui/Tex';
import { taskBase, type ExamTask } from '@/content/tasks';
import type { RazdelBazy } from '@/lib/baza/types';
import { vkladkaBazy } from '@/content/baza/razdely';

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

/**
 * «О задании» наполненного раздела: что нужно сделать, типы задач с
 * примером и переход в тренажёр.
 */
export function OZadaniiBaza({
  task,
  oZadanii,
}: {
  task: ExamTask;
  oZadanii: NonNullable<RazdelBazy['oZadanii']>;
}) {
  const base = taskBase(task);
  return (
    <section className="baza-o" aria-labelledby="baza-o-title">
      <h2 id="baza-o-title" className="t-h3">
        {oZadanii.title}
      </h2>
      <div className="flow baza-o__text">
        {oZadanii.text.map((p) => (
          <p key={p}>
            <Tex text={p} />
          </p>
        ))}
      </div>
      <ul className="baza-o__tipy">
        {oZadanii.tipy.map((tip, i) => (
          <li key={tip.title} className="baza-o__tip">
            <span className="baza-o__no">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="t-h4">{tip.title}</h3>
            <p>
              <Tex text={tip.primer} />
            </p>
          </li>
        ))}
      </ul>
      <div className="baza-o__dalshe">
        <Link className="btn btn--primary" href={`${base}/${vkladkaBazy('teoriya').tail}`}>
          Читать теорию
        </Link>
        <Link className="btn btn--secondary" href={`${base}/${vkladkaBazy('trenazher').tail}`}>
          В тренажёр
        </Link>
      </div>
    </section>
  );
}
