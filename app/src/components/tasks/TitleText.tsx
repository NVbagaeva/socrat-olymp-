/**
 * Заголовок, набранный KaTeX заранее, — для клиентских экранов.
 *
 * Сервер набирает формулы в заголовке ($…$) и передаёт готовую
 * вёрстку в html; клиентскому экрану KaTeX для этого не нужен. Нет
 * вёрстки — выводится сам текст.
 */
export function TitleText({ title, html }: { title: string; html?: string | undefined }) {
  if (html === undefined) {
    return <>{title}</>;
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
