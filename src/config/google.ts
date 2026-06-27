const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function getGoogleClientId(): string | null {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.trim() === '') {
    return null;
  }

  return GOOGLE_CLIENT_ID.trim();
}

export function isGoogleDriveConfigured(): boolean {
  return getGoogleClientId() !== null;
}

export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
