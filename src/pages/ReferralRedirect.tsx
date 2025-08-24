import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function ReferralRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referrer, setReferrer] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleReferral = async () => {
      if (!code) {
        setError('Invalid referral link');
        setLoading(false);
        return;
      }

      try {
        // Look up the referrer by referral code
        const { data: referrerData, error: referrerError } = await supabase
          .from('profiles')
          .select('id, name, email, referral_code')
          .eq('referral_code', code.toUpperCase())
          .maybeSingle();

        if (referrerError) throw referrerError;

        if (!referrerData) {
          setError('Referral link not found');
          setLoading(false);
          return;
        }

        setReferrer(referrerData);

        // Store referral info in localStorage for signup attribution
        localStorage.setItem('referral_code', code.toUpperCase());
        localStorage.setItem('referrer_id', referrerData.id);

        // Track referral click event
        await supabase.from('user_events').insert({
          user_id: referrerData.id,
          event_name: 'referral_clicked',
          metadata: {
            referral_code: code.toUpperCase(),
            clicked_at: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        });

        // If user is already logged in, redirect to dashboard
        if (user) {
          navigate('/dashboard');
          return;
        }

      } catch (err: any) {
        console.error('Referral handling error:', err);
        setError('Something went wrong processing the referral link');
      } finally {
        setLoading(false);
      }
    };

    handleReferral();
  }, [code, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <Card className="p-8 max-w-md mx-auto text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Processing referral...</h2>
          <p className="text-muted-foreground">Please wait while we set up your referral.</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-destructive">Referral Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
      <Card className="p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Gift className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">
          You've been invited to FindableAI!
        </h1>
        
        {referrer && (
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>{referrer.name || referrer.email}</strong> invited you to optimize your website for AI discovery
            </p>
          </div>
        )}

        <p className="text-muted-foreground mb-8">
          Join thousands of companies improving their AI findability. Get started with a free scan and see how AI tools discover your website.
        </p>

        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/signup')}
            className="w-full"
            size="lg"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up Free
          </Button>
          
          <Button 
            onClick={() => navigate('/signin')}
            variant="outline"
            className="w-full"
          >
            Already have an account? Sign In
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t">
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="font-semibold text-foreground">Free Plan</div>
              <div>1 site, 1 scan/month</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground">AI Insights</div>
              <div>Findability scoring</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground">No Credit Card</div>
              <div>Start immediately</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}