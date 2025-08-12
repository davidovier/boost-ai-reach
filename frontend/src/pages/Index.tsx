import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-3xl mx-auto px-6">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">Make your site discoverable by AI</h1>
        <p className="text-xl text-muted-foreground">
          Optimize your content for AI discovery and visibility
        </p>
        <Button 
          onClick={() => navigate('/dashboard')}
          size="lg"
          className="mt-6"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
