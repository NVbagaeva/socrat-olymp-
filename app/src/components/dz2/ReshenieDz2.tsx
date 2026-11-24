'use client';

/**
 * Ученик решает ДЗ новой выдачи /kabinet/domashki/reshat/?id=…
 * (docs/kabinet-dz2.md, PR 2в). ДЗ — элементы из разных разделов:
 * задачи (опорные, тренажёр) решаются прямо здесь, ответ сверяет база
 * (dz2_check), попытки и решения — по настройкам учителя; карточки
 * засчитываются на вкладке «Карточки» раздела, глава теории — отметкой
 * «Прочитано». Ход решения хранится в базе после каждой проверки, так что
 * ДЗ открывается с того же места. «Сдать» — dz2_submit.
 */

import Link from 'next/link';
import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, EmptyState, FieldMessage } from '@/components/ui';
import { AnswerInput, FormatHint } from '@/components/tasks/otvet/AnswerInput';
import { Confirm, NeedLogin } from '@/components/dz/common';
import { DZ2 } from '@/content/dz2';
import { useSessionUser } from '@/lib/auth/session';
import { sanitizeHtml } from '@/lib/dz/sanitize';
import { DZ2_HREF, dz2KartochkiHref, dz2TeoriyaHref } from '@/lib/dz2/links';
import { nachatOtmetku } from '@/lib/dz2/otmetka';
import {
  cel,
  estPodskazki,
  pervayaOtkrytaya,
  risunokSrc,
  sdano,
  srokProshel,
  vypolneno,
  type DomashkaUchenika,
  type ElementUchenika,
  type Reshenie,
  type ShagRazbora,
  type ZadachaUchenika,
} from '@/lib/dz2/uchenik';
import { displayAnswer, formatHint, fractionRightHint, normalizeAnswer } from '@/lib/otvet';
import { dataRu, nomerEgeRazdela } from '@/lib/zhurnal/vid';
import { tonStatusa } from './MoiDomashki';
import 'katex/dist/katex.min.css';
import './dz2.css';

const t = DZ2.uchenik;

function param(name: string): string | null {
  return typeof window === 'undefined'
    ? null
    : new URLSearchParams(window.location.search).get(name);
}

function kodOshibki(e: unknown): string {
  return e instanceof Error && 'code' in e ? String((e as { code: string }).code) : 'unknown';
}

type Zagruzka =
  | { vid: 'gruzim' }
  | { vid: 'net' }
  | { vid: 'oshibka'; kod: string }
  | { vid: 'est'; dz: DomashkaUchenika };

export function ReshenieDz2() {
  const user = useSessionUser();
  const [z, setZ] = useState<Zagruzka>({ vid: 'gruzim' });
  const [seychas, setSeychas] = useState(0);

  const zagruzit = useCallback(async (): Promise<Zagruzka> => {
    const id = param('id');
    if (id === null || id === '') return { vid: 'net' };
    try {
      const dz = await (await import('@/lib/dz2/api')).dz2Open(id);
      return { vid: 'est', dz };
    } catch (e) {
      const kod = kodOshibki(e);
      return kod === 'not_your_homework' ? { vid: 'net' } : { vid: 'oshibka', kod };
    }
  }, []);

  useEffect(() => {
    if (user === null || user.role !== 'student') return;
    let alive = true;
    void zagruzit().then((r) => {
      if (!alive) return;
      setZ(r);
      setSeychas(Date.now());
    });
    return () => {
      alive = false;
    };
  }, [user, zagruzit]);

  /* Тихое обновление после проверки: прогресс элементов считает база. */
  const obnovit = useCallback(async () => {
    const r = await zagruzit();
    if (r.vid === 'est') {
      setZ(r);
      setSeychas(Date.now());
    }
  }, [zagruzit]);

  if (user === null) return <NeedLogin text="Войди в кабинет ученика." />;
  if (user.role !== 'student')
    return <EmptyState title={t.tolkoUchenik} description={t.tolkoUchenikLead} />;
  if (z.vid === 'gruzim') return <p className="auth-form__muted">…</p>;
  if (z.vid === 'net') {
    return (
      <EmptyState
        title={t.neNaydeno}
        description={t.neNaydenoLead}
        action={
          <Link className="btn btn--primary" href={DZ2_HREF.moi}>
            {t.zagolovok}
          </Link>
        }
      />
    );
  }
  if (z.vid === 'oshibka') {
    return (
      <p className="dz2-oshibka" role="alert">
        {t.oshibka(z.kod)}
      </p>
    );
  }
  return <Domashka dz={z.dz} seychas={seychas} obnovit={obnovit} />;
}

