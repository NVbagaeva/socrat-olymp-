'use client';

/**
 * Единое состояние раздела: что выбрано, что решено, что записано.
 *
 * Хранится через lib/storage.ts, поэтому подмена хранилища на сервер
 * не заденет ни один компонент. Отдельной библиотеки состояния в
 * проекте нет и не заводится: раздел один, глубина небольшая.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import type { FunctionTypeId } from '@/data/functionTypes';
import type { TaskTypeId } from '@/data/taskTypes';
import { taskTypes } from '@/data/taskTypes';
import { demoProgress, demoStudied, demoTrainerStats } from '@/data/demo';
import { persistent } from '@/lib/storage';
import {
  computeByTaskType,
  computeStatistics,
  type Attempt,
  type Statistics,
  type TaskTypeRow,
} from '@/lib/statistics';
import {
  defaultGeneratorSettings,
  type ExerciseTask,
  type GeneratorSettings,
} from '@/lib/tasks';

/** Блок занятия в тетради. */
export interface NotebookBlock {
  id: string;
  kind: 'theory' | 'task' | 'note' | 'homework';
  text: string;
}

export interface NotebookLesson {
  id: string;
  title: string;
  blocks: NotebookBlock[];
}

export interface NotebookState {
  lessons: NotebookLesson[];
}

/** То, что переживает перезагрузку страницы. */
interface Persisted {
  selectedFunctionType: FunctionTypeId;
  selectedTaskType: TaskTypeId | null;
  answers: Record<string, string>;
  results: Record<string, boolean>;
  attempts: Attempt[];
  progress: Record<string, number>;
  /** Сколько разделов теории изучено. Общее число не хранится:
      оно равно длине списка разделов и считается на месте показа. */
  studied: number;
  generatorSettings: GeneratorSettings;
  notebook: NotebookState;
}

const INITIAL: Persisted = {
  selectedFunctionType: 'linear',
  selectedTaskType: null,
  answers: {},
  results: {},
  attempts: [],
  /* DEMO-значения приходят из demo.ts и живут дальше как обычные
     данные: проценты меняются по мере решения. */
  progress: { ...demoProgress },
  studied: demoStudied,
  generatorSettings: defaultGeneratorSettings,
  notebook: { lessons: [] },
};

/* Хранилище — внешний источник: React читает из него снимок, а не
   догоняет его эффектом после отрисовки. */
const store = persistent<Persisted>('state', INITIAL);

export interface AppState extends Persisted {
  /** Подборка, с которой сейчас работает тренажёр. Не сохраняется. */
  tasks: ExerciseTask[];
  currentTaskIndex: number;
  statistics: Statistics;
  byTaskType: TaskTypeRow[];
  /** Идентификаторы заданий, где был неверный ответ. */
  mistakes: string[];

  selectFunctionType(id: FunctionTypeId): void;
  selectTaskType(id: TaskTypeId | null): void;
  setTasks(tasks: ExerciseTask[]): void;
  goToTask(index: number): void;
  /** Записать ответ и итог проверки. Сам ответ на экран не выводится. */
  recordAnswer(task: ExerciseTask, value: string, correct: boolean, seconds: number): void;
  setGeneratorSettings(settings: GeneratorSettings): void;
  setNotebook(notebook: NotebookState): void;
  /** Сбросить счётчики и ответы. Выбор типа функции остаётся. */
  resetTrainer(): void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  /* Сборка получает начальный снимок, браузер — сохранённый. Подмену
     React делает сам при подключении разметки. */
  const stored = useSyncExternalStore(store.subscribe, store.read, store.initial);

  /* Запись могла остаться от прежней раскладки состояния, где вместо
     числа лежала пара «изучено и всего». Тогда берётся начальное
     значение: иначе на экране оказалось бы «из undefined». */
  const saved = useMemo(
    () =>
      typeof stored.studied === 'number' ? stored : { ...stored, studied: INITIAL.studied },
    [stored],
  );
  const [tasks, setTasksState] = useState<ExerciseTask[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  /* Правка считается от того, что лежит в хранилище сейчас, а не от
     снимка этой отрисовки: два изменения подряд не затрут друг друга. */
  const update = useCallback((make: (previous: Persisted) => Partial<Persisted>) => {
    const previous = store.read();
    store.write({ ...previous, ...make(previous) });
  }, []);

  const statistics = useMemo(
    () => computeStatistics(saved.attempts, demoTrainerStats),
    [saved.attempts],
  );

  const byTaskType = useMemo(
    () => computeByTaskType(saved.attempts, taskTypes.map((type) => type.id)),
    [saved.attempts],
  );

  const mistakes = useMemo(
    () => Object.keys(saved.results).filter((id) => saved.results[id] === false),
    [saved.results],
  );

  const value = useMemo<AppState>(
    () => ({
      ...saved,
      tasks,
      currentTaskIndex,
      statistics,
      byTaskType,
      mistakes,

      selectFunctionType: (id) => update(() => ({ selectedFunctionType: id })),
      selectTaskType: (id) => update(() => ({ selectedTaskType: id })),
      setTasks: (next) => {
        setTasksState(next);
        setCurrentTaskIndex(0);
      },
      goToTask: (index) => setCurrentTaskIndex(index),
      recordAnswer: (task, answer, correct, seconds) =>
        update((previous) => ({
          answers: { ...previous.answers, [task.id]: answer },
          results: { ...previous.results, [task.id]: correct },
          attempts: [
            ...previous.attempts,
            { taskId: task.id, taskType: task.taskType, correct, seconds },
          ],
        })),
      setGeneratorSettings: (settings) => update(() => ({ generatorSettings: settings })),
      setNotebook: (notebook) => update(() => ({ notebook })),
      resetTrainer: () => {
        update(() => ({ answers: {}, results: {}, attempts: [] }));
        setCurrentTaskIndex(0);
      },
    }),
    [saved, tasks, currentTaskIndex, statistics, byTaskType, mistakes, update],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Состояние раздела. Вне провайдера вызывать нельзя — это ошибка сборки. */
export function useAppState(): AppState {
  const value = useContext(Ctx);
  if (value === null) {
    throw new Error('useAppState вызван вне AppStateProvider');
  }
  return value;
}
