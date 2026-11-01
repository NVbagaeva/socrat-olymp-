'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { ONLINE_TEXT } from '@/content/variantOnline/text';
import { reshatHref, type Mode, type WorkSettings } from '@/lib/variant/online/link';
import { nachatyyVariant, zavershen } from '@/lib/variant/online/nachatyy';
import { freshCode } from '@/lib/variant/session';
import { persistent } from '@/lib/storage';
import { Ikonka, type IkonkaId } from './onlayn/Ikonka';

const T = ONLINE_TEXT.nachalo;

/** Адрес последнего варианта, начатого с этой страницы; '' — не было. */
const last = persistent<string>('variant-onlayn:last', '');

const SETTINGS: Record<Mode, WorkSettings> = {
  trening: { mode: 'trening', timer: { kind: 'none' }, kind: 'ege', title: '' },
  kontrol: { mode: 'kontrol', timer: { kind: 'up' }, kind: 'ege', title: '' },
};

const IKONKI: Record<Mode, { golova: IkonkaId; punkty: readonly IkonkaId[] }> = {
  trening: { golova: 'mishen', punkty: ['kvadratGalka', 'vopros', 'stolbiki', 'pauza'] },
  kontrol: { golova: 'sekundomer', punkty: ['zamok', 'vozvrat', 'oblako', 'list'] },
};

/** Без сервера: при сборке адреса нет, в браузере — из localStorage. */
function useNachatyy() {
  const href = useSyncExternalStore(last.subscribe, last.read, last.initial);
  const info = useMemo(() => nachatyyVariant(href), [href]);
  const [konchen, setKonchen] = useState<string | null>(null);
  useEffect(() => {
    if (info === null) return undefined;
    let alive = true;
    void zavershen(info).then((done) => {
      if (alive && done) setKonchen(info.href);
    });
    return () => {
      alive = false;
    };
  }, [info]);
  return info === null || konchen === info.href ? null : info;
}

/**
 * «Решить вариант онлайн»: плашка начатого варианта и два режима.
 * Режим → новый вариант 1–13 (настройки «Собрать вариант» по умолчанию)
 * на странице решения /variant/reshat/ — та же проверка ответов, баллы
 * и сохранение работы, что и по ссылке учителя.
 */
export function OnlaynStart() {
  const router = useRouter();
  const [busy, setBusy] = useState<Mode | null>(null);
  const nachatyy = useNachatyy();

  function start(mode: Mode) {
    setBusy(mode);
    const href = reshatHref({ code: freshCode(), variant: 1, ...SETTINGS[mode] });
    last.write(href);
    router.push(href);
  }

  return (
    <>
      {nachatyy === null ? null : (
        <section className="onl-plashka" aria-label={T.nachatyy.title}>
          <div className="onl-plashka__tekst">
            <p className="onl-plashka__title">
              <b>{T.nachatyy.title}</b>
              <span className="onl-plashka__tochka" aria-hidden="true">
                {' · '}
              </span>
              <span className="onl-plashka__schet">
                {T.nachatyy.resheno(nachatyy.resheno, nachatyy.vsego)}
              </span>
            </p>
            <progress
              className="onl-plashka__polosa"
              max={nachatyy.vsego}
              value={nachatyy.resheno}
              aria-label={T.nachatyy.progress(nachatyy.resheno, nachatyy.vsego)}
            />
          </div>
          <Link
            className="onl-btn onl-btn--siniy"
            href={nachatyy.href}
            data-testid="vo-nachalo-resume"
          >
            {T.nachatyy.dalshe}
            <Ikonka id="strelka" />
          </Link>
        </section>
      )}

      <div className="onl-rezhimy">
        {(['trening', 'kontrol'] as const).map((mode) => (
          <section key={mode} className={clsx('onl-rezhim', `onl-rezhim--${mode}`)}>
            <div className="onl-rezhim__golova">
              <Ikonka id={IKONKI[mode].golova} className="onl-rezhim__znak" />
              <div>
                <h2 className="onl-rezhim__title">{T.modes[mode].title}</h2>
                <p className="onl-rezhim__lead">{T.modes[mode].lead}</p>
              </div>
            </div>
            <ul className="onl-rezhim__punkty">
              {T.modes[mode].punkty.map((punkt, i) => (
                <li key={punkt}>
                  <Ikonka id={IKONKI[mode].punkty[i] ?? 'galka'} />
                  {punkt}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={clsx(
                'onl-btn onl-btn--shirokaya',
                mode === 'trening' ? 'onl-btn--siniy' : 'onl-btn--tyoplyy',
              )}
              aria-busy={busy === mode || undefined}
              disabled={busy !== null}
              onClick={() => start(mode)}
              data-testid={`vo-nachalo-${mode}`}
            >
              {mode === 'trening' ? <Ikonka id="play" /> : null}
              {busy === mode ? T.building : T.modes[mode].start}
            </button>
          </section>
        ))}
      </div>

      <p className="onl-zametka">
        <Ikonka id="info" />
        {T.note}
      </p>
    </>
  );
}
