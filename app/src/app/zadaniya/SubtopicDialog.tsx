'use client';

import Image from 'next/image';
import { Chart } from '@/components/graph/Chart';
import { Modal } from '@/components/ui';
import { previewScene } from '@/lib/scenes';
import type { FunctionTypeId } from '@/data/functionTypes';

export interface SubtopicView {
  id: FunctionTypeId;
  /** Номер строки: 01 … 06. */
  no: string;
  title: string;
  /** Формула, свёрстанная KaTeX на сборке. */
  formulaHtml: string;
  status: 'active' | 'soon';
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

function Row({ item }: { item: SubtopicView }) {
  const body = (
    <>
      <span className="subtopic-row__no" aria-hidden="true">
        {item.no}
      </span>
      <span className="subtopic-row__text">
        <span className="subtopic-row__title">{item.title}</span>
        {/* Формула свёрстана на сборке: обычным текстом она не выводится. */}
        <span
          className="subtopic-row__formula"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: item.formulaHtml }}
        />
      </span>
      {/* Миниатюра из движка graph/: своего SVG для графиков нет. */}
      <Chart className="subtopic-row__chart" scene={previewScene(item.id)} />
      <span className="subtopic-row__go" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M5 12h13M12 6l6 6-6 6" />
        </svg>
      </span>
    </>
  );

  if (item.href === null) {
    return (
      <li>
        <span className="subtopic-row subtopic-row--soon" aria-disabled="true">
          {body}
        </span>
      </li>
    );
  }
  return (
    <li>
      {/* Обычная ссылка, а не router.push: переход по ней работает и
          средней кнопкой, и в новой вкладке. */}
      <a className="subtopic-row subtopic-row--open" href={item.href}>
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
          <Row key={item.id} item={item} />
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
