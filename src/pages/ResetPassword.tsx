import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, AlertCircle, CheckCircle, Mail, Lock } from 'lucide-react';
import { stringifyJsonLd } from '@/lib/seo';
import '../styles/components/_forms.scss';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState<'request' | 'reset'>('request');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  // Check if this is a password reset callback
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setMode('reset');
    }
  }, [searchParams]);

  // Redirect if already authenticated (unless in reset mode)
  useEffect(() => {
    if (!authLoading && user && mode === 'request') {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate, mode]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        if (error.message.includes('User not found')) {
          setError('No account found with this email address.');
        } else {
          setError(error.message);
        }
        return;
      }

      setSuccess('Password reset instructions have been sent to your email address.');
      setEmail('');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset request error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess('Password updated successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pageUrl = `${origin}/reset-password`;

  const actionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Action',
    name: mode === 'request' ? 'Request Password Reset' : 'Reset Password',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: pageUrl,
      actionPlatform: [
        'http://schema.org/DesktopWebPlatform',
        'http://schema.org/MobileWebPlatform'
      ]
    },
    object: {
      '@type': 'WebSite',
      name: 'FindableAI',
      url: origin
    }
  };

  if (authLoading && mode === 'request') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <SEO
        title={mode === 'request' ? 'Reset Password' : 'Set New Password'}
        description={mode === 'request' 
          ? 'Reset your FindableAI account password. Enter your email to receive secure reset instructions.' 
          : 'Create a new secure password for your FindableAI account.'
        }
        url="/reset-password"
        noindex={true}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(actionJsonLd) }}
      />

      <main className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {mode === 'request' ? (
            <form onSubmit={handleRequestReset} className={`auth-form ${loading ? 'auth-form--loading' : ''}`}>
              <div className="auth-form__header">
                <h1 className="auth-form__title">Reset your password</h1>
                <p className="auth-form__subtitle">
                  Enter your email address and we'll send you a link to reset your password
                </p>
              </div>

              <div className="auth-form__field">
                <label htmlFor="email" className="auth-form__label" aria-required="true">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="auth-form__input pl-10"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    aria-describedby={error ? 'reset-error' : undefined}
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {error && (
                <div id="reset-error" className="auth-form__error" role="alert" aria-live="polite">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="auth-form__success" role="status" aria-live="polite">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  {success}
                </div>
              )}

              <Button
                type="submit"
                className="auth-form__submit btn-cta"
                size="lg"
                disabled={loading || !email.trim()}
              >
                {loading ? 'Sending...' : 'Send reset instructions'}
              </Button>

              <div className="auth-form__divider">
                <span>or</span>
              </div>

              <div className="auth-form__link">
                Remember your password?{' '}
                <Link to="/signin">
                  Sign in
                </Link>
              </div>

              <div className="auth-form__link">
                Don't have an account?{' '}
                <Link to="/signup">
                  Sign up for free
                </Link>
              </div>

              <div className="auth-form__link">
                <Link to="/">
                  ← Back to home
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className={`auth-form ${loading ? 'auth-form--loading' : ''}`}>
              <div className="auth-form__header">
                <h1 className="auth-form__title">Set new password</h1>
                <p className="auth-form__subtitle">
                  Enter your new password below
                </p>
              </div>

              <div className="auth-form__field">
                <label htmlFor="password" className="auth-form__label" aria-required="true">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="auth-form__input pl-10 pr-12"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    aria-describedby="password-requirements reset-error"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <p id="password-requirements" className="text-xs text-muted-foreground mt-1">
                  Must be at least 6 characters long
                </p>
              </div>

              <div className="auth-form__field">
                <label htmlFor="confirmPassword" className="auth-form__label" aria-required="true">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="auth-form__input pl-10 pr-12"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    aria-describedby={error ? 'reset-error' : undefined}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div id="reset-error" className="auth-form__error" role="alert" aria-live="polite">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="auth-form__success" role="status" aria-live="polite">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  {success}
                </div>
              )}

              <Button
                type="submit"
                className="auth-form__submit btn-cta"
                size="lg"
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? 'Updating password...' : 'Update password'}
              </Button>

              <div className="auth-form__link">
                <Link to="/signin">
                  ← Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  );
}