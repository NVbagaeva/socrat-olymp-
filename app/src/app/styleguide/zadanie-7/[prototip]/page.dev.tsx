import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Razbor7 } from '@/components/tasks/zadanie7/Razbor7';
import { Tex } from '@/components/ui/Tex';
import { ISKLYUCHENIYA, pravila } from '@/lib/zadanie7/bank/analogi';
import { zadachiPrototipa } from '@/lib/zadanie7/bank/index';
import { kodNaSayte, PROTOTYPES } from '@/lib/zadanie7/prototypes';
import type { BankItem } from '@/lib/zadanie7/types';
import 'katex/dist/katex.min.css';
import '@/components/tasks/zadanie7/razbor7.css';
import '../galereya7.css';

/* Галерея банка задания №7 — только для разработки.

   Файл называется page.dev.tsx: страницей он становится лишь в
   `next dev` или со флагом GALEREYA=1 / GALEREYA_7=1 (next.config.ts).
   В обычной сборке маршрута нет — адрес отдаёт 404, это проверяет
   scripts/check-dev-pages.mjs. Здесь видны ответы и разборы: по
   каждому прототипу — задачи ФИПИ и 20 аналогов, сверху — распределение
   ответов. */

export const metadata: Metadata = {
  title: 'Галерея банка задания №7: прототип',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return PROTOTYPES.map((p) => ({ prototip: p.id }));
}

export const dynamicParams = false;

const ru = (x: number) => String(x).replace('.', ',').replace('-', '−');

function Zadacha({ item }: { item: BankItem }) {
  const s = PROTOTYPES.find((p) => p.id === item.prototypeId)?.solve(item.params);
  return (
    <li className="g7__item">
      <div className="g7__meta">
        <span className="g7__id">{item.source === 'fipi' ? `ФИПИ №${item.no}` : item.id}</span>
        {item.gde ? <span className="g7__gde">{item.gde}</span> : null}
        {item.source === 'analog' ? <span className="g7__badge">не из открытого банка</span> : null}
        {s && s.postoronnie.length > 0 ? (
          <span className="g7__badge g7__badge--post">
            посторонний корень {s.postoronnie.map(ru).join('; ')}
          </span>
        ) : null}
        <span className="g7__otvet">
          Ответ: <b>{ru(item.answer)}</b>
        </span>
      </div>
      <p className="g7__text">
        <Tex text={item.text} />
      </p>
      {s ? (
        <details className="g7__razbor">
          <summary>Разбор и подсказки</summary>
          <Razbor7 s={s} podskazki />
        </details>
      ) : null}
    </li>
  );
}

export default async function GalereyaPrototipa7({
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
    <main className="g7">
      <nav className="g7__toc" aria-label="Навигация">
        <a href="../">← Все прототипы</a>
        {prev ? <a href={`../${prev.id}/`}>← {kodNaSayte(prev.id)}</a> : null}
        {next ? <a href={`../${next.id}/`}>{kodNaSayte(next.id)} →</a> : null}
      </nav>
      <section className="g7__section">
        <h1 className="t-h2">
          {kodNaSayte(p.id)}. <Tex text={p.title} />{' '}
          <span className="g7__group">группа {p.group}</span>
        </h1>
        <p className="g7__formula">
          Общий вид: <Tex text={`$${p.formula}$`} />.{' '}
          {p.fipiNos
            ? `Задачи ФИПИ из источников: ${p.fipiNos}.`
            : 'В источниках раздела задач ФИПИ этого вида нет — только аналоги.'}
        </p>
        <p className="g7__stat">
          Аналогов {analogi.length}, разных ответов {otvety.size} (нужно ≥ {pr.minRaznyh}), чаще
          всего ответ встречается {Math.max(0, ...otvety.values())} раз (можно ≤ {pr.maxPovtor}).
          {iskl ? (
            <b className="g7__iskl">
              {' '}
              Исключение: <Tex text={iskl.prichina} />.
            </b>
          ) : null}
        </p>
        <p className="g7__stat">
          Ответы аналогов:{' '}
          {[...otvety.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([o, k]) => `${ru(o)}${k > 1 ? ` ×${k}` : ''}`)
            .join('; ')}
        </p>
        {fipi.length > 0 ? (
          <>
            <h2 className="g7__sub">Открытый банк ФИПИ</h2>
            <ol className="g7__list">
              {fipi.map((z) => (
                <Zadacha key={z.id} item={z} />
              ))}
            </ol>
          </>
        ) : null}
        <h2 className="g7__sub">Аналоги</h2>
        <ol className="g7__list">
          {analogi.map((z) => (
            <Zadacha key={z.id} item={z} />
          ))}
        </ol>
      </section>
    </main>
  );
}
