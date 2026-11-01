import { otvetFayla, vseFayly, type ParametryFayla } from '@/lib/veroyatnost/dannye45-server';

/* Вариант задания №4 для отработки — файлом сборки (lib/veroyatnost/dannye45.ts). */
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): ParametryFayla[] {
  return vseFayly(4, 'bank');
}

export function GET(_request: Request, { params }: { params: Promise<ParametryFayla> }) {
  return otvetFayla(4, 'bank', params);
}
