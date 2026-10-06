/**
 * Случайный seed: время и шум.
 *
 * Отдельным модулем, чтобы экран, которому нужен только seed, не
 * тянул вместе с ним движок задач (lib/trainerSession.ts).
 */
export function randomSeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
