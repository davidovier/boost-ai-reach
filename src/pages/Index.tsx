import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">Welcome to FindableAI</h1>
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
