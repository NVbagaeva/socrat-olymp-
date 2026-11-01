'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { Badge, Button, Input } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { Note, Option, OptionGroup, StepHead } from '@/components/tasks/configurator';
import { HintIcon, RightIcon, WrongIcon } from '@/components/tasks/prep/PrepIcons';
import { TrainerSessionHost, type ConfiguratorApi } from '@/components/tasks/session';
import { useSessionReport } from '@/components/tasks/session/useSessionReport';
import { trainerPage } from '@/content/trainerModes';
import { skhema18 } from '@/content/zadanie18/spisok';
import { GRUPPY_18, type Gruppa18, type Podsvechennoe } from '@/content/zadanie18/tipy';
import {
  TRENAZHER_18,
  UROVNI_18,
  ZADACHI_18,
  type Uroven18,
  type Zadacha18,
} from '@/content/zadanie18/trenazher';
import { counted } from '@/lib/plural';
import { typeset } from '@/lib/tex';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import type { TaskMark } from '@/lib/trainerSession/types';
import { proverit18 } from '@/lib/zadanie18/otvet';
import { trebuetsyaScenaTrenazhera18 } from '@/lib/zadanie18/trenazher';
import { ZhivoyChertezh18 } from './ZhivoyChertezh18';
import { isPayload18, peremeshat, readUi18, type Payload18, type Ui18 } from './trenazher18Sessiya';

const T = TRENAZHER_18;
const COUNTS: (number | null)[] = [5, 10, null];
const POORYADOK: Uroven18[] = ['razminka', 'ege', 'povyshennyy'];
const POID = new Map(ZADACHI_18.map((z) => [z.id, z]));
const KNOWN: ReadonlySet<string> = new Set(POID.keys());

function zadacha(id: string | undefined): Zadacha18 {
  const z = id === undefined ? undefined : POID.get(id);
  if (z === undefined) throw new Error(`Нет задачи тренажёра №18 ${id ?? ''}`);
  return z;
}

const temaTitle = (g: Gruppa18) => GRUPPY_18.find((x) => x.id === g)?.title ?? '';
const tonUrovnya = (u: Uroven18) =>
  u === 'povyshennyy' ? 'warning' : u === 'razminka' ? 'success' : 'neutral';

/** Условие с пунктами — одной строкой для итогов. */
function uslovieHtml(z: Zadacha18): string {
  return typeset(`${z.uslovie} а) ${z.a} б) ${z.b}`);
}

/**
 * Тренажёр задания №18 на общей оболочке сессии: выбор тренировки
 * (тема ключевых схем, уровень, число задач) → задачи по одной с
 * панелью, паузой и сохранением → общий экран итогов («Прорешать
 * ошибки», «Похожие задачи» — другие задачи той же темы). Ответ б)
 * проверяется автоматически, доказательство а) ученик сверяет сам и
 * отмечает «Доказал / Не доказал» — отметки видны в итогах.
 */
export function Trenazher18Klient({ base }: { base: string }) {
  /* Последнее состояние экрана: из него итоги берут отметки пункта а). */
  const lastUi = useRef<Ui18 | null>(null);

  return (
    <TrainerSessionHost<Payload18, Ui18>
      scope={scopeOfPath(base) ?? '18'}
      what="тренажёр"
      backHref={base}
      isPayload={(v): v is Payload18 => isPayload18(v, KNOWN)}
      count={(p) => p.ids.length}
      describe={(p, at) => {
        const z = zadacha(p.ids[at]);
        return {
          kind: temaTitle(z.gruppa),
          html: uslovieHtml(z),
          badge: UROVNI_18[z.uroven],
          review: () => <Razbor18 z={z} />,
        };
      }}
      subset={(p, idx) => ({ ids: idx.flatMap((i) => p.ids[i] ?? []) })}
      similar={(p, idx) => {
        /* Другая задача той же темы, которой не было в тренировке. */
        const zanyato = new Set(p.ids);
        const ids: string[] = [];
        for (const i of idx) {
          const z = zadacha(p.ids[i]);
          const drugaya = peremeshat(ZADACHI_18).find(
            (d) => d.gruppa === z.gruppa && !zanyato.has(d.id),
          );
          if (drugaya !== undefined) {
            ids.push(drugaya.id);
            zanyato.add(drugaya.id);
          }
        }
        return ids.length === 0 ? null : { ids };
      }}
      summary={{
        hintedLabel: 'Решено с открытым решением',
        extra: (data) => (
          <ItogA18 proved={lastUi.current?.proved ?? {}} total={data.items.length} base={base} />
        ),
      }}
      configurator={(api) => <Konfigurator18 api={api} />}
      screen={({ payload, sessionId, restored, report, finish }) => (
        <Ekran18
          key={sessionId}
          base={base}
          zadachi={payload.ids.map(zadacha)}
          restored={restored === null ? null : readUi18(restored, payload.ids.length)}
          report={(ui) => {
            lastUi.current = ui;
            report(ui);
          }}
          onFinish={finish}
        />
      )}
    />
  );
}

