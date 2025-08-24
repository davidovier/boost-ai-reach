import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock data structures
interface ScorePoint {
  date: string;
  score: number;
}

interface ComparisonData {
  site: {
    id: string;
    name: string | null;
    url: string;
    scores: ScorePoint[];
    latestScore: number | null;
  };
  competitors: Array<{
    id: string;
    domain: string;
    notes: string | null;
    scores: ScorePoint[];
    latestScore: number | null;
  }>;
  summary: {
    userAverage: number | null;
    competitorAverage: number | null;
    userRank: number;
    totalEntities: number;
    performanceDelta: number | null;
  };
}

// Helper functions for testing
function calculateCompetitorAverage(competitors: any[]): number | null {
  const validScores = competitors
    .map(c => c.latestScore)
    .filter(score => score !== null) as number[];
  
  return validScores.length > 0 
    ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
    : null;
}

function calculateUserRank(userScore: number | null, competitorScores: number[]): number {
  if (userScore === null) return competitorScores.length + 1;
  
  const allScores = [userScore, ...competitorScores].sort((a, b) => b - a);
  return allScores.indexOf(userScore) + 1;
}

function calculatePerformanceDelta(userScore: number | null, competitorAverage: number | null): number | null {
  if (userScore === null || competitorAverage === null) return null;
  return Math.round((userScore - competitorAverage) * 100) / 100;
}

// Simple cache implementation for testing
class TestCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Simulate time passing for cache expiry testing
  simulateTimePass(ms: number): void {
    for (const [key, value] of this.cache.entries()) {
      this.cache.set(key, {
        data: value.data,
        timestamp: value.timestamp - ms
      });
    }
  }
}

