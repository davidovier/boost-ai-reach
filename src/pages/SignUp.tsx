import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { processReferralSignup } from '@/hooks/useReferral';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, AlertCircle, CheckCircle, User, Mail, Lock } from 'lucide-react';
import { stringifyJsonLd } from '@/lib/seo';
import '../styles/components/_forms.scss';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: formData.name.trim(),
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be')) {
          setError('Password must be at least 6 characters long');
        } else {
          setError(error.message);
        }
        return;
      }

      // Process referral signup if user was created
      if (data.user) {
        await processReferralSignup(data.user.id);
      }

      setSuccess('Account created successfully! Please check your email for a confirmation link.');
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pageUrl = `${origin}/signup`;

  const registerActionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RegisterAction',
    name: 'Sign Up for FindableAI',
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
        title="Sign Up"
        description="Create your free FindableAI account to start optimizing your brand for AI discovery with comprehensive scans and actionable insights."
        url="/signup"
        noindex={true}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(registerActionJsonLd) }}
      />

      <main className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <form onSubmit={handleSignUp} className={`auth-form ${loading ? 'auth-form--loading' : ''}`}>
            <div className="auth-form__header">
              <h1 className="auth-form__title">Create your account</h1>
              <p className="auth-form__subtitle">
                Start optimizing your AI findability today
              </p>
            </div>

            <div className="auth-form__field">
              <label htmlFor="name" className="auth-form__label" aria-required="true">
                Full name
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="auth-form__input pl-10"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                  aria-describedby={error ? 'signup-error' : undefined}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
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
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  aria-describedby={error ? 'signup-error' : undefined}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
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
                  autoComplete="new-password"
                  required
                  className="auth-form__input pl-10 pr-12"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  aria-describedby="password-requirements signup-error"
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
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="auth-form__input pl-10 pr-12"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                  aria-describedby={error ? 'signup-error' : undefined}
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
              <div id="signup-error" className="auth-form__error" role="alert" aria-live="polite">
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
              disabled={loading || !formData.name.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            <div className="auth-form__divider">
              <span>or</span>
            </div>

            <div className="auth-form__link">
              Already have an account?{' '}
              <Link to="/signin">
                Sign in
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