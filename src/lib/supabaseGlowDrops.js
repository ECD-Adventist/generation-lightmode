const SUPABASE_URL = "https://asnsthgubpeptoiexajf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbnN0aGd1YnBlcHRvaWV4YWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MzM5NDgsImV4cCI6MjA2MzQwOTk0OH0.r3WDFbJQgPuVnakMUJQa_cEWBUBbnT3hbDbT5GiZoNA";

export function mirrorGlowDropToSupabase(newDrop, currentUser) {
  if (!newDrop?.id) return;

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