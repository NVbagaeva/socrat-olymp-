import type { Metadata } from 'next';
import { PechatKnopka1 } from '@/components/tasks/planimetriya/PechatKnopka1';
import { zadanie1Title } from '@/content/zadanie1';
import { spravochnikHtml } from '@/lib/planimetriya/spravochnik';
import 'katex/dist/katex.min.css';
import '@/lib/planimetriya/planimetriya.css';
import '../pechat1.css';
import '../spravochnik1.css';

export const metadata: Metadata = {
  title: zadanie1Title('Справочник по планиметрии'),
  robots: { index: false },
};

/**
 * Печатный справочник по планиметрии: все карточки вкладки «Теория»
 * плиткой — заголовок, формула, маленький чертёж; без пояснений и
 * примеров. Свой файл A4 на 2–4 листа, оболочки сайта нет.
 */
export default function Spravochnik1Page() {
  return (
    <>
      <PechatKnopka1
        label="Скачать PDF / Печать"
        lead="В окне печати выберите «Сохранить как PDF». Лист A4, книжная ориентация."
      />
      <main className="spr">
        <header className="spr__head">
          <h1 className="spr__title">Справочник по планиметрии</h1>
          <p className="spr__lead">Задание №1 ЕГЭ профильного уровня · Будет на ЕГЭ</p>
        </header>
        <div dangerouslySetInnerHTML={{ __html: spravochnikHtml() }} />
      </main>
    </>
  );
}
