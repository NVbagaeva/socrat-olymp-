'use client';

/** Общее для экранов классов и ДЗ: кто вошёл, подтверждение действия, ошибка базы. */

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button, EmptyState, Modal } from '@/components/ui';
import { AUTH_HREF } from '@/lib/auth/config';
import { useSessionUser, type SessionUser } from '@/lib/auth/session';

export const dzApi = () => import('@/lib/dz/api');

export function errorCode(error: unknown): string {
  return error instanceof Error && 'code' in error
    ? String((error as { code: string }).code)
    : 'unknown';
}

/** Параметр адреса страницы (страницы статические: читаем в браузере). */
export function queryParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}

/** Вошедший или приглашение войти. */
export function NeedLogin({ text }: { text: string }) {
  return (
    <EmptyState
      title={text}
      description="Классы и домашние задания хранятся в кабинете."
      action={
        <Link className="btn btn--primary" href={AUTH_HREF.voyti}>
          Войти
        </Link>
      }
    />
  );
}

export function useUser(): SessionUser | null {
  return useSessionUser();
}

/** Окно «Точно?» для необратимых действий: отмена слева, действие справа. */
export function Confirm({
  open,
  title,
  text,
  action,
  danger = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  text?: ReactNode;
  action: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={text}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {action}
          </Button>
        </>
      }
    />
  );
}
