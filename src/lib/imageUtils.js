/**
 * Compress an image File to under 2MB.
 * If the file is already under 2MB, it's returned as-is.
 * Reduces quality progressively and scales down very large images.
 */
export function compressImageUnder2MB(file) {
  return new Promise((resolve, reject) => {
    const MAX_BYTES = 2 * 1024 * 1024; // 2MB — matches function name & Base44 upload safety
    if (file.size <= MAX_BYTES) { resolve(file); return; }

    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Scale down dimensions if very large
      const MAX_DIM = 1920;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.85;

      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            if (blob.size <= MAX_BYTES || quality <= 0.25) {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
            } else {
              quality = Math.round((quality - 0.1) * 10) / 10;
              tryCompress();
            }
          },
          "image/jpeg",
          quality
        );
      };

      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This photo format could not be processed. Please choose JPG, PNG, or WebP."));
    };
    img.src = url;
  });
}