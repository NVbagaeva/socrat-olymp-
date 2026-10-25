'use client';

import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { ShapkaBanka } from '@/components/generator/ShapkaBanka';
import { RamkaPrimer } from '@/components/teoriya/Ramki';
import { Tex } from '@/components/ui/Tex';
import { GENERATOR10_TEXTS } from '@/content/generator10';
import { checkKitSheet, kitFootLabel, printKitSheet } from '@/lib/komplekt';
import { useAdres } from '@/lib/zadanie10/adres';
import { zagruzitIndeks, zagruzitZadachi, type ZadachaLite } from '@/lib/zadanie10/dannye';
import {
  modelUroka,
  parseUrokQuery,
  parseZapros,
  parseZaprosKlyuchi,
  sobratList,
  sobratListKlyuchi,
  type ModelLista,
} from '@/lib/zadanie10/sborka';
import type { Prototype } from '@/lib/zadanie10/types';
import { RamkiTeorii10, Uslovie10, ZadachaUchitelya10, type Vid10 } from './ChastiLista10';
import { Most10 } from './Most10';
import type { IllInfo } from './Zadacha10';

const FIO = 'Фамилия, имя ________________________ Дата ________';

interface Gotovo {
  model: ModelLista;
  zadachi: Map<string, ZadachaLite>;
  proto: (id: string) => Prototype;
  kit: { code: string | null; warning: string | null };
}

/**
 * Печатный лист №10. Адрес общего генератора (ps=2) открывает
 * /pechat/, /pechat/otvety/ и /pechat/vse/ — вид листа задаёт страница
 * (vid). Прежний адрес генератора (m=g) и урока (m=u) — один адрес на
 * ученика и учителя, вид — в l=uchenik|uchitel.
 */
