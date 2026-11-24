'use client';

/**
 * Уведомления /kabinet/uvedomleniya/ (docs/kabinet-uvedomleniya.md, PR 3б):
 * вкладка «Уведомления» — список, новые сверху и с отметкой, при открытии
 * они становятся прочитанными; «Показать ещё» — постранично. Вкладка
 * «Настройки» (?vkladka=nastroyki) — каналы по событиям, тихие часы,
 * часовой пояс, сводка учителю.
 */

import Link from 'next/link';
import { clsx } from 'clsx';
import { useEffect, useId, useState } from 'react';
import { Button, EmptyState, FieldMessage } from '@/components/ui';
import { NeedLogin } from '@/components/dz/common';
import { UVED } from '@/content/uvedomleniya';
import { useSessionUser } from '@/lib/auth/session';
import {
  kogda,
  poyasa,
  ssylka,
  tekst,
  vazhnoe,
  vremyaVerno,
  zapros,
  type Kanal,
  type Nastroyki as NastroykiT,
  type Uvedomlenie,
} from '@/lib/uvedomleniya/model';
import { OBNOVIT } from '@/lib/uvedomleniya/sobytiya';
import './uvedomleniya.css';

const PORCIYA = 30;

type Vkladka = 'spisok' | 'nastroyki';

function vkladkaIzAdresa(): Vkladka {
  if (typeof window === 'undefined') return 'spisok';
  return new URLSearchParams(window.location.search).get('vkladka') === 'nastroyki'
    ? 'nastroyki'
    : 'spisok';
}

