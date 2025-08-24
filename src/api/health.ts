import { supabase } from "@/integrations/supabase/client";

export async function handleHealthCheck() {
  try {
    const { data, error } = await supabase.functions.invoke('health');
    
    if (error) {
      console.error('Health check error:', error);
      return {
        status: 'error',
        message: error.message,
        time: new Date().toISOString()
      };
    }
    
    return data;
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'error',
      message: 'Health check failed',
      time: new Date().toISOString()
    };
  }
}