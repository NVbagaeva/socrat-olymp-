'use client';

import { clsx } from 'clsx';
import { Button } from '@/components/ui';
import { CHAST2_TEXT as T } from '@/content/variantOnline/chast2Text';
import type { Kusok, Mnozhestvo, Pole, Vvod } from '@/lib/chast2/sravnenie';
import { pustoyVvod } from '@/lib/chast2/sostoyanie';
import { MathPole } from './MathPole';

export interface PoleOtvetaProps {
  pole: Pole;
  value: Vvod;
  onChange: (v: Vvod) => void;
  readOnly: boolean;
  /** Префикс data-testid: «c2-14-0». */
  testId: string;
}

const MAX_SPISOK = 8;

/** Поле ответа части 2 по типу: формула, список корней или серий, промежутки, да/нет. */
export function PoleOtveta({ pole, value, onChange, readOnly, testId }: PoleOtvetaProps) {
  const v = value ?? pustoyVvod(pole);
  switch (pole.vid) {
    case 'chislo':
    case 'vyrazhenie':
      return (
        <MathPole
          value={typeof v === 'string' ? v : ''}
          onChange={onChange}
          label={pole.vid === 'chislo' ? T.pole.chislo : T.pole.vyrazhenie}
          readOnly={readOnly}
          testId={testId}
        />
      );
    case 'korni':
    case 'serii':
      return (
        <Spisok
          serii={pole.vid === 'serii'}
          value={Array.isArray(v) ? (v as readonly string[]) : ['']}
          onChange={onChange}
          readOnly={readOnly}
          testId={testId}
        />
      );
    case 'promezhutki':
      return (
        <Promezhutki
          value={typeof v === 'object' && v !== null && 'kuski' in v ? v : { kuski: [] }}
          onChange={onChange}
          readOnly={readOnly}
          testId={testId}
        />
      );
    case 'danet':
      return (
        <div className="c2-danet" role="radiogroup" aria-label={T.answer}>
          {(['da', 'net'] as const).map((x) => (
            <button
              key={x}
              type="button"
              role="radio"
              aria-checked={v === x}
              disabled={readOnly}
              className={clsx('c2-danet__btn', v === x && 'is-on')}
              data-testid={`${testId}-${x}`}
              onClick={() => onChange(v === x ? null : x)}
            >
              {x === 'da' ? T.pole.da : T.pole.net}
            </button>
          ))}
        </div>
      );
  }
}

/* ── Корни и серии ──────────────────────────────────────────────── */

function Spisok({
  serii,
  value,
  onChange,
  readOnly,
  testId,
}: {
  serii: boolean;
  value: readonly string[];
  onChange: (v: Vvod) => void;
  readOnly: boolean;
  testId: string;
}) {
  const list = value.length === 0 ? [''] : value;
  const set = (i: number, s: string) => onChange(list.map((x, j) => (j === i ? s : x)));
  return (
    <div className="c2-spisok">
      {list.map((x, i) => (
        <div key={i} className="c2-spisok__row">
          {serii ? <span className="c2-spisok__pre">x =</span> : null}
          <MathPole
            value={x}
            onChange={(s) => set(i, s)}
            label={serii ? T.pole.seriya(i + 1) : T.pole.koren(i + 1)}
            readOnly={readOnly}
            testId={`${testId}-${i}`}
          />
          {serii ? <span className="c2-spisok__post">, n ∈ ℤ</span> : null}
          {list.length > 1 && !readOnly ? (
            <button
              type="button"
              className="c2-x"
              aria-label={`${T.pole.remove}: ${serii ? T.pole.seriya(i + 1) : T.pole.koren(i + 1)}`}
              onClick={() => onChange(list.filter((_, j) => j !== i))}
            >
              ×
            </button>
          ) : null}
        </div>
      ))}
      {readOnly || list.length >= MAX_SPISOK ? null : (
        <Button
          variant="ghost"
          size="sm"
          data-testid={`${testId}-add`}
          onClick={() => onChange([...list, ''])}
        >
          {serii ? T.pole.addSeriya : T.pole.addKoren}
        </Button>
      )}
      {serii ? <p className="c2-hint">{T.pole.seriyaHint}</p> : null}
    </div>
  );
}

/* ── Конструктор промежутков ────────────────────────────────────── */

const INF = '\\infty';
const MINUS_INF = '-\\infty';

