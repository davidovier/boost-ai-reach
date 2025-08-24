import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <SEO
        title="Page Not Found"
        description="The page you're looking for doesn't exist. Return to FindableAI's homepage to continue exploring our AI-powered platform."
        url="/404"
        noindex={true}
      />
      
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Hero Image */}
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop&crop=center&fm=webp"  
              alt="Page not found illustration - lost path in digital maze navigation"
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-bold text-primary">404</h1>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                Oops! Page Not Found
              </h2>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                It looks like the page you're searching for has wandered off into the digital void. 
                Don't worry though - let's get you back on track!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="min-w-[160px]">
                <Link to="/">
                  <Home className="mr-2 h-5 w-5" />
                  Back to Home
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[160px]">
                <Link to="/dashboard">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>

            {/* Helpful Links */}
            <div className="pt-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-4">
                Looking for something specific?
              </p>
              <div className="flex flex-wrap gap-4 justify-center text-sm">
                <Link to="/scans" className="text-primary hover:underline">
                  Website Scans
                </Link>
                <Link to="/ai-tests" className="text-primary hover:underline">
                  AI Tests
                </Link>
                <Link to="/reports" className="text-primary hover:underline">
                  Reports
                </Link>
                <Link to="/pricing" className="text-primary hover:underline">
                  Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}