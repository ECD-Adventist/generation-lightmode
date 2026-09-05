import React from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import LocationCompletionForm from "@/components/onboarding/LocationCompletionForm";

export default function LocationCompletionGate({ children }) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const exempt = ["/privacy", "/terms", "/communityguidelines"].includes(pathname.toLowerCase());
  const location = useQuery({
    queryKey: ["location-completion", user?.id, user?.country, user?.city],
    queryFn: async () => (await base44.functions.invoke("updateProfile", { location_options: true })).data,
    enabled: isAuthenticated && !!user && !exempt,
    staleTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  if (!isAuthenticated || !user || exempt) return children;
  if (location.isPending || location.isError) return <main className="min-h-dvh bg-background text-foreground flex flex-col items-center justify-center gap-4 p-6 text-center" aria-live="polite">
    {location.isPending ? <><Loader2 className="h-6 w-6 animate-spin" /><p>Checking your profile…</p></> : <><p>We couldn’t check your location. Please try again.</p><Button onClick={() => location.refetch()} disabled={location.isFetching}>Try again</Button><Button variant="ghost" onClick={() => base44.auth.logout("/Home")}>Sign out</Button></>}
  </main>;
  if (location.data?.complete) return children;
  const onSaved = async () => {
    await refreshUser();
    await queryClient.invalidateQueries();
  };
  return <LocationCompletionForm key={user.id} location={location.data} onSaved={onSaved} />;
}