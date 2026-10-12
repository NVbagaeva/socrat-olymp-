import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Abzacy,
  RamkaFormula,
  RamkaOpredelenie,
  RamkaPrimer,
  RamkaVazhno,
  RamkaVyvod,
} from '@/components/teoriya/Ramki';
import { ProverSebya } from '@/components/teoriya/ProverSebya';
import { TeoriyaShell } from '@/components/tasks/veroyatnost/teoriya/TeoriyaShell';
import { Tex } from '@/components/ui/Tex';
import {
  RAZDELY_TEORII_6,
  TEORIYA_6_TEKSTY,
  type BlokTeorii6,
  type Kartochka6,
  type RazdelTeorii6,
} from '@/content/teoriya6';
import { PROGRESS_6 } from '@/content/zadanie6';
import { zadachiIzShablonov } from '@/lib/teoriya/proverka-server';
import { BANK } from '@/lib/zadanie6/bank/index';
import { NABORY_PROVERKI_6 } from '@/lib/zadanie6/proverka';
import { kodNaSayte, prototype } from '@/lib/zadanie6/prototypes';
import type { BankItem } from '@/lib/zadanie6/types';
import { KartochkaTelo6 } from './KartochkaTelo6';
import { Razbor6 } from './Razbor6';
import { Ris6 } from './Ris6';
import { Uslovie6 } from './Uslovie6';

const T = TEORIYA_6_TEKSTY;

/** Задача банка по id (S01, P10-a01). */
export function zadachaBanka6(id: string): BankItem {
  const z = BANK.find((b) => b.id === id);
  if (z === undefined) {
    throw new Error(`теория №6: нет задачи ${id}`);
  }
  return z;
}

function metka(z: BankItem): string {
  return z.source === 'fipi' ? T.fipi : z.source === 'demo' ? T.demo : T.analog;
}

/** Условие задачи банка с рисунком и пометкой источника. */
function UslovieZadachi({ z }: { z: BankItem }) {
  const ris = prototype(z.prototypeId).ris(z.params);
  return (
    <div className="z6-primer__uslovie">
      <p className="z6-primer__metka">{metka(z)}</p>
      <Uslovie6
        u={{ text: z.text, ...(ris ? { ris } : {}), ...(z.posle ? { posle: z.posle } : {}) }}
      />
    </div>
  );
}

/** Разобранный пример в рамке «Пример»: условие и разбор решателя — тот же, что в тренажёре. */
export function PrimerIzBanka6({ title, zadacha }: { title: string; zadacha: string }) {
  const z = zadachaBanka6(zadacha);
  const s = prototype(z.prototypeId).solve(z.params);
  return (
    <RamkaPrimer title={title} shagi={[]}>
      <UslovieZadachi z={z} />
      <Razbor6 s={s} />
    </RamkaPrimer>
  );
}

/** «Пример ▸» карточки: задача банка с разбором — раскрывается по нажатию. */
function PrimerKartochki({ zadacha }: { zadacha: string }) {
  const z = zadachaBanka6(zadacha);
  const s = prototype(z.prototypeId).solve(z.params);
  return (
    <details className="z6-primer">
      <summary className="z6-primer__summary">
        <span className="z6-primer__otkryt">{T.primerOtkryt}</span>
        <span className="z6-primer__zakryt">{T.primerZakryt}</span>
      </summary>
      <UslovieZadachi z={z} />
      <Razbor6 s={s} />
    </details>
  );
}

/** «Где на ЕГЭ»: прототипы карточки, по нажатию — тренажёр с ними. */
export function GdeNaEge6({ prototipy, trenazher }: { prototipy: string[]; trenazher: string }) {
  if (prototipy.length === 0) {
    return null;
  }
  return (
    <p className="z6-gde">
      <span className="z6-gde__label">{T.gdeNaEge}:</span>
      {prototipy.map((id) => (
        <Link className="z6-gde__chip" href={`${trenazher}?tipy=${id}`} key={id}>
          {kodNaSayte(id)} <Tex text={prototype(id).title} />
        </Link>
      ))}
    </p>
  );
}

