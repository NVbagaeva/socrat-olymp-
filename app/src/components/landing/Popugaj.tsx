/**
 * Волнистый попугайчик, который сидит на слове заголовка
 * (landing.hero.perch). Чистый SVG, анимация — CSS в landing.css
 * (.popugaj*): дышит, моргает, крутит головой, покачивает хвостом,
 * изредка встряхивается и чистит пёрышки на груди; при наведении подпрыгивает и машет крылом.
 * При prefers-reduced-motion сидит смирно. Декоративный — скрыт от
 * скринридеров. Свет — сверху слева. Линия лапок — y = 100.
 */
export function Popugaj() {
  return (
    <svg className="popugaj" viewBox="0 0 100 104" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pg-telo" x1="0.25" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor="#f6dc45" />
          <stop offset="0.2" stopColor="#c9e04a" />
          <stop offset="0.5" stopColor="#5fbf45" />
          <stop offset="0.8" stopColor="#2b9a4e" />
          <stop offset="1" stopColor="#1c7a50" />
        </linearGradient>
        <radialGradient id="pg-golova" cx="0.36" cy="0.28" r="0.8">
          <stop offset="0" stopColor="#fffbb8" />
          <stop offset="0.45" stopColor="#ffe655" />
          <stop offset="1" stopColor="#f0c636" />
        </radialGradient>
        <linearGradient id="pg-krylo" x1="0.6" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#d6e056" />
          <stop offset="0.4" stopColor="#84c548" />
          <stop offset="1" stopColor="#2e8f4c" />
        </linearGradient>
        <linearGradient id="pg-hvost" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b7bea" />
          <stop offset="1" stopColor="#173a9c" />
        </linearGradient>
        <linearGradient id="pg-klyuv" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffdc86" />
          <stop offset="1" stopColor="#e38b28" />
        </linearGradient>
        <linearGradient id="pg-shcheka" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9a78f8" />
          <stop offset="1" stopColor="#3b4bd0" />
        </linearGradient>
        <radialGradient id="pg-blik">
          <stop offset="0" stopColor="#fff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className="popugaj__vsyo">
        {/* Лапки: два пальца вперёд, два назад, коготки. Стоят на месте. */}
        <g fill="none" strokeLinecap="round">
          <path
            d="M48 89l-1 8q4 .6 6.5 2.6M47 97q2 1.4 3 3M47 97q-3 .6-5 2.6M47 97q-1.4 1.4-1.8 3M58 89l.5 8q4 .6 6.5 2.6M58.5 97q2 1.4 3 3M58.5 97q-3 .6-5 2.6M58.5 97q-1.4 1.4-1.8 3"
            stroke="#cf8f96"
            strokeWidth="1.9"
          />
          <path
            d="M53.5 99.6l1.2.9M50 100l.6 1M42 99.6l-1 .9M65 99.6l1.2.9M61.5 100l.6 1M53.5 99.6l-1 .9"
            stroke="#5b3550"
            strokeWidth="1"
          />
        </g>

        <g className="popugaj__vstryaska">
          {/* Хвост: ступенчатые перья, качаются от основания. */}
          <g className="popugaj__hvost">
            <path d="M46 82C41 88 35 93 29 98c8-2 15-7 19-12z" fill="#b9d94a" />
            <path d="M45 80C38 88 30 95 21 101.5c10-3 20-9 26-16z" fill="#2a8f8a" />
            <path d="M44 78C33 87 22 96 11 103.5c13-4 26-11 35-19z" fill="#1c3f9e" />
            <path d="M42 75C30 82 14 94 3 103c14-4 30-13 42-21z" fill="url(#pg-hvost)" />
            <path
              d="M41 78C28 86 16 95 6 101.5M43 82C33 90 23 97 14 102.3"
              fill="none"
              stroke="#8fb6ff"
              strokeWidth="0.6"
              opacity="0.7"
            />
          </g>

          <g className="popugaj__dyhanie">
            {/* Тело каплей: лимон у горла, изумруд к животу. */}
            <path
              d="M43.5 33C40 45 33 60 34 74c1 11 8 18 18 18 12 0 21.5-11 22.5-27 .8-12-2.5-22-6.5-28-5-6-12-9-18-8.5-3 .3-5.5 2-6.5 4.5z"
              fill="url(#pg-telo)"
            />
            {/* Блик на груди, тень под головой, тёплый рефлекс снизу. */}
            <ellipse cx="63" cy="55" rx="8" ry="12" fill="url(#pg-blik)" opacity="0.55" />
            <path
              d="M46 36c5 9 17 11 24 5-1 6-8 10-15 9-5-1-9-7-9-14z"
              fill="#6f8a14"
              opacity="0.3"
            />
            <path
              d="M55 91.5c9-1.5 16-9 18.3-20-3 10-9.5 16.5-18.3 18.5z"
              fill="#ffc46b"
              opacity="0.45"
            />
            <path
              d="M64 63q1.6 1.8.6 3.8M67.5 71q1.4 1.8.4 3.6M61 73q1.6 1.8.6 3.8M65.5 80q1.2 1.6.2 3.2"
              fill="none"
              stroke="#eaffb0"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.45"
            />
            {/* Собственная тень под крылом. */}
            <path
              d="M48 41c10 2 15 14 12 27-2 11-11 20-21 24 6-10 9-30 9-51z"
              fill="#0e4a38"
              opacity="0.28"
            />

            {/* Крыло: чешуйчатое плечо и маховые перья со светлой каймой. */}
            <g className="popugaj__krylo">
              <path
                d="M45 39c10 2 15 14 12 27-2 11-11 20-21 24-3-10-3-28 1-40 2-5 5-9 8-11z"
                fill="url(#pg-krylo)"
              />
              <g stroke="#cfe58a" strokeWidth="0.45" strokeLinejoin="round">
                <path d="M57 58C56.5 71 47 83 36 90c3-11 7-22 11-32z" fill="#1c5f52" />
                <path d="M51.5 58c-1 11-7.5 21.5-16 28.5 1-10 4-20 8-28.5z" fill="#227050" />
                <path d="M46 57c-2 9-6.5 17.5-11.8 23.5 0-9 2-17 5.3-24.5z" fill="#2b8250" />
              </g>
              <path
                d="M36.6 55c6.4-1.5 14.4-.5 21 2.5l-.2 4.5q-3.2 3.8-6.4.2-2.6 3.8-6.2-.3-2.6 3.4-6-.6-1.4 1.6-2.6.4z"
                fill="#62b146"
              />
              <path
                d="M57.4 62q-3.2 3.8-6.4.2-2.6 3.8-6.2-.3-2.6 3.4-6-.6"
                fill="none"
                stroke="#e3f29a"
                strokeWidth="0.6"
                strokeLinecap="round"
              />
              <path
                d="M42.2 45.3q2.2 2.4 4.4 0M47.6 46.2q2.1 2.4 4.2.1M39.2 50.2q2.4 2.7 4.7 0M44.8 51q2.2 2.6 4.5.1M50.3 52.1q2.2 2.5 4.4.2M38 55.5q2.3 2.6 4.7.1M43.6 56.3q2.4 2.7 4.8 0M49.5 57.3q2.3 2.6 4.7.1"
                fill="none"
                stroke="#26391f"
                strokeWidth="1.05"
                strokeLinecap="round"
                opacity="0.8"
              />
            </g>
          </g>

          {/* Голова: поворачивается, наклоняется, изредка чистит грудку. */}
          <g className="popugaj__chistka">
            <g className="popugaj__golova">
              <g className="popugaj__hoholok" fill="#ffe655">
                <path d="M54.5 8C53.5 4.5 55.5 2.6 58.3 3c-1 1.6-1 3.2-.4 5z" />
                <path d="M58.3 7.5c0-3 2-4.2 4.2-3.5-1 1.2-1.2 2.4-.9 4z" fill="#f7d443" />
              </g>
              <path
                d="M43 26C43 14 51 6 61 6s17 7 17 17c0 9-4 17-12 20s-18-1-21.5-9c-1-3-1.5-5.5-1.5-8z"
                fill="url(#pg-golova)"
              />
              <ellipse cx="54" cy="14" rx="9" ry="6" fill="url(#pg-blik)" />
              <path
                d="M44.2 30C42.6 18 50 8 60 6.6"
                fill="none"
                stroke="#fffde0"
                strokeWidth="0.9"
                strokeLinecap="round"
                opacity="0.8"
              />
              {/* Волнистые полоски на затылке и щеке. */}
              <path
                d="M45 35.5q3.5-2.4 7-.3M44.3 30.5q3-2.6 6-.8M44.5 25.5q4-3 8-1M45.8 20.5q3-2.4 6.2-1M48.3 15.5q3.2-2.2 6.5-.8M52 11q2.4-1.5 5-.5M54 29.5q2.2-1.6 4.5-.2M55.5 34.5q2.6-1.5 5.2 0"
                fill="none"
                stroke="#3b3320"
                strokeWidth="0.95"
                strokeLinecap="round"
                opacity="0.8"
              />
              {/* Точки на горле и фиолетово-синее пятно на щеке. */}
              <g fill="#1d1a18">
                <circle cx="52.5" cy="40" r="1.25" />
                <circle cx="57" cy="42.2" r="1.4" />
                <circle cx="62" cy="43" r="1.4" />
                <circle cx="66.8" cy="41.8" r="1.3" />
              </g>
              <ellipse
                cx="68"
                cy="36.5"
                rx="4.4"
                ry="3.2"
                fill="url(#pg-shcheka)"
                transform="rotate(-25 68 36.5)"
              />
              {/* Клюв крючком, восковица с ноздрёй. */}
              <path d="M74.3 26.5c2 .8 3 2.7 2.9 5-1.8-.4-3.3-1.8-3.5-3.8z" fill="#b96a1a" />
              <path
                d="M74 21.5c5-1.8 8.6.5 8.2 4.5-.3 3-2.3 5.5-4.5 6.7.6-3-.5-6.2-3.7-7.2z"
                fill="url(#pg-klyuv)"
              />
              <path
                d="M76 22.3c2.6-.7 4.6.2 5 2.2"
                fill="none"
                stroke="#fff"
                strokeWidth="0.7"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path d="M73 17.5c3-2.4 7.8-.8 7.8 3-2.6-.5-5.2 0-7.3 1.2z" fill="#5d8df2" />
              <path
                d="M74.3 17.8c1.6-1 3.6-.9 4.9.1"
                fill="none"
                stroke="#cfe0ff"
                strokeWidth="0.7"
                strokeLinecap="round"
              />
              <circle cx="77.6" cy="19.3" r="0.7" fill="#243a8c" />
              {/* Глаз: веко, радужка, зрачок, два блика. Моргает. */}
              <g className="popugaj__glaz">
                <circle cx="67" cy="19.5" r="4" fill="#fff7cf" stroke="#d2ab35" strokeWidth="0.5" />
                <circle cx="67.2" cy="19.5" r="3" fill="#3a2414" />
                <circle cx="67.2" cy="19.5" r="1.9" fill="#070505" />
                <circle cx="68.3" cy="18.3" r="1" fill="#fff" />
                <circle cx="66" cy="21" r="0.45" fill="#fff" opacity="0.8" />
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
