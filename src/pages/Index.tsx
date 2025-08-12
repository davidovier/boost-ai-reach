import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { Sparkles, Gauge, ShieldCheck, Bot } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="FindableAI – AI Findability Optimization Platform"
        description="Boost AI visibility with scans, scores, and actionable tips. Run AI simulations, compare competitors, and improve your AI findability."
        canonical={window.location.origin}
      />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/40 to-background" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-6 pt-28 pb-16 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5" /> New: AI Findability Score 2.0
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              Optimize your brand for AI discovery
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-lg">
              FindableAI audits your site, simulates AI queries, and delivers actionable fixes to improve how AI agents and models surface your content.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/onboarding')}>
                Get Started
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/dashboard')}>
                View Dashboard
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Gauge, title: 'Findability Score', text: 'Unified 0–100 score with clear breakdowns.' },
              { icon: Bot, title: 'AI Simulations', text: 'Test prompts and see if your brand is included.' },
              { icon: ShieldCheck, title: 'Crawlability', text: 'Robots, sitemaps, and performance checks.' },
              { icon: Sparkles, title: 'Actionable Tips', text: 'Fixes for metadata, schema, and content.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
};

export default Index;
