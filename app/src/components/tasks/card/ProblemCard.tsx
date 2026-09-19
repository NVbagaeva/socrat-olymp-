'use client';

import { useCallback, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Badge, Button, Input } from '@/components/ui';
import type { PoolModel } from '@/lib/veroyatnost/pool';
import { otkrytRazbor, type Razbor } from '@/lib/veroyatnost/razbor';
import { answerMatches } from '@/lib/veroyatnost/secret';
import { RightIcon, WrongIcon } from '../prep/PrepIcons';
import { Vizualizatsiya, podpisRisunka } from './Vizualizatsiya';

/**
 * Карточка задачи — раздел 05 референса: условие · визуализация · решение.
 *
 * Общий компонент, не привязанный к заданию №4: ему нужны условие,
 * отпечаток ответа, закрытый разбор и, если есть, модель рисунка.
 * Правильного ответа в разметке нет: разбор лежит зашифрованным и
 * открывается только по действию ученика или после верного ответа.
 *
 * Состояния (раздел 06 и 07):
 *   before    — условие, рисунок без подсветки, поле ответа; решение скрыто;
 *   correct   — поле зелёное, рисунок подсвечивает благоприятное, «Следующая»;
 *   incorrect — поле оранжевое, предлагается открыть решение;
 *   revealed  — шаги появляются по одному, рисунок в режиме ответа.
 *
 * variant="condition" — только условие и место под иллюстрацию: для
 * режима «Узнай метод», где спрашивают не число, а метод.
 */

export type CardState = 'before' | 'correct' | 'incorrect' | 'revealed';

export interface ProblemCardZadacha {
  id: string;
  uslovie: string;
  /** Отпечаток верного ответа. */
  seal: string;
  /** Закрытый разбор (JSON формы Razbor, зашифрованный отпечатком). */
  steps: string;
  /** Метод и параметры рисунка — открытая часть модели. */
  model?: PoolModel;
  /**
   * Иллюстрация задачи без модели: у варианта condition и у задач
   * подготовки №5, где методики пока нет. Только если файл
   * существует. У задачи с моделью картинка идёт через модель.
   */
  illustration?: { path: string; alt: string };
  /**
   * Чертёж готовой разметкой — у задачи без модели, где без картинки
   * условие не читается (лабиринт). Встаёт в колонку рисунка.
   */
  risunok?: string;
}

export interface ProblemCardProps {
  variant?: 'full' | 'condition';
  zadacha: ProblemCardZadacha;
  /** Номер в подходе — плашка слева в шапке. */
  nomer?: number;
  /** Название метода в шапке. В смешанном режиме не передаётся. */
  metodLabel?: string;
  /** Подпись справа в шапке: «Прототип задания 4». */
  istochnik?: string;
  /**
   * Начальное состояние. Нужно витрине, чтобы показать раскрытое
   * решение без кликов; в тренажёре карточка всегда начинается с before.
   */
  initial?: { state: CardState; shagov?: number };
  /** Ответ проверен: верно или нет. Открытие решения — не результат. */
  onResult?: (right: boolean) => void;
  onNext?: () => void;
  nextLabel?: string;
  /** Раскрыто решение — задача не засчитывается; сообщается один раз. */
  onReveal?: () => void;
  disabled?: boolean;
  className?: string;
}

const VERDICT = {
  correct: 'Верно',
  incorrect: 'Неверно',
};

/** Дерево, у которого листьев больше четырёх. */
function shirokoeDerevo(parametry: PoolModel['parametry']): boolean {
  if (parametry.method !== 'probability-tree') {
    return false;
  }
  const roditeli = new Set(parametry.branches.map((b) => b.parent));
  return parametry.branches.filter((b) => !roditeli.has(b.id)).length > 4;
}

