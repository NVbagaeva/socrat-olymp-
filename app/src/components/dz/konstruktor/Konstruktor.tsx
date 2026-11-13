'use client';

/**
 * Конструктор ДЗ — /kabinet/dz-vydat/ (docs/kabinet-dz-istochniki.md).
 *
 * Слева (на телефоне — сверху) — источники: раздел и вкладки
 * «Карточки», «Опорные задачи», «Тренажёр». Справа (на телефоне —
 * снизу, свёрнутой панелью) — «Состав ДЗ». Под ними — кому, срок,
 * попытки, решения, «Без подсказок», название и комментарий; шаблоны.
 * Состав живёт в черновике (lib/dz/chernovik.ts): то, что репетитор
 * положил кнопкой в разделе, уже здесь.
 *
 * Прежние ссылки «Выдать ДЗ» из №8 (?ot=&tipy=&n=&zadachi=) кладут свои
 * типы и задачи в черновик; ?oshibki=<id> — работа над ошибками по ДЗ.
 */

import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Checkbox, EmptyState, FieldLabel, Input, Radio, Select } from '@/components/ui';
import { DZ, SOLUTIONS_WHEN, dzError } from '@/content/dz';
import { DZK } from '@/content/dzIstochniki';
import type { HwFull, HwTemplate, TutorClass } from '@/lib/dz/api';
import {
  dobavit,
  ochistit,
  sohranitSeychas,
  useChernovik,
  zadatNastroyki,
  zadatSostav,
  zagruzitChernovik,
} from '@/lib/dz/chernovik';
import { zagruzitKatalogi } from '@/lib/dz/katalog/zagruzka';
import type { KatalogRazdela } from '@/lib/dz/katalog/types';
import { DZ_HREF, homeworkHref, readIssuePreset } from '@/lib/dz/links';
import { memberNameOf } from '@/lib/dz/names';
import {
  PREDEL,
  chitatSostav,
  nazvaniePoUmolchaniyu,
  schet as schitat,
  vPredele,
  type Razmery,
  type Sostav as SostavT,
} from '@/lib/dz/sostav';
import type { AttemptsLimit, HwOrigin, HwPartInput, SolutionsWhen } from '@/lib/dz/types';
import { Confirm, NeedLogin, dzApi, errorCode, useUser } from '../common';
import { Istochniki } from './Istochniki';
import { Sostav } from './Sostav';
import './konstruktor.css';

