'use client';

import { useState } from 'react';
import { Button, EmptyState } from '@/components/ui';
import { MESTO, iskhodSlovami, nomerZadaniya, tochnost, vremya, ISTOCHNIK_VARIANTA } from '@/lib/zhurnal/ekrany';
import { Oshibka, denSlovami, kogda, nazvanieRazdela, queryParam, useDostup, useZagruzka, zhurnalApi } from './obshchee';
import './progress2.css';

const DEN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Лист ученика для печати и сохранения в PDF (решение В-11): сводка,
 * задания, варианты и лента за период. Кнопка открывает печать браузера.
 */
export function UchenikPechat() {
  const { user, zamena } = useDostup('tutor');
  const [studentId] = useState(() => queryParam('id'));
  const [from] = useState(() => queryParam('s'));
  const [to] = useState(() => queryParam('po'));
  const ok = studentId !== null && from !== null && to !== null && DEN.test(from) && DEN.test(to);
  const { data, oshibka } = useZagruzka(
    zamena === null && user !== null && ok ? `${studentId}|${from}|${to}` : null,
    async () => {
      const api = await zhurnalApi();
      const p = { from: from ?? '', to: to ?? '', taskNo: null };
      const [uchenik, lenta] = await Promise.all([
        api.uchitelUchenik(studentId ?? '', p),
        api.uchitelLenta(studentId ?? '', p),
      ]);
      return { uchenik, lenta };
    },
  );

  if (zamena !== null) return zamena;
  if (!ok) {
    return <EmptyState title="Лист не собран" description="Лист открывается кнопкой «Печать / PDF» со страницы ученика." />;
  }
  if (oshibka !== null) return <Oshibka code={oshibka} />;
  if (data === null) {
    return (
      <p className="pr2__status" role="status">
        Загрузка…
      </p>
    );
  }
  const s = data.uchenik.svodka;

  return (
    <div className="pr2 pr2-list" data-page="uchenik-pechat">
      <div className="pr2-list__knopki">
        <Button variant="primary" onClick={() => window.print()}>
          Сохранить PDF или напечатать
        </Button>
      </div>
      <h1 className="pr2-list__title">{data.uchenik.name}</h1>
      <p className="pr2-list__pod">
        Прогресс за период {denSlovami(from ?? '')} — {denSlovami(to ?? '')} · «Будет на ЕГЭ»
      </p>
      <table className="pr2-list__tabl">
        <tbody>
          <tr>
            <th scope="row">Активное время</th>
            <td>{vremya(s.active_ms)}</td>
            <th scope="row">Решено задач</th>
            <td>{s.solved}</td>
            <th scope="row">Точность</th>
            <td>{tochnost(s.right, s.solved) === null ? '—' : `${tochnost(s.right, s.solved)}%`}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="pr2-list__h">По заданиям</h2>
      <table className="pr2-list__tabl">
        <thead>
          <tr>
            <th scope="col">Задание</th>
            <th scope="col">Решено</th>
            <th scope="col">Верно</th>
            <th scope="col">Точность</th>
            <th scope="col">Активное время</th>
          </tr>
        </thead>
        <tbody>
          {s.po_zadaniyam.map((z) => (
            <tr key={z.task_no}>
              <td>
                {nomerZadaniya(z.task_no)} {nazvanieRazdela(z.task_no)}
              </td>
              <td>{z.solved}</td>
              <td>{z.right}</td>
              <td>{tochnost(z.right, z.solved)}%</td>
              <td>{vremya(z.active_ms)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {s.varianty.length === 0 ? null : (
        <>
          <h2 className="pr2-list__h">Варианты</h2>
          <table className="pr2-list__tabl">
            <thead>
              <tr>
                <th scope="col">Вариант</th>
                <th scope="col">Дата</th>
                <th scope="col">Первичный балл</th>
                <th scope="col">Тестовый балл</th>
                <th scope="col">Активное время</th>
              </tr>
            </thead>
            <tbody>
              {s.varianty.map((v) => (
                <tr key={v.id}>
                  <td>{v.title ?? ISTOCHNIK_VARIANTA[v.source]}</td>
                  <td>{v.finished_at === undefined ? '—' : kogda(v.finished_at)}</td>
                  <td>
                    {v.primary_score ?? '—'} из {v.max_score ?? '—'}
                  </td>
                  <td>{v.test_score ?? '—'}</td>
                  <td>{vremya(v.active_ms)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2 className="pr2-list__h">Что решал{data.lenta.length === 50 ? ' (последние 50 задач)' : ''}</h2>
      <table className="pr2-list__tabl">
        <thead>
          <tr>
            <th scope="col">Когда</th>
            <th scope="col">Задание</th>
            <th scope="col">Где</th>
            <th scope="col">Итог</th>
            <th scope="col">Ответ</th>
            <th scope="col">Активное время</th>
          </tr>
        </thead>
        <tbody>
          {data.lenta.map((z) => (
            <tr key={z.id}>
              <td>{kogda(z.started_at)}</td>
              <td>
                {nomerZadaniya(z.task_no)} · {z.kind}
              </td>
              <td>{MESTO[z.place] ?? z.place}</td>
              <td>{iskhodSlovami(z).text}</td>
              <td>{z.last_answer ?? '—'}</td>
              <td>{vremya(z.active_ms)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
