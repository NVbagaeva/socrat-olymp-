'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { MAX_BALL } from '@/content/variantOnline/bally';
import { CHAST2_TEXT as T } from '@/content/variantOnline/chast2Text';
import { kriteriiZadaniya } from '@/content/variantOnline/kriterii';
import { proverit } from '@/lib/chast2/sravnenie';
import { punktKey, vvodEst, type Chast2Ui } from '@/lib/chast2/sostoyanie';
import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';
import { Kriterii } from './Kriterii';
import './chast2.css';
import { PoleOtveta } from './PoleOtveta';

export interface Chast2CardProps {
  z: Chast2Zadacha;
  st: Chast2Ui;
  update: (fn: (s: Chast2Ui) => Chast2Ui) => void;
  /**
   * Самопроверка: «Сверить ответ», решение и критерии. Выключена — только
   * ввод (контрольная до завершения, работа учителю).
   */
  samo: boolean;
  /** Ответ не меняется: работа завершена. */
  readOnly?: boolean;
}

/** Условие: абзацы через \n, формулы в $…$. */
export function Uslovie({ text }: { text: string }) {
  return (
    <div className="c2-uslovie">
      {text.split('\n').map((p, i) => (
        <p key={i}>
          <Tex text={p} krupno />
        </p>
      ))}
    </div>
  );
}

/** Эталонное решение и ответ. */
export function Reshenie({ z }: { z: Chast2Zadacha }) {
  return (
    <div className="c2-reshenie">
      <h4 className="c2-h">{T.reshenieTitle}</h4>
      <ol className="c2-reshenie__steps">
        {z.reshenie.map((s) => (
          <li key={s.title}>
            <b>
              <Tex text={`${s.title}.`} krupno />
            </b>{' '}
            {s.lines.map((l, i) => (
              <span key={i} className="c2-reshenie__line">
                <Tex text={l} krupno />
              </span>
            ))}
          </li>
        ))}
      </ol>
      <p className="c2-reshenie__otvet">
        <b>{T.otvet}:</b> <Tex text={z.otvet} krupno />
      </p>
    </div>
  );
}

/**
 * Карточка задания части 2: условие, поля ответа по пунктам; в
 * самопроверке — сверка ответа (только «совпадает / не совпадает»),
 * решение и выбор строки критериев.
 */
export function Chast2Card({ z, st, update, samo, readOnly = false }: Chast2CardProps) {
  const [ask, setAsk] = useState(false);
  const opened = st.reshenie.includes(z.no);
  const locked = readOnly || opened;
  const max = MAX_BALL[z.no];
  const sPolem = z.punkty.map((p, i) => ({ p, i })).filter(({ p }) => p.pole !== null);
  const est = sPolem.some(({ i }) => vvodEst(st.vvod[punktKey(z.no, i)] ?? null));

  const sverit = () =>
    update((s) => {
      const sverka = { ...s.sverka };
      for (const { p, i } of sPolem) {
        const key = punktKey(z.no, i);
        const v = s.vvod[key] ?? null;
        sverka[key] = vvodEst(v) ? proverit(p.pole!, v) : 'ne-sovpadaet';
      }
      return { ...s, sverka };
    });

  return (
    <div className="c2-card" data-testid={`c2-card-${z.no}`}>
      <Uslovie text={z.uslovie} />
      <div className="c2-punkty">
        {z.punkty.map((p, i) => {
          const key = punktKey(z.no, i);
          const sv = st.sverka[key];
          return (
            <div key={key} className="c2-punkt">
              <div className="c2-punkt__head">
                {p.bukva === null ? <b>{T.answer}</b> : <b>{T.punkt(p.bukva)}</b>}
                {p.podpis !== undefined && p.pole !== null ? (
                  <span className="c2-punkt__podpis">{p.podpis}</span>
                ) : null}
              </div>
              {p.pole === null ? (
                <p className="c2-hint">{T.dokaz}</p>
              ) : (
                <>
                  <PoleOtveta
                    pole={p.pole}
                    value={st.vvod[key] ?? null}
                    readOnly={locked}
                    testId={`c2-${z.no}-${i}`}
                    onChange={(v) =>
                      update((s) => {
                        const sverka = { ...s.sverka };
                        delete sverka[key];
                        return { ...s, vvod: { ...s.vvod, [key]: v }, sverka };
                      })
                    }
                  />
                  {samo && sv !== undefined ? (
                    <p
                      className={clsx('c2-sverka', `is-${sv}`)}
                      aria-live="polite"
                      data-testid={`c2-${z.no}-${i}-sverka`}
                    >
                      {sv === 'uchitel' ? T.sverka.uchitelSamo : T.sverka[sv]}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          );
        })}
        {sPolem.length > 0 ? <p className="c2-hint">{T.pole.keyboardHint}</p> : null}
      </div>

      {samo ? (
        <div className="c2-samo">
          <div className="c2-samo__actions">
            {sPolem.length > 0 && !locked ? (
              <Button
                variant="secondary"
                disabled={!est}
                onClick={sverit}
                data-testid={`c2-${z.no}-sverit`}
              >
                {T.sverit}
              </Button>
            ) : null}
            {opened ? null : (
              <Button
                variant="ghost"
                data-testid={`c2-${z.no}-reshenie`}
                onClick={() => (readOnly ? openReshenie() : setAsk(true))}
              >
                {T.reshenie}
              </Button>
            )}
          </div>
          {opened ? (
            <>
              <Reshenie z={z} />
              <h4 className="c2-h">{T.kriterii}</h4>
              <p className="c2-hint">{T.kriteriiLead}</p>
              <Kriterii
                kriterii={kriteriiZadaniya(z.no, z.utochnenie)}
                max={max}
                ball={st.ball[z.no]}
                stroka={st.stroka[z.no]}
                testId={`c2-${z.no}`}
                onPick={(b, row) =>
                  update((s) => {
                    const stroka = { ...s.stroka };
                    if (row === null) delete stroka[z.no];
                    else stroka[z.no] = row;
                    return { ...s, ball: { ...s.ball, [z.no]: b }, stroka };
                  })
                }
              />
            </>
          ) : null}
        </div>
      ) : null}

      <Modal
        open={ask}
        onClose={() => setAsk(false)}
        title={T.reshenie}
        description={T.reshenieWarn}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAsk(false)}>
              {T.cancel}
            </Button>
            <Button
              data-testid={`c2-${z.no}-reshenie-ok`}
              onClick={() => {
                setAsk(false);
                openReshenie();
              }}
            >
              {T.reshenieOpen}
            </Button>
          </>
        }
      />
    </div>
  );

  function openReshenie() {
    /* Открыл решение — ответ фиксируется; сверка по нему — сразу. */
    sverit();
    update((s) => ({ ...s, reshenie: [...s.reshenie, z.no] }));
  }
}
