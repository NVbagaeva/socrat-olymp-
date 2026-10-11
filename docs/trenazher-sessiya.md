# Тренажёр на общей сессии: как подключить за 3 шага

Любой тренажёр сайта подключается к одной оболочке —
`TrainerSessionHost` (`app/src/components/tasks/session/`). Она даёт:

- сохранение тренировки в `localStorage` при каждом действии;
- возврат в незавершённую тренировку при входе;
- панель «Задание X из N · решено · таймер · Пауза · Завершить»;
- общий экран итогов: «Прорешать те же задачи» и «Похожие задачи»;
- метку на вкладке «Тренажёр» и защиту от двух открытых вкладок;
- работу без хранилища: в приватном режиме или при нехватке места
  тренировка идёт как обычно, с плашкой, что прогресс не сохранится.

Своих пауз, таймеров, итоговых экранов и ключей в `localStorage` у
тренажёра быть не должно.

Эталоны: №12 (`components/tasks/trainer/`), №8 (`vychisleniya/`),
№11 (`zadanie11/`).

## Шаг 1. Задания и их упаковка (`<тренажёр>Payload.ts`)

1. Тип заданий тренировки — всё, что собрал конфигуратор: задачи, режим
   («контроль»), флаги.
2. Проверка формы `isXxxPayload(value: unknown): value is Payload`.
   Строгая: битая или чужая запись не должна пройти, тогда оболочка
   сбросит её с плашкой.
3. **Если запись больше ~300 КБ** на максимальном варианте («Все»),
   нужны `pack` и `unpack`. Мерить нужно длину строки
   `localStorage.getItem('budetege:trainer:<раздел>:session')`.
   - `pack(payload)` сохраняет рецепт: seed, прототип, номер аналога,
     параметры чертежа. Готовые SVG и разборы в рецепт не идут.
   - В рецепт кладётся короткая подпись: хеш условия и ответа или `seal`.
   - `unpack(packed)` собирает задания тем же кодом, что при старте, и
     сверяет подпись. Не совпала (сайт обновился) — вернуть `null`:
     тренировка сбросится как устаревшая.
   - `unpack` может быть асинхронной: тяжёлый движок грузится через
     `import()`.

## Шаг 2. Состояние экрана (`<тренажёр>Ui.ts` и экран заданий)

1. Тип `XxxUi extends BaseUi` содержит обязательные общие поля и всё
   остальное, что ученик успел сделать.
   - Обязательные общие поля:
     - `index` — номер задания;
     - `marks[i]` — `'right' | 'hinted'`;
     - `tried[i] = true` — в задании была ошибка;
     - `order` — раскладка подхода или `null`;
     - `misses` — число неверных попыток, необязательное поле.
   - Остальное: ответ, открытые подсказки и шаг, введённое в полях. Только
     JSON: `Set` → массив, текст разбора не хранить — хранить флаг и
     раскрывать заново из `seal`.
2. Функция `readXxxUi(base)` читает поля через `lib/trainerSession/restore.ts`
   (`asString`, `asBool`, …). Что не прочиталось, получает значение по
   умолчанию.
3. Экран получает пропсы `restored`, `report`, `elapsed`, `onFinish`.
   - Каждый `useState` действия ученика стартует из `restored`.
   - Один вызов `useSessionReport<XxxUi>(report, { …всё состояние… })`
     стоит до любого раннего `return`.
   - Время на задачу считается по `elapsed()` (активные мс), не по
     `Date.now()`.
   - «Смотреть результат →» на последнем задании вызывает `onFinish()`.
   - Счётчик «Задание i из N» в экране не нужен: его показывает панель.

## Шаг 3. Подключить оболочку (входной компонент тренажёра)

```tsx
<TrainerSessionHost<XxxPayload, XxxUi>
  scope={scopeOfPath(base) ?? '10'}      // совпадает с лентой вкладок раздела
  backHref={base}
  isPayload={isXxxPayload}
  pack={packXxx}                         // если запись тяжёлая
  unpack={unpackXxx}
  count={(p) => p.tasks.length}
  describe={(p, i) => ({                 // для экрана итогов
    kind: titleOf(p.tasks[i]),
    html: p.tasks[i].questionHtml,
    review: () => <XxxReview task={p.tasks[i]} />,
    // icon, code, badge — если есть
  })}
  subset={(p, idx) => ({ ...p, tasks: idx.map((i) => p.tasks[i]) })}
  similar={(p, idx) => buildAnalogs(p, idx)}   // если есть генерация аналогов
  summary={{ hintedLabel: '…', extra: (data) => <Совет … /> }}  // необязательно
  configurator={(api) => <XxxConfigurator onStart={(…) => api.start(payload)} />}
  screen={({ payload, sessionId, restored, report, elapsed, finish }) => (
    <XxxScreen
      pool={payload.tasks}
      roundKey={sessionId}
      restored={restored === null ? null : readXxxUi(restored)}
      report={report}
      elapsed={elapsed}
      onFinish={finish}
    />
  )}
/>
```

`scope` — часть ключа `budetege:trainer:<scope>:session`. Он должен
совпадать с тем, что лента вкладок раздела вычисляет по своему адресу
(`scopeOfPath`). Иначе метка на вкладке «Тренажёр» не загорится.

## Перед PR

- Если у тренажёра были свои ключи сохранения сессии, их нужно дописать
  в `LEGACY_SESSION_KEYS` (`lib/trainerSession/store.ts`): у учеников они
  уберутся при входе. Ключи прогресса (счётчики, ошибки) остаются.
- Тренажёр нужно добавить в `scripts/check-trainer-sessions.mjs`:
  адрес, как начать тренировку и как ввести верный ответ.
- Проверки: `pnpm test:trainer-session` (хранилище), после
  `pnpm build` — `pnpm test:trainer-sessions` (браузер, все тренажёры).
- Если формат хранения меняется несовместимо, нужно поднять
  `TRAINER_SCHEMA_VERSION` в `lib/trainerSession/types.ts`.
