'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { Button, Input } from '@/components/ui';
import type { PrepPoolBlok, PrepPoolZadacha } from '@/lib/veroyatnost/pool';
import { otkrytRazbor, type RazborShag } from '@/lib/veroyatnost/razbor';
import { answerMatches } from '@/lib/veroyatnost/secret';

export interface VeroyatnostPrepProps {
  bloki: PrepPoolBlok[];
}

/** Что ученик успел сделать с задачей. */
interface Sostoyanie {
  value: string;
  checked: 'right' | 'wrong' | null;
  razbor: RazborShag[] | null;
}

const PUSTO: Sostoyanie = { value: '', checked: null, razbor: null };

/**
 * Подготовительные задачи задания №4.
 *
 * Здесь нет ни подхода, ни перемешивания: это конспект автора,
 * задачи идут в его порядке и разложены по его же заголовкам.
 * Ученик решает подряд и видит, сколько в блоке уже сошлось.
 *
 * Ответы уехали вниз отпечатками, разборы закрытыми: в разметке
 * верного ответа нет ни у одной из восемнадцати задач.
 */
export function VeroyatnostPrep({ bloki }: VeroyatnostPrepProps) {
  const [sostoyaniya, setSostoyaniya] = useState<Record<string, Sostoyanie>>({});

  function sostoyanie(id: string): Sostoyanie {
    return sostoyaniya[id] ?? PUSTO;
  }

  function izmenit(id: string, next: Partial<Sostoyanie>): void {
    setSostoyaniya((was) => ({ ...was, [id]: { ...(was[id] ?? PUSTO), ...next } }));
  }

  function proverit(zadacha: PrepPoolZadacha): void {
    const value = sostoyanie(zadacha.id).value;
    if (value.trim() === '') {
      return;
    }
    izmenit(zadacha.id, { checked: answerMatches(value, zadacha.seal) ? 'right' : 'wrong' });
  }

  function pokazatRazbor(zadacha: PrepPoolZadacha): void {
    izmenit(zadacha.id, { razbor: otkrytRazbor(zadacha.steps, zadacha.seal).shagi });
  }

  return (
    <div className="vprep">
      {bloki.map((blok) => {
        const resheno = blok.zadachi.filter(
          (zadacha) => sostoyanie(zadacha.id).checked === 'right',
        ).length;

        return (
          <section className="vprep__blok" key={blok.id}>
            <header className="vprep__blok-head">
              <h2 className="t-h3 vprep__blok-title">{blok.nazvanie}</h2>
              <p className="vprep__blok-tip">{blok.tip}</p>
              <p className="vprep__blok-count">
                Решено <b>{resheno}</b> из <b>{blok.zadachi.length}</b>
              </p>
            </header>

            <ol className="vprep__list">
              {blok.zadachi.map((zadacha) => {
                const state = sostoyanie(zadacha.id);
                return (
                  <li className="vprep__item" key={zadacha.id}>
                    <article
                      className={clsx('vtask', state.checked === 'right' && 'vtask--solved')}
                    >
                      <header className="vtask__head">
                        <span className="vtask__no">Задача {zadacha.nomer}</span>
                      </header>

                      <p className="vtask__uslovie">{zadacha.uslovie}</p>

                      {/* Чертёж нарисован на сборке готовой разметкой:
                          движка в браузере нет, вставляем как есть. */}
                      {zadacha.risunok !== undefined ? (
                        <div
                          className="vtask__risunok"
                          dangerouslySetInnerHTML={{ __html: zadacha.risunok }}
                        />
                      ) : null}

                      <div className="vtask__answer">
                        <label className="vtask__label" htmlFor={`prep-${zadacha.id}`}>
                          Ответ
                        </label>
                        <Input
                          id={`prep-${zadacha.id}`}
                          inputMode="decimal"
                          autoComplete="off"
                          value={state.value}
                          state={
                            state.checked === 'wrong'
                              ? 'error'
                              : state.checked === 'right'
                                ? 'success'
                                : 'default'
                          }
                          onChange={(event) =>
                            izmenit(zadacha.id, { value: event.target.value, checked: null })
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              proverit(zadacha);
                            }
                          }}
                        />
                        <Button
                          onClick={() => proverit(zadacha)}
                          disabled={state.value.trim() === ''}
                        >
                          Проверить
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => pokazatRazbor(zadacha)}
                          disabled={state.razbor !== null}
                        >
                          Посмотреть решение
                        </Button>
                      </div>

                      {state.checked === 'right' ? (
                        <p className="vtask__verdict vtask__verdict--ok">Верно</p>
                      ) : null}
                      {state.checked === 'wrong' ? (
                        <p className="vtask__verdict vtask__verdict--no">
                          Не сходится. Попробуйте ещё раз или посмотрите решение.
                        </p>
                      ) : null}

                      {state.razbor !== null ? (
                        <ol className="vtask__razbor">
                          {state.razbor.map((shag, i) => (
                            <li key={i}>
                              <p className="vtask__razbor-text">{shag.text}</p>
                              {/* Формула набрана KaTeX на сборке: вставляется
                                  готовой вёрсткой, движка в браузере нет. */}
                              {shag.html === undefined ? null : (
                                <p
                                  className="vtask__razbor-formula"
                                  dangerouslySetInnerHTML={{ __html: shag.html }}
                                />
                              )}
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </article>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
