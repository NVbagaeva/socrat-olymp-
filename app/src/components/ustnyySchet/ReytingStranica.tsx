'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AUTH_ENABLED, AUTH_HREF } from '@/lib/auth/config';
import { useSessionUser } from '@/lib/auth/session';
import {
  api,
  type MoyProfil,
  type Period,
  type Reyting,
  type ReytingStroka,
} from '@/lib/ustnyySchet/api';
import { dlitelnost } from '@/lib/ustnyySchet/chasy';
import { REYTING_FORMATY, type ReytingFormatId } from '@/lib/ustnyySchet/formaty';
import { reytingHref } from '@/lib/ustnyySchet/zapros';
import { USTNYY } from '@/content/ustnyySchet';

const T = USTNYY.reyting;
const PERIODY: Period[] = ['den', 'nedelya', 'vse'];

function Rezultat({
  r,
  tip,
}: {
  r: Pick<ReytingStroka, 'verno' | 'vsego' | 'score_ms'>;
  tip: 'vremya' | 'seriya';
}) {
  if (tip === 'vremya') return <>{T.verno(r.verno, r.vsego)}</>;
  return (
    <>
      {dlitelnost(r.score_ms)}
      <span className="us-reyting__pod"> · {T.oshibok(r.vsego - r.verno)}</span>
    </>
  );
}

/** Блок «Мой ник»: сменить, случайный, показ в общем рейтинге. */
function MoyNik({ profil, onProfil }: { profil: MoyProfil; onProfil: (p: MoyProfil) => void }) {
  const [nick, setNick] = useState('');
  const [soobshchenie, setSoobshchenie] = useState<string | null>(null);
  const [zanyat, setZanyat] = useState(false);
  const deystvie = async (f: () => Promise<void>) => {
    setZanyat(true);
    try {
      await f();
    } catch {
      setSoobshchenie(T.oshibka);
    } finally {
      setZanyat(false);
    }
  };
  return (
    <section className="us-nik" aria-labelledby="us-nik-zag">
      <h2 id="us-nik-zag" className="t-h3">
        {T.nickZag}: <span className="us-nik__tekushiy">{profil.nick}</span>
      </h2>
      <p className="us-blok__lead">{T.nickLead}</p>
      <form
        className="us-nik__forma"
        onSubmit={(e) => {
          e.preventDefault();
          void deystvie(async () => {
            const r = await api.setNick(nick);
            if (r.error !== undefined) {
              setSoobshchenie(T.nickOshibki[r.error] ?? T.oshibka);
              return;
            }
            onProfil({ ...profil, nick: r.nick ?? nick, auto: false });
            setNick('');
            setSoobshchenie(T.nickGotov);
          });
        }}
      >
        <label className="sr-only" htmlFor="us-nik-pole">
          {T.nickPole}
        </label>
        <input
          id="us-nik-pole"
          className="us-nik__pole"
          type="text"
          maxLength={20}
          autoComplete="off"
          placeholder={T.nickPole}
          value={nick}
          onChange={(e) => setNick(e.target.value)}
        />
        <button type="submit" className="btn btn--primary" disabled={zanyat || nick.trim() === ''}>
          {T.sohranit}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={zanyat}
          onClick={() =>
            void deystvie(async () => {
              const r = await api.randomNick();
              onProfil({ ...profil, nick: r.nick, auto: true });
              setSoobshchenie(T.nickGotov);
            })
          }
        >
          {T.sluchaynyy}
        </button>
      </form>
      <p className="us-nik__soobshchenie" role="status">
        {soobshchenie ?? ''}
      </p>
      <label className="us-vykl">
        <input
          type="checkbox"
          role="switch"
          checked={profil.pokazyvat}
          disabled={zanyat}
          onChange={(e) => {
            const on = e.target.checked;
            /* Сразу — на экране; не удалось сохранить — вернуть. */
            onProfil({ ...profil, pokazyvat: on });
            void deystvie(async () => {
              try {
                await api.setPokazyvat(on);
              } catch (err) {
                onProfil({ ...profil, pokazyvat: !on });
                throw err;
              }
            });
          }}
        />
        <span className="us-vykl__polzunok" aria-hidden="true" />
        <span>{T.pokazyvat}</span>
      </label>
    </section>
  );
}

/**
 * Рейтинг устного счёта: формат, период, «Мой класс», таблица (топ-100)
 * и своё место всегда. Только для вошедших — данные даёт функция базы
 * ustnyy_reyting: в таблице ники, у репетитора класса — и имена.
 */
