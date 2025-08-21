import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

export function MobileHeader() {
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  
  if (!isMobile) {
    return null;
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="btn-focus p-2 -ml-2 min-h-[44px] min-w-[44px]" />
        <Link to="/" className="flex items-center gap-2 link-focus">
          <h1 className="text-lg font-bold text-foreground">FindableAI</h1>
        </Link>
      </div>
      
      {profile && (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="btn-focus min-h-[44px] min-w-[44px] p-2"
        >
          <Link to="/account">
            <User className="h-5 w-5" />
            <span className="sr-only">Account settings</span>
          </Link>
        </Button>
      )}
    </header>
  );
}