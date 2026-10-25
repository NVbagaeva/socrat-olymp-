/**
 * Куски листа №10 — условие ученика, задача учителя и рамки теории. Их
 * рисует лист печати (List10) и, в строку HTML, предпросмотр общего
 * генератора (lib/zadanie10/predprosmotr10.tsx).
 */

import { Most10 } from './Most10';
import type { IllInfo } from './Zadacha10';
import { RamkaFormula, RamkaVazhno, Abzacy } from '@/components/teoriya/Ramki';
import { Tex } from '@/components/ui/Tex';
import { bezSsylok, RAZDELY_TEORII_10 } from '@/content/teoriya10';
import type { ZadachaLite } from '@/lib/zadanie10/dannye';
import type { Prototype, Solved } from '@/lib/zadanie10/types';

/** Лист ученика или учителя. */
export type Vid10 = 'uchenik' | 'uchitel';

/**
 * Ширина рисунка на листе учителя, мм. Колонка листа A4 — 180 мм:
 * рисунок не шире половины колонки ставится справа от разбора, шире —
 * под условием (правило листа учителя, как у №9).
 */
const KOLONKA_MM = 180;
const SHIRINA_MM = { most: 84, kartinka: 100 };

export function Uslovie10({
  z,
  vid,
  ill,
  kartinki,
  nomer,
}: {
  z: ZadachaLite;
  vid: Vid10;
  ill?: IllInfo;
  kartinki: boolean;
  /** Номер на листе; в предпросмотре генератора номер и пометку ставит сам генератор. */
  nomer?: number;
}) {
  return (
    <>
      <p className="z10-list__uslovie">
        {nomer === undefined ? null : (
          <>
            <b className="z10-list__nomer">{nomer}.</b>{' '}
          </>
        )}
        <Tex text={z.text} />
        {z.source === 'analog' && nomer !== undefined ? (
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
export function ZadachaUchitelya10({
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
        <Shagi10 s={s} />
      </div>
    </section>
  );
}

/** Разбор по шагам — на листе учителя и в предпросмотре генератора. */
export function Shagi10({ s }: { s: Solved }) {
  return (
    <>
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
    </>
  );
}

/** Рамки теории для прототипов: главная формула и «Важно!» разделов. */
export function RamkiTeorii10({
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

