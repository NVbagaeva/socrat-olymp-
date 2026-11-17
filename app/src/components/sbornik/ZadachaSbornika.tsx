'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { ShagiResheniya } from '@/components/tasks/steklo';
import { typeset } from '@/lib/tex';
import { proverit, pustoyVvod, type Itog } from '@/lib/sbornik/proverka';
import { logSbornika } from '@/lib/sbornik/progress';
import type { LogOutcome } from '@/lib/progressLog/model';
import type { Otkrytoe, VvodSbornika, ZadachaKlient } from '@/lib/sbornik/types';
import { otkryt } from '@/lib/sbornik/zamok';
import { SbornikPole } from './SbornikPole';

const ZVEZDY = ['', '★', '★★', '★★★'] as const;

type Sost = 'vvod' | 'verno' | 'neverno';

/**
 * Задача сборника: условие, поле ответа под вид ответа, проверка,
 * подсказки-вопросы, «Где я ошибся?» и решение по шагам.
 *
 * Исход пишется в журнал один раз, когда задача закрыта: верно,
 * верно с подсказкой, неверно (была неверная попытка) или «решение
 * открыто до ответа».
 */
export function ZadachaSbornika({
  z,
  nomer,
  podpis,
  sessiya,
  fixes,
  bezPodskazok = false,
  bezUsloviya = false,
  onZakryta,
  className,
}: {
  z: ZadachaKlient;
  nomer: string;
  /** Условие уже на странице (список задач типа): карточка — только решение. */
  bezUsloviya?: boolean;
  /** Подпись над условием: название типа. */
  podpis?: string;
  sessiya?: string;
  /** Работа над ошибками: номер задачи, аналог которой решается. */
  fixes?: string;
  bezPodskazok?: boolean;
  onZakryta?: (outcome: LogOutcome) => void;
  className?: string;
}) {
  const [vvod, setVvod] = useState<VvodSbornika>(() => pustoyVvod(z.proverka));
  const [sost, setSost] = useState<Sost>('vvod');
  const [hint, setHint] = useState<string | null>(null);
  const [zametka, setZametka] = useState<string | null>(null);
  const [oshibalsya, setOshibalsya] = useState(false);
  const [podskazok, setPodskazok] = useState(0);
  const [reshenie, setReshenie] = useState(false);
  const [poisk, setPoisk] = useState<{ shag: number; najden: boolean } | null>(null);
  const zakryta = useRef(false);
  /* Время на задачу. Новая задача — новый компонент (key={z.id} у
     родителя), поэтому отсчёт ставится один раз при появлении. */
  const start = useRef(0);
  useEffect(() => {
    start.current = Date.now();
  }, []);

  function zakryt(outcome: LogOutcome) {
    if (zakryta.current) return;
    zakryta.current = true;
    logSbornika.record({
      task: z.id,
      kind: z.tip,
      outcome,
      seconds: Math.round((Date.now() - start.current) / 1000),
      ...(sessiya === undefined ? {} : { session: sessiya }),
      ...(fixes === undefined ? {} : { fixes }),
    });
    onZakryta?.(outcome);
  }

  function check() {
    const itog: Itog = proverit(vvod, z.proverka);
    if (itog.kind === 'format') {
      setHint(itog.hint);
      return;
    }
    setHint(null);
    setPoisk(null);
    if (itog.kind === 'verno') {
      setSost('verno');
      setZametka(null);
      zakryt(oshibalsya ? 'wrong' : podskazok > 0 ? 'hinted' : 'right');
    } else {
      setSost('neverno');
      setOshibalsya(true);
      setZametka(itog.zametka ?? null);
    }
  }

  function otkrytReshenie() {
    setReshenie(true);
    if (sost !== 'verno') zakryt(oshibalsya ? 'wrong' : 'revealed');
  }

  const gotovo = sost === 'verno' || reshenie;
  /* Решение закрыто (lib/sbornik/zamok.ts): открывается, только когда
     ученик его просит или ищет шаг с ошибкой. */
  const nuzhnoReshenie = reshenie || poisk !== null;
  const otkr = useMemo<Otkrytoe | null>(
    () => (nuzhnoReshenie ? (JSON.parse(otkryt(z.zakryto, z.id)) as Otkrytoe) : null),
    [nuzhnoReshenie, z],
  );

  return (
    <article
      className={clsx('sb-zadacha', !bezUsloviya && 'stk-glass', bezUsloviya && 'sb-zadacha--vstroennaya', className)}
    >
      {bezUsloviya ? null : (
        <>
          <header className="sb-zadacha__shapka">
            <span className="sb-zadacha__nomer">{nomer}</span>
            <span className="sb-zadacha__uroven" aria-label={`Уровень ${z.uroven} из 3`}>
              {ZVEZDY[z.uroven]}
            </span>
            {podpis === undefined ? null : <span className="sb-zadacha__tip">{podpis}</span>}
            {sost === 'verno' ? <span className="sb-metka sb-metka--verno">Верно</span> : null}
          </header>
          <UslovieZadachi z={z} />
        </>
      )}

      <PoleVvoda
        z={z}
        vvod={vvod}
        onVvod={(v) => {
          setVvod(v);
          setHint(null);
          if (sost === 'neverno') setSost('vvod');
        }}
        readOnly={gotovo}
      />

      {hint === null ? null : (
        <p className="sb-format" role="status" dangerouslySetInnerHTML={{ __html: typeset(hint) }} />
      )}
      {sost === 'neverno' ? (
        <p className="sb-itog sb-itog--neverno" role="status">
          Пока неверно. {zametka ?? 'Проверьте решение или найдите шаг, где разошлось.'}
        </p>
      ) : null}
      {sost === 'verno' ? (
        <p className="sb-itog sb-itog--verno" role="status">
          Верно!{oshibalsya ? ' С ошибкой по пути — задача попадёт в «Работу над ошибками».' : ''}
        </p>
      ) : null}

      <div className="sb-zadacha__knopki">
        {gotovo ? null : (
          <Button onClick={check} data-testid={`proverit-${z.id}`}>
            Проверить
          </Button>
        )}
        {gotovo || bezPodskazok || z.podskazkiHtml.length === 0 || podskazok >= z.podskazkiHtml.length ? null : (
          <Button variant="secondary" onClick={() => setPodskazok((n) => n + 1)}>
            {podskazok === 0 ? 'Подсказка' : 'Ещё вопрос'}
          </Button>
        )}
        {sost === 'neverno' && poisk === null ? (
          <Button variant="secondary" onClick={() => setPoisk({ shag: 0, najden: false })}>
            Где я ошибся?
          </Button>
        ) : null}
        {reshenie ? null : (
          <Button variant="ghost" onClick={otkrytReshenie}>
            {sost === 'verno' ? 'Посмотреть решение' : 'Показать решение'}
          </Button>
        )}
      </div>

      {podskazok === 0 || gotovo ? null : (
        <ol className="sb-podskazki" aria-label="Подсказки">
          {z.podskazkiHtml.slice(0, podskazok).map((html, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
          ))}
        </ol>
      )}

      {poisk === null || reshenie || otkr === null ? null : (
        <PoiskOshibki
          shagi={otkr.shagi}
          shag={poisk.shag}
          najden={poisk.najden}
          onTakZhe={() =>
            setPoisk((p) => (p === null ? p : { shag: p.shag + 1, najden: false }))
          }
          onInache={() => setPoisk((p) => (p === null ? p : { ...p, najden: true }))}
          onZanovo={() => {
            setPoisk(null);
            setSost('vvod');
          }}
        />
      )}

      {reshenie && otkr !== null ? (
        <div className="sb-reshenie">
          <h3 className="sb-reshenie__zag">Решение</h3>
          <ShagiResheniya shagi={otkr.shagi.map((s) => ({ chtoHtml: s.chtoHtml, formulaHtml: s.formulaHtml }))} />
          <p className="sb-reshenie__otvet">
            Ответ: <span dangerouslySetInnerHTML={{ __html: otkr.otvetHtml }} />
          </p>
        </div>
      ) : null}
    </article>
  );
}

