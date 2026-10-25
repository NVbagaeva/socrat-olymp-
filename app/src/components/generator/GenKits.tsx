'use client';

import { useId, useState, useSyncExternalStore } from 'react';
import { GEN_UI } from '@/content/generatorUi';
import { counted } from '@/lib/plural';
import {
  bothHref,
  findKit,
  generatorVersion,
  loadKits,
  NO_KITS,
  parseKitCode,
  subscribeKits,
  type Kit,
  type KitScope,
} from '@/lib/komplekt';

const T = GEN_UI.komplekty;

function dateText(iso: string | null): string {
  if (iso === null) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/**
 * «Мои комплекты» внутри генератора: скачанные наборы (последние 20,
 * lib/komplekt.ts) и поиск по коду с бумаги. Набор своего раздела
 * открывается в генераторе, чужого — ссылками на листы.
 */
export function GenKits({
  scope,
  slot,
  onOpen,
  onSeed,
}: {
  scope: KitScope;
  slot: string;
  /** Открыть набор своего раздела: адрес листа ученика. */
  onOpen: (kit: Kit) => void;
  /** Кода нет в истории: собрать по настройкам на экране с этим seed. */
  onSeed: (id: string) => void;
}) {
  const history = useSyncExternalStore(subscribeKits, loadKits, () => NO_KITS);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const codeId = useId();

  const restore = () => {
    const parsed = parseKitCode(code);
    if (parsed === null) {
      setMessage(T.plohoy);
      return;
    }
    const found = findKit(`${parsed.id}-${parsed.version}`);
    if (found !== null && found.slot === slot) {
      onOpen(found);
      return;
    }
    if (found !== null) {
      setMessage(T.drugoyRazdel(found.section));
      return;
    }
    if (parsed.version !== generatorVersion(scope)) {
      setMessage(T.staraya);
      return;
    }
    setMessage(T.netVIstorii);
    onSeed(parsed.id);
  };

  return (
    <div className="gen-kits">
      <form
        className="gen-kits__find"
        onSubmit={(e) => {
          e.preventDefault();
          restore();
        }}
      >
        <label className="gen-label" htmlFor={codeId}>
          {T.kod}
        </label>
        <div className="gen-kits__row">
          <input
            id={codeId}
            className="input gen-kits__input"
            value={code}
            placeholder={T.placeholder}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="submit" className="btn btn--secondary">
            {T.naiti}
          </button>
        </div>
        {message === null ? null : (
          <p className="gen-hint" role="status">
            {message}
          </p>
        )}
      </form>
      {history.length === 0 ? (
        <p className="gen-hint">{T.pusto}</p>
      ) : (
        <ul className="gen-kits__list">
          {history.map((kit) => (
            <li key={`${kit.code}|${kit.settings}`} className="gen-kits__item">
              <div className="gen-kits__meta">
                <b className="kit-code">{kit.code}</b>
                <span>{kit.section}</span>
                <span>
                  {dateText(kit.createdAt)} · {counted(kit.count, 'задание', 'задания', 'заданий')}
                  {kit.version === generatorVersion(kit.scope) ? '' : ` · ${T.obnovlen}`}
                </span>
              </div>
              <div className="gen-kits__links">
                {kit.slot === slot ? (
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => onOpen(kit)}
                  >
                    {T.otkrytVGeneratore}
                  </button>
                ) : null}
                <a
                  className="btn btn--ghost btn--sm"
                  href={kit.studentHref}
                  target="_blank"
                  rel="noopener"
                >
                  {GEN_UI.uchenik}
                </a>
                <a
                  className="btn btn--ghost btn--sm"
                  href={kit.teacherHref}
                  target="_blank"
                  rel="noopener"
                >
                  {GEN_UI.uchitel}
                </a>
                <a
                  className="btn btn--ghost btn--sm"
                  href={bothHref(kit)}
                  target="_blank"
                  rel="noopener"
                >
                  {T.oba}
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
