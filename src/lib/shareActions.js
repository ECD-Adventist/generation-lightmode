export function logShareError(stage, error, context = {}) {
  if (import.meta.env.DEV) {
    console.error("[share_error]", { stage, name: error?.name, message: error?.message, error, ...context });
  }
}

export async function tryNativeShare({ title, text, url }, context = {}) {
  if (typeof navigator.share !== "function") return { status: "unavailable" };
  try {
    await navigator.share({ title: title || "Generation LightMode", text: (text || "").replace(url, "").trim(), url });
    return { status: "shared" };
  } catch (error) {
    if (error?.name === "AbortError") return { status: "cancelled", error };
    logShareError("native_share", error, context);
    return { status: "failed", error };
  }
}

export async function copyShareLink(url) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
    else throw new Error("Clipboard API unavailable");
  } catch (error) {
    const input = document.createElement("textarea");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    if (!copied) throw error;
  }
}

export function openShareWindow(url, context = {}) {
  const popup = window.open(url, "_blank");
  if (popup) popup.opener = null;
  else logShareError("popup_blocked", new Error("Share popup was blocked"), context);
  return Boolean(popup);
}

export const whatsappShareUrl = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;