'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Modal,
  Notification,
  Skeleton,
  SuccessState,
  Toast,
} from '@/components/ui';
import { SectionHeader } from '../SectionHeader';

export function FeedbackSection() {
  const [open, setOpen] = useState(false);

  const footer = (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
        Отмена
      </Button>
      <Button variant="danger" size="sm" onClick={() => setOpen(false)}>
        Удалить
      </Button>
    </>
  );

  return (
    <section id="feedback">
      <SectionHeader
        title="Состояния и обратная связь"
        index="10"
        description="Пустой экран — приглашение к действию, а не констатация пустоты. Ошибка объясняет, что делать, и не извиняется."
      />

      <div className="g3 block grid">
        <Card>
          <EmptyState
            title="Плана пока нет"
            description="Пройди диагностику — 12 заданий, 25 минут. После неё появится траектория."
            action={<Button size="sm">Пройти диагностику</Button>}
          />
        </Card>
        <Card>
          <ErrorState
            title="Задание не загрузилось"
            description="Проверь соединение. Ответы, которые ты уже отправил, сохранены."
            action={
              <Button variant="secondary" size="sm">
                Повторить
              </Button>
            }
          />
        </Card>
        <Card>
          <SuccessState
            title="Контрольная точка пройдена"
            description="82 балла. Это совпало с планом. Следующий срез — 11 октября."
            action={<Button size="sm">К траектории</Button>}
          />
        </Card>
      </div>

      <div className="g3 block grid">
        <div>
          <h3>Toast</h3>
          <Toast>Домашняя работа назначена 9 ученикам</Toast>
        </div>

        <div>
          <h3>Notification</h3>
          <div className="stack stack--sm">
            <Notification
              unread
              title="Комментарий к заданию №17"
              meta="Наталья В. · 12 минут назад"
            />
            <Notification title="Домашняя работа №4 проверена" meta="вчера, 19:40" />
          </div>
        </div>

        <div>
          <h3>Skeleton</h3>
          <Card compact aria-busy="true" aria-label="Загрузка карточки">
            <Skeleton height={14} width="45%" className="mb-3" />
            <Skeleton height={10} width="100%" className="mb-2" />
            <Skeleton height={10} width="82%" className="mb-5" />
            <Skeleton height={56} width="100%" />
          </Card>
          <p className="spec">Показывается только если ожидание превысило 200 мс.</p>
        </div>
      </div>

      <div className="block">
        <h3>Modal · только для необратимых действий</h3>
        <Modal
          preview
          open
          onClose={() => undefined}
          title="Удалить домашнюю работу?"
          description="Работу уже начали 4 ученика. Их результаты будут удалены вместе с ней."
          footer={footer}
        />
        <div className="row mt-5">
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            Открыть по-настоящему
          </Button>
          <span className="spec">Проверка перехвата фокуса, Esc и возврата фокуса на кнопку.</span>
        </div>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Удалить домашнюю работу?"
          description="Работу уже начали 4 ученика. Их результаты будут удалены вместе с ней."
          footer={footer}
        />
      </div>
    </section>
  );
}
