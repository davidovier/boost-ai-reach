import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Users, Gift, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';

interface TopReferrer {
  id: string;
  name: string;
  email: string;
  referral_code: string;
  referral_count: number;
  referral_earnings: number;
}

interface ReferralStats {
  totalReferrals: number;
  totalEarnings: number;
  totalReferrers: number;
  avgReferralsPerUser: number;
}

export function ReferralAnalytics() {
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalEarnings: 0,
    totalReferrers: 0,
    avgReferralsPerUser: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      // Get top referrers
      const { data: referrers, error: referrersError } = await supabase
        .from('profiles')
        .select('id, name, email, referral_code, referral_count, referral_earnings')
        .gt('referral_count', 0)
        .order('referral_count', { ascending: false })
        .limit(10);

      if (referrersError) throw referrersError;

      setTopReferrers(referrers || []);

      // Calculate stats
      const totalReferrals = referrers?.reduce((sum, r) => sum + r.referral_count, 0) || 0;
      const totalEarnings = referrers?.reduce((sum, r) => sum + r.referral_earnings, 0) || 0;
      const totalReferrers = referrers?.length || 0;
      const avgReferralsPerUser = totalReferrers > 0 ? totalReferrals / totalReferrers : 0;

      setStats({
        totalReferrals,
        totalEarnings,
        totalReferrers,
        avgReferralsPerUser
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Referral Analytics</h2>
          <p className="text-muted-foreground">
            Track referral performance and top contributors
          </p>
        </div>
        <Button
          onClick={fetchReferralData}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Total Referrals</span>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.totalReferrals.toLocaleString()}</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold mt-2">${(stats.totalEarnings / 100).toFixed(2)}</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">Active Referrers</span>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.totalReferrers.toLocaleString()}</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium">Avg per User</span>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.avgReferralsPerUser.toFixed(1)}</p>
        </Card>
      </div>

      {/* Top Referrers */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Referrers</h3>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : topReferrers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="w-12 h-12 mx-auto mb-4" />
            <p>No referrals yet</p>
            <p className="text-sm">Top referrers will appear here once users start referring friends</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topReferrers.map((referrer, index) => (
              <div key={referrer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {referrer.name || referrer.email}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {referrer.referral_code}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {referrer.email}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-lg">
                    {referrer.referral_count} referrals
                  </div>
                  <div className="text-sm text-green-600">
                    ${(referrer.referral_earnings / 100).toFixed(2)} earned
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 text-xs text-muted-foreground">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      </Card>
    </div>
  );
}