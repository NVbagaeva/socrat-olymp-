/* Точка импорта для того, что берут другие страницы.
   Части страницы темы сюда не попадают намеренно: их тянет за собой
   KaTeX и движок чертежей, а банк заданий — клиентский экран, и в его
   сборку эти зависимости через общий файл заходить не должны.
   Страница темы берёт их по прямому пути. */
export { TaskGrid, type TaskGridProps } from './TaskGrid';
export { TaskImage, type TaskImageProps } from './TaskImage';
/* Рисованные миниатюры больше не показываются, но остаются
   в проекте: решение о них ещё не принято. */
export { IllustrationFrame, TaskIllustration } from './illustrations';
