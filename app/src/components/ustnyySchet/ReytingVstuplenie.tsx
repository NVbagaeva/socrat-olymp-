'use client';

import Link from 'next/link';
import { AUTH_ENABLED, AUTH_HREF } from '@/lib/auth/config';
import { useSessionUser } from '@/lib/auth/session';
import { href, USTNYY as USTNYY_HREF, USTNYY_TAIL } from '@/lib/paths';
import type { ReytingFormatId } from '@/lib/ustnyySchet/formaty';
import { USTNYY } from '@/content/ustnyySchet';
import type { Lichnye } from './Nastroyki';

const R = USTNYY.reytingIgra;
const RT = USTNYY.reyting;

/**
 * Перед рейтинговой тренировкой: что за формат, правила (время
 * считает сервер), звук и автопроверка. Без входа — приглашение войти
 * и тренировка того же формата без рейтинга.
 */
export function ReytingVstuplenie({
  format,
  lichnye,
  onLichnye,
  onStart,
  onPraktika,
}: {
  format: ReytingFormatId;
  lichnye: Lichnye;
  onLichnye: (l: Lichnye) => void;
  onStart: () => void;
  onPraktika: (() => void) | null;
}) {
  const user = useSessionUser();
  const t = USTNYY.formaty[format];
  return (
    <div className="us-nastroyki">
      <div className="us-nastroyki__format">
        <p className="t-h3">{t.nazvanie}</p>
        <p className="us-nastroyki__lead">{t.kratko}</p>
        <p className="us-nastroyki__lead">{R.pravila}</p>
      </div>
      {!AUTH_ENABLED ? (
        <p className="us-nastroyki__lead">{RT.vykl}</p>
      ) : user === null ? (
        <p className="us-nastroyki__lead">
          {R.oshibki.no_auth} <Link href={AUTH_HREF.voyti}>{RT.voytiKnopka}</Link>
        </p>
      ) : (
        <>
          <div className="us-vykly">
            <label className="us-vykl">
              <input
                type="checkbox"
                role="switch"
                checked={lichnye.avto}
                onChange={(e) => onLichnye({ ...lichnye, avto: e.target.checked })}
              />
              <span className="us-vykl__polzunok" aria-hidden="true" />
              <span>{USTNYY.nastroyki.avto}</span>
            </label>
            <label className="us-vykl">
              <input
                type="checkbox"
                role="switch"
                checked={lichnye.zvuk}
                onChange={(e) => onLichnye({ ...lichnye, zvuk: e.target.checked })}
              />
              <span className="us-vykl__polzunok" aria-hidden="true" />
              <span>{USTNYY.nastroyki.zvuk}</span>
            </label>
          </div>
          <button
            type="button"
            className="btn btn--primary btn--lg us-nastroyki__start"
            onClick={onStart}
          >
            {USTNYY.nastroyki.start}
          </button>
        </>
      )}
      <div className="us-itogi__knopki">
        {onPraktika !== null && (
          <button type="button" className="btn btn--secondary" onClick={onPraktika}>
            {R.praktika}
          </button>
        )}
        <Link className="btn btn--ghost" href={href(USTNYY_HREF, USTNYY_TAIL.reyting)}>
          {R.kReytingu}
        </Link>
      </div>
    </div>
  );
}
