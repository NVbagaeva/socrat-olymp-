'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Input } from '@/components/ui';
import { ONLINE_TEXT as T } from '@/content/variantOnline/text';
import { proverkaHref } from '@/lib/variant/online/link';
import { localProverka, type WorkCheck } from '@/lib/variant/online/proverka';
import { decodeResult, type ResultData } from '@/lib/variant/online/resultCode';
import { loadSet } from '@/lib/variant/online/work';
import type { VariantTask } from '@/lib/variant/types';
import { WorkResult } from './WorkResult';

type State =
  | { kind: 'idle' }
  | { kind: 'bad' }
  | { kind: 'loading' }
  | { kind: 'badSet' }
  | {
      kind: 'ready';
      data: ResultData;
      tasks: VariantTask[];
      check: WorkCheck;
      outdated: boolean;
      code: string;
    };

/**
 * «Проверить результат ученика»: учитель вставляет код результата (или
 * открывает ссылку из QR) — вариант собирается по коду партии, ответы
 * ученика проверяются тем же модулем проверки, что и у ученика.
 * С `moy=1` — ученик открыл свой результат со страницы серии.
 */
export function ProverkaPage() {
  const query = useSearchParams();
  const fromUrl = query.get('r') ?? '';
  const own = query.get('moy') === '1';
  const [text, setText] = useState(fromUrl);
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function open(raw: string) {
    const data = decodeResult(raw);
    if (data === null) {
      setState({ kind: 'bad' });
      return;
    }
    setState({ kind: 'loading' });
    const loaded = await loadSet(data.code);
    const tasks = loaded?.set.variants[data.variant - 1]?.tasks;
    if (loaded === null || tasks === undefined || tasks.length !== data.tasks.length) {
      setState({ kind: 'badSet' });
      return;
    }
    const check = await localProverka(tasks).finish(data.tasks.map((t) => t.answer));
    setState({ kind: 'ready', data, tasks, check, outdated: loaded.outdated, code: raw.trim() });
  }

  useEffect(() => {
    /* Следующим тиком: состояние меняется уже не внутри эффекта. */
    const t = window.setTimeout(() => {
      if (fromUrl !== '') void open(fromUrl);
    }, 0);
    return () => window.clearTimeout(t);
    // Код из адреса читается один раз при входе.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="vo-proverka">
      {own ? null : (
        <form
          className="vo-proverka__form"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim() === '') return;
            window.history.replaceState(null, '', proverkaHref(text.trim()));
            void open(text);
          }}
        >
          <label className="vo-answer__label" htmlFor="vo-proverka-code">
            {T.proverka.input}
          </label>
          <div className="vo-answer__row">
            <Input
              id="vo-proverka-code"
              value={text}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setText(e.target.value)}
              data-testid="vo-proverka-input"
            />
            <Button type="submit" disabled={text.trim() === ''} data-testid="vo-proverka-open">
              {T.proverka.open}
            </Button>
          </div>
        </form>
      )}
      {state.kind === 'bad' ? <p className="vo-warn">{T.proverka.bad}</p> : null}
      {state.kind === 'badSet' ? <p className="vo-warn">{T.proverka.badSet}</p> : null}
      {state.kind === 'loading' ? (
        <p className="vo-status" role="status">
          {T.proverka.loading}
        </p>
      ) : null}
      {state.kind === 'ready' ? (
        <WorkResult
          tasks={state.tasks}
          data={state.data}
          rights={state.check.right}
          correct={state.check.answers}
          title={`${T.start.variant(state.data.variant)} · ${T.seriya.code(state.data.code)}`}
          resultCode={state.code}
          teacher={!own}
          outdated={state.outdated}
        />
      ) : null}
    </div>
  );
}
