import type { Metadata } from 'next';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Solid } from '@/components/solid/Solid';
import { CHECKLIST_TITLES, checkDrawing, type CheckRow } from '@/lib/solid/checklist';
import {
  PROTOTYPE_DRAWINGS,
  SHEETS,
  STEP_VARIANTS,
  THUMBS,
  drawingCount,
} from '@/lib/solid/drawings';
import type { Model } from '@/lib/solid';
import '@/lib/solid/solid.css';
import './bank.css';

/* Служебная витрина банка чертежей задания №3: 91 прототип,
   варианты прототипов с числами на чертеже, 14 шпаргалок и
   8 миниатюр разделов, плюс таблица чек-листа из 12 пунктов.
   В меню страница не входит и не индексируется. */

export const metadata: Metadata = {
  title: 'Банк чертежей №3 — витрина',
  robots: { index: false, follow: false },
};

interface Prototype {
  id: string;
  razdel: string;
  razdel_nazvanie: string;
  nazvanie: string;
  obrazec: string;
}

const SOURCE = path.join(
  process.cwd(),
  '..',
  'content-source',
  'stereometria',
  'prototipy-91.json',
);

const prototypes: Prototype[] = (
  JSON.parse(readFileSync(SOURCE, 'utf8')) as { prototipy: Prototype[] }
).prototipy;

const sections = [...new Set(prototypes.map((item) => item.razdel))];

function conditionOf(id: string): string | null {
  return prototypes.find((item) => item.id === id)?.obrazec ?? null;
}

interface CardProps {
  id: string;
  name: string;
  condition: string | null;
  model: Model;
}

function Card({ id, name, condition, model }: CardProps) {
  return (
    <article className="bank__card" id={id.replace(/\s/g, '-')}>
      <p className="bank__id">{id}</p>
      <p className="bank__name">{name}</p>
      {condition === null ? null : <p className="bank__cond">{condition}</p>}
      <div className="bank__fig">
        <Solid model={model} />
      </div>
      <p className="bank__alt">{model.alt}</p>
    </article>
  );
}

/* Чек-лист считается на сборке по тем же моделям, что на странице. */
const rows: CheckRow[] = [
  ...Object.entries(PROTOTYPE_DRAWINGS).map(([id, model]) =>
    checkDrawing(id, model, conditionOf(id)),
  ),
  ...STEP_VARIANTS.map((item) =>
    checkDrawing(`${item.id} в${item.variant}`, item.model, conditionOf(item.id)),
  ),
  ...Object.entries(SHEETS).map(([id, model]) => checkDrawing(id, model, null)),
  ...Object.entries(THUMBS).map(([id, model]) => checkDrawing(id, model, null)),
];

const broken = rows.filter((row) => !row.points.every(Boolean));

export default function BankPage() {
  return (
    <main className="bank">
      <header>
        <h1 className="t-h1">Банк чертежей задания №3</h1>
        <p className="bank__lead">
          Все чертежи раздела, построенные движком solid/ из трёхмерных моделей: прототипы по
          разделам задачника, варианты тех прототипов, где числа стоят на самом чертеже, шпаргалки
          «Что нужно помнить» и миниатюры разделов. Условия — из prototipy-91.json, дословно.
        </p>
        <ul className="bank__counts">
          <li>
            <b>{Object.keys(PROTOTYPE_DRAWINGS).length}</b> прототипов
          </li>
          <li>
            <b>{STEP_VARIANTS.length}</b> вариантов с числами на чертеже
          </li>
          <li>
            <b>{Object.keys(SHEETS).length}</b> шпаргалок
          </li>
          <li>
            <b>{Object.keys(THUMBS).length}</b> миниатюр
          </li>
          <li>
            <b>{drawingCount()}</b> чертежей всего
          </li>
        </ul>
      </header>

      {sections.map((section) => {
        const items = prototypes.filter((item) => item.razdel === section);
        const first = items[0];
        return (
          <section className="bank__section" key={section} id={`razdel-${section}`}>
            <h2 className="t-h2 bank__section-title">
              {section}. {first?.razdel_nazvanie ?? ''}
            </h2>
            <div className="bank__grid">
              {items.map((item) => {
                const model = PROTOTYPE_DRAWINGS[item.id];
                return model === undefined ? null : (
                  <Card
                    key={item.id}
                    id={item.id}
                    name={item.nazvanie}
                    condition={item.obrazec}
                    model={model}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="bank__section" id="varianty">
        <h2 className="t-h2 bank__section-title">Варианты с числами на чертеже</h2>
        <div className="bank__grid">
          {STEP_VARIANTS.map((item) => (
            <Card
              key={`${item.id}-${item.variant}`}
              id={`${item.id} · вариант ${item.variant}`}
              name={prototypes.find((p) => p.id === item.id)?.nazvanie ?? ''}
              condition={null}
              model={item.model}
            />
          ))}
        </div>
      </section>

      <section className="bank__section" id="shpargalki">
        <h2 className="t-h2 bank__section-title">Шпаргалки «Что нужно помнить»</h2>
        <div className="bank__grid">
          {Object.entries(SHEETS).map(([id, model]) => (
            <Card key={id} id={id} name="Шпаргалка раздела" condition={null} model={model} />
          ))}
        </div>
      </section>

      <section className="bank__section" id="miniatyury">
        <h2 className="t-h2 bank__section-title">Миниатюры разделов</h2>
        <div className="bank__grid">
          {Object.entries(THUMBS).map(([id, model]) => (
            <Card key={id} id={id} name="Миниатюра раздела" condition={null} model={model} />
          ))}
        </div>
      </section>

      <section className="bank__section" id="chek-list">
        <h2 className="t-h2 bank__section-title">Чек-лист: {rows.length} чертежей</h2>
        <p className="bank__lead">
          Проверка считается на сборке по тем же моделям: движок отдаёт сцену в пикселях, проверка
          мерит зазоры. Нарушений: <b>{broken.length}</b>.
        </p>
        <ol className="bank__legend">
          {CHECKLIST_TITLES.map((title, index) => (
            <li key={title}>
              {index + 1}. {title}
            </li>
          ))}
        </ol>
        <div className="bank__table-wrap">
          <table className="bank__table">
            <thead>
              <tr>
                <th>id</th>
                <th>фигура</th>
                {CHECKLIST_TITLES.map((title, index) => (
                  <th key={title} title={title}>
                    {index + 1}
                  </th>
                ))}
                <th>что не так</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.figure}</td>
                  {row.points.map((value, index) => (
                    <td className={value ? 'yes' : 'no'} key={index}>
                      {value ? 'да' : 'НЕТ'}
                    </td>
                  ))}
                  <td>{row.notes.join('; ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
