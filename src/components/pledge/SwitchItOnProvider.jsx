import React, { createContext, useContext, useState, useCallback } from "react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import PledgeModal from "./PledgeModal";

const SwitchItOnContext = createContext(null);

export function SwitchItOnProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("Feed");

  const trigger = useCallback(async (dest = "Feed") => {
    setDestination(dest);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin(createPageUrl(dest));
      return;
    }
    try {
      const me = await base44.auth.me();
      if (!me?.pledge_signed) {
        setOpen(true);
        return;
      }
      window.location.href = createPageUrl(dest);
    } catch {
      // Token is stale/expired — clear it and redirect to login
      base44.auth.redirectToLogin(createPageUrl(dest));
    }
  }, []);

  const handleSigned = () => {
    setOpen(false);
    window.location.href = createPageUrl(destination);
  };

  return (
    <SwitchItOnContext.Provider value={{ trigger }}>
      {children}
      <PledgeModal isOpen={open} onClose={() => setOpen(false)} onSigned={handleSigned} />
    </SwitchItOnContext.Provider>
  );
}

export function useSwitchItOn() {
  const ctx = useContext(SwitchItOnContext);
  if (!ctx) {
    // Fallback: still works without provider
    return {
      trigger: async (dest = "Feed") => {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin(createPageUrl(dest));
          return;
        }
        try {
          const me = await base44.auth.me();
          if (!me?.pledge_signed) {
            window.location.href = createPageUrl("Home") + "#join";
            return;
          }
          window.location.href = createPageUrl(dest);
        } catch {
          base44.auth.redirectToLogin(createPageUrl(dest));
        }
      }
    };
  }
  return ctx;
}