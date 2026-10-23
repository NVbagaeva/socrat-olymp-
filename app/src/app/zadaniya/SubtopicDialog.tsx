'use client';

import Image from 'next/image';
import { Badge, Modal } from '@/components/ui';
import { RazdelIkonka } from '@/components/tasks/razdely/RazdelIkonka';
import { VesRazdelCards } from '@/components/tasks/ves12/VesRazdelCards';
import { vesRazdel } from '@/content/ves12';
import type { IkonkaRazdela } from '@/components/tasks/razdely/types';
import { counted } from '@/lib/plural';
import type { FunctionTypeId } from '@/data/functionTypes';

import { assetUrl } from '@/lib/assetUrl';
export interface SubtopicView {
  id: FunctionTypeId;
  /** Номер строки: 01 … 06. */
  no: string;
  title: string;
  /** Название графика: «График — парабола». */
  graphName: string;
  /** Иконка раздела. Нет — карточка без иконки. */
  icon?: IkonkaRazdela;
  status: 'active' | 'soon';
  /** Сколько наборов прототипов и задач в них — из манифеста. */
  prototypes: number;
  tasks: number;
  /** Адрес подтемы. Нет ни у закрытой, ни у той, чьи страницы не собраны. */
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

/**
 * Подпись под названием: «4 прототипа · 80 заданий». Число и слово
 * не разрываются; при нехватке места строка переносится целиком после
 * «·» — перед точкой пробел тоже неразрывный.
 */
export function countLine(prototypes: number, tasks: number): string {
  const nb = (text: string) => text.replace(/ /g, '\u00a0');
  return (
    nb(counted(prototypes, 'прототип', 'прототипа', 'прототипов')) +
    '\u00a0· ' +
    nb(counted(tasks, 'задание', 'задания', 'заданий'))
  );
}

/** Стрелка «перейти»: на компьютере выезжает при наведении, на телефоне видна всегда. */
export function CardArrow({ className }: { className: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M5 12h13M12 6l6 6-6 6" />
      </svg>
    </span>
  );
}

function Card({ item }: { item: SubtopicView }) {
  /* Открытая подтема — со счётом задач; собранная в предпросмотре —
     со ссылкой, но с бейджем: задач у неё ещё нет. Галочек нет: это
     переход в раздел, а не выбор, и отмеченной не выглядит ни одна. */
  const open = item.status === 'active';
  const linked = item.href !== null;
  const body = (
    <>
      <RazdelIkonka
        icon={item.icon}
        sizes="88px"
        soon={!linked}
        dim={linked && !open}
        className="subtopic-card__ico"
      />
      <span className="subtopic-card__text">
        <span className="subtopic-card__title">{item.title}</span>
        <span className="subtopic-card__graph">{item.graphName}</span>
        {/* Числа только у открытого семейства: у закрытого в данных
            нулей, и вместо них честная подпись. */}
        {open ? (
          <span className="subtopic-card__count">{countLine(item.prototypes, item.tasks)}</span>
        ) : (
          <Badge className="subtopic-card__soon">Готовится</Badge>
        )}
      </span>
      {linked ? <CardArrow className="subtopic-card__go" /> : null}
    </>
  );

  if (!linked) {
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
      <a
        className={open ? 'subtopic-card' : 'subtopic-card subtopic-card--preview'}
        href={item.href ?? undefined}
      >
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
      description="Весь раздел или отдельный тип функции"
    >
      {/* Над типами — инструменты по всему заданию: зачётная работа и
          генератор по всем типам. */}
      <VesRazdelCards place="dialog" />
      <h3 className="ves-or">{vesRazdel.orType}</h3>
      <ul className="subtopic-list">
        {items.map((item) => (
          <Card key={item.id} item={item} />
        ))}
      </ul>

      <p className="subtopic-hint">
        {/* Лампочка — декор рядом с текстом, поэтому alt пустой. */}
        <Image
          className="subtopic-hint__art"
          src={assetUrl('/images/lightbulb.webp')}
          alt=""
          width={200}
          height={181}
        />
        {hint}
      </p>
    </Modal>
  );
}
