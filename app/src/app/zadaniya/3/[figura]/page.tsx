import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SheetBlock } from '@/components/tasks/SheetBlock';
import { theoryBlocks } from '@/content/stereometria';
import { SHPARGALKI } from '@/content/shpargalki';
import { assertSheetsOk, renderFormulas, renderVykladki } from '@/lib/zadanie3/formulas';
import { RAZDELY, razdelBySlug } from '@/lib/zadanie3';
import '@/components/tasks/veroyatnost/vykladka.css';
import './teoriya.css';

export function generateStaticParams() {
  return RAZDELY.map((razdel) => ({ figura: razdel.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ figura: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const razdel = razdelBySlug((await params).figura);
  return razdel === undefined
    ? {}
    : { title: `${razdel.nazvanie}. Теория — задание №3 — Будет на ЕГЭ` };
}

/* Формулы всех восьми шпаргалок проверяются на сборке: кривая запись
   уронит сборку здесь, а не покажется ученику красной строкой. */
assertSheetsOk();

/** Якорь раздела теории в разметке. */
function blockId(id: string): string {
  return `theory-${id}`;
}

/**
 * Вкладка «Теория».
 *
 * Первый раздел — «Что нужно помнить», авторская шпаргалка из
 * домашней работы, перенесённая дословно, с чертежами движка.
 * Остальные пять ждут текста автора и до него честно пусты:
 * ни одного придуманного слова здесь нет и быть не должно.
 */
export default async function TeoriyaTab({ params }: { params: Params }) {
  const razdel = razdelBySlug((await params).figura);
  if (razdel === undefined) {
    notFound();
  }

  const sheet = SHPARGALKI[razdel.nomer] ?? [];
  const formulas = renderFormulas(sheet);
  const vykladki = renderVykladki(sheet);
  /* Готов тот раздел, у которого есть содержимое. Счётчик считается
     по этому признаку, а не записан числом. */
  const ready = theoryBlocks.filter((block) => block.id === 'pomnit' && sheet.length > 0).length;

  return (
    <div className="teoriya">
      <aside className="teoriya__side">
        <p className="teoriya__side-title">Содержание темы</p>
        <ol className="contents-list">
          {theoryBlocks.map((block, index) => (
            <li key={block.id}>
              {/* Оглавление — ссылки на якоря: работает без сценариев,
                  адрес раздела можно отправить. */}
              <a className="contents-item" href={`#${blockId(block.id)}`}>
                <span className="contents-item__no" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="contents-item__title">{block.title}</span>
              </a>
            </li>
          ))}
        </ol>
        <p className="teoriya__count">
          Готово <b>{ready}</b> из <b>{theoryBlocks.length}</b> разделов
        </p>
      </aside>

      <div className="theory teoriya__blocks">
        {theoryBlocks.map((block, index) => {
          const filled = block.id === 'pomnit' && sheet.length > 0;
          return (
            <section className="theory-block" id={blockId(block.id)} key={block.id}>
              <h2 className="t-h3 theory-block__title">
                <span className="theory-block__no" aria-hidden="true">
                  {index + 1}
                </span>
                {block.title}
              </h2>
              {filled ? (
                <SheetBlock items={sheet} formulas={formulas} vykladki={vykladki} />
              ) : (
                <p className="theory-block__soon">
                  Материал готовится. Текст этого раздела напишет автор — придуманного здесь не
                  будет.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
