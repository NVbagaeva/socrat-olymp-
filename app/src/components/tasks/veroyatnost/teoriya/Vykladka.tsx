import { nabratKuski } from '@/lib/tex';
import { VykladkaKlient } from '../VykladkaKlient';

export interface VykladkaProps {
  /**
   * Куски формулы, каждый — TeX без долларов, в порядке чтения.
   * Рвётся формула только по знаку «=», и на разрыве знак стоит в
   * тексте дважды: в конце куска и в начале следующего.
   */
  stroki: readonly string[];
}

/**
 * Выкладка теории: куски задаёт автор в конфиге, набираются они
 * здесь, на сервере, а в строки по ширине колонки их собирает
 * VykladkaKlient — помещается формула целиком, она стоит одной
 * строкой без повторных знаков.
 */
export function Vykladka({ stroki }: VykladkaProps) {
  return <VykladkaKlient className="vteor-vykladka" kuski={nabratKuski(stroki, true)} />;
}
