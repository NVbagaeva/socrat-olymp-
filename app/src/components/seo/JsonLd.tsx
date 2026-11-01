/**
 * Микроразметка Schema.org в JSON-LD (lib/schema.ts): один тег
 * <script type="application/ld+json"> на объект. Знак «<» в данных
 * экранируется — строка не закроет тег раньше времени.
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
