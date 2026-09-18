'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TaskBank } from './TaskBank';
import { SubtopicDialog, type SubtopicView } from './SubtopicDialog';

export interface BankScreenProps {
  /**
   * Окно выбора подтемы: заголовок, строки и подсказка. Формулы в
   * строках свёрстаны KaTeX на сборке — в браузер уходит готовая
   * разметка, а не библиотека.
   */
  dialog: {
    slug: string;
    no: string;
    subtitle: string;
    hint: string;
    items: SubtopicView[];
  };
}

/** Отступ окна от левого края контента. */
const SHIFT = 24;

/**
 * Экран банка заданий: оболочка, список и окно выбора подтемы.
 *
 * Состояние окна живёт здесь, а не внутри списка, потому что от него
 * зависит место окна на экране: оно встаёт по открытой карточке.
 */
export function BankScreen({ dialog }: BankScreenProps) {
  /* Координаты открытой карточки. null — окно закрыто. */
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const open = anchor !== null;

  function openDialog(_task: unknown, card: HTMLElement) {
    const box = card.getBoundingClientRect();
    /* Окно встаёт по вертикали на уровне карточки, а по горизонтали —
       у левого края контента: справа в шапке баннер, и перекрывать
       его целиком окно не должно. */
    const content = card.closest('.app-main')?.getBoundingClientRect();
    setAnchor({
      top: box.top + box.height / 2,
      left: (content?.left ?? box.left) + SHIFT,
    });
  }

  return (
    /* Поиск в шапке выключен: на этой странице фильтрует свой. */
    <AppShell active="tasks" search={false}>
      {/* Шапка, поиск и сетка живут в клиентской части: фильтрация
          идёт в браузере, серверу тут делать нечего. */}
      <TaskBank dialogSlug={dialog.slug} onOpenDialog={openDialog} />

      <SubtopicDialog
        open={open}
        anchor={anchor}
        onClose={() => setAnchor(null)}
        no={dialog.no}
        subtitle={dialog.subtitle}
        items={dialog.items}
        hint={dialog.hint}
      />
    </AppShell>
  );
}