export function Centr() {
  const user = useSessionUser();
  const [vkladka, setVkladka] = useState<Vkladka>('spisok');
  const ids = { spisok: useId(), nastroyki: useId() };

  /* Вкладка из адреса — после гидратации (страница статическая). */
  useEffect(() => {
    const v = vkladkaIzAdresa();
    if (v !== 'spisok') queueMicrotask(() => setVkladka(v));
  }, []);

  if (user === null) return <NeedLogin text={UVED.tolkoVhod} />;

  function pereyti(v: Vkladka) {
    setVkladka(v);
    const url = new URL(window.location.href);
    if (v === 'nastroyki') url.searchParams.set('vkladka', 'nastroyki');
    else url.searchParams.delete('vkladka');
    window.history.replaceState(window.history.state, '', url.pathname + url.search);
  }

  return (
    <div className="uved" data-page="uvedomleniya">
      <h1 className="t-h2">{UVED.zagolovok}</h1>
      <div className="uved-vkladki" role="tablist" aria-label={UVED.zagolovok}>
        {(['spisok', 'nastroyki'] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            id={`${ids[v]}-tab`}
            aria-controls={ids[v]}
            aria-selected={vkladka === v}
            className="uved-vkladki__vkladka"
            onClick={() => pereyti(v)}
          >
            {UVED.vkladki[v]}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={ids[vkladka]} aria-labelledby={`${ids[vkladka]}-tab`}>
        {vkladka === 'spisok' ? (
          <Spisok uchitel={user.role === 'tutor'} />
        ) : (
          <Nastroyki uchitel={user.role === 'tutor'} />
        )}
      </div>
    </div>
  );
}

/* ── Список ─────────────────────────────────────────────────────── */

function Spisok({ uchitel }: { uchitel: boolean }) {
  const [list, setList] = useState<Uvedomlenie[] | null>(null);
  const [esche, setEsche] = useState(false);
  const [error, setError] = useState(false);
  const [seychas, setSeychas] = useState(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const api = await import('@/lib/uvedomleniya/api');
        const got = await api.moiUvedomleniya(PORCIYA);
        if (!alive) return;
        setList(got);
        setEsche(got.length === PORCIYA);
        setSeychas(Date.now());
        /* Открыл список — новые прочитаны; отметка «новое» остаётся до ухода со страницы. */
        const novye = got.filter((u) => !u.read).map((u) => u.id);
        if (novye.length > 0) {
          await api.uvedomleniyaProchitat(novye);
          window.dispatchEvent(new Event(OBNOVIT));
        }
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function dalshe() {
    if (list === null || list.length === 0) return;
    try {
      const api = await import('@/lib/uvedomleniya/api');
      const got = await api.moiUvedomleniya(PORCIYA, list[list.length - 1]!.id);
      setList([...list, ...got]);
      setEsche(got.length === PORCIYA);
      const novye = got.filter((u) => !u.read).map((u) => u.id);
      if (novye.length > 0) {
        await api.uvedomleniyaProchitat(novye);
        window.dispatchEvent(new Event(OBNOVIT));
      }
    } catch {
      setError(true);
    }
  }

  if (error) {
    return (
      <p className="uved-oshibka" role="alert">
        {UVED.oshibka}
      </p>
    );
  }
  if (list === null) return <p className="auth-form__muted">…</p>;
  if (list.length === 0) {
    return (
      <EmptyState title={UVED.pusto} description={uchitel ? UVED.pustoUchitel : UVED.pustoLead} />
    );
  }
  return (
    <div className="uved">
      <ul className="uved-spisok">
        {list.map((u) => {
          const kuda = ssylka(u);
          const telo = (
            <>
              <span className="uved-stroka__znak" aria-hidden="true" />
              <span className="uved-stroka__tekst">
                <span>
                  {!u.read ? <span className="sr-only">{UVED.novoe}: </span> : null}
                  {tekst(u)}
                </span>
                <span className="uved-stroka__kogda">
                  {seychas === 0 ? '' : kogda(u.visible_at, seychas)}
                </span>
              </span>
            </>
          );
          const cls = clsx('uved-stroka', !u.read && 'is-novoe', vazhnoe(u) && 'is-vazhnoe');
          return (
            <li key={u.id} data-uved={u.id} data-event={u.event}>
              {kuda === null ? (
                <div className={cls}>{telo}</div>
              ) : (
                <Link className={cls} href={kuda}>
                  {telo}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      {esche ? (
        <Button variant="secondary" onClick={() => void dalshe()}>
          {UVED.esche}
        </Button>
      ) : null}
    </div>
  );
}

/* ── Настройки ──────────────────────────────────────────────────── */

const t = UVED.nastroyki;

function Nastroyki({ uchitel }: { uchitel: boolean }) {
  const [n, setN] = useState<NastroykiT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ids = { from: useId(), to: useId(), tz: useId() };

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const got = await (await import('@/lib/uvedomleniya/api')).moiNastroyki();
        if (alive) setN(got);
      } catch {
        if (alive) setError(t.oshibka);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (n === null) {
    return error === null ? (
      <p className="auth-form__muted">…</p>
    ) : (
      <FieldMessage tone="error">{error}</FieldMessage>
    );
  }

  const kanaly: Kanal[] = n.dostupno;
  const nastroyki = n;

  function kanal(e: string, k: Kanal, v: boolean) {
    setNote(null);
    const sobytie = e as keyof NastroykiT['kanaly'];
    const old = nastroyki.kanaly[sobytie] ?? { pochta: true, push: true };
    setN({ ...nastroyki, kanaly: { ...nastroyki.kanaly, [sobytie]: { ...old, [k]: v } } });
  }

  async function sohranit() {
    setError(null);
    setNote(null);
    if (!vremyaVerno(nastroyki.quiet_from) || !vremyaVerno(nastroyki.quiet_to)) {
      setError(t.nevernoeVremya);
      return;
    }
    setBusy(true);
    try {
      setN(await (await import('@/lib/uvedomleniya/api')).sohranitNastroyki(zapros(nastroyki)));
      setNote(t.sohraneno);
    } catch {
      setError(t.oshibka);
    }
    setBusy(false);
  }

  return (
    <form
      className="uved-nastroyki"
      onSubmit={(ev) => {
        ev.preventDefault();
        void sohranit();
      }}
    >
      <fieldset>
        <legend>{t.kanalyZag}</legend>
        <p className="t-caption">{t.kanalyLead}</p>
        {kanaly.length === 0 ? (
          <p className="uved-zametka" data-kanaly="net">
            {t.kanalyNet}
          </p>
        ) : (
          <table className="uved-tablica">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">{t.kanalyZag}</span>
                </th>
                {kanaly.map((k) => (
                  <th scope="col" key={k} style={{ textAlign: 'center' }}>
                    {t.kanaly[k]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {n.sobytiya.map((e) => (
                <tr key={e}>
                  <th scope="row">{t.sobytiya[e]}</th>
                  {kanaly.map((k) => (
                    <td key={k}>
                      <input
                        type="checkbox"
                        aria-label={`${t.sobytiya[e]}: ${t.kanaly[k]}`}
                        checked={n.kanaly[e]?.[k] ?? true}
                        onChange={(ev) => kanal(e, k, ev.target.checked)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </fieldset>

      <fieldset>
        <legend>{t.tihieZag}</legend>
        <p className="t-caption">{t.tihieLead}</p>
        <label className="uved-galka">
          <input
            type="checkbox"
            checked={n.quiet_on}
            onChange={(ev) => setN({ ...n, quiet_on: ev.target.checked })}
          />
          {t.tihieVkl}
        </label>
        <div className="uved-ryad">
          <label htmlFor={ids.from}>{t.s}</label>
          <input
            id={ids.from}
            className="uved-pole uved-pole--vremya"
            type="time"
            value={n.quiet_from}
            disabled={!n.quiet_on}
            onChange={(ev) => setN({ ...n, quiet_from: ev.target.value })}
          />
          <label htmlFor={ids.to}>{t.do}</label>
          <input
            id={ids.to}
            className="uved-pole uved-pole--vremya"
            type="time"
            value={n.quiet_to}
            disabled={!n.quiet_on}
            onChange={(ev) => setN({ ...n, quiet_to: ev.target.value })}
          />
        </div>
        <div className="uved-ryad">
          <label htmlFor={ids.tz}>{t.poyas}</label>
          <select
            id={ids.tz}
            className="uved-pole"
            value={n.tz}
            onChange={(ev) => setN({ ...n, tz: ev.target.value })}
          >
            {poyasa(n.tz).map((p) => (
              <option key={p.tz} value={p.tz}>
                {p.nazvanie}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {uchitel ? (
        <fieldset>
          <legend>{t.digestZag}</legend>
          <p className="t-caption">{t.digestLead}</p>
          {(['day', 'week', 'off'] as const).map((d) => (
            <label key={d} className="uved-galka">
              <input
                type="radio"
                name="digest"
                checked={n.digest === d}
                onChange={() => setN({ ...n, digest: d })}
              />
              {t.digest[d]}
            </label>
          ))}
        </fieldset>
      ) : null}

      <div className="uved-ryad">
        <Button type="submit" disabled={busy}>
          {t.sohranit}
        </Button>
      </div>
      {note === null ? null : (
        <p className="uved-uspeh" role="status">
          {note}
        </p>
      )}
      {error === null ? null : <FieldMessage tone="error">{error}</FieldMessage>}
    </form>
  );
}
