import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { PLAN_PRICE_IDS } from '@/types/stripe';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';
import { TestimonialSlider } from '@/components/ui/testimonial-slider';
import { StarRating } from '@/components/ui/star-rating';
import { FAQAccordion } from '@/components/ui/faq-accordion';
import { Check, Star, Shield, Zap, HeadphonesIcon } from 'lucide-react';
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

  const testimonials = [
    {
      id: '1',
      name: 'David Kim',
      role: 'VP Marketing',
      company: 'InnovateCorp',
      content: 'The Pro plan gave us exactly what we needed. Our AI visibility improved dramatically within the first month.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&h=150&auto=format&fit=crop&fm=webp'
    },
    {
      id: '2',
      name: 'Lisa Zhang',
      role: 'Digital Marketing Manager',
      company: 'GrowthTech',
      content: 'The Growth plan is perfect for our agency. We can manage multiple clients and the competitor analysis is invaluable.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?q=80&w=150&h=150&auto=format&fit=crop&fm=webp'
    }
  ];

  const faqItems = [
    {
      question: 'Can I change plans anytime?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. All payments are processed securely through Stripe.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! Our free plan lets you scan 1 website and run 1 AI simulation per month. No credit card required to get started.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, contact support for a full refund.'
    },
    {
      question: 'What makes Enterprise different?',
      answer: 'Enterprise includes unlimited everything, white-label reports, dedicated support, custom integrations, and a customer success manager.'
    },
    {
      question: 'How accurate are the AI simulations?',
      answer: 'Our AI simulations use the same models as ChatGPT, Claude, and other leading AI tools, providing 95%+ accuracy in predicting real-world results.'
    }
  ];

  const breadcrumbJson = useMemo(() => getBreadcrumbJsonLd([
    { name: 'Home', item: `${origin}/` },
    { name: 'Pricing', item: pageUrl },
  ]), [origin, pageUrl]);

  const productsJson = useMemo(() => {
    return planKeys.map((planKey, index) => {
      const planName = t(`pricing.plans.${planKey}.name`);
      const planPrice = t(`pricing.plans.${planKey}.price`);
      const planFeatures = Array.isArray(t(`pricing.plans.${planKey}.features`)) 
        ? (t(`pricing.plans.${planKey}.features`) as unknown as string[])
        : [];
      
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${pageUrl}#${planKey}-plan`,
        name: `FindableAI ${planName} Plan`,
        description: `${planName} plan includes: ${Array.isArray(planFeatures) ? planFeatures.join(', ') : 'Various features'}`,
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

  const faqJson = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((faq, index) => ({
      '@type': 'Question',
      '@id': `${pageUrl}#faq-${index}`,
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }), [pageUrl, faqItems]);

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: stringifyJsonLd(faqJson) }} />
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

        <section className="mx-auto max-w-6xl px-6 pb-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {planKeys.map((planKey) => {
              const planName = t(`pricing.plans.${planKey}.name`);
              const planPrice = t(`pricing.plans.${planKey}.price`);
              const planPeriod = t(`pricing.plans.${planKey}.period`);
              const planCta = t(`pricing.plans.${planKey}.cta`);
              const planFeatures = Array.isArray(t(`pricing.plans.${planKey}.features`)) 
                ? (t(`pricing.plans.${planKey}.features`) as unknown as string[])
                : [];
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

        {/* Trust Signals */}
        <section className="mx-auto max-w-6xl px-6 pb-12">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <StarRating rating={4.8} size="lg" showValue showCount count={150} />
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex items-center justify-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                <span className="font-medium">Enterprise Security</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Zap className="w-6 h-6 text-primary" />
                <span className="font-medium">99.9% Uptime SLA</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <HeadphonesIcon className="w-6 h-6 text-primary" />
                <span className="font-medium">24/7 Support</span>
              </div>
            </div>
          </div>
          
          <TestimonialSlider testimonials={testimonials} />
        </section>

        {/* FAQ Section */}
        <section className="mx-auto max-w-4xl px-6 pb-12">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4">
              Pricing Questions?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get answers to common questions about our plans and pricing
            </p>
          </div>
          
          <FAQAccordion items={faqItems} />
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <div className="bg-gradient-primary rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
              Ready to Boost Your AI Visibility?
            </h2>
            <p className="text-primary-foreground/90 text-lg mb-6">
              Start with our free plan. No credit card required.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/onboarding')}
              className="min-h-[52px] px-8 text-lg font-semibold"
            >
              Get Started Free
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
