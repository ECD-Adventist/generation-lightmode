import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import MusicPickerModal from "@/components/feed/MusicPickerModal";

/**
 * Lets a post owner attach, change, or remove music on an already published drop.
 * Renders only the music picker — the trigger lives in the post's actions menu.
 */
export default function PostMusicEditor({ drop, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (track) => {
      await base44.entities.GlowDrop.update(drop.id, {
        audio_url: track?.audio_url || "",
        audio_title: track?.audio_title || "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      queryClient.invalidateQueries({ queryKey: ["glowFeed"] });
      queryClient.invalidateQueries({ queryKey: ["myGlowDropsProfile"] });
      toast.success("Music updated on your post");
    },
    onError: () => toast.error("Could not update the music. Try again."),
    onSettled: () => setSaving(false),
  });

  return (
    <MusicPickerModal
      isOpen={isOpen && !saving}
      onClose={onClose}
      onSelect={(track) => { setSaving(true); saveMutation.mutate(track); onClose(); }}
    />
  );
}