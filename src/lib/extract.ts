// Client-side text extraction for uploaded study material.
// Supports .txt / .md, .pdf (pdfjs), and .pptx (jszip + slide XML).
// pdfjs and jszip are heavy, so they're imported lazily — only when a matching
// file is actually uploaded, keeping the initial app bundle small.

export interface PdfRead {
  text: string;
  base64: string;
  numPages: number;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result);
      resolve(s.slice(s.indexOf(',') + 1)); // strip "data:...;base64,"
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export interface ImageRead {
  base64: string;
  mediaType: string;
}

const IMAGE_EXT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

/** True for photo/screenshot files we can read with vision. */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
}

export async function readImage(file: File): Promise<ImageRead> {
  const base64 = await fileToBase64(file);
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const mediaType = file.type.startsWith('image/')
    ? file.type
    : IMAGE_EXT_TYPES[ext] || 'image/png';
  return { base64, mediaType };
}

export async function readPdf(file: File): Promise<PdfRead> {
  const base64 = await fileToBase64(file);
  const pdfjsLib = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url'))
    .default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(text);
  }
  return { text: pages.join('\n\n'), base64, numPages: pdf.numPages };
}

async function extractPptx(file: File): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml/)![1]);
      const nb = Number(b.match(/slide(\d+)\.xml/)![1]);
      return na - nb;
    });

  const slides: string[] = [];
  for (const path of slidePaths) {
    const xml = await zip.files[path].async('string');
    // Pull text out of <a:t>...</a:t> runs.
    const matches = xml.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [];
    const text = matches
      .map((m) => m.replace(/<\/?a:t>/g, ''))
      .map(decodeXmlEntities)
      .join(' ');
    if (text.trim()) slides.push(text);
  }
  return slides.join('\n\n');
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return (await readPdf(file)).text;
  if (name.endsWith('.pptx')) return extractPptx(file);
  if (
    name.endsWith('.txt') ||
    name.endsWith('.md') ||
    file.type.startsWith('text/')
  )
    return file.text();
  throw new Error(
    'Unsupported file type. Upload a .pdf, .pptx, .txt, or paste the text directly.'
  );
}
