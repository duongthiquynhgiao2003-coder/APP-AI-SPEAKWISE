import mammoth from 'mammoth';

/**
 * Extracts plain text from various file formats (.txt, .docx, .pdf, .md, etc.)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. Plain text formats (.txt, .md, .csv, .rtf, text/*)
  if (
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.csv') ||
    fileName.endsWith('.rtf') ||
    file.type.startsWith('text/')
  ) {
    const text = await file.text();
    return cleanExtractedText(text);
  }

  // 2. Microsoft Word modern document (.docx)
  if (fileName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const docxText = result.value.trim();
      if (docxText) {
        return cleanExtractedText(docxText);
      }
      throw new Error('Nội dung file .docx trống.');
    } catch (err: any) {
      console.warn('Mammoth extraction error:', err);
      throw new Error('Không thể giải nén văn bản từ file Word .docx này.');
    }
  }

  // 3. PDF document (.pdf)
  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfText = await extractTextFromPdf(arrayBuffer);
      if (pdfText && pdfText.trim().length > 0) {
        return cleanExtractedText(pdfText);
      }
      throw new Error('File PDF không chứa văn bản có thể trích xuất được (có thể là file scan/ảnh).');
    } catch (err: any) {
      console.warn('PDF extraction error:', err);
      throw new Error(err.message || 'Không thể đọc nội dung file PDF.');
    }
  }

  // 4. Legacy .doc (Word 97-2003 binary format)
  if (fileName.endsWith('.doc')) {
    try {
      // Try reading as arrayBuffer and extract ASCII/UTF-16 strings
      const arrayBuffer = await file.arrayBuffer();
      const extracted = extractTextFromBinaryDoc(arrayBuffer);
      if (extracted && extracted.trim().length > 10) {
        return cleanExtractedText(extracted);
      }
      throw new Error('File .doc phiên bản cũ. Em hãy lưu thành file .docx hoặc copy dán trực tiếp vào ô nhập nhé!');
    } catch (err: any) {
      throw new Error('Vui lòng lưu file sang định dạng .docx hoặc copy dán trực tiếp vào ô nhập nhé!');
    }
  }

  // Fallback: try reading as text
  const fallbackText = await file.text();
  const cleaned = cleanExtractedText(fallbackText);
  if (cleaned.length > 5) {
    return cleaned;
  }

  throw new Error('Định dạng file không được hỗ trợ. Vui lòng dùng file .txt, .docx hoặc copy dán nội dung vào ô nhập.');
}

/**
 * Extracts plain text from PDF ArrayBuffer using pdfjs-dist
 */
async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  // Dynamically import pdfjs-dist to avoid top-level bundle weight and worker setup issues
  const pdfjsLib = await import('pdfjs-dist');

  // Provide worker if not set
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    } catch (e) {
      // Ignore if worker cannot be assigned
    }
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= Math.min(numPages, 50); pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageString = textContent.items
      .map((item: any) => (item && 'str' in item ? item.str : ''))
      .filter((s: string) => s.length > 0)
      .join(' ');
    if (pageString.trim()) {
      pageTexts.push(pageString.trim());
    }
  }

  return pageTexts.join('\n\n');
}

/**
 * Fast stream extractor for legacy binary .doc files (Word 97-2003)
 */
function extractTextFromBinaryDoc(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  let result = '';
  let inAscii = false;
  let currentWord = '';

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    // Printable ASCII or newline/tab
    if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9) {
      currentWord += String.fromCharCode(b);
      inAscii = true;
    } else {
      if (inAscii && currentWord.length >= 3) {
        // Filter out binary control sequences
        if (!/^[0-9a-fA-F]{4,}$/.test(currentWord) && /[a-zA-Z]/.test(currentWord)) {
          result += ' ' + currentWord;
        }
      }
      currentWord = '';
      inAscii = false;
    }
  }
  return result;
}

/**
 * Clean extracted text: remove multiple line breaks, unneeded non-printable chars
 */
function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
