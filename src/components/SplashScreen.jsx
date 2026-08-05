// Branded loading screen shown while auth/app-settings resolve on cold start.
// Mirrors the static markup in index.html so there's no visual swap when React mounts.
export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#0B0F1A]">
      <img
        src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
        alt="Generation LightMode"
        className="w-auto max-w-[280px] h-auto"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <p className="font-['Space_Grotesk',sans-serif] font-bold text-lg tracking-wider" style={{ color: '#FFD000' }}>
        LightMode
      </p>
    </div>
  );
}