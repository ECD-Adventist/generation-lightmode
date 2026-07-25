import { Suspense, lazy, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AgeRestrictionGate from '@/components/AgeRestrictionGate';
import { SwitchItOnProvider } from '@/components/pledge/SwitchItOnProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import PageTransition from '@/components/transitions/PageTransition';
import AutoTranslator from '@/components/i18n/AutoTranslator';
import NotificationOnboardingModal from '@/components/notifications/NotificationOnboardingModal';
import ReportProblemButton from '@/components/ReportProblemButton';
import SessionSecurity from '@/components/security/SessionSecurity';

// Code-split route pages — loaded on demand to reduce initial bundle.
const LightReflections = lazy(() => import('./pages/LightReflections'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Discover = lazy(() => import('./pages/Discover'));
const DailyDevotion = lazy(() => import('./pages/DailyDevotion'));
const DailyTruthFeed = lazy(() => import('./pages/DailyTruthFeed'));
const InstitutionPageView = lazy(() => import('./pages/InstitutionPage'));
const About = lazy(() => import('./pages/About'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const CommunityGuidelines = lazy(() => import('./pages/CommunityGuidelines'));
const Settings = lazy(() => import('./pages/Settings'));
const TerritoryPhotos = lazy(() => import('./pages/TerritoryPhotos'));
const ClaimInstitutionDashboard = lazy(() => import('./pages/ClaimInstitutionDashboard'));
const ComplianceReporting = lazy(() => import('./pages/ComplianceReporting'));
const InstitutionDashboard = lazy(() => import('./pages/InstitutionDashboard'));
const InstitutionControlCenter = lazy(() => import('./pages/InstitutionControlCenter'));
const GlowFeed = lazy(() => import('./pages/GlowFeed'));
const GenerationLightMode = lazy(() => import('./pages/GenerationLightMode'));
const GroupChat = lazy(() => import('./pages/GroupChat'));
const LeaderAnalytics = lazy(() => import('./pages/LeaderAnalytics'));
const AdminSupabaseMigration = lazy(() => import('./pages/AdminSupabaseMigration'));

const RouteFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-foreground/60" />
  </div>
);

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}><PageTransition>{children}</PageTransition></Layout>
  : <PageTransition>{children}</PageTransition>;

const RootRedirect = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();
  
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/Feed" replace /> : <Navigate to="/Home" replace />;
};

const protectedPageNames = new Set(["Dashboard", "Messages", "Profile", "Notifications", "Settings"]);

const RequireAuth = ({ children }) => {
  const { isLoadingAuth, isAuthenticated, navigateToLogin } = useAuth();

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) navigateToLogin();
  }, [isLoadingAuth, isAuthenticated, navigateToLogin]);

  if (isLoadingAuth) return <RouteFallback />;
  if (!isAuthenticated) return null;

  return children;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, user, isAuthenticated } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Only block for users whose account is not registered. Missing auth is handled per-route,
  // so public pages like Home, Feed, About, Impact, and Resources can render for guests.
  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Render the main app
  return (
    <AgeRestrictionGate user={isAuthenticated ? user : null}>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
      <Route path="/" element={<RootRedirect />} />
      {Object.entries(Pages).map(([path, Page]) => {
        const pageElement = (
          <LayoutWrapper currentPageName={path}>
            <Page />
          </LayoutWrapper>
        );
        return (
          <Route
            key={path}
            path={`/${path}`}
            element={protectedPageNames.has(path) ? <RequireAuth>{pageElement}</RequireAuth> : pageElement}
          />
        );
      })}
      <Route path="/LightReflections" element={<LayoutWrapper currentPageName="LightReflections"><LightReflections /></LayoutWrapper>} />
      <Route path="/Leaderboard" element={<LayoutWrapper currentPageName="Leaderboard"><Leaderboard /></LayoutWrapper>} />
      <Route path="/Discover" element={<LayoutWrapper currentPageName="Discover"><Discover /></LayoutWrapper>} />
      <Route path="/DailyDevotion" element={<LayoutWrapper currentPageName="DailyDevotion"><DailyDevotion /></LayoutWrapper>} />
      <Route path="/DailyTruthFeed" element={<LayoutWrapper currentPageName="DailyTruthFeed"><DailyTruthFeed /></LayoutWrapper>} />
      <Route path="/InstitutionPage" element={<LayoutWrapper currentPageName="InstitutionPage"><InstitutionPageView /></LayoutWrapper>} />
      <Route path="/About" element={<LayoutWrapper currentPageName="About"><About /></LayoutWrapper>} />
      <Route path="/Privacy" element={<LayoutWrapper currentPageName="Privacy"><Privacy /></LayoutWrapper>} />
      <Route path="/Terms" element={<LayoutWrapper currentPageName="Terms"><Terms /></LayoutWrapper>} />
      <Route path="/CommunityGuidelines" element={<LayoutWrapper currentPageName="CommunityGuidelines"><CommunityGuidelines /></LayoutWrapper>} />
      <Route path="/Settings" element={<LayoutWrapper currentPageName="Settings"><Settings /></LayoutWrapper>} />
      <Route path="/TerritoryPhotos" element={<LayoutWrapper currentPageName="TerritoryPhotos"><TerritoryPhotos /></LayoutWrapper>} />
      <Route path="/ClaimInstitutionDashboard" element={<LayoutWrapper currentPageName="ClaimInstitutionDashboard"><ClaimInstitutionDashboard /></LayoutWrapper>} />
      <Route path="/ComplianceReporting" element={<LayoutWrapper currentPageName="ComplianceReporting"><ComplianceReporting /></LayoutWrapper>} />
      <Route path="/InstitutionDashboard" element={<LayoutWrapper currentPageName="InstitutionDashboard"><InstitutionDashboard /></LayoutWrapper>} />
      <Route path="/InstitutionControlCenter" element={<LayoutWrapper currentPageName="InstitutionControlCenter"><InstitutionControlCenter /></LayoutWrapper>} />
      <Route path="/GlowFeed" element={<LayoutWrapper currentPageName="GlowFeed"><GlowFeed /></LayoutWrapper>} />
      <Route path="/GenerationLightMode" element={<LayoutWrapper currentPageName="GenerationLightMode"><GenerationLightMode /></LayoutWrapper>} />
      <Route path="/GroupChat" element={<LayoutWrapper currentPageName="GroupChat"><GroupChat /></LayoutWrapper>} />
      <Route path="/LeaderAnalytics" element={<LayoutWrapper currentPageName="LeaderAnalytics"><LeaderAnalytics /></LayoutWrapper>} />
      <Route path="/AdminSupabaseMigration" element={<LayoutWrapper currentPageName="AdminSupabaseMigration"><AdminSupabaseMigration /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
      </Suspense>
    </AgeRestrictionGate>
  );
};


function App() {

  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <SwitchItOnProvider>
              <AutoTranslator />
              <NotificationOnboardingModal />
              <SessionSecurity />
              <AuthenticatedApp />
              <ReportProblemButton />
            </SwitchItOnProvider>
          </Router>
          <Toaster />
          <SonnerToaster position="top-center" />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App