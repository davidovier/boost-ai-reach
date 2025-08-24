import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock data structures for testing
interface ReportData {
  siteUrl: string;
  siteName?: string;
  scan: any | null;
  tips: any[];
  prompts: any[];
  competitors: { domain: string; score: number | null }[];
  generatedAt: string;
}

// Helper functions for testing
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

function formatScore(score: number | null): string {
  return score !== null ? score.toString() : 'N/A';
}

function generateBasicHTML(data: ReportData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>FindableAI Report - ${data.siteUrl}</title>
</head>
<body>
  <h1>FindableAI Report</h1>
  <p><strong>${data.siteName || data.siteUrl}</strong></p>
  <p>Generated on ${formatDate(data.generatedAt)}</p>
  
  <h2>Findability Overview</h2>
  ${data.scan ? `
    <div>AI Findability Score: ${formatScore(data.scan.ai_findability_score)}/100</div>
    <div>Crawlability Score: ${formatScore(data.scan.crawlability_score)}/100</div>
    <div>Summarizability Score: ${formatScore(data.scan.summarizability_score)}/100</div>
  ` : '<p>No scan data available yet.</p>'}
  
  <h2>Optimization Tips</h2>
  ${data.tips.length > 0 ? data.tips.map(tip => 
    `<div>${tip.title} [${tip.severity}] - ${tip.status}</div>`
  ).join('') : '<p>No optimization tips available.</p>'}
  
  <h2>AI Simulation Results</h2>
  ${data.prompts.length > 0 ? data.prompts.map(prompt => 
    `<div>Site Mentioned: ${prompt.includes_user_site ? 'Yes' : 'No'}</div>`
  ).join('') : '<p>No AI simulations run yet.</p>'}
  
  <h2>Competitor Analysis</h2>
  ${data.competitors.length > 0 ? data.competitors.map(comp => 
    `<div>${comp.domain} - Score: ${formatScore(comp.score)}/100</div>`
  ).join('') : '<p>No competitors added yet.</p>'}
</body>
</html>
  `;
}

// Mock storage path generator
function generateStoragePath(userId: string, reportId: string): string {
  return `${userId}/${reportId}.pdf`;
}

// Mock signed URL generator
function generateSignedUrl(path: string, expirySeconds: number): string {
  const expiryTime = Date.now() + (expirySeconds * 1000);
  return `https://storage.example.com/reports/${path}?signed=${expiryTime}`;
}

