const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function mirrorGlowDropToSupabase(newDrop, currentUser) {
  if (!newDrop?.id || !SUPABASE_URL || !SUPABASE_ANON_KEY) return;

  fetch(`${SUPABASE_URL}/rest/v1/glow_drops`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify([{
      id: newDrop.id,
      reflection: newDrop.reflection || "",
      verse: newDrop.verse || "",
      category: newDrop.category || "",
      description: newDrop.description || null,
      media_url: newDrop.media_url || null,
      hashtags: newDrop.hashtags || "",
      status: newDrop.status || "approved",
      likes_count: newDrop.likes_count || 0,
      bonus_likes_count: newDrop.bonus_likes_count || 0,
      pinned: newDrop.pinned || false,
      hidden: newDrop.hidden || false,
      hidden_reason: newDrop.hidden_reason || null,
      is_flagged: newDrop.is_flagged || false,
      moderation_note: newDrop.moderation_note || null,
      created_by: currentUser?.email || newDrop.created_by || newDrop.user_email || "",
      created_date: newDrop.created_date || new Date().toISOString(),
      updated_date: newDrop.updated_date || newDrop.created_date || new Date().toISOString()
    }])
  }).catch(err => console.warn("Supabase dual-write failed silently:", err));
}