describe('Competitors Compare Functions', () => {
  let testCache: TestCache;

  beforeEach(() => {
    testCache = new TestCache();
  });

  describe('Cache Management', () => {
    it('should store and retrieve data from cache', () => {
      const testData = { score: 85, timestamp: Date.now() };
      const key = 'test_user_site123';
      
      testCache.set(key, testData);
      const retrieved = testCache.get(key);
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent cache keys', () => {
      const result = testCache.get('non_existent_key');
      expect(result).toBe(null);
    });

    it('should expire cache after TTL', () => {
      const testData = { score: 85 };
      const key = 'test_key';
      
      testCache.set(key, testData);
      expect(testCache.get(key)).toEqual(testData);
      
      // Simulate 6 minutes passing (beyond 5-minute TTL)
      testCache.simulateTimePass(6 * 60 * 1000);
      expect(testCache.get(key)).toBe(null);
    });

    it('should handle cache size correctly', () => {
      expect(testCache.size()).toBe(0);
      
      testCache.set('key1', { data: 'test1' });
      testCache.set('key2', { data: 'test2' });
      expect(testCache.size()).toBe(2);
      
      testCache.clear();
      expect(testCache.size()).toBe(0);
    });
  });

  describe('Score Calculations', () => {
    it('should calculate competitor average correctly', () => {
      const competitors = [
        { latestScore: 80 },
        { latestScore: 90 },
        { latestScore: 70 }
      ];
      
      const average = calculateCompetitorAverage(competitors);
      expect(average).toBe(80); // (80 + 90 + 70) / 3
    });

    it('should handle competitors with null scores', () => {
      const competitors = [
        { latestScore: 80 },
        { latestScore: null },
        { latestScore: 90 }
      ];
      
      const average = calculateCompetitorAverage(competitors);
      expect(average).toBe(85); // (80 + 90) / 2
    });

    it('should return null when no competitors have scores', () => {
      const competitors = [
        { latestScore: null },
        { latestScore: null }
      ];
      
      const average = calculateCompetitorAverage(competitors);
      expect(average).toBe(null);
    });

    it('should calculate user rank correctly', () => {
      const userScore = 85;
      const competitorScores = [90, 80, 75, 95];
      
      const rank = calculateUserRank(userScore, competitorScores);
      expect(rank).toBe(3); // 95, 90, 85, 80, 75 -> user is 3rd
    });

    it('should handle user with highest score', () => {
      const userScore = 95;
      const competitorScores = [90, 80, 85];
      
      const rank = calculateUserRank(userScore, competitorScores);
      expect(rank).toBe(1); // User has the highest score
    });

    it('should handle user with null score', () => {
      const userScore = null;
      const competitorScores = [90, 80, 85];
      
      const rank = calculateUserRank(userScore, competitorScores);
      expect(rank).toBe(4); // Last position
    });
  });

  describe('Performance Delta Calculations', () => {
    it('should calculate positive performance delta', () => {
      const userScore = 85;
      const competitorAverage = 75;
      
      const delta = calculatePerformanceDelta(userScore, competitorAverage);
      expect(delta).toBe(10); // User is 10 points better
    });

    it('should calculate negative performance delta', () => {
      const userScore = 70;
      const competitorAverage = 85;
      
      const delta = calculatePerformanceDelta(userScore, competitorAverage);
      expect(delta).toBe(-15); // User is 15 points behind
    });

    it('should return null for null user score', () => {
      const userScore = null;
      const competitorAverage = 80;
      
      const delta = calculatePerformanceDelta(userScore, competitorAverage);
      expect(delta).toBe(null);
    });

    it('should return null for null competitor average', () => {
      const userScore = 85;
      const competitorAverage = null;
      
      const delta = calculatePerformanceDelta(userScore, competitorAverage);
      expect(delta).toBe(null);
    });

    it('should round delta to 2 decimal places', () => {
      const userScore = 85.666;
      const competitorAverage = 80.123;
      
      const delta = calculatePerformanceDelta(userScore, competitorAverage);
      expect(delta).toBe(5.54); // Rounded to 2 decimal places
    });
  });

  describe('Comparison Data Structure', () => {
    it('should structure complete comparison data correctly', () => {
      const mockData: ComparisonData = {
        site: {
          id: 'site-123',
          name: 'Test Site',
          url: 'https://example.com',
          scores: [
            { date: '2024-01-01', score: 80 },
            { date: '2024-01-02', score: 85 }
          ],
          latestScore: 85
        },
        competitors: [
          {
            id: 'comp-1',
            domain: 'competitor1.com',
            notes: 'Strong competitor',
            scores: [
              { date: '2024-01-01', score: 75 },
              { date: '2024-01-02', score: 80 }
            ],
            latestScore: 80
          },
          {
            id: 'comp-2',
            domain: 'competitor2.com', 
            notes: null,
            scores: [
              { date: '2024-01-01', score: 90 }
            ],
            latestScore: 90
          }
        ],
        summary: {
          userAverage: 85,
          competitorAverage: 85, // (80 + 90) / 2
          userRank: 2, // Behind competitor2.com (90)
          totalEntities: 3, // User + 2 competitors
          performanceDelta: 0 // 85 - 85 = 0
        }
      };

      // Validate structure
      expect(mockData.site.id).toBeDefined();
      expect(mockData.site.scores).toBeInstanceOf(Array);
      expect(mockData.competitors).toBeInstanceOf(Array);
      expect(mockData.summary.userRank).toBeGreaterThan(0);
      expect(mockData.summary.totalEntities).toBe(3);
    });

    it('should handle empty competitors list', () => {
      const mockData: ComparisonData = {
        site: {
          id: 'site-123',
          name: 'Test Site',
          url: 'https://example.com',
          scores: [{ date: '2024-01-01', score: 85 }],
          latestScore: 85
        },
        competitors: [],
        summary: {
          userAverage: 85,
          competitorAverage: null,
          userRank: 1, // Only entity
          totalEntities: 1,
          performanceDelta: null
        }
      };

      expect(mockData.competitors).toHaveLength(0);
      expect(mockData.summary.competitorAverage).toBe(null);
      expect(mockData.summary.userRank).toBe(1);
    });
  });

  describe('Score Array Processing', () => {
    it('should process score arrays with dates correctly', () => {
      const scores: ScorePoint[] = [
        { date: '2024-01-01T10:00:00Z', score: 75 },
        { date: '2024-01-02T10:00:00Z', score: 80 },
        { date: '2024-01-03T10:00:00Z', score: 85 }
      ];

      expect(scores).toHaveLength(3);
      expect(scores[0].score).toBe(75);
      expect(scores[scores.length - 1].score).toBe(85); // Latest score
    });

    it('should handle empty score arrays', () => {
      const scores: ScorePoint[] = [];
      const latestScore = scores.length > 0 ? scores[scores.length - 1].score : null;
      
      expect(latestScore).toBe(null);
    });

    it('should filter out null scores correctly', () => {
      const rawData = [
        { ai_findability_score: 80, scan_date: '2024-01-01' },
        { ai_findability_score: null, scan_date: '2024-01-02' },
        { ai_findability_score: 85, scan_date: '2024-01-03' }
      ];

      const validScores = rawData
        .filter(item => item.ai_findability_score !== null)
        .map(item => ({
          date: item.scan_date,
          score: item.ai_findability_score!
        }));

      expect(validScores).toHaveLength(2);
      expect(validScores[0].score).toBe(80);
      expect(validScores[1].score).toBe(85);
    });
  });
});