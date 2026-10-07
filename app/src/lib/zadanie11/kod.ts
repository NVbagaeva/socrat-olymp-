/**
 * Код подтипа для сайта: DP-07 → ДП-07. Отдельный лёгкий модуль —
 * его берут экраны в браузере, которым не нужно дерево с банком.
 */

const KIRILLITSA: Record<string, string> = {
  RZ: 'РЗ',
  PR: 'ПР',
  SM: 'СМ',
  DP: 'ДП',
  PT: 'ПТ',
  VD: 'ВД',
  OK: 'ОК',
  RB: 'РБ',
  PG: 'ПГ',
};

export function kodNaSayte(id: string): string {
  const [sec = '', no = ''] = id.split('-');
  return `${KIRILLITSA[sec] ?? sec}-${no}`;
}
