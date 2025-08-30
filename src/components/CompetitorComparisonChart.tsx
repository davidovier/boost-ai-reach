import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Award } from 'lucide-react';

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

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: { isUser: boolean; domain: string }; value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const score = payload[0].value;
      const gradeInfo = getScoreGrade(score);
      
      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-xl backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            {data.isUser ? (
              <Award className="w-4 h-4 text-primary" />
            ) : (
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            )}
            <p className="font-semibold text-card-foreground">
              {data.isUser ? 'Your Site' : label}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">AI Findability Score</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-foreground">{score}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${gradeInfo.bg} ${gradeInfo.color}`}>
                  {gradeInfo.grade}
                </span>
              </div>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-300"
                style={{ width: `${score}%` }}
              />
            </div>
            
            {data.isUser && (
              <p className="text-xs text-primary font-medium mt-2">
                🎯 This is your website's performance
              </p>
            )}
          </div>
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
        <div className="relative">
          {/* Fade edges for horizontal scroll on mobile */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none sm:hidden" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none sm:hidden" />
          
          <div className="w-full overflow-x-auto scrollbar-hide">
            <div className="min-w-[400px] sm:min-w-[500px] h-80 px-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  barCategoryGap="20%"
                >
                  <defs>
                    <linearGradient id="userBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--primary-glow))" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="competitorBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    className="stroke-muted/50" 
                    horizontal={true}
                    vertical={false}
                  />
                  
                  <XAxis 
                    dataKey="domain" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${value}`}
                  />
                  
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  />
                  
                  <Bar 
                    dataKey="score" 
                    radius={[6, 6, 0, 0]}
                    stroke="hsl(var(--border))"
                    strokeWidth={1}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isUser ? 'url(#userBarGradient)' : 'url(#competitorBarGradient)'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {chartData.length > 3 && (
          <div className="flex items-center justify-center mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full">
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-muted-foreground/60" />
                <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                <div className="w-1 h-1 rounded-full bg-muted-foreground/60" />
              </div>
              <span>Scroll horizontally to see all competitors</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}