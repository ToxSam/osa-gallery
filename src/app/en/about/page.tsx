"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Twitter } from "lucide-react";
import { AvatarHeader } from "@/components/avatar/AvatarHeader";
import { Footer } from "@/components/Footer";
import { useI18n } from '@/lib/i18n';
import Head from 'next/head';
import { useEffect } from 'react';

export default function AboutPage() {
  const { t } = useI18n();

  useEffect(() => {
    // Update meta tags for About page
    document.title = 'About - Open Source Avatars Project | Free VRM Avatars';
    
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) || 
                 document.querySelector(`meta[name="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const description = 'Learn about the Open Source Avatars project by ToxSam. A collection of 300+ CC0 licensed VRM avatars, free for any use including commercial projects.';
    const ogImageUrl = '/api/og?type=default&title=About Open Source Avatars&description=Free CC0 VRM Avatar Collection by ToxSam';
    
    updateMetaTag('description', description);
    updateMetaTag('og:title', 'About - Open Source Avatars Project');
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', `https://opensourceavatars.com${ogImageUrl}`);
    updateMetaTag('og:url', window.location.href);
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', 'About - Open Source Avatars Project');
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', `https://opensourceavatars.com${ogImageUrl}`);
  }, []);

  // Get the lists as arrays with returnObjects option
  const updatesList = t('about.updates.list', { returnObjects: true });
  const previousUpdatesList = t('about.previousUpdates.list', { returnObjects: true });
  const futureList = t('about.future.list', { returnObjects: true });

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-950 flex flex-col">
      <AvatarHeader 
        title="Open Source Avatars"
        description="A collection of CC0 and open source avatars created by ToxSam"
        socialLink="https://x.com/toxsam"
      />

      <main className="flex-1 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-16">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-12">{t('about.title')}</h1>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.project.title')}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {t('about.project.description1')}
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
                {t('about.project.description2')}
              </p>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.status.title')}</h2>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium">{t('about.status.badges.beta')}</span>
                <span className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium">{t('about.status.badges.avatars')}</span>
                <span className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium">{t('about.status.badges.format')}</span>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
                {t('about.status.description')}
              </p>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.updates.title')}</h2>
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg mb-12 border border-gray-200 dark:border-gray-700">
                <p className="text-base text-gray-900 dark:text-white mb-4 font-semibold">
                  {t('about.updates.intro')}
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-gray-300 text-base">
                  {Array.isArray(updatesList) && updatesList.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.previousUpdates.title')}</h2>
              <ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-gray-300 mb-12 text-base">
                {Array.isArray(previousUpdatesList) && previousUpdatesList.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.development.title')}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {t('about.development.description1')}
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
                {t('about.development.description2')}
              </p>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.future.title')}</h2>
              <ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-gray-300 mb-12 text-base">
                {Array.isArray(futureList) && futureList.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.contact.title')}</h2>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    asChild
                    className="bg-black hover:bg-gray-800"
                  >
                    <a href="https://twitter.com/toxsam" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      {t('about.contact.twitter')}
                    </a>
                  </Button>
                  <Button 
                    asChild
                    className="bg-black hover:bg-gray-800"
                  >
                    <a href="https://toxsam.com" target="_blank" rel="noopener noreferrer">
                      {t('about.contact.website')}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
