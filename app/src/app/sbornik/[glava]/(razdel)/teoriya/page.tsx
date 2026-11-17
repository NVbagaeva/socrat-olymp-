import type { Metadata } from 'next';
import { TeoriyaShell } from '@/components/tasks/teoriya/TeoriyaShell';
import { RAZDELY_GLAVY_1, telaGlavy1 } from '@/components/sbornik/teoriya/glava1';
import { sbornikTitle } from '@/content/sbornik';
import { nomerGlavy, staticGlavy } from '@/lib/sbornik/marshrut';
/* Разметка теории (vteor-*: номер раздела, колонка содержания) — общая
   с теорией заданий ЕГЭ; её подключают и разделы №2, 5, 9 и др. */
import '@/app/zadaniya/veroyatnost.css';
import '@/components/tasks/teoriya/teoriya-steklo.css';

export const dynamicParams = false;

export function generateStaticParams(): { glava: string }[] {
  return staticGlavy();
}

export async function generateMetadata({ params }: { params: Promise<{ glava: string }> }): Promise<Metadata> {
  const { glava } = await params;
  return { title: sbornikTitle('Теория', `Глава ${nomerGlavy(glava)}`) };
}

/** Теория главы: свои рамки и примеры, на сборке набраны KaTeX. */
export default async function TeoriyaGlavy({ params }: { params: Promise<{ glava: string }> }) {
  const { glava } = await params;
  const n = nomerGlavy(glava);
  return (
    <div className="teor-steklo">
      <TeoriyaShell vkladka="Теория" razdely={RAZDELY_GLAVY_1} tela={telaGlavy1} trackKey={`sbornik-${n}`} />
    </div>
  );
}
