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
