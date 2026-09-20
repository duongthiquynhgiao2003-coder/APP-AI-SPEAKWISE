/**
 * Utility functions for SpeakWise AI
 */

/**
 * Normalizes and formats student name into a clean, valid cross-platform file name.
 * Example: "Dương Thị Quỳnh Giao" -> "Duong Thi Quynh Giao.mp3" or "Duong Thi Quynh Giao.mp4"
 */
export function formatStudentFileName(fullName: string, extension: 'mp3' | 'mp4' | 'wav'): string {
  if (!fullName || !fullName.trim()) {
    return `Duong Thi Quynh Giao.${extension}`;
  }

  // Remove Vietnamese diacritics while preserving casing, spaces, and English characters
  const unsigned = fullName
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    // Remove filesystem invalid characters (< > : " / \ | ? * and control chars)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    // Collapse multiple consecutive spaces
    .replace(/\s+/g, ' ')
    .trim();

  const safeName = unsigned || 'Duong Thi Quynh Giao';
  return `${safeName}.${extension}`;
}

/**
 * Downloads a media Blob or Blob URL as a file with a specific filename.
 * Guarantees the browser saves with the student's full name (e.g. Duong Thi Quynh Giao.mp4).
 */
export async function downloadMediaFile(urlOrBlob: string | Blob, fileName: string) {
  let objectUrl = '';
  let shouldRevoke = false;

  try {
    let blob: Blob;
    if (typeof urlOrBlob === 'string') {
      const response = await fetch(urlOrBlob);
      blob = await response.blob();
    } else {
      blob = urlOrBlob;
    }

    const mimeType = fileName.endsWith('.mp4')
      ? 'video/mp4'
      : fileName.endsWith('.mp3')
      ? 'audio/mp3'
      : blob.type || 'application/octet-stream';

    // Wrapping into a named File object ensures browser metadata assigns the exact student's name
    const namedFile = new File([blob], fileName, { type: mimeType });
    objectUrl = URL.createObjectURL(namedFile);
    shouldRevoke = true;

    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.setAttribute('download', fileName);
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      try {
        if (anchor.parentNode) {
          document.body.removeChild(anchor);
        }
        if (shouldRevoke) {
          URL.revokeObjectURL(objectUrl);
        }
      } catch {}
    }, 1500);
  } catch (err) {
    console.error('Download with named File failed, falling back:', err);
    try {
      const anchor = document.createElement('a');
      anchor.href = typeof urlOrBlob === 'string' ? urlOrBlob : URL.createObjectURL(urlOrBlob);
      anchor.download = fileName;
      anchor.setAttribute('download', fileName);
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        try {
          if (anchor.parentNode) document.body.removeChild(anchor);
        } catch {}
      }, 1500);
    } catch (fallbackErr) {
      console.error('Fallback download error:', fallbackErr);
    }
  }
}
