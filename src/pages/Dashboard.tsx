import { SEO } from '@/components/SEO';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';
import { AllInOneDashboard } from '@/components/dashboard/AllInOneDashboard';

export default function Dashboard() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const breadcrumbs = getBreadcrumbJsonLd([
    { name: 'Home', item: origin },
    { name: 'Dashboard', item: `${origin}/dashboard` },
  ]);

  return (
    <>
      <SEO 
        title="Dashboard"
        description="Your AI findability command center. Manage websites, run scans, test AI responses, and track your optimization progress all in one place."
        url="/dashboard"
        keywords="dashboard, AI findability, website optimization, SEO management"
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbs) }} 
      />

      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Your AI findability command center
          </p>
        </header>

        <AllInOneDashboard />
      </div>
    </>
  );
}