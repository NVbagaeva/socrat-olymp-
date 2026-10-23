import type { ReactNode } from 'react';
import {
  Abzacy,
  RamkaFormula,
  RamkaOpredelenie,
  RamkaPrimer,
  RamkaVazhno,
  RamkaVyvod,
  type ShagPrimera,
} from '@/components/teoriya/Ramki';
import { TeoriyaShell } from '@/components/tasks/teoriya/TeoriyaShell';
import { Tex } from '@/components/ui/Tex';
import {
  RAZDELY_TEORII_7,
  TEORIYA_7_TEKSTY,
  type BlokTeorii7,
  type Kartochka7 as K7,
  type RazdelTeorii7,
} from '@/content/teoriya7';
import { PROGRESS_7 } from '@/content/zadanie7';
import { BANK } from '@/lib/zadanie7/bank/index';
import { prototype } from '@/lib/zadanie7/prototypes';
import type { BankItem } from '@/lib/zadanie7/types';
import { KartochkaTelo7 } from './KartochkaTelo7';
import { GdeNaEge7 } from './GdeNaEge7';
import { Irracionalnye7 } from './Irracionalnye7';
import { Razbor7 } from './Razbor7';
import { ZhivoyKrug7 } from './ZhivoyKrug7';

export { GdeNaEge7 };

const T = TEORIYA_7_TEKSTY;

/** Задача банка по id (F001, P10-a01). */
export function zadachaBanka7(id: string): BankItem {
  const z = BANK.find((b) => b.id === id);
  if (z === undefined) {
    throw new Error(`теория №7: нет задачи ${id}`);
  }
  return z;
}

function metka(z: BankItem): string {
  return z.source === 'fipi' ? `**${T.fipi}**` : `**${T.analog}**`;
}

/**
 * Разобранный пример в рамке «Пример»: условие и этапы решателя — тот
 * же разбор, что в тренажёре и на листе учителя. Подпись шага — без
 * «Шаг N.», номер даёт список рамки.
 */
export function PrimerIzBanka7({ title, zadacha }: { title: string; zadacha: string }) {
  const z = zadachaBanka7(zadacha);
  const s = prototype(z.prototypeId).solve(z.params);
  const shagi: ShagPrimera[] = s.etapy.map((e) => ({
    label: e.title.replace(/^Шаг \d+\.\s*/, ''),
    paras: e.lines,
  }));
  return <RamkaPrimer title={title} uslovie={`${metka(z)} ${z.text}`} shagi={shagi} />;
}

