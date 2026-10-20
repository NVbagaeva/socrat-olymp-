'use client';

import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { RamkaPrimer } from '@/components/teoriya/Ramki';
import { Tex } from '@/components/ui/Tex';
import { TEORIYA_6_DLYA_PROTOTIPA, vseKartochki6, type Kartochka6 } from '@/content/teoriya6';
import { GENERATOR_6 } from '@/content/zadanie6';
import { checkKitSheet, kitFootLabel, printKitSheet } from '@/lib/komplekt';
import { zagruzitIndeks, zagruzitZadachi, type ZadachaLite } from '@/lib/zadanie6/dannye';
import {
  modelUroka,
  parseUrokQuery,
  parseZapros,
  sobratList,
  type ModelLista,
} from '@/lib/zadanie6/sborka';
import type { Ris, Solved } from '@/lib/zadanie6/types';
import { KartochkaTelo6 } from './KartochkaTelo6';
import { Razbor6 } from './Razbor6';
import { Uslovie6 } from './Uslovie6';

const T = GENERATOR_6;

export type Vid6 = 'uchenik' | 'uchitel';

interface Gotovo {
  model: ModelLista;
  zadachi: Map<string, ZadachaLite>;
  reshit: (z: ZadachaLite) => Solved;
  risunok: (z: ZadachaLite) => Ris | undefined;
  kit: { code: string | null; warning: string | null };
}

/** Ответ на листе: десятичная запятая и настоящий минус. */
function otvetText(x: number): string {
  return String(x).replace('.', ',').replace('-', '−');
}

/** Рамки теории: карточки теории прототипов листа, каждая один раз — те же, что во вкладке «Теория». */
function RamkiTeorii({ prototipy }: { prototipy: string[] }) {
  const vse = vseKartochki6();
  const ids = [...new Set(prototipy.flatMap((p) => TEORIYA_6_DLYA_PROTOTIPA(p)?.kartochka ?? []))];
  const kartochki = ids.flatMap((id) => vse.find((k) => k.id === id) ?? []) as Kartochka6[];
  return (
    <div className="z6-list__teoriya">
      {kartochki.map((k) => (
        <KartochkaTelo6 key={k.id} k={k} />
      ))}
    </div>
  );
}

/**
 * Печатный лист №6 — генератора (по запросу в адресе) и, когда появятся
 * уроки, урока (?kod=…&u=…). Лист ученика — условия с рисунками (без
 * выделений) и поле для ответа; лист учителя — те же задачи с ответами
 * и разбором по шагам (таблицы решения, выделенные точки и исходы). Оба
 * собираются из одного запроса, поэтому задачи совпадают. Рисунки и
 * решения строит решатель прототипа в браузере: данные без ответов.
 */
