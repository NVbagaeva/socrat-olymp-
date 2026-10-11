import Link from 'next/link';
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
import { Tex } from '@/components/ui/Tex';
import { TeoriyaShell } from '@/components/tasks/veroyatnost/teoriya/TeoriyaShell';
import {
  FIZIKA_10,
  RAZDELY_TEORII_10,
  type BlokTeorii10,
  type RazdelTeorii10,
} from '@/content/teoriya10';
import { PROGRESS_10 } from '@/content/zadanie10';
import { BANK } from '@/lib/zadanie10/bank/index';
import { GROUPS, kodNaSayte, PROTOTYPES, prototype } from '@/lib/zadanie10/prototypes';
import { Illyustraciya10 } from './Illyustraciya10';
import { Most10 } from './Most10';
import { ZhivoyMyach, ZhivoyRaspad } from './Zhivye10';

/** Задача банка по id (F001, P11-a02). */
function zadachaBanka(id: string) {
  const z = BANK.find((b) => b.id === id);
  if (z === undefined) {
    throw new Error(`теория №10: нет задачи ${id}`);
  }
  return z;
}

/**
 * Разобранный пример из банка: условие и шаги решателя — тот же
 * разбор, что в тренажёре и на листе учителя. Подпись шага —
 * без «Шаг N.», номер даёт список рамки.
 */
export function PrimerIzBanka({ title, zadacha }: { title: string; zadacha: string }) {
  const z = zadachaBanka(zadacha);
  const s = prototype(z.prototypeId).solve(z.params);
  const shagi: ShagPrimera[] = s.etapy.map((e) => ({
    label: e.title.replace(/^Шаг \d+\.\s*/, ''),
    paras: e.lines,
  }));
  return (
    <RamkaPrimer
      title={title}
      uslovie={`${z.source === 'fipi' ? `**Задача ФИПИ.** ` : '**Не из открытого банка.** '}${z.text}`}
      shagi={shagi}
    >
      {z.prototypeId === 'P01' ? <Most10 params={z.params} rezhim="uchitel" /> : null}
    </RamkaPrimer>
  );
}

function Tablica({ head, rows, title }: { head: string[]; rows: string[][]; title?: string }) {
  return (
    <div className="z10-tablica">
      {title ? <p className="z10-tablica__title">{title}</p> : null}
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

/** «Физика в двух словах»: карточка на каждый сюжет, по группам. */
function FizikaKarty() {
  return (
    <div className="z10-fizika">
      {GROUPS.map((g) => (
        <section key={g.id} className="z10-fizika__gruppa">
          <h4 className="z10-fizika__title">
            Группа {g.id}. {g.title}
          </h4>
          <div className="z10-fizika__setka">
            {PROTOTYPES.filter((p) => p.group === g.id).map((p) => {
              const z = BANK.find((b) => b.prototypeId === p.id);
              const dano = z ? prototype(p.id).solve(z.params).dano : [];
              return (
                <article className="z10-fizika__karta" key={p.id} id={`fizika-${p.id}`}>
                  <Illyustraciya10 id={p.id} className="z10-fizika__ill" />
                  <h5>
                    {kodNaSayte(p.id)}. {p.title}
                  </h5>
                  <p className="z10-fizika__formula">
                    <Tex text={`$${p.formula}$`} />
                  </p>
                  <p>
                    <Tex text={FIZIKA_10[p.id] ?? ''} />
                  </p>
                  <ul className="z10-fizika__bukvy">
                    {dano.map((r) => (
                      <li key={`${r.oboz}${r.smysl}`}>
                        <Tex text={`$${r.oboz}$ — ${r.smysl}${r.ed ? `, ${r.ed}` : ''}`} />
                      </li>
                    ))}
                  </ul>
                  {p.fipiNos ? null : <p className="z10-metka">не из открытого банка</p>}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function Blok10({ b }: { b: BlokTeorii10 }): ReactNode {
  switch (b.vid) {
    case 'opredelenie':
      return (
        <RamkaOpredelenie
          title={b.title ?? 'Определение'}
          {...(b.formula ? { formula: b.formula } : {})}
        >
          <Abzacy paras={b.paras} />
          {b.spisok ? (
            <ol className="z10-spisok">
              {b.spisok.map((s) => (
                <li key={s}>
                  <Tex text={s} />
                </li>
              ))}
            </ol>
          ) : null}
        </RamkaOpredelenie>
      );
    case 'formula':
      return <RamkaFormula formula={b.formula} {...(b.podpis ? { podpis: b.podpis } : {})} />;
    case 'primer':
      return <PrimerIzBanka title={b.title} zadacha={b.zadacha} />;
    case 'primerRuchnoy':
      return (
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
    case 'zhivoy':
      return b.chto === 'myach' ? <ZhivoyMyach /> : <ZhivoyRaspad />;
    case 'most': {
      const z = zadachaBanka(b.zadacha);
      return <Most10 params={z.params} rezhim="uchenik" />;
    }
    case 'fizika':
      return <FizikaKarty />;
    case 'lovushka':
      return (
        <RamkaVazhno title={b.title}>
          <p className="ramka__p z10-lovushka__oshibka">
            <Tex text={`**Ошибка.** ${b.oshibka}`} />
          </p>
          <p className="ramka__p">
            <Tex text={`**Правильно.** ${b.pravilno}`} />
          </p>
        </RamkaVazhno>
      );
    default:
      return null;
  }
}

/** «Где на ЕГЭ»: прототипы раздела, ссылка — тренажёр с ними. */
export function GdeNaEge({ prototipy, trenazher }: { prototipy: string[]; trenazher: string }) {
  if (prototipy.length === 0) {
    return null;
  }
  return (
    <section className="z10-gde">
      <h4 className="z10-gde__title">Где на ЕГЭ</h4>
      <p className="z10-gde__lead">Задание №10, прототипы — нажмите, чтобы потренироваться:</p>
      <ul className="z10-gde__spisok">
        {prototipy.map((id) => (
          <li key={id}>
            <Link className="z10-gde__chip" href={`${trenazher}?tipy=${id}`}>
              {kodNaSayte(id)} {prototype(id).title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Telo({ r, trenazher }: { r: RazdelTeorii10; trenazher: string }) {
  return (
    <div className="z10-teoriya">
      <p className="z10-teoriya__lead">
        <Tex text={r.lead} />
      </p>
      {r.bloki.map((b, i) => (
        <Blok10 b={b} key={`${r.id}-${i}`} />
      ))}
      <GdeNaEge prototipy={r.prototipy} trenazher={trenazher} />
    </div>
  );
}

/**
 * Вкладка «Теория» задания №10: девять разделов подряд, содержание
 * рядом (оболочка теории №4/№11). Разделы — в content/teoriya10.ts.
 */
export function Teoriya10({ vkladka, base }: { vkladka: string; base: string }) {
  const tela = Object.fromEntries(
    RAZDELY_TEORII_10.map((r) => [
      r.id,
      <Telo r={r} trenazher={`${base}/trenazher/`} key={r.id} />,
    ]),
  );
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={RAZDELY_TEORII_10.map((r) => ({ id: r.id, title: r.title }))}
      tela={tela}
      dekor={{
        kartinka: <Most10 params={{ a: 0.0043, b: -0.74, c: 35, x: 70 }} rezhim="uchenik" />,
        note: 'Формула дана — найди букву и подставь числа',
      }}
      trackKey={PROGRESS_10.teoriyaKey}
    />
  );
}