function Tablica({ head, rows, title }: { head: string[]; rows: string[][]; title?: string }) {
  return (
    <div className="z7-tablica">
      {title ? (
        <p className="z7-tablica__title">
          <Tex text={title} />
        </p>
      ) : null}
      <table>
        <thead>
          <tr>
            {head.map((h) => (
              <th scope="col" key={h}>
                <Tex text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join('|')}>
              {r.map((c, i) => (
                <td key={`${i}-${c}`}>
                  <Tex text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** «Пример» карточки: задача банка с разбором — раскрывается по нажатию. */
function PrimerKartochki({ zadacha }: { zadacha: string }) {
  const z = zadachaBanka7(zadacha);
  const s = prototype(z.prototypeId).solve(z.params);
  return (
    <details className="z7-primer">
      <summary className="z7-primer__summary">
        <span className="z7-primer__otkryt">{T.primerOtkryt}</span>
        <span className="z7-primer__zakryt">{T.primerZakryt}</span>
      </summary>
      <p className="z7-primer__uslovie">
        <Tex text={`${metka(z)} ${z.text}`} />
      </p>
      <Razbor7 s={s} />
    </details>
  );
}

/**
 * Карточка теории №7 — как в справочнике №1: заголовок, цветные блоки
 * «Определение / Свойство / Теорема / Важно», «Где на ЕГЭ» и кнопка
 * «Пример». bezPrimera — для печати шпаргалки.
 */
export function Kartochka7({
  k,
  trenazher,
  bezPrimera = false,
}: {
  k: K7;
  trenazher?: string;
  bezPrimera?: boolean;
}) {
  return (
    <KartochkaTelo7 k={k}>
      {trenazher ? <GdeNaEge7 prototipy={k.prototipy} trenazher={trenazher} /> : null}
      {k.primer && !bezPrimera ? <PrimerKartochki zadacha={k.primer} /> : null}
    </KartochkaTelo7>
  );
}

export function Blok7({
  b,
  trenazher,
  bezPrimerov = false,
}: {
  b: BlokTeorii7;
  trenazher?: string;
  bezPrimerov?: boolean;
}): ReactNode {
  switch (b.vid) {
    case 'opredelenie':
      return (
        <RamkaOpredelenie
          title={b.title ?? 'Определение'}
          {...(b.formula ? { formula: b.formula } : {})}
        >
          <Abzacy paras={b.paras} />
          {b.spisok ? (
            <ul className="z7-spisok">
              {b.spisok.map((s) => (
                <li key={s}>
                  <Tex text={s} />
                </li>
              ))}
            </ul>
          ) : null}
        </RamkaOpredelenie>
      );
    case 'formula':
      return <RamkaFormula formula={b.formula} {...(b.podpis ? { podpis: b.podpis } : {})} />;
    case 'primer':
      return bezPrimerov ? null : <PrimerIzBanka7 title={b.title} zadacha={b.zadacha} />;
    case 'primerRuchnoy':
      return bezPrimerov ? null : (
        <RamkaPrimer
          title={b.title}
          {...(b.uslovie ? { uslovie: b.uslovie } : {})}
          shagi={b.shagi}
          {...(b.otvet ? { otvet: b.otvet } : {})}
        />
      );
    case 'vazhno':
      return (
        <RamkaVazhno title={b.title ?? 'Важно!'}>
          <Abzacy paras={b.paras} />
        </RamkaVazhno>
      );
    case 'vyvod':
      return (
        <RamkaVyvod title={b.title ?? 'Вывод'}>
          <Abzacy paras={b.paras} />
        </RamkaVyvod>
      );
    case 'tablica':
      return <Tablica head={b.head} rows={b.rows} {...(b.title ? { title: b.title } : {})} />;
    case 'lovushka':
      return (
        <RamkaVazhno title={b.title}>
          <p className="ramka__p z7-lovushka__oshibka">
            <Tex text={`**Ошибка.** ${b.oshibka}`} />
          </p>
          <p className="ramka__p">
            <Tex text={`**Правильно.** ${b.pravilno}`} />
          </p>
        </RamkaVazhno>
      );
    case 'irracionalnye':
      return <Irracionalnye7 {...(trenazher ? { trenazher } : {})} />;
    case 'krug':
      return bezPrimerov ? null : <ZhivoyKrug7 />;
    case 'kartochki':
      return (
        <div className="z7-kartochki">
          {b.kartochki.map((k) => (
            <Kartochka7
              k={k}
              key={k.id}
              {...(trenazher ? { trenazher } : {})}
              bezPrimera={bezPrimerov}
            />
          ))}
        </div>
      );
    default:
      return null;
  }
}

function Telo({ r, trenazher }: { r: RazdelTeorii7; trenazher: string }) {
  return (
    <div className="z7-teoriya">
      <p className="z7-teoriya__lead">
        <Tex text={r.lead} />
      </p>
      {r.bloki.map((b, i) => (
        <Blok7 b={b} trenazher={trenazher} key={`${r.id}-${i}`} />
      ))}
    </div>
  );
}

/**
 * Вкладка «Теория» задания №7: девять разделов подряд, содержание
 * рядом (оболочка теории №4/№10/№11). Разделы — в content/teoriya7.ts.
 */
export function Teoriya7({ vkladka, base }: { vkladka: string; base: string }) {
  const tela = Object.fromEntries(
    RAZDELY_TEORII_7.map((r) => [r.id, <Telo r={r} trenazher={`${base}/trenazher/`} key={r.id} />]),
  );
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={RAZDELY_TEORII_7.map((r) => ({ id: r.id, title: r.title }))}
      tela={tela}
      dekor={{
        kartinka: (
          <span className="z7-dekor">
            <Tex text="$\log_a b=c\iff a^c=b$" />
          </span>
        ),
        note: 'Тип → ОДЗ → переходы → корни → отбор → проверка',
      }}
      trackKey={PROGRESS_7.teoriyaKey}
    />
  );
}