/* ── Выбор тренировки ─────────────────────────────────────────── */

function Konfigurator18({ api }: { api: ConfiguratorApi<Payload18> }) {
  const [tema, setTema] = useState<Gruppa18 | ''>('');
  const [uroven, setUroven] = useState<Uroven18 | ''>('');
  const [count, setCount] = useState<number | null>(5);

  const podhodyat = ZADACHI_18.filter(
    (z) => (tema === '' || z.gruppa === tema) && (uroven === '' || z.uroven === uroven),
  );
  const skolko = count === null ? podhodyat.length : Math.min(count, podhodyat.length);
  const temaPodpis = tema === '' ? T.vseTemy : temaTitle(tema);
  const urovenPodpis = uroven === '' ? T.vseUrovni : UROVNI_18[uroven];

  function start() {
    /* Уровни по возрастанию: разминка — ЕГЭ — повышенный; внутри уровня — вразброс. */
    const vybor = peremeshat(podhodyat).slice(0, skolko);
    vybor.sort((a, b) => POORYADOK.indexOf(a.uroven) - POORYADOK.indexOf(b.uroven));
    if (vybor.length > 0) api.start({ ids: vybor.map((z) => z.id) });
  }

  return (
    <div className="cfg">
      <h3 className="t-h3 cfg__title">{trainerPage.builder}</h3>
      <div className="cfg__layout">
        <div className="cfg__steps">
          <section className="cfg-step" aria-labelledby="z18-step-tema">
            <StepHead id="z18-step-tema" no="1" title="Выбери тему ключевых схем" lead={T.lead} />
            <OptionGroup id="z18-param-tema" label={T.tema}>
              <Option checked={tema === ''} onSelect={() => setTema('')} title={T.vseTemy} />
              {GRUPPY_18.map((g) => (
                <Option
                  key={g.id}
                  checked={tema === g.id}
                  onSelect={() => setTema(g.id)}
                  title={g.title}
                />
              ))}
            </OptionGroup>
          </section>
          <section className="cfg-step" aria-labelledby="z18-step-params">
            <StepHead
              id="z18-step-params"
              no={trainerPage.params.step}
              title={trainerPage.params.title}
              lead="Выбери уровень и количество задач"
            />
            <div className="cfg-params">
              <OptionGroup id="z18-param-uroven" label={T.uroven}>
                <Option
                  checked={uroven === ''}
                  onSelect={() => setUroven('')}
                  title={T.vseUrovni}
                />
                {POORYADOK.map((u) => (
                  <Option
                    key={u}
                    checked={uroven === u}
                    onSelect={() => setUroven(u)}
                    title={UROVNI_18[u]}
                  />
                ))}
              </OptionGroup>
              <OptionGroup id="z18-param-count" label={trainerPage.params.count} compact>
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
        <aside className="cfg-summary" aria-labelledby="z18-summary-title">
          <h3 className="cfg-summary__title" id="z18-summary-title">
            {trainerPage.summary.title}
          </h3>
          <Badge tone="info">{T.metka}</Badge>
          <p className="cfg-summary__skill">{temaPodpis}</p>
          <p className="cfg-summary__count">{counted(skolko, 'задача', 'задачи', 'задач')}</p>
          {skolko === 0 ? <Note tone="warning">{T.pusto}</Note> : <Note>{T.note}</Note>}
        </aside>
      </div>
      <div className="cfg-bar">
        <Button className="cfg-bar__start" size="lg" onClick={start} disabled={skolko === 0}>
          {trainerPage.start}
        </Button>
        <p className="cfg-bar__summary">
          №18 · {temaPodpis} · {urovenPodpis} · {counted(skolko, 'задача', 'задачи', 'задач')}
        </p>
      </div>
    </div>
  );
}

