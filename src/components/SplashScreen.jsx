// Branded loading screen shown while auth/app-settings resolve on cold start.
// Mirrors the static markup in index.html so there's no visual swap when React mounts.
export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B0F1A]">
      <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-cyan-400 animate-spin" aria-label="Loading" />
    </div>
  );
}