export function List6({ vid }: { vid: Vid6 }) {
  const [gotovo, setGotovo] = useState<Gotovo | null>(null);
  const [oshibka, setOshibka] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    void (async () => {
      try {
        const indeks = await zagruzitIndeks();
        let model: ModelLista | null = null;
        const u = parseUrokQuery(q);
        if (u) {
          model = modelUroka(u.kod, u.no, u.n, indeks);
        } else {
          const z = parseZapros(q);
          if (z) {
            model = sobratList(z, indeks);
          }
        }
        if (model === null) {
          setOshibka(T.plohayaSsylka);
          return;
        }
        const ids = model.bloki.flatMap((b) => [...b.spiski.flat(), ...(b.primery ?? [])]);
        const protoIds = [...new Set(indeks.filter((x) => ids.includes(x.id)).map((x) => x.p))];
        const [zadachi, mod] = await Promise.all([
          zagruzitZadachi(protoIds),
          import('@/lib/zadanie6/prototypes'),
        ]);
        const reshit = (z: ZadachaLite) => mod.prototype(z.prototypeId).solve(z.params);
        const risunok = (z: ZadachaLite) => mod.prototype(z.prototypeId).ris(z.params);
        /* Отпечаток листа для комплекта: условия, у учителя — и ответы. */
        const tasks = ids.flatMap((id) => {
          const z = zadachi.get(id);
          return z
            ? [
                {
                  questionHtml: `${z.text} ${JSON.stringify(z.params)} ${z.posle ?? ''}`,
                  ...(vid === 'uchitel' ? { answer: String(reshit(z).answer) } : {}),
                },
              ]
            : [];
        });
        const kit = checkKitSheet(q, '6', vid === 'uchitel' ? 'teacher' : 'student', {
          blocks: [{ tasks }],
        });
        setGotovo({ model, zadachi, reshit, risunok, kit });
      } catch (e) {
        setOshibka((e as Error).message);
      }
    })();
  }, [vid]);

  if (oshibka) {
    return <p role="alert">{oshibka}</p>;
  }
  if (gotovo === null) {
    return <p>{T.sobiraem}</p>;
  }
  const { model, zadachi, reshit, risunok, kit } = gotovo;
  const uslovie = (z: ZadachaLite) => {
    const ris = risunok(z);
    return { text: z.text, ...(ris ? { ris } : {}), ...(z.posle ? { posle: z.posle } : {}) };
  };
  return (
    <div className={clsx('z6-list', `z6-list--${vid}`)}>
      <div className="z6-list__panel">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => printKitSheet(kit.warning)}
        >
          {T.pechat}
        </button>
        <span>{vid === 'uchitel' ? T.uchitel : T.uchenik}</span>
      </div>
      <header className="z6-list__shapka">
        <p className="z6-list__eyebrow">
          Будет на ЕГЭ · {vid === 'uchitel' ? T.uchitel : T.uchenik}
        </p>
        <h1>{model.zagolovok}</h1>
        {vid === 'uchenik' ? (
          <p className="z6-list__fio">{T.fio}</p>
        ) : (
          <p className="z6-list__note">{T.uchitelNote}</p>
        )}
      </header>
      {model.bloki.map((b) => (
        <section key={b.id} className="z6-list__blok">
          <h2>{b.title}</h2>
          {b.note && vid === 'uchitel' ? <p className="z6-list__note">{b.note}</p> : null}
          {b.teoriya ? <RamkiTeorii prototipy={b.teoriya} /> : null}
          {(b.primery ?? []).map((id) => {
            const z = zadachi.get(id);
            if (!z) {
              return null;
            }
            return (
              <RamkaPrimer
                key={id}
                title={TEORIYA_6_DLYA_PROTOTIPA(z.prototypeId)?.title ?? ''}
                shagi={[]}
              >
                <Uslovie6 u={uslovie(z)} />
                <Razbor6 s={reshit(z)} />
              </RamkaPrimer>
            );
          })}
          {b.spiski.map((variant, vi) => (
            <div key={`v${vi}`} className="z6-list__variant">
              {b.spiski.length > 1 ? <h3>Вариант {vi + 1}</h3> : null}
              {vid === 'uchitel' && variant.length > 0 ? (
                <p className="z6-list__klyuch">
                  {T.otvety}{' '}
                  {variant
                    .map((id, k) => {
                      const z = zadachi.get(id);
                      return z ? `${k + 1}) ${otvetText(reshit(z).answer)}` : '';
                    })
                    .join('; ')}
                </p>
              ) : null}
              {variant.map((id, k) => {
                const z = zadachi.get(id);
                if (!z) {
                  return null;
                }
                const metka =
                  z.source === 'analog' ? <p className="z6-list__metka">{T.analogMetka}</p> : null;
                if (vid === 'uchenik') {
                  return (
                    <section
                      key={id}
                      className={clsx('z6-list__zadacha', b.mesto ? 'z6-list__zadacha--mesto' : '')}
                    >
                      <b className="z6-list__nomer">{k + 1}.</b>
                      <Uslovie6 u={uslovie(z)} />
                      {metka}
                      <p className="z6-list__otvet">{T.otvetPole}</p>
                    </section>
                  );
                }
                const s = reshit(z);
                return (
                  <section key={id} className="z6-list__zadacha z6-list__zadacha--uchitel">
                    <b className="z6-list__nomer">{k + 1}.</b>
                    <Uslovie6 u={uslovie(z)} />
                    {metka}
                    <p className="z6-list__otvet-uchitel">
                      Ответ: <b>{otvetText(s.answer)}</b>
                    </p>
                    <Razbor6 s={s} />
                  </section>
                );
              })}
            </div>
          ))}
        </section>
      ))}
      <footer className="z6-list__podval">
        <Tex text={kitFootLabel(kit.code) ?? `Код: ${model.kod}`} />
      </footer>
    </div>
  );
}
