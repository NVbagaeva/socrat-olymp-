import { TeoriyaShell } from '@/components/tasks/teoriya/TeoriyaShell';
import { Callout, Details } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { tex } from '@/lib/baza/chisla';
import type { BlokTeorii, RazdelTeorii } from '@/lib/baza/types';
import { katex } from '@/lib/graph/katex';

function Krupno({ formula }: { formula: string }) {
  const html = katex.renderToString(formula, { throwOnError: true, displayMode: true });
  return <div className="baza-formula" dangerouslySetInnerHTML={{ __html: html }} />;
}

function Blok({ blok }: { blok: BlokTeorii }) {
  switch (blok.vid) {
    case 'tekst':
      return (
        <p>
          <Tex text={blok.text} />
        </p>
      );
    case 'formula':
      return <Krupno formula={blok.tex} />;
    case 'spisok':
      return (
        <ul className="baza-spisok">
          {blok.punkty.map((p) => (
            <li key={p}>
              <Tex text={p} />
            </li>
          ))}
        </ul>
      );
    case 'zapomni':
    case 'layfhak':
      return (
        <Callout tone={blok.vid}>
          <Tex text={blok.text} />
        </Callout>
      );
    case 'vazhno':
      return (
        <Callout tone="vazhno" primer={<Tex text={blok.primer} />}>
          <Tex text={blok.text} />
        </Callout>
      );
    case 'primer':
      return (
        <Details title="Пример с разбором" className="baza-primer">
          <p className="baza-primer__uslovie">
            <Tex text={blok.primer.uslovie} />
          </p>
          <ol className="baza-primer__shagi">
            {blok.primer.shagi.map((shag) => (
              <li key={shag}>
                <Tex text={shag} />
              </li>
            ))}
          </ol>
          <p className="baza-primer__otvet">
            Ответ: <Tex text={`$${tex(blok.primer.otvet)}$`} />
          </p>
        </Details>
      );
  }
}

/**
 * Вкладка «Теория» задания базы: общая оболочка теории (содержание,
 * липкая полоса, отметка «прочитано») и разделы из данных раздела —
 * текст, формулы, плашки и разобранные примеры.
 */
export function TeoriyaBazy({
  slug,
  vkladka,
  razdely,
}: {
  slug: string;
  vkladka: string;
  razdely: readonly RazdelTeorii[];
}) {
  const tela = Object.fromEntries(
    razdely.map((r) => [
      r.id,
      <div key={r.id} className="flow baza-teoriya">
        {r.bloki.map((blok, i) => (
          <Blok key={i} blok={blok} />
        ))}
      </div>,
    ]),
  );
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={razdely.map((r) => ({ id: r.id, title: r.title }))}
      tela={tela}
      trackKey={`baza-${slug}`}
    />
  );
}
