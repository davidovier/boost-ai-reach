import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CompetitorData {
  id: string;
  domain: string;
  score: number | null;
  isUser?: boolean;
}

interface CompetitorComparisonChartProps {
  userBaseline: number | null;
  competitors: CompetitorData[];
}

export function CompetitorComparisonChart({ userBaseline, competitors }: CompetitorComparisonChartProps) {
  const chartData = useMemo(() => {
    const data = [];
    
    // Add user baseline if available
    if (userBaseline !== null) {
      data.push({
        domain: 'Your Site',
        score: userBaseline,
        isUser: true,
      });
    }
    
    // Add competitors with valid scores
    competitors.forEach(comp => {
      if (comp.score !== null) {
        data.push({
          domain: comp.domain.length > 15 ? comp.domain.substring(0, 15) + '...' : comp.domain,
          score: comp.score,
          isUser: false,
        });
      }
    });
    
    // Sort by score descending
    return data.sort((a, b) => b.score - a.score);
  }, [userBaseline, competitors]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.isUser ? 'Your Site' : label}</p>
          <p className="text-sm text-muted-foreground">
            Score: <span className="font-medium text-foreground">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Findability Comparison</CardTitle>
          <CardDescription>Compare your site's performance against competitors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No data available for comparison
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Findability Comparison</CardTitle>
        <CardDescription>Compare your site's performance against competitors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[400px] h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="domain" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  className="fill-muted-foreground"
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isUser ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {chartData.length > 3 && (
          <p className="text-xs text-muted-foreground mt-2">
            Scroll horizontally to see all competitors
          </p>
        )}
      </CardContent>
    </Card>
  );
}