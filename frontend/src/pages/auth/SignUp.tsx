import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function SignUp() {
  const { toast } = useToast();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      if (error) throw error;
      setDone(true);
      toast({ title: 'Check your inbox', description: 'We sent you a confirmation link.' });
    } catch (err: any) {
      toast({ title: 'Sign up failed', description: err.message || 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <Card className="w-full max-w-md p-6 shadow-sm">
        <div className="mb-6 text-center space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground">Start optimizing your AI findability</p>
        </div>
        {done ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">We emailed a confirmation link to</p>
            <p className="font-medium text-foreground">{email}</p>
            <p className="text-sm text-muted-foreground">Return to <Link className="underline" to="/auth/sign-in" state={location.state}>Sign in</Link></p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">By continuing you agree to our Terms and Privacy Policy.</p>
          </form>
        )}
        {!done && (
          <div className="mt-4 text-sm text-center">
            Already have an account?{' '}
            <Link to="/auth/sign-in" className="text-foreground font-medium hover:underline">Sign in</Link>
          </div>
        )}
      </Card>
    </div>
  );
}