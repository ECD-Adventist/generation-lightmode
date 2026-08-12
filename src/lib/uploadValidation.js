// Client-side upload validation: MIME type + extension + size, and the two must agree.
// Defense-in-depth for all user file uploads (server storage is handled by the platform).

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB

const IMAGE_TYPES = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
  "image/heic": ["heic"],
  "image/heif": ["heif"],
};

const AUDIO_TYPES = {
  "audio/mpeg": ["mp3", "mpga"],
  "audio/mp4": ["m4a", "mp4"],
  "audio/wav": ["wav"],
  "audio/x-wav": ["wav"],
  "audio/ogg": ["ogg", "oga"],
  "audio/webm": ["webm"],
  "audio/flac": ["flac"],
};

function getExtension(name) {
  const idx = (name || "").lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

function validate(file, typeMap, maxBytes, label) {
  if (!file) return { ok: false, error: "No file selected." };
  if (file.size > maxBytes) {
    return { ok: false, error: `File is too large. Maximum size is ${Math.round(maxBytes / (1024 * 1024))} MB.` };
  }
  const allowedExts = typeMap[file.type];
  if (!allowedExts) {
    return { ok: false, error: `Unsupported ${label} format.` };
  }
  const ext = getExtension(file.name);
  // Extension must match the declared MIME type (reject mismatched content).
  if (ext && !allowedExts.includes(ext)) {
    return { ok: false, error: "File extension does not match its content type." };
  }
  return { ok: true, error: null };
}

export function validateImageFile(file) {
  return validate(file, IMAGE_TYPES, MAX_IMAGE_BYTES, "image");
}

export function validateAudioFile(file) {
  return validate(file, AUDIO_TYPES, MAX_AUDIO_BYTES, "audio");
}