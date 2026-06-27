import type { PlanDataset } from '../domain/types';
import { parseMateriasJson } from '../domain/validation';

export const DRIVE_PLAN_FILE_NAME = 'correlativas_plan.json';
export const DRIVE_FILE_ID_STORAGE_KEY = 'correlativas_google_drive_file_id';

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

export class GoogleDriveError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GoogleDriveError';
    this.status = status;
  }
}

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

async function readDriveError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    return payload.error?.message ?? response.statusText;
  } catch {
    return response.statusText || 'Error desconocido';
  }
}

export function loadStoredDriveFileId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(DRIVE_FILE_ID_STORAGE_KEY);
}

export function saveStoredDriveFileId(fileId: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (fileId) {
      window.localStorage.setItem(DRIVE_FILE_ID_STORAGE_KEY, fileId);
      return;
    }

    window.localStorage.removeItem(DRIVE_FILE_ID_STORAGE_KEY);
  } catch {
    // Ignorar errores de persistencia
  }
}

export async function findPlanFileId(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent(`name='${DRIVE_PLAN_FILE_NAME}' and trashed=false`);
  const response = await fetch(
    `${DRIVE_FILES_URL}?spaces=appDataFolder&fields=files(id)&q=${query}`,
    { headers: authHeaders(accessToken) },
  );

  if (!response.ok) {
    throw new GoogleDriveError(
      `No se pudo buscar el plan en Google Drive: ${await readDriveError(response)}`,
      response.status,
    );
  }

  const payload = (await response.json()) as { files?: Array<{ id: string }> };
  return payload.files?.[0]?.id ?? null;
}

export async function loadPlanFromDrive(accessToken: string): Promise<PlanDataset | null> {
  const fileId = await findPlanFileId(accessToken);
  if (!fileId) {
    return null;
  }

  saveStoredDriveFileId(fileId);

  const response = await fetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, {
    headers: authHeaders(accessToken),
  });

  if (!response.ok) {
    throw new GoogleDriveError(
      `No se pudo descargar el plan: ${await readDriveError(response)}`,
      response.status,
    );
  }

  const raw = await response.text();
  return parseMateriasJson(raw);
}

export async function savePlanToDrive(
  accessToken: string,
  plan: PlanDataset,
  knownFileId: string | null,
): Promise<string> {
  const serialized = JSON.stringify(plan, null, 2);
  const fileId = knownFileId ?? (await findPlanFileId(accessToken));

  if (fileId) {
    const response = await fetch(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        ...authHeaders(accessToken),
        'Content-Type': 'application/json',
      },
      body: serialized,
    });

    if (!response.ok) {
      throw new GoogleDriveError(
        `No se pudo actualizar el plan en Google Drive: ${await readDriveError(response)}`,
        response.status,
      );
    }

    saveStoredDriveFileId(fileId);
    return fileId;
  }

  const boundary = 'plan_cursada_sync';
  const multipartBody = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify({
      name: DRIVE_PLAN_FILE_NAME,
      parents: ['appDataFolder'],
    }),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    serialized,
    `--${boundary}--`,
    '',
  ].join('\r\n');

  const response = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, {
    method: 'POST',
    headers: {
      ...authHeaders(accessToken),
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!response.ok) {
    throw new GoogleDriveError(
      `No se pudo guardar el plan en Google Drive: ${await readDriveError(response)}`,
      response.status,
    );
  }

  const payload = (await response.json()) as { id?: string };
  if (!payload.id) {
    throw new GoogleDriveError('Google Drive no devolvió el identificador del archivo.');
  }

  saveStoredDriveFileId(payload.id);
  return payload.id;
}
