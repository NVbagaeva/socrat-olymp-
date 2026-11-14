'use client';

import { clsx } from 'clsx';
import { AnswerInput } from '../otvet/AnswerInput';
import { TRENAZHER_13 } from '@/content/zadanie13';
import {
  oshibkiOformleniya,
  razobratOformlenie,
  type Oformlennyy13,
} from '@/lib/zadanie13/trening/oformlenie13';
import type { Oformlenie13 } from '@/lib/zadanie13/trenazher/zadacha';

/**
 * Поле ответа режима «С оформлением» (№13), как в прежнем тренажёре:
 * шаг 1 — схема кнопками, шаг 2 — первая строка таблицы (данные клетки
 * показаны, свои — полями), затем число. После неверной проверки неверные
 * части отмечены красным и подписаны. Подписи — прежние (TRENAZHER_13).
 */
export function Oformlenie13Pole({
  of,
  value,
  onValue,
  zakryto,
  verno,
}: {
  of: Oformlenie13 | null;
  value: string;
  onValue: (value: string) => void;
  zakryto: boolean;
  verno: boolean | null;
}) {
  const a = razobratOformlenie(value);
  const set = (patch: Partial<Oformlennyy13>) => onValue(JSON.stringify({ ...a, ...patch }));
  const osh = verno === false && of !== null ? oshibkiOformleniya(of, a) : null;
  const sost = (oshibka: boolean) =>
    verno === null ? 'default' : verno || !oshibka ? 'success' : 'error';
  return (
    <div className="z13-of">
      {of === null ? null : (
        <section className="z13-of__shag">
          <p className="z13-of__no">{TRENAZHER_13.shagShema}</p>
          <div className="trn-vybor" role="radiogroup" aria-label={TRENAZHER_13.vybor}>
            {of.shema.options.map((o, k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={a.s === k}
                className={clsx(
                  'trn-vybor__knopka',
                  a.s === k && 'is-on',
                  a.s === k && verno === true && 'is-right',
                  a.s === k && osh?.shema === true && 'is-wrong',
                )}
                disabled={zakryto}
                onClick={() => set({ s: k })}
                dangerouslySetInnerHTML={{ __html: o }}
              />
            ))}
          </div>
          {osh?.shema === true ? (
            <p className="z13-of__oshibka">{TRENAZHER_13.shemaNeverno}</p>
          ) : null}
        </section>
      )}
      {of?.stroka == null ? null : (
        <section className="z13-of__shag">
          <p className="z13-of__no">{TRENAZHER_13.shagStroka}</p>
          <p className="z13-of__label">{of.stroka.label}</p>
          <div className="z13-of__stroka">
            {of.stroka.kletki.map((k, i) => {
              const key = String(i);
              return (
                <label key={key} className="z13-of__kletka">
                  <span className="z13-of__title">{k.title}</span>
                  {k.seal === null ? (
                    <span
                      className="z13-of__dano"
                      dangerouslySetInnerHTML={{ __html: k.html ?? '' }}
                    />
                  ) : (
                    <AnswerInput
                      className="z13-of__vvod"
                      value={a.k[key] ?? ''}
                      state={sost(osh?.kletki.includes(key) === true)}
                      readOnly={zakryto}
                      onChange={(next) => set({ k: { ...a.k, [key]: next } })}
                    />
                  )}
                </label>
              );
            })}
          </div>
          {osh !== null && osh.kletki.length > 0 ? (
            <p className="z13-of__oshibka">{TRENAZHER_13.kletkiNeverno}</p>
          ) : null}
        </section>
      )}
      <label className="z13-of__shag">
        <span className="z13-of__no">{TRENAZHER_13.shagOtvet}</span>
        <AnswerInput
          className="trn-input"
          value={a.o}
          state={verno === null ? 'default' : verno ? 'success' : 'default'}
          readOnly={zakryto}
          onChange={(next) => set({ o: next })}
        />
      </label>
    </div>
  );
}
