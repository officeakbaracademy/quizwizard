/**
 * Images are served as real files now rather than inlined base64, but jsPDF
 * needs the raw bytes to embed them. These helpers fetch a URL once, keep the
 * data URL in a module-level cache, and hand back natural dimensions so pages
 * can be laid out without distortion.
 */

const dataUrlCache = new Map();
const dimensionCache = new Map();

export async function toDataUrl(url) {
  if (dataUrlCache.has(url)) return dataUrlCache.get(url);

  const pending = (async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not load image ${url} (${response.status})`);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Could not read image ${url}`));
      reader.readAsDataURL(blob);
    });
  })();

  dataUrlCache.set(url, pending);

  try {
    return await pending;
  } catch (error) {
    dataUrlCache.delete(url);
    throw error;
  }
}

/** Natural size of an image. Falls back to A4-ish proportions if it will not load. */
export function getImageDimensions(src) {
  if (dimensionCache.has(src)) return dimensionCache.get(src);

  const pending = new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ w: image.naturalWidth || 1000, h: image.naturalHeight || 1400 });
    image.onerror = () => resolve({ w: 1000, h: 1400 });
    image.src = src;
  });

  dimensionCache.set(src, pending);
  return pending;
}

/** Fetches the bytes and measures the image in one step. */
export async function loadImageForPdf(url) {
  const dataUrl = await toDataUrl(url);
  const dims = await getImageDimensions(dataUrl);
  return { dataUrl, ...dims };
}
