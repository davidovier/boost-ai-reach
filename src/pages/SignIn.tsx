import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { stringifyJsonLd } from '@/lib/seo';
import '../styles/components/_forms.scss';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.');
        } else {
          setError(error.message);
        }
        return;
      }

      setSuccess('Successfully signed in! Redirecting...');
      // Navigation will be handled by the useEffect above
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pageUrl = `${origin}/signin`;

  const loginActionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LoginAction',
    name: 'Sign In to FindableAI',
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

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <SEO
        title="Sign In - FindableAI"
        description="Sign in to your FindableAI account to access your AI findability dashboard, scans, and reports."
        url={pageUrl}
        noindex
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(loginActionJsonLd) }}
      />

      <main className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <form onSubmit={handleSignIn} className={`auth-form ${loading ? 'auth-form--loading' : ''}`}>
            <div className="auth-form__header">
              <h1 className="auth-form__title">Welcome back</h1>
              <p className="auth-form__subtitle">
                Sign in to your FindableAI account
              </p>
            </div>

            <div className="auth-form__field">
              <label htmlFor="email" className="auth-form__label" aria-required="true">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="auth-form__input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                aria-describedby={error ? 'signin-error' : undefined}
              />
            </div>

            <div className="auth-form__field">
              <label htmlFor="password" className="auth-form__label" aria-required="true">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="auth-form__input pr-12"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  aria-describedby={error ? 'signin-error' : undefined}
                />
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
            </div>

            {error && (
              <div id="signin-error" className="auth-form__error" role="alert" aria-live="polite">
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
              disabled={loading || !email.trim() || !password}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>

            <div className="auth-form__link">
              <Link to="/reset-password">
                Forgot your password?
              </Link>
            </div>

            <div className="auth-form__divider">
              <span>or</span>
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
        </div>
      </main>
    </>
  );
}