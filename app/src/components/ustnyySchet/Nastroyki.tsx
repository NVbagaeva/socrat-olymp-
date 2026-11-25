'use client';

import { clsx } from 'clsx';
import { useId } from 'react';
import type { Nabor, Nastroyki as NastroykiT } from '@/lib/ustnyySchet/nabor';
import { GRUPPY, priyom, priyomyGruppy } from '@/lib/ustnyySchet/registry';
import { LIMITY_SEK, SERII, type Rezhim } from '@/lib/ustnyySchet/sessiya';
import { DEYSTVIYA, UROVNI, type Deystvie, type PriyomId } from '@/lib/ustnyySchet/types';
import { USTNYY } from '@/content/ustnyySchet';

const T = USTNYY.nastroyki;

export interface Lichnye {
  zvuk: boolean;
  avto: boolean;
}

export interface NastroykiProps {
  nabor: Nabor;
  rezhim: Rezhim;
  nast: NastroykiT;
  lichnye: Lichnye;
  onNabor: (n: Nabor) => void;
  onRezhim: (r: Rezhim) => void;
  onNast: (n: NastroykiT) => void;
  onLichnye: (l: Lichnye) => void;
  onStart: () => void;
}

function Chip({
  on,
  onClick,
  children,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={clsx('us-chip', on && 'is-on')}
      aria-pressed={on}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function Vykl({
  on,
  onChange,
  children,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <label className="us-vykl" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={on}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="us-vykl__polzunok" aria-hidden="true" />
      <span>{children}</span>
    </label>
  );
}

/** Что набрано: годится ли для старта. */
export function naborPust(n: Nabor): string | null {
  if (n.tip === 'priyomy' && n.ids.length === 0) return T.vyberiPriyom;
  if (n.tip === 'deystviya' && n.ids.length === 0) return T.vyberiDeystvie;
  return null;
}

/** Есть ли в наборе квадратные уравнения (для переключателя «Как в ЕГЭ»). */
export function estUravneniya(n: Nabor): boolean {
  if (n.tip === 'priyomy') return n.ids.some((id) => priyom(id).gruppa === 'uravneniya');
  if (n.tip === 'deystviya') return n.ids.includes('uravneniya');
  return false;
}

/**
 * Настройки перед стартом: режим, набор примеров, уровень и
 * выключатели. Зачётный формат настроек не имеет — условия у всех
 * одинаковые; остаются только звук и автопроверка.
 */
export function Nastroyki({
  nabor,
  rezhim,
  nast,
  lichnye,
  onNabor,
  onRezhim,
  onNast,
  onLichnye,
  onStart,
}: NastroykiProps) {
  const fix = nabor.tip === 'format';
  const pust = naborPust(nabor);
  const toggle = <X,>(list: readonly X[], x: X): X[] =>
    list.includes(x) ? list.filter((y) => y !== x) : [...list, x];

  return (
    <form
      className="us-nastroyki"
      onSubmit={(e) => {
        e.preventDefault();
        if (pust === null) onStart();
      }}
    >
      {nabor.tip === 'format' && (
        <div className="us-nastroyki__format">
          <p className="t-h3">{USTNYY.formaty[nabor.id].nazvanie}</p>
          <p className="us-nastroyki__lead">{USTNYY.formaty[nabor.id].kratko}</p>
        </div>
      )}

      {!fix && (
        <fieldset className="us-pole">
          <legend className="us-pole__zag">{T.rezhim}</legend>
          <div className="us-rezhimy">
            <button
              type="button"
              className={clsx('us-rezhim', rezhim.tip === 'svobodnyy' && 'is-on')}
              aria-pressed={rezhim.tip === 'svobodnyy'}
              onClick={() => onRezhim({ tip: 'svobodnyy' })}
            >
              <span className="us-rezhim__zag">{T.svobodnyy}</span>
              <span className="us-rezhim__lead">{T.svobodnyyLead}</span>
            </button>
            <button
              type="button"
              className={clsx('us-rezhim', rezhim.tip === 'seriya' && 'is-on')}
              aria-pressed={rezhim.tip === 'seriya'}
              onClick={() =>
                onRezhim({ tip: 'seriya', n: rezhim.tip === 'seriya' ? rezhim.n : 20 })
              }
            >
              <span className="us-rezhim__zag">{T.seriya}</span>
              <span className="us-rezhim__lead">{T.seriyaLead}</span>
            </button>
            <button
              type="button"
              className={clsx('us-rezhim', rezhim.tip === 'vremya' && 'is-on')}
              aria-pressed={rezhim.tip === 'vremya'}
              onClick={() =>
                onRezhim({ tip: 'vremya', sek: rezhim.tip === 'vremya' ? rezhim.sek : 60 })
              }
            >
              <span className="us-rezhim__zag">{T.vremya}</span>
              <span className="us-rezhim__lead">{T.vremyaLead}</span>
            </button>
          </div>
          {rezhim.tip === 'seriya' && (
            <div className="us-chips" role="group" aria-label={T.seriya}>
              {SERII.map((n) => (
                <Chip key={n} on={rezhim.n === n} onClick={() => onRezhim({ tip: 'seriya', n })}>
                  {n} {T.primerov}
                </Chip>
              ))}
            </div>
          )}
          {rezhim.tip === 'vremya' && (
            <div className="us-chips" role="group" aria-label={T.vremya}>
              {LIMITY_SEK.map((s) => (
                <Chip
                  key={s}
                  on={rezhim.sek === s}
                  onClick={() => onRezhim({ tip: 'vremya', sek: s })}
                >
                  {T.minut(s / 60)}
                </Chip>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {(nabor.tip === 'priyomy' || nabor.tip === 'deystviya') && (
        <fieldset className="us-pole">
          <legend className="us-pole__zag">{T.nabor}</legend>
          <div className="us-chips" role="group" aria-label={T.nabor}>
            <Chip
              on={nabor.tip === 'priyomy'}
              onClick={() =>
                nabor.tip !== 'priyomy' && onNabor({ tip: 'priyomy', ids: ['razlozhenie'] })
              }
            >
              {T.neskolko}
            </Chip>
            <Chip
              on={nabor.tip === 'deystviya'}
              onClick={() =>
                nabor.tip !== 'deystviya' && onNabor({ tip: 'deystviya', ids: ['umnozhenie'] })
              }
            >
              {T.poDeystviyu}
            </Chip>
          </div>
          {nabor.tip === 'deystviya' && (
            <div className="us-chips" role="group" aria-label={T.poDeystviyu}>
              {DEYSTVIYA.map((d: Deystvie) => (
                <Chip
                  key={d}
                  on={nabor.ids.includes(d)}
                  onClick={() => onNabor({ tip: 'deystviya', ids: toggle(nabor.ids, d) })}
                >
                  {USTNYY.deystviya[d]}
                </Chip>
              ))}
            </div>
          )}
          {nabor.tip === 'priyomy' && (
            <div className="us-priyomy-vybor">
              {GRUPPY.map((g) => (
                <div
                  key={g}
                  className="us-priyomy-vybor__gruppa"
                  role="group"
                  aria-label={USTNYY.gruppy[g].nazvanie}
                >
                  <p className="us-priyomy-vybor__zag">{USTNYY.gruppy[g].nazvanie}</p>
                  {priyomyGruppy(g).map((p) => {
                    const id: PriyomId = p.id;
                    return (
                      <label key={id} className="us-galka">
                        <input
                          type="checkbox"
                          checked={nabor.ids.includes(id)}
                          onChange={() => onNabor({ tip: 'priyomy', ids: toggle(nabor.ids, id) })}
                        />
                        <span>{USTNYY.priyomy[id].nazvanie}</span>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {!fix && (
        <fieldset className="us-pole">
          <legend className="us-pole__zag">{T.uroven}</legend>
          <div className="us-chips" role="group" aria-label={T.uroven}>
            {UROVNI.map((u) => (
              <Chip key={u} on={nast.uroven === u} onClick={() => onNast({ ...nast, uroven: u })}>
                {USTNYY.urovenNazv[u - 1]}
              </Chip>
            ))}
          </div>
          {nabor.tip !== 'tablica' && (
            <>
              <p className="us-pole__pod">{T.predel}</p>
              <div className="us-chips" role="group" aria-label={T.predel}>
                {([null, 100, 1000] as const).map((p) => (
                  <Chip
                    key={String(p)}
                    on={nast.predel === p}
                    onClick={() => onNast({ ...nast, predel: p })}
                  >
                    {p === null ? T.predelVse : T.predelDo(p)}
                  </Chip>
                ))}
              </div>
              <div className="us-vykly">
                <Vykl on={nast.otricatelnye} onChange={(v) => onNast({ ...nast, otricatelnye: v })}>
                  {T.otricatelnye}
                </Vykl>
                <Vykl on={nast.desyatichnye} onChange={(v) => onNast({ ...nast, desyatichnye: v })}>
                  {T.desyatichnye}
                </Vykl>
              </div>
            </>
          )}
        </fieldset>
      )}

      {!fix && estUravneniya(nabor) && (
        <fieldset className="us-pole">
          <legend className="us-pole__zag">{USTNYY.gruppy.uravneniya.nazvanie}</legend>
          <div className="us-vykly">
            <Vykl
              on={nast.ege !== undefined}
              onChange={(v) => {
                const { ege: _, ...bez } = nast;
                onNast(v ? { ...bez, ege: 'men' } : bez);
              }}
            >
              {T.ege}
            </Vykl>
          </div>
          <p className="us-pole__pod">{T.egeLead}</p>
          {nast.ege !== undefined && (
            <div className="us-chips" role="group" aria-label={T.ege}>
              <Chip on={nast.ege === 'men'} onClick={() => onNast({ ...nast, ege: 'men' })}>
                {T.egeMen}
              </Chip>
              <Chip on={nast.ege === 'bol'} onClick={() => onNast({ ...nast, ege: 'bol' })}>
                {T.egeBol}
              </Chip>
            </div>
          )}
        </fieldset>
      )}

      <div className="us-vykly">
        <Vykl on={lichnye.zvuk} onChange={(v) => onLichnye({ ...lichnye, zvuk: v })}>
          {T.zvuk}
        </Vykl>
        <Vykl on={lichnye.avto} onChange={(v) => onLichnye({ ...lichnye, avto: v })}>
          {T.avto}
        </Vykl>
      </div>

      {pust !== null && <p className="us-nastroyki__pust">{pust}</p>}
      <button
        type="submit"
        className="btn btn--primary btn--lg us-nastroyki__start"
        disabled={pust !== null}
      >
        {T.start}
      </button>
    </form>
  );
}
