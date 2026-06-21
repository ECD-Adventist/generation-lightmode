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
 * If `user` is falsy, shows the join message and redirects to the login page,
 * returning false (the wrapped action is NOT run). If authenticated, the action
 * runs and true is returned.
 */
export default function useRequireAuth(user) {
  return useCallback(
    (action) => {
      if (user) {
        if (typeof action === "function") action();
        return true;
      }
      toast("Join Generation LightMode to interact", {
        description: "Sign in or create your account",
        action: {
          label: "Sign In",
          onClick: () => base44.auth.redirectToLogin(window.location.pathname),
        },
        duration: 6000,
      });
      // Give the toast a beat to register before redirecting.
      setTimeout(() => base44.auth.redirectToLogin(window.location.pathname), 1200);
      return false;
    },
    [user]
  );
}