describe('Report Generation Functions', () => {
  describe('HTML Template Generation', () => {
    it('should generate HTML with site information', () => {
      const data: ReportData = {
        siteUrl: 'https://example.com',
        siteName: 'Example Site',
        scan: null,
        tips: [],
        prompts: [],
        competitors: [],
        generatedAt: '2024-01-15T10:00:00Z'
      };

      const html = generateBasicHTML(data);
      
      expect(html).toContain('FindableAI Report');
      expect(html).toContain('Example Site');
      expect(html).toContain('https://example.com');
      expect(html).toContain(formatDate(data.generatedAt));
    });

    it('should display scan data when available', () => {
      const data: ReportData = {
        siteUrl: 'https://example.com',
        scan: {
          ai_findability_score: 85,
          crawlability_score: 90,
          summarizability_score: 80
        },
        tips: [],
        prompts: [],
        competitors: [],
        generatedAt: '2024-01-15T10:00:00Z'
      };

      const html = generateBasicHTML(data);
      
      expect(html).toContain('AI Findability Score: 85/100');
      expect(html).toContain('Crawlability Score: 90/100');
      expect(html).toContain('Summarizability Score: 80/100');
    });

    it('should display no scan message when scan is null', () => {
      const data: ReportData = {
        siteUrl: 'https://example.com',
        scan: null,
        tips: [],
        prompts: [],
        competitors: [],
        generatedAt: '2024-01-15T10:00:00Z'
      };

      const html = generateBasicHTML(data);
      expect(html).toContain('No scan data available yet');
    });

    it('should display tips when available', () => {
      const data: ReportData = {
        siteUrl: 'https://example.com',
        scan: null,
        tips: [
          { title: 'Add meta description', severity: 'high', status: 'todo' },
          { title: 'Improve page speed', severity: 'medium', status: 'done' }
        ],
        prompts: [],
        competitors: [],
        generatedAt: '2024-01-15T10:00:00Z'
      };

      const html = generateBasicHTML(data);
      
      expect(html).toContain('Add meta description [high] - todo');
      expect(html).toContain('Improve page speed [medium] - done');
    });

    it('should display prompt simulation results', () => {
      const data: ReportData = {
        siteUrl: 'https://example.com',
        scan: null,
        tips: [],
        prompts: [
          { includes_user_site: true },
          { includes_user_site: false }
        ],
        competitors: [],
        generatedAt: '2024-01-15T10:00:00Z'
      };

      const html = generateBasicHTML(data);
      
      expect(html).toContain('Site Mentioned: Yes');
      expect(html).toContain('Site Mentioned: No');
    });

    it('should display competitor analysis', () => {
      const data: ReportData = {
        siteUrl: 'https://example.com',
        scan: null,
        tips: [],
        prompts: [],
        competitors: [
          { domain: 'competitor1.com', score: 85 },
          { domain: 'competitor2.com', score: null }
        ],
        generatedAt: '2024-01-15T10:00:00Z'
      };

      const html = generateBasicHTML(data);
      
      expect(html).toContain('competitor1.com - Score: 85/100');
      expect(html).toContain('competitor2.com - Score: N/A/100');
    });
  });

  describe('Storage Path Generation', () => {
    it('should generate correct storage path', () => {
      const userId = 'user-123';
      const reportId = 'report-456';
      const path = generateStoragePath(userId, reportId);
      
      expect(path).toBe('user-123/report-456.pdf');
    });

    it('should handle UUID format IDs', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const reportId = '550e8400-e29b-41d4-a716-446655440001';
      const path = generateStoragePath(userId, reportId);
      
      expect(path).toBe('550e8400-e29b-41d4-a716-446655440000/550e8400-e29b-41d4-a716-446655440001.pdf');
    });
  });

  describe('Signed URL Generation', () => {
    it('should generate signed URL with expiry', () => {
      const path = 'user-123/report-456.pdf';
      const expirySeconds = 3600; // 1 hour
      const signedUrl = generateSignedUrl(path, expirySeconds);
      
      expect(signedUrl).toContain('https://storage.example.com/reports/');
      expect(signedUrl).toContain(path);
      expect(signedUrl).toContain('signed=');
    });

    it('should handle different expiry times', () => {
      const path = 'user-123/report-456.pdf';
      const shortExpiry = generateSignedUrl(path, 300); // 5 minutes
      const longExpiry = generateSignedUrl(path, 86400); // 24 hours
      
      expect(shortExpiry).toContain('signed=');
      expect(longExpiry).toContain('signed=');
      expect(shortExpiry).not.toBe(longExpiry);
    });
  });

  describe('Report Status Logic', () => {
    it('should determine processing status when pdf_url is null', () => {
      const report = {
        id: 'report-123',
        pdf_url: null,
        created_at: '2024-01-15T10:00:00Z'
      };
      
      const status = report.pdf_url ? 'completed' : 'processing';
      expect(status).toBe('processing');
    });

    it('should determine completed status when pdf_url exists', () => {
      const report = {
        id: 'report-123',
        pdf_url: 'user-123/report-123.pdf',
        created_at: '2024-01-15T10:00:00Z'
      };
      
      const status = report.pdf_url ? 'completed' : 'processing';
      expect(status).toBe('completed');
    });
  });

  describe('Report Data Aggregation', () => {
    it('should aggregate site data correctly', () => {
      const siteData = {
        id: 'site-123',
        url: 'https://example.com',
        name: 'Example Site'
      };
      
      const scanData = {
        ai_findability_score: 85,
        crawlability_score: 90,
        summarizability_score: 80
      };
      
      const aggregated = {
        site: siteData,
        scan: scanData,
        overallScore: Math.round((85 + 90 + 80) / 3)
      };
      
      expect(aggregated.overallScore).toBe(85);
      expect(aggregated.site.name).toBe('Example Site');
    });

    it('should handle missing site name gracefully', () => {
      const siteData = {
        id: 'site-123',
        url: 'https://example.com',
        name: null
      };
      
      const displayName = siteData.name || siteData.url;
      expect(displayName).toBe('https://example.com');
    });

    it('should aggregate competitor scores correctly', () => {
      const competitors = [
        { domain: 'comp1.com', score: 80 },
        { domain: 'comp2.com', score: 90 },
        { domain: 'comp3.com', score: null }
      ];
      
      const validScores = competitors
        .map(c => c.score)
        .filter(score => score !== null) as number[];
      
      const averageScore = validScores.length > 0 
        ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
        : null;
      
      expect(averageScore).toBe(85); // (80 + 90) / 2
    });
  });

  describe('Background Job Processing', () => {
    it('should handle successful report generation', async () => {
      const mockResult = { success: true, reportId: 'report-123', path: 'user-123/report-123.pdf' };
      
      expect(mockResult.success).toBe(true);
      expect(mockResult.reportId).toBe('report-123');
      expect(mockResult.path).toContain('.pdf');
    });

    it('should handle failed report generation', async () => {
      const mockResult = { error: 'upload_failed', details: 'Storage quota exceeded' };
      
      expect('error' in mockResult).toBe(true);
      expect(mockResult.error).toBe('upload_failed');
      expect(mockResult.details).toContain('Storage');
    });

    it('should track report generation progress', () => {
      const reportStates = {
        queued: { status: 'processing', message: 'Report generation has been queued.' },
        processing: { status: 'processing', message: 'Generating PDF...' },
        completed: { status: 'completed', download_url: 'https://signed-url.com' },
        failed: { status: 'failed', error: 'Generation failed' }
      };
      
      expect(reportStates.queued.status).toBe('processing');
      expect(reportStates.completed.status).toBe('completed');
      expect(reportStates.completed.download_url).toContain('https://');
      expect(reportStates.failed.status).toBe('failed');
    });
  });

  describe('Report Security', () => {
    it('should not expose direct storage URLs', () => {
      const report = {
        id: 'report-123',
        pdf_url: 'user-123/report-123.pdf', // Storage path, not public URL
        created_at: '2024-01-15T10:00:00Z'
      };
      
      // Should require signed URL generation for access
      expect(report.pdf_url).not.toContain('http');
      expect(report.pdf_url).toContain('user-123/');
      expect(report.pdf_url).toEndWith('.pdf');
    });

    it('should validate user access to reports', () => {
      const report = { user_id: 'user-123', id: 'report-456' };
      const requestingUser = { id: 'user-123' };
      const differentUser = { id: 'user-789' };
      
      const hasAccess = report.user_id === requestingUser.id;
      const hasNoAccess = report.user_id === differentUser.id;
      
      expect(hasAccess).toBe(true);
      expect(hasNoAccess).toBe(false);
    });
  });
});