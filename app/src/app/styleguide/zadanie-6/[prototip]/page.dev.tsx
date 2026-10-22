import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Razbor6 } from '@/components/tasks/zadanie6/Razbor6';
import { Uslovie6 } from '@/components/tasks/zadanie6/Uslovie6';
import { Tex } from '@/components/ui/Tex';
import { ISKLYUCHENIYA, pravila } from '@/lib/zadanie6/bank/analogi';
import { podpisIstochnika, zadachiPrototipa } from '@/lib/zadanie6/bank/index';
import { kodNaSayte, PROTOTYPES } from '@/lib/zadanie6/prototypes';
import { NAZVANIYA_TEM } from '@/lib/zadanie6/velichiny';
import type { BankItem } from '@/lib/zadanie6/types';
import 'katex/dist/katex.min.css';
import '@/components/probability/probability.css';
import '@/components/tasks/zadanie6/zadanie6.css';
import '../galereya6.css';

/* Галерея банка задания №6 — только для разработки.

   Файл называется page.dev.tsx: страницей он становится лишь в
   `next dev` или со флагом GALEREYA=1 / GALEREYA_6=1 (next.config.ts).
   В обычной сборке маршрута нет — адрес отдаёт 404, это проверяет
   scripts/check-dev-pages.mjs. Здесь видны ответы и разборы. */

export const metadata: Metadata = {
  title: 'Галерея банка задания №6: прототип',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return PROTOTYPES.map((p) => ({ prototip: p.id }));
}

export const dynamicParams = false;

const ru = (x: number) => String(x).replace('.', ',').replace('-', '−');

function Zadacha({ item }: { item: BankItem }) {
  const p = PROTOTYPES.find((x) => x.id === item.prototypeId);
  if (!p) {
    return null;
  }
  const s = p.solve(item.params);
  const ris = p.ris(item.params);
  return (
    <li className="g6__item" id={item.id}>
      <div className="g6__meta">
        <span className="g6__id">
          {item.source === 'analog' ? item.id : `${item.id} · ${item.gde}`}
        </span>
        <span className={item.source === 'analog' ? 'g6__badge' : 'g6__badge g6__badge--istochnik'}>
          {podpisIstochnika(item)}
        </span>
        {item.stil === 'syuzhet' && item.tema ? (
          <span className="g6__badge g6__badge--syuzhet">
            сюжет: {NAZVANIYA_TEM[item.tema]} — {item.plot}
          </span>
        ) : null}
        <span className="g6__otvet">
          Ответ: <b>{ru(item.answer)}</b>
        </span>
      </div>
      <div className="g6__uslovie">
        <Uslovie6
          u={{
            text: item.text,
            ...(ris ? { ris } : {}),
            ...(item.posle ? { posle: item.posle } : {}),
          }}
        />
      </div>
      <details className="g6__razbor">
        <summary>Разбор и подсказки</summary>
        <Razbor6 s={s} podskazki />
      </details>
    </li>
  );
}

export default async function GalereyaPrototipa6({
  params,
}: {
  params: Promise<{ prototip: string }>;
}) {
  const { prototip } = await params;
  const p = PROTOTYPES.find((x) => x.id === prototip);
  if (p === undefined) {
    notFound();
  }
  const { istochniki, analogi } = zadachiPrototipa(p.id);
  const otvety = new Map<number, number>();
  analogi.forEach((a) => otvety.set(a.answer, (otvety.get(a.answer) ?? 0) + 1));
  const iskl = ISKLYUCHENIYA[p.id];
  const pr = pravila(p.id);
  const i = PROTOTYPES.indexOf(p);
  const prev = PROTOTYPES[i - 1];
  const next = PROTOTYPES[i + 1];
  return (
    <main className="g6">
      <nav className="g6__toc" aria-label="Навигация">
        <a href="../">← Все прототипы</a>
        {prev ? <a href={`../${prev.id}/`}>← {kodNaSayte(prev.id)}</a> : null}
        {next ? <a href={`../${next.id}/`}>{kodNaSayte(next.id)} →</a> : null}
      </nav>
      <section className="g6__section">
        <h1 className="t-h2">
          {kodNaSayte(p.id)}. <Tex text={p.title} />{' '}
          <span className="g6__group">группа {p.group}</span>
        </h1>
        <p className="g6__formula">
          <Tex text={p.formula} />. Исходные задачи: {p.istochnik}.
        </p>
        <p className="g6__stat">
          Аналогов {analogi.length} (в стиле ФИПИ {analogi.filter((a) => a.stil === 'fipi').length},
          сюжетных {analogi.filter((a) => a.stil === 'syuzhet').length}), разных ответов{' '}
          {otvety.size} (нужно ≥ {pr.minRaznyh}), чаще всего ответ встречается{' '}
          {Math.max(0, ...otvety.values())} раза (можно ≤ {pr.maxPovtor}).
          {iskl ? (
            <b className="g6__iskl">
              {' '}
              Исключение: <Tex text={iskl.prichina} />.
            </b>
          ) : null}
        </p>
        <p className="g6__stat">
          Ответы аналогов:{' '}
          {[...otvety.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([o, k]) => `${ru(o)}${k > 1 ? ` ×${k}` : ''}`)
            .join('; ')}
        </p>
        <h2 className="g6__sub">Исходные задачи</h2>
        <ol className="g6__list">
          {istochniki.map((z) => (
            <Zadacha key={z.id} item={z} />
          ))}
        </ol>
        <h2 className="g6__sub">Аналоги в стиле ФИПИ</h2>
        <ol className="g6__list">
          {analogi
            .filter((a) => a.stil === 'fipi')
            .map((z) => (
              <Zadacha key={z.id} item={z} />
            ))}
        </ol>
        <h2 className="g6__sub">Сюжетные аналоги</h2>
        <ol className="g6__list">
          {analogi
            .filter((a) => a.stil === 'syuzhet')
            .map((z) => (
              <Zadacha key={z.id} item={z} />
            ))}
        </ol>
      </section>
    </main>
  );
}
