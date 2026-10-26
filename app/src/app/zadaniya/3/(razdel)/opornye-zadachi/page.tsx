import type { Metadata } from 'next';
import { OpornyeStereoList } from '@/components/stereo/opornye/OpornyeStereoList';
import { OpornyeStereoShell } from '@/components/stereo/opornye/OpornyeStereoShell';
import { STEREO, stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';
import { BLOKI_3, zadachiBloka } from '@/lib/stereo/opornye3/bloki';
import { dekorBlokov, kartinkaBloka, piktogrammaBloka } from '@/lib/stereo/opornye3/piktogrammy';
import { assetUrl } from '@/lib/assetUrl';
import { renderSolid } from '@/lib/solid/render';
import { ZADANIYA } from '@/lib/paths';
import '../../../[task]/[type]/prep.css';

const VKLADKA = vkladkaStereo('opornye');

export const metadata: Metadata = {
  title: stereoTitle('3', VKLADKA),
};

/** Вкладка «Опорные задачи» №3: двенадцать блоков по умениям. */
export default function Page() {
  const listHref = `${ZADANIYA}/${STEREO['3'].slug}/opornye-zadachi/`;
  return (
    <OpornyeStereoShell
      title={VKLADKA}
      listHref={listHref}
      dekor={renderSolid(dekorBlokov(), { tema: 'ekran', bezPodpisey: true })}
    >
      <OpornyeStereoList
        listHref={listHref}
        bloki={BLOKI_3.map((b) => ({
          id: b.id,
          slug: b.slug,
          no: b.no,
          nazvanie: b.nazvanie,
          umenie: b.umenie,
          lead: b.lead,
          gotov: b.gotov,
          zadachi: zadachiBloka(b.id).map((z) => z.id),
          piktogramma: (() => {
            const m = piktogrammaBloka(b.id);
            return m === null ? null : renderSolid(m, { tema: 'ekran', bezPodpisey: true });
          })(),
          kartinka: (() => {
            const src = kartinkaBloka(b.id);
            return src === null ? null : assetUrl(src);
          })(),
        }))}
      />
    </OpornyeStereoShell>
  );
}
