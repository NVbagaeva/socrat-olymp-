'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { MAX_BALL } from '@/content/variantOnline/bally';
import { CHAST2_TEXT as T } from '@/content/variantOnline/chast2Text';
import { errorText } from '@/components/kabinet/useKabinet';
import { punktKey, vvodEst, vvodTex } from '@/lib/chast2/sostoyanie';
import type { QItem } from '@/lib/chast2/ochered';
import { izRaboty, otpechatok, izmeneniya, vRabotu } from '@/lib/raboty/sinhron';
import { normalizeAnswer } from '@/lib/variant/online/normalize';
import type { WorkPayload, WorkUi } from '@/lib/variant/online/sessionUi';
import { part2Of } from '@/lib/variant/online/sessionUi';
import type { RabotaCtx } from './rabotaCtx';

const EMPTY: readonly QItem[] = [];

/**
 * Перед отправкой учителю: что заполнено, сколько фото, предупреждения
 * («без решения — 0 баллов», фото ещё в пути). Отправка — один раз;
 * «Вернуться к работе» открывает работу снова с теми же ответами.
 */
export function RabotaOtpravka({
  payload,
  ui,
  rabota,
  onBack,
  onSent,
}: {
  payload: WorkPayload;
  ui: WorkUi;
  rabota: RabotaCtx;
  onBack: () => void;
  onSent: () => void;
}) {
  const part2 = useMemo(() => part2Of(payload), [payload]);
  const samo = rabota.sw.work.part2Mode === 'self';
  const queue = useSyncExternalStore(
    (fn) => rabota.ochered.subscribe(fn),
    () => rabota.ochered.items(),
    () => EMPTY,
  );
  const mine = queue.filter((q) => q.workId === rabota.id);
  const pending = mine.filter((q) => q.status !== 'err').length;
  const errors = mine.filter((q) => q.status === 'err').length;
  const offline = mine.some((q) => q.offline);
  const [state, setState] = useState<'saving' | 'ready' | 'sending' | 'error'>('saving');
  const [error, setError] = useState<string | null>(null);

  /* Последние ответы с экрана — в работу, до показа сводки. */
  useEffect(() => {
    let alive = true;
    const fromServer = izRaboty(payload.tasks, rabota.sw.answers);
    const saved = otpechatok(
      vRabotu(payload.tasks, part2, fromServer.answers, fromServer.chast2, samo),
    );
    const list = izmeneniya(
      vRabotu(payload.tasks, part2, ui.answers, ui.chast2, samo),
      saved,
    ).filter((z) => rabota.sw.editable.includes(z.taskNo));
    void (async () => {
      try {
        for (const z of list) await rabota.api.saveAnswer(rabota.id, z.taskNo, z.punkt, z.vvod);
        if (alive) setState('ready');
      } catch (e) {
        if (!alive) return;
        setError(errorText(e));
        setState('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [payload, part2, ui, rabota, samo]);

  const part1 = payload.tasks.map((t, i) => ({
    no: t.egeNumber,
    ok: normalizeAnswer(ui.answers[i] ?? '').ok,
  }));
  const empty1 = part1.filter((x) => !x.ok).map((x) => `№${x.no}`);
  const photosOf = (no: number) =>
    rabota.sw.photos.filter((p) => p.taskNo === no).length +
    mine.filter((q) => q.taskNo === no).length;

  async function send() {
    setState('sending');
    setError(null);
    try {
      await rabota.api.submitWork(rabota.id);
      onSent();
    } catch (e) {
      setError(errorText(e));
      setState('error');
    }
  }

  const bezFoto = part2.map((z) => z.no).filter((no) => photosOf(no) === 0);
  const blocked = pending > 0 || state === 'saving' || state === 'sending';
  return (
    <section className="c2-review" data-testid="c2-review" aria-labelledby="c2-review-title">
      <h2 id="c2-review-title" className="vo-h2">
        {T.rabota.review.title}
      </h2>
      <p>
        {T.rabota.review.part1(part1.filter((x) => x.ok).length, part1.length)}
        {empty1.length > 0 ? (
          <span className="c2-hint"> · {T.rabota.review.empty(empty1.join(', '))}</span>
        ) : null}
      </p>
      {part2.length > 0 ? (
        <div className="vo-table-wrap">
          <table className="vo-table c2-table">
            <caption className="c2-review__cap">{T.rabota.review.part2}</caption>
            <thead>
              <tr>
                <th scope="col">{T.rabota.review.head[0]}</th>
                <th scope="col">{T.rabota.review.head[1]}</th>
                <th scope="col">{samo ? T.result.head[3] : T.rabota.review.head[2]}</th>
                <th scope="col">
                  <span className="sr-only">!</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {part2.map((z) => {
                const otvety = z.punkty
                  .map((p, i) =>
                    p.pole === null
                      ? null
                      : vvodTex(p.pole, ui.chast2.vvod[punktKey(z.no, i)] ?? null),
                  )
                  .filter((x): x is string => x !== null);
                const est = z.punkty.some(
                  (p, i) => p.pole !== null && vvodEst(ui.chast2.vvod[punktKey(z.no, i)] ?? null),
                );
                const n = photosOf(z.no);
                return (
                  <tr key={z.no} data-testid={`c2-review-${z.no}`}>
                    <th scope="row">{z.no}</th>
                    <td>
                      {!est
                        ? T.rabota.review.net
                        : otvety
                            .filter((x) => x !== '')
                            .map((x, i) => (
                              <span key={i} className="c2-table__punkt">
                                <Tex text={`$${x}$`} />
                              </span>
                            ))}
                    </td>
                    <td>
                      {samo
                        ? T.rabota.review.samoBall(ui.chast2.ball[z.no], MAX_BALL[z.no])
                        : T.rabota.review.fotoN(n)}
                    </td>
                    <td>
                      {!samo && n === 0 ? (
                        <span className="c2-review__warn">{T.rabota.review.noPhotoShort}</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
      {!samo && bezFoto.length > 0 ? (
        <p className="vo-warn" data-testid="c2-review-nophoto">
          {T.rabota.review.noPhotoList(bezFoto.map((n) => `№${n}`).join(', '))}
        </p>
      ) : null}
      {pending > 0 ? (
        <p className="vo-warn" role="status">
          {offline ? T.rabota.review.offline : T.rabota.review.pending(pending)}
        </p>
      ) : null}
      {errors > 0 ? <p className="vo-warn">{T.rabota.review.errors}</p> : null}
      <p className="c2-hint">{T.rabota.review.once}</p>
      {error === null ? null : (
        <p className={clsx('vo-warn')} role="alert">
          {error}
        </p>
      )}
      <div className="vo-actions">
        <Button variant="secondary" onClick={onBack} data-testid="c2-review-back">
          {T.rabota.review.back}
        </Button>
        <Button
          onClick={() => void send()}
          disabled={blocked}
          loading={state === 'sending'}
          data-testid="c2-review-send"
        >
          {state === 'sending'
            ? T.rabota.review.sending
            : samo
              ? T.rabota.review.sendSelf
              : T.rabota.review.send}
        </Button>
      </div>
    </section>
  );
}
