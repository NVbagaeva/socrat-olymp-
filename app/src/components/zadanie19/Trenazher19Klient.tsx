'use client';

import { useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Badge, Button, Input } from '@/components/ui';
import { Note, Option, OptionGroup, StepHead } from '@/components/tasks/configurator';
import { HintIcon, RightIcon, WrongIcon } from '@/components/tasks/prep/PrepIcons';
import { TrainerSessionHost, type ConfiguratorApi } from '@/components/tasks/session';
import { useSessionReport } from '@/components/tasks/session/useSessionReport';
import { trainerPage } from '@/content/trainerModes';
import { RABOTA_19, TRENAZHER_19, UROVNI_19 } from '@/content/zadanie19';
import type { Uroven19 } from '@/content/teoriya19/tipy';
import { counted } from '@/lib/plural';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import type { TaskMark } from '@/lib/trainerSession/types';
import { proverit16 } from '@/lib/zadanie16/otvet';
import type { Zadanie19View } from './Rabota19';
import { isPayload19, peremeshat, readUi19, type Payload19, type Ui19 } from './trenazher19Sessiya';

/** Задание банка с тем, что нужно тренажёру: метод и условие строкой для итогов. */
export interface Zadanie19Bank extends Zadanie19View {
  metod: number;
  metodTitle: string;
  /** Условие, набранное KaTeX, — для экрана итогов. */
  uslovieHtml: string;
}

const ZNAKI = ['(', ')', '[', ']', ';', '−∞', '+∞', '∪', '√', '{', '}', '/'] as const;
const COUNTS: (number | null)[] = [5, 10, null];

/**
 * Тренажёр задания №19 на общей оболочке сессии: выбор тренировки
 * (метод, уровень, число заданий) → задания по одному с панелью,
 * паузой и сохранением → общий экран итогов («Прорешать ошибки»,
 * «Похожие задачи» — другие задачи тех же методов).
 */
export function Trenazher19Klient({ base, bank }: { base: string; bank: Zadanie19Bank[] }) {
  const poId = useMemo(() => new Map(bank.map((z) => [z.id, z])), [bank]);
  const known = useMemo(() => new Set(poId.keys()), [poId]);
  const zadacha = (id: string | undefined): Zadanie19Bank => {
    const z = id === undefined ? undefined : poId.get(id);
    if (z === undefined) throw new Error(`Нет задания ${id ?? ''}`);
    return z;
  };

  return (
    <TrainerSessionHost<Payload19, Ui19>
      scope={scopeOfPath(base) ?? '19'}
      what="тренажёр"
      backHref={base}
      isPayload={(v): v is Payload19 => isPayload19(v, known)}
      count={(p) => p.ids.length}
      describe={(p, at) => {
        const z = zadacha(p.ids[at]);
        return {
          kind: z.metodTitle,
          html: z.uslovieHtml,
          badge: UROVNI_19[z.uroven],
          review: () => <div className="z19-zad__reshenie">{z.reshenie}</div>,
        };
      }}
      subset={(p, idx) => ({ ids: idx.flatMap((i) => p.ids[i] ?? []) })}
      similar={(p, idx) => {
        /* Другая задача того же метода, которой не было в тренировке. */
        const zanyato = new Set(p.ids);
        const ids: string[] = [];
        for (const i of idx) {
          const z = zadacha(p.ids[i]);
          const drugaya = peremeshat(bank).find((d) => d.metod === z.metod && !zanyato.has(d.id));
          if (drugaya !== undefined) {
            ids.push(drugaya.id);
            zanyato.add(drugaya.id);
          }
        }
        return ids.length === 0 ? null : { ids };
      }}
      summary={{ hintedLabel: 'Решено с открытым решением' }}
      configurator={(api) => <Konfigurator19 bank={bank} api={api} />}
      screen={({ payload, sessionId, restored, report, elapsed, finish }) => (
        <Ekran19
          key={sessionId}
          zadaniya={payload.ids.map(zadacha)}
          restored={restored === null ? null : readUi19(restored, payload.ids.length)}
          report={report}
          elapsed={elapsed}
          onFinish={finish}
        />
      )}
    />
  );
}

