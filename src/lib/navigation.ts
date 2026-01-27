import { NavItem } from '@/components/docs/DocSidebar';

// Import the nav structure from DocSidebar
// We'll need to export it from there or duplicate it here
const navStructure: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/resources',
  },
  {
    id: 'collections',
    label: 'Avatar Collections',
    href: '/resources/avatar-collections',
  },
  {
    id: 'developers',
    label: 'For Developers',
    href: '/resources/developers',
    children: [
      {
        id: 'database',
        label: 'Avatar Database',
        href: '/resources/developers/database',
      },
      {
        id: 'website',
        label: 'Website Source Code',
        href: '/resources/developers/website',
      },
    ],
  },
  {
    id: 'about',
    label: 'About',
    href: '/resources/about',
    children: [
      {
        id: 'vrm',
        label: 'VRM Format',
        href: '/resources/about/vrm',
      },
      {
        id: 'ardrive',
        label: 'ArDrive Storage',
        href: '/resources/about/ardrive',
      },
      {
        id: 'philosophy',
        label: 'Open Source Philosophy',
        href: '/resources/about/philosophy',
      },
      {
        id: 'license',
        label: 'License Guide',
        href: '/resources/about/license',
      },
    ],
  },
  {
    id: 'help',
    label: 'Help & Contact',
    href: '/resources/help',
  },
];

/**
 * Flatten navigation structure to get all pages in order
 */
function flattenNav(items: NavItem[]): Array<{ href: string; title: string }> {
  const result: Array<{ href: string; title: string }> = [];
  
  items.forEach((item) => {
    result.push({ href: item.href, title: item.label });
    if (item.children) {
      item.children.forEach((child) => {
        result.push({ href: child.href, title: child.label });
      });
    }
  });
  
  return result;
}

// Descriptions for folder pages
const folderPageDescriptions: Record<string, string> = {
  '/resources/developers/database': 'JSON structure and GitHub repository',
  '/resources/developers/website': 'Gallery website GitHub repository',
  '/resources/about/vrm': 'Learn about the 3D avatar format we use',
  '/resources/about/ardrive': 'Permanent decentralized storage',
  '/resources/about/philosophy': 'Why we believe in open standards',
  '/resources/about/license': 'Understanding CC0 vs CC-BY licenses',
};

/**
 * Get folder pages for a given section
 */
export function getFolderPages(sectionHref: string): Array<{ title: string; description: string; href: string }> {
  const section = navStructure.find(item => item.href === sectionHref);
  
  if (!section || !section.children) {
    return [];
  }
  
  return section.children.map(child => ({
    title: child.label,
    description: folderPageDescriptions[child.href] || '',
    href: child.href,
  }));
}

/**
 * Get previous and next pages for navigation
 */
export function getPreviousNext(currentHref: string): {
  previous?: { title: string; href: string };
  next?: { title: string; href: string };
} {
  const allPages = flattenNav(navStructure);
  const currentIndex = allPages.findIndex(page => page.href === currentHref);
  
  if (currentIndex === -1) {
    return {};
  }
  
  return {
    previous: currentIndex > 0 ? allPages[currentIndex - 1] : undefined,
    next: currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : undefined,
  };
}
