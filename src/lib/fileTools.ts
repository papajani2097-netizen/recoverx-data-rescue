export interface DuplicateGroup {
  fingerprint: string;
  files: File[];
}

export interface VideoMetadata {
  durationSeconds: number;
  width: number;
  height: number;
}

export async function sha256File(file: File): Promise<string> {
  if (file.size > 100 * 1024 * 1024) {
    throw new Error(`${file.name} is over 100 MB. Choose a smaller file to avoid excessive memory use.`);
  }
  if (!globalThis.crypto?.subtle) {
    throw new Error('SHA-256 is unavailable in this browser. Use a secure HTTPS connection.');
  }

  const digest = await globalThis.crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function findDuplicateFiles(files: File[]): Promise<DuplicateGroup[]> {
  const byFingerprint = new Map<string, File[]>();

  for (const file of files) {
    const fingerprint = await sha256File(file);
    const matches = byFingerprint.get(fingerprint) ?? [];
    matches.push(file);
    byFingerprint.set(fingerprint, matches);
  }

  return Array.from(byFingerprint, ([fingerprint, matches]) => ({ fingerprint, files: matches }))
    .filter((group) => group.files.length > 1);
}

export async function reencodeImage(file: File): Promise<Blob> {
  if (file.size > 100 * 1024 * 1024) {
    throw new Error('This image is over 100 MB. Choose a smaller file to avoid excessive memory use.');
  }

  if (typeof createImageBitmap !== 'function') {
    throw new Error('This browser does not support local image decoding.');
  }

  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 50_000_000) {
      throw new Error('This image has too many pixels to safely re-encode in your browser.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Your browser could not create an image canvas.');
    }
    context.drawImage(bitmap, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Your browser could not encode this image.'));
        }
      }, 'image/png');
    });
  } finally {
    bitmap.close();
  }
}

export function readVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out while reading ${file.name}.`));
    }, 15_000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(objectUrl);
    };

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const metadata = {
        durationSeconds: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      };
      cleanup();
      resolve(metadata);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error(`The browser could not read video metadata from ${file.name}.`));
    };
    video.src = objectUrl;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
