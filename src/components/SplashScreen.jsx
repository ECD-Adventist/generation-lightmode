// Branded loading screen shown while auth/app-settings resolve on cold start.
// Mirrors the static markup in index.html so there's no visual swap when React mounts.
export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B0F1A]">
      <img
        src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
        alt="Generation LightMode"
        className="w-auto max-w-[280px] h-auto"
      />
    </div>
  );
}