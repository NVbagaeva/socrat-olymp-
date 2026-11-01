'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/Button';
import { VARIANT_HREF } from '@/content/variant';
import { ONLINE_TEXT } from '@/content/variantOnline/text';
import { reshatHref, type Mode, type WorkSettings } from '@/lib/variant/online/link';
import { freshCode } from '@/lib/variant/session';
import { persistent } from '@/lib/storage';

const T = ONLINE_TEXT.nachalo;

/** Адрес последнего варианта, начатого с этой страницы; '' — не было. */
const last = persistent<string>('variant-onlayn:last', '');

const SETTINGS: Record<Mode, WorkSettings> = {
  trening: { mode: 'trening', timer: { kind: 'none' }, kind: 'ege', title: '' },
  kontrol: { mode: 'kontrol', timer: { kind: 'up' }, kind: 'ege', title: '' },
};

/**
 * «Решить вариант онлайн» для ученика, который пришёл сам, без ссылки
 * учителя: выбор режима — и сразу на страницу решения с новым вариантом
 * (все задания 1–13, настройки «Собрать вариант» по умолчанию).
 * Проверка ответов, баллы и сохранение работы — та же страница
 * /variant/reshat/, что и по ссылке учителя.
 */
export function OnlaynStart() {
  const router = useRouter();
  const [busy, setBusy] = useState<Mode | null>(null);
  const lastHref = useSyncExternalStore(last.subscribe, last.read, last.initial);

  function start(mode: Mode) {
    setBusy(mode);
    const href = reshatHref({ code: freshCode(), variant: 1, ...SETTINGS[mode] });
    last.write(href);
    router.push(href);
  }

  return (
    <div className="var vo-nachalo">
      <div className="vo-nachalo__modes">
        {(['trening', 'kontrol'] as const).map((mode) => (
          <section key={mode} className="var-panel vo-nachalo__mode">
            <h2 className="t-h3">{T.modes[mode].title}</h2>
            <p className="vo-nachalo__lead">{T.modes[mode].lead}</p>
            <ul className="vo-nachalo__rules">
              {ONLINE_TEXT.start.rules[mode].map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            <Button
              variant={mode === 'trening' ? 'primary' : 'secondary'}
              loading={busy === mode}
              disabled={busy !== null && busy !== mode}
              onClick={() => start(mode)}
              data-testid={`vo-nachalo-${mode}`}
            >
              {busy === mode ? T.building : T.modes[mode].start}
            </Button>
          </section>
        ))}
      </div>
      <p className="var-field__note">{lastHref === '' ? T.note : `${T.note} ${T.noteResume}`}</p>
      <div className="vo-nachalo__links">
        {lastHref === '' ? null : (
          <Link className="var-link" href={lastHref} data-testid="vo-nachalo-resume">
            {T.resume}
          </Link>
        )}
        <Link className="var-link" href={VARIANT_HREF}>
          {T.teacher}
        </Link>
      </div>
    </div>
  );
}
