import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { SwitchItOnProvider } from '@/components/pledge/SwitchItOnProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

// Code-split route pages — loaded on demand to reduce initial bundle.
const LightReflections = lazy(() => import('./pages/LightReflections'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Discover = lazy(() => import('./pages/Discover'));
const DailyDevotion = lazy(() => import('./pages/DailyDevotion'));
const DailyTruthFeed = lazy(() => import('./pages/DailyTruthFeed'));
const InstitutionPageView = lazy(() => import('./pages/InstitutionPage'));
const About = lazy(() => import('./pages/About'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Settings = lazy(() => import('./pages/Settings'));
const TerritoryPhotos = lazy(() => import('./pages/TerritoryPhotos'));
const ClaimInstitutionDashboard = lazy(() => import('./pages/ClaimInstitutionDashboard'));
const ComplianceReporting = lazy(() => import('./pages/ComplianceReporting'));
const InstitutionDashboard = lazy(() => import('./pages/InstitutionDashboard'));
const InstitutionControlCenter = lazy(() => import('./pages/InstitutionControlCenter'));
const GlowFeed = lazy(() => import('./pages/GlowFeed'));
const GenerationLightMode = lazy(() => import('./pages/GenerationLightMode'));
const GroupChat = lazy(() => import('./pages/GroupChat'));

const RouteFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-foreground/60" />
  </div>
);

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/LightReflections" element={<LayoutWrapper currentPageName="LightReflections"><LightReflections /></LayoutWrapper>} />
      <Route path="/Leaderboard" element={<LayoutWrapper currentPageName="Leaderboard"><Leaderboard /></LayoutWrapper>} />
      <Route path="/Discover" element={<LayoutWrapper currentPageName="Discover"><Discover /></LayoutWrapper>} />
      <Route path="/DailyDevotion" element={<LayoutWrapper currentPageName="DailyDevotion"><DailyDevotion /></LayoutWrapper>} />
      <Route path="/DailyTruthFeed" element={<LayoutWrapper currentPageName="DailyTruthFeed"><DailyTruthFeed /></LayoutWrapper>} />
      <Route path="/InstitutionPage" element={<LayoutWrapper currentPageName="InstitutionPage"><InstitutionPageView /></LayoutWrapper>} />
      <Route path="/About" element={<LayoutWrapper currentPageName="About"><About /></LayoutWrapper>} />
      <Route path="/Privacy" element={<LayoutWrapper currentPageName="Privacy"><Privacy /></LayoutWrapper>} />
      <Route path="/Settings" element={<LayoutWrapper currentPageName="Settings"><Settings /></LayoutWrapper>} />
      <Route path="/TerritoryPhotos" element={<LayoutWrapper currentPageName="TerritoryPhotos"><TerritoryPhotos /></LayoutWrapper>} />
      <Route path="/ClaimInstitutionDashboard" element={<LayoutWrapper currentPageName="ClaimInstitutionDashboard"><ClaimInstitutionDashboard /></LayoutWrapper>} />
      <Route path="/ComplianceReporting" element={<LayoutWrapper currentPageName="ComplianceReporting"><ComplianceReporting /></LayoutWrapper>} />
      <Route path="/InstitutionDashboard" element={<LayoutWrapper currentPageName="InstitutionDashboard"><InstitutionDashboard /></LayoutWrapper>} />
      <Route path="/InstitutionControlCenter" element={<LayoutWrapper currentPageName="InstitutionControlCenter"><InstitutionControlCenter /></LayoutWrapper>} />
      <Route path="/GlowFeed" element={<LayoutWrapper currentPageName="GlowFeed"><GlowFeed /></LayoutWrapper>} />
      <Route path="/GenerationLightMode" element={<LayoutWrapper currentPageName="GenerationLightMode"><GenerationLightMode /></LayoutWrapper>} />
      <Route path="/GroupChat" element={<LayoutWrapper currentPageName="GroupChat"><GroupChat /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <SwitchItOnProvider>
              <AuthenticatedApp />
            </SwitchItOnProvider>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App