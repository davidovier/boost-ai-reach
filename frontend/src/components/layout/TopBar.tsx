import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { AuthMenu } from '@/components/auth/AuthMenu';

export function TopBar() {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/scans', label: 'Scans' },
    { to: '/ai-tests', label: 'AI Tests' },
    { to: '/competitors', label: 'Competitors' },
    { to: '/reports', label: 'Reports' },
  ];

  return (
    <header className="hidden md:block w-full border-b border-border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-semibold text-foreground tracking-tight">FindableAI</Link>
          <nav className="hidden lg:flex items-center gap-4 text-sm text-muted-foreground">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `transition-colors hover:text-foreground ${isActive ? 'text-foreground' : ''}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <AuthMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link to="/auth/sign-in" state={{ from: location.pathname }}>Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/auth/sign-up" state={{ from: location.pathname }}>Get started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}