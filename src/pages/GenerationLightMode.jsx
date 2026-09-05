import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { fetchConnections, manageFollow } from "@/lib/follows";
import { createPageUrl } from "@/utils";
import { Globe } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileGenerationLightMode from "@/components/profile/MobileGenerationLightMode";
import GenerationLightModeDesktop from "@/components/profile/GenerationLightModeDesktop";

const ACCOUNT_EMAIL = "system@lightmode.com";
const ACCOUNT_ID = "official-generation-lightmode";
const ACCOUNT_NAME = "Generation LightMode";
const ACCOUNT_IMAGE = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/741681e20_ALLICONS.jpg";

export default function GenerationLightMode() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const { data: me } = useQuery({ queryKey: ["glmMe"], queryFn: () => base44.auth.me() });
  // Follower count + "am I following" from the backend (cached counters, first page only).
  // Replaces two client queries that loaded every follower of the official account.
  const { data: connections } = useQuery({
    queryKey: ["glmConnections", me?.id],
    queryFn: () => fetchConnections(ACCOUNT_ID, { include_viewer: !!me?.id }),
  });
  const followersCount = connections?.followers_count ?? 0;
  const { data: posts = [] } = useQuery({
    queryKey: ["glmPosts"],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: ACCOUNT_EMAIL }, "-created_date", 200)
  });

  const isFollowing = connections?.is_following === true;

  const followMutation = useMutation({
    mutationFn: async () => manageFollow(ACCOUNT_ID, "toggle"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glmConnections"] });
    }
  });

  const codeOfTruthCount = posts.filter(p => p.category === "Code of Truth").length;
  const keepIt100Count = posts.filter(p => p.category === "Keep It 100").length;
  const dailyVerseCount = posts.filter(p => p.category === "Daily Verse").length;

  if (isMobile) return <MobileGenerationLightMode />;

  const getCategoryStyle = (cat) => {
    if (cat === "Code of Truth") return { bg: "rgba(0,207,255,0.08)", border: "#B8E5FF", color: "#0B3FD9", icon: "🔐" };
    if (cat === "Keep It 100") return { bg: "rgba(255,208,0,0.08)", border: "#FFE4A0", color: "#CC7A00", icon: "💯" };
    if (cat === "Daily Verse") return { bg: "rgba(138,92,255,0.08)", border: "rgba(138,92,255,0.25)", color: "#8A5CFF", icon: "📖" };
    return { bg: "#F6F8FC", border: "#E6ECF5", color: "#4A5878", icon: "✨" };
  };

  return (
    <GenerationLightModeDesktop
      me={me}
      followersCount={followersCount}
      posts={posts}
      isFollowing={isFollowing}
      followMutation={followMutation}
      codeOfTruthCount={codeOfTruthCount}
      keepIt100Count={keepIt100Count}
      dailyVerseCount={dailyVerseCount}
      getCategoryStyle={getCategoryStyle}
      accountName={ACCOUNT_NAME}
      accountEmail={ACCOUNT_EMAIL}
      accountImage={ACCOUNT_IMAGE}
    />
  );
}