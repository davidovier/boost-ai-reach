import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SEO } from '@/components/SEO';
import { ArrowLeft, Globe, Zap, CheckCircle, AlertCircle, XCircle, Sparkles } from 'lucide-react';

const DemoScan = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const handleScan = async () => {
    if (!url.trim()) return;
    
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate scanning progress
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsScanning(false);
          setShowResults(true);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const mockResults = {
    findabilityScore: 73,
    metadataScore: 85,
    schemaScore: 60,
    crawlabilityScore: 90,
    aiReadabilityScore: 65,
    issues: [
      { type: 'warning', title: 'Missing Schema Markup', description: 'Add structured data to help AI understand your content' },
      { type: 'error', title: 'Incomplete Meta Description', description: 'Meta description is too short for optimal AI discovery' },
      { type: 'success', title: 'Good Page Speed', description: 'Fast loading times improve crawlability' }
    ]
  };

  return (
    <>
      <SEO
        title="Free AI Findability Demo Scan | FindableAI"
        description="Try our AI findability scanner for free. Get instant insights into how AI tools discover and represent your website."
        url="/demo-scan"
        keywords="AI findability demo, free website scan, AI optimization test, SEO for AI"
      />
      
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary mb-4">
                <Sparkles className="h-4 w-4" />
                Free Demo Scan
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Test Your Website's AI Findability
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Enter your website URL to see how AI tools like ChatGPT discover and understand your content. 
                No sign-up required.
              </p>
            </div>
          </div>

          {!showResults ? (
            <Card className="mx-auto max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Enter Your Website URL
                </CardTitle>
                <CardDescription>
                  We'll analyze your site's AI findability and show you optimization opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isScanning}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleScan}
                      disabled={!url.trim() || isScanning}
                      className="px-6"
                    >
                      {isScanning ? (
                        <>
                          <Zap className="w-4 h-4 mr-2 animate-spin" />
                          Scanning
                        </>
                      ) : (
                        'Start Scan'
                      )}
                    </Button>
                  </div>
                  
                  {isScanning && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Analyzing your website...</span>
                        <span>{scanProgress}%</span>
                      </div>
                      <Progress value={scanProgress} className="w-full" />
                      <p className="text-xs text-muted-foreground">
                        {scanProgress < 30 && "Fetching page content..."}
                        {scanProgress >= 30 && scanProgress < 60 && "Analyzing metadata..."}
                        {scanProgress >= 60 && scanProgress < 90 && "Checking schema markup..."}
                        {scanProgress >= 90 && "Generating report..."}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">AI Findability Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="relative inline-flex items-center justify-center">
                      <div className="text-6xl font-bold text-primary">
                        {mockResults.findabilityScore}
                      </div>
                      <div className="text-2xl text-muted-foreground">/100</div>
                    </div>
                    <Badge variant={mockResults.findabilityScore >= 80 ? "default" : mockResults.findabilityScore >= 60 ? "secondary" : "destructive"}>
                      {mockResults.findabilityScore >= 80 ? "Excellent" : mockResults.findabilityScore >= 60 ? "Good" : "Needs Improvement"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Scores */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Metadata Quality</span>
                      <span className="text-sm text-muted-foreground">{mockResults.metadataScore}/100</span>
                    </div>
                    <Progress value={mockResults.metadataScore} className="mb-1" />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Schema Markup</span>
                      <span className="text-sm text-muted-foreground">{mockResults.schemaScore}/100</span>
                    </div>
                    <Progress value={mockResults.schemaScore} className="mb-1" />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Crawlability</span>
                      <span className="text-sm text-muted-foreground">{mockResults.crawlabilityScore}/100</span>
                    </div>
                    <Progress value={mockResults.crawlabilityScore} className="mb-1" />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">AI Readability</span>
                      <span className="text-sm text-muted-foreground">{mockResults.aiReadabilityScore}/100</span>
                    </div>
                    <Progress value={mockResults.aiReadabilityScore} className="mb-1" />
                  </CardContent>
                </Card>
              </div>

              {/* Issues */}
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Opportunities</CardTitle>
                  <CardDescription>
                    Issues that could improve your AI findability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockResults.issues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 rounded-lg border">
                        {issue.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />}
                        {issue.type === 'warning' && <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />}
                        {issue.type === 'error' && <XCircle className="w-5 h-5 text-red-500 mt-0.5" />}
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{issue.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                <CardContent className="pt-6 text-center">
                  <h3 className="text-xl font-semibold mb-2">Want the Full Analysis?</h3>
                  <p className="text-muted-foreground mb-4">
                    Get detailed recommendations, competitor comparisons, and AI simulation testing with a free account.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => navigate('/signup')} size="lg">
                      Create Free Account
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/signin')} size="lg">
                      Sign In
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default DemoScan;