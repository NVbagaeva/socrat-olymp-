import { wholePool } from '@/lib/zadanie3/pool';

export const dynamic = 'force-static';

/**
 * Банк тренажёра №3 одним файлом сборки: страница тренажёра его не
 * несёт, карточка задачи грузит его по «Начать тренировку»
 * (components/tasks/solid3/Trenazher3.tsx). Ответы и разборы закрыты
 * отпечатком (lib/zadanie3/secret.ts).
 */
export function GET(): Response {
  return Response.json(wholePool());
}