function Konfigurator19({ bank, api }: { bank: Zadanie19Bank[]; api: ConfiguratorApi<Payload19> }) {
  const metody = useMemo(
    () =>
      [...new Map(bank.map((z) => [z.metod, z.metodTitle])).entries()].sort((a, b) => a[0] - b[0]),
    [bank],
  );
  const [metod, setMetod] = useState<number>(0);
  const [uroven, setUroven] = useState<Uroven19 | ''>('');
  const [count, setCount] = useState<number | null>(5);

  const podhodyat = bank.filter(
    (z) => (metod === 0 || z.metod === metod) && (uroven === '' || z.uroven === uroven),
  );
  const skolko = count === null ? podhodyat.length : Math.min(count, podhodyat.length);
  const metodTitle =
    metod === 0 ? TRENAZHER_19.vse : (metody.find((m) => m[0] === metod)?.[1] ?? '');

  function start() {
    /* Уровни по возрастанию: разминка — ЕГЭ — повышенный; внутри уровня — вразброс. */
    const poryadok: Uroven19[] = ['razminka', 'ege', 'povyshennyy'];
    const vybor = peremeshat(podhodyat).slice(0, skolko);
    vybor.sort((a, b) => poryadok.indexOf(a.uroven) - poryadok.indexOf(b.uroven));
    if (vybor.length > 0) api.start({ ids: vybor.map((z) => z.id) });
  }

  return (
    <div className="cfg">
      <h3 className="t-h3 cfg__title">{trainerPage.builder}</h3>
      <div className="cfg__layout">
        <div className="cfg__steps">
          <section className="cfg-step" aria-labelledby="z19-step-metod">
            <StepHead id="z19-step-metod" no="1" title="Выбери метод" lead={TRENAZHER_19.lead} />
            <OptionGroup id="z19-param-metod" label={TRENAZHER_19.metod}>
              <Option checked={metod === 0} onSelect={() => setMetod(0)} title={TRENAZHER_19.vse} />
              {metody.map(([no, title]) => (
                <Option
                  key={no}
                  checked={metod === no}
                  onSelect={() => setMetod(no)}
                  title={title}
                />
              ))}
            </OptionGroup>
          </section>
          <section className="cfg-step" aria-labelledby="z19-step-params">
            <StepHead
              id="z19-step-params"
              no={trainerPage.params.step}
              title={trainerPage.params.title}
              lead="Выбери сложность и количество заданий"
            />
            <div className="cfg-params">
              <OptionGroup id="z19-param-uroven" label={TRENAZHER_19.uroven}>
                <Option
                  checked={uroven === ''}
                  onSelect={() => setUroven('')}
                  title={TRENAZHER_19.vseUrovni}
                />
                {(Object.keys(UROVNI_19) as Uroven19[]).map((u) => (
                  <Option
                    key={u}
                    checked={uroven === u}
                    onSelect={() => setUroven(u)}
                    title={UROVNI_19[u]}
                  />
                ))}
              </OptionGroup>
              <OptionGroup id="z19-param-count" label={trainerPage.params.count} compact>
                {COUNTS.map((c) => (
                  <Option
                    key={c ?? 'all'}
                    checked={count === c}
                    onSelect={() => setCount(c)}
                    title={c === null ? `${trainerPage.params.all} (${podhodyat.length})` : c}
                  />
                ))}
              </OptionGroup>
            </div>
          </section>
        </div>
        <aside className="cfg-summary" aria-labelledby="z19-summary-title">
          <h3 className="cfg-summary__title" id="z19-summary-title">
            {trainerPage.summary.title}
          </h3>
          <Badge tone="info">Задача с параметром</Badge>
          <p className="cfg-summary__skill">{metodTitle}</p>
          <p className="cfg-summary__count">{counted(skolko, 'задание', 'задания', 'заданий')}</p>
          {skolko === 0 ? (
            <Note tone="warning">{TRENAZHER_19.pusto}</Note>
          ) : (
            <Note>{TRENAZHER_19.note}</Note>
          )}
        </aside>
      </div>
      <div className="cfg-bar">
        <Button className="cfg-bar__start" size="lg" onClick={start} disabled={skolko === 0}>
          {trainerPage.start}
        </Button>
        <p className="cfg-bar__summary">
          №19 · {metodTitle} · {uroven === '' ? TRENAZHER_19.vseUrovni : UROVNI_19[uroven]} ·{' '}
          {counted(skolko, 'задание', 'задания', 'заданий')}
        </p>
      </div>
    </div>
  );
}

/**
 * Экран заданий: условие, поле ответа со знаками, проверка множества
 * (lib/zadanie16/otvet.ts), бесплатная подсказка и решение. Открытое
 * до верного ответа решение — задача «с открытым решением».
 */
