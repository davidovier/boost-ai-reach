import { useState } from 'react';
import { SEO } from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const [url, setUrl] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      // In the full flow we will create the site and trigger first scan here.
      toast({ title: 'Site saved', description: `We will scan ${parsed.hostname} shortly.` });
      navigate('/dashboard');
    } catch {
      toast({ title: 'Invalid URL', description: 'Please enter a valid website like example.com', variant: 'destructive' });
    }
  };

  return (
    <>
      <SEO 
        title="Get Started – FindableAI Onboarding"
        description="Enter your website URL to begin AI findability optimization and run your first scan."
        canonical={`${window.location.origin}/onboarding`}
      />
      <main>
        <section className="mx-auto max-w-3xl px-6 py-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Let’s set up your first site</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <label htmlFor="site" className="block text-sm text-muted-foreground">
                  Website URL
                </label>
                <Input
                  id="site"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <div className="flex gap-3">
                  <Button type="submit">Continue</Button>
                  <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>Skip for now</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
