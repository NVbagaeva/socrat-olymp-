import { TeoriyaShell } from '@/components/tasks/teoriya/TeoriyaShell';
import '@/components/tasks/teoriya/teoriya-steklo.css';
import {
  Abzacy,
  RamkaFormula,
  RamkaLayfhak,
  RamkaOpredelenie,
  RamkaVazhno,
  RamkaVyvod,
} from '@/components/teoriya/Ramki';
import { ProverSebya } from '@/components/teoriya/ProverSebya';
import { Callout, Details } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { tex } from '@/lib/baza/chisla';
import type { BlokTeorii, RazdelTeorii } from '@/lib/baza/types';
import { katex } from '@/lib/graph/katex';
import { NABORY_PROVERKI_BAZY } from '@/lib/baza/proverka-teorii';
import { zadachiIzShablonov } from '@/lib/teoriya/proverka-server';
import { renderPlan } from '@/lib/planimetriya/render';
import { chertezhTemy } from '@/lib/planimetriya/spravochnik-chertezhi';
import {
  PrimerRaskryt,
  RamkaSluchay,
  SkhemaRazvilka,
  TablicaBazy,
  ZadachaVRamke,
} from './RamkiBazy';

/** Блоки рамок сайта: раздел с ними рисуется в «стеклянном» слое .teor-steklo. */
const RAMKI: ReadonlySet<BlokTeorii['vid']> = new Set([
  'podpunkt',
  'opredelenie',
  'glavnaya',
  'razvilka',
  'sluchay',
  'razbor',
  'vazhnoZadacha',
  'vyvodZadacha',
  'layfhakZadacha',
  'tablica',
  'proverka',
]);

/**
 * Тема рамки «Важно!» / «Вывод» / «Лайфхак» — под подписью рамки:
 * подпись Ramki.tsx — обычный текст, а в теме бывают формулы.
 */
function Podtitul({ title }: { title: string | undefined }) {
  return title === undefined ? null : (
    <p className="ramka__p baza-podtitul">
      <Tex text={title} />
    </p>
  );
}

function Krupno({ formula }: { formula: string }) {
  const html = katex.renderToString(formula, { throwOnError: true, displayMode: true });
  return <div className="baza-formula" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Чертёж темы: тот же, что у карточки с этой темой, — строится на сборке. */
function Chertezh({ tema, podpis }: { tema: string; podpis?: string }) {
  const ch = chertezhTemy(tema);
  const risunki = Array.isArray(ch) ? ch : [ch];
  const svg = risunki
    .map(
      (r) =>
        `<span class="pl-wrap">${renderPlan(r.scena, { ...r.optsii, shirina: 260, vysota: 170 })}</span>`,
    )
    .join('');
  return (
    <figure className="baza-chertezh">
      <div className="baza-chertezh__ris" dangerouslySetInnerHTML={{ __html: svg }} />
      {podpis === undefined ? null : (
        <figcaption>
          <Tex text={podpis} />
        </figcaption>
      )}
    </figure>
  );
}

function Blok({ blok }: { blok: BlokTeorii }) {
  switch (blok.vid) {
    case 'podpunkt':
      return (
        <h4 className="baza-podpunkt" id={blok.id}>
          <Tex text={blok.title} zagolovok />
        </h4>
      );
    case 'opredelenie':
      return (
        <RamkaOpredelenie
          {...(blok.title === undefined ? {} : { title: blok.title })}
          {...(blok.formula === undefined ? {} : { formula: blok.formula })}
        >
          <Abzacy paras={blok.paras} />
          {blok.spisok === undefined ? null : (
            <ul className="baza-spisok">
              {blok.spisok.map((p) => (
                <li key={p}>
                  <Tex text={p} />
                </li>
              ))}
            </ul>
          )}
          {blok.algoritm === undefined ? null : (
            <ol className="ramka__algoritm">
              {blok.algoritm.map((p) => (
                <li key={p}>
                  <Tex text={p} />
                </li>
              ))}
            </ol>
          )}
          {blok.ssylka === undefined ? null : (
            <p className="ramka__p">
              <a className="baza-ssylka" href={blok.ssylka.href}>
                {blok.ssylka.text}
              </a>
            </p>
          )}
        </RamkaOpredelenie>
      );
    case 'glavnaya':
      return (
        <RamkaFormula
          formula={blok.formula}
          {...(blok.podpis === undefined ? {} : { podpis: blok.podpis })}
        />
      );
    case 'razvilka':
      return (
        <SkhemaRazvilka
          {...(blok.title === undefined ? {} : { title: blok.title })}
          razvilka={blok.razvilka}
        />
      );
    case 'sluchay':
      return <RamkaSluchay b={blok} />;
    case 'razbor':
      return <PrimerRaskryt razbor={blok.razbor} />;
    case 'vazhnoZadacha':
      return (
        <RamkaVazhno>
          <Podtitul title={blok.title} />
          <Abzacy paras={blok.paras} />
          <ZadachaVRamke razbor={blok.razbor} />
        </RamkaVazhno>
      );
    case 'vyvodZadacha':
      return (
        <RamkaVyvod>
          <Podtitul title={blok.title} />
          <Abzacy paras={blok.paras} />
          <ZadachaVRamke razbor={blok.razbor} />
        </RamkaVyvod>
      );
    case 'layfhakZadacha':
      return (
        <RamkaLayfhak>
          <Podtitul title={blok.title} />
          <Abzacy paras={blok.paras} />
          {blok.formula === undefined ? null : <Krupno formula={blok.formula} />}
          <ZadachaVRamke razbor={blok.razbor} />
        </RamkaLayfhak>
      );
    case 'tablica':
      return (
        <TablicaBazy
          {...(blok.title === undefined ? {} : { title: blok.title })}
          head={blok.head}
          rows={blok.rows}
        />
      );
    case 'proverka': {
      const shablony = NABORY_PROVERKI_BAZY[blok.nabor];
      if (shablony === undefined) throw new Error(`теория базы: нет набора ${blok.nabor}`);
      return <ProverSebya klyuch={`baza:${blok.nabor}`} zadachi={zadachiIzShablonov(shablony)} />;
    }
    case 'tekst':
      return (
        <p>
          <Tex text={blok.text} />
        </p>
      );
    case 'formula':
      return <Krupno formula={blok.tex} />;
    case 'chertezh':
      return (
        <Chertezh
          tema={blok.tema}
          {...(blok.podpis === undefined ? {} : { podpis: blok.podpis })}
        />
      );
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

/** Подпункты раздела для «Содержания» — заголовки-якоря блоков 'podpunkt'. */
function podpunkty(r: RazdelTeorii): { podpunkty?: { id: string; title: string }[] } {
  const spisok = r.bloki.flatMap((b) =>
    b.vid === 'podpunkt' ? [{ id: b.id, title: b.title }] : [],
  );
  return spisok.length === 0 ? {} : { podpunkty: spisok };
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
      <div
        key={r.id}
        className={
          r.bloki.some((b) => RAMKI.has(b.vid))
            ? 'flow baza-teoriya teor-steklo baza-teoriya--ramki'
            : 'flow baza-teoriya'
        }
      >
        {r.bloki.map((blok, i) => (
          <Blok key={i} blok={blok} />
        ))}
      </div>,
    ]),
  );
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={razdely.map((r) => ({ id: r.id, title: r.title, ...podpunkty(r) }))}
      tela={tela}
      trackKey={`baza-${slug}`}
    />
  );
}
