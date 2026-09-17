import type { Metadata } from 'next';
import { Solid } from '@/components/solid/Solid';
import { BANK, RAZDEL_1, RAZDEL_2, RAZDEL_3, RAZDEL_4 } from '@/lib/zadanie3';
import { assertBankOk, type BankReport, checkBank } from '@/lib/zadanie3/selftest';
import type { Prototype, Variant } from '@/lib/zadanie3/types';
import { typeset } from '@/lib/tex';
import '@/lib/solid/solid.css';
import './zadanie-3.css';

/* Служебная витрина банка задач задания №3, по разделам. Здесь видны
   и ответы — это страница разработки, в меню она не входит и не
   индексируется. В самом разделе сайта ответы в разметку не попадают.

   Проверка считается на сборке, по всему собранному банку сразу.
   Если хоть один вариант не сходится, сборка падает: assertBankOk
   бросает исключение. */

export const metadata: Metadata = {
  title: 'Банк задач №3 — витрина',
  robots: { index: false, follow: false },
};

const FULL_REPORT = checkBank(BANK);
assertBankOk(FULL_REPORT);

const SECTIONS: { id: string; title: string; lead: string; items: readonly Prototype[] }[] = [
  {
    id: 'razdel-I',
    title: 'Раздел I. Параллелепипед и куб',
    lead: '19 прототипов по 10 вариантов.',
    items: RAZDEL_1,
  },
  {
    id: 'razdel-II',
    title: 'Раздел II. Призма',
    lead: '21 прототип по 10 вариантов.',
    items: RAZDEL_2,
  },
  {
    id: 'razdel-III',
    title: 'Раздел III. Пирамида',
    lead: '11 прототипов по 10 вариантов.',
    items: RAZDEL_3,
  },
  {
    id: 'razdel-IV',
    title: 'Раздел IV. Конус',
    lead: '11 прототипов по 10 вариантов.',
    items: RAZDEL_4,
  },
];

function Condition({ text }: { text: string }) {
  return <span dangerouslySetInnerHTML={{ __html: typeset(text) }} />;
}

function VariantRow({
  report,
  prototype,
  variant,
}: {
  report: BankReport;
  prototype: Prototype;
  variant: Variant;
}) {
  const row = report.rows.find((item) => item.id === prototype.id && item.n === variant.n);
  if (row === undefined) {
    throw new Error(`Нет проверки для ${prototype.id} варианта ${variant.n}`);
  }
  return (
    <tr>
      <td className="z3__num">{variant.n}</td>
      <td className="z3__src">{variant.source}</td>
      <td className="z3__ref">{variant.ref}</td>
      <td className="z3__cond">
        <Condition text={row.uslovie} />
      </td>
      <td className="z3__ans">{String(row.otvet).replace('.', ',')}</td>
      <td className="z3__ans">{String(row.poModeli).replace('.', ',')}</td>
      <td className="z3__ans">{row.shag === null ? '—' : String(row.shag).replace('.', ',')}</td>
      <td className="z3__ans">
        {variant.sourceAnswer === undefined ? '—' : String(variant.sourceAnswer).replace('.', ',')}
      </td>
    </tr>
  );
}

