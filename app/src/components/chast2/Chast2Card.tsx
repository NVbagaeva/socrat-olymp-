'use client';

import { clsx } from 'clsx';
import { useMemo, useRef, useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { MAX_BALL } from '@/content/variantOnline/bally';
import { CHAST2_TEXT as T } from '@/content/variantOnline/chast2Text';
import { kriteriiZadaniya } from '@/content/variantOnline/kriterii';
import { proverit } from '@/lib/chast2/sravnenie';
import { punktKey, vvodEst, type Chast2Ui } from '@/lib/chast2/sostoyanie';
import { ramkaHtml, reshenieHtml, strokaHtml, uslovieHtml } from '@/lib/povyshennye/chast2/html';
import { useOzhivit3d } from '@/components/stereo/useOzhivit3d';
import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';
import { Kriterii } from './Kriterii';
import { PoleOtveta } from './PoleOtveta';
import { TeoremaOkno } from './TeoremaOkno';
import './chast2.css';

export interface Chast2CardProps {
  z: Chast2Zadacha;
  st: Chast2Ui;
  update: (fn: (s: Chast2Ui) => Chast2Ui) => void;
  /**
   * Самопроверка: «Сверить ответ», решение и критерии. Выключена — только
   * ввод (контрольная до завершения).
   */
  samo: boolean;
  /** Ответ не меняется: работа завершена. */
  readOnly?: boolean;
}

/** Условие задачи части 2: абзацы, формулы набраны. */
export function Uslovie({ z }: { z: Chast2Zadacha }) {
  const html = useMemo(() => uslovieHtml(z.uslovie), [z]);
  return <div className="c2-uslovie" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Решение по этапам со ссылками на теоремы, ответ и сноска после ответа. */
export function Reshenie({ z }: { z: Chast2Zadacha }) {
  const ref = useRef<HTMLDivElement>(null);
  const html = useMemo(() => reshenieHtml(z, 'ekran'), [z]);
  const otvet = useMemo(() => strokaHtml(z.otvet), [z]);
  const snoska = useMemo(() => (z.snoska === undefined ? null : ramkaHtml(z.snoska)), [z]);
  /* Чертежи стереометрии в решении вращаются руками. */
  useOzhivit3d(ref, [html]);
  return (
    <div className="c2-reshenie" ref={ref} data-testid={`c2-${z.no}-reshenie-telo`}>
      <h4 className="c2-h">{T.reshenieTitle}</h4>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <p className="c2-reshenie__otvet">
        <b>{T.otvet}:</b> <span dangerouslySetInnerHTML={{ __html: otvet }} />
      </p>
      {snoska === null ? null : (
        <div className="c2-reshenie__snoska" dangerouslySetInnerHTML={{ __html: snoska }} />
      )}
      <TeoremaOkno root={ref} />
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
        /* Пустое поле не сверяется: «не совпадает» у него ничего не говорит. */
        if (vvodEst(v)) sverka[key] = proverit(p.pole!, v);
        else delete sverka[key];
      }
      return { ...s, sverka };
    });

  function openReshenie() {
    /* Открыл решение — ответ фиксируется; сверка по нему — сразу. */
    sverit();
    update((s) => (s.reshenie.includes(z.no) ? s : { ...s, reshenie: [...s.reshenie, z.no] }));
  }

  return (
    <div className="c2-card" data-testid={`c2-card-${z.no}`}>
      <Uslovie z={z} />
      {z.risunok === null ? null : (
        <figure className="c2-ris" dangerouslySetInnerHTML={{ __html: z.risunok }} />
      )}
      <div className="c2-punkty">
        {z.punkty.map((p, i) => {
          const key = punktKey(z.no, i);
          const sv = st.sverka[key];
          return (
            <div key={key} className="c2-punkt">
              <div className="c2-punkt__head">
                {p.bukva === null ? <b>{T.answer}</b> : <b>{T.punkt(p.bukva)}</b>}
                {p.podpis !== undefined && p.pole !== null ? (
                  <span className="c2-punkt__podpis">
                    <Tex text={p.podpis} />
                  </span>
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
        {sPolem.length > 0 && !locked ? (
          <p className="c2-hint">
            <Tex text={T.pole.keyboardHint} />
          </p>
        ) : null}
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
}
