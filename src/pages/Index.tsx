import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { Sparkles, Gauge, ShieldCheck, Bot } from 'lucide-react';
import styles from './Index.module.scss';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';

const Index = () => {
  const navigate = useNavigate();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pageUrl = `${origin}/`;
  const ogImage = 'https://images.unsplash.com/photo-1529101091764-c3526daf38fe?q=80&w=1600&auto=format&fit=crop';

  const breadcrumbJson = getBreadcrumbJsonLd([
    { name: 'Home', item: pageUrl },
  ]);

  const websiteJson = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FindableAI',
    url: pageUrl,
  } as const;

  return (
    <>
      <SEO
        title="FindableAI – AI Findability Optimization Platform"
        description="Run a free AI findability scan, view your score, and get actionable fixes to boost AI visibility."
        url={pageUrl}
        ogImage={ogImage}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(websiteJson) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbJson) }}
      />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className={`relative overflow-hidden ${styles.hero}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/40 to-background" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-6 pt-28 pb-16 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                <Sparkles className="h-3.5 w-3.5" /> New: AI Findability Score 2.0
              </span>
              <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
                Optimize your brand for AI discovery
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-lg">
                Run a free scan, simulate AI prompts, and get step-by-step fixes that improve how models and agents surface your content.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <Button size="lg" onClick={() => navigate('/onboarding')}>
                  Run a free scan
                </Button>
                <Button size="lg" variant="secondary" onClick={() => navigate('/pricing')}>
                  See pricing
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1526378722484-bd91ca387e72?q=80&w=1200&auto=format&fit=crop"
                alt="AI analytics dashboard visualization for AI findability"
                className="rounded-lg border bg-card shadow-sm w-full"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl md:text-3xl font-semibold">What you get</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Gauge, title: 'Findability Score', text: 'Unified 0–100 score with clear breakdowns.' },
              { icon: Bot, title: 'AI Simulations', text: 'Test prompts and see if your brand is included.' },
              { icon: ShieldCheck, title: 'Crawlability', text: 'Robots, sitemaps, and performance checks.' },
              { icon: Sparkles, title: 'Actionable Tips', text: 'Fixes for metadata, schema, and content.' },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                <img
                  src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop"
                  alt={`${title} illustration`}
                  className="mt-4 rounded-md border"
                  loading="lazy"
                />
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <h2 className="text-2xl md:text-3xl font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              { step: '1', title: 'Add your site', desc: 'Enter your URL and we prepare a quick baseline audit.' },
              { step: '2', title: 'Run a scan', desc: 'We analyze metadata, schema, crawlability, and summarizability.' },
              { step: '3', title: 'Get fixes', desc: 'Review your score with actionable tips to improve AI visibility.' },
            ].map((s) => (
              <li key={s.step} className="rounded-lg border bg-card p-6">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {s.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
};

export default Index;
