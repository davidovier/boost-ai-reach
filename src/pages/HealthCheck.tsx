import { useState, useEffect } from "react";
import { handleHealthCheck } from "@/api/health";

export default function HealthCheck() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      setLoading(true);
      const result = await handleHealthCheck();
      setStatus(result);
      setLoading(false);
    };

    checkHealth();
  }, []);

  if (loading) {
    return <div>Checking health...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">System Health</h1>
      <pre className="bg-muted p-4 rounded-lg">
        {JSON.stringify(status, null, 2)}
      </pre>
    </div>
  );
}