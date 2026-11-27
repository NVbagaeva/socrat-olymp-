'use client';

/**
 * Мастер выдачи /kabinet/dz2/vydat/ (docs/kabinet-dz2.md): корзина «В
 * домашку» → настройки → кому → «Выдать». Черновик и шаблон хранят рабочую
 * копию мастера (dz2_chernovik), поэтому их можно открыть и доделать:
 * ?id= — открыть черновик или шаблон.
 *
 * Задачи тренажёра собираются здесь, при выдаче: при «индивидуальных
 * числах» — у каждого ученика свой набор.
 */

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import type React from 'react';
import { Button, Card, Checkbox, EmptyState, FieldLabel, Input } from '@/components/ui';
import { NeedLogin } from '@/components/dz/common';
import { DZ2 } from '@/content/dz2';
import { kodOshibki, prichinaOshibki } from '@/lib/dz2/oshibka';
import { useSessionUser } from '@/lib/auth/session';
import type { TutorClass } from '@/lib/dz/api';
import { korzina, useKorzina } from '@/lib/dz2/korzina';
import { DZ2_HREF } from '@/lib/dz2/links';
import {
  NASTROYKI_PO_UMOLCHANIYU,
  kontrolnaya,
  proverit,
  razobrat,
  utcVMsk,
  zapros,
  type ElementKorziny,
  type Nastroyki,
  type ZadachiElementa,
} from '@/lib/dz2/model';
import { dataRu } from '@/lib/zhurnal/vid';
import './dz2.css';

const t = DZ2.master;
const ZAPASY = [5, 10, 15, 20, 30, 40, 60];

function param(name: string): string | null {
  return typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get(name);
}

