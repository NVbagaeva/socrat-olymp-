'use client';

import { clsx } from 'clsx';
import { Fragment, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Tex } from '@/components/ui/Tex';
import { MAX_BALL } from '@/content/variantOnline/bally';
import { CHAST2_TEXT as T } from '@/content/variantOnline/chast2Text';
import { kriteriiZadaniya } from '@/content/variantOnline/kriterii';
import { punktKey, vvodTex } from '@/lib/chast2/sostoyanie';
import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';
import type { RabotyApi } from '@/lib/raboty/api';
import { izRaboty } from '@/lib/raboty/sinhron';
import type { Grade, Photo, StudentWork } from '@/lib/raboty/types';
import { displayAnswer } from '@/lib/variant/online/normalize';
import type { VariantTask } from '@/lib/variant/types';
import { Kriterii } from './Kriterii';
import { MetkiSloy } from './Metki';
import { Reshenie } from './Chast2Card';

/** Текст строки критериев, которую выбрал проверяющий. */
export function strokaKriteriya(z: Chast2Zadacha, g: Grade | undefined): string | null {
  if (g === undefined || g.kriteriy === null) return null;
  const k = kriteriiZadaniya(z.no, z.utochnenie)[g.kriteriy];
  return k?.ili[g.ili ?? 0] ?? null;
}

/** Фото с пометками учителя. */
export function FotoSMetkami({
  api,
  photo,
  layer,
  n,
}: {
  api: Pick<RabotyApi, 'photoUrl'>;
  photo: Photo;
  layer: StudentWork['marks'][string] | undefined;
  n: number;
}) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void api.photoUrl(photo.id).then(
      (u) => alive && setSrc(u),
      () => alive && setSrc(null),
    );
    return () => {
      alive = false;
    };
  }, [api, photo.id]);
  return (
    <figure className="c2-fm">
      <div className="c2-fm__box" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
        {src === null ? null : <img src={src} alt={`${T.foto.photo(n)}`} />}
        <MetkiSloy layer={layer} width={photo.width} height={photo.height} />
      </div>
      <figcaption className="c2-hint">{T.foto.photo(n)}</figcaption>
    </figure>
  );
}

/**
 * Работа после отправки — глазами ученика. До проверки: часть 1 (сразу),
 * часть 2 «на проверке» и плашка «Полное количество баллов будет после
 * проверки учителем». После: таблица «№ — балл / максимум — строка
 * критериев — комментарий», фото с пометками, эталонные решения.
 */
