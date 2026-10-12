'use client';

import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { RamkaPrimer } from '@/components/teoriya/Ramki';
import { Tex } from '@/components/ui/Tex';
import { TEORIYA_7_DLYA_PROTOTIPA, vseKartochki7, type Kartochka7 } from '@/content/teoriya7';
import { GENERATOR_7 } from '@/content/zadanie7';
import { checkKitSheet, kitFootLabel, printKitSheet } from '@/lib/komplekt';
import { zagruzitIndeks, zagruzitZadachi, type ZadachaLite } from '@/lib/zadanie7/dannye';
import {
  modelUroka,
  parseUrokQuery,
  parseZapros,
  sobratList,
  type ModelLista,
} from '@/lib/zadanie7/sborka';
import type { Solved } from '@/lib/zadanie7/types';
import { KartochkaTelo7 } from './KartochkaTelo7';
import { Razbor7 } from './Razbor7';

const T = GENERATOR_7;

export type Vid7 = 'uchenik' | 'uchitel';

interface Gotovo {
  model: ModelLista;
  zadachi: Map<string, ZadachaLite>;
  reshit: (z: ZadachaLite) => Solved;
  kit: { code: string | null; warning: string | null };
}

/** Ответ на листе: десятичная запятая и настоящий минус. */
function otvetText(x: number): string {
  return String(x).replace('.', ',').replace('-', '−');
}

function Metka({ z }: { z: ZadachaLite }) {
  return z.source === 'analog' ? <span className="z7-list__metka"> {T.analogMetka}</span> : null;
}

/** Рамки теории: карточки теории прототипов листа, каждая один раз. */
function RamkiTeorii({ prototipy }: { prototipy: string[] }) {
  const vse = vseKartochki7();
  const ids = [...new Set(prototipy.flatMap((p) => TEORIYA_7_DLYA_PROTOTIPA(p)?.kartochka ?? []))];
  const kartochki = ids.flatMap((id) => vse.find((k) => k.id === id) ?? []) as Kartochka7[];
  return (
    <div className="z7-list__teoriya">
      {kartochki.map((k) => (
        <KartochkaTelo7 key={k.id} k={k} />
      ))}
    </div>
  );
}

/**
 * Печатный лист №7 — генератора (по запросу в адресе) и, когда
 * появятся уроки, урока (?kod=…&u=…). Лист ученика — только условия
 * и поле для ответа; лист учителя — те же задачи с ответами и
 * разбором по шагам, этапы «ОДЗ» и «Отбор корней» выделены. Оба
 * собираются из одного запроса, поэтому задачи совпадают.
 * Решения строит решатель прототипа в браузере: данные без ответов.
 */
export function List7({ vid }: { vid: Vid7 }) {
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
          import('@/lib/zadanie7/prototypes'),
        ]);
        const reshit = (z: ZadachaLite) => mod.prototype(z.prototypeId).solve(z.params);
        /* Отпечаток листа для комплекта: условия, у учителя — и ответы. */
        const tasks = ids.flatMap((id) => {
          const z = zadachi.get(id);
          return z
            ? [
                {
                  questionHtml: z.text,
                  ...(vid === 'uchitel' ? { answer: String(reshit(z).answer) } : {}),
                },
              ]
            : [];
        });
        const kit = checkKitSheet(q, '7', vid === 'uchitel' ? 'teacher' : 'student', {
          blocks: [{ tasks }],
        });
        setGotovo({ model, zadachi, reshit, kit });
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
  const { model, zadachi, reshit, kit } = gotovo;
  return (
    <div className={clsx('z7-list', `z7-list--${vid}`)}>
      <div className="z7-list__panel">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => printKitSheet(kit.warning)}
        >
          {T.pechat}
        </button>
        <span>{vid === 'uchitel' ? T.uchitel : T.uchenik}</span>
      </div>
      <header className="z7-list__shapka">
        <p className="z7-list__eyebrow">
          Будет на ЕГЭ · {vid === 'uchitel' ? T.uchitel : T.uchenik}
        </p>
        <h1>{model.zagolovok}</h1>
        {vid === 'uchenik' ? (
          <p className="z7-list__fio">{T.fio}</p>
        ) : (
          <p className="z7-list__note">{T.otbor}</p>
        )}
      </header>
      {model.bloki.map((b) => (
        <section key={b.id} className="z7-list__blok">
          <h2>{b.title}</h2>
          {b.note && vid === 'uchitel' ? <p className="z7-list__note">{b.note}</p> : null}
          {b.teoriya ? <RamkiTeorii prototipy={b.teoriya} /> : null}
          {(b.primery ?? []).map((id) => {
            const z = zadachi.get(id);
            if (!z) {
              return null;
            }
            const s = reshit(z);
            return (
              <RamkaPrimer
                key={id}
                title={TEORIYA_7_DLYA_PROTOTIPA(z.prototypeId)?.title ?? ''}
                uslovie={z.text}
                shagi={s.etapy.map((e) => ({
                  label: e.title.replace(/^Шаг \d+\.\s*/, ''),
                  paras: e.lines,
                }))}
              />
            );
          })}
          {b.spiski.map((variant, vi) => (
            <div key={`v${vi}`} className="z7-list__variant">
              {b.spiski.length > 1 ? <h3>Вариант {vi + 1}</h3> : null}
              {vid === 'uchitel' && variant.length > 0 ? (
                <p className="z7-list__klyuch">
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
                if (vid === 'uchenik') {
                  return (
                    <section
                      key={id}
                      className={clsx('z7-list__zadacha', b.mesto ? 'z7-list__zadacha--mesto' : '')}
                    >
                      <p className="z7-list__uslovie">
                        <b className="z7-list__nomer">{k + 1}.</b> <Tex text={z.text} />
                        <Metka z={z} />
                      </p>
                      <p className="z7-list__otvet">{T.otvetPole}</p>
                    </section>
                  );
                }
                const s = reshit(z);
                return (
                  <section key={id} className="z7-list__zadacha z7-list__zadacha--uchitel">
                    <div className="z7-list__kusok-pervyy">
                      <p className="z7-list__uslovie">
                        <b className="z7-list__nomer">{k + 1}.</b> <Tex text={z.text} />
                        <Metka z={z} />
                      </p>
                      <p className="z7-list__otvet-uchitel">
                        Ответ: <b>{otvetText(s.answer)}</b>
                      </p>
                    </div>
                    <Razbor7 s={s} />
                  </section>
                );
              })}
            </div>
          ))}
        </section>
      ))}
      <footer className="z7-list__podval">{kitFootLabel(kit.code) ?? `Код: ${model.kod}`}</footer>
    </div>
  );
}
