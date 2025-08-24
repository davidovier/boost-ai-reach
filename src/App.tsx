import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AppErrorBoundary } from "@/components/ErrorBoundary";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Scans from "./pages/Scans";
import ScanDetail from "./pages/ScanDetail";
import AITests from "./pages/AITests";
import Competitors from "./pages/Competitors";
import Reports from "./pages/Reports";
import ReportDetail from "./pages/ReportDetail";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import AdminUsage from "./pages/AdminUsage";
import AdminReports from "./pages/AdminReports";
import AdminDashboardConfig from "./pages/AdminDashboardConfig";
import AdminLogs from "./pages/AdminLogs";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Pricing from "./pages/Pricing";
import Changelog from "./pages/Changelog";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import AlertTest from "./pages/AlertTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppErrorBoundary>
          <Toaster />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/scans" element={<Scans />} />
              <Route path="/scans/:id" element={<ScanDetail />} />
        <Route path="/ai-tests" element={<AITests />} />
        <Route path="/prompts" element={<AITests />} />
              <Route path="/competitors" element={<Competitors />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/:id" element={<ReportDetail />} />
              <Route path="/account" element={<Account />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/usage" element={<AdminUsage />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/dashboard-config" element={<AdminDashboardConfig />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              <Route path="/admin/alerts" element={<AlertTest />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AppErrorBoundary>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