function PrototypeCard({ report, prototype }: { report: BankReport; prototype: Prototype }) {
  const first = prototype.varianty[0];
  if (first === undefined) {
    return null;
  }
  const steps = prototype.shagi(first.params);
  /* У прототипов с числами на чертеже чертёж свой у каждого варианта. */
  const perVariant = (prototype.chertezh(first.params).measures ?? []).length > 0;

  return (
    <article className="z3__card" id={prototype.id}>
      <header className="z3__head">
        <p className="z3__id">
          {prototype.id} · раздел {prototype.razdel} · задачник{' '}
          {prototype.zadachnik[0] === prototype.zadachnik[1]
            ? `№${prototype.zadachnik[0]}`
            : `№${prototype.zadachnik[0]}–${prototype.zadachnik[1]}`}{' '}
          · <b>{prototype.status}</b>
        </p>
        <h3 className="z3__name">{prototype.nazvanie}</h3>
        <p className="z3__tip">
          {prototype.tip}. Формат ответа: {prototype.format}.
        </p>
      </header>

      <div className="z3__body">
        <div className="z3__figs">
          {perVariant ? (
            prototype.varianty.map((variant) => (
              <figure className="z3__fig" key={variant.n}>
                <Solid model={prototype.chertezh(variant.params)} />
                <figcaption>вариант {variant.n}</figcaption>
              </figure>
            ))
          ) : (
            <figure className="z3__fig">
              <Solid model={prototype.chertezh(first.params)} />
              <figcaption>чертёж прототипа</figcaption>
            </figure>
          )}
        </div>

        <div className="z3__steps">
          <h4 className="z3__sub">Шаги разбора, вариант 1</h4>
          <ol>
            {steps.map((step, index) => (
              <li key={index}>
                <Condition text={step.text} />
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="z3__table-wrap">
        <table className="z3__table">
          <thead>
            <tr>
              <th>№</th>
              <th>источник</th>
              <th>ссылка</th>
              <th>условие</th>
              <th>ответ</th>
              <th>по модели</th>
              <th>шаг</th>
              <th>в источнике</th>
            </tr>
          </thead>
          <tbody>
            {prototype.varianty.map((variant) => (
              <VariantRow key={variant.n} report={report} prototype={prototype} variant={variant} />
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function SevenNumbers({ report }: { report: BankReport }) {
  return (
    <>
      <ol className="z3__numbers">
        <li>
          Прототипов <b>{report.prototypes}</b>, вариантов <b>{report.variants}</b>.
        </li>
        <li>
          Из задачника <b>{report.bySource.задачник}</b>, из домашки{' '}
          <b>{report.bySource.домашка}</b>, создано заново <b>{report.bySource.новый}</b>.
        </li>
        <li>
          Ответ по формуле разошёлся с ответом по модели: <b>{report.mismatchModel}</b>.
        </li>
        <li>
          Последний шаг разбора не равен ответу: <b>{report.mismatchSteps}</b>.
        </li>
        <li>
          Ответ не целый и не конечная десятичная дробь: <b>{report.badFormat}</b>.
        </li>
        <li>
          Варианты из задачника и домашки, не прошедшие проверку:{' '}
          <b>{report.sourceProblems.length}</b>.
        </li>
        <li>
          Совпадающих вариантов: <b>{report.duplicates.length}</b>.
        </li>
      </ol>
      <p className="z3__lead">
        Сверх этого: чертежей вариантов с нарушениями чек-листа из 12 пунктов —{' '}
        <b>{report.drawingViolations.length}</b> из <b>{report.variants}</b>.
      </p>
    </>
  );
}

function RazdelSection({
  id,
  title,
  lead,
  items,
}: {
  id: string;
  title: string;
  lead: string;
  items: readonly Prototype[];
}) {
  const report = checkBank(items);
  return (
    <section className="z3__section" id={id}>
      <h2 className="t-h2">{title}</h2>
      <p className="z3__lead">{lead}</p>
      <SevenNumbers report={report} />
      <div className="z3__cards">
        {items.map((prototype) => (
          <PrototypeCard key={prototype.id} report={report} prototype={prototype} />
        ))}
      </div>
    </section>
  );
}

export default function Zadanie3Page() {
  return (
    <main className="z3">
      <header>
        <h1 className="t-h1">Банк задач №3</h1>
        <p className="z3__lead">
          Этап 3: формат прототипа и варианты. Условие — формулировка задачника, числа и буквы —
          параметры варианта. Ответ каждого варианта считается дважды: по формуле прототипа и
          независимо по координатам той же трёхмерной модели, которую рисует движок. Ответ
          последнего шага разбора сверяется с ответом задачи, а там, где вариант взят из домашней
          работы, — ещё и с её ответом.
        </p>
        <p className="z3__lead">
          Страница служебная: в меню не входит, не индексируется, и только здесь ответы видны
          открыто. В самом разделе сайта ответ в разметку не попадёт. Семь чисел печатаются по
          каждому разделу отдельно; проверка на сборке считается по всему банку сразу — тем же
          автотестом: <code>pnpm test:zadanie3</code>.
        </p>
      </header>

      {SECTIONS.map((section) => (
        <RazdelSection key={section.id} {...section} />
      ))}
    </main>
  );
}