/* ── Экран задачи ─────────────────────────────────────────────── */

type Chast = 'a' | 'b';

/**
 * Экран задачи: чертёж по данным б), условие, пункт а) с
 * самопроверкой («Показать доказательство» → «Доказал / Не доказал»),
 * поле ответа б) с проверкой (lib/zadanie18/otvet.ts), подсказка
 * («Какие схемы здесь») и решение б). Открытое до верного ответа
 * решение — задача «с открытым решением».
 */
function Ekran18({
  base,
  zadachi,
  restored,
  report,
  onFinish,
}: {
  base: string;
  zadachi: Zadacha18[];
  restored: Ui18 | null;
  report: (ui: Ui18) => void;
  onFinish: () => void;
}) {
  const [index, setIndex] = useState(restored?.index ?? 0);
  const [value, setValue] = useState(restored?.value ?? '');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(restored?.checked ?? null);
  const [marks, setMarks] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});
  const [hintOpen, setHintOpen] = useState(restored?.hintOpen ?? false);
  const [solutionOpen, setSolutionOpen] = useState(restored?.solutionOpen ?? false);
  const [proofOpen, setProofOpen] = useState(restored?.proofOpen ?? false);
  const [proved, setProved] = useState<Record<number, boolean>>(restored?.proved ?? {});
  const [misses, setMisses] = useState(restored?.misses ?? 0);
  const [oshibka, setOshibka] = useState<string | null>(null);
  const [aktivnyy, setAktivnyy] = useState<{ chast: Chast; i: number } | null>(null);

  useSessionReport<Ui18>(report, {
    index,
    marks,
    tried,
    order: null,
    value,
    checked,
    hintOpen,
    solutionOpen,
    proofOpen,
    proved,
    misses,
  });

  const skhema = useMemo(() => {
    const z = zadachi[index];
    return z === undefined ? null : trebuetsyaScenaTrenazhera18(z.id);
  }, [zadachi, index]);

  const z = zadachi[index];
  if (z === undefined || skhema === null) return null;
  const last = index === zadachi.length - 1;
  const shagi: Record<Chast, readonly Podsvechennoe[]> = { a: z.dokazatelstvo, b: z.reshenieB };
  const lit = aktivnyy === null ? [] : (shagi[aktivnyy.chast][aktivnyy.i]?.gruppy ?? []);

  function check() {
    if (z === undefined) return;
    const r = proverit18(value, z.otvet);
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
    setProofOpen(false);
    setOshibka(null);
    setAktivnyy(null);
  }

  function vybrat(chast: Chast, i: number) {
    setAktivnyy(aktivnyy?.chast === chast && aktivnyy.i === i ? null : { chast, i });
  }

  const done = checked === 'right' || solutionOpen;
  const otmetka = proved[index];

  return (
    <section className="ttask z18-tr">
      <ol className="ttask__dots" aria-hidden="true">
        {zadachi.map((item, i) => (
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

      <article className="ptask__card z18-tr__card">
        <div className="z18-tr__head">
          <Badge tone="info">{temaTitle(z.gruppa)}</Badge>
          <Badge tone={tonUrovnya(z.uroven)}>{UROVNI_18[z.uroven]}</Badge>
          <span className="z18-tr__sostavleno">{T.sostavleno}</span>
        </div>
        <div className="z18-tr__grid">
          <div className="z18-tr__chertezh">
            <ZhivoyChertezh18
              key={z.id}
              id={z.id}
              nazvanie={z.nazvanie}
              lit={lit}
              skhema={skhema}
              podskazka={T.podskazkaChertezha}
              znacheniya={done}
            />
          </div>
          <div className="z18-tr__tekst">
            <h3 className="z18-tr__nazvanie">{z.nazvanie}</h3>
            <div className="ptask__question z18-tr__uslovie">
              <p>
                <Tex text={z.uslovie} />
              </p>
              <ol className="z18-op-punkty">
                <li>
                  <span className="z18-op-punkty__bukva">а)</span> <Tex text={z.a} />
                </li>
                <li>
                  <span className="z18-op-punkty__bukva">б)</span> <Tex text={z.b} />
                </li>
              </ol>
            </div>
          </div>
        </div>
      </article>

      <section className="z18-tr__punkt" aria-labelledby="z18-tr-a">
        <h3 className="z18-blok__title" id="z18-tr-a">
          {T.punktA}
        </h3>
        <p className="z18-blok__podskazka">{T.punktAPodskazka}</p>
        {proofOpen ? (
          <>
            <Shagi chast="a" shagi={z.dokazatelstvo} aktivnyy={aktivnyy} onVybrat={vybrat} />
            <div className="z18-tr__samo" role="group" aria-label={T.samoocenka}>
              <span className="z18-tr__samo-vopros">{T.samoocenka}</span>
              <Button
                size="sm"
                variant={otmetka === true ? 'primary' : 'secondary'}
                aria-pressed={otmetka === true}
                onClick={() => setProved({ ...proved, [index]: true })}
              >
                {T.dokazal}
              </Button>
              <Button
                size="sm"
                variant={otmetka === false ? 'primary' : 'secondary'}
                aria-pressed={otmetka === false}
                onClick={() => setProved({ ...proved, [index]: false })}
              >
                {T.neDokazal}
              </Button>
            </div>
            {otmetka === undefined ? null : (
              <p className="z18-tr__otmetka" aria-live="polite">
                {otmetka ? T.otmetkaDokazal : T.otmetkaNeDokazal}
              </p>
            )}
          </>
        ) : (
          <div>
            <Button size="sm" variant="secondary" onClick={() => setProofOpen(true)}>
              {T.pokazatDok}
            </Button>
          </div>
        )}
      </section>

      <div className="ttask__answer z18-tr__punkt">
        <h3 className="z18-blok__title">{T.punktB}</h3>
        <p className="ptask__label" id="z18-ttask-label">
          {T.pole}
        </p>
        <Input
          className="ttask__input"
          value={value}
          placeholder={T.polePodskazka}
          state={checked === null ? 'default' : checked === 'right' ? 'success' : 'error'}
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          aria-labelledby="z18-ttask-label"
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
        {oshibka === null ? null : <p className="z18-tr__neverno">{oshibka}</p>}

        {checked === null ? null : (
          <div className={clsx('tverdict', `tverdict--${checked}`)} role="status">
            <p className="tverdict__title">
              <span className="tverdict__ico">
                {checked === 'right' ? <RightIcon /> : <WrongIcon />}
              </span>
              {checked === 'right' ? T.verno : T.estOshibka}
            </p>
            <p className="tverdict__text">
              {checked === 'right'
                ? marks[index] === 'hinted'
                  ? T.vernoSResheniem
                  : T.vernoTekst
                : T.neverno}
            </p>
          </div>
        )}

        {hintOpen ? (
          <aside className="ptask__hint z18-tr__hint">
            <p className="ptask__hint-head">
              <HintIcon />
              {T.podskazka}
            </p>
            <p className="ptask__hint-text">
              <Tex text={z.podskazka} />
            </p>
            <p className="z18-tr__hint-sub">{T.skhemyZdes}</p>
            <ul className="z18-op-skhemy">
              {z.skhemy.map((s) => {
                const sk = skhema18(s.id);
                if (sk === undefined) return null;
                return (
                  <li key={s.id}>
                    <Link className="z18-op-skhemy__ssylka" href={`${base}/skhemy/${s.id}/`}>
                      <span className="z18-op-skhemy__no">{sk.no}</span>
                      {sk.nazvanie}
                    </Link>
                    <span className="z18-op-skhemy__zachem">
                      <Tex text={s.zachem} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </aside>
        ) : null}

        {solutionOpen ? (
          <div className="z18-tr__reshenie" role="region" aria-label={T.reshenieB}>
            <p className="z18-blok__title">{T.reshenieB}</p>
            <Shagi chast="b" shagi={z.reshenieB} aktivnyy={aktivnyy} onVybrat={vybrat} />
            <p className="z18-op-otvet">
              {T.otvet}: <Tex text={z.otvet} />
            </p>
          </div>
        ) : null}

        <div className="ttask__actions">
          {done ? (
            <Button onClick={last ? onFinish : next}>
              {last ? 'Смотреть результат →' : 'Следующее задание →'}
            </Button>
          ) : (
            <Button onClick={check} disabled={value.trim() === ''}>
              {T.proverit}
            </Button>
          )}
          {hintOpen || done ? null : (
            <Button variant="ghost" onClick={() => setHintOpen(true)}>
              {T.podskazka}
            </Button>
          )}
          {solutionOpen ? null : (
            <span className="thint__offer">
              <Button variant="ghost" onClick={reveal}>
                {T.pokazatReshenie}
              </Button>
              {checked === 'right' ? null : <span className="thint__warn">{T.nezachet}</span>}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/** Шаги доказательства или решения: нажатие подсвечивает шаг на чертеже. */
function Shagi({
  chast,
  shagi,
  aktivnyy,
  onVybrat,
}: {
  chast: Chast;
  shagi: readonly Podsvechennoe[];
  aktivnyy: { chast: Chast; i: number } | null;
  onVybrat: (chast: Chast, i: number) => void;
}) {
  return (
    <>
      <p className="z18-blok__podskazka">{T.shagPodskazka}</p>
      <ol className="z18-sled z18-op-shagi">
        {shagi.map((s, i) => {
          const gorit = aktivnyy?.chast === chast && aktivnyy.i === i;
          return (
            <li key={i}>
              <button
                type="button"
                className={clsx('z18-sled__fakt', gorit && 'is-active')}
                aria-pressed={gorit}
                onClick={() => onVybrat(chast, i)}
              >
                <span className="z18-sled__no">{i + 1}</span>
                <Tex className="z18-sled__tekst" text={s.tekst} />
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** Разбор задачи на экране итогов: доказательство а), решение и ответ б). */
function Razbor18({ z }: { z: Zadacha18 }) {
  return (
    <div className="z18-tr__razbor">
      <p className="z18-blok__title">{T.punktA}</p>
      <ol className="z18-tr__razbor-shagi">
        {z.dokazatelstvo.map((s, i) => (
          <li key={i}>
            <Tex text={s.tekst} />
          </li>
        ))}
      </ol>
      <p className="z18-blok__title">{T.reshenieB}</p>
      <ol className="z18-tr__razbor-shagi">
        {z.reshenieB.map((s, i) => (
          <li key={i}>
            <Tex text={s.tekst} />
          </li>
        ))}
      </ol>
      <p className="z18-op-otvet">
        {T.otvet}: <Tex text={z.otvet} />
      </p>
    </div>
  );
}

/** Строка итогов о пункте а): сколько доказательств ученик отметил «Доказал». */
function ItogA18({
  proved,
  total,
  base,
}: {
  proved: Record<number, boolean>;
  total: number;
  base: string;
}) {
  const otmecheno = Object.values(proved);
  const da = otmecheno.filter(Boolean).length;
  return (
    <div className="z18-tr__itog">
      <p className="z18-tr__itog-stroka">
        {otmecheno.length === 0 ? T.itogANet : T.itogA(da, total)}
      </p>
      <p className="z18-blok__podskazka">{T.itogASovet}</p>
      <Link className="btn btn--secondary btn--sm" href={`${base}/opornye-zadachi/`}>
        {T.kOpornym}
      </Link>
    </div>
  );
}
