import type { Metadata } from 'next';
import { Risunok } from '@/components/tasks/vektory/Risunok';
import { BANK } from '@/lib/vektory/bank';
import { generate } from '@/lib/vektory/generate';
import { OBRAZTSY } from '@/lib/vektory/obraztsy';
import { PROTOTYPES } from '@/lib/vektory/prototypes';
import { emptyReport, renderVectorPlane } from '@/lib/vektory/render';
import type { Risunok as RisunokConfig } from '@/lib/vektory/types';
import '@/lib/vektory/vektory.css';
import './vektory-2.css';

/* Служебная витрина движка рисунков задания №2.

   Все режимы движка на образцах из lib/vektory/obraztsy.ts, тот же
   рисунок в полосе шириной с телефон и острия наконечников с
   увеличением — для проверки глазами, что остриё стоит в узле.
   В меню страницы нет, поисковикам она закрыта. */

export const metadata: Metadata = {
  title: 'Рисунки задания №2 — витрина движка',
  robots: { index: false, follow: false },
};

/* Тот же SVG, но окно просмотра — квадрат вокруг точки: увеличение
   без растра, штрихи и подписи остаются векторными. */
function crop(svg: string, cx: number, cy: number, half: number, size: number): string {
  return svg
    .replace(/viewBox="[^"]*"/, `viewBox="${cx - half} ${cy - half} ${half * 2} ${half * 2}"`)
    .replace(/ width="[^"]*" height="[^"]*"/, ` width="${size}" height="${size}"`);
}

function Tips({ config }: { config: RisunokConfig }) {
  const report = emptyReport();
  const svg = renderVectorPlane(config, report);
  return (
    <div className="v2__tips">
      <figure className="v2__tip">
        <span
          className="v2__tip-svg"
          dangerouslySetInnerHTML={{
            __html: crop(svg, report.axes.tipX - 6, report.axes.x, 24, 192),
          }}
        />
        <figcaption className="t-sm">конец оси x, ×4</figcaption>
      </figure>
      <figure className="v2__tip">
        <span
          className="v2__tip-svg"
          dangerouslySetInnerHTML={{
            __html: crop(svg, report.axes.y, report.axes.tipY + 6, 24, 192),
          }}
        />
        <figcaption className="t-sm">конец оси y, ×4</figcaption>
      </figure>
      {report.vectors.map((v) => (
        <figure className="v2__tip" key={v.name}>
          <span
            className="v2__tip-svg"
            dangerouslySetInnerHTML={{ __html: crop(svg, v.tip.x, v.tip.y, 24, 192) }}
          />
          <figcaption className="t-sm">
            остриё {v.name} → ({v.to[0]}; {v.to[1]}), ×4
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export default function VektoryShowcasePage() {
  const telefon = OBRAZTSY.find((o) => o.id === 'tri') ?? OBRAZTSY[0]!;
  const tesno = OBRAZTSY.find((o) => o.id === 'tesno') ?? OBRAZTSY[0]!;
  return (
    <main className="v2">
      <header className="v2__head">
        <h1 className="t-h1">Рисунки задания №2</h1>
        <p className="v2__lead">
          Витрина движка lib/vektory: {OBRAZTSY.length} образцов — сетка, режим подсказки, режим без
          сетки, окно по векторам. Ниже — полоса шириной с телефон и острия с увеличением. Те же
          образцы в ч/б теме печати — на странице <a href="pechat/">pechat/</a>.
        </p>
      </header>

      <section className="v2__section" id="obraztsy">
        <div className="v2__grid">
          {OBRAZTSY.map((o) => (
            <figure className="v2__card" key={o.id} id={o.id}>
              <Risunok config={o.config} />
              <figcaption className="t-sm">
                {o.id} · {o.title}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="v2__section" id="zadachi">
        <h2 className="t-h2">Рисунки задач банка</h2>
        <p className="v2__lead">
          Первые два варианта банка каждого прототипа с рисунком: слева рисунок задачи, справа он же
          в режиме подсказки, как в разборе. Ответы не выводятся.
        </p>
        {PROTOTYPES.filter((p) => p.format === 'grid' || p.format === 'nogrid').map((p) => {
          const entry = BANK.find((e) => e.prototype === p.id);
          const variants = entry === undefined ? [] : entry.variants.slice(0, 2);
          return (
            <div key={p.id} id={`zadachi-${p.id}`}>
              <h3 className="t-h3">{p.id}</h3>
              {variants.map((v) => {
                const task = generate(p.id, v.seed);
                if (task.risunok === null) return null;
                return (
                  <div className="v2__grid v2__zadacha" key={v.seed}>
                    <figure className="v2__card">
                      <Risunok config={task.risunok} />
                      <figcaption className="t-sm">
                        {v.seed} · {task.uslovie.replace(/\$[^$]*\$/g, '…')}
                      </figcaption>
                    </figure>
                    <figure className="v2__card">
                      <Risunok config={{ ...task.risunok, hints: true }} />
                      <figcaption className="t-sm">{v.seed} · режим подсказки</figcaption>
                    </figure>
                  </div>
                );
              })}
            </div>
          );
        })}
      </section>

      <section className="v2__section" id="telefon">
        <h2 className="t-h2">Ширина телефона</h2>
        <p className="v2__lead">
          Слева поле по умолчанию (15 × 13 клеток) в полосе 360 px, справа окно по векторам в той же
          полосе.
        </p>
        <div className="v2__phones">
          <div className="v2__phone">
            <Risunok config={telefon.config} />
          </div>
          <div className="v2__phone">
            <Risunok config={tesno.config} />
          </div>
        </div>
      </section>

      <section className="v2__section" id="ostriya">
        <h2 className="t-h2">Острия наконечников</h2>
        <p className="v2__lead">
          Квадрат 48 × 48 px вокруг концов осей и конца каждого вектора, увеличен в четыре раза:
          остриё вектора должно стоять в пересечении линий сетки, линия оси — кончаться у основания
          наконечника.
        </p>
        {OBRAZTSY.slice(0, 5).map((o) => (
          <div key={o.id}>
            <h3 className="t-h3">{o.id}</h3>
            <Tips config={o.config} />
          </div>
        ))}
      </section>
    </main>
  );
}
