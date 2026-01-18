import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://opensourceavatars.com';
  const currentDate = new Date();

  // Static pages for both locales
  const locales = ['en', 'ja'];
  const staticPages = ['', '/gallery', '/about', '/resources', '/vrminspector', '/test'];

  const staticRoutes: MetadataRoute.Sitemap = [];

  locales.forEach(locale => {
    staticPages.forEach(page => {
      staticRoutes.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: currentDate,
        changeFrequency: page === '/gallery' ? 'daily' : 'weekly',
        priority: page === '' ? 1.0 : page === '/gallery' ? 0.9 : 0.7,
        alternates: {
          languages: {
            en: `${baseUrl}/en${page}`,
            ja: `${baseUrl}/ja${page}`,
          }
        }
      });
    });
  });

  // Add root redirects
  staticRoutes.push({
    url: baseUrl,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 1.0,
  });

  return staticRoutes;
}
