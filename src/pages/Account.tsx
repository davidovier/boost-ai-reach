import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, CreditCard, Settings, BarChart3, Home } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';
import { AccountOverview } from '@/components/account/AccountOverview';
import { SubscriptionTab } from '@/components/account/SubscriptionTab';
import { ProfileTab } from '@/components/account/ProfileTab';
import { UsageTab } from '@/components/account/UsageTab';
import { APITab } from '@/components/account/APITab';

export default function Account() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

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

  const tabConfig = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'usage', label: 'Usage', icon: BarChart3 },
    { id: 'api', label: 'API', icon: Settings },
  ];

  return (
    <>
      <SEO
        title="Account Settings"
        description="Manage your FindableAI account settings, subscription plan, usage limits, billing information, and profile preferences."
        url="/account"
        noindex={true}
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbs) }} 
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account</h1>
          <p className="text-muted-foreground">
            Manage your profile, subscription, usage, and preferences
          </p>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden md:block">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="overview">
              <AccountOverview onTabChange={setActiveTab} />
            </TabsContent>

            <TabsContent value="subscription">
              <SubscriptionTab />
            </TabsContent>

            <TabsContent value="profile">
              <ProfileTab />
            </TabsContent>

            <TabsContent value="usage">
              <UsageTab />
            </TabsContent>

            <TabsContent value="api">
              <APITab />
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile Dropdown */}
        <div className="md:hidden space-y-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger>
              <SelectValue>
                {(() => {
                  const currentTab = tabConfig.find(tab => tab.id === activeTab);
                  if (!currentTab) return null;
                  const Icon = currentTab.icon;
                  return (
                    <div className="flex items-center">
                      <Icon className="mr-2 h-4 w-4" />
                      {currentTab.label}
                    </div>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                return (
                  <SelectItem key={tab.id} value={tab.id}>
                    <div className="flex items-center">
                      <Icon className="mr-2 h-4 w-4" />
                      {tab.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Mobile Content */}
          {activeTab === 'overview' && <AccountOverview onTabChange={setActiveTab} />}
          {activeTab === 'subscription' && <SubscriptionTab />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'usage' && <UsageTab />}
          {activeTab === 'api' && <APITab />}
        </div>
      </div>
    </>
  );
}