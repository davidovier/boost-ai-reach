import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export type LimitAction = 'scan' | 'prompt' | 'competitor_add' | 'report_generate';

// Map actions to database limit types
const ACTION_TO_LIMIT_TYPE: Record<LimitAction, string> = {
  scan: 'scans',
  prompt: 'prompts', 
  competitor_add: 'competitors',
  report_generate: 'reports'
};

// Action display names for error messages
const ACTION_DISPLAY_NAMES: Record<LimitAction, string> = {
  scan: 'website scans',
  prompt: 'AI prompts',
  competitor_add: 'competitor tracking',
  report_generate: 'report generation'
};

export class LimitsEnforcer {
  private supabase: any;

  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration for limits enforcer');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  /**
   * Enforce usage limits for a user action
   * @param userId - The user ID to check limits for
   * @param action - The action being performed
   * @param authHeader - Authorization header for Supabase client
   * @returns Promise resolving to success object or error response
   */
  async enforce(userId: string, action: LimitAction, authHeader?: string): Promise<{
    success: true;
  } | {
    success: false;
    response: Response;
  }> {
    try {
      // Set up client with auth header if provided
      if (authHeader) {
        this.supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_ANON_KEY')!,
          { global: { headers: { Authorization: authHeader } } }
        );
      }

      const limitType = ACTION_TO_LIMIT_TYPE[action];
      const displayName = ACTION_DISPLAY_NAMES[action];

      console.log(`[LIMITS] Checking ${action} limit for user ${userId}`);

      // Check usage limit using the existing RPC function
      const { data: allowed, error: limitErr } = await this.supabase.rpc("check_usage_limit", {
        user_id: userId,
        limit_type: limitType,
      });

      if (limitErr) {
        console.error(`[LIMITS] Error checking ${action} limit:`, limitErr);
        return {
          success: false,
          response: new Response(
            JSON.stringify({ 
              error: 'Limit check failed',
              details: limitErr.message 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        };
      }

      if (!allowed) {
        console.log(`[LIMITS] ${action} limit exceeded for user ${userId}`);
        
        // Get user's current plan for upgrade hint
        const { data: profile } = await this.supabase
          .from('profiles')
          .select('plan')
          .eq('id', userId)
          .single();

        const currentPlan = profile?.plan || 'free';
        const upgradeHint = this.getUpgradeHint(currentPlan, action);

        return {
          success: false,
          response: new Response(
            JSON.stringify({
              error: 'limit_reached',
              hint: 'upgrade',
              details: {
                action: action,
                limit_type: limitType,
                current_plan: currentPlan,
                message: `You've reached your ${displayName} limit for the ${currentPlan} plan.`,
                upgrade_suggestion: upgradeHint
              }
            }),
            { 
              status: 402, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        };
      }

      console.log(`[LIMITS] ${action} limit check passed for user ${userId}`);
      return { success: true };

    } catch (error) {
      console.error(`[LIMITS] Unexpected error in limits enforcement:`, error);
      return {
        success: false,
        response: new Response(
          JSON.stringify({ 
            error: 'Internal error during limit check',
            details: error instanceof Error ? error.message : String(error)
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      };
    }
  }

  /**
   * Get upgrade suggestion based on current plan and action
   */
  private getUpgradeHint(currentPlan: string, action: LimitAction): string {
    const upgradePaths: Record<string, string> = {
      free: 'Upgrade to Pro ($29/month) for higher limits',
      pro: 'Upgrade to Growth ($99/month) for increased capacity', 
      growth: 'Contact us for Enterprise solutions with unlimited usage'
    };

    return upgradePaths[currentPlan] || 'Consider upgrading your plan for higher limits';
  }
}

// Export singleton instance
export const limits = new LimitsEnforcer();

/**
 * Convenience function for enforcing limits in edge functions
 * Usage: const limitResult = await enforceLimit(userId, 'scan', authHeader);
 */
export async function enforceLimit(
  userId: string, 
  action: LimitAction, 
  authHeader?: string
): Promise<{
  success: true;
} | {
  success: false;
  response: Response;
}> {
  return limits.enforce(userId, action, authHeader);
}