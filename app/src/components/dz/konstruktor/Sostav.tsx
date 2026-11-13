'use client';

/**
 * «Состав ДЗ»: пункты по порядку, счётчик сверху. Порядок меняется
 * перетаскиванием за ручку (мышь, палец) и кнопками «Выше / Ниже»
 * (клавиатура, экранный диктор); любой пункт убирается. У правила
 * тренажёра — «сколько», у правил и опорных с зерном — «каждому свои».
 *
 * На телефоне панель — снизу экрана, свёрнутая до счётчика; на широком
 * экране — справа, липкая.
 */

import { clsx } from 'clsx';
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { DZK, ISTOCHNIK } from '@/content/dzIstochniki';
import { Ikonka } from '@/components/tasks/steklo';
import { perestavit, ubrat, zamenit } from '@/lib/dz/chernovik';
import type { KatalogRazdela } from '@/lib/dz/katalog/types';
import { kazhdomuMozhno, titlePunkta } from '@/lib/dz/sborka';
import { istochnikPunkta, type PunktSostava, type Schet } from '@/lib/dz/sostav';

function podrobnosti(p: PunktSostava, kat: KatalogRazdela | undefined): string {
  if (p.ist === 'kartochki') {
    const n = p.kartochki?.length ?? kat?.kartochki?.find((t) => t.id === p.podtema)?.kartochki.length ?? 0;
    return p.kartochki === null ? `${DZK.kartochek(n)}, ${DZK.sostav.vsehKartochek}` : DZK.kartochek(n);
  }
  if (p.ist === 'opornye') {
    const n = p.zadachi?.length ?? kat?.opornye.find((b) => b.slug === p.blok)?.zadachi.length ?? 0;
    return p.zadachi === null ? `${DZK.zadach(n)}, ${DZK.sostav.vsegoBloka}` : DZK.zadach(n);
  }
  if (p.ist === 'trenazher') {
    return p.tipy.length > 1 && p.gruppa === undefined
      ? `${DZK.tipov(p.tipy.length)} · ${DZK.zadach(p.skolko)}`
      : DZK.zadach(p.skolko);
  }
  return DZK.trenazher.konkretnaya;
}

