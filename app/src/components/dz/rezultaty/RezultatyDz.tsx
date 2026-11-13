'use client';

/**
 * Результаты ДЗ для репетитора: таблица «ученик × пункт ДЗ» со
 * столбцами по источникам (Карточки / Опорные / Тренажёр). Клетка —
 * верно / неверно / не делал, попытки, время; у набора карточек — «Знаю»
 * и «Повторить». По клику — что ввёл ученик, верный ответ, решение.
 * Ниже — сводка по типам и навыкам, «Выдать работу над ошибками»,
 * печать, комментарии, закрыть приём.
 */

import Link from 'next/link';
import { clsx } from 'clsx';
import { useEffect, useId, useMemo, useState } from 'react';
import { Checkbox, FieldLabel } from '@/components/ui';
import { ShagiResheniya } from '@/components/tasks/steklo';
import { DZ, SOLUTIONS_WHEN, dueRu, dzError } from '@/content/dz';
import { DZK, ISTOCHNIK, ISTOCHNIK_VKLADKA } from '@/content/dzIstochniki';
import type { HwFull } from '@/lib/dz/api';
import { zagruzitKatalogi } from '@/lib/dz/katalog/zagruzka';
import type { KatalogRazdela } from '@/lib/dz/katalog/types';
import { DZ_HREF, issueHref, printHref } from '@/lib/dz/links';
import { markOf, tasksOf } from '@/lib/dz/results';
import { sanitizeHtml } from '@/lib/dz/sanitize';
import { oshibka } from '@/lib/dz/sborka/oshibki';
import type { HwAnswerView, HwPartView, HwTaskView, Istochnik } from '@/lib/dz/types';
import { displayAnswer } from '@/lib/otvet';
import { dzApi, errorCode } from '../common';
import { shagiDz } from '../reshenie/ReshenieDz';
import './rezultaty.css';

const t = DZ.results;
const PORYADOK: Istochnik[] = ['kartochki', 'opornye', 'trenazher'];

function vremya(seconds: number): string {
  if (seconds < 60) return `${seconds} с`;
  return `${Math.round(seconds / 60)} мин`;
}

type Ton = 'verno' | 'chast' | 'neverno' | 'reshaet' | 'nichego';

interface Kletka {
  part: HwPartView;
  units: HwTaskView[];
  answers: (HwAnswerView | null)[];
  ton: Ton;
  tekst: string;
  podpis: string;
  seconds: number;
}

function kletka(part: HwPartView, units: HwTaskView[], answers: (HwAnswerView | null)[]): Kletka {
  const seconds = answers.reduce((s, a) => s + (a?.seconds ?? 0), 0);
  if (units.length === 0) return { part, units, answers, ton: 'nichego', tekst: '—', podpis: '', seconds };
  if (part.source === 'kartochki') {
    const znayu = answers.filter((a) => a?.state === 'known' || a?.state === 'right').length;
    const povt = answers.filter((a) => a?.state === 'repeat' || a?.state === 'wrong').length;
    const sdelano = znayu + povt;
    return {
      part,
      units,
      answers,
      ton: sdelano === 0 ? 'nichego' : sdelano < units.length ? 'reshaet' : povt === 0 ? 'verno' : 'chast',
      tekst: sdelano === 0 ? '' : `${znayu}/${units.length}`,
      podpis: sdelano === 0 ? DZK.rezultaty.nichego : `${DZK.rezultaty.znayu(znayu)} · ${DZK.rezultaty.povtorit(povt)}`,
      seconds,
    };
  }
  const marks = answers.map(markOf);
  const verno = marks.filter((m) => m === 'right').length;
  const nevern = marks.filter((m) => m === 'wrong' || m === 'revealed').length;
  const popytok = answers.reduce((s, a) => s + (a?.attempts ?? 0), 0);
  const nichego = marks.every((m) => m === 'none');
  const ton: Ton = nichego
    ? 'nichego'
    : verno === units.length
      ? 'verno'
      : nevern === units.length
        ? 'neverno'
        : verno + nevern < units.length
          ? 'reshaet'
          : 'chast';
  return {
    part,
    units,
    answers,
    ton,
    tekst: nichego ? '' : units.length === 1 ? String(popytok) : `${verno}/${units.length}`,
    podpis: nichego
      ? DZK.rezultaty.nichego
      : `${verno === units.length ? DZK.rezultaty.verno : `${verno} ${DZK.rezultaty.verno}`}, ${DZK.rezultaty.popytok(popytok)}`,
    seconds,
  };
}

