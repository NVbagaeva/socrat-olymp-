'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, EmptyState } from '@/components/ui';
import { AUTH_HREF } from '@/lib/auth/config';
import { homeworkHref, klassHref } from '@/lib/dz/links';
import { ZHURNAL_RAZDELY } from '@/lib/zhurnal/config';
import {
  dneyNazad,
  denMsk,
  kletka,
  klassXlsx,
  nomerZadaniya,
  period,
  posledniyDen,
  stupenUspeha,
  tochnost,
  vremya,
  zadaniyaKlassa,
  type PeriodId,
} from '@/lib/zhurnal/ekrany';
import { uchenikHref } from '@/lib/zhurnal/links';
import { Filtry, Oshibka, nazvanieRazdela, queryParam, useDostup, useZagruzka, zhurnalApi } from './obshchee';
import './progress2.css';

/**
 * Прогресс класса: тепловая карта «ученики × задания», активность за
 * неделю, кто давно не заходил и кто не начал текущее ДЗ. База отдаёт
 * только учеников этого учителя и только с дня, когда ученик стал его.
 */
export function KlassProgress() {
  const { user, zamena } = useDostup('tutor');
  const [classId] = useState(() => queryParam('id'));
  const [periodId, setPeriodId] = useState<PeriodId>('30');
  const [taskNo, setTaskNo] = useState<number | null>(null);
  const [now] = useState(() => Date.now());
  const p = period(periodId, now);
  const today = denMsk(now);
  const mozhno = zamena === null && user !== null && classId !== null;
  const { data, oshibka, obnovlyaetsya } = useZagruzka(
    mozhno ? `${classId}|${p.from}|${p.to}` : null,
    async () => (await zhurnalApi()).uchitelKlass(classId ?? '', { ...p, taskNo: null }),
  );

  if (zamena !== null) return zamena;
  if (classId === null) {
    return (
      <EmptyState
        title="Класс не выбран"
        description="Прогресс открывается со страницы класса."
        action={
          <Link className="btn btn--primary" href={AUTH_HREF.kabinet}>
            В кабинет
          </Link>
        }
      />
    );
  }

  const vse = data === null ? [] : zadaniyaKlassa(data.karta, ZHURNAL_RAZDELY);
  const zadaniya = taskNo === null ? vse : vse.filter((n) => n === taskNo);
  const davno = data === null ? [] : data.ucheniki.filter((u) => posledniyDen(u.last_day, u.s, today).davno);
  const bezDz = data === null ? [] : data.ucheniki.filter((u) => (u.ne_nachal_dz ?? []).length > 0);

  async function skachat() {
    if (data === null) return;
    const { xlsx, downloadXlsx } = await import('@/lib/xlsx');
    const t = klassXlsx(data, zadaniya, p.from, p.to, today);
    downloadXlsx(`Прогресс — ${data.class.name} — ${p.to}.xlsx`, xlsx('Класс', t.rows, t.widths));
  }

  return (
    <div className="pr2" data-page="klass-progress">
      <Link className="dz-back pr2__back" href={klassHref(classId)}>
        ← К классу
      </Link>
      <header className="pr2__head">
        <h1 className="t-h1 pr2__title">{data === null ? 'Прогресс класса' : data.class.name}</h1>
        <p className="pr2__pod">Прогресс класса: что решали, с какой точностью и сколько времени.</p>
      </header>

      <Filtry periodId={periodId} onPeriod={setPeriodId} taskNo={taskNo} onTaskNo={setTaskNo} zadaniya={vse}>
        <Button variant="secondary" size="sm" onClick={() => void skachat()} disabled={data === null}>
          Скачать Excel
        </Button>
        <Button variant="ghost" size="sm" onClick={() => window.print()} disabled={data === null}>
          Печать / PDF
        </Button>
      </Filtry>

      {oshibka !== null ? <Oshibka code={oshibka} /> : null}
      {data === null ? (
        oshibka === null ? (
          <p className="pr2__status" role="status">
            Загрузка…
          </p>
        ) : null
      ) : data.ucheniki.length === 0 ? (
        <EmptyState
          title="В классе пока нет учеников"
          description="Ученики вступают по коду класса. Их задачи появятся здесь с дня вступления."
          action={
            <Link className="btn btn--primary" href={klassHref(classId)}>
              Код и ссылка класса
            </Link>
          }
        />
      ) : (
        <div className="pr2__grid" aria-busy={obnovlyaetsya}>
          <Card className="stk-glass pr2-card pr2-card--wide" title="Ученики и задания" data-section="karta">
            <div className="pr2-tabl" tabIndex={0} role="region" aria-label="Тепловая карта: ученики и задания">
              <table className="pr2-karta">
                <thead>
                  <tr>
                    <th scope="col" className="pr2-karta__imya">
                      Ученик
                    </th>
                    {zadaniya.map((n) => (
                      <th key={n} scope="col" title={nazvanieRazdela(n)}>
                        {nomerZadaniya(n)}
                      </th>
                    ))}
                    <th scope="col" className="pr2-karta__ned">
                      За 7 дней
                    </th>
                    <th scope="col" className="pr2-karta__ned">
                      Заходил
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.ucheniki.map((u) => {
                    const posl = posledniyDen(u.last_day, u.s, today);
                    return (
                      <tr key={u.id}>
                        <th scope="row" className="pr2-karta__imya">
                          <Link href={uchenikHref(u.id, classId)}>{u.name}</Link>
                        </th>
                        {zadaniya.map((n) => {
                          const k = kletka(data.karta, u.id, n);
                          const pr = tochnost(k.right, k.solved);
                          return (
                            <td
                              key={n}
                              className="pr2-karta__kletka"
                              data-l={stupenUspeha(k.right, k.solved)}
                              title={
                                pr === null
                                  ? `${nomerZadaniya(n)}: не решал`
                                  : `${nomerZadaniya(n)}: верно ${k.right} из ${k.solved}, ${vremya(k.active_ms)}`
                              }
                            >
                              {pr === null ? (
                                <span aria-label="не решал">·</span>
                              ) : (
                                <>
                                  <b>{pr}%</b>
                                  <span className="pr2-karta__schet">
                                    {k.right}/{k.solved}
                                  </span>
                                </>
                              )}
                            </td>
                          );
                        })}
                        <td className="pr2-karta__ned">
                          {u.nedelya.solved === 0 ? (
                            '—'
                          ) : (
                            <>
                              {u.nedelya.solved} зад. · {vremya(u.nedelya.active_ms)}
                            </>
                          )}
                        </td>
                        <td className="pr2-karta__ned" data-davno={posl.davno}>
                          {posl.dney === null ? 'нет записей' : dneyNazad(posl.dney)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="pr2-legenda" aria-hidden="true">
              точность: <i data-l="1" /> до 40% <i data-l="2" /> <i data-l="3" /> <i data-l="4" />{' '}
              <i data-l="5" /> от 90%
            </p>
            {data.skryto > 0 ? (
              <p className="pr2-note">
                Учеников без доступа к журналу: {data.skryto}. Журнал виден, пока ученик связан с
                учителем.
              </p>
            ) : null}
          </Card>

          <Card
            className="stk-glass stk-glass--warm pr2-card"
            title="Давно не заходили"
            action={<span className="pr2-card__schet">{davno.length}</span>}
            data-section="davno"
          >
            {davno.length === 0 ? (
              <p className="pr2-note">Все ученики занимались за последние 7 дней.</p>
            ) : (
              <ul className="pr2-spisok">
                {davno.map((u) => {
                  const posl = posledniyDen(u.last_day, u.s, today);
                  return (
                    <li key={u.id}>
                      <Link href={uchenikHref(u.id, classId)}>{u.name}</Link>
                      <span>{posl.dney === null ? 'записей нет' : dneyNazad(posl.dney)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card
            className="stk-glass pr2-card"
            title="Не начали текущее ДЗ"
            action={<span className="pr2-card__schet">{bezDz.length}</span>}
            data-section="dz"
          >
            {bezDz.length === 0 ? (
              <p className="pr2-note">Все начали выданные задания — или текущих заданий нет.</p>
            ) : (
              <ul className="pr2-spisok">
                {bezDz.map((u) => (
                  <li key={u.id}>
                    <Link href={uchenikHref(u.id, classId)}>{u.name}</Link>
                    <span>
                      {(u.ne_nachal_dz ?? []).map((d, i) => (
                        <span key={d.id}>
                          {i > 0 ? ', ' : ''}
                          <Link href={homeworkHref(d.id)}>{d.title}</Link>
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