export function ProblemCard({
  variant = 'full',
  zadacha,
  nomer,
  metodLabel,
  istochnik,
  initial,
  onResult,
  onNext,
  nextLabel = 'Следующая',
  onReveal,
  disabled = false,
  className,
}: ProblemCardProps) {
  const [value, setValue] = useState('');
  const [state, setState] = useState<CardState>(initial?.state ?? 'before');
  /* Чем кончилась проверка — чтобы «Скрыть решение» вернуло туда же. */
  const [itog, setItog] = useState<'correct' | 'incorrect' | null>(
    initial?.state === 'correct' || initial?.state === 'incorrect' ? initial.state : null,
  );
  const [shagov, setShagov] = useState(initial?.shagov ?? 0);
  const [otkryt, setOtkryt] = useState(
    initial?.state === 'revealed' || initial?.state === 'correct',
  );

  /* Разбор открывается лениво и один раз: до этого в памяти его нет. */
  const razbor = useMemo<Razbor | null>(
    () => (otkryt ? otkrytRazbor(zadacha.steps, zadacha.seal) : null),
    [otkryt, zadacha.steps, zadacha.seal],
  );

  const proverit = useCallback((): void => {
    if (value.trim() === '') {
      return;
    }
    const right = answerMatches(value, zadacha.seal);
    setState(right ? 'correct' : 'incorrect');
    setItog(right ? 'correct' : 'incorrect');
    if (right) {
      setOtkryt(true);
    }
    onResult?.(right);
  }, [value, zadacha.seal, onResult]);

  const raskryt = useCallback((): void => {
    setOtkryt(true);
    setState('revealed');
    setShagov(1);
    onReveal?.();
  }, [onReveal]);

  const skryt = useCallback((): void => {
    setState(itog ?? 'before');
    setShagov(0);
  }, [itog]);

  const vseShagi = razbor?.shagi.length ?? 0;
  const resheniyeVidno = state === 'revealed';
  /* Ответ — отдельным нажатием после последнего шага: «Шаг 1 → 2 → 3 → Ответ». */
  const otvetViden = resheniyeVidno && shagov > vseShagi;
  const risunokState =
    state === 'correct' ? 'correct' : state === 'incorrect' ? 'incorrect' : 'default';
  const model = zadacha.model;
  /* У метода «Формула» рисунка нет: задача решается шагами, и колонка
     под рисунок не нужна — условие и решение делят ширину пополам.
     Так же у задачи без модели, если у неё нет чертежа. */
  const bezRisunka =
    model === undefined ? zadacha.risunok === undefined : model.parametry.method === 'formula';
  /* Дерево на много листьев в узкой средней колонке не прочесть:
     такой рисунок занимает всю ширину карточки под условием и
     решением. Порог — больше четырёх листьев, то есть больше дерева
     двух испытаний по два исхода из референса. */
  const shirokiyRisunok = model !== undefined && shirokoeDerevo(model.parametry);

  /* Подсветка благоприятного — только когда разбор уже открыт. */
  const podsvetka =
    razbor === null || state === 'incorrect' || state === 'before' ? undefined : razbor.podsvetka;

  const head = (
    <header className="pc__head">
      {nomer === undefined ? null : (
        <span className="pc__no" aria-label={`Задача ${nomer}`}>
          {nomer}
        </span>
      )}
      {metodLabel === undefined ? null : <Badge tone="info">{metodLabel}</Badge>}
      {istochnik === undefined ? null : <span className="pc__istochnik">{istochnik}</span>}
    </header>
  );

  /* Иллюстрация: есть файл — картинка справа от условия, нет файла —
     ничего: ни рамки, ни места под неё, условие занимает всю ширину.
     У задачи с моделью картинка приходит с моделью варианта (свой
     файл у варианта, а не у прототипа), у задачи без модели и у
     условия «Узнай метод» — полем задачи. */
  const kartinka = zadacha.illustration ?? model?.illustration;

  const illyustratsiya =
    kartinka === undefined ? null : (
      <figure className="pc__ill">
        <img src={kartinka.path} alt={kartinka.alt} loading="lazy" />
      </figure>
    );

  const uslovie = (
    <div className="pc__uslovie">
      <p className="pc__text">{zadacha.uslovie}</p>
      {illyustratsiya}
    </div>
  );

  if (variant === 'condition') {
    return (
      <article className={clsx('pc', 'pc--condition', className)}>
        {head}
        {uslovie}
      </article>
    );
  }

  return (
    <article
      className={clsx(
        'pc',
        `pc--${state}`,
        resheniyeVidno && 'pc--solution-revealed',
        bezRisunka && 'pc--bez-risunka',
        shirokiyRisunok && 'pc--shirokiy-risunok',
        disabled && 'pc--disabled',
        className,
      )}
    >
      {head}

      <div className="pc__grid">
        <div className="pc__col pc__col--uslovie">
          {uslovie}
          {/* «Метод:» — часть решения: до ответа его нет, иначе он
              подсказывал бы структуру в смешанном режиме. */}
          {razbor !== null && (state === 'correct' || resheniyeVidno) && razbor.metod !== '' ? (
            <p className="pc__metod">
              <b>Метод:</b> {razbor.metod}
            </p>
          ) : null}
        </div>

        {bezRisunka ? null : model !== undefined ? (
          <div className="pc__col pc__col--risunok">
            <figure className="pc__risunok">
              <figcaption className="pc__risunok-podpis">
                {podpisRisunka(model.parametry, podsvetka)}
              </figcaption>
              <Vizualizatsiya
                parametry={model.parametry}
                {...(podsvetka === undefined ? {} : { podsvetka })}
                state={risunokState}
              />
            </figure>
          </div>
        ) : zadacha.risunok === undefined ? null : (
          <div className="pc__col pc__col--risunok">
            {/* Чертёж нарисован на сборке готовой разметкой: движка в
                браузере нет, вставляем как есть. */}
            <figure
              className="pc__chertezh"
              dangerouslySetInnerHTML={{ __html: zadacha.risunok }}
            />
          </div>
        )}

        <div className="pc__col pc__col--reshenie">
          {resheniyeVidno && razbor !== null ? (
            <section className="pc__reshenie" aria-live="polite">
              <h3 className="pc__reshenie-title">Решение</h3>
              <ol className="pc-steps">
                {razbor.shagi.slice(0, shagov).map((shag, i) => (
                  <li key={i} className="pc-step">
                    <span className="pc-step__no" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div className="pc-step__body">
                      <p className="pc-step__text">{shag.text}</p>
                      {shag.html === undefined ? null : (
                        <p
                          className="pc-step__formula"
                          dangerouslySetInnerHTML={{ __html: shag.html }}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              {otvetViden ? (
                <p className="pc__otvet">
                  <span className="pc__otvet-label">Ответ:</span>
                  <b className="pc__otvet-value">{razbor.otvet}</b>
                </p>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setShagov((s) => s + 1)}>
                  {shagov < vseShagi ? `Шаг ${shagov + 1}` : 'Ответ'}
                </Button>
              )}
            </section>
          ) : (
            <div className="pc__answer">
              <label className="pc__answer-label" htmlFor={`pc-${zadacha.id}`}>
                Ответ:
              </label>
              <Input
                id={`pc-${zadacha.id}`}
                className="pc__input"
                value={value}
                state={
                  state === 'correct' ? 'success' : state === 'incorrect' ? 'error' : 'default'
                }
                inputMode="decimal"
                autoComplete="off"
                readOnly={state === 'correct' || disabled}
                onChange={(event) => {
                  setValue(event.target.value);
                  if (state === 'incorrect') {
                    setState('before');
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && state !== 'correct') {
                    proverit();
                  }
                }}
              />
              {state === 'correct' || state === 'incorrect' ? (
                <p className={clsx('pc__verdict', `pc__verdict--${state}`)} role="status">
                  <span className="pc__verdict-ico">
                    {state === 'correct' ? <RightIcon /> : <WrongIcon />}
                  </span>
                  {VERDICT[state]}
                  {state === 'correct' && razbor !== null ? ` · ${razbor.otvet}` : null}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <footer className="pc__actions">
        {resheniyeVidno ? (
          <Button variant="ghost" onClick={skryt}>
            Скрыть решение
          </Button>
        ) : state === 'correct' ? (
          <Button variant="ghost" onClick={raskryt}>
            Показать решение
          </Button>
        ) : (
          <>
            <Button onClick={proverit} disabled={disabled || value.trim() === ''}>
              Проверить
            </Button>
            <Button variant="ghost" onClick={raskryt} disabled={disabled}>
              {state === 'incorrect' ? 'Открыть решение' : 'Показать решение'}
            </Button>
          </>
        )}
        {onNext === undefined ? null : (
          <Button
            variant={state === 'correct' || resheniyeVidno ? 'primary' : 'secondary'}
            onClick={onNext}
            disabled={disabled || state === 'before'}
          >
            {nextLabel}
          </Button>
        )}
      </footer>
    </article>
  );
}
