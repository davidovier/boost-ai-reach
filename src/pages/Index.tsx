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
    foundingDate: '2024',
    industry: 'Software',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@findable.ai'
    },
    sameAs: [
      'https://twitter.com/FindableAI',
      'https://linkedin.com/company/findableai'
    ]
  } as const;

  return (
    <>
      <SEO
        title="FindableAI – AI Findability Optimization Platform"
        description="Optimize your brand for AI discovery with comprehensive website scans, competitive analysis, and actionable insights. Start your free scan today."
        url="/"
        ogImage="/og-home.png"
        keywords="AI SEO, AI findability, brand optimization, website analysis, competitive analysis"
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
        <section className={`hero-bg relative overflow-hidden ${styles.hero}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-20 sm:pt-24 md:pt-32 pb-16 sm:pb-20 grid md:grid-cols-2 gap-8 md:gap-12 items-center min-h-[600px]">
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm text-foreground shadow-lg">
                <Sparkles className="h-4 w-4 text-primary" /> New: AI Findability Score 2.0
              </span>
              <h1 className="mt-6 sm:mt-8 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight">
                Optimize your brand for{' '}
                <span className="hero-gradient-text bg-gradient-primary bg-clip-text text-transparent">
                  AI discovery
                </span>
              </h1>
              <p className="mx-auto md:mx-0 mt-6 max-w-2xl text-muted-foreground text-lg sm:text-xl leading-relaxed">
                Run a free scan, simulate AI prompts, and get step-by-step fixes that improve how models and agents surface your content.
              </p>
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/onboarding')}
                  className="w-full sm:w-auto min-h-[52px] px-8 text-lg font-semibold btn-focus shadow-xl bg-gradient-primary hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  Run a free scan
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate('/signin')}
                  className="w-full sm:w-auto min-h-[52px] px-8 text-lg font-medium btn-focus border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 backdrop-blur-sm"
                >
                  Sign in
                </Button>
              </div>
              
              {/* Trust Bar */}
              <div className="mt-12 sm:mt-16">
                <p className="text-center md:text-left text-sm text-muted-foreground mb-6">
                  Trusted by teams at leading companies
                </p>
                <div className="trust-bar flex flex-wrap items-center justify-center md:justify-start gap-6 sm:gap-8">
                  <img 
                    src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=200&h=80&auto=format&fit=crop&fm=webp" 
                    alt="Trusted enterprise client - technology company logo representing partnership success" 
                    className="trust-logo"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="trust-divider" aria-hidden="true"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=200&h=80&auto=format&fit=crop&fm=webp" 
                    alt="Trusted startup client - innovative company logo showcasing growth" 
                    className="trust-logo"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="trust-divider" aria-hidden="true"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=200&h=80&auto=format&fit=crop&fm=webp" 
                    alt="Trusted agency client - marketing firm logo demonstrating expertise" 
                    className="trust-logo"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="trust-divider" aria-hidden="true"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1572021335469-31706a17aaef?q=80&w=200&h=80&auto=format&fit=crop&fm=webp" 
                    alt="Trusted corporate client - established business logo showing reliability" 
                    className="trust-logo"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="trust-divider" aria-hidden="true"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1594498653385-d5172c532c00?q=80&w=200&h=80&auto=format&fit=crop&fm=webp" 
                    alt="Trusted scale-up client - fast-growing company logo indicating momentum" 
                    className="trust-logo"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
            <div className="relative mt-12 md:mt-0">
              <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full transform scale-75"></div>
              <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop"
              alt="AI analytics dashboard visualization for AI findability optimization"
              className="relative rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm shadow-2xl w-full h-auto animate-fade-in transform hover:scale-105 transition-all duration-500"
              loading="eager"
              decoding="async"
              fetchPriority="high"
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
                  src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop&fm=webp"
                  alt={`${title} feature visualization - demonstrating how FindableAI improves ${title.toLowerCase()} for better AI discoverability`}
                  className="mt-6 rounded-lg border w-full h-32 sm:h-40 object-cover shadow-md"
                  loading="lazy"
                  decoding="async"
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
