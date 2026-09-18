'use client';

import Image from 'next/image';
import { Chart } from '@/components/graph/Chart';
import { Badge, CheckIcon, Modal } from '@/components/ui';
import { previewScene } from '@/lib/scenes';
import { counted } from '@/lib/plural';
import type { FunctionTypeId } from '@/data/functionTypes';

export interface SubtopicView {
  id: FunctionTypeId;
  /** Номер строки: 01 … 06. */
  no: string;
  title: string;
  status: 'active' | 'soon';
  /** Сколько наборов прототипов и задач в них — из манифеста. */
  prototypes: number;
  tasks: number;
  /** Адрес подтемы. У закрытой ссылки нет. */
  href: string | null;
}

export interface SubtopicDialogProps {
  open: boolean;
  onClose: () => void;
  /** Место окна: рядом с карточкой, которая его открыла. */
  anchor?: { top: number; left: number } | null;
  /** Номер задания и его название — в заголовке окна. */
  no: string;
  subtitle: string;
  items: SubtopicView[];
  /** Подсказка внизу окна: картинка и текст из конфига. */
  hint: string;
}

/** Подпись под названием: «4 прототипа · 80 заданий». */
function countLine(item: SubtopicView): string {
  return (
    counted(item.prototypes, 'прототип', 'прототипа', 'прототипов') +
    ' · ' +
    counted(item.tasks, 'задание', 'задания', 'заданий')
  );
}

function Card({ item }: { item: SubtopicView }) {
  const open = item.href !== null;
  const body = (
    <>
      {/* Миниатюра из движка graph/: своего SVG для графиков нет.
          Оси без чисел — режим 'none' рендерера. */}
      <span className="subtopic-card__chart" aria-hidden="true">
        <Chart scene={previewScene(item.id)} />
      </span>
      {open ? (
        <span className="subtopic-card__check" aria-hidden="true">
          <CheckIcon />
        </span>
      ) : null}
      <span className="subtopic-card__text">
        <span className="subtopic-card__title">{item.title}</span>
        {/* Числа только у открытого семейства: у закрытого в данных
            нулей, и вместо них честная подпись. */}
        {open ? (
          <span className="subtopic-card__count">{countLine(item)}</span>
        ) : (
          <Badge className="subtopic-card__soon">Готовится</Badge>
        )}
      </span>
    </>
  );

  if (!open) {
    return (
      <li>
        <span className="subtopic-card subtopic-card--soon" aria-disabled="true">
          {body}
        </span>
      </li>
    );
  }
  return (
    <li>
      {/* Обычная ссылка, а не router.push: переход по ней работает и
          средней кнопкой, и в новой вкладке. */}
      <a className="subtopic-card subtopic-card--open" href={item.href ?? undefined}>
        {body}
      </a>
    </li>
  );
}

/**
 * Окно выбора типа функции.
 *
 * Поведение окна — escape, ловушка фокуса, возврат фокуса, блокировка
 * прокрутки, закрытие кликом вне — целиком в компоненте Modal: своего
 * окна проект не заводит.
 */
export function SubtopicDialog({
  open,
  onClose,
  anchor,
  no,
  subtitle,
  items,
  hint,
}: SubtopicDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      anchor={anchor}
      className="subtopic-modal"
      closeLabel="Закрыть выбор типа функции"
      title={
        <>
          Задание №{no}
          <span className="subtopic-modal__sub">{subtitle}</span>
        </>
      }
      description="Выберите тип функции"
    >
      <ul className="subtopic-list">
        {items.map((item) => (
          <Card key={item.id} item={item} />
        ))}
      </ul>

      <p className="subtopic-hint">
        {/* Лампочка — декор рядом с текстом, поэтому alt пустой. */}
        <Image
          className="subtopic-hint__art"
          src="/images/lightbulb.webp"
          alt=""
          width={200}
          height={181}
        />
        {hint}
      </p>
    </Modal>
  );
}
