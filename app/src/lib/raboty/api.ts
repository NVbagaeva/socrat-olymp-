/**
 * Работы-варианты в кабинете: интерфейс экранов. Методы — те же функции
 * базы (supabase/migrations/20261024120000_raboty_chast2.sql), фото — через
 * сервис загрузки (infra/lite/uploads). Пока сервера нет, реализация одна —
 * в браузере (localApi.ts), с теми же правилами доступа.
 */

import type {
  CheckRow,
  CheckWork,
  IssuedWork,
  IssueWorkInput,
  MarkLayer,
  Notice,
  Photo,
  StudentWork,
  WorkReport,
} from './types';

export interface UploadMeta {
  width: number;
  height: number;
}

export interface RabotyApi {
  /* ── Ученик ── */
  myWorks(): Promise<StudentWork[]>;
  studentWork(workId: string): Promise<StudentWork | null>;
  /** save_answer: часть 1 — пункт '', часть 2 — номер пункта. */
  saveAnswer(workId: string, taskNo: number, punkt: string, vvod: unknown): Promise<void>;
  /** Фото в конец списка задания. Ошибка «offline» — очередь повторит позже. */
  uploadPhoto(
    workId: string,
    taskNo: number,
    jpeg: Blob,
    meta: UploadMeta,
    onProgress?: (share: number) => void,
  ): Promise<Photo>;
  deletePhoto(photoId: string): Promise<void>;
  orderPhotos(workId: string, taskNo: number, ids: readonly string[]): Promise<void>;
  /** submit_work. */
  submitWork(workId: string): Promise<void>;

  /** Временная ссылка на фото (ученику — свои, учителю — работ на проверке). */
  photoUrl(photoId: string): Promise<string>;

  /* ── Учитель ── */
  issueWork(input: IssueWorkInput): Promise<string>;
  extendWork(workId: string, until: string, studentId?: string | null): Promise<void>;
  issuedWorks(): Promise<IssuedWork[]>;
  /** Баллы учеников по заданиям — для статистики и выгрузки в Excel. */
  workReport(workId: string): Promise<WorkReport | null>;
  checkList(): Promise<CheckRow[]>;
  checkWork(submissionId: string): Promise<CheckWork | null>;
  startCheck(submissionId: string): Promise<void>;
  setGrade(
    submissionId: string,
    taskNo: number,
    ball: number,
    kriteriy: number | null,
    ili: number | null,
    comment: string | null,
  ): Promise<void>;
  overridePart1(
    submissionId: string,
    taskNo: number,
    right: boolean,
    comment: string | null,
  ): Promise<void>;
  returnTask(submissionId: string, taskNo: number, comment: string | null): Promise<void>;
  finishCheck(submissionId: string, comment: string | null): Promise<void>;
  savePhotoMarks(photoId: string, layer: MarkLayer): Promise<void>;

  /* ── Общее ── */
  notices(): Promise<Notice[]>;
  readNotices(): Promise<void>;
  subscribe(listener: () => void): () => void;
}
