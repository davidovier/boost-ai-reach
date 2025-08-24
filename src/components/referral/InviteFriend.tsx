import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useReferral } from '@/hooks/useReferral';
import { Copy, Share2, Users, DollarSign, Gift, ExternalLink } from 'lucide-react';

interface InviteFriendProps {
  className?: string;
}

export function InviteFriend({ className = '' }: InviteFriendProps) {
  const { referralUrl, referralCode, referralCount, referralEarnings, loading, copyReferralUrl } = useReferral();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyReferralUrl();
    if (success) {
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Your referral link has been copied to clipboard.'
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard. Please copy manually.',
        variant: 'destructive'
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share && referralUrl) {
      try {
        await navigator.share({
          title: 'Join me on FindableAI',
          text: 'Get your website discovered by AI tools like ChatGPT. Start with a free scan!',
          url: referralUrl
        });
      } catch (error) {
        // Fallback to copy if share fails
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 animate-pulse ${className}`}>
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!referralUrl) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <Gift className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Referral system not available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Invite Friends</h3>
          <p className="text-sm text-muted-foreground">
            Earn $1 for each friend who signs up
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{referralCount}</div>
          <div className="text-sm text-muted-foreground">Friends Invited</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            ${(referralEarnings / 100).toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">Earned</div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">Your Referral Code</label>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
            {referralCode}
          </Badge>
        </div>
      </div>

      {/* Referral URL */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Your Referral Link</label>
        <div className="flex gap-2">
          <Input
            value={referralUrl}
            readOnly
            className="font-mono text-sm"
          />
          <Button
            onClick={handleCopy}
            variant="outline"
            className="min-w-[80px]"
          >
            {copied ? (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button onClick={handleShare} className="w-full" size="lg">
          <Share2 className="w-4 h-4 mr-2" />
          Share Invitation
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => window.open(`mailto:?subject=Join me on FindableAI&body=I've been using FindableAI to optimize my website for AI discovery. You should check it out too! Get started with a free scan: ${referralUrl}`, '_blank')}
          >
            Email
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`https://twitter.com/intent/tweet?text=Just discovered FindableAI - it helps optimize websites for AI tools like ChatGPT! Get a free scan: ${referralUrl}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Tweet
          </Button>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="font-medium mb-3">How it works</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-1.5"></div>
            <span>Share your unique referral link with friends</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-1.5"></div>
            <span>They sign up and get a free AI findability scan</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-1.5"></div>
            <span>You earn $1.00 for each successful referral</span>
          </div>
        </div>
      </div>
    </Card>
  );
}