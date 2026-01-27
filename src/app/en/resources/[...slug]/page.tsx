import React from 'react';
import { notFound } from 'next/navigation';
import { AvatarHeader } from "@/components/avatar/AvatarHeader";
import { Footer } from "@/components/Footer";
import { DocLayout } from "@/components/docs/DocLayout";
import { DocContent } from "@/components/docs/DocContent";
import { DocNavigation } from "@/components/docs/DocNavigation";
import { loadContent } from "@/lib/content";
import { getPreviousNext } from "@/lib/navigation";

interface PageProps {
  params: {
    slug?: string[];
  };
}

export default async function ResourcePage({ params }: PageProps) {
  const slug = params.slug || [];
  const locale = 'en';
  
  try {
    const { content, metadata } = await loadContent(locale, slug);
    
    // Generate breadcrumbs from slug
    const breadcrumbItems = [
      { label: 'Resources', href: '/en/resources' }
    ];
    
    let currentPath = '/en/resources';
    slug.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      breadcrumbItems.push({
        label,
        href: currentPath
      });
    });
    
    // Get previous/next navigation
    const { previous, next } = getPreviousNext(currentPath.replace('/en', ''));
    
    return (
      <div className="h-screen bg-cream dark:bg-cream-dark flex flex-col transition-colors overflow-hidden">
        <AvatarHeader 
          title="Open Source Avatars"
          description="A collection of CC0 and open source avatars created by ToxSam"
          socialLink="https://x.com/toxsam"
        />

        <DocLayout breadcrumbItems={breadcrumbItems}>
          <>
            <DocContent>
              <article className="prose prose-lg dark:prose-invert max-w-none">
                <div 
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </article>
            </DocContent>
            
            {/* Previous/Next navigation */}
            <DocNavigation 
              previous={previous ? { title: previous.title, href: previous.href } : undefined}
              next={next ? { title: next.title, href: next.href } : undefined}
            />
            
            {/* Footer inside scrollable main content */}
            <Footer variant="compact" />
          </>
        </DocLayout>
      </div>
    );
  } catch (error) {
    console.error('Error loading content:', error);
    notFound();
  }
}
