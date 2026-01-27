# Resources Page: Markdown-Based Migration Proposal

## Executive Summary

This document proposes migrating the resources documentation pages from hardcoded React components to a markdown-based content system, similar to GitBook. This will enable:
- **Single source of truth**: Content lives in markdown files that can be viewed on GitHub and rendered on the site
- **Easier content management**: Non-developers can edit documentation via markdown
- **Better maintainability**: Less code duplication across language variants
- **Version control**: Documentation changes tracked in git alongside code

### Key Decisions

1. **Folder Structure**: Create new `docs/` folder (separate from existing `doc/` internal dev docs)
   - `docs/en/` - English content
   - `docs/ja/` - Japanese content
   - Mirror structure for both languages

2. **Japanese Translation Handling** (Primary Concern):
   - **Recommended**: Mirror file structure with fallback to English
   - If Japanese file exists → use it
   - If missing → show English content with translation notice banner
   - Allows gradual translation and graceful degradation

3. **Route Mapping**:
   - `/en/resources/about/vrm` → reads `docs/en/about/vrm.md`
   - `/ja/resources/about/vrm` → reads `docs/ja/about/vrm.md` (or falls back to English)

---

## Current State Analysis

### What We Have

1. **UI Components** ✅
   - `DocLayout` - GitBook-like layout with sidebar, main content, and TOC
   - `DocSidebar` - Navigation sidebar with hardcoded structure
   - `DocContent` - Content wrapper with heading anchors
   - `DocBreadcrumb` - Breadcrumb navigation
   - `DocTOC` - Table of contents (auto-generated from headings)
   - `DocSearch` - Search functionality
   - Styling already in place with `.prose` classes

2. **Current Content Structure**
   - 39 resource page files across 3 locales (`/resources`, `/en/resources`, `/ja/resources`)
   - Content split between:
     - Hardcoded JSX in React components
     - JSON translation files (`src/locales/{locale}/resources.json`)
   - Navigation structure hardcoded in `DocSidebar.tsx`

3. **Current Issues**
   - Content duplication across locales (same structure, different files)
   - Hard to maintain (changes require editing React components)
   - Content not easily viewable on GitHub
   - Mixing of content (JSON) and presentation (JSX) concerns

### What We Need

1. **Markdown Processing**
   - No markdown library currently installed
   - Need to add `remark` and `remark-react` or similar
   - Need to handle frontmatter for metadata

2. **Content Organization**
   - New directory structure for markdown files
   - Separate from existing `doc/` folder (which is for internal dev docs)
   - Support for multi-language content

3. **Dynamic Routing**
   - Next.js App Router dynamic routes to read markdown files
   - Fallback handling for missing translations

---

## Proposed Architecture

### Folder Structure: `docs/` Directory

**Structure:**
```
docs/
  en/
    index.md                      # /resources (overview)
    avatar-collections/
      index.md                    # /resources/avatar-collections
      100avatars.md
      community.md
      license.md
    developers/
      index.md
      database.md
      website.md
    about/
      index.md
      vrm.md
      ardrive.md
      philosophy.md
    help.md
  ja/
    index.md                      # Same structure, Japanese content
    avatar-collections/
      index.md
      100avatars.md
      community.md
      license.md
    developers/
      index.md
      database.md
      website.md
    about/
      index.md
      vrm.md
      ardrive.md
      philosophy.md
    help.md
```

**Key Points:**
- New `docs/` folder at project root (separate from existing `doc/` internal dev docs)
- Mirror structure for `en/` and `ja/` folders
- Each markdown file corresponds to a URL route
- Matches GitBook-style organization

---

## Implementation Plan

### Phase 1: Setup & Infrastructure

1. **Install Dependencies**
   ```bash
   npm install remark remark-html remark-react remark-gfm gray-matter
   npm install --save-dev @types/gray-matter
   ```

2. **Create Content Directory Structure**
   ```
   docs/
     en/
       [markdown files]
     ja/
       [markdown files]
   ```

