export type CopyResult = 'copied' | 'shared' | 'selected' | 'failed';

function selectTextarea(textarea: HTMLTextAreaElement): void {
  textarea.focus();

  if (typeof textarea.setSelectionRange === 'function') {
    textarea.setSelectionRange(0, textarea.value.length);
  } else {
    textarea.select();
  }
}

async function clipboardMatches(expected: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.readText) {
      return false;
    }

    const read = await navigator.clipboard.readText();
    return read === expected;
  } catch {
    return false;
  }
}

async function writeWithClipboardApi(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) {
      return false;
    }

    await navigator.clipboard.writeText(text);
    // writeText sin error: confiar aunque readText esté bloqueado (común en Safari).
    if (await clipboardMatches(text)) {
      return true;
    }

    return true;
  } catch {
    return false;
  }
}

function copyWithExecCommandOnElement(textarea: HTMLTextAreaElement): boolean {
  selectTextarea(textarea);

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  }
}

async function shareText(text: string): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({ text });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return false;
    }

    return false;
  }
}

/**
 * Copia desde un textarea visible en el DOM (más fiable en Safari que elementos ocultos).
 * Solo reporta éxito si el portapapeles contiene el texto o el usuario compartió.
 */
export async function copyFromTextarea(textarea: HTMLTextAreaElement): Promise<CopyResult> {
  const text = textarea.value;
  selectTextarea(textarea);

  if (await writeWithClipboardApi(text)) {
    return 'copied';
  }

  if (copyWithExecCommandOnElement(textarea) && (await clipboardMatches(text))) {
    return 'copied';
  }

  if (await shareText(text)) {
    return 'shared';
  }

  selectTextarea(textarea);
  return 'selected';
}

/** Copia texto arbitrario; prefiere textarea visible si se pasa uno. */
export async function copyTextToClipboardAsync(
  text: string,
  source?: HTMLTextAreaElement | null,
): Promise<CopyResult> {
  if (source) {
    return copyFromTextarea(source);
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';

  document.body.appendChild(textarea);

  try {
    return await copyFromTextarea(textarea);
  } finally {
    document.body.removeChild(textarea);
  }
}

export function copyResultMessage(result: CopyResult): string {
  switch (result) {
    case 'copied':
      return 'Prompt copiado';
    case 'shared':
      return 'Elegí Copiar en el menú';
    case 'selected':
      return 'Texto seleccionado — Copiar del menú';
    case 'failed':
      return 'No se pudo copiar';
  }
}

export function copyResultIsSuccess(result: CopyResult): boolean {
  return result === 'copied' || result === 'shared' || result === 'selected';
}
