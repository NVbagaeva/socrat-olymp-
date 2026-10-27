import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Chertezh3d } from '@/components/stereo/Chertezh3d';
import { OpornyeStereoScreen } from '@/components/stereo/opornye/OpornyeStereoScreen';
import { OpornyeStereoShell } from '@/components/stereo/opornye/OpornyeStereoShell';
import { GLAVY_3 } from '@/content/stereo/glavy';
import { STEREO, stereoTitle } from '@/content/stereo/zadaniya';
import { BLOKI_3, blokBySlug, zadachiBloka } from '@/lib/stereo/opornye3/bloki';
import { sealZadacha } from '@/lib/stereo/opornye3/seal';
import { renderSolid } from '@/lib/solid/render';
import { ZADANIYA } from '@/lib/paths';
import '../../../../[task]/[type]/prep.css';

/* Статический экспорт: страницы только у написанных блоков. */
export function generateStaticParams() {
  return BLOKI_3.filter((b) => b.gotov).map((b) => ({ blok: b.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const found = blokBySlug(blok);
  return { title: stereoTitle('3', found?.nazvanie ?? 'Опорные задачи') };
}

/**
 * Блок опорных задач №3: десять задач в закрытом виде — условие и
 * чертёж открыто, ответ отпечатком, подсказки и разбор закрыты.
 */
export default async function Page({ params }: { params: Params }) {
  const { blok } = await params;
  const found = blokBySlug(blok);
  if (found === undefined || !found.gotov) {
    notFound();
  }
  const base = `${ZADANIYA}/${STEREO['3'].slug}`;
  const zadachi = zadachiBloka(found.id);
  return (
    <OpornyeStereoShell title={`${found.no}. ${found.nazvanie}`} listHref={`${base}/opornye-zadachi/`} vBloke>
      <OpornyeStereoScreen
        blokId={found.id}
        no={found.no}
        title={found.nazvanie}
        umenie={found.umenie}
        tasks={zadachi.map((z, i) => sealZadacha(z, i + 1))}
        risunki={zadachi.map((z) =>
          z.vid === 'nazhmi' ? null : <Chertezh3d key={z.id} model={z.model} tema="ekran" />,
        )}
        miniatyury={zadachi.map((z) => renderSolid(z.model, { tema: 'ekran', bezPodpisey: true }))}
        listHref={`${base}/opornye-zadachi/`}
        teoriyaHref={`${base}/teoriya/#teoriya-${found.glava}`}
        glava={GLAVY_3.find((g) => g.id === found.glava)?.title ?? ''}
        trenazherHref={`${base}/trenazher/`}
      />
    </OpornyeStereoShell>
  );
}
