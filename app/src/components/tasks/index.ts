/* Точка импорта для того, что берут другие страницы.
   Части страницы темы сюда не попадают намеренно: их тянет за собой
   KaTeX и движок чертежей, а банк заданий — клиентский экран, и в его
   сборку эти зависимости через общий файл заходить не должны.
   Страница темы берёт их по прямому пути.

   Так же и SheetBlock: он стоял здесь, и через него в бандл
   страницы /zadaniya уезжал весь банк задания №3 — с формулами
   ответов и разборами открытым текстом. Берут его по прямому
   пути, и только страница теории раздела. */
export { SubtopicCard, type SubtopicCardProps } from './SubtopicCard';
export { TaskGrid, type TaskGridProps } from './TaskGrid';
export { TaskImage, type TaskImageProps } from './TaskImage';
/* Рисованные миниатюры больше не показываются, но остаются
   в проекте: решение о них ещё не принято. */
export { IllustrationFrame, TaskIllustration } from './illustrations';
