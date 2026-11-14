'use client';

import { useState } from 'react';
import { Badge, Button, Card } from '@/components/ui';
import { SKRYTYE } from '@/content/skrytye';
import { nomerRazdela } from '@/content/struktura';
import { skrytyeRazdely, taskHref } from '@/content/tasks';
import { estMetka, postavitMetku, snyatMetku } from '@/lib/skrytye';
import './skrytye.css';

/**
 * Кабинет администратора: скрытые разделы (content/struktura.js, skryt).
 * «Открыть» ставит метку администратора в этом браузере и открывает
 * раздел — с меткой сервер отдаёт его страницы (lib/skrytye.ts).
 *
 * Скрытых разделов нет — карточки нет.
 */
export function SkrytyeRazdelyAdmin() {
  const [zakryto, setZakryto] = useState(false);
  if (skrytyeRazdely.length === 0) {
    return null;
  }
  return (
    <Card className="kabinet__card" title={SKRYTYE.admin.title}>
      <p className="auth-form__text">{SKRYTYE.admin.text}</p>
      <ul className="skryt-admin">
        {skrytyeRazdely.map((task) => (
          <li className="skryt-admin__razdel" key={task.kod} data-skrytyy={task.kod}>
            <span className="skryt-admin__name">
              №{nomerRazdela(task.kod)} · {task.name}
            </span>
            <Badge tone="warning">{task.prichina}</Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                postavitMetku();
                /* Переход с загрузкой страницы: метку должен увидеть сервер. */
                window.location.assign(taskHref(task));
              }}
            >
              {SKRYTYE.admin.otkryt}
            </Button>
          </li>
        ))}
      </ul>
      <p className="skryt-admin__note">{SKRYTYE.admin.note}</p>
      {zakryto ? (
        <p className="skryt-admin__note" role="status">
          {SKRYTYE.admin.zakryto}
        </p>
      ) : (
        <Button
          className="skryt-admin__zakryt"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (estMetka()) {
              snyatMetku();
            }
            setZakryto(true);
          }}
        >
          {SKRYTYE.admin.zakryt}
        </Button>
      )}
    </Card>
  );
}
