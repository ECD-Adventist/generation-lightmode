import { dualWriteSupabase } from "@/lib/dualWriteSupabase";

/**
 * Mirror a freshly created Glow Drop into Supabase.
 *
 * Security: the browser never talks to Supabase directly and never holds a Supabase key.
 * The backend function `dualWriteSupabase` re-reads the record from Base44 by id, checks
 * that the caller owns it, and writes with the server-side service key.
 */
export function mirrorGlowDropToSupabase(newDrop) {
  if (!newDrop?.id) return;
  dualWriteSupabase("glow_drops", { id: newDrop.id });
}