function Ekran19({
  zadaniya,
  restored,
  report,
  onFinish,
}: {
  zadaniya: Zadanie19Bank[];
  restored: Ui19 | null;
  report: (ui: Ui19) => void;
  elapsed: () => number;
  onFinish: () => void;
}) {
  const [index, setIndex] = useState(restored?.index ?? 0);
  const [value, setValue] = useState(restored?.value ?? '');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(restored?.checked ?? null);
  const [marks, setMarks] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});
  const [hintOpen, setHintOpen] = useState(restored?.hintOpen ?? false);
  const [solutionOpen, setSolutionOpen] = useState(restored?.solutionOpen ?? false);
  const [failed, setFailed] = useState(restored?.failed ?? false);
  const [misses, setMisses] = useState(restored?.misses ?? 0);
  const [oshibka, setOshibka] = useState<string | null>(null);
  const pole = useRef<HTMLInputElement>(null);

  useSessionReport<Ui19>(report, {
    index,
    marks,
    tried,
    order: null,
    value,
    checked,
    hintOpen,
    solutionOpen,
    failed,
    misses,
  });

  const z = zadaniya[index];
  if (z === undefined) return null;
  const last = index === zadaniya.length - 1;

  function vstavit(znak: string) {
    const el = pole.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    setValue(value.slice(0, start) + znak + value.slice(end));
    if (checked === 'wrong') setChecked(null);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + znak.length, start + znak.length);
    });
  }

  function check() {
    if (z === undefined) return;
    const r = proverit16(value, z.otvet);
    if (typeof r === 'object') {
      /* Запись не разобралась: это не ошибка в решении, попытку не считаем. */
      setOshibka(r.oshibka);
      return;
    }
    setOshibka(null);
    setChecked(r === 'verno' ? 'right' : 'wrong');
    if (r === 'verno') {
      setMarks({ ...marks, [index]: solutionOpen ? 'hinted' : 'right' });
    } else {
      setFailed(true);
      setMisses(misses + 1);
      setTried({ ...tried, [index]: true });
    }
  }

  function reveal() {
    setSolutionOpen(true);
    if (checked !== 'right') setMarks({ ...marks, [index]: 'hinted' });
  }

  function next() {
    setIndex(index + 1);
    setValue('');
    setChecked(null);
    setHintOpen(false);
    setSolutionOpen(false);
    setFailed(false);
    setOshibka(null);
  }

  const done = checked === 'right' || solutionOpen;

  return (
    <section className="ttask z19-ttask">
      <ol className="ttask__dots" aria-hidden="true">
        {zadaniya.map((item, i) => (
          <li
            key={`${i}-${item.id}`}
            className={clsx(
              'ttask__dot',
              marks[i] === 'right' && 'is-done',
              marks[i] === 'hinted' && 'is-hinted',
              i === index && 'is-current',
            )}
          >
            {marks[i] === undefined ? i + 1 : <RightIcon />}
          </li>
        ))}
      </ol>

      <article className="ptask__card z19-ttask__card">
        <div className="z19-zad__head">
          <Badge tone="info">{z.metodTitle}</Badge>
          <Badge
            tone={
              z.uroven === 'povyshennyy'
                ? 'warning'
                : z.uroven === 'razminka'
                  ? 'success'
                  : 'neutral'
            }
          >
            {UROVNI_19[z.uroven]}
          </Badge>
        </div>
        <div className="z16-zad__uslovie ptask__question">{z.uslovie}</div>
      </article>

      <div className="ttask__answer">
        <p className="ptask__label" id="z19-ttask-label">
          {RABOTA_19.pole}
        </p>
        <Input
          ref={pole}
          className="ttask__input"
          value={value}
          placeholder={RABOTA_19.polePodskazka}
          state={checked === null ? 'default' : checked === 'right' ? 'success' : 'error'}
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          aria-labelledby="z19-ttask-label"
          readOnly={checked === 'right'}
          onChange={(e) => {
            setValue(e.target.value);
            setOshibka(null);
            if (checked === 'wrong') setChecked(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && checked !== 'right' && value.trim() !== '') check();
          }}
        />
        {checked === 'right' ? null : (
          <div className="z16-zad__znaki" role="group" aria-label="Знаки для ответа">
            {ZNAKI.map((zn) => (
              <button type="button" key={zn} className="z16-zad__znak" onClick={() => vstavit(zn)}>
                {zn}
              </button>
            ))}
          </div>
        )}
        {oshibka === null ? null : <p className="z16-zad__neverno">{oshibka}</p>}

        {checked === null ? null : (
          <div className={clsx('tverdict', `tverdict--${checked}`)} role="status">
            <p className="tverdict__title">
              <span className="tverdict__ico">
                {checked === 'right' ? <RightIcon /> : <WrongIcon />}
              </span>
              {checked === 'right' ? RABOTA_19.verno : 'Есть ошибка'}
            </p>
            <p className="tverdict__text">
              {checked === 'right'
                ? solutionOpen
                  ? 'Ответ верный, но решение было открыто — задача не засчитана.'
                  : 'Множество значений параметра совпало с верным.'
                : RABOTA_19.neverno}
            </p>
          </div>
        )}

        {hintOpen ? (
          <aside className="ptask__hint">
            <p className="ptask__hint-head">
              <HintIcon />
              {RABOTA_19.podskazka}
            </p>
            <div className="ptask__hint-text">{z.podskazka}</div>
          </aside>
        ) : null}

        {solutionOpen ? (
          <div className="z19-zad__reshenie" role="region" aria-label="Решение">
            {z.reshenie}
          </div>
        ) : null}

        <div className="ttask__actions">
          {done ? (
            <Button onClick={last ? onFinish : next}>
              {last ? 'Смотреть результат →' : 'Следующее задание →'}
            </Button>
          ) : (
            <Button onClick={check} disabled={value.trim() === ''}>
              {RABOTA_19.proverit}
            </Button>
          )}
          {hintOpen || done ? null : (
            <Button variant="ghost" onClick={() => setHintOpen(true)}>
              {RABOTA_19.podskazka}
            </Button>
          )}
          {solutionOpen ? null : (
            <span className="thint__offer">
              <Button variant="ghost" onClick={reveal}>
                {RABOTA_19.reshenie}
              </Button>
              {checked === 'right' ? null : (
                <span className="thint__warn">Задача не будет засчитана.</span>
              )}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
