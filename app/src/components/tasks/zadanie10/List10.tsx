'use client';

import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { useAdres } from '@/lib/zadanie10/adres';
import { RamkaFormula, RamkaPrimer, RamkaVazhno, Abzacy } from '@/components/teoriya/Ramki';
import { Tex } from '@/components/ui/Tex';
import { bezSsylok, RAZDELY_TEORII_10 } from '@/content/teoriya10';
import { zagruzitIndeks, zagruzitZadachi, type ZadachaLite } from '@/lib/zadanie10/dannye';
import {
  modelUroka,
  parseUrokQuery,
  parseZapros,
  sobratList,
  type ModelLista,
} from '@/lib/zadanie10/sborka';
import type { Prototype, Solved } from '@/lib/zadanie10/types';
import { Most10 } from './Most10';
import type { IllInfo } from './Zadacha10';

type Vid = 'uchenik' | 'uchitel';

interface Gotovo {
  model: ModelLista;
  zadachi: Map<string, ZadachaLite>;
  proto: (id: string) => Prototype;
}

/**
 * Ширина рисунка на листе учителя, мм. Колонка листа A4 — 180 мм:
 * рисунок не шире половины колонки ставится справа от разбора, шире —
 * под условием (правило листа учителя, как у №9).
 */
const KOLONKA_MM = 180;
const SHIRINA_MM = { most: 84, kartinka: 100 };

function Uslovie({
  z,
  vid,
  ill,
  kartinki,
  nomer,
}: {
  z: ZadachaLite;
  vid: Vid;
  ill?: IllInfo;
  kartinki: boolean;
  nomer: number;
}) {
  return (
    <>
      <p className="z10-list__uslovie">
        <b className="z10-list__nomer">{nomer}.</b> <Tex text={z.text} />
        {z.source === 'analog' ? (
          <span className="z10-list__metka"> (не из открытого банка)</span>
        ) : null}
      </p>
      {kartinki && ill ? (
        <picture className="z10-list__kartinka" style={{ width: `${SHIRINA_MM.kartinka}mm` }}>
          <source type="image/webp" srcSet={ill.webp} />
          <img src={ill.png} alt={ill.alt} width={ill.width} height={ill.height} />
        </picture>
      ) : null}
      {z.prototypeId === 'P01' && vid === 'uchenik' ? (
        <div className="z10-list__most" style={{ width: `${SHIRINA_MM.most}mm` }}>
          <Most10 params={z.params} rezhim="uchenik" />
        </div>
      ) : null}
    </>
  );
}

