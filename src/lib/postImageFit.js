export const STANDARD_POST_IMAGE_RATIO = 4 / 5;

export function getStandardPostImageFit(naturalWidth, naturalHeight) {
  const width = Number(naturalWidth);
  const height = Number(naturalHeight);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return "contain";
  return width / height < STANDARD_POST_IMAGE_RATIO ? "cover" : "contain";
}
