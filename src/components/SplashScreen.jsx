// Branded loading screen shown while auth/app-settings resolve on cold start.
// Mirrors the static markup in index.html so there's no visual swap when React mounts.
export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0F1A]">
      <div className="relative flex items-center justify-center">
        <div
          className="absolute w-40 h-40 rounded-full blur-2xl animate-pulse"
          style={{ background: "radial-gradient(circle, rgba(255,208,0,0.35), transparent 70%)" }}
        />
        <img
          src="/icons/icon-192.png"
          alt=""
          className="relative w-20 h-20 rounded-2xl shadow-[0_0_40px_rgba(255,208,0,0.25)] animate-[splashBreathe_2.4s_ease-in-out_infinite]"
        />
      </div>
      <div
        className="mt-6 text-white font-extrabold text-xl tracking-tight animate-[splashFadeIn_0.6s_ease-out_0.15s_both]"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Generation LightMode
      </div>
      <div
        className="mt-1.5 text-sm font-semibold tracking-wide animate-[splashFadeIn_0.6s_ease-out_0.35s_both]"
        style={{ color: "#FFD000" }}
      >
        Faith. Always On.
      </div>
    </div>
  );
}