/** Условие: текст, формула отдельной строкой, текст после формулы. */
export function UslovieZadachi({
  z,
}: {
  z: Pick<ZadachaKlient, 'uslovieHtml' | 'formulaHtml' | 'dopolnenieHtml'>;
}) {
  return (
    <div className="sb-zadacha__uslovie">
      <p dangerouslySetInnerHTML={{ __html: z.uslovieHtml + (z.formulaHtml === undefined ? '' : ':') }} />
      {z.formulaHtml === undefined ? null : (
        <div className="sb-formula" dangerouslySetInnerHTML={{ __html: z.formulaHtml }} />
      )}
      {z.dopolnenieHtml === undefined ? null : <p dangerouslySetInnerHTML={{ __html: z.dopolnenieHtml }} />}
    </div>
  );
}

/** «Где я ошибся?»: шаги по одному, ученик сверяет со своим решением. */
function PoiskOshibki({
  shagi,
  shag,
  najden,
  onTakZhe,
  onInache,
  onZanovo,
}: {
  shagi: Otkrytoe['shagi'];
  shag: number;
  najden: boolean;
  onTakZhe: () => void;
  onInache: () => void;
  onZanovo: () => void;
}) {
  const vsego = shagi.length;
  if (shag >= vsego) {
    return (
      <div className="sb-poisk" role="status">
        <p className="sb-poisk__itog">
          Все шаги совпали — значит, ошибка в самом конце: в арифметике последнего шага или в записи
          ответа. Сравните свой ответ с последней строкой ещё раз.
        </p>
        <Button variant="secondary" onClick={onZanovo}>
          Исправить ответ
        </Button>
      </div>
    );
  }
  const s = shagi[shag]!;
  return (
    <div className="sb-poisk">
      <p className="sb-poisk__zag">
        Шаг {shag + 1} из {vsego}. {najden ? 'Ошибка — здесь.' : 'У вас получилось так же?'}
      </p>
      <div className={clsx('sb-poisk__shag', najden && 'sb-poisk__shag--oshibka')}>
        <div className="stk-shag__chto" dangerouslySetInnerHTML={{ __html: s.chtoHtml }} />
        {s.formulaHtml === '' ? null : (
          <div className="stk-shag__formula" dangerouslySetInnerHTML={{ __html: s.formulaHtml }} />
        )}
      </div>
      {najden ? (
        <>
          <p className="sb-poisk__itog">
            Разберитесь, что делается на этом шаге и почему, — и решите дальше сами.
          </p>
          <Button variant="secondary" onClick={onZanovo}>
            Решить ещё раз
          </Button>
        </>
      ) : (
        <div className="sb-zadacha__knopki">
          <Button variant="secondary" onClick={onTakZhe}>
            Так же
          </Button>
          <Button variant="secondary" onClick={onInache}>
            У меня иначе
          </Button>
        </div>
      )}
    </div>
  );
}

