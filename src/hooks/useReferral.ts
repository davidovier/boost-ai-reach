import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ReferralData {
  referralCode: string | null;
  referralCount: number;
  referralEarnings: number;
  referralUrl: string | null;
}

export function useReferral() {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState<ReferralData>({
    referralCode: null,
    referralCount: 0,
    referralEarnings: 0,
    referralUrl: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferralData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('referral_code, referral_count, referral_earnings')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (profile) {
          const referralUrl = profile.referral_code 
            ? `${window.location.origin}/r/${profile.referral_code}`
            : null;

          setReferralData({
            referralCode: profile.referral_code,
            referralCount: profile.referral_count || 0,
            referralEarnings: profile.referral_earnings || 0,
            referralUrl
          });
        }
      } catch (error) {
        console.error('Error fetching referral data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [user]);

  const copyReferralUrl = async () => {
    if (referralData.referralUrl) {
      try {
        await navigator.clipboard.writeText(referralData.referralUrl);
        return true;
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
      }
    }
    return false;
  };

  return {
    ...referralData,
    loading,
    copyReferralUrl
  };
}

export async function processReferralSignup(userId: string) {
  const referralCode = localStorage.getItem('referral_code');
  const referrerId = localStorage.getItem('referrer_id');

  if (referralCode && referrerId) {
    try {
      // Update the new user's profile to include referrer
      const { error } = await supabase
        .from('profiles')
        .update({ referred_by: referrerId })
        .eq('id', userId);

      if (error) throw error;

      // Track referral signup event
      await supabase.from('user_events').insert({
        user_id: referrerId,
        event_name: 'referral_signup',
        metadata: {
          referred_user_id: userId,
          referral_code: referralCode,
          signed_up_at: new Date().toISOString()
        }
      });

      // Clean up localStorage
      localStorage.removeItem('referral_code');
      localStorage.removeItem('referrer_id');

      return true;
    } catch (error) {
      console.error('Error processing referral signup:', error);
      return false;
    }
  }

  return false;
}