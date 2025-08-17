import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
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
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Pricing from "./pages/Pricing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/pricing" element={<Pricing />} />
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
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
