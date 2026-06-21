import { useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * Gate any interaction behind authentication.
 *
 * Usage:
 *   const requireAuth = useRequireAuth(user);
 *   <button onClick={() => requireAuth(() => doThing())} />
 *
 * If `user` is truthy, runs the action and returns true.
 * If `user` is falsy, shows a gentle inline "Sign in to join the movement"
 * nudge (with a Sign In action) and returns false — the wrapped action is
 * NOT run and the guest is NOT auto-redirected. They stay on the page.
 */
export default function useRequireAuth(user) {
  return useCallback(
    (action) => {
      if (user) {
        if (typeof action === "function") action();
        return true;
      }
      toast("Sign in to join the movement →", {
        description: "Create your free account to post, like & connect.",
        action: {
          label: "Sign In",
          onClick: () => base44.auth.redirectToLogin(window.location.pathname),
        },
        duration: 5000,
      });
      return false;
    },
    [user]
  );
}