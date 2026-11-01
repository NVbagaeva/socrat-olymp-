import { otvetFayla, vseFayly, type ParametryFayla } from '@/lib/veroyatnost/dannye45-server';

/* Вариант задания №5 для «Узнай метод» — файлом сборки (lib/veroyatnost/dannye45.ts). */
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): ParametryFayla[] {
  return vseFayly(5, 'uznay');
}

export function GET(_request: Request, { params }: { params: Promise<ParametryFayla> }) {
  return otvetFayla(5, 'uznay', params);
}
