/** Значок счётчика задач в карточке навыка. Цвет берётся от текста. */
export function TaskCountIcon() {
  return (
    <svg
      className="prep-card__ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 4H16" />
      <rect x="8" y="2.6" width="8" height="3.2" rx="1.1" />
      <path d="M8.6 10.5h6.8M8.6 14h6.8M8.6 17h3.6" />
    </svg>
  );
}

/** Галочка счётчика верных ответов. */
export function RightIcon() {
  return (
    <svg
      className="ptask__score-ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5 10 17.5 19 7" />
    </svg>
  );
}

/** Крестик счётчика неверных ответов. */
export function WrongIcon() {
  return (
    <svg
      className="ptask__score-ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
    </svg>
  );
}

/** Лампочка у плашки подсказки. */
export function HintIcon() {
  return (
    <svg
      className="ptask__hint-ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.5 18h5M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5.9 1.1 1 1.8l.1.9h5l.1-.9c.1-.7.4-1.3 1-1.8A6 6 0 0 0 12 3Z" />
    </svg>
  );
}
