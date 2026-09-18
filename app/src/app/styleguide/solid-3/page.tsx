import type { Metadata } from 'next';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Solid } from '@/components/solid/Solid';
import { CATALOG, type CatalogEntry } from '@/lib/solid';
import '@/lib/solid/solid.css';
import './solid-3.css';

/* Служебная витрина движка стереометрических чертежей (задание №3).

   Каждая из 45 базовых фигур старого каталога построена движком заново;
   рядом — старый чертёж из content-source, подписанный «старый», только
   для сравнения глазами. Старые файлы читаются на сборке и на сайт
   отдельно не попадают; в меню страницы нет. */

export const metadata: Metadata = {
  title: 'Чертежи стереометрии — витрина движка',
  robots: { index: false, follow: false },
};

const OLD_DIR = path.join(
  process.cwd(),
  '..',
  'content-source',
  'stereometria',
  'chertezhi',
  'generator',
);

function oldDrawing(entry: CatalogEntry): string {
  try {
    return readFileSync(path.join(OLD_DIR, entry.folder, `${entry.name}.svg`), 'utf8');
  } catch {
    return '';
  }
}

const FOLDERS: { id: CatalogEntry['folder']; title: string }[] = [
  { id: 'prizmy', title: 'Призмы' },
  { id: 'piramidy', title: 'Пирамиды' },
  { id: 'tela_vrashcheniya', title: 'Тела вращения' },
  { id: 'kombinacii', title: 'Комбинации тел' },
];

export default function SolidShowcasePage() {
  return (
    <main className="s3">
      <header className="s3__head">
        <h1 className="t-h1">Чертежи стереометрии</h1>
        <p className="s3__lead">
          Витрина движка solid/: {CATALOG.length} базовых фигур каталога, построенных из трёхмерной
          модели. Слева — новый чертёж, справа — старый, для сравнения.
        </p>
      </header>

      {FOLDERS.map((folder) => (
        <section className="s3__section" key={folder.id} id={folder.id}>
          <h2 className="t-h2 s3__section-title">{folder.title}</h2>
          <div className="s3__grid">
            {CATALOG.filter((entry) => entry.folder === folder.id).map((entry) => {
              const model = entry.build();
              const old = oldDrawing(entry);
              return (
                <article className="s3__card" key={entry.name} id={entry.name}>
                  <h3 className="s3__card-title">
                    {entry.title}
                    <span className="s3__card-id">
                      {entry.folder}/{entry.name}
                    </span>
                  </h3>
                  <div className="s3__pair">
                    <div className="s3__new">
                      <Solid model={model} />
                    </div>
                    <div className="s3__old">
                      <span className="s3__badge">старый</span>
                      {old ? <div dangerouslySetInnerHTML={{ __html: old }} /> : null}
                    </div>
                  </div>
                  <p className="s3__alt">{model.alt}</p>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
