import { remark } from 'remark';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';

export interface MarkdownContent {
  content: string;
  data: {
    title?: string;
    description?: string;
    [key: string]: any;
  };
}

/**
 * Parse a markdown file and extract frontmatter and content
 */
export async function parseMarkdown(filePath: string): Promise<MarkdownContent> {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    
    // Process markdown to HTML
    const processedContent = await remark()
      .use(remarkGfm) // GitHub Flavored Markdown support
      .use(remarkHtml, { sanitize: false })
      .process(content);
    
    return {
      content: processedContent.toString(),
      data: data as MarkdownContent['data']
    };
  } catch (error) {
    throw new Error(`Failed to parse markdown file ${filePath}: ${error}`);
  }
}

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Get the full path to a markdown file in the docs directory
 * Tries readme.md first, then index.md, then file.md
 */
export function getDocsPath(locale: string, slug: string[]): string {
  if (slug.length === 0) {
    // Try readme.md first, then fall back to index.md for backwards compatibility
    const readmePath = path.join(process.cwd(), 'docs', locale, 'readme.md');
    if (fileExists(readmePath)) {
      return readmePath;
    }
    return path.join(process.cwd(), 'docs', locale, 'index.md');
  }
  
  // For folder pages, try readme.md first (e.g., developers/readme.md)
  const readmePath = path.join(process.cwd(), 'docs', locale, ...slug, 'readme.md');
  if (fileExists(readmePath)) {
    return readmePath;
  }
  
  // Try directory/index.md (e.g., avatar-collections/index.md) for backwards compatibility
  const dirPath = path.join(process.cwd(), 'docs', locale, ...slug, 'index.md');
  if (fileExists(dirPath)) {
    return dirPath;
  }
  
  // Fall back to file.md (e.g., about/vrm.md)
  const filePath = path.join(process.cwd(), 'docs', locale, ...slug) + '.md';
  return filePath;
}
