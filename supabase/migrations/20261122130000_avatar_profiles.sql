-- Собранный SVG-аватар ученика или учителя. Храним только выбор слоёв,
-- чтобы профиль оставался компактным и герой строился в браузере.
alter table public.profiles
  add column avatar_config jsonb
  check (
    avatar_config is null or (
      jsonb_typeof(avatar_config) = 'object'
      and avatar_config ?& array['skin', 'hair', 'hairColor', 'accessory', 'outfit', 'background']
      and avatar_config - array['skin', 'hair', 'hairColor', 'accessory', 'outfit', 'background'] = '{}'::jsonb
      and avatar_config ->> 'skin' = any (array['porcelain', 'light', 'warm', 'olive', 'brown', 'deep'])
      and avatar_config ->> 'hair' = any (array['short', 'curls', 'waves', 'bob', 'ponytail', 'braids', 'bun', 'long'])
      and avatar_config ->> 'hairColor' = any (array['black', 'chestnut', 'brown', 'copper', 'blonde', 'silver', 'pink', 'blue'])
      and avatar_config ->> 'accessory' = any (array['none', 'glasses', 'headphones', 'cap', 'bow', 'flower', 'crown'])
      and avatar_config ->> 'outfit' = any (array['blue', 'coral', 'mint', 'violet', 'sunny', 'pink', 'graphite'])
      and avatar_config ->> 'background' = any (array['sky', 'lavender', 'peach', 'mint', 'lemon', 'rose', 'blue', 'cream'])
    )
  );

comment on column public.profiles.avatar_config is
  'JSONB-конфигурация SVG-аватара; редактирует только владелец профиля.';

grant update (avatar_config) on public.profiles to authenticated;