export function Vydacha() {
  const user = useSessionUser();
  const k = useKorzina();
  const [n, setN] = useState<Nastroyki>(NASTROYKI_PO_UMOLCHANIYU);
  const [klassy, setKlassy] = useState<TutorClass[] | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pokazatOshibki, setPokazatOshibki] = useState(false);
  const ids = { title: useId(), note: useId(), pub: useId(), due: useId(), att: useId(), sol: useId() };

  useEffect(() => {
    if (user === null || user.role !== 'tutor') return;
    let alive = true;
    void (async () => {
      const dzApi = await import('@/lib/dz/api');
      const list = await dzApi.loadTutorClasses().catch(() => []);
      if (alive) setKlassy(list);
      const draft = param('id');
      if (draft === null) return;
      try {
        const api = await import('@/lib/dz2/api');
        const { dz, chernovik } = await api.dz2ProchestChernovik(draft);
        if (!alive) return;
        setId(dz.id);
        const saved = (chernovik?.nastroyki ?? {}) as Partial<Nastroyki>;
        setN({
          ...NASTROYKI_PO_UMOLCHANIYU,
          ...saved,
          title: dz.title,
          note: dz.note ?? '',
          publish_msk: dz.publish_at === null ? '' : utcVMsk(dz.publish_at),
          due_msk: dz.due_at === null ? '' : utcVMsk(dz.due_at),
        });
        if (chernovik?.korzina !== undefined) korzina.zamenit(razobrat(chernovik.korzina));
      } catch (e) {
        if (alive) setError(DZ2.master.oshibkaBazy(kodOshibki(e)));
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  if (user === null) return <NeedLogin text="Войдите в кабинет учителя." />;
  if (user.role !== 'tutor') return <EmptyState title={DZ2.tolkoUchitel} description={DZ2.tolkoUchitelLead} />;

  const oshibki = proverit(k, n);
  const ucheniki = new Map<string, string>();
  for (const c of klassy ?? []) for (const m of c.members) ucheniki.set(m.userId, m.alias ?? m.name);
  const poluchateli = (): string[] => {
    const set = new Set(n.ucheniki);
    for (const c of klassy ?? []) if (n.klassy.includes(c.id)) for (const m of c.members) set.add(m.userId);
    return [...set];
  };

  async function zadachi(): Promise<Record<string, ZadachiElementa>> {
    const out: Record<string, ZadachiElementa> = {};
    const { sobratZapas } = await import('@/lib/dz2/sborka');
    const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    for (const e of k.elementy) {
      if (e.vid === 'opornye' && e.tasks !== undefined) out[e.key] = { obshchie: e.tasks };
      if (e.vid === 'trenazher') {
        const tipy = e.tipy ?? [];
        const zapas = e.zapas ?? 10;
        if (n.individual) {
          const po: Record<string, Awaited<ReturnType<typeof sobratZapas>>> = {};
          for (const s of poluchateli()) po[s] = await sobratZapas(e.task_no, tipy, zapas, `${seed}|${s}`);
          out[e.key] = { poUchenikam: po };
        } else {
          out[e.key] = { obshchie: await sobratZapas(e.task_no, tipy, zapas, seed) };
        }
      }
    }
    return out;
  }

  async function sohranit(chto: 'draft' | 'template' | 'vydat') {
    setPokazatOshibki(true);
    setError(null);
    setNote(null);
    if (chto === 'vydat' && oshibki.length > 0) return;
    if (n.title.trim() === '') return;
    setBusy(true);
    try {
      const api = await import('@/lib/dz2/api');
      const status = chto === 'template' ? 'template' : 'draft';
      const novyy = await api.dz2Save(
        zapros(k, n, await zadachi(), status, chto === 'template' ? undefined : (id ?? undefined)),
      );
      await api.dz2SaveChernovik(novyy, { korzina: k, nastroyki: n });
      if (chto === 'vydat') {
        const r = await api.dz2Publish(novyy);
        korzina.ochistit();
        setN(NASTROYKI_PO_UMOLCHANIYU);
        setId(null);
        setNote(t.vydano(r.recipients, n.publish_msk === '' ? null : dataRu(`${n.publish_msk}:00+03:00`, true)));
      } else {
        if (chto === 'draft') setId(novyy);
        setNote(chto === 'template' ? t.shablonSohranen : t.sohraneno);
      }
    } catch (e) {
      const kod = kodOshibki(e);
      const prichina = kod === 'unknown' ? prichinaOshibki(e) : null;
      /* Неизвестную ошибку — с причиной: учитель сможет её переслать. */
      setError(prichina === null ? t.oshibkaBazy(kod) : `${t.oshibkaBazy(kod)} ${t.prichina(prichina)}`);
    } finally {
      setBusy(false);
    }
  }

  const ust = (patch: Partial<Nastroyki>) => setN({ ...n, ...patch });

  return (
    <div className="dz2 kab-stack">
      <div className="kab-title-row">
        <div>
          <Link className="dz2-nazad" href={DZ2_HREF.spisok}>
            ← {t.kSpisku}
          </Link>
          <h1 className="t-h2">{id === null ? t.zagolovok : t.chernovikZag}</h1>
        </div>
      </div>

      {note === null ? null : (
        <p className="dz2-uspeh" role="status">
          {note}
        </p>
      )}
      {error === null ? null : (
        <p className="dz2-oshibka" role="alert">
          {error}
        </p>
      )}

      <Card title={t.korzina}>
        {k.elementy.length === 0 ? (
          <p>{t.korzinaPusto}</p>
        ) : (
          <ol className="dz2-elementy">
            {k.elementy.map((e, i) => (
              <Element key={e.key} e={e} pervyy={i === 0} posledniy={i === k.elementy.length - 1} />
            ))}
          </ol>
        )}
      </Card>

      <Card title={t.nazvanie}>
        <FieldLabel htmlFor={ids.title}>{t.nazvanie}</FieldLabel>
        <Input
          id={ids.title}
          value={n.title}
          maxLength={120}
          placeholder={t.nazvaniePlaceholder}
          onChange={(e) => ust({ title: e.target.value })}
        />
        <FieldLabel htmlFor={ids.note}>{t.poyasnenie}</FieldLabel>
        <textarea
          id={ids.note}
          className="dz2-textarea"
          value={n.note}
          maxLength={2000}
          rows={3}
          onChange={(e) => ust({ note: e.target.value })}
        />
      </Card>

      <Card title={t.kogo}>
        {klassy === null ? null : klassy.length === 0 ? (
          <p>{t.netKlassov}</p>
        ) : (
          <>
            <p className="dz2-podzag">{t.klassy}</p>
            <div className="dz2-galki">
              {klassy.map((c) => (
                <Galka
                  key={c.id}
                  label={`${c.name} (${c.members.length})`}
                  checked={n.klassy.includes(c.id)}
                  onChange={(e) =>
                    ust({ klassy: e.target.checked ? [...n.klassy, c.id] : n.klassy.filter((x) => x !== c.id) })
                  }
                />
              ))}
            </div>
            {ucheniki.size === 0 ? null : (
              <details className="dz2-details">
                <summary>{t.ucheniki}</summary>
                <div className="dz2-galki">
                  {[...ucheniki.entries()].map(([sid, imya]) => (
                    <Galka
                      key={sid}
                      label={imya}
                      checked={n.ucheniki.includes(sid)}
                      onChange={(e) =>
                        ust({ ucheniki: e.target.checked ? [...n.ucheniki, sid] : n.ucheniki.filter((x) => x !== sid) })
                      }
                    />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </Card>

      <Card title={t.srok}>
        <div className="dz2-polya">
          <div>
            <FieldLabel htmlFor={ids.pub}>{t.publikaciya}</FieldLabel>
            <input
              id={ids.pub}
              className="dz2-vvod"
              type="datetime-local"
              value={n.publish_msk}
              onChange={(e) => ust({ publish_msk: e.target.value })}
            />
            <p className="t-caption">{t.publikaciyaSrazu}</p>
          </div>
          <div>
            <FieldLabel htmlFor={ids.due}>{t.srok}</FieldLabel>
            <input
              id={ids.due}
              className="dz2-vvod"
              type="datetime-local"
              value={n.due_msk}
              onChange={(e) => ust({ due_msk: e.target.value })}
            />
            <p className="t-caption">{t.srokPodskazka}</p>
          </div>
        </div>
        <fieldset className="dz2-fieldset">
          <legend>{t.posleSroka}</legend>
          {(['late_ok', 'closed'] as const).map((v) => (
            <label key={v} className="dz2-radio">
              <input type="radio" checked={n.after_due === v} onChange={() => ust({ after_due: v })} />
              {t.posleSrokaVarianty[v]}
            </label>
          ))}
        </fieldset>
      </Card>

      <Card title="Правила">
        <Galka
          label={t.kontrol}
          description={t.kontrolPodskazka}
          checked={n.kontrol}
          onChange={(e) => setN(kontrolnaya(n, e.target.checked))}
        />
        <Galka
          label={t.podskazki}
          checked={n.hints_allowed && !n.kontrol}
          disabled={n.kontrol}
          onChange={(e) => ust({ hints_allowed: e.target.checked })}
        />
        <Galka
          label={t.individual}
          description={t.individualPodskazka}
          checked={n.individual}
          onChange={(e) => ust({ individual: e.target.checked })}
        />
        <div className="dz2-polya">
          <div>
            <FieldLabel htmlFor={ids.att}>{t.popytki}</FieldLabel>
            <select
              id={ids.att}
              className="dz2-vvod"
              value={n.attempts_limit ?? ''}
              onChange={(e) => ust({ attempts_limit: e.target.value === '' ? null : (Number(e.target.value) as 1 | 2 | 3) })}
            >
              <option value="">{t.popytkiBez}</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor={ids.sol}>{t.resheniya}</FieldLabel>
            <select
              id={ids.sol}
              className="dz2-vvod"
              value={n.solutions_when}
              onChange={(e) => ust({ solutions_when: e.target.value as Nastroyki['solutions_when'] })}
            >
              {(['instant', 'after_due', 'never'] as const).map((v) => (
                <option key={v} value={v}>
                  {t.resheniyaVarianty[v]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {pokazatOshibki && oshibki.length > 0 ? (
        <ul className="dz2-oshibki" role="alert">
          {oshibki.map((o) => (
            <li key={o}>{t.oshibki[o]}</li>
          ))}
        </ul>
      ) : null}

      <div className="kab-actions dz2-deystviya">
        <Button onClick={() => void sohranit('vydat')} disabled={busy}>
          {busy ? t.vydaetsya : t.vydat}
        </Button>
        <Button variant="secondary" onClick={() => void sohranit('draft')} disabled={busy}>
          {t.sohranit}
        </Button>
        <Button variant="ghost" onClick={() => void sohranit('template')} disabled={busy}>
          {t.shablon}
        </Button>
      </div>
    </div>
  );
}

/** Галочка с подписью и пояснением под ней. */
function Galka({
  label,
  description,
  ...rest
}: Omit<React.ComponentProps<typeof Checkbox>, 'children'> & { label: string; description?: string }) {
  return (
    <Checkbox {...rest}>
      {label}
      {description === undefined ? null : <span className="dz2-galka__poyasnenie">{description}</span>}
    </Checkbox>
  );
}

function Element({ e, pervyy, posledniy }: { e: ElementKorziny; pervyy: boolean; posledniy: boolean }) {
  const celId = useId();
  const zapasId = useId();
  return (
    <li className="dz2-element">
      <div className="dz2-element__verh">
        <span className="dz2-element__vid">{DZ2.vidy[e.vid] ?? e.vid}</span>
        <span className="dz2-element__nazvanie">{e.title}</span>
        {e.tasks === undefined ? null : <span className="t-caption">{t.zadach(e.tasks.length)}</span>}
      </div>
      {e.vid === 'trenazher' ? (
        <div className="dz2-polya">
          <div>
            <FieldLabel htmlFor={zapasId}>{t.zapas}</FieldLabel>
            <select
              id={zapasId}
              className="dz2-vvod"
              value={e.zapas ?? 10}
              onChange={(ev) => korzina.izmenit(e.key, { zapas: Number(ev.target.value) })}
            >
              {ZAPASY.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor={celId}>{t.cel}</FieldLabel>
            <select
              id={celId}
              className="dz2-vvod"
              value={e.goal_kind ?? 'all'}
              onChange={(ev) => {
                const goal_kind = ev.target.value as 'all' | 'count' | 'streak';
                korzina.izmenit(e.key, {
                  goal_kind,
                  ...(goal_kind === 'all' ? { goal_n: undefined } : { goal_n: e.goal_n ?? (goal_kind === 'streak' ? 3 : 5) }),
                });
              }}
            >
              {(['all', 'count', 'streak'] as const).map((g) => (
                <option key={g} value={g}>
                  {t.celi[g]}
                </option>
              ))}
            </select>
          </div>
          {(e.goal_kind ?? 'all') === 'all' ? null : (
            <div>
              <FieldLabel htmlFor={`${celId}-n`}>{t.celN}</FieldLabel>
              <input
                id={`${celId}-n`}
                className="dz2-vvod dz2-vvod--chislo"
                type="number"
                min={1}
                max={60}
                value={e.goal_n ?? 1}
                onChange={(ev) => korzina.izmenit(e.key, { goal_n: Math.max(1, Math.min(60, Number(ev.target.value))) })}
              />
            </div>
          )}
        </div>
      ) : null}
      <div className="dz2-element__knopki">
        <button type="button" className="btn btn--ghost btn--sm" disabled={pervyy} onClick={() => korzina.sdvinut(e.key, -1)}>
          ↑ {t.vverh}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" disabled={posledniy} onClick={() => korzina.sdvinut(e.key, 1)}>
          ↓ {t.vniz}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => korzina.ubrat(e.key)}>
          {t.ubrat}
        </button>
      </div>
    </li>
  );
}