/** Срок по умолчанию: через неделю, 20:00 — в формате поля datetime-local. */
function defaultDue(): string {
  const d = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  d.setHours(20, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function razmery(k: ReadonlyMap<number, KatalogRazdela>): Razmery {
  return {
    nabor: (no, id) => k.get(no)?.kartochki?.find((t) => t.id === id)?.kartochki.length ?? 0,
    blok: (no, slug) => k.get(no)?.opornye.find((b) => b.slug === slug)?.zadachi.length ?? 0,
  };
}

/** Прежние ссылки «Выдать ДЗ» №8: типы и задачи — в черновик. */
async function iliPrezhnyayaSsylka(): Promise<HwOrigin> {
  const preset = readIssuePreset(window.location.search);
  const kinds = preset.kinds ?? [];
  if (kinds.length > 0) {
    await dobavit({
      ist: 'trenazher',
      no: 8,
      tipy: [...kinds],
      skolko: Math.min(20, (preset.perKind ?? 2) * kinds.length),
      kazhdomu: false,
    });
  }
  for (const ref of preset.refs ?? []) {
    await dobavit({ ist: 'zadacha', no: 8, ref, tip: ref.split('|')[0] ?? '' });
  }
  if (kinds.length > 0 || (preset.refs?.length ?? 0) > 0) {
    window.history.replaceState(null, '', DZ_HREF.vydat);
  }
  return preset.origin;
}

export function Konstruktor() {
  const user = useUser();
  const [classes, setClasses] = useState<TutorClass[] | null>(null);
  const [origin, setOrigin] = useState<HwOrigin>('kabinet');
  const [oshibki, setOshibki] = useState<string | null>(null);

  useEffect(() => {
    if (user === null || user.role !== 'tutor') return;
    void (async () => {
      const api = await dzApi();
      await zagruzitChernovik();
      const mistakesOf = readIssuePreset(window.location.search).mistakesOf ?? null;
      setOshibki(mistakesOf);
      if (mistakesOf === null) setOrigin(await iliPrezhnyayaSsylka());
      setClasses(await api.loadTutorClasses().catch(() => []));
    })();
  }, [user]);

  if (user === null) return <NeedLogin text="Войдите в кабинет репетитора." />;
  if (user.role !== 'tutor') {
    return (
      <EmptyState
        title="Эта страница — для репетитора."
        description="Задания выдаёт репетитор своим ученикам."
      />
    );
  }
  if (classes === null) return <p className="dzk-muted">{DZK.zagruzka}</p>;
  if (classes.length === 0) return <EmptyState title={DZK.title} description={DZ.issue.noClasses} />;
  if (oshibki !== null) return <Oshibki hwId={oshibki} />;
  return <Sborka classes={classes} origin={origin} />;
}

/* ── Кому ─────────────────────────────────────────────────────── */

function Komu({
  classes,
  classId,
  onClass,
  students,
  onStudents,
  tolko,
}: {
  classes: TutorClass[];
  classId: string;
  onClass: (id: string) => void;
  students: Set<string>;
  onStudents: (s: Set<string>) => void;
  /** Работа над ошибками: только эти ученики. */
  tolko?: ReadonlySet<string>;
}) {
  const id = useId();
  const klass = classes.find((k) => k.id === classId);
  const members = (klass?.members ?? []).filter((m) => tolko === undefined || tolko.has(m.userId));
  const vybrano = members.filter((m) => students.has(m.userId)).length;
  return (
    <fieldset className="dzk-pole" data-section="who">
      <legend className="dzk-legend">{DZ.issue.who}</legend>
      <FieldLabel htmlFor={id}>{DZ.issue.klass}</FieldLabel>
      <Select id={id} value={classId} disabled={tolko !== undefined} onChange={(e) => onClass(e.target.value)}>
        {classes.map((k) => (
          <option key={k.id} value={k.id}>
            {k.name}
          </option>
        ))}
      </Select>
      {members.length === 0 ? (
        <p className="dzk-muted">{DZ.issue.noStudents}</p>
      ) : (
        <div className="dz-checks dzk-checks" data-list="students">
          <Checkbox
            checked={vybrano === members.length}
            indeterminate={vybrano > 0 && vybrano < members.length}
            onChange={(e) => onStudents(new Set(e.target.checked ? members.map((m) => m.userId) : []))}
          >
            {DZ.issue.allStudents}
          </Checkbox>
          {members.map((m) => (
            <Checkbox
              key={m.userId}
              checked={students.has(m.userId)}
              onChange={() => {
                const n = new Set(students);
                if (n.has(m.userId)) n.delete(m.userId);
                else n.add(m.userId);
                onStudents(n);
              }}
            >
              {memberNameOf(m)}
            </Checkbox>
          ))}
        </div>
      )}
    </fieldset>
  );
}

/* ── Настройки ДЗ ─────────────────────────────────────────────── */

interface Obshchee {
  title: string;
  due: string;
  noDue: boolean;
}

function Nastroyki({
  sostav,
  obshchee,
  onObshchee,
}: {
  sostav: SostavT;
  obshchee: Obshchee;
  onObshchee: (o: Obshchee) => void;
}) {
  const ids = { title: useId(), due: useId(), note: useId() };
  const n = sostav.nastroyki;
  return (
    <fieldset className="dzk-pole" data-section="settings">
      <legend className="dzk-legend">{DZK.nastroyki.title}</legend>
      <FieldLabel htmlFor={ids.title}>{DZK.nastroyki.nazvanie}</FieldLabel>
      <Input
        id={ids.title}
        name="title"
        value={obshchee.title}
        maxLength={120}
        onChange={(e) => onObshchee({ ...obshchee, title: e.target.value })}
      />
      <FieldLabel htmlFor={ids.due}>{DZ.issue.due}</FieldLabel>
      <div className="dzk-ryad">
        <Input
          id={ids.due}
          name="due"
          type="datetime-local"
          value={obshchee.due}
          disabled={obshchee.noDue}
          onChange={(e) => onObshchee({ ...obshchee, due: e.target.value })}
        />
        <Checkbox checked={obshchee.noDue} onChange={(e) => onObshchee({ ...obshchee, noDue: e.target.checked })}>
          {DZ.issue.noDue}
        </Checkbox>
      </div>
      <p className="dz-field-title">{DZ.issue.attempts}</p>
      <div className="dz-seg" role="radiogroup" aria-label={DZ.issue.attempts}>
        {([1, 2, null] as AttemptsLimit[]).map((v) => (
          <Radio key={String(v)} name="attempts" checked={n.attemptsLimit === v} onChange={() => zadatNastroyki({ attemptsLimit: v })}>
            {DZ.issue.attemptsOptions[String(v)]}
          </Radio>
        ))}
      </div>
      <p className="dz-field-title">{DZ.issue.solutions}</p>
      <div className="dz-seg" role="radiogroup" aria-label={DZ.issue.solutions}>
        {(['instant', 'after_submit', 'after_due'] as SolutionsWhen[]).map((w) => (
          <Radio key={w} name="when" checked={n.solutionsWhen === w} onChange={() => zadatNastroyki({ solutionsWhen: w })}>
            {SOLUTIONS_WHEN[w]}
          </Radio>
        ))}
      </div>
      <Checkbox checked={n.noHints} onChange={(e) => zadatNastroyki({ noHints: e.target.checked })}>
        {DZK.nastroyki.bezPodskazok}
      </Checkbox>
      <p className="dzk-muted">{DZK.nastroyki.bezPodskazokLead}</p>
      <Checkbox checked={n.showMemo && !n.noHints} disabled={n.noHints} onChange={(e) => zadatNastroyki({ showMemo: e.target.checked })}>
        {DZK.nastroyki.zapomni}
      </Checkbox>
      <Checkbox checked={n.showExample && !n.noHints} disabled={n.noHints} onChange={(e) => zadatNastroyki({ showExample: e.target.checked })}>
        {DZK.nastroyki.primer}
      </Checkbox>
      <FieldLabel htmlFor={ids.note}>{DZK.nastroyki.kommentariy}</FieldLabel>
      <textarea
        id={ids.note}
        className="input dz-textarea"
        value={n.note}
        maxLength={2000}
        rows={3}
        placeholder={DZK.nastroyki.kommentariyPlaceholder}
        onChange={(e) => zadatNastroyki({ note: e.target.value })}
      />
    </fieldset>
  );
}

/* ── Шаблоны ──────────────────────────────────────────────────── */

function Shablony({ sostav }: { sostav: SostavT }) {
  const [list, setList] = useState<HwTemplate[] | null>(null);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [vzyat, setVzyat] = useState<HwTemplate | null>(null);
  const id = useId();
  const obnovit = () =>
    void dzApi()
      .then((api) => api.listTemplates())
      .then(setList)
      .catch(() => setList([]));
  useEffect(obnovit, []);
  return (
    <details className="dzk-pole dzk-shablony" data-section="templates">
      <summary className="dzk-legend">{DZK.shablony.izShablona}</summary>
      <p className="dzk-muted">{DZK.shablony.lead}</p>
      {list === null ? null : list.length === 0 ? (
        <p className="dzk-muted">{DZK.shablony.pusto}</p>
      ) : (
        <ul className="dzk-shablony__spisok">
          {list.map((t) => (
            <li key={t.id}>
              <span>{t.title}</span>
              <span className="dzk-item__knopki">
                <button type="button" className="stk-btn stk-btn--sm stk-btn--primary" onClick={() => setVzyat(t)}>
                  {DZK.shablony.vzyat}
                </button>
                <button
                  type="button"
                  className="stk-btn stk-btn--sm stk-btn--tihaya"
                  onClick={() => void dzApi().then((api) => api.deleteTemplate(t.id)).then(obnovit)}
                >
                  {DZK.shablony.udalit}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <FieldLabel htmlFor={id}>{DZK.shablony.nazvanie}</FieldLabel>
      <div className="dzk-ryad">
        <Input id={id} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
        <button
          type="button"
          className="stk-btn stk-btn--sm"
          disabled={name.trim() === '' || sostav.punkty.length === 0}
          onClick={() =>
            void dzApi()
              .then((api) => api.saveTemplate(name, { ...sostav, punkty: sostav.punkty }))
              .then(() => {
                setName('');
                setMsg(DZK.shablony.sohraneno);
                obnovit();
              })
              .catch((e) => setMsg(dzError(errorCode(e))))
          }
        >
          {DZK.shablony.sohranit}
        </button>
      </div>
      {msg === null ? null : <p className="dzk-muted" role="status">{msg}</p>}
      <Confirm
        open={vzyat !== null}
        title={DZK.shablony.vzyatVopros}
        text={DZK.shablony.vzyatText}
        action={DZK.shablony.vzyat}
        onCancel={() => setVzyat(null)}
        onConfirm={() => {
          if (vzyat !== null) zadatSostav(chitatSostav(vzyat.body));
          setVzyat(null);
        }}
      />
    </details>
  );
}

/* ── Сборка и выдача ──────────────────────────────────────────── */

function useKatalogi(nomera: readonly number[]): Map<number, KatalogRazdela> {
  const [k, setK] = useState<Map<number, KatalogRazdela>>(new Map());
  const key = [...new Set(nomera)].sort().join(',');
  useEffect(() => {
    if (key === '') return;
    let alive = true;
    void zagruzitKatalogi(key.split(',').map(Number))
      .then((m) => {
        if (alive) setK(m);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [key]);
  return k;
}

function Vydano({ id, n }: { id: string; n: number }) {
  return (
    <div className="dzk dzk-vydano stk-glass" data-page="vydano">
      <h1 className="dzk-title">{DZK.vydano}</h1>
      <p>{DZK.vydanoText(n)}</p>
      <div className="dzk-item__knopki">
        <Link className="stk-btn stk-btn--primary" href={homeworkHref(id)}>
          {DZK.kRezultatam}
        </Link>
        <Link className="stk-btn stk-btn--tihaya" href={DZ_HREF.vydat} onClick={() => window.location.reload()}>
          {DZK.eshche}
        </Link>
      </div>
    </div>
  );
}

function Sborka({ classes, origin }: { classes: TutorClass[]; origin: HwOrigin }) {
  const ch = useChernovik();
  const sostav = ch.status === 'gotovo' ? ch.sostav : null;
  const katalogi = useKatalogi(sostav?.punkty.map((p) => p.no) ?? []);
  const [classId, setClassId] = useState(classes[0]?.id ?? '');
  const [students, setStudents] = useState<Set<string>>(
    () => new Set((classes[0]?.members ?? []).map((m) => m.userId)),
  );
  const [obshchee, setObshchee] = useState<Obshchee>(() => ({
    title: nazvaniePoUmolchaniyu(),
    due: defaultDue(),
    noDue: false,
  }));
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [issued, setIssued] = useState<{ id: string; n: number } | null>(null);
  const [ochistitVopros, setOchistitVopros] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const r = useMemo(() => razmery(katalogi), [katalogi]);
  const s = useMemo(() => (sostav === null ? null : schitat(sostav.punkty, r)), [sostav, r]);
  const vsego = sostav === null ? 0 : vPredele(sostav.punkty, r);
  const predel = vsego > PREDEL ? DZK.predel(vsego) : null;

  if (issued !== null) return <Vydano id={issued.id} n={issued.n} />;
  if (sostav === null || s === null) return <p className="dzk-muted">{DZK.zagruzka}</p>;

  const klass = classes.find((k) => k.id === classId);
  const recipients = (klass?.members ?? []).filter((m) => students.has(m.userId)).map((m) => m.userId);

  async function vydat() {
    if (sostav === null) return;
    setError(null);
    const fail = (text: string) => {
      setError(text);
      window.setTimeout(() => errorRef.current?.focus(), 0);
    };
    if (obshchee.title.trim() === '') return fail(DZ.issue.nameRequired);
    if (recipients.length === 0) return fail(dzError('no_recipients'));
    if (sostav.punkty.length === 0) return fail(DZK.sostav.pusto);
    if (predel !== null) return fail(predel);
    setSending(true);
    try {
      const [{ sobratPunkty }, api] = await Promise.all([import('@/lib/dz/sborka'), dzApi()]);
      const kat = await zagruzitKatalogi(sostav.punkty.map((p) => p.no));
      const parts: HwPartInput[] = await sobratPunkty(sostav, kat, recipients);
      const n = sostav.nastroyki;
      const id = await api.issueHomeworkParts({
        classId: klass?.id ?? null,
        students: recipients,
        origin,
        parentId: null,
        settings: {
          title: obshchee.title,
          note: n.note,
          dueAt: obshchee.noDue ? null : new Date(obshchee.due).toISOString(),
          attemptsLimit: n.attemptsLimit,
          solutionsWhen: n.solutionsWhen,
          showMemo: n.showMemo && !n.noHints,
          showExample: n.showExample && !n.noHints,
          noHints: n.noHints,
          individual: false,
        },
        parts,
      });
      /* Выдано — черновик больше не нужен. */
      ochistit();
      await sohranitSeychas();
      setIssued({ id, n: recipients.length });
    } catch (e) {
      fail(e instanceof Error && e.name === 'SborkaError' ? e.message : dzError(errorCode(e)));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="dzk" data-page="dz-vydat">
      <Link className="dz-back" href={DZ_HREF.kabinet}>
        {DZ.solve.back}
      </Link>
      <header className="dzk-head">
        <h1 className="dzk-title">{DZK.title}</h1>
        <p className="dzk-lead">{DZK.lead}</p>
      </header>
      <div className="dzk-setka">
        <Istochniki />
        <div className="dzk-pravo">
          <Sostav
            punkty={sostav.punkty}
            katalogi={katalogi}
            schet={s}
            predel={predel}
            onOchistit={() => setOchistitVopros(true)}
          />
        </div>
      </div>
      <form
        className="dzk-forma"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void vydat();
        }}
      >
        <Komu
          classes={classes}
          classId={classId}
          onClass={(id) => {
            setClassId(id);
            setStudents(new Set((classes.find((k) => k.id === id)?.members ?? []).map((m) => m.userId)));
          }}
          students={students}
          onStudents={setStudents}
        />
        <Nastroyki sostav={sostav} obshchee={obshchee} onObshchee={setObshchee} />
        <Shablony sostav={sostav} />
        {error === null ? null : (
          <p className="dzk-oshibka" role="alert" tabIndex={-1} ref={errorRef}>
            {error}
          </p>
        )}
        <button type="submit" className="stk-btn stk-btn--primary stk-btn--lg dzk-vydat" disabled={sending} data-action="vydat">
          {sending ? DZK.vydaem : `${DZK.vydat} · ${DZK.schet(s.zadach, s.naborov, s.minut)}`}
        </button>
      </form>
      <Confirm
        open={ochistitVopros}
        title={DZK.sostav.ochistitVopros}
        text={DZK.sostav.ochistitText}
        action={DZK.sostav.ochistit}
        danger
        onCancel={() => setOchistitVopros(false)}
        onConfirm={() => {
          ochistit();
          setOchistitVopros(false);
        }}
      />
    </div>
  );
}

/* ── Работа над ошибками ──────────────────────────────────────── */

function Oshibki({ hwId }: { hwId: string }) {
  const [hw, setHw] = useState<HwFull | null | 'net'>(null);
  const [plan, setPlan] = useState<{ parts: HwPartInput[]; students: string[] } | null>(null);
  const [students, setStudents] = useState<Set<string>>(new Set());
  const [obshchee, setObshchee] = useState<Obshchee>(() => ({ title: '', due: defaultDue(), noDue: false }));
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [issued, setIssued] = useState<{ id: string; n: number } | null>(null);
  const ch = useChernovik();

  useEffect(() => {
    void (async () => {
      const api = await dzApi();
      const full = await api.loadHomework(hwId).catch(() => null);
      if (full === null) return setHw('net');
      setHw(full);
      setObshchee((o) => ({ ...o, title: DZ.issue.fromMistakes(full.hw.title) }));
      const [{ sobratOshibki }, kat] = await Promise.all([
        import('@/lib/dz/sborka/oshibki'),
        zagruzitKatalogi(full.parts.map((p) => p.taskNo)),
      ]);
      const p = await sobratOshibki(
        {
          parts: full.parts,
          tasks: full.tasks,
          answers: full.answers,
          keys: [...full.keys.values()],
          students: full.recipients.map((r) => r.userId),
        },
        kat,
      );
      setPlan(p);
      setStudents(new Set(p.students));
    })();
  }, [hwId]);

  if (issued !== null) return <Vydano id={issued.id} n={issued.n} />;
  if (hw === 'net') return <EmptyState title={DZK.oshibki.title} description={dzError('bad_parent')} />;
  if (hw === null || plan === null || ch.status !== 'gotovo') return <p className="dzk-muted">{DZK.oshibki.sobiraem}</p>;
  const sostav = ch.sostav;
  const komu = plan.students.filter((s) => students.has(s));

  async function vydat() {
    if (hw === null || hw === 'net' || plan === null) return;
    setError(null);
    if (komu.length === 0) return setError(dzError('no_recipients'));
    setSending(true);
    try {
      const parts = plan.parts
        .map((p) => ({ ...p, units: p.units.filter((u) => u.studentId === null || komu.includes(u.studentId)) }))
        .filter((p) => p.units.length > 0);
      const n = sostav.nastroyki;
      const id = await (await dzApi()).issueHomeworkParts({
        classId: hw.hw.classId,
        students: komu,
        origin: 'oshibki',
        parentId: hw.hw.id,
        settings: {
          title: obshchee.title,
          note: n.note,
          dueAt: obshchee.noDue ? null : new Date(obshchee.due).toISOString(),
          attemptsLimit: n.attemptsLimit,
          solutionsWhen: n.solutionsWhen,
          showMemo: n.showMemo && !n.noHints,
          showExample: n.showExample && !n.noHints,
          noHints: n.noHints,
          individual: true,
        },
        parts,
      });
      setIssued({ id, n: komu.length });
    } catch (e) {
      setError(dzError(errorCode(e)));
    } finally {
      setSending(false);
    }
  }

  const imena = new Map(hw.recipients.map((r) => [r.userId, r.name]));
  return (
    <div className="dzk" data-page="dz-oshibki">
      <Link className="dz-back" href={homeworkHref(hw.hw.id)}>
        ← {hw.hw.title}
      </Link>
      <header className="dzk-head">
        <h1 className="dzk-title">{DZK.oshibki.title}</h1>
        <p className="dzk-lead">{DZK.oshibki.lead}</p>
      </header>
      {plan.parts.length === 0 ? (
        <EmptyState title={DZK.oshibki.netOshibok} description="" />
      ) : (
        <form
          className="dzk-forma"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void vydat();
          }}
        >
          <section className="dzk-pole stk-glass" data-section="mistakes">
            <p className="dzk-legend">{DZK.oshibki.komu(komu.length)}</p>
            <ul className="dzk-oshibki">
              {plan.students.map((sid) => {
                const units = plan.parts.flatMap((p) => p.units.filter((u) => u.studentId === sid));
                return (
                  <li key={sid}>
                    <b>{imena.get(sid) ?? ''}</b> — {units.length}
                  </li>
                );
              })}
            </ul>
          </section>
          <fieldset className="dzk-pole" data-section="who">
            <legend className="dzk-legend">{DZ.issue.who}</legend>
            <div className="dz-checks dzk-checks" data-list="students">
              {plan.students.map((sid) => (
                <Checkbox
                  key={sid}
                  checked={students.has(sid)}
                  onChange={() => {
                    const n = new Set(students);
                    if (n.has(sid)) n.delete(sid);
                    else n.add(sid);
                    setStudents(n);
                  }}
                >
                  {imena.get(sid) ?? ''}
                </Checkbox>
              ))}
            </div>
          </fieldset>
          <Nastroyki sostav={sostav} obshchee={obshchee} onObshchee={setObshchee} />
          {error === null ? null : (
            <p className="dzk-oshibka" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="stk-btn stk-btn--primary stk-btn--lg dzk-vydat" disabled={sending}>
            {sending ? DZK.vydaem : DZK.vydat}
          </button>
        </form>
      )}
    </div>
  );
}
