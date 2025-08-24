import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ABTestVariant = 'short' | 'guided';

interface ABTestResult {
  variant: ABTestVariant | null;
  loading: boolean;
}

export function useABTest(testName: string): ABTestResult {
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const initializeVariant = async () => {
      try {
        // First check localStorage
        const localStorageKey = `ab_test_${testName}`;
        const storedVariant = localStorage.getItem(localStorageKey) as ABTestVariant | null;

        if (storedVariant) {
          setVariant(storedVariant);
          setLoading(false);
          return;
        }

        // Randomly assign variant (50/50 split)
        const randomVariant: ABTestVariant = Math.random() < 0.5 ? 'short' : 'guided';
        
        // Store in localStorage immediately
        localStorage.setItem(localStorageKey, randomVariant);
        setVariant(randomVariant);

        // If user is authenticated, also store in user metadata
        if (user) {
          const currentMetadata = user.user_metadata || {};
          const updatedMetadata = {
            ...currentMetadata,
            [`ab_test_${testName}`]: randomVariant,
            [`ab_test_${testName}_assigned_at`]: new Date().toISOString()
          };

          await supabase.auth.updateUser({
            data: updatedMetadata
          });

          // Track variant assignment event
          await supabase.from('user_events').insert({
            user_id: user.id,
            event_name: 'ab_test_assigned',
            metadata: {
              test_name: testName,
              variant: randomVariant,
              assigned_at: new Date().toISOString()
            }
          });
        }
      } catch (error) {
        console.error('Error initializing A/B test variant:', error);
        // Fallback to random assignment stored only in localStorage
        const fallbackVariant: ABTestVariant = Math.random() < 0.5 ? 'short' : 'guided';
        localStorage.setItem(`ab_test_${testName}`, fallbackVariant);
        setVariant(fallbackVariant);
      } finally {
        setLoading(false);
      }
    };

    initializeVariant();
  }, [testName, user]);

  return { variant, loading };
}

export async function trackABTestEvent(
  testName: string, 
  eventName: string, 
  variant: ABTestVariant,
  additionalMetadata?: Record<string, any>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('user_events').insert({
        user_id: user.id,
        event_name: eventName,
        metadata: {
          test_name: testName,
          variant,
          timestamp: new Date().toISOString(),
          ...additionalMetadata
        }
      });
    }
  } catch (error) {
    console.error('Error tracking A/B test event:', error);
  }
}