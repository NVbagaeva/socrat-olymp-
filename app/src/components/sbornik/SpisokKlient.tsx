'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { zagruzitZadachu } from '@/lib/sbornik/zagruzka';
import type { ZadachaHtml } from '@/lib/sbornik/types';
import { useIshody } from './Progress';
import { ZadachaSbornika } from './ZadachaSbornika';

/**
 * «Решать» под условием в списке задач типа: открывает поле ответа,
 * подсказки и решение. Сама задача с решением грузится по нажатию —
 * страница списка решений не несёт.
 */
export function OtkrytZadachu({ id, nomer }: { id: string; nomer: string }) {
  const [z, setZ] = useState<ZadachaHtml | null>(null);
  const [otkryta, setOtkryta] = useState(false);
  const [oshibka, setOshibka] = useState(false);

  useEffect(() => {
    if (!otkryta || z !== null) return;
    let alive = true;
    zagruzitZadachu(id).then(
      (got) => {
        if (alive && got !== undefined) setZ(got);
        if (alive && got === undefined) setOshibka(true);
      },
      () => alive && setOshibka(true),
    );
    return () => {
      alive = false;
    };
  }, [otkryta, id, z]);

  if (!otkryta) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOtkryta(true)} data-testid={`reshat-${id}`}>
        Решать
      </Button>
    );
  }
  if (oshibka) return <p className="sb-format">Не удалось загрузить задачу. Обновите страницу.</p>;
  if (z === null) return <p className="sb-zagruzka">Загружаем…</p>;
  return <ZadachaSbornika z={z} nomer={nomer} bezUsloviya />;
}

type FiltrUrovnya = 0 | 1 | 2 | 3;
type FiltrIshoda = 'vse' | 'novye' | 'oshibki';

/**
 * Фильтры над списком задач типа: уровень и «нерешённые / с ошибкой».
 * Список отрисован на сервере; фильтр ставит атрибуты контейнеру и
 * задачам, скрывает — CSS (sbornik.css).
 */
export function FiltrSpiska({ spisokId, poUrovnyam }: { spisokId: string; poUrovnyam: readonly number[] }) {
  const [uroven, setUroven] = useState<FiltrUrovnya>(0);
  const [ishod, setIshod] = useState<FiltrIshoda>('vse');
  const ishody = useIshody();

  useEffect(() => {
    const spisok = document.getElementById(spisokId);
    if (spisok === null) return;
    spisok.dataset.uroven = String(uroven);
    spisok.dataset.ishod = ishod;
    spisok.querySelectorAll<HTMLElement>('[data-zadacha]').forEach((li) => {
      const st = ishody.get(li.dataset.zadacha!);
      li.dataset.status = st ?? 'novaya';
    });
  }, [spisokId, uroven, ishod, ishody]);

  const urovni: { id: FiltrUrovnya; label: string }[] = [
    { id: 0, label: 'Все' },
    { id: 1, label: '★' },
    { id: 2, label: '★★' },
    { id: 3, label: '★★★' },
  ];
  return (
    <div className="sb-filtr" role="group" aria-label="Фильтр задач">
      <div className="sb-filtr__gruppa">
        {urovni.map((u) =>
          u.id !== 0 && poUrovnyam[u.id - 1] === 0 ? null : (
            <button
              key={u.id}
              type="button"
              className="sb-chip"
              aria-pressed={uroven === u.id}
              onClick={() => setUroven(u.id)}
            >
              {u.label}
              {u.id === 0 ? null : <span className="sb-chip__n">{poUrovnyam[u.id - 1]}</span>}
            </button>
          ),
        )}
      </div>
      <div className="sb-filtr__gruppa">
        {(
          [
            ['vse', 'Все задачи'],
            ['novye', 'Нерешённые'],
            ['oshibki', 'С ошибкой'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className="sb-chip" aria-pressed={ishod === id} onClick={() => setIshod(id)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Метка исхода у номера задачи. */
export function MetkaIshoda({ id }: { id: string }) {
  const ishody = useIshody();
  const st = ishody.get(id);
  if (st === undefined) return null;
  return (
    <span className={`sb-metka sb-metka--${st}`}>
      {st === 'verno' ? 'Верно' : st === 'podskazka' ? 'С подсказкой' : 'Ошибка'}
    </span>
  );
}
