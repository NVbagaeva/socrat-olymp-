'use client';

import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Button, Input } from '@/components/ui';
import type { Pool, PoolKind, PoolVariant } from '@/lib/veroyatnost/pool';
import { otkrytRazbor, type Razbor } from '@/lib/veroyatnost/razbor';
import { answerMatches } from '@/lib/veroyatnost/secret';
import {
  ROUND_SIZE,
  otherVariant,
  restartRound,
  swapTask,
  useVeroyatnostRound,
} from '@/lib/veroyatnost/useRound';
import { Reshenie, Zadacha, ZadachaKnopki, ZadachaShapka, ZadachaUslovie } from './ZadachaCard';

export interface VeroyatnostTrainerProps {
  pool: Pool;
  /** Имя подхода в памяти вкладки: у каждого задания своё. */
  roundKey: string;
}

/** Смешанный режим: не блок, а все блоки сразу. */
const MIX = 'mix';

/**
 * Тренажёр задания №4.
 *
 * Все задания приходят готовыми пропсами: условия набраны на сборке,
 * ответы уехали вниз только отпечатками, разборы закрытыми и
 * раскрываются по просьбе ученика. Формулы ответа и перебор исходов
 * остались на сборке и в браузер не едут вовсе.
 *
 * Порядок подхода собирает хранилище в useRound: там же берётся и
 * зерно. Компонент при отрисовке ни часов, ни случайных чисел не
 * спрашивает, поэтому разметка сервера и первая отрисовка в браузере
 * совпадают, а подход не пересобирается сам собой.
 */
export function VeroyatnostTrainer({ pool, roundKey }: VeroyatnostTrainerProps) {
  const [blok, setBlok] = useState<string>(MIX);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [solution, setSolution] = useState(false);
  /* Сколько решено с первой попытки: в счёт идёт только это. */
  const [srazu, setSrazu] = useState(0);
  const [oshibsya, setOshibsya] = useState(false);

  const byId = useMemo(() => new Map(pool.kinds.map((kind) => [kind.id, kind])), [pool]);

  /* Из чего собирать подход: один блок задачника или все сразу. */
  const source = useMemo(
    () =>
      pool.kinds
        .filter((kind) => blok === MIX || kind.blok === blok)
        .map((kind) => ({ id: kind.id, variants: kind.variants.map((item) => ({ n: item.n })) })),
    [pool, blok],
  );

  const key = `${roundKey}:${blok}`;
  const round = useVeroyatnostRound(key, source, ROUND_SIZE);
  const item = round[index];
  const kind: PoolKind | undefined = item === undefined ? undefined : byId.get(item.kind);
  const variant: PoolVariant | undefined =
    kind === undefined ? undefined : kind.variants.find((v) => v.n === item?.n);

  /* Разбор раскрывается только когда его попросили. */
  const razbor = useMemo<Razbor | null>(() => {
    if (!solution || variant === undefined) {
      return null;
    }
    return otkrytRazbor(variant.razbor, variant.seal);
  }, [solution, variant]);

  function sbros(): void {
    setValue('');
    setChecked(null);
    setSolution(false);
    setOshibsya(false);
  }

  function smenitBlok(next: string): void {
    setBlok(next);
    setIndex(0);
    setSrazu(0);
    sbros();
  }

  function proverit(): void {
    if (variant === undefined || value.trim() === '') {
      return;
    }
    const verno = answerMatches(value, variant.seal);
    setChecked(verno ? 'right' : 'wrong');
    if (verno && !oshibsya) {
      setSrazu((n) => n + 1);
    }
    if (!verno) {
      setOshibsya(true);
    }
  }

  function dalshe(): void {
    setIndex((n) => n + 1);
    sbros();
  }

  function eshcheVariant(): void {
    if (item === undefined || kind === undefined) {
      return;
    }
    swapTask(key, index, {
      kind: item.kind,
      n: otherVariant(kind.variants, item.n, Math.random),
    });
    sbros();
  }

  function zanovo(): void {
    restartRound(key);
    setIndex(0);
    setSrazu(0);
    sbros();
  }

  const chipy = [
    { id: MIX, label: 'Вперемешку' },
    ...pool.bloki.map((b) => ({ id: b.id, label: b.korotko })),
  ];

  return (
    <section className="vtrainer">
      <div className="vtrainer__chips" role="group" aria-label="Блок задачника">
        {chipy.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={clsx('vchip', chip.id === blok && 'vchip--on')}
            aria-pressed={chip.id === blok}
            onClick={() => smenitBlok(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {round.length === 0 ? (
        /* До монтирования подхода нет: показываем место под него,
           а не пустой экран, который тут же сменится задачей. */
        <p className="vtrainer__wait">Собираем подход…</p>
      ) : index >= round.length ? (
        <div className="vtrainer__done">
          <p className="vtrainer__done-title">Подход пройден</p>
          <p className="vtrainer__done-score">
            С первой попытки решено <b>{srazu}</b> из <b>{round.length}</b>
          </p>
          <Button onClick={zanovo}>Начать заново</Button>
        </div>
      ) : kind !== undefined && variant !== undefined ? (
        <Zadacha className={clsx(checked === 'right' && 'zadacha--reshena')}>
          <ZadachaShapka tip={kind.title} znak={kind.znak}>
            <span>
              Задача {index + 1} из {round.length}
            </span>
            <button type="button" className="zadacha__ssylka" onClick={eshcheVariant}>
              Ещё вариант
            </button>
          </ZadachaShapka>

          <ZadachaUslovie html={variant.uslovie} illyustratsiya={kind.illyustratsiya} />

          <div className="zadacha__otvet">
            <label className="zadacha__otvet-label" htmlFor="vtask-input">
              Ответ
            </label>
            <Input
              id="vtask-input"
              inputMode="decimal"
              autoComplete="off"
              value={value}
              state={checked === 'wrong' ? 'error' : checked === 'right' ? 'success' : 'default'}
              onChange={(event) => {
                setValue(event.target.value);
                setChecked(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  proverit();
                }
              }}
            />
            <Button onClick={proverit} disabled={value.trim() === ''}>
              Проверить
            </Button>
          </div>

          {checked === 'right' ? (
            <p className="zadacha__verdikt zadacha__verdikt--da">Верно</p>
          ) : null}
          {checked === 'wrong' ? (
            <p className="zadacha__verdikt zadacha__verdikt--net">
              Не сходится. Попробуйте ещё раз или посмотрите решение.
            </p>
          ) : null}

          {razbor !== null ? <Reshenie razbor={razbor} /> : null}

          <ZadachaKnopki
            pokazat={{ otkryto: solution, onClick: () => setSolution((was) => !was) }}
            dalshe={{
              label: index + 1 === round.length ? 'Завершить подход' : 'Следующая',
              onClick: dalshe,
            }}
          />

          <p className="zadacha__istochnik">
            Задачник №4, задачи {kind.zadachnik[0]}–{kind.zadachnik[1]}. {kind.tip}.
          </p>
        </Zadacha>
      ) : null}
    </section>
  );
}
