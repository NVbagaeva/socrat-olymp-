import type { Metadata } from 'next';
import { Trenazher3Tab } from '@/components/tasks/zadanie3/Trenazher3Tab';
import { stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';
import { TRENAZHER3_HREF } from '@/lib/zadanie3/links';
/* Панель и итоги общей оболочки тренировки — стили тех же маршрутов,
   что у №8 и №12. */
import '../../../[task]/[type]/prep.css';
import '../../../[task]/[type]/trainer.css';

const VKLADKA = vkladkaStereo('trenazher');

export const metadata: Metadata = {
  title: stereoTitle('3', VKLADKA),
};

/**
 * Вкладка «Тренажёр» №3 в «Стеклянной сцене»: три режима, выбор тем,
 * экран задачи с живым чертежом, итоги по группам — на общих
 * компонентах тренажёра (components/tasks/trening), как у №8. Сессия
 * собирается в браузере; раздел сессии — задание целиком («3»).
 */
export default function Page() {
  return <Trenazher3Tab base={TRENAZHER3_HREF} />;
}
