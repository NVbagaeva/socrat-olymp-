/** Параметры героя, собранного из SVG-слоёв. Сохраняется в профиле как JSON. */
export interface AvatarConfig {
  skin: string;
  hair: string;
  hairColor: string;
  accessory: string;
  outfit: string;
  background: string;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: 'warm',
  hair: 'waves',
  hairColor: 'chestnut',
  accessory: 'glasses',
  outfit: 'blue',
  background: 'sky',
};

export const AVATAR_OPTIONS = {
  skin: [
    { id: 'porcelain', label: 'Фарфоровый', color: '#f7d9c5' },
    { id: 'light', label: 'Светлый', color: '#efc19f' },
    { id: 'warm', label: 'Тёплый', color: '#d99a72' },
    { id: 'olive', label: 'Оливковый', color: '#b97855' },
    { id: 'brown', label: 'Коричневый', color: '#87523e' },
    { id: 'deep', label: 'Тёмный', color: '#603a32' },
  ],
  hair: [
    { id: 'short', label: 'Короткая' },
    { id: 'curls', label: 'Кудри' },
    { id: 'waves', label: 'Волны' },
    { id: 'bob', label: 'Каре' },
    { id: 'ponytail', label: 'Хвост' },
    { id: 'braids', label: 'Косы' },
    { id: 'bun', label: 'Пучок' },
    { id: 'long', label: 'Длинная' },
  ],
  hairColor: [
    { id: 'black', label: 'Чёрный', color: '#302b38' },
    { id: 'chestnut', label: 'Каштановый', color: '#704437' },
    { id: 'brown', label: 'Шоколадный', color: '#49302c' },
    { id: 'copper', label: 'Медный', color: '#bb6546' },
    { id: 'blonde', label: 'Золотистый', color: '#e4b95f' },
    { id: 'silver', label: 'Серебристый', color: '#aaaec1' },
    { id: 'pink', label: 'Розовый', color: '#d77b9f' },
    { id: 'blue', label: 'Синий', color: '#596dc1' },
  ],
  accessory: [
    { id: 'none', label: 'Без аксессуара', icon: '·' },
    { id: 'glasses', label: 'Очки', icon: '◉' },
    { id: 'headphones', label: 'Наушники', icon: '♫' },
    { id: 'cap', label: 'Кепка', icon: '⌑' },
    { id: 'bow', label: 'Бант', icon: '🎀' },
    { id: 'flower', label: 'Цветок', icon: '✿' },
    { id: 'crown', label: 'Корона', icon: '♛' },
  ],
  outfit: [
    { id: 'blue', label: 'Синий', color: '#5373ca' },
    { id: 'coral', label: 'Коралловый', color: '#e27d69' },
    { id: 'mint', label: 'Мятный', color: '#65aa91' },
    { id: 'violet', label: 'Фиолетовый', color: '#8c6bb0' },
    { id: 'sunny', label: 'Жёлтый', color: '#e3ac4f' },
    { id: 'pink', label: 'Розовый', color: '#d97996' },
    { id: 'graphite', label: 'Графитовый', color: '#5d6476' },
  ],
  background: [
    { id: 'sky', label: 'Небо', color: '#cceaf4' },
    { id: 'lavender', label: 'Лаванда', color: '#e2d8f5' },
    { id: 'peach', label: 'Персик', color: '#f7d8c9' },
    { id: 'mint', label: 'Мята', color: '#d2eddf' },
    { id: 'lemon', label: 'Лимон', color: '#f5ebba' },
    { id: 'rose', label: 'Розовый', color: '#f4d5e1' },
    { id: 'blue', label: 'Голубой', color: '#cedcf7' },
    { id: 'cream', label: 'Кремовый', color: '#f0e7d3' },
  ],
} as const;

type AvatarPart = keyof typeof AVATAR_OPTIONS;

/** Проверка конфигурации из JSONB перед отображением или сохранением. */
export function parseAvatarConfig(value: unknown): AvatarConfig | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const parts: AvatarPart[] = ['skin', 'hair', 'hairColor', 'accessory', 'outfit', 'background'];
  for (const part of parts) {
    const selection = source[part];
    if (
      typeof selection !== 'string' ||
      !AVATAR_OPTIONS[part].some((option) => option.id === selection)
    ) {
      return null;
    }
  }
  return {
    skin: source.skin as string,
    hair: source.hair as string,
    hairColor: source.hairColor as string,
    accessory: source.accessory as string,
    outfit: source.outfit as string,
    background: source.background as string,
  };
}

/** Выбирает каждый слой независимо; доступно больше 100 тысяч сочетаний. */
export function randomAvatar(random = Math.random): AvatarConfig {
  const pick = <T extends { id: string }>(options: readonly T[]) =>
    options[Math.floor(random() * options.length)]!.id;
  return {
    skin: pick(AVATAR_OPTIONS.skin),
    hair: pick(AVATAR_OPTIONS.hair),
    hairColor: pick(AVATAR_OPTIONS.hairColor),
    accessory: pick(AVATAR_OPTIONS.accessory),
    outfit: pick(AVATAR_OPTIONS.outfit),
    background: pick(AVATAR_OPTIONS.background),
  };
}
