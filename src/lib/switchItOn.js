// Shared flow helper for "Switch It On" / "Sign the Pledge" buttons.
// Handles: auth check → pledge check → route to destination (default: Feed).
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

/**
 * Runs the switch-on flow.
 * @param {Object} opts
 * @param {Function} opts.openPledgeModal - called when the user is logged in but hasn't signed the pledge.
 * @param {string} [opts.destination="Feed"] - where to navigate after checks pass.
 */
export async function handleSwitchItOn({ openPledgeModal, destination = "Feed" } = {}) {
  const isAuth = await base44.auth.isAuthenticated();
  if (!isAuth) {
    window.location.href = createPageUrl(destination);
    return;
  }
  const me = await base44.auth.me();
  if (!me?.pledge_signed) {
    if (openPledgeModal) openPledgeModal();
    return;
  }
  window.location.href = createPageUrl(destination);
}