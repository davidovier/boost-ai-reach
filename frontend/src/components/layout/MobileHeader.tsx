import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export function MobileHeader() {
  const isMobile = useIsMobile();
  
  if (!isMobile) {
    return null;
  }

  return (
    <header className="flex h-14 items-center border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1 text-center">
        <h1 className="text-lg font-semibold text-foreground">FindableAI</h1>
      </div>
    </header>
  );
}