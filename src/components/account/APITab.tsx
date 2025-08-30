import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2,
  Crown,
  BookOpen,
  ExternalLink,
  AlertTriangle,
  Code2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export function APITab() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showKey, setShowKey] = useState(false);
  const [apiKeys, setApiKeys] = useState([
    // Mock data - in real app this would come from backend
    {
      id: '1',
      name: 'Production API Key',
      key: 'sk-test-4242424242424242',
      created: '2024-08-15',
      lastUsed: '2024-08-29'
    }
  ]);

  const hasAPIAccess = profile?.plan === 'max';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard',
    });
  };

  const generateNewKey = () => {
    // Mock implementation
    const newKey = {
      id: String(Date.now()),
      name: 'New API Key',
      key: `sk-test-${Math.random().toString(36).substr(2, 16)}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never'
    };
    setApiKeys([...apiKeys, newKey]);
    toast({
      title: 'API key generated',
      description: 'Your new API key has been created successfully.',
    });
  };

  const deleteKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
    toast({
      title: 'API key deleted',
      description: 'The API key has been permanently deleted.',
      variant: 'destructive',
    });
  };

  if (!hasAPIAccess) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              API Access
            </CardTitle>
            <CardDescription>
              Integrate FindableAI into your applications and workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full w-16 h-16 mx-auto mb-4">
                <Crown className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">API Access Available with Max Plan</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Unlock programmatic access to FindableAI's scanning, AI testing, and reporting capabilities 
                with our comprehensive API.
              </p>
              
              <div className="space-y-4 max-w-sm mx-auto">
                <div className="text-left space-y-3">
                  <div className="flex items-center gap-3">
                    <Code2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">REST API with full functionality</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Secure API key management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Comprehensive documentation</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <Button onClick={() => navigate('/pricing')} className="w-full">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Max Plan
                  </Button>
                  <Button variant="outline" className="w-full" disabled>
                    <BookOpen className="h-4 w-4 mr-2" />
                    View API Docs (Coming Soon)
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">API Coming Soon</h4>
                <p className="text-sm text-amber-800 mt-1">
                  Our API is currently in development. Max plan subscribers will get early access when available.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Keys Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage your API keys for programmatic access
              </CardDescription>
            </div>
            <Button onClick={generateNewKey} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Generate Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
                <p className="text-muted-foreground mb-4">
                  Generate your first API key to start integrating with our API
                </p>
                <Button onClick={generateNewKey}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate API Key
                </Button>
              </div>
            ) : (
              apiKeys.map((apiKey) => (
                <Card key={apiKey.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium">{apiKey.name}</Label>
                        <Badge variant="outline" className="text-green-600">
                          Active
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-sm">
                        <span>
                          {showKey ? apiKey.key : apiKey.key.substring(0, 12) + '••••••••••••••••'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowKey(!showKey)}
                        >
                          {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.key)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(apiKey.created).toLocaleDateString()} • 
                        Last used: {apiKey.lastUsed}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteKey(apiKey.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            API Documentation
          </CardTitle>
          <CardDescription>
            Learn how to integrate FindableAI into your applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                API documentation is currently being finalized. Check back soon for comprehensive guides and examples.
              </AlertDescription>
            </Alert>

            <div className="grid gap-3">
              <Button variant="outline" disabled className="justify-start">
                <Code2 className="h-4 w-4 mr-2" />
                Getting Started Guide (Coming Soon)
              </Button>
              <Button variant="outline" disabled className="justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                API Reference (Coming Soon)
              </Button>
              <Button variant="outline" disabled className="justify-start">
                <ExternalLink className="h-4 w-4 mr-2" />
                Code Examples (Coming Soon)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limits</CardTitle>
          <CardDescription>Your API usage limits and current consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Requests per minute</Label>
                <div className="text-2xl font-bold">100</div>
                <div className="text-xs text-muted-foreground">Max plan limit</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Requests per day</Label>
                <div className="text-2xl font-bold">10,000</div>
                <div className="text-xs text-muted-foreground">Max plan limit</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current usage</Label>
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-xs text-muted-foreground">This month</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}