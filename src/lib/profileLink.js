import { createPageUrl } from "@/utils";

/**
 * Build a profile URL that always resolves.
 * Prefers the record id (stable, always present on public profiles) and falls
 * back to email. Returns null when neither exists, so callers can avoid
 * rendering a broken "?user=undefined" link.
 */
export function profileUrl(person) {
  if (!person) return null;
  const base = createPageUrl("Profile");
  if (person.is_managed_leader || person.leader_id || person.leader_name) {
    const leaderId = String(person.leader_id || person.id || '').replace(/^leader_/, '');
    if (leaderId) return `${base}?leader=${encodeURIComponent(leaderId)}`;
  }
  if (person.id) return `${base}?id=${encodeURIComponent(person.id)}`;
  if (person.email) return `${base}?user=${encodeURIComponent(person.email)}`;
  return null;
}