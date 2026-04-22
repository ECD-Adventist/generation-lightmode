import LiveChallengesPage from "@/components/challenges/LiveChallengesPage";
import MobileChallenges from "@/components/challenges/MobileChallenges";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Challenges() {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileChallenges />;
  return <LiveChallengesPage />;
}