export function Sostav({
  punkty,
  katalogi,
  schet,
  predel,
  onOchistit,
}: {
  punkty: readonly PunktSostava[];
  katalogi: ReadonlyMap<number, KatalogRazdela>;
  schet: Schet;
  /** Сообщение о пределе 60, если превышен. */
  predel: string | null;
  onOchistit: () => void;
}) {
  const [otkryto, setOtkryto] = useState(false);
  const spisok = useRef<HTMLOListElement>(null);
  const [tyanem, setTyanem] = useState<string | null>(null);
  const start = useRef<{ id: number; index: number } | null>(null);

  /* Перетаскивание: пункт под пальцем меняется местами с соседом, как
     только палец переходит середину соседа. */
  function onDown(e: ReactPointerEvent<HTMLButtonElement>, index: number, id: string) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { id: e.pointerId, index };
    setTyanem(id);
  }
  function onMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const s = start.current;
    if (s === null || s.id !== e.pointerId || spisok.current === null) return;
    const items = [...spisok.current.children] as HTMLElement[];
    const y = e.clientY;
    let target = s.index;
    items.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (i < s.index && y < mid) target = Math.min(target, i);
      if (i > s.index && y > mid) target = Math.max(target, i);
    });
    if (target !== s.index) {
      perestavit(s.index, target);
      s.index = target;
    }
  }
  function onUp() {
    start.current = null;
    setTyanem(null);
  }

  return (
    <section
      className={clsx('dzk-sostav stk-glass', otkryto && 'is-otkryto')}
      aria-labelledby="dzk-sostav-title"
      data-block="dz-sostav"
    >
      <header className="dzk-sostav__verh">
        <div>
          <h2 className="dzk-sostav__title" id="dzk-sostav-title">
            {DZK.sostav.title}
          </h2>
          <p className="dzk-schet" data-block="dz-schet" aria-live="polite">
            {DZK.schet(schet.zadach, schet.naborov, schet.minut)}
          </p>
        </div>
        <button
          type="button"
          className="stk-btn stk-btn--tihaya dzk-sostav__toggle"
          aria-expanded={otkryto}
          onClick={() => setOtkryto((v) => !v)}
        >
          {otkryto ? DZK.sostav.svernut : DZK.sostav.razvernut}
        </button>
      </header>

      <div className="dzk-sostav__telo">
        {predel === null ? null : (
          <p className="dzk-predel" role="alert">
            {predel}
          </p>
        )}
        {punkty.length === 0 ? (
          <p className="dzk-pusto">{DZK.sostav.pusto}</p>
        ) : (
          <ol className="dzk-punkty" ref={spisok}>
            {punkty.map((p, i) => {
              const kat = katalogi.get(p.no);
              const ist = istochnikPunkta(p);
              return (
                <li
                  key={p.id}
                  className={clsx('dzk-punkt', tyanem === p.id && 'is-tyanem')}
                  data-punkt={p.ist}
                >
                  <button
                    type="button"
                    className="dzk-ruchka"
                    aria-label={DZK.sostav.peretashchit}
                    title={DZK.sostav.peretashchit}
                    onPointerDown={(e) => onDown(e, i, p.id)}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                  >
                    <Ikonka name="ruchka" />
                  </button>
                  <div className="dzk-punkt__telo">
                    <p className="dzk-punkt__metki">
                      <span className={`dzk-metka dzk-metka--${ist}`}>{ISTOCHNIK[ist]}</span>
                      <span className="dzk-metka dzk-metka--no">№{p.no}</span>
                    </p>
                    <p
                      className="dzk-punkt__nazvanie"
                      dangerouslySetInnerHTML={{ __html: kat === undefined ? '…' : titlePunkta(kat, p) }}
                    />
                    <p className="dzk-punkt__podrobno">{podrobnosti(p, kat)}</p>
                    {p.ist === 'trenazher' ? (
                      <label className="dzk-stepper">
                        <span>{DZK.sostav.skolko}</span>
                        <span className="dzk-stepper__ryad">
                          <button
                            type="button"
                            className="stk-btn stk-btn--sm"
                            aria-label="Меньше"
                            disabled={p.skolko <= 1}
                            onClick={() => zamenit({ ...p, skolko: p.skolko - 1 })}
                          >
                            −
                          </button>
                          <output>{p.skolko}</output>
                          <button
                            type="button"
                            className="stk-btn stk-btn--sm"
                            aria-label="Больше"
                            disabled={p.skolko >= 20}
                            onClick={() => zamenit({ ...p, skolko: p.skolko + 1 })}
                          >
                            +
                          </button>
                        </span>
                      </label>
                    ) : null}
                    {(p.ist === 'trenazher' || p.ist === 'opornye') && kazhdomuMozhno(p) ? (
                      <label className="dzk-galka">
                        <input
                          type="checkbox"
                          checked={p.kazhdomu}
                          onChange={(e) => zamenit({ ...p, kazhdomu: e.target.checked })}
                        />
                        <span>{p.kazhdomu ? DZK.sostav.kazhdomu : DZK.sostav.odinNabor}</span>
                      </label>
                    ) : null}
                  </div>
                  <div className="dzk-punkt__knopki">
                    <button
                      type="button"
                      className="dzk-ikon"
                      aria-label={`${DZK.sostav.vverh}: пункт ${i + 1}`}
                      disabled={i === 0}
                      onClick={() => perestavit(i, i - 1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="dzk-ikon"
                      aria-label={`${DZK.sostav.vniz}: пункт ${i + 1}`}
                      disabled={i === punkty.length - 1}
                      onClick={() => perestavit(i, i + 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="dzk-ikon dzk-ikon--ubrat"
                      aria-label={`${DZK.sostav.ubrat}: пункт ${i + 1}`}
                      data-action="ubrat"
                      onClick={() => ubrat(p.id)}
                    >
                      <Ikonka name="net" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {punkty.length === 0 ? null : (
          <button type="button" className="stk-btn stk-btn--tihaya dzk-ochistit" onClick={onOchistit}>
            {DZK.sostav.ochistit}
          </button>
        )}
      </div>
    </section>
  );
}
