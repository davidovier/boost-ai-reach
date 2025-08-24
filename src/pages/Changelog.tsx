import { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, Tag, Rss, FileJson } from 'lucide-react';
import { Suspense } from 'react';
import { LazyReactMarkdown, MarkdownLoader } from '@/components/lazy/LazyMarkdown';
import { SEO } from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { stringifyJsonLd } from '@/lib/seo';

interface ChangelogEntry {
  version: string;
  date: string;
  content: string;
  tags: string[];
}

export default function Changelog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [changelogContent, setChangelogContent] = useState('');
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch changelog content
    fetch('/CHANGELOG.md')
      .then(response => response.text())
      .then(content => {
        setChangelogContent(content);
        parseChangelog(content);
      })
      .catch(error => {
        console.error('Error loading changelog:', error);
        setChangelogContent('# Changelog\n\nChangelog not available.');
        setLoading(false);
      });
  }, []);

  const parseChangelog = (content: string) => {
    const lines = content.split('\n');
    const parsedEntries: ChangelogEntry[] = [];
    let currentEntry: Partial<ChangelogEntry> | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      // Match version headers like ## [1.2.0] - 2024-01-15
      const versionMatch = line.match(/^##\s*\[([^\]]+)\]\s*-\s*(.+)$/);
      
      if (versionMatch) {
        // Save previous entry if exists
        if (currentEntry) {
          const content = currentContent.join('\n').trim();
          const tags = extractTags(content);
          parsedEntries.push({
            ...currentEntry,
            content,
            tags
          } as ChangelogEntry);
        }

        // Start new entry
        currentEntry = {
          version: versionMatch[1],
          date: versionMatch[2]
        };
        currentContent = [];
      } else if (currentEntry && !line.startsWith('# ')) {
        // Add content to current entry (exclude main title)
        currentContent.push(line);
      }
    }

    // Don't forget the last entry
    if (currentEntry) {
      const content = currentContent.join('\n').trim();
      const tags = extractTags(content);
      parsedEntries.push({
        ...currentEntry,
        content,
        tags
      } as ChangelogEntry);
    }

    setEntries(parsedEntries);
    setLoading(false);
  };

  const extractTags = (content: string): string[] => {
    const tags = new Set<string>();
    
    // Extract category headers (Added, Changed, Fixed, Security, etc.)
    const categoryMatches = content.match(/^###\s+(.+)$/gm);
    if (categoryMatches) {
      categoryMatches.forEach(match => {
        const category = match.replace(/^###\s+/, '').toLowerCase();
        tags.add(category);
      });
    }

    // Extract special tags from content
    if (content.includes('Critical') || content.includes('CRITICAL')) tags.add('critical');
    if (content.includes('Security') || content.includes('SECURITY')) tags.add('security');
    if (content.includes('Bug Fix') || content.includes('BUG FIX')) tags.add('bugfix');
    if (content.includes('New Feature') || content.includes('NEW FEATURE')) tags.add('feature');
    if (content.includes('Enhancement') || content.includes('ENHANCEMENT')) tags.add('enhancement');
    if (content.includes('Breaking') || content.includes('BREAKING')) tags.add('breaking');

    return Array.from(tags);
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = searchTerm === '' || 
        entry.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.date.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTag = selectedTag === null || entry.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [entries, searchTerm, selectedTag]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach(entry => {
      entry.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  const getTagColor = (tag: string) => {
    const colorMap: Record<string, string> = {
      'critical': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'security': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'bugfix': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'feature': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'enhancement': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'breaking': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'added': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'changed': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'fixed': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'deprecated': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'removed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colorMap[tag] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: 'FindableAI Changelog',
    description: 'Complete changelog and version history for FindableAI platform updates, features, and improvements.',
    url: `${origin}/changelog`,
    author: {
      '@type': 'Organization',
      name: 'FindableAI',
      url: origin
    },
    dateModified: entries.length > 0 ? entries[0].date : new Date().toISOString().split('T')[0],
    datePublished: entries.length > 0 ? entries[entries.length - 1].date : new Date().toISOString().split('T')[0],
    version: entries.length > 0 ? entries[0].version : '1.0.0',
    isAccessibleForFree: true,
    inLanguage: 'en-US',
    genre: 'software documentation'
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading changelog...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <SEO 
        title="Changelog"  
        description="Stay updated with the latest FindableAI features, improvements, bug fixes, and security updates. Complete version history and release notes."
        url="/changelog"
        ogType="article"
        keywords="FindableAI updates, product changelog, new features, improvements, release notes"
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(structuredData) }} 
      />

      {/* RSS and JSON Feed Links */}
      <link 
        rel="alternate" 
        type="application/rss+xml" 
        title="FindableAI Changelog RSS" 
        href={`${origin}/changelog.rss`} 
      />
      <link 
        rel="alternate" 
        type="application/json" 
        title="FindableAI Changelog JSON Feed" 
        href={`${origin}/changelog.json`} 
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Changelog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest features, improvements, and fixes to the FindableAI platform.
          </p>
          
          {/* Feed Links */}
          <div className="flex justify-center gap-4 mt-6">
            <Button variant="outline" size="sm" asChild>
              <a href="/changelog.rss" className="flex items-center gap-2">
                <Rss className="h-4 w-4" />
                RSS Feed
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/changelog.json" className="flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                JSON Feed
              </a>
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search versions, features, or fixes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedTag === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(null)}
                >
                  All
                </Button>
                {allTags.slice(0, 6).map(tag => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className="capitalize"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
            
            {searchTerm && (
              <p className="text-sm text-muted-foreground mt-4">
                Found {filteredEntries.length} {filteredEntries.length === 1 ? 'version' : 'versions'} matching "{searchTerm}"
              </p>
            )}
          </CardContent>
        </Card>

        {/* Changelog Entries */}
        <div className="space-y-8">
          {filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No changelog entries found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            filteredEntries.map((entry, index) => (
              <Card key={entry.version} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Version Header */}
                  <div className="bg-secondary/50 p-6 border-b">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">
                          Version {entry.version}
                        </h2>
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          <time dateTime={entry.date}>{entry.date}</time>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map(tag => (
                          <Badge 
                            key={tag}
                            variant="secondary"
                            className={`${getTagColor(tag)} capitalize cursor-pointer hover:opacity-80`}
                            onClick={() => setSelectedTag(tag)}
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
                      <Suspense fallback={<MarkdownLoader />}>
                        <LazyReactMarkdown 
                          remarkPlugins={[]}
                          components={{
                            h3: ({ children, ...props }) => (
                              <h3 className="text-lg font-semibold mb-3 mt-6 first:mt-0 text-foreground" {...props}>
                                {children}
                              </h3>
                            ),
                            ul: ({ children, ...props }) => (
                              <ul className="space-y-1 mb-4" {...props}>
                                {children}
                              </ul>
                            ),
                            li: ({ children, ...props }) => (
                              <li className="text-muted-foreground" {...props}>
                                {children}
                              </li>
                            ),
                            strong: ({ children, ...props }) => (
                              <strong className="text-foreground font-semibold" {...props}>
                                {children}
                              </strong>
                            )
                          }}
                        >
                          {entry.content}
                        </LazyReactMarkdown>
                      </Suspense>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            This changelog follows the{' '}
            <a 
              href="https://keepachangelog.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Keep a Changelog
            </a>{' '}
            format and{' '}
            <a 
              href="https://semver.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Semantic Versioning
            </a>{' '}
            principles.
          </p>
        </div>
      </main>
    </>
  );
}