export function RezultatyDz({ full, reload }: { full: HwFull; reload: () => Promise<void> }) {
  const hw = full.hw;
  const [kat, setKat] = useState<Map<number, KatalogRazdela>>(new Map());
  useEffect(() => {
    void zagruzitKatalogi(hw.sections)
      .then(setKat)
      .catch(() => undefined);
  }, [hw.sections]);

  /* Столбцы: пункты по источникам, внутри — по порядку ДЗ. */
  const parts = useMemo(
    () =>
      [...full.parts].sort(
        (a, b) => PORYADOK.indexOf(a.source) - PORYADOK.indexOf(b.source) || a.position - b.position,
      ),
    [full.parts],
  );
  const byKey = useMemo(() => new Map(full.answers.map((a) => [`${a.taskId}|${a.userId}`, a])), [full.answers]);
  const rows = useMemo(
    () =>
      full.recipients.map((r) => {
        const mine = tasksOf(full.tasks, r.userId);
        const kletki = parts.map((p) => {
          const units = mine.filter((u) => u.partId === p.id);
          return kletka(p, units, units.map((u) => byKey.get(`${u.id}|${r.userId}`) ?? null));
        });
        return { student: r, kletki, seconds: kletki.reduce((s, k) => s + k.seconds, 0) };
      }),
    [full, parts, byKey],
  );
  const gruppy = PORYADOK.map((s) => ({ s, n: parts.filter((p) => p.source === s).length })).filter((g) => g.n > 0);
  const [open, setOpen] = useState<{ name: string; k: Kletka } | null>(null);
  const [grid, setGrid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitted = full.recipients.filter((r) => r.submittedAt !== null).length;
  const estOshibki = rows.some((r) => r.kletki.some((k) => k.answers.some((a) => oshibka(a))));

  /* Сводка: тренажёр — по типам, опорные — по блокам, карточки — по наборам. */
  const svodka = useMemo(() => {
    const imya = (p: HwPartView, u: HwTaskView): string => {
      if (p.source !== 'trenazher') return p.titleHtml;
      for (const g of kat.get(p.taskNo)?.trenazher ?? []) {
        const tip = g.tipy.find((x) => x.id === u.kind);
        if (tip !== undefined) return tip.nazvanieHtml;
      }
      return p.titleHtml;
    };
    const map = new Map<string, { source: Istochnik; html: string; erred: Set<string>; assigned: Set<string> }>();
    for (const row of rows) {
      for (const k of row.kletki) {
        k.units.forEach((u, i) => {
          const html = imya(k.part, u);
          const key = `${k.part.source}|${html}`;
          const s = map.get(key) ?? { source: k.part.source, html, erred: new Set<string>(), assigned: new Set<string>() };
          s.assigned.add(row.student.userId);
          if (oshibka(k.answers[i] ?? null)) s.erred.add(row.student.userId);
          map.set(key, s);
        });
      }
    }
    return [...map.values()];
  }, [rows, kat]);

  async function act(run: () => Promise<unknown>) {
    setError(null);
    try {
      await run();
      await reload();
    } catch (e) {
      setError(dzError(errorCode(e)));
    }
  }

  return (
    <div className="rez" data-page="domashka-repetitor">
      <Link className="dz-back" href={DZ_HREF.kabinet}>
        {t.back}
      </Link>
      <header className="rez-head stk-glass">
        <h1 className="rez-title">{hw.title}</h1>
        <p className="rez-muted">
          {hw.dueAt === null ? DZ.list.noDue : DZ.list.due(dueRu(hw.dueAt))} ·{' '}
          {submitted === 0 ? DZ.list.nobodySubmitted : DZ.list.submitted(submitted, rows.length)}
        </p>
        <p className="rez-muted">
          {t.settings(
            hw.attemptsLimit === null ? DZ.issue.attemptsOptions.null! : String(hw.attemptsLimit),
            SOLUTIONS_WHEN[hw.solutionsWhen],
          )}
          {hw.noHints ? ` · ${DZK.nastroyki.bezPodskazok.toLowerCase()}` : ''}
        </p>
      </header>

      <section className="rez-blok stk-glass" data-section="table" aria-labelledby="rez-table">
        <h2 className="rez-h2" id="rez-table">
          {DZK.rezultaty.title}
        </h2>
        {rows.length === 0 ? (
          <p>{t.nobody}</p>
        ) : (
          <div className="rez-tablica-wrap">
            <table className="rez-tablica">
              <thead>
                <tr>
                  <th rowSpan={2} scope="col" className="rez-tablica__imya">
                    {DZK.rezultaty.uchenik}
                  </th>
                  {gruppy.map((g) => (
                    <th key={g.s} colSpan={g.n} scope="colgroup" className={`rez-gruppa rez-gruppa--${g.s}`}>
                      {ISTOCHNIK_VKLADKA[g.s]}
                    </th>
                  ))}
                  <th rowSpan={2} scope="col">
                    {t.total}
                  </th>
                </tr>
                <tr>
                  {parts.map((p) => (
                    <th key={p.id} scope="col" className="rez-punkt" title={p.titleHtml.replace(/<[^>]+>/g, '')}>
                      {p.position}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.student.userId} data-student={row.student.userId}>
                    <th scope="row" className="rez-tablica__imya">
                      {row.student.name}
                      {row.student.submittedAt === null ? null : <span className="rez-sdano">{DZ.status.submitted}</span>}
                    </th>
                    {row.kletki.map((k) => (
                      <td key={k.part.id}>
                        {k.units.length === 0 ? (
                          <span className="rez-pusto">—</span>
                        ) : (
                          <button
                            type="button"
                            className={clsx('rez-kletka', `rez-kletka--${k.ton}`)}
                            data-ton={k.ton}
                            aria-label={`${row.student.name}, пункт ${k.part.position} (${ISTOCHNIK[k.part.source]}): ${k.podpis}`}
                            onClick={() => setOpen({ name: row.student.name, k })}
                          >
                            {k.tekst}
                          </button>
                        )}
                      </td>
                    ))}
                    <td className="rez-itog">{vremya(row.seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <ul className="rez-legenda">
          {(
            [
              ['verno', t.legendRight],
              ['chast', 'частично'],
              ['neverno', t.legendWrong],
              ['reshaet', t.legendTrying],
              ['nichego', t.legendNone],
            ] as [Ton, string][]
          ).map(([ton, label]) => (
            <li key={ton}>
              <span className={clsx('rez-kletka', 'rez-kletka--legenda', `rez-kletka--${ton}`)} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
        <ol className="rez-punkty-spisok">
          {[...full.parts]
            .sort((a, b) => a.position - b.position)
            .map((p) => (
              <li key={p.id}>
                <span className={`rdz-metka rdz-metka--${p.source}`}>{ISTOCHNIK[p.source]}</span>{' '}
                <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.titleHtml) }} />
              </li>
            ))}
        </ol>
      </section>

      {open === null ? null : (
        <Podrobno
          key={`${open.name}-${open.k.part.id}`}
          full={full}
          name={open.name}
          k={open.k}
          onClose={() => setOpen(null)}
          onComment={(c) => act(async () => (await dzApi()).updatePartComment(open.k.part.id, c))}
        />
      )}

      <section className="rez-blok stk-glass" data-section="kinds" aria-labelledby="rez-svodka">
        <h2 className="rez-h2" id="rez-svodka">
          {DZK.rezultaty.svodka}
        </h2>
        <ul className="rez-svodka">
          {svodka.map((s) => (
            <li key={`${s.source}|${s.html}`} className={s.erred.size > 0 ? 'has-errors' : undefined}>
              <span className={`rdz-metka rdz-metka--${s.source}`}>{ISTOCHNIK[s.source]}</span>{' '}
              <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.html) }} /> —{' '}
              {DZK.rezultaty.oshiblis(s.erred.size, s.assigned.size)}
            </li>
          ))}
        </ul>
        {estOshibki ? (
          <Link className="stk-btn stk-btn--primary rez-oshibki" href={issueHref({ origin: 'oshibki', mistakesOf: hw.id })} data-action="oshibki">
            {DZK.rezultaty.vydatOshibki}
          </Link>
        ) : (
          <p className="rez-muted">{t.mistakesNone}</p>
        )}
      </section>

      <section className="rez-blok stk-glass" data-section="print">
        <h2 className="rez-h2">{t.print}</h2>
        <Checkbox checked={grid} onChange={(e) => setGrid(e.target.checked)}>
          {t.grid}
        </Checkbox>
        <div className="rez-knopki">
          <a className="stk-btn" href={printHref(hw.id, 'uchenik', grid)} target="_blank" rel="noreferrer">
            {DZK.rezultaty.pechatUchenik}
          </a>
          <a className="stk-btn" href={printHref(hw.id, 'uchitel', grid)} target="_blank" rel="noreferrer">
            {DZK.rezultaty.pechatUchitel}
          </a>
        </div>
      </section>

      <Zametka
        label={t.note}
        value={hw.note}
        onSave={(note) => act(async () => (await dzApi()).updateHomework(hw.id, { note }))}
        section="note"
      />

      {error === null ? null : (
        <p className="rdz-banner is-warn" role="alert">
          {error}
        </p>
      )}
      <div className="rez-knopki">
        {hw.closedAt === null ? (
          <button type="button" className="stk-btn stk-btn--tihaya" onClick={() => void act(async () => (await dzApi()).updateHomework(hw.id, { closed: true }))}>
            {t.close}
          </button>
        ) : (
          <>
            <span className="rez-muted">{t.closed}</span>
            <button type="button" className="stk-btn stk-btn--tihaya" onClick={() => void act(async () => (await dzApi()).updateHomework(hw.id, { closed: false }))}>
              {t.reopen}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Podrobno({
  full,
  name,
  k,
  onClose,
  onComment,
}: {
  full: HwFull;
  name: string;
  k: Kletka;
  onClose: () => void;
  onComment: (c: string) => Promise<void>;
}) {
  return (
    <section className="rez-blok rez-podrobno stk-glass" data-section="cell" aria-label={`${name}, пункт ${k.part.position}`}>
      <div className="rez-podrobno__verh">
        <h2 className="rez-h2">
          {name} · <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(k.part.titleHtml) }} />
        </h2>
        <button type="button" className="stk-btn stk-btn--sm stk-btn--tihaya" onClick={onClose}>
          {DZK.rezultaty.zakryt}
        </button>
      </div>
      <p className="rez-muted">
        <span className={`rdz-metka rdz-metka--${k.part.source}`}>{ISTOCHNIK[k.part.source]}</span> {k.podpis} · {vremya(k.seconds)}
      </p>
      <ol className="rez-edinitsy">
        {k.units.map((u, i) => {
          const a = k.answers[i] ?? null;
          const key = full.keys.get(u.id);
          const mark = a?.state === 'known' ? 'known' : a?.state === 'repeat' ? 'repeat' : markOf(a);
          return (
            <li key={u.id} className={`rez-edinitsa is-${mark}`} data-task={u.id}>
              <div className="rez-edinitsa__uslovie" dangerouslySetInnerHTML={{ __html: sanitizeHtml(u.questionHtml) }} />
              <dl className="rez-fakty">
                <div>
                  <dt>{DZK.rezultaty.chtoVvel}</dt>
                  <dd data-field="entered">
                    {u.answerKind === 'self'
                      ? a?.state === 'known'
                        ? DZK.uchenik.kartochki.znayu
                        : a?.state === 'repeat'
                          ? DZK.uchenik.kartochki.povtorit
                          : t.noEntries
                      : a === null || a.entries.length === 0
                        ? t.noEntries
                        : a.entries.map((e, j) => (
                            <span key={j} className={clsx('dz-entry', e.ok ? 'is-right' : 'is-wrong')}>
                              {e.a === 'da' ? 'верно' : e.a === 'net' ? 'неверно' : e.a}
                            </span>
                          ))}
                  </dd>
                </div>
                {u.answerKind === 'self' ? null : (
                  <div>
                    <dt>{t.attemptsTitle}</dt>
                    <dd>{t.attempts(a?.attempts ?? 0)}</dd>
                  </div>
                )}
                {key === undefined ? null : (
                  <>
                    <div>
                      <dt>{DZK.rezultaty.otvetVernyy}</dt>
                      <dd data-field="correct">
                        {key.answer === 'da' ? 'верно' : key.answer === 'net' ? 'неверно' : displayAnswer(key.answer)}
                      </dd>
                    </div>
                    <div>
                      <dt>{t.source}</dt>
                      <dd>{key.source}</dd>
                    </div>
                  </>
                )}
              </dl>
              {key === undefined || key.razbor.shagi.length === 0 ? null : (
                <details className="rez-reshenie">
                  <summary>{t.solution}</summary>
                  <ShagiResheniya shagi={shagiDz(key.razbor)} />
                </details>
              )}
            </li>
          );
        })}
      </ol>
      <Zametka label={t.comment} hint={t.commentHint} value={k.part.comment ?? ''} onSave={onComment} section="task-comment" />
    </section>
  );
}

function Zametka({
  label,
  hint,
  value,
  onSave,
  section,
}: {
  label: string;
  hint?: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  section: string;
}) {
  const [text, setText] = useState(value);
  const [saved, setSaved] = useState(false);
  const id = useId();
  return (
    <form
      className="rez-blok stk-glass rez-zametka"
      data-section={section}
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(false);
        void onSave(text).then(() => setSaved(true));
      }}
    >
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        id={id}
        className="input dz-textarea"
        value={text}
        maxLength={section === 'note' ? 2000 : 1000}
        rows={2}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
      />
      {hint === undefined ? null : <p className="rez-muted">{hint}</p>}
      <div className="rez-knopki">
        <button type="submit" className="stk-btn stk-btn--sm">
          {t.save}
        </button>
        {saved ? <span className="dz-ok">{t.saved}</span> : null}
      </div>
    </form>
  );
}
