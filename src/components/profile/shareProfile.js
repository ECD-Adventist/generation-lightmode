import { profileUrl } from "@/lib/profileLink";
import { getDisplayName } from "@/lib/displayName";
import { toast } from "sonner";
export default async function shareProfile(user, rank) {
  const path = profileUrl(user);
  if (!path) return;
  const url = `${window.location.origin}${path}`;
  const name = getDisplayName(user);
  if (navigator.share) {
    try {
      await navigator.share({ title: `${name} | LightMode`, text: `${name} • ${rank.name} • ${user.glow_score || 0} Glow Points`, url });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Profile link copied");
  } catch {
    toast.error("Sharing is unavailable here. Please copy the link from your browser.");
  }
}