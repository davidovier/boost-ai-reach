import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { PLAN_PRICE_IDS } from '@/types/stripe';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';
import { Check, Star } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Plan configuration - keys match translation keys
const planKeys = ['free', 'pro', 'growth', 'enterprise'] as const;
const planPriceIds = {
  free: PLAN_PRICE_IDS.free,
  pro: PLAN_PRICE_IDS.pro,
  growth: PLAN_PRICE_IDS.growth,
  enterprise: PLAN_PRICE_IDS.enterprise,
};

export default function Pricing() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pageUrl = `${origin}/pricing`;
  const ogImage = 'https://images.unsplash.com/photo-1551281044-8f785ba67e45?q=80&w=1600&auto=format&fit=crop';

  const breadcrumbJson = useMemo(() => getBreadcrumbJsonLd([
    { name: 'Home', item: `${origin}/` },
    { name: 'Pricing', item: pageUrl },
  ]), [origin, pageUrl]);

  const productsJson = useMemo(() => {
    return planKeys.map((planKey, index) => {
      const planName = t(`pricing.plans.${planKey}.name`);
      const planPrice = t(`pricing.plans.${planKey}.price`);
      const planFeatures = t(`pricing.plans.${planKey}.features`) as unknown as string[];
      
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${pageUrl}#${planKey}-plan`,
        name: `FindableAI ${planName} Plan`,
        description: `${planName} plan includes: ${planFeatures.join(', ')}`,
        url: pageUrl,
        category: 'Software as a Service',
        brand: { 
          '@type': 'Brand', 
          name: 'FindableAI',
          url: origin
        },
        offers: {
          '@type': 'Offer',
          '@id': `${pageUrl}#offer-${planKey}`,
          name: `${planName} Plan Subscription`,
          priceCurrency: 'USD',
          price: planPrice === 'Custom' ? undefined : planPrice.replace('$', ''),
          priceSpecification: planPrice === 'Custom' ? undefined : {
            '@type': 'UnitPriceSpecification',
            price: planPrice.replace('$', ''),
            priceCurrency: 'USD',
            unitText: 'MONTH'
          },
          availability: 'https://schema.org/InStock',
          url: pageUrl,
          seller: {
            '@type': 'Organization',
            name: 'FindableAI',
            url: origin
          },
          validFrom: new Date().toISOString(),
          itemCondition: 'https://schema.org/NewCondition'
        },
        aggregateRating: index === 1 ? { // Pro plan is most popular
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '150',
          bestRating: '5',
          worstRating: '1'
        } : undefined
      };
    });
  }, [pageUrl, origin, t]);

  const handleCheckout = async (priceId: string | null | undefined) => {
    if (!priceId) {
      toast({ title: 'Pricing not configured', description: 'Stripe price IDs are not set. Please try again later or contact support.' });
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, successUrl: `${origin}/subscription-success`, cancelUrl: pageUrl },
      });
      if (error) throw error;
      const url = (data as any)?.url;
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (e: any) {
      toast({ title: 'Checkout error', description: e.message ?? 'Could not start checkout', variant: 'destructive' });
    }
  };

  return (
    <>
      <SEO
        title={t('pricing.seo.title')}
        description={t('pricing.seo.description')}
        url="/pricing"
        ogImage="/og-pricing.png"
        keywords={t('pricing.seo.keywords')}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbJson) }} />
      {productsJson.map((p, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(p) }} />
      ))}

      <main className="min-h-screen bg-background">
        <div className="absolute top-4 right-4 z-10">
          <LanguageToggle />
        </div>
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{t('pricing.heading')}</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            {t('pricing.description')}
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {planKeys.map((planKey) => {
              const planName = t(`pricing.plans.${planKey}.name`);
              const planPrice = t(`pricing.plans.${planKey}.price`);
              const planPeriod = t(`pricing.plans.${planKey}.period`);
              const planCta = t(`pricing.plans.${planKey}.cta`);
              const planFeatures = t(`pricing.plans.${planKey}.features`) as unknown as string[];
              const planPopular = planKey === 'pro' ? t(`pricing.plans.${planKey}.popular`) : '';
              
              return (
                <article key={planKey} className="plan-card rounded-xl border bg-card p-6 text-card-foreground shadow-sm relative">
                  {planKey === 'pro' && (
                    <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground shadow">
                      <Star className="h-3.5 w-3.5" /> {planPopular}
                    </span>
                  )}
                  <h2 className="text-xl font-semibold">{planName}</h2>
                  <p className="mt-2 text-3xl font-bold">{planPrice}
                    <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">{planPeriod}</span>
                  </p>
                  <ul className="mt-6 space-y-2 text-sm">
                    {planFeatures.map((feature: string) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    {planKey === 'free' ? (
                      <Button size="lg" className="w-full btn-cta" onClick={() => navigate('/onboarding')}>
                        {planCta}
                      </Button>
                    ) : planKey === 'enterprise' ? (
                      <Button size="lg" variant="secondary" className="w-full" onClick={() => navigate('/account')}>
                        {planCta}
                      </Button>
                    ) : (
                      <Button size="lg" className="w-full btn-cta" onClick={() => handleCheckout(planPriceIds[planKey])}>
                        {planCta}
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
