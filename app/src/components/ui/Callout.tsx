import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export type CalloutTone = 'vazhno' | 'zapomni' | 'layfhak';

interface CalloutBase {
  /** Своя метка вместо «Важно» / «Запомни» / «Лайфхак». */
  label?: string;
  /** Главная мысль плашки. Ключевую фразу выделяют полужирным (`**…**` в Tex). */
  children: ReactNode;
  className?: string;
}

/**
 * «Важно» не стоит в одиночку: правило сайта — к нему всегда идёт
 * конкретный пример с объяснением. Поэтому у «Важно» пример
 * обязателен, у «Запомни» и «Лайфхака» — по желанию.
 */
export type CalloutProps = CalloutBase &
  ({ tone?: 'vazhno'; primer: ReactNode } | { tone: 'zapomni' | 'layfhak'; primer?: ReactNode });

const METKA: Record<CalloutTone, string> = {
  vazhno: 'Важно',
  zapomni: 'Запомни',
  layfhak: 'Лайфхак',
};

/** Значки меток: поле 24×24, обводка 1.6 currentColor — как в NavIcons. */
const ZNAK: Record<CalloutTone, ReactNode> = {
  /* Восклицательный знак в круге. */
  vazhno: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5M12 16.2v.3" />
    </>
  ),
  /* Закладка. */
  zapomni: <path d="M7 4.5h10a.5.5 0 0 1 .5.5v14.5L12 16l-5.5 3.5V5a.5.5 0 0 1 .5-.5z" />,
  /* Лампочка. */
  layfhak: (
    <>
      <path d="M9 17.5h6M10 20.5h4" />
      <path d="M12 3.5a6 6 0 0 0-3.5 10.9c.4.3.5.7.5 1.1v.5h6v-.5c0-.4.1-.8.5-1.1A6 6 0 0 0 12 3.5z" />
    </>
  ),
};

/**
 * Плашка-врезка в тексте теории и «О задании»: «Важно» (терракота),
 * «Запомни» (синий), «Лайфхак» (оранжевый). Устройство у всех одно —
 * кремовая заливка, рамка 1px и полоска 3px слева в цвет акцента,
 * сверху метка со значком; пример — под чертой внутри плашки.
 * Цвета — токены --color-callout-* (tokens.css), оформление —
 * styles/callout.css. Отступы до и после задаёт ритм .flow.
 */
export function Callout(props: CalloutProps) {
  const { label, children, className, primer } = props;
  const tone: CalloutTone = props.tone ?? 'vazhno';
  return (
    <aside className={clsx('callout', `callout--${tone}`, className)}>
      <p className="callout__metka">
        <svg className="callout__znak" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          {ZNAK[tone]}
        </svg>
        {label ?? METKA[tone]}
      </p>
      <div className="callout__telo">{children}</div>
      {primer === undefined ? null : (
        <div className="callout__primer">
          <p className="callout__primer-metka">Пример</p>
          {primer}
        </div>
      )}
    </aside>
  );
}

/**
 * Сноска-заметка: справка на полях (история нумерации, источник).
 * Мелкий серый текст со значком «i» — не спорит с основным текстом.
 */
export function Snoska({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={clsx('snoska', className)}>
      <svg className="snoska__znak" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 11v5.5M12 7.8v.3" />
      </svg>
      <span>{children}</span>
    </p>
  );
}
