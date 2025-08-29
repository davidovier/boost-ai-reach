import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppErrorBoundary } from "@/components/ErrorBoundary";
import { MainLayout } from "@/components/layout/MainLayout";
import { lazy, Suspense } from "react";

// Critical pages loaded immediately
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import ReferralRedirect from "./pages/ReferralRedirect";

// Public pages - code split
const Pricing = lazy(() => import("./pages/Pricing"));
const Changelog = lazy(() => import("./pages/Changelog"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));

// App pages - code split
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ScanDetail = lazy(() => import("./pages/ScanDetail"));
const ReportDetail = lazy(() => import("./pages/ReportDetail"));
const Account = lazy(() => import("./pages/Account"));

// Redirect components for legacy routes
import { SitesRedirect, ScansRedirect, AITestsRedirect, ReportsRedirect } from "./components/redirects/DashboardRedirect";

// Admin pages - heavily code split
const Admin = lazy(() => import("./pages/Admin"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminUsage = lazy(() => import("./pages/AdminUsage"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminDashboardConfig = lazy(() => import("./pages/AdminDashboardConfig"));
const AdminLogs = lazy(() => import("./pages/AdminLogs"));
const AlertTest = lazy(() => import("./pages/AlertTest"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <LanguageProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppErrorBoundary>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/r/:code" element={<ReferralRedirect />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/reset-password" element={
                  <Suspense fallback={<PageLoader />}>
                    <ResetPassword />
                  </Suspense>
                } />
                <Route path="/onboarding" element={
                  <Suspense fallback={<PageLoader />}>
                    <Onboarding />
                  </Suspense>
                } />
                <Route path="/pricing" element={
                  <Suspense fallback={<PageLoader />}>
                    <Pricing />
                  </Suspense>
                } />
                <Route path="/changelog" element={
                  <Suspense fallback={<PageLoader />}>
                    <Changelog />
                  </Suspense>
                } />
                <Route path="/privacy" element={
                  <Suspense fallback={<PageLoader />}>
                    <Privacy />
                  </Suspense>
                } />
                <Route path="/terms" element={
                  <Suspense fallback={<PageLoader />}>
                    <Terms />
                  </Suspense>
                } />
                <Route path="/cookies" element={
                  <Suspense fallback={<PageLoader />}>
                    <Cookies />
                  </Suspense>
                } />
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={
                    <Suspense fallback={<PageLoader />}>
                      <Dashboard />
                    </Suspense>
                  } />
                  {/* Legacy route redirects to dashboard sections */}
                  <Route path="/scans" element={<ScansRedirect />} />
                  <Route path="/scans/:id" element={
                    <Suspense fallback={<PageLoader />}>
                      <ScanDetail />
                    </Suspense>
                  } />
                  <Route path="/ai-tests" element={<AITestsRedirect />} />
                  <Route path="/prompts" element={<AITestsRedirect />} />
                  <Route path="/competitors" element={<Navigate to="/dashboard#competitors" replace />} />
                  <Route path="/reports" element={<ReportsRedirect />} />
                  <Route path="/reports/:id" element={
                    <Suspense fallback={<PageLoader />}>
                      <ReportDetail />
                    </Suspense>
                  } />
                  <Route path="/account" element={
                    <Suspense fallback={<PageLoader />}>
                      <Account />
                    </Suspense>
                  } />
                  <Route path="/sites" element={<SitesRedirect />} />
                  <Route path="/admin" element={
                    <Suspense fallback={<PageLoader />}>
                      <Admin />
                    </Suspense>
                  } />
                  <Route path="/admin/users" element={
                    <Suspense fallback={<PageLoader />}>
                      <AdminUsers />
                    </Suspense>
                  } />
                  <Route path="/admin/usage" element={
                    <Suspense fallback={<PageLoader />}>
                      <AdminUsage />
                    </Suspense>
                  } />
                  <Route path="/admin/reports" element={
                    <Suspense fallback={<PageLoader />}>
                      <AdminReports />
                    </Suspense>
                  } />
                  <Route path="/admin/dashboard-config" element={
                    <Suspense fallback={<PageLoader />}>
                      <AdminDashboardConfig />
                    </Suspense>
                  } />
                  <Route path="/admin/logs" element={
                    <Suspense fallback={<PageLoader />}>
                      <AdminLogs />
                    </Suspense>
                  } />
                  <Route path="/admin/alerts" element={
                    <Suspense fallback={<PageLoader />}>
                      <AlertTest />
                    </Suspense>
                  } />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AppErrorBoundary>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </LanguageProvider>
);

export default App;