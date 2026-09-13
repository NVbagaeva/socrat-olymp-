import Image from 'next/image';

export interface TaskImageProps {
  /** Номер задания двумя цифрами — он же номер файла картинки. */
  no: string;
}

/**
 * Миниатюра задания: растровая картинка поверх круглой подложки.
 *
 * Путь собирается из номера задания, поэтому новое задание не требует
 * ни строчки кода — достаточно положить файл с нужным номером.
 *
 * Подложка та же, что была под рисованными миниатюрами: круг радиуса 34
 * в поле 96, заливка currentColor с прозрачностью 0.06.
 *
 * alt пустой намеренно: картинка декоративная, название задания стоит
 * рядом текстом, и повторять его для скринридера незачем.
 */
export function TaskImage({ no }: TaskImageProps) {
  return (
    <span className="ill-frame">
      <svg className="ill" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
        <circle className="ill-disc" cx="48" cy="48" r="34" />
      </svg>
      <Image className="ill-photo" src={`/images/task-${no}.webp`} alt="" width={72} height={72} />
    </span>
  );
}