3. **Create Markdown Processing Utilities**
   - `src/lib/markdown.ts` - Parse markdown files
   - `src/lib/content.ts` - Content loading utilities
   - Support for frontmatter (title, description, etc.)

### Phase 2: Dynamic Route System

1. **Create Dynamic Route Handler**
   - `src/app/resources/[...slug]/page.tsx` - Catch-all route
   - `src/app/en/resources/[...slug]/page.tsx`
   - `src/app/ja/resources/[...slug]/page.tsx`
   - Reads markdown based on slug and locale
   - Falls back to default locale if translation missing

2. **Markdown to React Component**
   - Convert markdown to React components
   - Preserve existing styling (`.prose` classes)
   - Support code blocks (already have `CodeBlock` component)
   - Support custom components via MDX (optional, for future)

### Phase 3: Navigation System

1. **Dynamic Sidebar Generation**
   - Read directory structure to generate navigation
   - Or use a `_sidebar.json` or `_nav.json` config file
   - Support for nested structure
   - Auto-highlight current page

2. **Breadcrumb Generation**
   - Auto-generate from file path
   - Or from frontmatter metadata

### Phase 4: Content Migration

1. **Migrate Existing Content**
   - Convert JSON translations to markdown
   - Convert hardcoded JSX to markdown
   - Maintain all existing content
   - Test each page

2. **Update Components**
   - Keep existing `DocLayout`, `DocContent`, etc.
   - Just change content source from JSX to markdown

### Phase 5: Enhancements (Future)

1. **Search Integration**
   - Index markdown content for search
   - Full-text search across all pages

2. **MDX Support** (Optional)
   - Allow React components in markdown
   - For interactive elements

3. **GitHub Integration**
   - Link to GitHub edit page
   - Show last updated date from git

---

## File Structure Details

### Content Directory Structure
```
docs/
  en/
    index.md                      # Overview page (/resources)
    avatar-collections/
      index.md                    # Collections overview
      100avatars.md
      community.md
      license.md
    developers/
      index.md
      database.md
      website.md
    about/
      index.md
      vrm.md
      ardrive.md
      philosophy.md
    help.md
  ja/
    index.md                      # Same structure, Japanese content
    avatar-collections/
      index.md
      100avatars.md
      community.md
      license.md
    developers/
      index.md
      database.md
      website.md
    about/
      index.md
      vrm.md
      ardrive.md
      philosophy.md
    help.md
```

### Example Markdown File Structure

```markdown
---
title: "About VRM Format"
description: "VRM is a 3D avatar file format designed for games, VR, and virtual worlds."
---

# About VRM Format

VRM is a 3D avatar file format designed for games, VR, and virtual worlds.

## Why we use VRM:

- Works across multiple platforms (Unity, web browsers, VR apps)
- Open standard - not locked to one company
- Includes built-in rigging for easy animation
- Supports facial expressions and customization

## Compatible with:

- VRChat, VSeeFace, VTuber apps
- Unity (with UniVRM)
- Web browsers (with three-vrm)
- Unreal Engine (with VRM4U)

[Learn more about VRM →](https://vrm.dev/en/)
```

### Navigation Config (Optional)

Instead of hardcoding, use a config file:

```json
// docs/_nav.json (or per-locale: docs/en/_nav.json, docs/ja/_nav.json)
{
  "structure": [
    {
      "id": "overview",
      "label": "Overview",
      "path": "index.md"
    },
    {
      "id": "collections",
      "label": "Avatar Collections",
      "path": "avatar-collections/index.md",
      "children": [
        {
          "id": "100avatars",
          "label": "100Avatars Series",
          "path": "avatar-collections/100avatars.md"
        }
      ]
    }
  ]
}
```

Or auto-generate from directory structure (recommended - keeps structure in sync automatically).

---

## Technical Implementation Details

### Markdown Processing

