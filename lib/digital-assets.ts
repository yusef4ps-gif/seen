export const IMAGE_UPLOAD_MIME_MAP: Record<string, string[]> = {
  '.jpg': ['image/jpeg', 'image/jpg'],
  '.jpeg': ['image/jpeg', 'image/jpg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
  '.gif': ['image/gif'],
};

export const DOCUMENT_UPLOAD_MIME_MAP: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword', 'application/octet-stream'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
  ],
  '.xls': ['application/vnd.ms-excel', 'application/octet-stream'],
  '.xlsx': [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
  ],
  '.ppt': ['application/vnd.ms-powerpoint', 'application/octet-stream'],
  '.pptx': [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
  ],
  '.zip': ['application/zip', 'application/x-zip-compressed', 'multipart/x-zip', 'application/octet-stream'],
  '.rar': ['application/vnd.rar', 'application/x-rar-compressed', 'application/octet-stream'],
  '.epub': ['application/epub+zip', 'application/zip', 'application/octet-stream'],
  '.txt': ['text/plain'],
  '.csv': ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'],
};

export const ALLOWED_UPLOAD_EXTENSIONS: Record<string, string[]> = {
  ...IMAGE_UPLOAD_MIME_MAP,
  ...DOCUMENT_UPLOAD_MIME_MAP,
};

export const CANONICAL_MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.epub': 'application/epub+zip',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
};

export const MAX_DOCUMENT_UPLOAD_BYTES = 4.5 * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_BYTES = 4.5 * 1024 * 1024;

export function isDocumentExtension(ext: string): boolean {
  return Object.prototype.hasOwnProperty.call(DOCUMENT_UPLOAD_MIME_MAP, ext.toLowerCase());
}

export function extractDigitalMetaFromTags(tagsRaw: string | string[] | null | undefined): {
  digitalFileUrl: string;
  digitalFileName: string;
  digitalFileAccess: 'instant' | 'verified';
} {
  let parsedTags: string[] = [];
  if (Array.isArray(tagsRaw)) {
    parsedTags = tagsRaw;
  } else if (typeof tagsRaw === 'string' && tagsRaw.trim()) {
    try {
      const parsed = JSON.parse(tagsRaw);
      if (Array.isArray(parsed)) parsedTags = parsed;
    } catch {
      parsedTags = [];
    }
  }

  const urlTag = parsedTags.find((t) => typeof t === 'string' && t.startsWith('digital_url:'));
  const nameTag = parsedTags.find((t) => typeof t === 'string' && t.startsWith('digital_name:'));
  const accessTag = parsedTags.find((t) => typeof t === 'string' && t.startsWith('digital_access:'));

  let digitalFileUrl = '';
  let digitalFileName = '';
  if (urlTag) {
    const raw = urlTag.slice('digital_url:'.length);
    try {
      digitalFileUrl = decodeURIComponent(raw);
    } catch {
      digitalFileUrl = raw;
    }
  }
  if (nameTag) {
    const raw = nameTag.slice('digital_name:'.length);
    try {
      digitalFileName = decodeURIComponent(raw);
    } catch {
      digitalFileName = raw;
    }
  }

  const accessVal = accessTag ? accessTag.slice('digital_access:'.length) : 'instant';
  return {
    digitalFileUrl,
    digitalFileName,
    digitalFileAccess: accessVal === 'verified' ? 'verified' : 'instant',
  };
}

export function buildContentDisposition(fileName: string, isInlineImage: boolean): string {
  const cleanName = (fileName || 'file').replace(/[\r\n"]/g, '_');
  const lastDot = cleanName.lastIndexOf('.');
  const ext = lastDot > -1 ? cleanName.slice(lastDot).replace(/[^a-zA-Z0-9.]/g, '') : '';
  const asciiFallback = `file${ext || ''}`;
  const encoded = encodeURIComponent(cleanName);
  const disposition = isInlineImage ? 'inline' : 'attachment';
  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