function PoleVvoda({
  z,
  vvod,
  onVvod,
  readOnly,
}: {
  z: ZadachaKlient;
  vvod: VvodSbornika;
  onVvod: (v: VvodSbornika) => void;
  readOnly: boolean;
}) {
  const ot = z.proverka;
  if (vvod.vid === 'odno') {
    const chislo = ot.vid === 'chislo';
    return (
      <div className="sb-vvod">
        <label className="sb-vvod__podpis">{chislo ? 'Ответ — число' : 'Ответ — выражение'}</label>
        <SbornikPole
          value={vvod.tex}
          onChange={(tex) => onVvod({ vid: 'odno', tex })}
          label="Ответ"
          readOnly={readOnly}
          testId={`otvet-${z.id}`}
        />
      </div>
    );
  }
  if (vvod.vid === 'polya' && ot.vid === 'chisla') {
    return (
      <div className="sb-vvod sb-vvod--polya">
        {ot.polya.map((p, i) => (
          <label className="sb-vvod__pole" key={p.podpis}>
            <span className="sb-vvod__imya" dangerouslySetInnerHTML={{ __html: typeset(`$${p.podpis}=$`) }} />
            <SbornikPole
              value={vvod.polya[i] ?? ''}
              onChange={(tex) => onVvod({ vid: 'polya', polya: vvod.polya.map((old, j) => (j === i ? tex : old)) })}
              label={`Ответ: ${p.podpis}`}
              readOnly={readOnly}
            />
          </label>
        ))}
      </div>
    );
  }
  if (vvod.vid === 'kuski' && ot.vid === 'kusochnyi') {
    const v = ot.peremennaya;
    const izmenit = (i: number, chto: 'oblast' | 'tex', znach: string) =>
      onVvod({
        vid: 'kuski',
        kuski: vvod.kuski.map((k, j) => (j === i ? { ...k, [chto]: znach } : k)),
      });
    return (
      <div className="sb-vvod sb-vvod--kuski">
        <p className="sb-vvod__podpis" dangerouslySetInnerHTML={{
          __html: typeset(`Ответ по случаям: для каждого промежутка значений $${v}$ — своё выражение. Промежутки вместе — вся область определения.`),
        }} />
        {vvod.kuski.map((k, i) => (
          <div className="sb-kusok" key={i}>
            <span className="sb-kusok__pri" dangerouslySetInnerHTML={{ __html: typeset(`при $${v}\\in$`) }} />
            <SbornikPole
              value={k.oblast}
              onChange={(s) => izmenit(i, 'oblast', s)}
              label={`Промежуток ${i + 1}`}
              placeholder="(-∞; 3)"
              readOnly={readOnly}
            />
            <span className="sb-kusok__pri">ответ</span>
            <SbornikPole
              value={k.tex}
              onChange={(s) => izmenit(i, 'tex', s)}
              label={`Выражение ${i + 1}`}
              readOnly={readOnly}
            />
            {readOnly || vvod.kuski.length <= 1 ? null : (
              <button
                type="button"
                className="sb-kusok__ubrat"
                aria-label={`Убрать строку ${i + 1}`}
                onClick={() => onVvod({ vid: 'kuski', kuski: vvod.kuski.filter((_, j) => j !== i) })}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {readOnly || vvod.kuski.length >= 5 ? null : (
          <button
            type="button"
            className="sb-kusok__dobavit"
            onClick={() => onVvod({ vid: 'kuski', kuski: [...vvod.kuski, { oblast: '', tex: '' }] })}
          >
            + ещё случай
          </button>
        )}
      </div>
    );
  }
  return null;
}
