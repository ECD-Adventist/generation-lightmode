import React, { useState } from "react";
import { Repeat2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchContentFile } from "./contentMedia";

const ALLOWED_MEDIA_HOSTS = ["media.base44.com", "base44.app", "images.unsplash.com", "res.cloudinary.com"];

const isAllowedMediaUrl = (url) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ALLOWED_MEDIA_HOSTS.some(host => parsed.hostname === host || parsed.hostname.endsWith("." + host));
  } catch {
    return false;
  }
};

export default function ContentRepostButton({ item }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleRepost = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin(window.location.pathname);
      return;
    }
    setLoading(true);
    try {
      let safeMediaUrl = isAllowedMediaUrl(item.thumbnail_url) ? item.thumbnail_url : null;
      if (!safeMediaUrl) {
        try {
          const sourceFile = await fetchContentFile(item, "view", { record: false });
          const uploaded = await base44.integrations.Core.UploadFile({ file: sourceFile });
          safeMediaUrl = uploaded.file_url;
        } catch (mediaErr) {
          console.warn("[repost] Could not fetch media, posting without image:", mediaErr);
          safeMediaUrl = null;
        }
      }

      await base44.functions.invoke("createGlowDrop", {
        verse: item.title || "",
        reflection: item.description || "",
        hashtags: "#AllThingsNew #FaithAlwaysOn",
        category: "Devotional",
        media_url: safeMediaUrl,
      });
      await base44.functions.invoke("trackContentEngagement", {
        content_id: item.id,
        action: "share",
        platform: "Base 1_feed",
      });
      queryClient.invalidateQueries({ queryKey: ["digital-content-public"] });
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      toast.success("Reposted to your feed!");
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to repost");
    }
    setLoading(false);
  };

  return (
    <button type="button" onClick={handleRepost} disabled={loading}
      className="w-10 h-10 rounded-full flex items-center justify-center transition active:scale-95 disabled:opacity-50"
      style={{ background: "rgba(138,92,255,0.12)", border: "1px solid rgba(138,92,255,0.4)", color: "#8A5CFF" }}
      title="Repost to Generation LightMode feed">
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Repeat2 size={14} />}
    </button>
  );
}