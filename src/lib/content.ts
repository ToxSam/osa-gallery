import { parseMarkdown, getDocsPath, fileExists, MarkdownContent } from './markdown';

export interface ContentResult {
  content: string;
  metadata: MarkdownContent['data'];
  isTranslated: boolean;
  locale: string;
}

/**
 * Load content for a given locale and slug, with fallback to English if needed
 */
export async function loadContent(
  locale: string,
  slug: string[]
): Promise<ContentResult> {
  const defaultLocale = 'en';
  
  // Build paths
  const requestedPath = getDocsPath(locale, slug);
  const fallbackPath = getDocsPath(defaultLocale, slug);
  
  let content: MarkdownContent;
  let isTranslated = true;
  let actualLocale = locale;
  
  if (locale === defaultLocale) {
    // For English, always use English file
    if (!fileExists(requestedPath)) {
      throw new Error(`Content not found: ${requestedPath}`);
    }
    content = await parseMarkdown(requestedPath);
  } else {
    // For other locales, try locale-specific file first
    if (fileExists(requestedPath)) {
      // Translation exists
      content = await parseMarkdown(requestedPath);
      isTranslated = true;
    } else if (fileExists(fallbackPath)) {
      // Fall back to English
      content = await parseMarkdown(fallbackPath);
      isTranslated = false;
      actualLocale = defaultLocale;
    } else {
      throw new Error(`Content not found: ${requestedPath} or ${fallbackPath}`);
    }
  }
  
  return {
    content: content.content,
    metadata: content.data,
    isTranslated,
    locale: actualLocale
  };
}

/**
 * Get navigation structure from directory
 */
export function getNavigationStructure(locale: string): any[] {
  // This will be implemented to read directory structure
  // For now, return the existing structure
  // TODO: Implement directory-based navigation
  return [];
}
