'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { Button, Input } from '@/components/ui';
import type { PrepPoolBlok, PrepPoolZadacha } from '@/lib/veroyatnost/pool';
import { otkrytRazbor, type Razbor } from '@/lib/veroyatnost/razbor';
import { answerMatches } from '@/lib/veroyatnost/secret';
import { Reshenie, Zadacha, ZadachaKnopki, ZadachaShapka, ZadachaUslovie } from './ZadachaCard';

export interface VeroyatnostPrepProps {
  bloki: PrepPoolBlok[];
}

/** Что ученик успел сделать с задачей. */
interface Sostoyanie {
  value: string;
  checked: 'right' | 'wrong' | null;
  /** Раскрытый разбор; null — ещё закрыт. */
  razbor: Razbor | null;
}

const PUSTO: Sostoyanie = { value: '', checked: null, razbor: null };

/** Якорь карточки на странице: к нему ведёт «Следующая». */
function yakor(id: string): string {
  return `zadacha-${id}`;
}

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

  /* Порядок задач сквозь блоки: по нему «Следующая» находит соседку. */
  const poryadok = bloki.flatMap((blok) => blok.zadachi.map((zadacha) => zadacha.id));

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
    const otkryt = sostoyanie(zadacha.id).razbor !== null;
    izmenit(zadacha.id, { razbor: otkryt ? null : otkrytRazbor(zadacha.steps, zadacha.seal) });
  }

  /* Список не листается по одной: «Следующая» просто подводит к
     соседней карточке и отдаёт ей фокус. */
  function sleduyushchaya(id: string): void {
    const next = poryadok[poryadok.indexOf(id) + 1];
    if (next === undefined) {
      return;
    }
    const element = document.getElementById(yakor(next));
    if (element === null) {
      return;
    }
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    element.focus({ preventScroll: true });
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
                const poslednyaya = poryadok[poryadok.length - 1] === zadacha.id;
                return (
                  <li className="vprep__item" key={zadacha.id}>
                    <Zadacha
                      id={yakor(zadacha.id)}
                      tabIndex={-1}
                      className={clsx(state.checked === 'right' && 'zadacha--reshena')}
                    >
                      <ZadachaShapka tip={blok.nazvanie} znak={zadacha.znak}>
                        <span>Задача {zadacha.nomer}</span>
                      </ZadachaShapka>

                      <ZadachaUslovie
                        html={zadacha.uslovie}
                        illyustratsiya={zadacha.illyustratsiya}
                      />

                      {/* Чертёж нарисован на сборке готовой разметкой:
                          движка в браузере нет, вставляем как есть. */}
                      {zadacha.risunok !== undefined ? (
                        <div
                          className="zadacha__risunok"
                          dangerouslySetInnerHTML={{ __html: zadacha.risunok }}
                        />
                      ) : null}

                      <div className="zadacha__otvet">
                        <label className="zadacha__otvet-label" htmlFor={`prep-${zadacha.id}`}>
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
                      </div>

                      {state.checked === 'right' ? (
                        <p className="zadacha__verdikt zadacha__verdikt--da">Верно</p>
                      ) : null}
                      {state.checked === 'wrong' ? (
                        <p className="zadacha__verdikt zadacha__verdikt--net">
                          Не сходится. Попробуйте ещё раз или посмотрите решение.
                        </p>
                      ) : null}

                      {state.razbor !== null ? <Reshenie razbor={state.razbor} /> : null}

                      <ZadachaKnopki
                        pokazat={{
                          otkryto: state.razbor !== null,
                          onClick: () => pokazatRazbor(zadacha),
                        }}
                        dalshe={{
                          onClick: () => sleduyushchaya(zadacha.id),
                          disabled: poslednyaya,
                        }}
                      />
                    </Zadacha>
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
