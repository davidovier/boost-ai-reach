import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface DashboardRedirectProps {
  section: 'websites' | 'scans' | 'ai-tests' | 'reports';
}

export function DashboardRedirect({ section }: DashboardRedirectProps) {
  const location = useLocation();
  
  // Preserve any existing hash or search params
  const redirectTo = `/dashboard#${section}${location.search}`;
  
  return <Navigate to={redirectTo} replace />;
}

// Individual redirect components for each section
export function SitesRedirect() {
  return <DashboardRedirect section="websites" />;
}

export function ScansRedirect() {
  return <DashboardRedirect section="scans" />;
}

export function AITestsRedirect() {
  return <DashboardRedirect section="ai-tests" />;
}

export function ReportsRedirect() {
  return <DashboardRedirect section="reports" />;
}