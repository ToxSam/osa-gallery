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
 * Get the project root directory, handling both development and standalone builds
 */
export function getProjectRoot(): string {
  const cwd = process.cwd();
  
  // Try multiple possible locations for the docs folder
  const possiblePaths = [
    { docsPath: path.join(cwd, 'docs'), root: cwd }, // Standard location (development)
    { docsPath: path.join(cwd, '..', 'docs'), root: path.join(cwd, '..') }, // If we're in .next/standalone, docs might be one level up
    { docsPath: path.join(cwd, '..', '..', 'docs'), root: path.join(cwd, '..', '..') }, // If we're deeper in the structure
  ];
  
  // Find the first path that exists
  for (const { docsPath, root } of possiblePaths) {
    if (fileExists(docsPath)) {
      // Verify it's actually a directory and has the expected structure
      try {
        const stats = fs.statSync(docsPath);
        if (stats.isDirectory()) {
          // Check if it has the expected locale subdirectories
          const enPath = path.join(docsPath, 'en');
          const jaPath = path.join(docsPath, 'ja');
          if (fileExists(enPath) || fileExists(jaPath)) {
            return root;
          }
        }
      } catch (e) {
        // Continue to next path
        continue;
      }
    }
  }
  
  // Fallback to current working directory
  return cwd;
}

/**
 * Get the full path to a markdown file in the docs directory
 * Tries readme.md first, then index.md, then file.md
 */
export function getDocsPath(locale: string, slug: string[]): string {
  const projectRoot = getProjectRoot();
  
  if (slug.length === 0) {
    // Try readme.md first, then fall back to index.md for backwards compatibility
    const readmePath = path.join(projectRoot, 'docs', locale, 'readme.md');
    if (fileExists(readmePath)) {
      return readmePath;
    }
    return path.join(projectRoot, 'docs', locale, 'index.md');
  }
  
  // For folder pages, try readme.md first (e.g., developers/readme.md)
  const readmePath = path.join(projectRoot, 'docs', locale, ...slug, 'readme.md');
  if (fileExists(readmePath)) {
    return readmePath;
  }
  
  // Try directory/index.md (e.g., avatar-collections/index.md) for backwards compatibility
  const dirPath = path.join(projectRoot, 'docs', locale, ...slug, 'index.md');
  if (fileExists(dirPath)) {
    return dirPath;
  }
  
  // Fall back to file.md (e.g., about/vrm.md)
  const filePath = path.join(projectRoot, 'docs', locale, ...slug) + '.md';
  return filePath;
}