export function ReytingStranica() {
  const user = useSessionUser();
  const [format, setFormat] = useState<ReytingFormatId>('vyzov-dnya');
  const [period, setPeriod] = useState<Period>('den');
  /* «Мой класс» можно открыть ссылкой со страницы класса: ?klass=… */
  const [klass, setKlass] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('klass'),
  );
  const [klassy, setKlassy] = useState<{ id: string; name: string }[]>([]);
  const [data, setData] = useState<Reyting | null>(null);
  const [oshibka, setOshibka] = useState(false);
  const [profil, setProfil] = useState<MoyProfil | null>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (user === null) return;
    let otmena = false;
    api
      .moyProfil()
      .then((p) => !otmena && setProfil(p))
      .catch(() => undefined);
    api
      .klassy()
      .then((k) => !otmena && setKlassy(k))
      .catch(() => undefined);
    return () => {
      otmena = true;
    };
  }, [user]);

  useEffect(() => {
    if (user === null) return;
    let otmena = false;
    api
      .reyting(format, period, klass)
      .then((r) => {
        if (otmena) return;
        setData(r);
        setOshibka(false);
      })
      .catch(() => {
        if (otmena) return;
        setData(null);
        setOshibka(true);
      });
    return () => {
      otmena = true;
    };
  }, [user, format, period, klass, n]);

  const obnovit = useCallback(() => setN((x) => x + 1), []);

  if (!AUTH_ENABLED) return <p className="us-blok__lead">{T.vykl}</p>;
  if (user === null) {
    return (
      <div className="us-reyting__vhod">
        <p className="us-blok__lead">{T.voyti}</p>
        <Link className="btn btn--primary" href={AUTH_HREF.voyti}>
          {T.voytiKnopka}
        </Link>
      </div>
    );
  }

  const tip = data?.tip ?? REYTING_FORMATY.find((f) => f.id === format)?.tip ?? 'vremya';
  const uchitel = user.role === 'tutor';
  const yaVTablice = data?.rows.some((r) => r.ya) ?? false;

  return (
    <div className="us-reyting">
      <div className="us-chips" role="group" aria-label="Формат">
        {REYTING_FORMATY.map((f) => (
          <button
            key={f.id}
            type="button"
            className={clsx('us-chip', format === f.id && 'is-on')}
            aria-pressed={format === f.id}
            onClick={() => setFormat(f.id)}
          >
            {USTNYY.formaty[f.id].nazvanie}
          </button>
        ))}
      </div>
      <div className="us-reyting__filtry">
        <div className="us-chips" role="group" aria-label="Период">
          {PERIODY.map((p) => (
            <button
              key={p}
              type="button"
              className={clsx('us-chip', period === p && 'is-on')}
              aria-pressed={period === p}
              onClick={() => setPeriod(p)}
            >
              {T.periody[p]}
            </button>
          ))}
        </div>
        {klassy.length > 0 && (
          <label className="us-reyting__klass">
            <span>{T.moyKlass}</span>
            <select
              value={klass ?? ''}
              onChange={(e) => setKlass(e.target.value === '' ? null : e.target.value)}
            >
              <option value="">{T.vse}</option>
              {klassy.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <p className="us-reyting__format">{USTNYY.formaty[format].kratko}</p>

      {oshibka ? (
        <div>
          <p className="us-blok__lead">{T.oshibka}</p>
          <button type="button" className="btn btn--secondary" onClick={obnovit}>
            {T.eshcheRaz}
          </button>
        </div>
      ) : data === null ? (
        <p className="us-blok__lead" aria-busy="true">
          {T.zagruzka}
        </p>
      ) : data.rows.length === 0 ? (
        <p className="us-blok__lead">{T.pusto}</p>
      ) : (
        <div className="us-reyting__wrap">
          <table className="us-reyting__tablica">
            <thead>
              <tr>
                <th scope="col">{T.mesto}</th>
                <th scope="col">{uchitel && klass !== null ? T.uchenik : T.nick}</th>
                <th scope="col">{T.rezultat}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.mesto} className={clsx(r.ya && 'is-ya')}>
                  <td>{r.mesto}</td>
                  <td>
                    {r.imya !== undefined ? (
                      <>
                        {r.imya}
                        <span className="us-reyting__pod"> · {r.nick}</span>
                      </>
                    ) : (
                      r.nick
                    )}
                    {r.ya && <span className="sr-only"> — {T.ya}</span>}
                  </td>
                  <td>
                    <Rezultat r={r} tip={tip} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.ya != null && !yaVTablice && (
        <div className="us-reyting__ya">
          <p>
            <strong>
              {T.tvoeMesto}: {data.ya.mesto}
            </strong>{' '}
            · {data.ya.nick} · <Rezultat r={data.ya} tip={tip} />
          </p>
          {!data.ya.pokazyvat && <p className="us-reyting__pod">{T.tyNeVTablice}</p>}
        </div>
      )}

      {profil !== null && profil.mozhno && (
        <Link className="btn btn--primary" href={reytingHref(format)}>
          {T.nachat}
        </Link>
      )}
      {profil !== null && !profil.mozhno && (
        <p className="us-blok__lead">{uchitel ? T.neUchenik : T.netSoglasiya}</p>
      )}

      {profil !== null && profil.mozhno && <MoyNik profil={profil} onProfil={setProfil} />}
    </div>
  );
}
