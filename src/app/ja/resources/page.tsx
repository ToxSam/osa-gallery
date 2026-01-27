import React from 'react';
import { notFound } from 'next/navigation';
import { AvatarHeader } from "@/components/avatar/AvatarHeader";
import { Footer } from "@/components/Footer";
import { DocLayout } from "@/components/docs/DocLayout";
import { DocContent } from "@/components/docs/DocContent";
import { TranslationBanner } from "@/components/docs/TranslationBanner";
import { DocNavigation } from "@/components/docs/DocNavigation";
import { loadContent } from "@/lib/content";
import { getPreviousNext } from "@/lib/navigation";

export default async function ResourcesPage() {
  const locale = 'ja';
  
  try {
    const { content, metadata, isTranslated } = await loadContent(locale, []);
    
    // Get previous/next navigation
    const { previous, next } = getPreviousNext('/resources');
    
    return (
      <div className="h-screen bg-cream dark:bg-cream-dark flex flex-col transition-colors overflow-hidden">
        <AvatarHeader 
          title="Open Source Avatars"
          description="A collection of CC0 and open source avatars created by ToxSam"
          socialLink="https://x.com/toxsam"
        />

        <DocLayout breadcrumbItems={[
          { label: 'Resources', href: '/ja/resources' }
        ]}>
          <>
            <DocContent>
              {!isTranslated && (
                <TranslationBanner currentLocale={locale} targetLocale="en" />
              )}
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
