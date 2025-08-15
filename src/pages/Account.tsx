import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  CreditCard, 
  Settings, 
  ExternalLink, 
  Loader2, 
  Shield,
  BarChart3
} from 'lucide-react';
import { SEO } from '@/components/SEO';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';

export default function Account() {
  const { profile, refreshProfile } = useAuth();
  const { data: subscription, loading: subscriptionLoading, openCustomerPortal } = useSubscription();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    role: profile?.role || 'user',
  });

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: formData.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });

      await refreshProfile();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setPortalLoading(true);
      await openCustomerPortal();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to open billing portal',
        variant: 'destructive',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'free': return 'Free';
      case 'pro': return 'Pro';
      case 'growth': return 'Growth';
      case 'enterprise': return 'Enterprise';
      default: return plan;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'secondary';
      case 'pro': return 'default';
      case 'growth': return 'default';
      case 'enterprise': return 'default';
      default: return 'secondary';
    }
  };

  const breadcrumbs = getBreadcrumbJsonLd([
    { name: 'Home', item: window.location.origin },
    { name: 'Account', item: `${window.location.origin}/account` },
  ]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading account...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Account Settings – Manage Profile & Billing | FindableAI"
        description="Manage your FindableAI account settings, subscription plan, billing information, and API access."
        url="/account"
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbs) }} 
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile, subscription, and preferences
          </p>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden md:block">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="billing">
                <CreditCard className="mr-2 h-4 w-4" />
                Plan & Billing
              </TabsTrigger>
              <TabsTrigger value="api">
                <Settings className="mr-2 h-4 w-4" />
                API
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account details and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        value={formData.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Display Name</Label>
                      <Input 
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your display name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        <Shield className="mr-1 h-3 w-3" />
                        {profile.role}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Contact admin to change role
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>
                      Your subscription and billing information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Plan</span>
                      <Badge variant={getPlanColor(profile.plan) as any} className="capitalize">
                        {getPlanDisplayName(profile.plan)}
                      </Badge>
                    </div>
                    
                    {subscription?.subscription && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge variant={subscription.subscription.status === 'active' ? 'default' : 'secondary'}>
                            {subscription.subscription.status || 'Free'}
                          </Badge>
                        </div>
                        
                        {subscription.subscription.current_period_end && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Next billing</span>
                            <span className="text-sm">
                              {new Date(subscription.subscription.current_period_end).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    <Button 
                      onClick={handleManageBilling} 
                      disabled={portalLoading}
                      className="w-full"
                    >
                      {portalLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="mr-2 h-4 w-4" />
                      )}
                      Manage Billing
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Usage Limits</CardTitle>
                    <CardDescription>
                      Track your monthly usage and limits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {subscriptionLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="space-y-2">
                            <div className="h-3 bg-muted rounded animate-pulse" />
                            <div className="h-2 bg-muted rounded animate-pulse" />
                          </div>
                        ))}
                      </div>
                    ) : subscription ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>AI Tests</span>
                            <span>{subscription.usage?.prompt_count || 0} / {subscription.limits?.max_prompts || '∞'}</span>
                          </div>
                          <Progress 
                            value={subscription.limits?.max_prompts ? 
                              ((subscription.usage?.prompt_count || 0) / subscription.limits.max_prompts) * 100 : 0
                            } 
                            className="h-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Scans</span>
                            <span>{subscription.usage?.scan_count || 0} / {subscription.limits?.max_scans || '∞'}</span>
                          </div>
                          <Progress 
                            value={subscription.limits?.max_scans ? 
                              ((subscription.usage?.scan_count || 0) / subscription.limits.max_scans) * 100 : 0
                            } 
                            className="h-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Competitors</span>
                            <span>{subscription.usage?.competitor_count || 0} / {subscription.limits?.max_competitors || '∞'}</span>
                          </div>
                          <Progress 
                            value={subscription.limits?.max_competitors ? 
                              ((subscription.usage?.competitor_count || 0) / subscription.limits.max_competitors) * 100 : 0
                            } 
                            className="h-2"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No usage data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>API Access</CardTitle>
                  <CardDescription>
                    Manage your API keys and access tokens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">API Access Coming Soon</h3>
                    <p className="text-muted-foreground">
                      API functionality will be available in a future update
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile Dropdown */}
        <div className="md:hidden space-y-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger>
              <SelectValue>
                {activeTab === 'profile' && (
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </div>
                )}
                {activeTab === 'billing' && (
                  <div className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Plan & Billing
                  </div>
                )}
                {activeTab === 'api' && (
                  <div className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    API
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profile">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </div>
              </SelectItem>
              <SelectItem value="billing">
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Plan & Billing
                </div>
              </SelectItem>
              <SelectItem value="api">
                <div className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  API
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile tab content - same as desktop but without Tabs wrapper */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile-email">Email</Label>
                    <Input 
                      id="mobile-email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mobile-name">Display Name</Label>
                    <Input 
                      id="mobile-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your display name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      <Shield className="mr-1 h-3 w-3" />
                      {profile.role}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Contact admin to change role
                    </p>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>
                    Your subscription and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <Badge variant={getPlanColor(profile.plan) as any} className="capitalize">
                      {getPlanDisplayName(profile.plan)}
                    </Badge>
                  </div>
                  
                  {subscription?.subscription && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant={subscription.subscription.status === 'active' ? 'default' : 'secondary'}>
                          {subscription.subscription.status || 'Free'}
                        </Badge>
                      </div>
                      
                      {subscription.subscription.current_period_end && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Next billing</span>
                          <span className="text-sm">
                            {new Date(subscription.subscription.current_period_end).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <Button 
                    onClick={handleManageBilling} 
                    disabled={portalLoading}
                    className="w-full"
                  >
                    {portalLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="mr-2 h-4 w-4" />
                    )}
                    Manage Billing
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Limits</CardTitle>
                  <CardDescription>
                    Track your monthly usage and limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscriptionLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-3 bg-muted rounded animate-pulse" />
                          <div className="h-2 bg-muted rounded animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : subscription ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>AI Tests</span>
                          <span>{subscription.usage?.prompt_count || 0} / {subscription.limits?.max_prompts || '∞'}</span>
                        </div>
                        <Progress 
                          value={subscription.limits?.max_prompts ? 
                            ((subscription.usage?.prompt_count || 0) / subscription.limits.max_prompts) * 100 : 0
                          } 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Scans</span>
                          <span>{subscription.usage?.scan_count || 0} / {subscription.limits?.max_scans || '∞'}</span>
                        </div>
                        <Progress 
                          value={subscription.limits?.max_scans ? 
                            ((subscription.usage?.scan_count || 0) / subscription.limits.max_scans) * 100 : 0
                          } 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Competitors</span>
                          <span>{subscription.usage?.competitor_count || 0} / {subscription.limits?.max_competitors || '∞'}</span>
                        </div>
                        <Progress 
                          value={subscription.limits?.max_competitors ? 
                            ((subscription.usage?.competitor_count || 0) / subscription.limits.max_competitors) * 100 : 0
                          } 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No usage data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'api' && (
            <Card>
              <CardHeader>
                <CardTitle>API Access</CardTitle>
                <CardDescription>
                  Manage your API keys and access tokens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">API Access Coming Soon</h3>
                  <p className="text-muted-foreground">
                    API functionality will be available in a future update
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}