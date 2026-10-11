import type { Metadata } from 'next';
import { BANK } from '@/lib/proizvodnaya/bank';
import { generate } from '@/lib/proizvodnaya/generate';
import { klassFormy, otpechatokZadachi, slugPrototipa } from '@/lib/proizvodnaya/otpechatokRisunka';
import { PROTOTYPES } from '@/lib/proizvodnaya/prototypes';
import { renderFigura } from '@/lib/proizvodnaya/render';
import { ru } from '@/lib/proizvodnaya/tex';
import { typeset } from '@/lib/tex';
import { href } from '@/lib/paths';
import '../galereya.css';

/* Служебная галерея банка задания №9: все аналоги одного прототипа
   сеткой — рисунок ученика, под ним ответ, seed и класс формы кривой.
   Повтор рисунка (сдвиг или отражение того же графика) обведён. Сводка
   над сеткой — распределение ответов и число классов формы. */

export const metadata: Metadata = {
  title: 'Банк задания №9 — галерея рисунков прототипа',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return PROTOTYPES.map((p) => ({ prototip: slugPrototipa(p.id) }));
}

export default async function GalereyaPrototipa({
  params,
}: {
  params: Promise<{ prototip: string }>;
}) {
  const { prototip } = await params;
  const proto = PROTOTYPES.find((p) => slugPrototipa(p.id) === prototip);
  const entry = BANK.find((e) => e.prototype === proto?.id);
  if (proto === undefined || entry === undefined) {
    return <main className="g9">Нет такого прототипа.</main>;
  }
  const zadachi = entry.variants.map((v) => {
    const t = generate(proto.id, v.seed);
    return { n: v.n, seed: v.seed, t, otp: otpechatokZadachi(t), klass: klassFormy(t.risunok) };
  });
  const otvety = new Map<string, number>();
  const klassy = new Map<string, number>();
  const otpCount = new Map<string, number>();
  for (const z of zadachi) {
    otvety.set(ru(z.t.otvet), (otvety.get(ru(z.t.otvet)) ?? 0) + 1);
    klassy.set(z.klass, (klassy.get(z.klass) ?? 0) + 1);
    otpCount.set(z.otp, (otpCount.get(z.otp) ?? 0) + 1);
  }
  const raspredelenie = [...otvety.entries()]
    .sort((a, b) => Number(a[0].replace(',', '.')) - Number(b[0].replace(',', '.')))
    .map(([o, k]) => `${o} — ${k}`)
    .join('; ');
  return (
    <main className="g9">
      <nav className="g9__nav" aria-label="Прототипы">
        <a href={href('styleguide', 'zadanie-9')}>Все прототипы</a>
        {PROTOTYPES.map((p) => (
          <a
            key={p.id}
            href={href('styleguide', 'zadanie-9', slugPrototipa(p.id))}
            aria-current={p.id === proto.id ? 'page' : undefined}
          >
            {p.id}
          </a>
        ))}
      </nav>
      <h1 className="t-h2">
        {proto.id}. <span dangerouslySetInnerHTML={{ __html: typeset(proto.nazvanie) }} />
      </h1>
      <p className="g9__stat">
        Аналогов: {zadachi.length}. Различных ответов: {otvety.size} ({raspredelenie}). Классов
        формы кривой: {klassy.size}. Повторов рисунка:{' '}
        {[...otpCount.values()].filter((k) => k > 1).length}.
      </p>
      <p
        className="g9__stat"
        dangerouslySetInnerHTML={{ __html: typeset(zadachi[0]?.t.uslovie ?? '') }}
      />
      <div className="g9__grid">
        {zadachi.map((z) => (
          <figure
            key={z.seed}
            className={(otpCount.get(z.otp) ?? 0) > 1 ? 'g9__card is-povtor' : 'g9__card'}
          >
            {z.t.risunok === null ? (
              <p dangerouslySetInnerHTML={{ __html: typeset(z.t.uslovie) }} />
            ) : (
              <span
                dangerouslySetInnerHTML={{
                  __html: renderFigura(z.t.risunok, { rezhim: 'student' }),
                }}
              />
            )}
            <figcaption>
              №{z.n} · ответ <b>{ru(z.t.otvet)}</b> · {z.seed} · {z.klass}
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
