import React, { useState } from "react";
import { Repeat2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
      await base44.functions.invoke("createGlowDrop", {
        verse: item.title || "",
        reflection: item.description || "",
        hashtags: "#AllThingsNew #FaithAlwaysOn",
        category: "Devotional",
        media_url: item.thumbnail_url || null,
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
      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full font-black text-[11.5px] font-['Space_Grotesk'] transition active:scale-95 disabled:opacity-50"
      style={{ background: "rgba(138,92,255,0.12)", border: "1px solid rgba(138,92,255,0.4)", color: "#8A5CFF" }}
      title="Repost to Generation LightMode feed">
      <Repeat2 size={13} /> {loading ? "Posting…" : "Repost"}
    </button>
  );
}