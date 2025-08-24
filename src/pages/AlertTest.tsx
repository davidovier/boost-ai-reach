import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Alert {
  id: string;
  alert_type: string;
  type: string;
  message: string;
  severity: string;
  metadata?: { simulated?: boolean };
  created_at: string;
}

export default function AlertTest() {
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState<string>("");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { toast } = useToast();

  const simulateError = async () => {
    if (!errorType) {
      toast({
        title: "Error",
        description: "Please select an error type to simulate",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('alerting', {
        body: { errorType },
        method: 'POST'
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: `Simulated ${errorType} alert triggered successfully`
        });
        loadAlerts(); // Refresh alerts list
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error simulating alert:', error);
      toast({
        title: "Error",
        description: `Failed to simulate alert: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('alerting');
      
      if (error) throw error;
      
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast({
        title: "Error",
        description: `Failed to load alerts: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const runHealthCheck = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('alerting', {
        method: 'GET',
        body: { action: 'check' }
      });
      
      if (error) throw error;
      
      toast({
        title: "Health Check",
        description: "Alert system health check completed"
      });
      
      loadAlerts(); // Refresh to see any new alerts
    } catch (error) {
      console.error('Error running health check:', error);
      toast({
        title: "Error",
        description: `Health check failed: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Load alerts on mount
  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Alert System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Error Type to Simulate
              </label>
              <Select value={errorType} onValueChange={setErrorType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select error type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5xx_spike">5xx Error Spike</SelectItem>
                  <SelectItem value="stripe_webhook_fail">Stripe Webhook Failure</SelectItem>
                  <SelectItem value="openai_timeout">OpenAI Timeout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={simulateError} 
              disabled={loading || !errorType}
              className="px-6"
            >
              {loading ? "Simulating..." : "Simulate Alert"}
            </Button>
            <Button 
              variant="outline" 
              onClick={runHealthCheck}
              className="px-6"
            >
              Run Health Check
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-muted-foreground">No alerts found</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.severity === 'critical' ? 'border-l-red-500 bg-red-50' :
                    alert.severity === 'high' ? 'border-l-orange-500 bg-orange-50' :
                    alert.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                    'border-l-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{alert.type}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                      {alert.metadata?.simulated && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          SIMULATED
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}