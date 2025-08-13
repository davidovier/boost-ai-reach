import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { MobileHeader } from './MobileHeader';

export function MainLayout() {
  return (
    <SidebarProvider>
      {/* Accessible skip link for keyboard users */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <nav aria-label="Primary">
              <MobileHeader />
            </nav>
          </header>
          <main id="main-content" className="flex-1 p-4 md:p-6" role="main">
            <Outlet />
          </main>
          <footer className="border-t p-4 md:p-6 text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <p>&copy; {new Date().getFullYear()} FindableAI. All rights reserved.</p>
              <a href="/" className="hover:underline">Back to home</a>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