export function List10({
  ill,
  vid: vidStranicy,
}: {
  ill: Record<string, IllInfo>;
  vid?: Vid10 | 'vse';
}) {
  const adres = useAdres();
  const vid: Vid10 | 'vse' =
    vidStranicy ?? (new URLSearchParams(adres).get('l') === 'uchitel' ? 'uchitel' : 'uchenik');
  const [gotovo, setGotovo] = useState<Gotovo | null>(null);
  const [oshibka, setOshibka] = useState<string | null>(null);
  const [kartinki, setKartinki] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    void (async () => {
      try {
        const indeks = await zagruzitIndeks();
        let model: ModelLista | null = null;
        const zk = parseZaprosKlyuchi(q);
        if (zk !== null) {
          model = sobratListKlyuchi(zk, indeks);
        } else if (q.get('m') === 'u') {
          const u = parseUrokQuery(q);
          if (u) {
            model = modelUroka(u.kod, u.no, u.n, indeks);
          }
        } else {
          const z = parseZapros(q);
          if (z) {
            model = sobratList(z, indeks);
          }
        }
        if (model === null) {
          setOshibka('Неверная ссылка на лист.');
          return;
        }
        /* У адреса ps=2 «k» — вид работы, картинки — в модели (fl). */
        const kartinki = model.kartinki || (zk === null && q.get('k') === '1');
        const ids = model.bloki.flatMap((b) => [...b.spiski.flat(), ...(b.primery ?? [])]);
        const protoIds = [...new Set(indeks.filter((x) => ids.includes(x.id)).map((x) => x.p))];
        const [zadachi, mod] = await Promise.all([
          zagruzitZadachi(protoIds),
          import('@/lib/zadanie10/prototypes'),
        ]);
        /* Отпечаток листа для комплекта: условия, у учителя — и ответы. */
        const tasks = ids.flatMap((id) => {
          const z = zadachi.get(id);
          return z
            ? [
                {
                  questionHtml: `${z.text} ${JSON.stringify(z.params)}`,
                  ...(vid === 'uchenik'
                    ? {}
                    : { answer: String(mod.prototype(z.prototypeId).solve(z.params).answer) }),
                },
              ]
            : [];
        });
        const kit = checkKitSheet(q, '10', vid === 'uchenik' ? 'student' : 'teacher', {
          blocks: [{ tasks }],
        });
        setKartinki(kartinki);
        setGotovo({ model, zadachi, proto: mod.prototype, kit });
      } catch (e) {
        setOshibka((e as Error).message);
      }
    })();
  }, [vid]);

  if (oshibka) {
    return <p role="alert">{oshibka}</p>;
  }
  if (gotovo === null) {
    return <p>Собираем лист…</p>;
  }
  const { model, zadachi, proto, kit } = gotovo;
  const reshit = (z: ZadachaLite) => proto(z.prototypeId).solve(z.params);
  const telo = (vid: Vid10, panel = true) => (
    <div className={clsx('z10-list', `z10-list--${vid}`)}>
      {panel ? (
        <div className="z10-list__panel">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => printKitSheet(kit.warning)}
          >
            Скачать (печать в PDF)
          </button>
          <span>{vid === 'uchitel' ? 'Лист учителя: ответы и разборы' : 'Лист ученика'}</span>
        </div>
      ) : null}
      <header className="z10-list__shapka">
        <p className="z10-list__eyebrow">
          Будет на ЕГЭ · {vid === 'uchitel' ? 'лист учителя' : 'лист ученика'}
        </p>
        <h1>{model.zagolovok}</h1>
        {model.shapka !== undefined ? (
          <ShapkaBanka
            shapka={model.shapka}
            avtor={GENERATOR10_TEXTS.sheet.teacher}
            fio={FIO}
            uchenik={vid === 'uchenik'}
          />
        ) : vid === 'uchenik' ? (
          <p className="z10-list__fio">{FIO}</p>
        ) : null}
      </header>
      {model.bloki.map((b) => (
        <section key={b.id} className="z10-list__blok">
          <h2>{b.title}</h2>
          {b.note && vid === 'uchitel' ? <p className="z10-list__note">{b.note}</p> : null}
          {b.teoriya ? <RamkiTeorii10 prototipy={b.teoriya} proto={proto} /> : null}
          {(b.primery ?? []).map((id) => {
            const z = zadachi.get(id);
            if (!z) {
              return null;
            }
            const s = reshit(z);
            return (
              <RamkaPrimer
                key={id}
                title={proto(z.prototypeId).title}
                uslovie={z.text}
                shagi={s.etapy.map((e) => ({
                  label: e.title.replace(/^Шаг \d+\.\s*/, ''),
                  paras: e.lines,
                }))}
              >
                {z.prototypeId === 'P01' ? <Most10 params={z.params} rezhim="uchitel" /> : null}
              </RamkaPrimer>
            );
          })}
          {b.spiski.map((variant, vi) => {
            return (
              <div key={`v${vi}`} className="z10-list__variant">
                {b.spiski.length > 1 ? <h3>Вариант {vi + 1}</h3> : null}
                {vid === 'uchitel' && variant.length > 0 ? (
                  <p className="z10-list__klyuch">
                    Ответы:{' '}
                    {variant
                      .map((id, k) => {
                        const z = zadachi.get(id);
                        return z ? `${k + 1}) ${String(reshit(z).answer).replace('.', ',')}` : '';
                      })
                      .join('; ')}
                  </p>
                ) : null}
                {variant.map((id, k) => {
                  const z = zadachi.get(id);
                  const nomer = k + 1;
                  if (!z) {
                    return null;
                  }
                  return vid === 'uchitel' ? (
                    <ZadachaUchitelya10
                      key={id}
                      z={z}
                      s={reshit(z)}
                      nomer={nomer}
                      kartinki={kartinki}
                      {...(ill[z.prototypeId] ? { ill: ill[z.prototypeId] } : {})}
                    />
                  ) : (
                    <section
                      key={id}
                      className={clsx(
                        'z10-list__zadacha',
                        b.mesto ? 'z10-list__zadacha--mesto' : '',
                      )}
                    >
                      <Uslovie10
                        z={z}
                        vid={vid}
                        kartinki={kartinki}
                        nomer={nomer}
                        {...(ill[z.prototypeId] ? { ill: ill[z.prototypeId] } : {})}
                      />
                      <p className="z10-list__otvet">Ответ: ______________</p>
                    </section>
                  );
                })}
              </div>
            );
          })}
        </section>
      ))}
      <footer className="z10-list__podval">
        <Tex text={kitFootLabel(kit.code) ?? `Код: ${model.kod}`} />
      </footer>
    </div>
  );
  /* «Всё одним файлом»: лист ученика, затем лист учителя — те же задачи. */
  return vid === 'vse' ? (
    <>
      {telo('uchenik')}
      <div className="gen-razryv" aria-hidden="true" />
      {telo('uchitel', false)}
    </>
  ) : (
    telo(vid)
  );
}
