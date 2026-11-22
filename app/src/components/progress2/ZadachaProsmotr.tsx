'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, EmptyState } from '@/components/ui';
import { AUTH_HREF } from '@/lib/auth/config';
import { sobrat8 } from '@/lib/vychisleniya/zhurnal8';
import type { ZadachaView } from '@/lib/zhurnal/api';
import { MESTO, iskhodSlovami, nomerZadaniya, vremya } from '@/lib/zhurnal/ekrany';
import { uchenikHref } from '@/lib/zhurnal/links';
import { otpechatokUsloviya } from '@/lib/zhurnal/model';
import { Bystro, Oshibka, Uslovie, kogda, nazvanieRazdela, queryParam, useDostup, useZagruzka, zhurnalApi } from './obshchee';
import './progress2.css';

const VID: Record<string, string> = {
  answer: '',
  format: 'неверная запись — попытка не засчитана',
  fraction: 'значение верное, но дробью — попытка не засчитана',
};

/**
 * Верный ответ для учителя: ключ из журнала; у №8 — ещё и пересборка
 * задачи по её id тем же генератором (с проверкой, что условие то же).
 */
function vernyyOtvet(z: ZadachaView): { otvet: string | null; izmenilas: boolean } {
  if (z.task_no === 8 && z.place !== 'opornye') {
    const sobrana = sobrat8(z.task_ref);
    if (sobrana !== null) {
      const taZhe = z.gen_hash === undefined || otpechatokUsloviya(sobrana.uslovie) === z.gen_hash;
      return { otvet: taZhe ? sobrana.otvet.replace('.', ',') : (z.answer_key ?? null), izmenilas: !taZhe };
    }
  }
  return { otvet: z.answer_key ?? null, izmenilas: false };
}

/** Как ученик шёл к ответу: попытки, подсказки, время. Общая часть задачи и варианта. */
export function HodResheniya({ z, uchitel }: { z: ZadachaView; uchitel: boolean }) {
  const i = iskhodSlovami(z);
  const { otvet, izmenilas } = vernyyOtvet(z);
  const popytki = z.popytki ?? [];
  return (
    <div className="pr2-hod">
      <dl className="pr2-fakty">
        <div>
          <dt>Итог</dt>
          <dd data-ton={i.ton}>
            {i.text}
            {uchitel && z.bystro === true ? <Bystro ms={z.active_ms} /> : null}
          </dd>
        </div>
        <div>
          <dt>Активное время</dt>
          <dd title={`Общее время: ${vremya(z.total_ms)}`}>
            {vremya(z.active_ms)}
            <span className="pr2-fakty__pod"> · общее {vremya(z.total_ms)}</span>
          </dd>
        </div>
        {uchitel && otvet !== null ? (
          <div>
            <dt>Верный ответ</dt>
            <dd>{otvet}</dd>
          </div>
        ) : null}
        <div>
          <dt>Подсказка</dt>
          <dd>
            {z.hint_steps === 0 ? 'не открывал' : `открыто шагов: ${z.hint_steps}`}
            {z.hint_wrong.length > 0 ? ` · ошибка на шаге ${z.hint_wrong.join(', ')}` : ''}
          </dd>
        </div>
        <div>
          <dt>Открывал</dt>
          <dd>
            {[z.shown_fact ? '«Показать свойство»' : null, z.shown_solution ? '«Показать решение»' : null, z.skipped ? '«Пропустить»' : null]
              .filter((x) => x !== null)
              .join(', ') || 'ничего'}
          </dd>
        </div>
      </dl>
      {izmenilas ? (
        <p className="pr2-note">
          Генератор задачи с тех пор обновился: условие показано таким, каким его сохранил журнал.
        </p>
      ) : null}
      {popytki.length === 0 ? (
        <p className="pr2-note">Ответов не вводил.</p>
      ) : (
        <ol className="pr2-popytki" aria-label="Попытки">
          {popytki.map((pop) => (
            <li key={pop.n} className="pr2-popytki__row" data-ok={pop.vid === 'answer' ? pop.ok : 'tiho'}>
              <span className="pr2-popytki__n">{pop.n}</span>
              <span className="pr2-popytki__otvet">{pop.answer === '' ? '(пусто)' : pop.answer}</span>
              <span className="pr2-popytki__itog">
                {pop.vid === 'answer' ? (pop.ok ? 'верно' : 'неверно') : VID[pop.vid]}
              </span>
              <span className="pr2-popytki__kogda">{kogda(pop.at)}</span>
            </li>
          ))}
        </ol>
      )}
      {z.verified ? null : (
        <p className="pr2-note">Верность ответа здесь считал браузер ученика, а не сервер.</p>
      )}
    </div>
  );
}

/** Задача так, как её видел ученик: те же числа и рисунок, ответы, подсказки, время. */
export function ZadachaProsmotr() {
  const { user, zamena } = useDostup('tutor');
  const [id] = useState(() => queryParam('id'));
  const [studentId] = useState(() => queryParam('uchenik'));
  const [classId] = useState(() => queryParam('klass'));
  const mozhno = zamena === null && user !== null && id !== null && studentId !== null;
  const { data, oshibka } = useZagruzka(mozhno ? `${studentId}|${id}` : null, async () =>
    (await zhurnalApi()).uchitelZadacha(studentId ?? '', id ?? ''),
  );

  if (zamena !== null) return zamena;
  if (id === null || studentId === null) {
    return (
      <EmptyState
        title="Задача не выбрана"
        description="Задача открывается из ленты ученика."
        action={
          <Link className="btn btn--primary" href={AUTH_HREF.kabinet}>
            В кабинет
          </Link>
        }
      />
    );
  }

  return (
    <div className="pr2" data-page="zadacha-uchenika">
      <Link className="dz-back pr2__back" href={uchenikHref(studentId, classId)}>
        ← К ученику
      </Link>
      {oshibka !== null ? <Oshibka code={oshibka} /> : null}
      {data === null ? (
        oshibka === null ? (
          <p className="pr2__status" role="status">
            Загрузка…
          </p>
        ) : null
      ) : (
        <>
          <header className="pr2__head">
            <h1 className="t-h1 pr2__title">
              {nomerZadaniya(data.task_no)} · {MESTO[data.place] ?? data.place}
            </h1>
            <p className="pr2__pod">
              {nazvanieRazdela(data.task_no)} · тип {data.kind} · {kogda(data.started_at)}
            </p>
          </header>
          <div className="pr2__grid">
            <Card className="stk-glass pr2-card pr2-card--wide" title="Условие — как у ученика" data-section="uslovie">
              <Uslovie z={data} />
            </Card>
            <Card className="stk-glass pr2-card pr2-card--wide" title="Ход решения" data-section="hod">
              <HodResheniya z={data} uchitel />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
