'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { mistakes, type LogOutcome } from '@/lib/progressLog/model';
import { ishodyZadach, logSbornika } from '@/lib/sbornik/progress';
import { zagruzitZadachu } from '@/lib/sbornik/zagruzka';
import type { Uroven, ZadachaKlient } from '@/lib/sbornik/types';
import { ZadachaSbornika } from './ZadachaSbornika';

export interface TipTrenazhera {
  id: string;
  nazvanie: string;
}

/** Лёгкий указатель банка: какие задачи есть, без текстов. */
export interface PunktBanka {
  id: string;
  tip: string;
  uroven: Uroven;
}

interface Punkt {
  id: string;
  /** Работа над ошибками: аналог какой задачи. */
  fixes?: string;
}

const SKOLKO = [5, 10, 20] as const;

function peremeshat<T>(list: readonly T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Тренажёр главы: выбрать типы, уровни и число задач — и решать подряд.
 * Сначала даются задачи, которых ученик ещё не закрывал. «Работа над
 * ошибками» (?rezhim=oshibki) — по аналогу на каждую задачу с ошибкой:
 * тот же тип и уровень; два верных аналога подряд снимают задачу из списка.
 */
export function TrenazherSbornika({
  glava,
  tipy,
  bank,
}: {
  glava: number;
  tipy: readonly TipTrenazhera[];
  bank: readonly PunktBanka[];
}) {
  const query = useSearchParams();
  const log = logSbornika.use();
  const ishody = useMemo(() => ishodyZadach(log), [log]);
  const tipPoId = useMemo(() => new Map(bank.map((p) => [p.id, p.tip])), [bank]);
  const oshibki = useMemo(
    () => mistakes(log, (task) => tipPoId.get(task) ?? '').filter((m) => tipPoId.has(m.task)),
    [log, tipPoId],
  );

  const tipIzAdresa = query.get('tip');
  const [vybrano, setVybrano] = useState<Set<string>>(
    () =>
      new Set(
        tipIzAdresa !== null && tipy.some((t) => t.id === tipIzAdresa)
          ? [tipIzAdresa]
          : tipy.map((t) => t.id),
      ),
  );
  /* ?rezhim=oshibki — «Работа над ошибками» стоит первой. */
  const snachalaOshibki = query.get('rezhim') === 'oshibki';
  const [urovni, setUrovni] = useState<Set<Uroven>>(() => new Set<Uroven>([1, 2, 3]));
  const [skolko, setSkolko] = useState<number>(10);
  const [bezPodskazok, setBezPodskazok] = useState(false);
  const [sessiya, setSessiya] = useState<{ id: string; punkty: Punkt[] } | null>(null);

  const dostupno = bank.filter((p) => vybrano.has(p.tip) && urovni.has(p.uroven));

  function nachat() {
    const novye = peremeshat(dostupno.filter((p) => !ishody.has(p.id)));
    const starye = peremeshat(dostupno.filter((p) => ishody.has(p.id)));
    const punkty = [...novye, ...starye].slice(0, skolko).map((p) => ({ id: p.id }));
    if (punkty.length > 0) setSessiya({ id: `sb${glava}-${Date.now().toString(36)}`, punkty });
  }

  function nachatOshibki() {
    const punkty: Punkt[] = [];
    const zanyato = new Set<string>();
    for (const m of oshibki.slice(0, 20)) {
      const orig = bank.find((p) => p.id === m.task);
      if (orig === undefined) continue;
      const kandidaty = bank.filter(
        (p) => p.tip === orig.tip && p.id !== orig.id && !zanyato.has(p.id),
      );
      const luchshie = kandidaty.filter((p) => p.uroven === orig.uroven && !ishody.has(p.id));
      const analog = peremeshat(luchshie.length > 0 ? luchshie : kandidaty)[0];
      if (analog === undefined) continue;
      zanyato.add(analog.id);
      punkty.push({ id: analog.id, fixes: orig.id });
    }
    if (punkty.length > 0) setSessiya({ id: `sb${glava}-o-${Date.now().toString(36)}`, punkty });
  }

  if (sessiya !== null) {
    return (
      <Sessiya
        key={sessiya.id}
        sessiyaId={sessiya.id}
        punkty={sessiya.punkty}
        tipy={tipy}
        bezPodskazok={bezPodskazok}
        onKonec={() => setSessiya(null)}
      />
    );
  }

  return (
    <div className={snachalaOshibki ? 'sb-trenazher sb-trenazher--oshibki' : 'sb-trenazher'}>
      <section className="sb-nastroyka stk-glass" aria-labelledby="sb-tren-zag">
        <h2 id="sb-tren-zag" className="sb-nastroyka__zag">
          Тренировка
        </h2>
        <fieldset className="sb-nastroyka__gruppa">
          <legend>Типы задач</legend>
          <div className="sb-nastroyka__kontrol">
            <button type="button" className="sb-svyaz" onClick={() => setVybrano(new Set(tipy.map((t) => t.id)))}>
              Все
            </button>
            <button type="button" className="sb-svyaz" onClick={() => setVybrano(new Set())}>
              Снять
            </button>
          </div>
          <ul className="sb-galki">
            {tipy.map((t) => (
              <li key={t.id}>
                <label className="sb-galka">
                  <input
                    type="checkbox"
                    checked={vybrano.has(t.id)}
                    onChange={(e) =>
                      setVybrano((old) => {
                        const next = new Set(old);
                        if (e.target.checked) next.add(t.id);
                        else next.delete(t.id);
                        return next;
                      })
                    }
                  />
                  <span>
                    <b>{t.id}</b> {t.nazvanie}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <fieldset className="sb-nastroyka__gruppa">
          <legend>Уровни</legend>
          <div className="sb-filtr__gruppa">
            {([1, 2, 3] as const).map((u) => (
              <button
                key={u}
                type="button"
                className="sb-chip"
                aria-pressed={urovni.has(u)}
                onClick={() =>
                  setUrovni((old) => {
                    const next = new Set(old);
                    if (next.has(u) && next.size > 1) next.delete(u);
                    else next.add(u);
                    return next;
                  })
                }
              >
                {'★'.repeat(u)}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="sb-nastroyka__gruppa">
          <legend>Сколько задач</legend>
          <div className="sb-filtr__gruppa">
            {SKOLKO.map((n) => (
              <button key={n} type="button" className="sb-chip" aria-pressed={skolko === n} onClick={() => setSkolko(n)}>
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="sb-galka">
          <input type="checkbox" checked={bezPodskazok} onChange={(e) => setBezPodskazok(e.target.checked)} />
          <span>Без подсказок — как на экзамене</span>
        </label>
        <div className="sb-zadacha__knopki">
          <Button onClick={nachat} disabled={dostupno.length === 0} data-testid="nachat-trenirovku">
            Начать
          </Button>
          <span className="sb-nastroyka__dostupno">Подходит задач: {dostupno.length}</span>
        </div>
      </section>

      <section className="sb-nastroyka stk-glass" aria-labelledby="sb-oshibki-zag">
        <h2 id="sb-oshibki-zag" className="sb-nastroyka__zag">
          Работа над ошибками
        </h2>
        {oshibki.length === 0 ? (
          <p>Ошибок пока нет. Задача попадает сюда, если ответ был неверным или решение открыто до ответа.</p>
        ) : (
          <>
            <p>
              Задач с ошибкой: <b>{oshibki.length}</b>. На каждую — похожая задача того же типа и уровня;
              два верных ответа подряд — и задача уходит из списка.
            </p>
            <ul className="sb-oshibki">
              {oshibki.slice(0, 12).map((m) => (
                <li key={m.task}>
                  {m.task.replace(/\.0*(\d+)$/, '.$1')} · {tipy.find((t) => t.id === m.kind)?.nazvanie ?? m.kind}
                </li>
              ))}
            </ul>
            <Button variant="secondary" onClick={nachatOshibki}>
              Решать аналоги
            </Button>
          </>
        )}
      </section>
    </div>
  );
}

function Sessiya({
  sessiyaId,
  punkty,
  tipy,
  bezPodskazok,
  onKonec,
}: {
  sessiyaId: string;
  punkty: readonly Punkt[];
  tipy: readonly TipTrenazhera[];
  bezPodskazok: boolean;
  onKonec: () => void;
}) {
  const [i, setI] = useState(0);
  const [z, setZ] = useState<ZadachaKlient | null>(null);
  const [itogi, setItogi] = useState<(LogOutcome | null)[]>(() => punkty.map(() => null));
  const konec = i >= punkty.length;
  const tek = punkty[i];

  useEffect(() => {
    if (tek === undefined) return;
    let alive = true;
    void zagruzitZadachu(tek.id).then((got) => alive && got !== undefined && setZ(got));
    return () => {
      alive = false;
    };
  }, [tek]);
  /* Пока грузится следующая, предыдущая не показывается. */
  const pokazat = z !== null && z.id === tek?.id ? z : null;

  if (konec) {
    const verno = itogi.filter((o) => o === 'right').length;
    const sPodskazkoy = itogi.filter((o) => o === 'hinted').length;
    const oshibok = itogi.filter((o) => o === 'wrong' || o === 'revealed').length;
    return (
      <section className="sb-itogi stk-glass">
        <h2 className="sb-nastroyka__zag">Тренировка закончена</h2>
        <p className="sb-itogi__chisla">
          <span>
            <b>{verno}</b> верно
          </span>
          <span>
            <b>{sPodskazkoy}</b> с подсказкой
          </span>
          <span>
            <b>{oshibok}</b> с ошибкой
          </span>
        </p>
        {oshibok > 0 ? <p>Задачи с ошибкой — в «Работе над ошибками»: там их ждут похожие.</p> : null}
        <Button onClick={onKonec}>К настройкам</Button>
      </section>
    );
  }

  const tipNazvanie = tipy.find((t) => t.id === pokazat?.tip)?.nazvanie;
  return (
    <div className="sb-sessiya">
      <div className="sb-sessiya__shapka">
        <span>
          Задача {i + 1} из {punkty.length}
          {tek?.fixes === undefined ? null : ' · работа над ошибками'}
        </span>
        <div className="sb-schyot__polosa" aria-hidden="true">
          <span style={{ width: `${Math.round((i / punkty.length) * 100)}%` }} />
        </div>
        <button type="button" className="sb-svyaz" onClick={() => setI(punkty.length)}>
          Закончить
        </button>
      </div>
      {pokazat === null ? (
        <p className="sb-zagruzka">Загружаем задачу…</p>
      ) : (
        <ZadachaSbornika
          key={`${i}:${pokazat.id}`}
          z={pokazat}
          nomer={pokazat.id.replace(/\.0*(\d+)$/, '.$1')}
          podpis={tipNazvanie}
          sessiya={sessiyaId}
          {...(tek?.fixes === undefined ? {} : { fixes: tek.fixes })}
          bezPodskazok={bezPodskazok}
          onZakryta={(o) => setItogi((old) => old.map((x, j) => (j === i ? o : x)))}
        />
      )}
      <div className="sb-zadacha__knopki sb-sessiya__dalshe">
        {itogi[i] === null ? (
          <button type="button" className="sb-svyaz" onClick={() => setI((n) => n + 1)}>
            Пропустить
          </button>
        ) : (
          <Button onClick={() => setI((n) => n + 1)} data-testid="dalshe">
            {i + 1 < punkty.length ? 'Дальше' : 'Итоги'}
          </Button>
        )}
      </div>
    </div>
  );
}
