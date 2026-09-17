import { buildTrainerTasks } from '@/lib/trainer';
import type { TrainerMode } from '@/content/trainerModes';
import { TrainerScreen } from './TrainerScreen';

export interface TrainerTasksProps {
  mode: TrainerMode;
  /** Вкладка тренажёра: туда ведёт кнопка с итогового экрана. */
  base: string;
}

/**
 * Задания режима: собираются на сборке и отдаются экрану пропсами.
 *
 * Движок и KaTeX остаются на сервере — в браузер уходит готовая
 * разметка, как и во вкладке подготовительных задач.
 */
export function TrainerTasks({ mode, base }: TrainerTasksProps) {
  return <TrainerScreen pool={buildTrainerTasks(mode)} roundKey={mode.id} backHref={base} />;
}
