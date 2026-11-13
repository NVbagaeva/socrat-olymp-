/**
 * Волнистый попугайчик, который сидит на слове заголовка (landing.hero.perch). Чистый SVG,
 * анимация — CSS в landing.css (.popugaj*): дышит, моргает, крутит
 * головой и покачивает хвостом; при наведении подпрыгивает и машет
 * крылом. При prefers-reduced-motion сидит смирно. Декоративный —
 * скрыт от скринридеров. Низ рисунка (y = 100) — линия, на которой
 * стоят лапки.
 */
export function Popugaj() {
  return (
    <svg className="popugaj" viewBox="0 0 100 104" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="popugaj-telo" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#8fdc4a" />
          <stop offset="1" stopColor="#3fae3a" />
        </linearGradient>
        <linearGradient id="popugaj-golova" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff27a" />
          <stop offset="1" stopColor="#ffd83a" />
        </linearGradient>
        <linearGradient id="popugaj-hvost" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2f7fd8" />
          <stop offset="1" stopColor="#1b4fa8" />
        </linearGradient>
      </defs>

      <g className="popugaj__vsyo">
        {/* Хвост — за телом, качается от основания. */}
        <g className="popugaj__hvost">
          <path d="M40 74 C30 84 16 94 4 101 C10 101 24 96 36 88 Z" fill="url(#popugaj-hvost)" />
          <path d="M44 77 C36 88 24 98 12 104 C20 103 32 96 42 88 Z" fill="#2563c4" />
        </g>

        {/* Тело и грудка. */}
        <g className="popugaj__dyhanie">
          <path
            d="M50 30 C70 30 76 52 72 70 C69 84 60 92 50 92 C38 92 32 82 33 68 C34 50 36 30 50 30 Z"
            fill="url(#popugaj-telo)"
          />
          <path
            d="M60 44 C70 52 70 70 64 82 C60 88 54 90 50 89 C58 80 62 62 60 44 Z"
            fill="#b5ec7c"
            opacity="0.8"
          />

          {/* Крыло с волнистым узором; при наведении машет. */}
          <g className="popugaj__krylo">
            <path
              d="M40 46 C52 46 58 60 54 76 C51 86 42 90 34 86 C30 74 32 54 40 46 Z"
              fill="#2f9a35"
            />
            <path
              d="M38 56 q4 -3 8 0 M36 63 q5 -3 10 0 M36 70 q5 -3 10 0 M37 77 q5 -3 9 0"
              fill="none"
              stroke="#16521c"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path d="M36 82 q4 -2 8 0" fill="none" stroke="#fff27a" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        </g>

        {/* Лапки на «жёрдочке». */}
        <g fill="none" stroke="#d98f86" strokeWidth="2.6" strokeLinecap="round">
          <path d="M46 89 L45 99 M45 99 l-4 1 M45 99 l4 1" />
          <path d="M56 89 L57 99 M57 99 l-4 1 M57 99 l4 1" />
        </g>

        {/* Голова: поворачивается и наклоняется. */}
        <g className="popugaj__golova">
          <circle cx="56" cy="26" r="19" fill="url(#popugaj-golova)" />
          {/* Волнистые полоски на затылке. */}
          <path
            d="M40 22 q3 -3 6 0 M39 29 q3 -3 6 0 M41 15 q3 -3 6 0 M46 9 q3 -2 6 0"
            fill="none"
            stroke="#3a3a2a"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Синее пятнышко на щеке и чёрные точки на горлышке. */}
          <ellipse cx="66" cy="38" rx="4" ry="3.2" fill="#3b6fe0" />
          <circle cx="58" cy="43" r="1.6" fill="#22221a" />
          <circle cx="64" cy="44.5" r="1.6" fill="#22221a" />
          {/* Клюв и восковица. */}
          <path d="M69 20 C74 18 78 21 77 25 C74 24 71 24 69 25 Z" fill="#5b8ff0" />
          <path d="M70 24 C78 23 82 29 78 36 C77 32 74 29 70 29 Z" fill="#f2a33a" />
          <path d="M70 29 C73 29 75 31 76 33" fill="none" stroke="#c97b1c" strokeWidth="1" />
          {/* Глаз: моргает. */}
          <g className="popugaj__glaz">
            <circle cx="64" cy="22" r="4.2" fill="#fff" />
            <circle cx="65" cy="22" r="3" fill="#1d1d1d" />
            <circle cx="66.2" cy="20.8" r="1" fill="#fff" />
          </g>
        </g>
      </g>
    </svg>
  );
}
