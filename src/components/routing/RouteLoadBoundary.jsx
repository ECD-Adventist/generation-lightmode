import React from "react";

export default class RouteLoadBoundary extends React.Component {
  state = { error: null };
  retryTimer = null;

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidMount() {
    const retryKey = `route-module-retry:${window.location.pathname}`;
    this.retryTimer = window.setTimeout(() => sessionStorage.removeItem(retryKey), 10000);
  }

  componentDidCatch(error) {
    const isModuleFetchError = /Failed to fetch dynamically imported module|Importing a module script failed|Load failed/i.test(error?.message || "");
    if (!isModuleFetchError) return;

    const retryKey = `route-module-retry:${window.location.pathname}`;
    if (!sessionStorage.getItem(retryKey)) {
      sessionStorage.setItem(retryKey, "1");
      window.location.reload();
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) window.clearTimeout(this.retryTimer);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-background text-foreground">
        <div className="max-w-sm text-center">
          <img
            src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png"
            alt="Generation LightMode"
            width="220"
            height="64"
            className="mx-auto h-14 w-auto object-contain"
          />
          <h1 className="mt-6 text-xl font-bold">This page didn’t finish loading</h1>
          <p className="mt-2 text-sm text-muted-foreground">Check your connection, then try again.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 min-h-11 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Try Again
          </button>
        </div>
      </div>
    );
  }
}