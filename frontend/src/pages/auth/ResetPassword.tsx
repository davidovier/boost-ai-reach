import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ResetPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setDone(true);
      toast({ title: 'Email sent', description: 'Check your inbox for reset instructions.' });
    } catch (err: any) {
      toast({ title: 'Could not send email', description: err.message || 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <Card className="w-full max-w-md p-6 shadow-sm">
        <div className="mb-6 text-center space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reset password</h1>
          <p className="text-sm text-muted-foreground">We'll send you a reset link</p>
        </div>
        {done ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">If an account exists for</p>
            <p className="font-medium text-foreground">{email}</p>
            <p className="text-sm text-muted-foreground">You'll receive an email shortly.</p>
            <Link to="/auth/sign-in" className="underline">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}