import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Razbor10 } from '@/components/tasks/zadanie10/Razbor10';
import { Tex } from '@/components/ui/Tex';
import { ISKLYUCHENIYA, pravila } from '@/lib/zadanie10/bank/analogi';
import { zadachiPrototipa } from '@/lib/zadanie10/bank/index';
import { kodNaSayte, PROTOTYPES } from '@/lib/zadanie10/prototypes';
import type { BankItem } from '@/lib/zadanie10/types';
import 'katex/dist/katex.min.css';
import '@/components/tasks/zadanie10/razbor10.css';
import '../galereya10.css';

/* Галерея банка задания №10 — только для разработки.

   Файл называется page.dev.tsx: страницей он становится лишь в
   `next dev` или со флагом GALEREYA=1 / GALEREYA_10=1 (next.config.ts).
   В обычной сборке маршрута нет — адрес отдаёт 404, это проверяет
   scripts/check-dev-pages.mjs. Здесь видны ответы и разборы: по
   каждому прототипу — задачи ФИПИ и 20 аналогов, сверху — распределение
   ответов. */

export const metadata: Metadata = {
  title: 'Галерея банка задания №10: прототип',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return PROTOTYPES.map((p) => ({ prototip: p.id }));
}

export const dynamicParams = false;

function Zadacha({ item }: { item: BankItem }) {
  const s = PROTOTYPES.find((p) => p.id === item.prototypeId)?.solve(item.params);
  return (
    <li className="g10__item">
      <div className="g10__meta">
        <span className="g10__id">{item.source === 'fipi' ? `ФИПИ №${item.no}` : item.id}</span>
        {item.source === 'analog' ? (
          <span className="g10__badge">не из открытого банка</span>
        ) : null}
        {item.modern ? (
          <span className="g10__badge g10__badge--modern">современный сюжет</span>
        ) : null}
        {item.plot ? <span className="g10__plot">{item.plot}</span> : null}
        <span className="g10__otvet">
          Ответ: <b>{String(item.answer).replace('.', ',')}</b>
        </span>
      </div>
      <p className="g10__text">
        <Tex text={item.text} />
      </p>
      {s ? (
        <details className="g10__razbor">
          <summary>Разбор и подсказки</summary>
          <Razbor10 s={s} podskazki />
        </details>
      ) : null}
    </li>
  );
}

export default async function GalereyaPrototipa10({
  params,
}: {
  params: Promise<{ prototip: string }>;
}) {
  const { prototip } = await params;
  const p = PROTOTYPES.find((x) => x.id === prototip);
  if (p === undefined) {
    notFound();
  }
  const { fipi, analogi } = zadachiPrototipa(p.id);
  const otvety = new Map<number, number>();
  analogi.forEach((a) => otvety.set(a.answer, (otvety.get(a.answer) ?? 0) + 1));
  const iskl = ISKLYUCHENIYA[p.id];
  const pr = pravila(p.id);
  const i = PROTOTYPES.indexOf(p);
  const prev = PROTOTYPES[i - 1];
  const next = PROTOTYPES[i + 1];
  return (
    <main className="g10">
      <nav className="g10__toc" aria-label="Навигация">
        <a href="../">← Все прототипы</a>
        {prev ? <a href={`../${prev.id}/`}>← {kodNaSayte(prev.id)}</a> : null}
        {next ? <a href={`../${next.id}/`}>{kodNaSayte(next.id)} →</a> : null}
      </nav>
      <section className="g10__section">
        <h1 className="t-h2">
          {kodNaSayte(p.id)}. {p.title} <span className="g10__group">группа {p.group}</span>
        </h1>
        <p className="g10__formula">
          <Tex text={`$${p.formula}$`} /> — ищем <Tex text={p.ask} />.{' '}
          {p.fipiNos
            ? `Задачи задачника: ${p.fipiNos}.`
            : 'Прототип из стороннего курса — не из открытого банка.'}
        </p>
        <p className="g10__stat">
          Аналогов {analogi.length}, современных {analogi.filter((a) => a.modern).length}, разных
          ответов {otvety.size} (нужно ≥ {pr.minRaznyh}), чаще всего ответ встречается{' '}
          {Math.max(0, ...otvety.values())} раз (можно ≤ {pr.maxPovtor}).
          {iskl ? (
            <b className="g10__iskl">
              {' '}
              Исключение: <Tex text={iskl.prichina} />.
            </b>
          ) : null}
        </p>
        <p className="g10__stat">
          Ответы аналогов:{' '}
          {[...otvety.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([o, k]) => `${String(o).replace('.', ',')}${k > 1 ? ` ×${k}` : ''}`)
            .join('; ')}
        </p>
        {fipi.length > 0 ? (
          <>
            <h2 className="g10__sub">Открытый банк ФИПИ</h2>
            <ol className="g10__list">
              {fipi.map((z) => (
                <Zadacha key={z.id} item={z} />
              ))}
            </ol>
          </>
        ) : null}
        <h2 className="g10__sub">Аналоги</h2>
        <ol className="g10__list">
          {analogi.map((z) => (
            <Zadacha key={z.id} item={z} />
          ))}
        </ol>
      </section>
    </main>
  );
}
