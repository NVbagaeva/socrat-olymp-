'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ONLINE_TEXT as T } from '@/content/variantOnline/text';
import { parseReshat } from '@/lib/variant/online/link';
import { tasksSignature, loadSet } from '@/lib/variant/online/work';
import { part2For, type WorkPayload } from '@/lib/variant/online/sessionUi';
import { RabotaUchenika } from '@/components/chast2/RabotaUchenika';
import { WorkRun } from './WorkRun';

type State =
  | { kind: 'loading' }
  | { kind: 'bad' }
  | { kind: 'failed'; list: string }
  | { kind: 'ready'; payload: WorkPayload; outdated: boolean };

/**
 * Страница решения варианта по ссылке учителя: вариант собирается из
 * кода партии в адресе — тем же кодом, что печатный лист.
 */
export function ReshatPage() {
  const query = useSearchParams();
  const link = useMemo(() => parseReshat(new URLSearchParams(query.toString())), [query]);
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (link === null) return undefined;
    let alive = true;
    void Promise.all([loadSet(link.code), part2For(link)])
      .then(([loaded, part2]) => {
        if (!alive) return;
        const tasks = loaded?.set.variants[link.variant - 1]?.tasks;
        if (loaded === null || tasks === undefined) {
          setState({ kind: 'bad' });
        } else if (loaded.failed.length > 0) {
          setState({ kind: 'failed', list: loaded.failed.map((n) => `№${n}`).join(', ') });
        } else {
          setState({
            kind: 'ready',
            outdated: loaded.outdated,
            payload: {
              code: link.code,
              variant: link.variant,
              mode: link.mode,
              timer: link.timer,
              kind: link.kind,
              title: link.title,
              tasks,
              oshibki: null,
              part2,
              sig: tasksSignature(tasks),
            },
          });
        }
      })
      .catch(() => {
        if (alive) setState({ kind: 'failed', list: '' });
      });
    return () => {
      alive = false;
    };
  }, [link]);

  if (link === null) return <p className="vo-warn">{T.start.bad}</p>;
  /* Работа из кабинета: ответы и фото — в неё. */
  const rabota = query.get('rabota');
  if (rabota !== null && /^[0-9a-z-]{8,64}$/i.test(rabota)) {
    return (
      <RabotaUchenika id={rabota} link={{ ...link, mode: 'kontrol', timer: { kind: 'none' } }} />
    );
  }
  if (state.kind === 'loading') {
    return (
      <p className="vo-status" role="status" aria-busy="true">
        {T.start.loading}
      </p>
    );
  }
  if (state.kind === 'bad') return <p className="vo-warn">{T.start.bad}</p>;
  if (state.kind === 'failed') return <p className="vo-warn">{T.start.failed(state.list)}</p>;
  return (
    <WorkRun
      link={link}
      initial={state.payload}
      outdated={state.outdated}
      series={query.get('s') === '1'}
    />
  );
}