```typescript
// src/lib/markdown.ts
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

export async function parseMarkdown(filePath: string): Promise<MarkdownContent> {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  
  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkHtml)
    .process(content);
  
  return {
    content: processedContent.toString(),
    data
  };
}
```

### Dynamic Route Handler

```typescript
// src/app/resources/[...slug]/page.tsx
import { parseMarkdown } from '@/lib/markdown';
import { DocLayout } from '@/components/docs/DocLayout';
import { DocContent } from '@/components/docs/DocContent';

export default async function ResourcePage({ 
  params 
}: { 
  params: { slug?: string[] } 
}) {
  const slug = params.slug || [];
  const locale = 'en'; // Get from context/params
  
  // Build file path
  const filePath = slug.length === 0 
    ? `docs/${locale}/index.md`
    : `docs/${locale}/${slug.join('/')}.md`;
  
  const { content, data } = await parseMarkdown(filePath);
  
  return (
    <DocLayout>
      <DocContent>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </DocContent>
    </DocLayout>
  );
}
```

**Note:** For better security and React integration, consider using `remark-react` instead of `remark-html`:

```typescript
import { remark } from 'remark';
import remarkReact from 'remark-react';

// Returns React components instead of HTML string
```

---

## Migration Strategy

### Step-by-Step Approach

1. **Create new `docs/` directory** at project root (separate from `doc/` internal docs)
2. **Set up markdown processing** utilities
3. **Create dynamic route** that reads markdown
4. **Migrate one page** as proof of concept (e.g., `/resources/about/vrm`)
5. **Test thoroughly** - ensure styling, navigation, etc. work
6. **Migrate remaining pages** one section at a time
7. **Update navigation** to be dynamic
8. **Remove old page files** once migration complete
9. **Clean up** unused translation JSON entries

### Backward Compatibility

- Keep old routes working during migration
- Use feature flag to switch between old/new system
- Gradual migration reduces risk

---

## Benefits

1. **Single Source of Truth**
   - Content in markdown files viewable on GitHub
   - Same content for both GitHub and website

2. **Easier Content Management**
   - Non-developers can edit markdown
   - No need to understand React/JSX
   - Standard markdown syntax

3. **Better Version Control**
   - Documentation changes tracked in git
   - Easy to see what changed
   - Can review documentation PRs

4. **Reduced Code Duplication**
   - One dynamic route instead of 39 page files
   - Navigation auto-generated
   - Less maintenance burden

5. **Future Flexibility**
   - Easy to add new pages (just add markdown file)
   - Can add MDX for interactive components later
   - Can integrate with headless CMS if needed

---

## Japanese Translation Handling - Detailed Analysis

Since Japanese translation is a primary concern, here's a comprehensive breakdown:

### Current Translation System

Your current setup:
- Middleware detects locale from URL (`/en/` or `/ja/`)
- Routes: `/en/resources/...` and `/ja/resources/...`
- Translation files: `src/locales/en/resources.json` and `src/locales/ja/resources.json`
- i18n system loads translations based on locale

### Proposed Markdown Translation System

**File Structure:**
```
docs/
  en/
    about/
      vrm.md          ← English content
  ja/
    about/
      vrm.md          ← Japanese content (if exists)
```

**Route Handling:**
- `/en/resources/about/vrm` → reads `docs/en/about/vrm.md`
- `/ja/resources/about/vrm` → reads `docs/ja/about/vrm.md` (or falls back to English)

### Translation Strategy Options

#### Option 1: Mirror Structure with Fallback (RECOMMENDED)

**How it works:**
1. Create English markdown: `docs/en/about/vrm.md`
2. When translated, create: `docs/ja/about/vrm.md`
3. Route handler:
   - If Japanese file exists → use it
   - If missing → use English + show banner

**Pros:**
- ✅ Clear what's translated (file exists or doesn't)
- ✅ Graceful degradation (always shows content)
- ✅ Can translate incrementally
- ✅ Easy to track translation progress