function Domashka({
  dz,
  seychas,
  obnovit,
}: {
  dz: DomashkaUchenika;
  seychas: number;
  obnovit: () => Promise<void>;
}) {
  const mozhno = dz.zakryto === undefined;
  const [otkryt, setOtkryt] = useState<string | null>(
    () => dz.items.find((e) => !e.progress.completed)?.id ?? dz.items[0]?.id ?? null,
  );
  const [sprosit, setSprosit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const done = vypolneno(dz);

  async function sdat() {
    setSprosit(false);
    setBusy(true);
    setError(null);
    try {
      await (await import('@/lib/dz2/api')).dz2Submit(dz.id);
      await obnovit();
    } catch (e) {
      setError(t.oshibka(kodOshibki(e)));
    }
    setBusy(false);
  }

  const pravila = [
    dz.kontrol
      ? t.pravila.kontrol
      : dz.attempts_limit === undefined
        ? t.pravila.bezLimita
        : t.pravila.popytki(dz.attempts_limit),
    t.pravila.resheniya[dz.solutions_when],
  ];

  return (
    <div
      className="dz2 dz2-u kab-stack"
      data-page="reshat-dz2"
      data-dz2={dz.id}
      data-status={dz.status}
    >
      <Link className="dz2-nazad" href={DZ2_HREF.moi}>
        {t.nazad}
      </Link>
      <header className="dz2-u-shapka">
        <div className="dz2-kartochka__verh">
          <Badge tone={tonStatusa(dz.status)}>{t.statusy[dz.status]}</Badge>
          {dz.kontrol ? <Badge tone="info">{t.kontrol}</Badge> : null}
        </div>
        <h1 className="t-h2 dz2-u-shapka__nazvanie">{dz.title}</h1>
        <p className="t-caption">
          {[
            dz.due_at === undefined ? t.bezSroka : t.srok(dataRu(dz.due_at, true)),
            t.elementov(done, dz.items.length),
          ].join(' · ')}
        </p>
        <p className="t-caption dz2-u-pravila">{pravila.join(' ')}</p>
      </header>

      {dz.return_comment !== undefined && dz.status === 'returned' ? (
        <aside className="dz2-u-zametka dz2-u-zametka--vazhno" data-note="return">
          <p className="dz2-u-zametka__zag">{t.vozvrat}</p>
          <p>{dz.return_comment}</p>
        </aside>
      ) : null}
      {dz.comment !== undefined ? (
        <aside className="dz2-u-zametka" data-note="comment">
          <p className="dz2-u-zametka__zag">{t.kommentariy}</p>
          <p>{dz.comment}</p>
        </aside>
      ) : null}
      {dz.note !== undefined && dz.note !== '' ? (
        <aside className="dz2-u-zametka" data-note="note">
          <p className="dz2-u-zametka__zag">{t.poyasnenie}</p>
          <p>{dz.note}</p>
        </aside>
      ) : null}

      {dz.zakryto !== undefined ? (
        <p
          className={clsx('dz2-u-banner', sdano(dz.status) && 'dz2-u-banner--ok')}
          role="status"
          data-banner={dz.zakryto}
        >
          {dz.zakryto === 'already_submitted' ? `${t.statusy[dz.status]}. ` : ''}
          {t.zakryto[dz.zakryto]}
        </p>
      ) : seychas > 0 && srokProshel(dz, seychas) ? (
        <p className="dz2-u-banner dz2-u-banner--warn" role="status" data-banner="late">
          {t.pozdno}
        </p>
      ) : null}

      <ol className="dz2-u-elementy">
        {dz.items.map((e) => (
          <Element
            key={e.id}
            dz={dz}
            e={e}
            mozhno={mozhno}
            otkryt={otkryt === e.id}
            onToggle={() => setOtkryt(otkryt === e.id ? null : e.id)}
            obnovit={obnovit}
          />
        ))}
      </ol>

      {error === null ? null : <FieldMessage tone="error">{error}</FieldMessage>}

      {mozhno ? (
        <div className="dz2-deystviya dz2-u-sdat">
          <p className="t-caption">{t.sohranyaetsya}</p>
          <Button onClick={() => setSprosit(true)} disabled={busy}>
            {t.sdat}
          </Button>
        </div>
      ) : null}

      <Confirm
        open={sprosit}
        title={t.sdatVopros}
        text={t.sdatTekst(dz.items.length - done)}
        action={t.sdat}
        onCancel={() => setSprosit(false)}
        onConfirm={() => void sdat()}
      />
    </div>
  );
}

function podpisCeli(e: ElementUchenika): string {
  if (e.kind === 'teoriya') return t.cel.teoriya(e.progress.completed);
  const { done, need } = cel(e);
  if (e.kind === 'kartochki') return t.cel.kartochki(done, need);
  if (e.kind === 'opornye' || e.kind === 'trenazher') return t.cel[e.goal_kind](done, need);
  return '';
}

function Element({
  dz,
  e,
  mozhno,
  otkryt,
  onToggle,
  obnovit,
}: {
  dz: DomashkaUchenika;
  e: ElementUchenika;
  mozhno: boolean;
  otkryt: boolean;
  onToggle: () => void;
  obnovit: () => Promise<void>;
}) {
  const bodyId = `dz2-el-${e.id}`;
  const podpis = podpisCeli(e);
  return (
    <li
      className={clsx('dz2-u-element', e.progress.completed && 'is-gotovo')}
      data-item={e.id}
      data-kind={e.kind}
    >
      <Card className="dz2-u-element__karta">
        <button
          type="button"
          className="dz2-u-element__verh"
          aria-expanded={otkryt}
          aria-controls={bodyId}
          onClick={onToggle}
        >
          <span className="dz2-u-element__nomer" aria-hidden="true">
            {e.position}
          </span>
          <span className="dz2-u-element__tekst">
            <span className="dz2-element__vid">
              {t.vidy[e.kind]} · №{nomerEgeRazdela(e.task_no)}
            </span>
            <span className="dz2-element__nazvanie">{e.title}</span>
            {podpis === '' ? null : <span className="t-caption">{podpis}</span>}
          </span>
          {e.progress.completed ? (
            <Badge tone="success" className="dz2-u-element__gotovo">
              {t.gotovo}
            </Badge>
          ) : null}
        </button>
        {otkryt ? (
          <div className="dz2-u-element__telo" id={bodyId}>
            {e.kind === 'opornye' || e.kind === 'trenazher' ? (
              <Zadachi dz={dz} e={e} mozhno={mozhno} obnovit={obnovit} />
            ) : e.kind === 'kartochki' ? (
              <div className="dz2-u-ssylka">
                <p>{t.kartochkiTekst}</p>
                <Link
                  className="btn btn--primary"
                  href={dz2KartochkiHref(e.task_no)}
                  onClick={() =>
                    nachatOtmetku(e.task_no, {
                      item: e.id,
                      homework: dz.id,
                      title: dz.title,
                      need: cel(e).need,
                    })
                  }
                >
                  {t.kartochkiOtkryt}
                </Link>
              </div>
            ) : e.kind === 'teoriya' ? (
              <Teoriya e={e} mozhno={mozhno} obnovit={obnovit} />
            ) : (
              <p className="t-caption">{e.kind === 'variant' ? t.variantTekst : t.chast2Tekst}</p>
            )}
          </div>
        ) : null}
      </Card>
    </li>
  );
}

function Teoriya({
  e,
  mozhno,
  obnovit,
}: {
  e: ElementUchenika;
  mozhno: boolean;
  obnovit: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const glava = typeof e.spec.glava === 'string' ? e.spec.glava : '';
  async function prochital() {
    setBusy(true);
    setError(null);
    try {
      await (await import('@/lib/dz2/api')).dz2Mark(e.id, 1);
      await obnovit();
    } catch (err) {
      setError(t.oshibka(kodOshibki(err)));
    }
    setBusy(false);
  }
  return (
    <div className="dz2-u-ssylka">
      <p>{t.teoriyaTekst}</p>
      <div className="dz2-element__knopki">
        <Link className="btn btn--secondary" href={dz2TeoriyaHref(e.task_no, glava)}>
          {t.teoriyaOtkryt}
        </Link>
        {e.progress.completed ? (
          <p className="dz2-u-verdikt dz2-u-verdikt--da" role="status">
            {t.prochitanoOk}
          </p>
        ) : mozhno ? (
          <Button onClick={() => void prochital()} disabled={busy}>
            {t.prochitano}
          </Button>
        ) : null}
      </div>
      {error === null ? null : <FieldMessage tone="error">{error}</FieldMessage>}
    </div>
  );
}

/* ── Задачи элемента ───────────────────────────────────────────── */

function Zadachi({
  dz,
  e,
  mozhno,
  obnovit,
}: {
  dz: DomashkaUchenika;
  e: ElementUchenika;
  mozhno: boolean;
  obnovit: () => Promise<void>;
}) {
  const tasks = e.tasks ?? [];
  const [index, setIndex] = useState(() => pervayaOtkrytaya(e));
  const task = tasks[index];
  if (task === undefined) return <p className="t-caption">{t.neNaydeno}</p>;
  return (
    <div className="dz2-u-zadachi">
      <nav className="dz2-u-lenta" aria-label={t.lenta}>
        {tasks.map((x, i) => (
          <button
            key={x.id}
            type="button"
            className={clsx(
              'dz2-u-lenta__nomer',
              `is-${x.state}`,
              x.state === 'open' && x.attempts > 0 && 'is-probuet',
              i === index && 'is-tekushchaya',
            )}
            aria-current={i === index ? 'step' : undefined}
            aria-label={`${t.zadacha(i + 1, tasks.length)}${x.state === 'right' ? `: ${t.verno}` : ''}`}
            onClick={() => setIndex(i)}
          >
            {i + 1}
          </button>
        ))}
      </nav>
      <Zadacha
        key={task.id}
        dz={dz}
        e={e}
        task={task}
        nomer={index + 1}
        vsego={tasks.length}
        mozhno={mozhno}
        obnovit={obnovit}
        dalshe={index < tasks.length - 1 ? () => setIndex(index + 1) : null}
      />
    </div>
  );
}

function Razbor({ shagi }: { shagi: readonly ShagRazbora[] }) {
  return (
    <ol className="dz2-u-razbor">
      {shagi.map((s, i) => (
        <li key={i} className="dz2-u-razbor__shag">
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.chto) }} />
          {s.tex === undefined ? null : (
            <div
              className="dz2-u-razbor__formula"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.tex) }}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

/**
 * Одна задача: условие, поле ответа, вердикт, подсказки, решение. Ключ —
 * id задачи: при переключении всё заводится заново со своим отсчётом времени.
 */
function Zadacha({
  dz,
  e,
  task,
  nomer,
  vsego,
  mozhno,
  obnovit,
  dalshe,
}: {
  dz: DomashkaUchenika;
  e: ElementUchenika;
  task: ZadachaUchenika;
  nomer: number;
  vsego: number;
  mozhno: boolean;
  obnovit: () => Promise<void>;
  dalshe: (() => void) | null;
}) {
  const posledniy = task.answers?.filter((a) => a.vid === 'answer').at(-1)?.a ?? '';
  const [state, setState] = useState(task.state);
  const [attempts, setAttempts] = useState(task.attempts);
  const [value, setValue] = useState(task.state === 'open' ? '' : posledniy);
  const [hint, setHint] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reshenie, setReshenie] = useState<Reshenie | null>(task.solution ?? null);
  const [shagi, setShagi] = useState<ShagRazbora[]>([]);
  const [shagovBolshe, setShagovBolshe] = useState(true);
  const [otvety, setOtvety] = useState(task.answers?.filter((a) => a.vid === 'answer') ?? []);
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const podskazki = estPodskazki(dz, e) && mozhno;
  const canAnswer = mozhno && state === 'open';
  const left = dz.attempts_limit === undefined ? null : Math.max(0, dz.attempts_limit - attempts);
  const src = risunokSrc(task.risunok);

  /* Уже взятые шаги подсказки — заново из базы (она их не пересчитывает). */
  const uzheVzyato = task.hint_steps;
  useEffect(() => {
    if (!podskazki || uzheVzyato === 0 || state !== 'open') return;
    let alive = true;
    void (async () => {
      const api = await import('@/lib/dz2/api');
      const got: ShagRazbora[] = [];
      for (let n = 1; n <= uzheVzyato; n += 1) {
        const r = await api.dz2Hint(task.id, n).catch(() => ({ step: null }));
        if (r.step === null) break;
        got.push(r.step);
      }
      if (alive) setShagi(got);
    })();
    return () => {
      alive = false;
    };
    // Только при открытии задачи.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function proverit() {
    if (!canAnswer || busy) return;
    setError(null);
    setHint(null);
    setWrong(false);
    const read = normalizeAnswer(value);
    if (!read.ok) {
      if (read.problem === 'empty') return;
      /* Неверная запись — подсказка сразу, попытка не тратится. Дробь
         проверяет база: верное значение — тоже только подсказка. */
      if (read.problem !== 'fraction') {
        setHint(formatHint(read.problem, read.meant));
        return;
      }
    }
    setBusy(true);
    const seconds = (Date.now() - shownAt.current) / 1000;
    shownAt.current = Date.now();
    try {
      const r = await (await import('@/lib/dz2/api')).dz2Check(task.id, value, seconds);
      if (r.kind === 'format') setHint(formatHint('other', null));
      else if (r.kind === 'fractionRight') setHint(fractionRightHint(r.decimal));
      else if (r.kind === 'closed') {
        setState(r.state);
        await obnovit();
      } else {
        setState(r.state);
        setAttempts(r.attempts);
        setWrong(r.kind === 'wrong');
        setOtvety((o) => [
          ...o,
          { a: value, ok: r.kind === 'right', vid: 'answer', at: new Date().toISOString() },
        ]);
        if (r.solution !== null) setReshenie(r.solution);
        void obnovit();
      }
    } catch (err) {
      setError(t.oshibka(kodOshibki(err)));
    }
    setBusy(false);
  }

  async function podskazka() {
    setError(null);
    try {
      const r = await (await import('@/lib/dz2/api')).dz2Hint(task.id, shagi.length + 1);
      if (r.step === null) setShagovBolshe(false);
      else setShagi((s) => [...s, r.step as ShagRazbora]);
    } catch (err) {
      setError(t.oshibka(kodOshibki(err)));
    }
  }

  const zakryta = state !== 'open';
  return (
    <article className="dz2-u-zadacha" data-task={task.id} data-state={state}>
      <p className="t-caption dz2-u-zadacha__nomer">{t.zadacha(nomer, vsego)}</p>
      <div
        className="dz2-u-zadacha__uslovie"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(task.question_html) }}
      />
      {src === null ? null : (
        // Картинка условия — своя, из /images/ (risunokSrc).
        <img className="dz2-u-zadacha__risunok" src={src} alt="" loading="lazy" />
      )}

      <form
        className="dz2-u-otvet"
        onSubmit={(ev) => {
          ev.preventDefault();
          void proverit();
        }}
      >
        <p className="dz2-u-otvet__label" id={`otvet-${task.id}`}>
          {t.otvet}
        </p>
        <AnswerInput
          value={value}
          state={
            state === 'right'
              ? 'success'
              : state === 'open'
                ? wrong
                  ? 'error'
                  : 'default'
                : 'error'
          }
          aria-labelledby={`otvet-${task.id}`}
          readOnly={!canAnswer}
          onChange={(next) => {
            setValue(next);
            setHint(null);
            setWrong(false);
          }}
        />
        {hint === null ? null : <FormatHint text={hint} />}
        <div className="dz2-element__knopki">
          {canAnswer ? (
            <Button type="submit" disabled={busy || value.trim() === ''}>
              {busy ? t.proveryayu : t.proverit}
            </Button>
          ) : null}
          {canAnswer && podskazki && shagovBolshe ? (
            <Button variant="secondary" onClick={() => void podskazka()}>
              {shagi.length === 0 ? t.podskazka : t.sleduyushchiyShag}
            </Button>
          ) : null}
          {dalshe !== null ? (
            <Button variant="ghost" onClick={dalshe}>
              {t.dalshe}
            </Button>
          ) : null}
        </div>
        {canAnswer ? (
          <p className="t-caption" data-left={left ?? 'inf'}>
            {left === null ? t.bezOgranicheniy : t.ostalos(left)}
          </p>
        ) : null}
      </form>

      {state === 'right' ? (
        <p className="dz2-u-verdikt dz2-u-verdikt--da" role="status">
          {t.verno}
        </p>
      ) : state === 'wrong' ? (
        <p className="dz2-u-verdikt dz2-u-verdikt--net" role="status">
          {t.nevernoZakryto}
        </p>
      ) : wrong ? (
        <p className="dz2-u-verdikt dz2-u-verdikt--net" role="status">
          {t.neverno}
        </p>
      ) : null}

      {otvety.length > 0 ? (
        <p className="t-caption dz2-u-otvety">
          {t.tvoiOtvety}:{' '}
          {otvety.map((o, i) => {
            const n = normalizeAnswer(o.a);
            return (
              <span key={i} className={clsx('dz2-u-otvety__otvet', o.ok ? 'is-da' : 'is-net')}>
                {n.ok ? displayAnswer(n.value) : o.a}
              </span>
            );
          })}
        </p>
      ) : null}

      {shagi.length > 0 && !zakryta ? (
        <div className="dz2-u-podskazka" data-block="podskazka">
          <p className="dz2-u-zametka__zag">{t.podskazka}</p>
          <Razbor shagi={shagi} />
          {shagovBolshe ? null : <p className="t-caption">{t.podskazkiVse}</p>}
          <p className="t-caption">{t.podskazkaPometka}</p>
        </div>
      ) : null}

      {reshenie !== null ? (
        <div className="dz2-u-reshenie" data-block="reshenie">
          <p className="dz2-u-zametka__zag">{t.reshenie}</p>
          <p>{t.vernyyOtvet(displayAnswer(reshenie.answer))}</p>
          {reshenie.razbor?.shagi !== undefined ? <Razbor shagi={reshenie.razbor.shagi} /> : null}
        </div>
      ) : zakryta && dz.solutions_when !== 'instant' ? (
        <p className="t-caption">{t.resheniePozzhe[dz.solutions_when]}</p>
      ) : null}

      {error === null ? null : <FieldMessage tone="error">{error}</FieldMessage>}
    </article>
  );
}
