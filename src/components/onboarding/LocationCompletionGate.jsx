import React from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { REGISTRATION_COUNTRIES, validatedRegistrationCountry } from "@/../base44/shared/registrationCountries.ts";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import LocationCompletionForm from "@/components/onboarding/LocationCompletionForm";

export default function LocationCompletionGate({ children }) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const exempt = ["/privacy", "/terms", "/communityguidelines"].includes(pathname.toLowerCase());
  // The authenticated profile already comes from the backend. Do not make a
  // second request a prerequisite for access when its location is complete.
  const hasSavedLocation = Boolean(String(user?.country || "").trim() && String(user?.city || "").trim());
  const location = useQuery({
    queryKey: ["location-completion", user?.id, user?.country, user?.city],
    queryFn: async () => (await base44.functions.invoke("updateProfile", { location_options: true })).data,
    enabled: isAuthenticated && !!user && !exempt && !hasSavedLocation,
    staleTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  if (!isAuthenticated || !user || exempt || hasSavedLocation) return children;
  if (location.data?.complete) return children;
  const onSaved = async () => {
    await refreshUser();
    await queryClient.invalidateQueries({ queryKey: ["location-completion", user.id] });
  };
  // Keep country selection available immediately, even if the profile check fails.
  // These are the same country options used by backend validation.
  const formLocation = location.data || {
    country: validatedRegistrationCountry(user.country),
    city: user.city || "",
    countries: REGISTRATION_COUNTRIES,
  };
  return <LocationCompletionForm key={user.id} location={formLocation} onSaved={onSaved} />;
}