**Cons:**
- ⚠️ Need to maintain parallel structure
- ⚠️ If you add new English page, need to remember to create Japanese placeholder

**Visual Indicator Options:**
```markdown
<!-- Option A: Banner at top -->
<div class="translation-notice">
  ⚠️ This page is not yet translated. Showing English version.
</div>

<!-- Option B: Small badge -->
<span class="translation-badge">EN</span>

<!-- Option C: Link to English version -->
<p>日本語版は準備中です。 <a href="/en/resources/...">English version</a></p>
```

#### Option 2: Strict Translation Required

**How it works:**
- If Japanese file doesn't exist → show 404 or "Coming Soon" page
- No fallback to English

**Pros:**
- ✅ Forces complete translation before publishing
- ✅ No confusion about language

**Cons:**
- ❌ Users see no content if not translated
- ❌ Slower to publish new content (need both languages)

#### Option 3: Translation Status File

**How it works:**
- Track translation status in `docs/_status.json`:
```json
{
  "about/vrm": { "en": true, "ja": true },
  "about/ardrive": { "en": true, "ja": false }
}
```
- Use this to show/hide pages or show translation status

**Pros:**
- ✅ Can show translation progress
- ✅ Can hide untranslated pages

**Cons:**
- ❌ Extra file to maintain
- ❌ Can get out of sync with actual files

### Recommended Implementation

**Use Option 1 (Mirror Structure with Fallback)** with these features:

1. **File Detection:**
   ```typescript
   // Check if Japanese file exists
   const jaFile = `docs/ja/${path}.md`;
   const enFile = `docs/en/${path}.md`;
   
   const hasJapanese = await fileExists(jaFile);
   ```

2. **Fallback Logic:**
   ```typescript
   if (locale === 'ja' && !hasJapanese) {
     // Use English content
     content = await loadMarkdown(enFile);
     showTranslationBanner = true;
   } else {
     // Use appropriate language
     content = await loadMarkdown(locale === 'ja' ? jaFile : enFile);
   }
   ```

3. **Translation Banner Component:**
   ```tsx
   {showTranslationBanner && (
     <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
       <p className="text-sm">
         このページはまだ日本語に翻訳されていません。
         <a href={`/en${pathname}`} className="underline ml-2">
           English version →
         </a>
       </p>
     </div>
   )}
   ```

4. **Translation Progress Tracking:**
   - Can add a script to check which pages are translated
   - Generate a report: "X of Y pages translated"
   - Help prioritize translation work

### Workflow for Adding New Content

1. **Create English version first:**
   ```
   docs/en/new-section/page.md
   ```

2. **Test it works:**
   - Visit `/en/resources/new-section/page`
   - Verify content displays correctly

3. **Create Japanese version when ready:**
   ```
   docs/ja/new-section/page.md
   ```

4. **Japanese version automatically used:**
   - Visit `/ja/resources/new-section/page`
   - Shows Japanese content (no banner)

### Handling Navigation in Japanese

**Sidebar Navigation:**
- Can show all pages (even untranslated ones)
- Or hide untranslated pages
- Or show with indicator (e.g., "EN" badge)

**Recommendation:** Show all pages, but indicate translation status:
```tsx
<NavItem>
  VRM Format
  {!isTranslated && <span className="badge">EN</span>}
</NavItem>
```

### Migration Strategy for Translations

1. **Phase 1:** Migrate English content to markdown
2. **Phase 2:** Test English version works
3. **Phase 3:** Migrate existing Japanese translations from JSON to markdown
4. **Phase 4:** Identify missing translations
5. **Phase 5:** Translate missing pages (or show English with banner)

---

## Considerations & Challenges

### 1. **Japanese Translation Handling** ⚠️ PRIMARY CONCERN

This is the main concern. Here are several strategies:

