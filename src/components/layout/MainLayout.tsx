import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { MobileHeader } from './MobileHeader';
import { SkipLink } from '@/components/ui/skip-link';

export function MainLayout() {
  return (
    <SidebarProvider>
      {/* Accessible skip navigation links for keyboard users */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#sidebar-navigation">Skip to navigation</SkipLink>
      
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header 
            className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            role="banner"
          >
            <nav aria-label="Primary navigation">
              <MobileHeader />
            </nav>
          </header>
          
          <main 
            id="main-content" 
            className="flex-1 p-3 sm:p-4 lg:p-6" 
            role="main"
            aria-label="Main content"
            tabIndex={-1}
          >
            <Outlet />
          </main>
          
          <footer 
            className="border-t p-3 sm:p-4 lg:p-6 text-sm text-muted-foreground"
            role="contentinfo"
            aria-label="Site footer"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
              <p>&copy; {new Date().getFullYear()} FindableAI. All rights reserved.</p>
              <a 
                href="/" 
                className="hover:underline link-focus"
                aria-label="Return to homepage"
              >
                Back to home
              </a>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