/** Задача на листе учителя: кусок «условие + рисунок» не рвётся, разбор — по шагам. */
function ZadachaUchitelya({
  z,
  s,
  nomer,
  ill,
  kartinki,
}: {
  z: ZadachaLite;
  s: Solved;
  nomer: number;
  ill?: IllInfo;
  kartinki: boolean;
}) {
  const most = z.prototypeId === 'P01';
  const sboku = most && SHIRINA_MM.most <= KOLONKA_MM / 2;
  return (
    <section className="z10-list__zadacha z10-list__zadacha--uchitel">
      <div className="z10-list__kusok-pervyy">
        <p className="z10-list__uslovie">
          <b className="z10-list__nomer">{nomer}.</b> <Tex text={z.text} />
          {z.source === 'analog' ? (
            <span className="z10-list__metka"> (не из открытого банка)</span>
          ) : null}
        </p>
        {kartinki && ill ? (
          <picture
            className="z10-list__kartinka z10-list__pod-usloviem"
            style={{ width: `${SHIRINA_MM.kartinka}mm` }}
          >
            <source type="image/webp" srcSet={ill.webp} />
            <img src={ill.png} alt={ill.alt} width={ill.width} height={ill.height} />
          </picture>
        ) : null}
        <p className="z10-list__otvet-uchitel">
          Ответ: <b>{String(s.answer).replace('.', ',')}</b>
        </p>
      </div>
      <div className={sboku ? 'z10-list__ryad' : undefined}>
        {most ? (
          <div
            className={
              sboku
                ? 'z10-list__most z10-list__most--sboku'
                : 'z10-list__most z10-list__pod-usloviem'
            }
            style={{ width: `${SHIRINA_MM.most}mm` }}
          >
            <Most10 params={z.params} rezhim="uchitel" />
          </div>
        ) : null}
        {s.etapy.map((e) => (
          <div className="z10-list__shag" key={e.title}>
            <p className="z10-list__shag-title">{e.title}</p>
            {e.lines.map((l) => (
              <p className="z10-list__shag-line" key={l}>
                <Tex text={l} />
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/** Рамки теории для прототипов: главная формула и «Важно!» разделов. */
function RamkiTeorii({
  prototipy,
  proto,
}: {
  prototipy: string[];
  proto: (id: string) => Prototype;
}) {
  const razdely = RAZDELY_TEORII_10.filter((r) => r.prototipy.some((p) => prototipy.includes(p)));
  return (
    <div className="z10-list__teoriya">
      {prototipy.map((id) => (
        <RamkaFormula key={id} formula={proto(id).formula} podpis={`${proto(id).title}`} />
      ))}
      {razdely.map((r) => {
        /* Примеров на листе нет — отсылки «(см. пример …)» убираем. */
        const najden = r.bloki.find((b) => b.vid === 'vazhno');
        const v = najden ? bezSsylok(najden) : undefined;
        return v && v.vid === 'vazhno' ? (
          <RamkaVazhno key={r.id} title={`Важно! ${r.title}`}>
            <Abzacy paras={v.paras} />
          </RamkaVazhno>
        ) : null;
      })}
    </div>
  );
}

export function List10({ ill }: { ill: Record<string, IllInfo> }) {
  const adres = useAdres();
  const vid: Vid = new URLSearchParams(adres).get('l') === 'uchitel' ? 'uchitel' : 'uchenik';
  const [gotovo, setGotovo] = useState<Gotovo | null>(null);
  const [oshibka, setOshibka] = useState<string | null>(null);
  const [kartinki, setKartinki] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    void (async () => {
      try {
        const indeks = await zagruzitIndeks();
        let model: ModelLista | null = null;
        if (q.get('m') === 'u') {
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
        setKartinki(model.kartinki || q.get('k') === '1');
        const ids = model.bloki.flatMap((b) => [...b.spiski.flat(), ...(b.primery ?? [])]);
        const protoIds = [...new Set(indeks.filter((x) => ids.includes(x.id)).map((x) => x.p))];
        const [zadachi, mod] = await Promise.all([
          zagruzitZadachi(protoIds),
          import('@/lib/zadanie10/prototypes'),
        ]);
        setGotovo({ model, zadachi, proto: mod.prototype });
      } catch (e) {
        setOshibka((e as Error).message);
      }
    })();
  }, []);

  if (oshibka) {
    return <p role="alert">{oshibka}</p>;
  }
  if (gotovo === null) {
    return <p>Собираем лист…</p>;
  }
  const { model, zadachi, proto } = gotovo;
  const reshit = (z: ZadachaLite) => proto(z.prototypeId).solve(z.params);
  return (
    <div className={clsx('z10-list', `z10-list--${vid}`)}>
      <div className="z10-list__panel">
        <button type="button" className="btn btn--primary" onClick={() => window.print()}>
          Скачать (печать в PDF)
        </button>
        <span>{vid === 'uchitel' ? 'Лист учителя: ответы и разборы' : 'Лист ученика'}</span>
      </div>
      <header className="z10-list__shapka">
        <p className="z10-list__eyebrow">
          Будет на ЕГЭ · {vid === 'uchitel' ? 'лист учителя' : 'лист ученика'}
        </p>
        <h1>{model.zagolovok}</h1>
        {vid === 'uchenik' ? (
          <p className="z10-list__fio">Фамилия, имя ________________________ Дата ________</p>
        ) : null}
      </header>
      {model.bloki.map((b) => (
        <section key={b.id} className="z10-list__blok">
          <h2>{b.title}</h2>
          {b.note && vid === 'uchitel' ? <p className="z10-list__note">{b.note}</p> : null}
          {b.teoriya ? <RamkiTeorii prototipy={b.teoriya} proto={proto} /> : null}
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
                    <ZadachaUchitelya
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
                      <Uslovie
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
      <footer className="z10-list__podval">Код: {model.kod}</footer>
    </div>
  );
}
