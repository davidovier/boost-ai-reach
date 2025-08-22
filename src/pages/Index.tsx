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
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${pageUrl}onboarding?url={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  } as const;

  const organizationJson = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FindableAI',
    url: pageUrl,
    logo: `${origin}/placeholder.svg`,
    description: 'AI Findability Optimization Platform helping websites improve their AI discovery and visibility',
    sameAs: [
      'https://twitter.com/FindableAI',
      'https://linkedin.com/company/findableai'
    ]
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
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(organizationJson) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbJson) }}
      />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className={`relative overflow-hidden ${styles.hero}`}>
          <div className="absolute inset-0 bg-gradient-secondary opacity-80" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-20 md:pt-28 pb-12 sm:pb-16 grid md:grid-cols-2 gap-8 md:gap-10 items-center">
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
                <Sparkles className="h-3.5 w-3.5" /> New: AI Findability Score 2.0
              </span>
              <h1 className="mt-4 sm:mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                Optimize your brand for AI discovery
              </h1>
              <p className="mx-auto md:mx-0 mt-4 max-w-xl text-muted-foreground text-base sm:text-lg leading-relaxed">
                Run a free scan, simulate AI prompts, and get step-by-step fixes that improve how models and agents surface your content.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/onboarding')}
                  className="w-full sm:w-auto min-h-[44px] btn-focus"
                >
                  Run a free scan
                </Button>
                <Button 
                  size="lg" 
                  variant="secondary" 
                  onClick={() => navigate('/signin')}
                  className="w-full sm:w-auto min-h-[44px] btn-focus"
                >
                  Sign in
                </Button>
              </div>
              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate('/pricing')}
                  className="w-full sm:w-auto min-h-[44px] btn-focus"
                >
                  See pricing
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate('/signup')}
                  className="w-full sm:w-auto min-h-[44px] btn-focus"
                >
                  Sign up free
                </Button>
              </div>
            </div>
            <div className="relative mt-8 md:mt-0">
              <img
                src="https://images.unsplash.com/photo-1526378722484-bd91ca387e72?q=80&w=1200&auto=format&fit=crop"
                alt="AI analytics dashboard visualization for AI findability"
                className="rounded-lg border bg-card shadow-sm w-full h-auto animate-fade-in"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-14">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center md:text-left">What you get</h2>
          <div className="mt-8 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Gauge, title: 'Findability Score', text: 'Unified 0–100 score with clear breakdowns.' },
              { icon: Bot, title: 'AI Simulations', text: 'Test prompts and see if your brand is included.' },
              { icon: ShieldCheck, title: 'Crawlability', text: 'Robots, sitemaps, and performance checks.' },
              { icon: Sparkles, title: 'Actionable Tips', text: 'Fixes for metadata, schema, and content.' },
            ].map(({ icon: Icon, title, text }, index) => (
              <article 
                key={title} 
                className="card-feature animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="feature-icon">
                  <Icon className="h-6 w-6" />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <img
                  src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop"
                  alt={`${title} illustration`}
                  className="mt-6 rounded-lg border w-full h-32 sm:h-40 object-cover shadow-md"
                  loading="lazy"
                />
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12 sm:pb-16">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center md:text-left">How it works</h2>
          <ol className="mt-8 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {[
              { step: '1', title: 'Add your site', desc: 'Enter your URL and we prepare a quick baseline audit.' },
              { step: '2', title: 'Run a scan', desc: 'We analyze metadata, schema, crawlability, and summarizability.' },
              { step: '3', title: 'Get fixes', desc: 'Review your score with actionable tips to improve AI visibility.' },
            ].map((s, index) => (
              <li 
                key={s.step} 
                className="card-enhanced p-6 hover-scale animate-fade-in"
                style={{ animationDelay: `${(index + 4) * 0.1}s` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground text-lg font-bold mb-4 shadow-glow">
                  {s.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
};

export default Index;
