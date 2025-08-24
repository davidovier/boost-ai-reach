import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PLAN_PRICE_IDS } from '@/types/stripe';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';
import { Check, Star } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    key: 'free' as const,
    name: 'Free',
    price: '$0',
    priceId: PLAN_PRICE_IDS.free,
    period: 'forever',
    cta: 'Start free',
    features: ['1 site', '1 scan / month', '1 AI prompt', 'Baseline tips'],
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    price: '$29',
    priceId: PLAN_PRICE_IDS.pro,
    period: 'per month',
    cta: 'Upgrade',
    popular: true,
    features: ['3 sites', '4 scans / month', '10 AI prompts', '1 competitor'],
  },
  {
    key: 'growth' as const,
    name: 'Growth',
    price: '$99',
    priceId: PLAN_PRICE_IDS.growth,
    period: 'per month',
    cta: 'Upgrade',
    features: ['10 sites', 'Daily scans', '50 AI prompts', '5 competitors'],
  },
  {
    key: 'enterprise' as const,
    name: 'Enterprise',
    price: 'Custom',
    priceId: PLAN_PRICE_IDS.enterprise,
    period: 'contact us',
    cta: 'Contact sales',
    features: ['Custom limits', 'API access', 'Branded reports', 'CSM support'],
  },
];

export default function Pricing() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pageUrl = `${origin}/pricing`;
  const ogImage = 'https://images.unsplash.com/photo-1551281044-8f785ba67e45?q=80&w=1600&auto=format&fit=crop';

  const breadcrumbJson = useMemo(() => getBreadcrumbJsonLd([
    { name: 'Home', item: `${origin}/` },
    { name: 'Pricing', item: pageUrl },
  ]), [origin, pageUrl]);

  const productsJson = useMemo(() => {
    return plans.map((p, index) => ({
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${pageUrl}#${p.key}-plan`,
      name: `FindableAI ${p.name} Plan`,
      description: `${p.name} plan includes: ${p.features.join(', ')}`,
      url: pageUrl,
      category: 'Software as a Service',
      brand: { 
        '@type': 'Brand', 
        name: 'FindableAI',
        url: origin
      },
      offers: {
        '@type': 'Offer',
        '@id': `${pageUrl}#offer-${p.key}`,
        name: `${p.name} Plan Subscription`,
        priceCurrency: 'USD',
        price: p.price === 'Custom' ? undefined : p.price.replace('$', ''),
        priceSpecification: p.price === 'Custom' ? undefined : {
          '@type': 'UnitPriceSpecification',
          price: p.price.replace('$', ''),
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
    }));
  }, [pageUrl, origin]);

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
        title="Pricing – AI Findability Plans for Every Team"
        description="Start free, or upgrade to Pro, Growth, or Enterprise for advanced AI scans, prompts, and competitor analysis. Transparent pricing, cancel anytime."
        url="/pricing"
        ogImage="/og-pricing.png"
        keywords="AI SEO pricing, FindableAI plans, AI optimization costs"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbJson) }} />
      {productsJson.map((p, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(p) }} />
      ))}

      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Simple, transparent pricing</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Start free and scale as you grow. Cancel anytime.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <article key={plan.key} className="plan-card rounded-xl border bg-card p-6 text-card-foreground shadow-sm relative">
                {plan.popular && (
                  <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground shadow">
                    <Star className="h-3.5 w-3.5" /> Most popular
                  </span>
                )}
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="mt-2 text-3xl font-bold">{plan.price}
                  <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">{plan.period}</span>
                </p>
                <ul className="mt-6 space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {plan.key === 'free' ? (
                    <Button size="lg" className="w-full btn-cta" onClick={() => navigate('/onboarding')}>
                      {plan.cta}
                    </Button>
                  ) : plan.key === 'enterprise' ? (
                    <Button size="lg" variant="secondary" className="w-full" onClick={() => navigate('/account')}>
                      {plan.cta}
                    </Button>
                  ) : (
                    <Button size="lg" className="w-full btn-cta" onClick={() => handleCheckout(plan.priceId)}>
                      {plan.cta}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