#### Strategy A: Mirror File Structure (Recommended)
- **Approach**: Keep exact same file structure in `docs/en/` and `docs/ja/`
- **How it works**: 
  - `/en/resources/about/vrm` → reads `docs/en/about/vrm.md`
  - `/ja/resources/about/vrm` → reads `docs/ja/about/vrm.md`
- **Pros**: 
  - Clear separation of languages
  - Easy to see what's translated
  - Missing files are obvious (file doesn't exist)
- **Cons**: 
  - Need to maintain parallel structure
  - If structure changes, need to update both

#### Strategy B: Fallback to English
- **Approach**: Try Japanese file first, fall back to English if missing
- **How it works**:
  ```typescript
  // Try Japanese first
  let filePath = `docs/ja/${path}.md`;
  if (!fileExists(filePath)) {
    // Fall back to English
    filePath = `docs/en/${path}.md`;
    // Optionally show a banner: "This page is not yet translated"
  }
  ```
- **Pros**: 
  - Graceful degradation
  - Can gradually translate pages
  - Users always see content (even if in English)
- **Cons**: 
  - Need to handle missing translations
  - May show English content to Japanese users

#### Strategy C: Frontmatter Language Tags
- **Approach**: Single file with language sections in frontmatter
- **How it works**:
  ```markdown
  ---
  lang: en
  title: "About VRM"
  ---
  # About VRM Format
  ...
  ```
  Then have `docs/ja/vrm.md` with Japanese content
- **Pros**: Can add metadata per language
- **Cons**: Still need separate files, adds complexity

#### Strategy D: Translation Status Tracking
- **Approach**: Track which pages are translated in a config file
- **How it works**:
  ```json
  // docs/_translations.json
  {
    "en": {
      "about/vrm": true,
      "about/ardrive": true
    },
    "ja": {
      "about/vrm": true,
      "about/ardrive": false  // Not translated yet
    }
  }
  ```
- **Pros**: Can show translation status, plan work
- **Cons**: Extra file to maintain

#### **Recommended: Strategy A + B Hybrid**
- Use mirror file structure (`docs/en/` and `docs/ja/`)
- Implement fallback: if Japanese file doesn't exist, show English with a banner
- This gives you:
  - Clear organization (easy to see what's translated)
  - Graceful degradation (users always see content)
  - Ability to translate incrementally
  - Visual indicator when content isn't translated yet

**Implementation Example:**
```typescript
// In route handler
const locale = params.locale || 'en'; // from URL: /en/resources/... or /ja/resources/...
const slug = params.slug || [];

// Build paths
const jaPath = `docs/ja/${slug.join('/') || 'index'}.md`;
const enPath = `docs/en/${slug.join('/') || 'index'}.md`;

let content, metadata, isTranslated;

if (locale === 'ja') {
  // Try Japanese first
  if (fileExists(jaPath)) {
    ({ content, metadata } = await parseMarkdown(jaPath));
    isTranslated = true;
  } else {
    // Fall back to English
    ({ content, metadata } = await parseMarkdown(enPath));
    isTranslated = false;
    // Show banner: "This page is not yet translated. Showing English version."
  }
} else {
  // English - always use English file
  ({ content, metadata } = await parseMarkdown(enPath));
  isTranslated = true;
}
```

**Translation Workflow:**
1. Create English markdown file: `docs/en/about/vrm.md`
2. When ready to translate, create: `docs/ja/about/vrm.md`
3. Site automatically uses Japanese version when available
4. If Japanese file missing, shows English with translation notice

### 2. **Dynamic Content**
- **Challenge**: Some pages have dynamic content (e.g., database page fetches collections)
- **Solution**: 
  - Use MDX for pages that need React components
  - Or keep those pages as React components, use markdown for static content
  - Hybrid approach is fine

### 3. **Navigation Structure**
- **Challenge**: Sidebar currently hardcoded
- **Solution**: 
  - Auto-generate from directory structure
  - Or use config file (`_nav.json`)
  - Or read from frontmatter in each file

### 4. **SEO & Metadata**
- **Challenge**: Need page titles, descriptions for SEO
- **Solution**: Use frontmatter in markdown files, generate metadata in route handler

### 5. **Code Blocks**
- **Challenge**: Need syntax highlighting
- **Solution**: Already have `CodeBlock` component, integrate with markdown processor

### 6. **Links Between Pages**
- **Challenge**: Markdown links need to work with Next.js routing
- **Solution**: 
  - Use relative paths: `[text](./other-page.md)` or `[text](../section/page.md)`
  - Process links in markdown to convert to Next.js routes
  - Or use absolute paths: `[text](/resources/about/vrm)`

---

## Recommended Approach

### Hybrid Strategy (Best of Both Worlds)

1. **Static content → Markdown**
   - Pages like "About VRM", "ArDrive", "Philosophy" → Markdown
   - Pure documentation pages

2. **Dynamic content → Keep as React**
   - Pages like "Database" (fetches collections) → Keep as React component
   - Can embed markdown content within React component if needed

3. **Navigation → Auto-generate from directory**
   - Read `docs/{locale}/` directory structure
   - Generate navigation automatically
   - Keeps structure in sync between languages
   - Or use config file if needed: `docs/_nav.json`

### Implementation Priority

1. **Phase 1**: Set up infrastructure (markdown processing, content directory)
2. **Phase 2**: Migrate 2-3 simple pages as proof of concept
3. **Phase 3**: Create dynamic route system
4. **Phase 4**: Migrate remaining static pages
5. **Phase 5**: Update navigation to be dynamic
6. **Phase 6**: Clean up old files

---

## Next Steps

1. **Review this proposal** - Discuss any concerns or modifications
2. **Decide on translation strategy** - How to handle missing Japanese translations (fallback vs 404)
3. **Create `docs/` folder structure** - Set up `docs/en/` and `docs/ja/` directories
4. **Create proof of concept** - Migrate one page (e.g., `/resources/about/vrm`) to validate approach
5. **Test translation handling** - Verify fallback behavior works correctly
6. **Plan migration timeline** - Gradual or all-at-once
7. **Migrate content** - Page by page, test as you go
8. **Update navigation** - Make sidebar dynamic based on directory structure

---

## Questions to Consider

1. **Should we keep some pages as React components?** (e.g., database page with API calls)
2. **How should we handle navigation?** (auto-generate vs config file)
3. **Do we need MDX support?** (for interactive components in markdown)
4. **Should we add "Edit on GitHub" links?** (common in GitBook-style docs)
5. **How to handle missing Japanese translations?** 
   - **Recommended**: Fallback to English with visual indicator
   - Show banner: "This page is not yet translated. Showing English version."
   - Or: Show 404/not found page
   - Or: Redirect to English version
6. **Should we add a build-time step?** (pre-process markdown at build time for performance)

---

## Conclusion

Migrating to markdown-based content in a `docs/` folder will significantly improve maintainability and align with GitBook-style documentation. The existing UI components are already in place, so this is primarily a content architecture change rather than a UI redesign.

### Key Decisions Needed:

1. **Translation Strategy**: 
   - ✅ **Recommended**: Mirror file structure (`docs/en/` and `docs/ja/`) with fallback to English
   - This allows gradual translation and graceful degradation

2. **Missing Translation Handling**:
   - Show English content with a banner/notice?
   - Or show 404/not found?
   - Or redirect to English version?

3. **Navigation**:
   - Auto-generate from directory structure (recommended)
   - Or use config file for more control

### Implementation Approach:

- **Static content → Markdown** (most pages)
- **Dynamic content → Keep as React** (e.g., database page with API calls)
- **Hybrid is fine** - not everything needs to be markdown

**Estimated effort**: 2-3 days for infrastructure + 1-2 days for content migration = **4-5 days total**

---

*This proposal is a living document and should be updated as we learn more during implementation.*
