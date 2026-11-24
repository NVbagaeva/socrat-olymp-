'use client';

/**
 * Итоги ДЗ у учителя /kabinet/dz2/itogi/?id=… (docs/kabinet-dz2.md,
 * PR 2г): таблица «ученики × элементы» со статусами и временем; у
 * ученика — ответы по задачам с верным ответом, попытками, подсказками и
 * временем, комментарий и «Вернуть на доработку». На телефоне строка
 * таблицы — карточка ученика.
 */

import Link from 'next/link';
import { clsx } from 'clsx';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Badge, Button, Card, EmptyState, FieldMessage } from '@/components/ui';
import { Confirm, NeedLogin } from '@/components/dz/common';
import { DZ2 } from '@/content/dz2';
import { useSessionUser } from '@/lib/auth/session';
import { sanitizeHtml } from '@/lib/dz/sanitize';
import {
  mozhnoVernut,
  podpisYacheyki,
  poElementam,
  poryadokUchenikov,
  sdali,
  vypolnili,
  yacheyka,
  type Itogi as ItogiDz,
  type OtvetUchenika,
  type UchenikItogov,
} from '@/lib/dz2/itogi';
import { DZ2_HREF } from '@/lib/dz2/links';
import { risunokSrc } from '@/lib/dz2/uchenik';
import { displayAnswer, normalizeAnswer } from '@/lib/otvet';
import { dataRu, nomerEgeRazdela } from '@/lib/zhurnal/vid';
import { tonStatusa } from './MoiDomashki';
import 'katex/dist/katex.min.css';
import './dz2.css';

const t = DZ2.itogi;

function param(name: string): string | null {
  return typeof window === 'undefined'
    ? null
    : new URLSearchParams(window.location.search).get(name);
}

function kodOshibki(e: unknown): string {
  return e instanceof Error && 'code' in e ? String((e as { code: string }).code) : 'unknown';
}

/** Ученик за задачу брался: отвечал, брал подсказку или она закрыта. */
function tronuta(o: OtvetUchenika): boolean {
  return o.state !== 'open' || o.attempts > 0 || o.hint_steps > 0 || (o.answers?.length ?? 0) > 0;
}

function otvetKak(a: string): string {
  const n = normalizeAnswer(a);
  return n.ok ? displayAnswer(n.value) : a;
}

type Zagruzka = { vid: 'gruzim' } | { vid: 'oshibka'; kod: string } | { vid: 'est'; it: ItogiDz };

