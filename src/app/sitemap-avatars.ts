import { MetadataRoute } from 'next';

// Fetch avatars from GitHub
async function getAvatars() {
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/ToxSam/open-source-avatars/main/data/avatars.json',
      { 
        cache: 'no-store',
        next: { revalidate: 3600 } // Revalidate every hour
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch avatars for sitemap');
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching avatars for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://opensourceavatars.com';
  const currentDate = new Date();
  const locales = ['en', 'ja'];

  const avatars = await getAvatars();
  const avatarRoutes: MetadataRoute.Sitemap = [];

  // Generate routes for each avatar in both locales
  avatars.forEach((avatar: any) => {
    // Only include public avatars
    if (avatar.is_public) {
      locales.forEach(locale => {
        avatarRoutes.push({
          url: `${baseUrl}/${locale}/avatars/${avatar.id}`,
          lastModified: new Date(avatar.updated_at || avatar.created_at || currentDate),
          changeFrequency: 'weekly',
          priority: 0.8,
          alternates: {
            languages: {
              en: `${baseUrl}/en/avatars/${avatar.id}`,
              ja: `${baseUrl}/ja/avatars/${avatar.id}`,
            }
          }
        });
      });
    }
  });

  return avatarRoutes;
}
