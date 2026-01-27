import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getDocsPath, getProjectRoot } from './markdown';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  content: string;
  href: string;
  locale: string;
}

/**
 * Get all markdown files recursively from a directory
 */
function getAllMarkdownFiles(dir: string, basePath: string = '', locale: string = 'en'): string[] {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...getAllMarkdownFiles(fullPath, relativePath, locale));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
    console.warn(`Could not read directory ${dir}:`, error);
  }
  
  return files;
}

/**
 * Extract slug from file path
 */
function getSlugFromPath(filePath: string, locale: string): string[] {
  const projectRoot = getProjectRoot();
  const docsPath = path.join(projectRoot, 'docs', locale);
  const relativePath = path.relative(docsPath, filePath);
  
  // Remove .md extension
  let slugPath = relativePath.replace(/\.md$/, '');
  
  // Remove /readme or /index if present (these are folder pages)
  slugPath = slugPath.replace(/\/(readme|index)$/, '');
  
  const slug = slugPath.split(path.sep).filter(Boolean);
  
  return slug;
}

/**
 * Build href from slug
 */
function buildHref(slug: string[], locale: string): string {
  if (slug.length === 0) {
    return `/${locale}/resources`;
  }
  return `/${locale}/resources/${slug.join('/')}`;
}

/**
 * Load all searchable content from markdown files
 */
export async function loadSearchableContent(locale: string = 'en'): Promise<SearchResult[]> {
  const projectRoot = getProjectRoot();
  const docsDir = path.join(projectRoot, 'docs', locale);
  const files = getAllMarkdownFiles(docsDir, '', locale);
  
  const results: SearchResult[] = [];
  
  for (const filePath of files) {
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);
      
      // Extract text content (remove markdown syntax for better search)
      const textContent = content
        .replace(/^#+\s+/gm, '') // Remove heading markers
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove link syntax, keep text
        .replace(/\*\*([^\*]+)\*\*/g, '$1') // Remove bold
        .replace(/\*([^\*]+)\*/g, '$1') // Remove italic
        .replace(/`([^`]+)`/g, '$1') // Remove code
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();
      
      const slug = getSlugFromPath(filePath, locale);
      const href = buildHref(slug, locale);
      
      results.push({
        id: slug.join('-') || 'index',
        title: data.title || slug[slug.length - 1] || 'Resources',
        description: data.description || '',
        content: textContent,
        href,
        locale,
      });
    } catch (error) {
      console.warn(`Failed to load search content from ${filePath}:`, error);
    }
  }
  
  return results;
}

/**
 * Search through content
 */
export function searchContent(
  query: string,
  content: SearchResult[]
): SearchResult[] {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter(Boolean);
  
  return content
    .map((item) => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery);
      const descriptionMatch = item.description.toLowerCase().includes(lowerQuery);
      const contentMatch = item.content.toLowerCase().includes(lowerQuery);
      
      // Calculate relevance score
      let score = 0;
      if (titleMatch) score += 10;
      if (descriptionMatch) score += 5;
      
      // Count word matches in content
      const contentLower = item.content.toLowerCase();
      queryWords.forEach((word) => {
        const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
        score += matches;
      });
      
      return { item, score, titleMatch, descriptionMatch, contentMatch };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      // Prioritize title/description matches
      if (a.titleMatch && !b.titleMatch) return -1;
      if (!a.titleMatch && b.titleMatch) return 1;
      if (a.descriptionMatch && !b.descriptionMatch) return -1;
      if (!a.descriptionMatch && b.descriptionMatch) return 1;
      // Then by score
      return b.score - a.score;
    })
    .slice(0, 10)
    .map(({ item }) => item);
}
