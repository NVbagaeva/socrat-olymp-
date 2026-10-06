'use client';

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { reloadOnceForChunkError } from '@/lib/chunkReload';
import { ErrorFallback } from './ErrorFallback';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Что внутри: «рисунок», «подсказку». Попадает в сообщение. */
  what?: string;
  /**
   * Пока значение не меняется, показанная ошибка остаётся. Сменилось
   * (ученик открыл другую задачу) — блок пробует отрисоваться заново.
   */
  resetKey?: string | number;
  /** Запасной вид. По умолчанию — ErrorFallback в виде блока. */
  fallback?: ReactNode;
}

interface State {
  error: unknown;
  failed: boolean;
}

/**
 * Граница ошибок для одного блока: рисунка, формулы, подсказки.
 *
 * Без неё исключение при отрисовке любого блока убирало с экрана всю
 * страницу. С ней падает только этот блок, на его месте — сообщение, а
 * остальное работает. Для страницы целиком есть app/error.tsx.
 *
 * Классом, потому что перехватывать ошибки отрисовки хуками React не
 * умеет. Сбой загрузки кода лечится автоматической перезагрузкой, но
 * один раз (lib/chunkReload.ts).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  override state: State = { error: null, failed: false };

  static getDerivedStateFromError(error: unknown): State {
    return { error, failed: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    reloadOnceForChunkError(error);
    /* В консоль, чтобы в отчёте «у меня белый экран» было что показать. */
    console.error('Блок не отрисовался', error, info.componentStack);
  }

  override componentDidUpdate(prev: ErrorBoundaryProps) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null, failed: false });
    }
  }

  override render() {
    if (!this.state.failed) {
      return this.props.children;
    }
    return (
      this.props.fallback ?? (
        <ErrorFallback variant="block" error={this.state.error} what={this.props.what} />
      )
    );
  }
}