export function Kartochka6View({
  k,
  trenazher,
  bezPrimera = false,
}: {
  k: Kartochka6;
  trenazher?: string;
  bezPrimera?: boolean;
}) {
  return (
    <KartochkaTelo6 k={k}>
      {trenazher ? <GdeNaEge6 prototipy={k.prototipy} trenazher={trenazher} /> : null}
      {k.primer && !bezPrimera ? <PrimerKartochki zadacha={k.primer} /> : null}
    </KartochkaTelo6>
  );
}

function Tablica({ head, rows, title }: { head: string[]; rows: string[][]; title?: string }) {
  return (
    <div className="z6-tablica-teorii">
      {title ? (
        <p className="z6-tablica-teorii__title">
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

export function Blok6({
  b,
  trenazher,
  bezPrimerov = false,
}: {
  b: BlokTeorii6;
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
            <ul className="z6-spisok">
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
      return bezPrimerov ? null : <PrimerIzBanka6 title={b.title} zadacha={b.zadacha} />;
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
    case 'ris':
      return (
        <figure className="z6-ris-teorii">
          <Ris6 ris={b.ris} />
          {b.podpis ? (
            <figcaption className="z6-ris-teorii__podpis">
              <Tex text={b.podpis} />
            </figcaption>
          ) : null}
        </figure>
      );
    case 'tablica':
      return <Tablica head={b.head} rows={b.rows} {...(b.title ? { title: b.title } : {})} />;
    case 'lovushka':
      return (
        <RamkaVazhno title={b.title}>
          <p className="ramka__p z6-lovushka__oshibka">
            <Tex text={`**Ошибка.** ${b.oshibka}`} />
          </p>
          <p className="ramka__p">
            <Tex text={`**Правильно.** ${b.pravilno}`} />
          </p>
        </RamkaVazhno>
      );
    case 'kartochki':
      return (
        <div className="z6-kartochki">
          {b.kartochki.map((k) => (
            <Kartochka6View
              k={k}
              key={k.id}
              {...(trenazher ? { trenazher } : {})}
              bezPrimera={bezPrimerov}
            />
          ))}
        </div>
      );
    case 'proverka': {
      const shablony = NABORY_PROVERKI_6[b.nabor];
      return bezPrimerov || !shablony ? null : (
        <ProverSebya klyuch={`z6:${b.nabor}`} zadachi={zadachiIzShablonov(shablony)} />
      );
    }
    default:
      return null;
  }
}

function Telo({ r, trenazher }: { r: RazdelTeorii6; trenazher: string }) {
  return (
    <div className="z6-teoriya">
      <p className="z6-teoriya__lead">
        <Tex text={r.lead} />
      </p>
      {r.bloki.map((b, i) => (
        <Blok6 b={b} trenazher={trenazher} key={`${r.id}-${i}`} />
      ))}
    </div>
  );
}

/**
 * Вкладка «Теория» задания №6: девять разделов подряд, содержание
 * рядом (оболочка теории №4/№7/№10). Разделы — в content/teoriya6.ts.
 */
export function Teoriya6({ vkladka, base }: { vkladka: string; base: string }) {
  const tela = Object.fromEntries(
    RAZDELY_TEORII_6.map((r) => [r.id, <Telo r={r} trenazher={`${base}/trenazher/`} key={r.id} />]),
  );
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={RAZDELY_TEORII_6.map((r) => ({ id: r.id, title: r.title }))}
      tela={tela}
      dekor={{
        kartinka: (
          <span className="z6-dekor">
            <Tex text="$E(X)=\sum x_ip_i$" />
          </span>
        ),
        note: 'Распределение → ожидание → дисперсия → оценка',
      }}
      trackKey={PROGRESS_6.teoriyaKey}
      podZagolovkom={
        <p className="z6-shpargalka-ssylka">
          <Link href={`${base}/shpargalka/`}>{T.shpargalka}</Link> — все формулы раздела на листе
          A4.
        </p>
      }
    />
  );
}
