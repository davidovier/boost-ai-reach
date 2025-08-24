import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { Sparkles, Gauge, ShieldCheck, Bot } from 'lucide-react';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useTranslation } from '@/hooks/useTranslation';
import styles from './Index.module.scss';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
        title={t('home.seo.title')}
        description={t('home.seo.description')}
        url="/"
        ogImage="/og-home.png"
        keywords={t('home.seo.keywords')}
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

      <main 
        className="min-h-screen bg-background" 
        role="main"
        aria-label="Home page content"
      >
        {/* Hero */}
        <section 
          className={`hero-bg relative overflow-hidden ${styles.hero}`}
          aria-labelledby="hero-heading"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95" aria-hidden="true" />
          <div className="absolute top-4 right-4 z-10">
            <LanguageToggle />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-20 sm:pt-24 md:pt-32 pb-16 sm:pb-20 grid md:grid-cols-2 gap-8 md:gap-12 items-center min-h-[600px]">
            <div className="text-center md:text-left">
              <div 
                className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm text-foreground shadow-lg"
                role="banner"
                aria-label="Product announcement"
              >
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> 
                {t('home.hero.announcement')}
              </div>
              <h1 
                id="hero-heading"
                className="mt-6 sm:mt-8 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight"
              >
                {t('home.hero.heading')}{' '}
                <span className="hero-gradient-text bg-gradient-primary bg-clip-text text-transparent">
                  {t('home.hero.headingHighlight')}
                </span>
              </h1>
              <p className="mx-auto md:mx-0 mt-6 max-w-2xl text-muted-foreground text-lg sm:text-xl leading-relaxed">
                {t('home.hero.description')}
              </p>
              <div 
                className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
                role="group"
                aria-label="Primary actions"
              >
                <Button 
                  size="lg" 
                  onClick={() => navigate('/onboarding')}
                  className="w-full sm:w-auto min-h-[52px] px-8 text-lg font-semibold btn-focus shadow-xl bg-gradient-primary hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  aria-describedby="scan-description"
                >
                  {t('home.hero.ctaPrimary')}
                </Button>
                <span id="scan-description" className="sr-only">
                  Start analyzing your website's AI findability with our free scanning tool
                </span>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate('/signin')}
                  className="w-full sm:w-auto min-h-[52px] px-8 text-lg font-medium btn-focus border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 backdrop-blur-sm"
                  aria-label="Sign in to your existing account"
                >
                  {t('home.hero.ctaSecondary')}
                </Button>
              </div>
              
              {/* Trust Bar */}
              <div className="mt-12 sm:mt-16">
                <p className="text-center md:text-left text-sm text-muted-foreground mb-6">
                  {t('home.hero.trustBar')}
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
        <section 
          className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-14"
          aria-labelledby="features-heading"
        >
          <h2 
            id="features-heading"
            className="text-2xl sm:text-3xl font-semibold text-center md:text-left"
          >
            {t('home.features.heading')}
          </h2>
          <div className="mt-8 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Gauge, titleKey: 'home.features.items.score.title', textKey: 'home.features.items.score.description' },
              { icon: Bot, titleKey: 'home.features.items.simulations.title', textKey: 'home.features.items.simulations.description' },
              { icon: ShieldCheck, titleKey: 'home.features.items.crawlability.title', textKey: 'home.features.items.crawlability.description' },
              { icon: Sparkles, titleKey: 'home.features.items.tips.title', textKey: 'home.features.items.tips.description' },
            ].map(({ icon: Icon, titleKey, textKey }, index) => (
              <article 
                key={titleKey} 
                className="card-feature animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                aria-describedby={`feature-${index}-desc`}
              >
                <div className="feature-icon" aria-hidden="true">
                  <Icon className="h-6 w-6" />
                </div>
                <h3>{t(titleKey)}</h3>
                <p id={`feature-${index}-desc`}>{t(textKey)}</p>
                <img
                  src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop&fm=webp"
                  alt={`${t(titleKey)} feature visualization - demonstrating how FindableAI improves ${t(titleKey).toLowerCase()} for better AI discoverability`}
                  className="mt-6 rounded-lg border w-full h-32 sm:h-40 object-cover shadow-md"
                  loading="lazy"
                  decoding="async"
                />
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section 
          className="mx-auto max-w-6xl px-4 sm:px-6 pb-12 sm:pb-16"
          aria-labelledby="how-it-works-heading"
        >
          <h2 
            id="how-it-works-heading"
            className="text-2xl sm:text-3xl font-semibold text-center md:text-left"
          >
            {t('home.howItWorks.heading')}
          </h2>
          <ol 
            className="mt-8 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
            aria-label="Three-step process for improving AI findability"
          >
            {[
              { step: '1', titleKey: 'home.howItWorks.steps.add.title', descKey: 'home.howItWorks.steps.add.description' },
              { step: '2', titleKey: 'home.howItWorks.steps.scan.title', descKey: 'home.howItWorks.steps.scan.description' },
              { step: '3', titleKey: 'home.howItWorks.steps.fixes.title', descKey: 'home.howItWorks.steps.fixes.description' },
            ].map((s, index) => (
              <li 
                key={s.step} 
                className="card-enhanced p-6 hover-scale animate-fade-in"
                style={{ animationDelay: `${(index + 4) * 0.1}s` }}
                aria-describedby={`step-${index}-desc`}
              >
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground text-lg font-bold mb-4 shadow-glow"
                  aria-label={`Step ${s.step}`}
                >
                  {s.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(s.titleKey)}</h3>
                <p 
                  id={`step-${index}-desc`}
                  className="text-muted-foreground leading-relaxed"
                >
                  {t(s.descKey)}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
};

export default Index;