function Promezhutki({
  value,
  onChange,
  readOnly,
  testId,
}: {
  value: Mnozhestvo;
  onChange: (v: Vvod) => void;
  readOnly: boolean;
  testId: string;
}) {
  const kuski = value.kuski;
  const set = (i: number, k: Kusok) => onChange({ kuski: kuski.map((x, j) => (j === i ? k : x)) });
  const add = (k: Kusok) => onChange({ kuski: [...kuski, k] });
  return (
    <div className="c2-prom">
      <div className="c2-prom__list">
        {kuski.map((k, i) => (
          <div key={i} className="c2-prom__item">
            {i > 0 ? (
              <span className="c2-prom__union" aria-hidden="true">
                {T.pole.union}
              </span>
            ) : null}
            <div className="c2-prom__kusok" role="group" aria-label={T.pole.kusok(i + 1)}>
              {k.t === 'tochka' ? (
                <>
                  <span className="c2-prom__br">{'{'}</span>
                  <MathPole
                    value={k.x}
                    onChange={(x) => set(i, { ...k, x })}
                    label={`${T.pole.kusok(i + 1)}: ${T.pole.tochka}`}
                    readOnly={readOnly}
                    testId={`${testId}-${i}-x`}
                  />
                  <span className="c2-prom__br">{'}'}</span>
                </>
              ) : (
                <>
                  <Skobka
                    left
                    zakr={k.loZakr}
                    inf={k.lo === MINUS_INF}
                    readOnly={readOnly}
                    testId={`${testId}-${i}-lb`}
                    onToggle={() => set(i, { ...k, loZakr: !k.loZakr })}
                  />
                  <MathPole
                    value={k.lo}
                    onChange={(lo) => set(i, { ...k, lo })}
                    label={`${T.pole.kusok(i + 1)}: ${T.pole.otKrai}`}
                    readOnly={readOnly}
                    testId={`${testId}-${i}-lo`}
                  />
                  <span className="c2-prom__sep">;</span>
                  <MathPole
                    value={k.hi}
                    onChange={(hi) => set(i, { ...k, hi })}
                    label={`${T.pole.kusok(i + 1)}: ${T.pole.doKrai}`}
                    readOnly={readOnly}
                    testId={`${testId}-${i}-hi`}
                  />
                  <Skobka
                    zakr={k.hiZakr}
                    inf={k.hi === INF || k.hi === `+${INF}`}
                    readOnly={readOnly}
                    testId={`${testId}-${i}-rb`}
                    onToggle={() => set(i, { ...k, hiZakr: !k.hiZakr })}
                  />
                </>
              )}
            </div>
            {readOnly ? null : (
              <div className="c2-prom__tools">
                {k.t === 'interval' ? (
                  <>
                    <button
                      type="button"
                      className="c2-chip"
                      onClick={() => set(i, { ...k, lo: MINUS_INF, loZakr: false })}
                    >
                      {T.pole.minusInf}
                    </button>
                    <button
                      type="button"
                      className="c2-chip"
                      data-testid={`${testId}-${i}-inf`}
                      onClick={() => set(i, { ...k, hi: INF, hiZakr: false })}
                    >
                      {T.pole.plusInf}
                    </button>
                  </>
                ) : null}
                {kuski.length > 1 ? (
                  <button
                    type="button"
                    className="c2-x"
                    aria-label={`${T.pole.remove}: ${T.pole.kusok(i + 1)}`}
                    onClick={() => onChange({ kuski: kuski.filter((_, j) => j !== i) })}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
      {readOnly || kuski.length >= MAX_SPISOK ? null : (
        <div className="c2-prom__add">
          <Button
            variant="ghost"
            size="sm"
            data-testid={`${testId}-add-interval`}
            onClick={() => add({ t: 'interval', lo: '', hi: '', loZakr: true, hiZakr: false })}
          >
            {T.pole.addInterval}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            data-testid={`${testId}-add-tochka`}
            onClick={() => add({ t: 'tochka', x: '' })}
          >
            {T.pole.addTochka}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Скобка промежутка: нажатие переключает «[» ↔ «(». У бесконечности — всегда круглая. */
function Skobka({
  left = false,
  zakr,
  inf,
  readOnly,
  testId,
  onToggle,
}: {
  left?: boolean;
  zakr: boolean;
  inf: boolean;
  readOnly: boolean;
  testId: string;
  onToggle: () => void;
}) {
  const on = zakr && !inf;
  const ch = left ? (on ? '[' : '(') : on ? ']' : ')';
  return (
    <button
      type="button"
      className={clsx('c2-skobka', on && 'is-zakr')}
      disabled={readOnly || inf}
      aria-pressed={on}
      aria-label={`${left ? T.pole.otKrai : T.pole.doKrai}: ${on ? T.pole.zakr : T.pole.otkr}`}
      data-testid={testId}
      onClick={onToggle}
    >
      {ch}
    </button>
  );
}
