import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface LegalLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function LegalLayout({ children, title }: LegalLayoutProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const isMobile = useIsMobile();

  useEffect(() => {
    const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingElements = Array.from(elements).map((elem) => ({
      id: elem.id,
      text: elem.textContent || '',
      level: parseInt(elem.tagName.charAt(1)),
    }));
    setHeadings(headingElements);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20px 0px -80% 0px' }
    );

    elements.forEach((elem) => observer.observe(elem));
    return () => observer.disconnect();
  }, [children]);

  const scrollToHeading = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const TOC = () => (
    <nav className="space-y-2" aria-label="Table of contents">
      <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
        Table of Contents
      </h2>
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li key={heading.id}>
            <button
              onClick={() => scrollToHeading(heading.id)}
              className={`
                block w-full text-left text-sm py-1 px-2 rounded transition-colors
                hover:bg-muted hover:text-foreground
                ${activeId === heading.id ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground'}
                ${heading.level === 1 ? '' : `ml-${(heading.level - 1) * 3}`}
              `}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
          <div className="container flex items-center justify-between py-4">
            <h1 className="text-xl font-semibold">{title}</h1>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open table of contents</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <TOC />
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <main className="container py-6">
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            {children}
          </article>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="flex gap-8">
          <aside className="sticky top-8 h-fit w-64 shrink-0">
            <TOC />
          </aside>
          <main className="flex-1">
            <article className="prose prose-neutral dark:prose-invert max-w-none">
              <header className="mb-8">
                <h1 className="mb-2">{title}</h1>
                <p className="text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </header>
              {children}
            </article>
          </main>
        </div>
      </div>
    </div>
  );
}