export function RabotaItog({
  sw,
  tasks,
  part2,
  api,
  actions,
}: {
  sw: StudentWork;
  tasks: readonly VariantTask[];
  part2: readonly Chast2Zadacha[];
  api: Pick<RabotyApi, 'photoUrl'>;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const status = sw.submission?.status ?? 'draft';
  const checked = status === 'checked';
  const samo = sw.work.part2Mode === 'self';
  const grade = (no: number) => sw.grades.find((g) => g.taskNo === no);
  const mine = izRaboty(tasks, sw.answers);
  const score = sw.score;
  const returned = sw.grades.filter((g) => g.naDorabotke);

  return (
    <section className="vo-result c2-itogr" data-testid="c2-rabota-itog">
      <header className="vo-result__head">
        <h2 className="vo-result__title">
          {sw.work.title}{' '}
          <span className={clsx('c2-status', `is-${status}`)} data-testid="c2-status">
            {T.itog.status[status]}
          </span>
        </h2>
        <p className="vo-result__meta">{T.rabota.tutor(sw.tutor.name)}</p>
      </header>

      {score === null ? null : (
        <p className="c2-counter" data-testid="c2-itog-counter">
          {T.itog.counter(
            score.part1,
            checked ? score.part2 : null,
            checked ? score.total : null,
            score.test,
          )}
        </p>
      )}
      {checked ? (
        <p className="c2-hint">
          {T.itog.approx} {samo ? T.itog.selfNote : ''}
        </p>
      ) : (
        <p className="c2-plaque" data-testid="c2-plaque">
          {T.itog.plaque}
        </p>
      )}
      {status === 'returned' ? (
        <div className="vo-warn">
          <p>{T.rabota.returned}</p>
          <ul>
            {returned.map((g) => (
              <li key={g.taskNo}>
                {T.rabota.returnedTask(g.taskNo)}
                {g.comment === null ? '' : `: ${g.comment}`}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {sw.submission?.comment ? (
        <p className="c2-comment">
          <b>{T.itog.comment}:</b> {sw.submission.comment}
        </p>
      ) : null}

      <h3 className="vo-h3">{T.itog.part1}</h3>
      <div className="vo-table-wrap">
        <table className="vo-table">
          <thead>
            <tr>
              <th scope="col">№</th>
              <th scope="col">Ваш ответ</th>
              <th scope="col">{T.itog.head[1]}</th>
              <th scope="col">{T.itog.head[3]}</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => {
              const g = grade(t.egeNumber);
              const v = mine.answers[i] ?? '';
              return (
                <tr
                  key={t.taskId}
                  className={g !== undefined && g.ball > 0 ? 'is-right' : 'is-wrong'}
                >
                  <th scope="row">{t.egeNumber}</th>
                  <td>{v === '' ? '—' : displayAnswer(v)}</td>
                  <td>
                    {g === undefined ? '—' : T.itog.ballOf(g.ball, 1)}
                    {g?.vruchnuyu ? <span className="vo-mini">{T.itog.vruchnuyu}</span> : null}
                  </td>
                  <td>{g?.comment ?? ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {part2.length === 0 ? null : (
        <>
          <h3 className="vo-h3">{T.itog.part2}</h3>
          <div className="vo-table-wrap">
            <table className="vo-table c2-table">
              <thead>
                <tr>
                  {T.itog.head.map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                  <th scope="col">
                    <span className="sr-only">{T.itog.reshenie}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {part2.map((z) => {
                  const g = grade(z.no);
                  const photos = sw.photos.filter((p) => p.taskNo === z.no);
                  const vidno = checked || g?.naDorabotke === true;
                  return (
                    <Fragment key={z.no}>
                      <tr data-testid={`c2-itog-${z.no}`}>
                        <th scope="row">{z.no}</th>
                        <td>
                          {!vidno || g === undefined
                            ? T.itog.part2Wait
                            : g.naDorabotke
                              ? T.itog.dorabotka
                              : T.itog.ballOf(g.ball, MAX_BALL[z.no])}
                          {checked && g?.nePristupal ? (
                            <span className="vo-mini">{T.itog.nePristupal}</span>
                          ) : null}
                        </td>
                        <td className="c2-table__krit">
                          {checked ? <Tex text={strokaKriteriya(z, g) ?? '—'} /> : '—'}
                        </td>
                        <td>{vidno ? (g?.comment ?? '') : ''}</td>
                        <td>
                          <button
                            type="button"
                            className="vo-link"
                            aria-expanded={open === z.no}
                            data-testid={`c2-itog-open-${z.no}`}
                            onClick={() => setOpen(open === z.no ? null : z.no)}
                          >
                            {open === z.no
                              ? T.itog.hide
                              : checked
                                ? T.itog.reshenie
                                : T.itog.photos}
                          </button>
                        </td>
                      </tr>
                      {open === z.no ? (
                        <tr className="vo-table__razbor">
                          <td colSpan={5}>
                            <div className="c2-itogr__task">
                              <p className="c2-hint">
                                {z.punkty
                                  .map((p, i) =>
                                    p.pole === null
                                      ? null
                                      : vvodTex(
                                          p.pole,
                                          mine.chast2.vvod[punktKey(z.no, i)] ?? null,
                                        ),
                                  )
                                  .filter((x): x is string => x !== null && x !== '')
                                  .map((x, i) => (
                                    <span key={i} className="c2-table__punkt">
                                      <Tex text={`$${x}$`} />
                                    </span>
                                  ))}
                              </p>
                              {photos.length > 0 ? (
                                <div className="c2-fm-list">
                                  {photos.map((p, i) => (
                                    <FotoSMetkami
                                      key={p.id}
                                      api={api}
                                      photo={p}
                                      layer={sw.marks[p.id]}
                                      n={i + 1}
                                    />
                                  ))}
                                </div>
                              ) : null}
                              {checked ? (
                                <>
                                  <Reshenie z={z} />
                                  <Kriterii
                                    kriterii={kriteriiZadaniya(z.no, z.utochnenie)}
                                    max={MAX_BALL[z.no]}
                                    ball={g?.ball}
                                    stroka={
                                      g?.kriteriy === null || g === undefined
                                        ? undefined
                                        : `${kriteriiZadaniya(z.no)[g.kriteriy]?.ball ?? g.ball}:${g.ili ?? 0}`
                                    }
                                    onPick={() => undefined}
                                    readOnly
                                    testId={`c2-itog-krit-${z.no}`}
                                  />
                                </>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {actions === undefined ? null : <div className="vo-actions">{actions}</div>}
    </section>
  );
}