export function Itogi() {
  const user = useSessionUser();
  const [z, setZ] = useState<Zagruzka>({ vid: 'gruzim' });
  const [vybran, setVybran] = useState<string | null>(null);

  const zagruzit = useCallback(async (): Promise<Zagruzka> => {
    const id = param('id');
    if (id === null || id === '') return { vid: 'oshibka', kod: 'forbidden' };
    try {
      return { vid: 'est', it: await (await import('@/lib/dz2/api')).dz2Itogi(id) };
    } catch (e) {
      return { vid: 'oshibka', kod: kodOshibki(e) };
    }
  }, []);

  useEffect(() => {
    if (user === null || user.role !== 'tutor') return;
    let alive = true;
    void zagruzit().then((r) => {
      if (alive) setZ(r);
    });
    return () => {
      alive = false;
    };
  }, [user, zagruzit]);

  const obnovit = useCallback(async () => {
    const r = await zagruzit();
    if (r.vid === 'est') setZ(r);
  }, [zagruzit]);

  if (user === null) return <NeedLogin text="Войдите в кабинет учителя." />;
  if (user.role !== 'tutor') {
    return <EmptyState title={DZ2.tolkoUchitel} description={DZ2.tolkoUchitelLead} />;
  }
  if (z.vid === 'gruzim') return <p className="auth-form__muted">…</p>;
  if (z.vid === 'oshibka') {
    return (
      <EmptyState
        title={t.oshibka(z.kod)}
        description={t.oshibkaLead}
        action={
          <Link className="btn btn--primary" href={DZ2_HREF.spisok}>
            {DZ2.spisok.zagolovok}
          </Link>
        }
      />
    );
  }

  const it = z.it;
  const ucheniki = poryadokUchenikov(it.ucheniki);
  const tekushchiy = ucheniki.find((u) => u.id === vybran) ?? null;

  return (
    <div className="dz2 dz2-u dz2-itogi" data-page="itogi-dz2" data-dz2={it.id}>
      <Link className="dz2-nazad" href={DZ2_HREF.spisok}>
        {t.nazad}
      </Link>
      <header className="dz2-u-shapka">
        <div className="dz2-kartochka__verh">
          <Badge tone={it.status === 'published' ? 'success' : 'neutral'}>
            {DZ2.spisok.statusy[it.status]}
          </Badge>
        </div>
        <h1 className="t-h2 dz2-u-shapka__nazvanie">{it.title}</h1>
        <p className="t-caption">
          {[
            it.due_at === null ? t.bezSroka : t.srok(dataRu(it.due_at, true)),
            t.sdali(sdali(it.ucheniki), it.ucheniki.length),
            it.publish_at === null ? null : t.otkroetsya(dataRu(it.publish_at, true)),
          ]
            .filter((x): x is string => x !== null)
            .join(' · ')}
        </p>
      </header>

      {ucheniki.length === 0 ? (
        <p className="t-caption">{t.netUchenikov}</p>
      ) : (
        <div className="dz2-tablica-obertka">
          <table className="dz2-tablica">
            <caption className="sr-only">{t.zagolovok}</caption>
            <thead>
              <tr>
                <th scope="col">{t.uchenik}</th>
                <th scope="col">{t.status}</th>
                {it.items.map((e) => (
                  <th scope="col" key={e.id} title={e.title}>
                    <span className="dz2-tablica__nomer">{e.position}</span>
                    <span className="dz2-tablica__vid">
                      {DZ2.uchenik.vidy[e.kind]} №{nomerEgeRazdela(e.task_no)}
                    </span>
                  </th>
                ))}
                <th scope="col">{t.vremya}</th>
              </tr>
            </thead>
            <tbody>
              {ucheniki.map((u) => (
                <tr
                  key={u.id}
                  data-uchenik={u.id}
                  data-status={u.status}
                  className={clsx(vybran === u.id && 'is-vybran')}
                >
                  <th scope="row">
                    <button
                      type="button"
                      className="dz2-tablica__imya"
                      aria-expanded={vybran === u.id}
                      onClick={() => setVybran(vybran === u.id ? null : u.id)}
                    >
                      {u.name ?? '—'}
                    </button>
                  </th>
                  <td data-label={t.status}>
                    <Badge tone={tonStatusa(u.status)}>{t.statusy[u.status]}</Badge>
                  </td>
                  {it.items.map((e) => {
                    const p = u.progress?.[e.id];
                    const y = yacheyka(p);
                    return (
                      <td
                        key={e.id}
                        data-label={`${e.position}. ${e.title}`}
                        data-item={e.id}
                        className={`dz2-yach dz2-yach--${y}`}
                      >
                        <span className="sr-only">{t.yacheyka[y]}: </span>
                        {podpisYacheyki(e, p)}
                      </td>
                    );
                  })}
                  <td data-label={t.vremya}>{t.minut(u.seconds)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">{t.vypolnili}</th>
                <td data-label="" />
                {it.items.map((e) => (
                  <td key={e.id} data-label={`${e.position}. ${e.title}`}>
                    {vypolnili(it.ucheniki, e.id)}/{it.ucheniki.length}
                  </td>
                ))}
                <td data-label="" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {tekushchiy === null ? null : (
        <OtvetyUchenika
          key={tekushchiy.id}
          it={it}
          u={tekushchiy}
          onClose={() => setVybran(null)}
          obnovit={obnovit}
        />
      )}
    </div>
  );
}

function OtvetyUchenika({
  it,
  u,
  onClose,
  obnovit,
}: {
  it: ItogiDz;
  u: UchenikItogov;
  onClose: () => void;
  obnovit: () => Promise<void>;
}) {
  const [otvety, setOtvety] = useState<OtvetUchenika[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kommentariy, setKommentariy] = useState(u.comment ?? '');
  const [dorabotka, setDorabotka] = useState('');
  const [sprosit, setSprosit] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ids = { k: useId(), d: useId() };
  const verh = useRef<HTMLElement>(null);
  const imya = u.name ?? '—';

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const got = await (await import('@/lib/dz2/api')).dz2Otvety(it.id, u.id);
        if (alive) setOtvety(got);
      } catch (e) {
        if (alive) setError(t.oshibka(kodOshibki(e)));
      }
    })();
    verh.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    return () => {
      alive = false;
    };
  }, [it.id, u.id]);

  async function sohranit() {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      await (await import('@/lib/dz2/api')).dz2Comment(it.id, u.id, kommentariy);
      setNote(t.kommentariySohranen);
      await obnovit();
    } catch (e) {
      setError(t.oshibka(kodOshibki(e)));
    }
    setBusy(false);
  }

  async function vernut() {
    setSprosit(false);
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      await (await import('@/lib/dz2/api')).dz2Vernut(it.id, u.id, dorabotka);
      setNote(t.vernuto);
      setDorabotka('');
      await obnovit();
    } catch (e) {
      setError(t.oshibka(kodOshibki(e)));
    }
    setBusy(false);
  }

  return (
    <section ref={verh} className="dz2-otvety" aria-label={t.otvetyZag(imya)} data-otvety={u.id}>
      <Card>
        <div className="dz2-otvety__verh">
          <h2 className="t-h3 dz2-otvety__zag">{t.otvetyZag(imya)}</h2>
          <Badge tone={tonStatusa(u.status)}>{t.statusy[u.status]}</Badge>
          <Button size="sm" variant="ghost" onClick={onClose}>
            {t.zakryt}
          </Button>
        </div>
        {u.submitted_at === undefined ? null : (
          <p className="t-caption">{DZ2.uchenik.sdano(dataRu(u.submitted_at, true))}</p>
        )}

        {otvety === null ? (
          <p className="auth-form__muted">…</p>
        ) : (
          poElementam(it.items, otvety).map(({ e, zadachi }) => (
            <div key={e.id} className="dz2-otvety__element" data-item={e.id}>
              <p className="dz2-otvety__element-zag">
                <span className="dz2-element__vid">
                  {e.position}. {DZ2.uchenik.vidy[e.kind]} · №{nomerEgeRazdela(e.task_no)}
                </span>
                <span className="dz2-element__nazvanie">{e.title}</span>
                <span className="t-caption">{podpisYacheyki(e, u.progress?.[e.id])}</span>
              </p>
              {e.kind === 'chast2' ? (
                <p className="t-caption">{t.chast2}</p>
              ) : zadachi.length === 0 ? (
                <p className="t-caption">{t.bezZadach}</p>
              ) : (
                <>
                  <ol className="dz2-otvety__zadachi">
                    {zadachi.map((o, i) => {
                      /* Нетронутые задачи — одной строкой ниже, не списком. */
                      if (!tronuta(o)) return null;
                      const src = risunokSrc(o.risunok);
                      const zapisi = (o.answers ?? []).filter((a) => a.vid === 'answer');
                      return (
                        <li
                          key={o.id}
                          className="dz2-otvety__zadacha"
                          data-task={o.id}
                          data-state={o.state}
                        >
                          <details>
                            <summary>
                              <span className="dz2-otvety__nomer">{t.zadacha(i + 1)}</span>
                              <span className={`dz2-otvety__sost dz2-otvety__sost--${o.state}`}>
                                {t.sostoyaniya[o.state]}
                              </span>
                              <span className="dz2-otvety__zapisi">
                                {zapisi.length === 0
                                  ? t.netOtvetov
                                  : zapisi.map((a, j) => (
                                      <span
                                        key={j}
                                        className={clsx(
                                          'dz2-u-otvety__otvet',
                                          a.ok ? 'is-da' : 'is-net',
                                        )}
                                      >
                                        {otvetKak(a.a)}
                                      </span>
                                    ))}
                              </span>
                            </summary>
                            <div
                              className="dz2-u-zadacha__uslovie"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(o.question_html) }}
                            />
                            {src === null ? null : (
                              // Картинка условия — своя, из /images/ (risunokSrc).
                              <img
                                className="dz2-u-zadacha__risunok"
                                src={src}
                                alt=""
                                loading="lazy"
                              />
                            )}
                          </details>
                          <p className="t-caption dz2-otvety__meta">
                            {[
                              t.vernyy(displayAnswer(o.answer_key)),
                              t.popytok(o.attempts),
                              o.hint_steps > 0 ? t.podskazok(o.hint_steps) : null,
                              t.minut(o.seconds),
                            ]
                              .filter((x): x is string => x !== null)
                              .join(' · ')}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                  {zadachi.some((o) => !tronuta(o)) ? (
                    <p className="t-caption" data-netronuty>
                      {t.netronuty(
                        zadachi
                          .map((o, i) => (tronuta(o) ? null : i + 1))
                          .filter((x): x is number => x !== null),
                      )}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          ))
        )}

        <div className="dz2-otvety__formy">
          <div className="dz2-otvety__forma">
            <label className="dz2-podzag" htmlFor={ids.k}>
              {t.kommentariy}
            </label>
            <textarea
              id={ids.k}
              className="dz2-textarea"
              rows={3}
              maxLength={2000}
              value={kommentariy}
              onChange={(ev) => setKommentariy(ev.target.value)}
            />
            <p className="t-caption">{t.kommentariyPodskazka}</p>
            <Button variant="secondary" disabled={busy} onClick={() => void sohranit()}>
              {t.sohranitKommentariy}
            </Button>
          </div>
          {mozhnoVernut(u) ? (
            <div className="dz2-otvety__forma">
              <label className="dz2-podzag" htmlFor={ids.d}>
                {t.vernutKommentariy}
              </label>
              <textarea
                id={ids.d}
                className="dz2-textarea"
                rows={2}
                maxLength={2000}
                value={dorabotka}
                onChange={(ev) => setDorabotka(ev.target.value)}
              />
              <p className="t-caption">{t.vernutPodskazka}</p>
              <Button disabled={busy} onClick={() => setSprosit(true)}>
                {t.vernut}
              </Button>
            </div>
          ) : null}
        </div>
        {note === null ? null : (
          <p className="dz2-uspeh" role="status">
            {note}
          </p>
        )}
        {error === null ? null : <FieldMessage tone="error">{error}</FieldMessage>}
      </Card>
      <Confirm
        open={sprosit}
        title={t.vernutVopros}
        text={t.vernutPodskazka}
        action={t.vernut}
        onCancel={() => setSprosit(false)}
        onConfirm={() => void vernut()}
      />
    </section>
  );
}
