"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Twitter } from "lucide-react";
import { AvatarHeader } from "@/components/avatar/AvatarHeader";
import { Footer } from "@/components/Footer";
import { useI18n } from '@/lib/i18n';

export default function AboutPage() {
  const { t } = useI18n();

  // Get the lists as arrays with returnObjects option
  const updatesList = t('about.updates.list', { returnObjects: true });
  const previousUpdatesList = t('about.previousUpdates.list', { returnObjects: true });
  const futureList = t('about.future.list', { returnObjects: true });

  return (
    <div className="min-h-screen bg-cream dark:bg-cream-dark flex flex-col transition-colors">
      <AvatarHeader 
        title="Open Source Avatars"
        description="A collection of CC0 and open source avatars created by ToxSam"
        socialLink="https://x.com/toxsam"
      />

      <main className="flex-1 section-padding">
        <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
          <div className="space-y-16">
            <div>
              <h1 className="text-headline mb-12 text-gray-900 dark:text-gray-100">{t('about.title')}</h1>
              
              <h2 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('about.project.title')}</h2>
              <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-6">
                {t('about.project.description1')}
              </p>
              <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-12">
                {t('about.project.description2')}
              </p>

              <h2 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('about.status.title')}</h2>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-caption">{t('about.status.badges.beta')}</span>
                <span className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-caption">{t('about.status.badges.avatars')}</span>
                <span className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-caption">{t('about.status.badges.format')}</span>
              </div>
              <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-12">
                {t('about.status.description')}
              </p>

              <h2 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('about.updates.title')}</h2>
              <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg mb-12 border border-gray-300 dark:border-gray-700">
                <p className="text-body text-gray-900 dark:text-gray-100 mb-4 font-semibold">
                  {t('about.updates.intro')}
                </p>
                <ul className="space-y-3 text-gray-500 dark:text-gray-400 text-body">
                  {Array.isArray(updatesList) && updatesList.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <h2 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('about.previousUpdates.title')}</h2>
              <ul className="space-y-3 text-gray-500 dark:text-gray-400 mb-12 text-body">
                {Array.isArray(previousUpdatesList) && previousUpdatesList.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h2 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('about.development.title')}</h2>
              <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-6">
                {t('about.development.description1')}
              </p>
              <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-12">
                {t('about.development.description2')}
              </p>

              <h2 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('about.future.title')}</h2>
              <ul className="space-y-3 text-gray-500 dark:text-gray-400 mb-12 text-body">
                {Array.isArray(futureList) && futureList.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg border border-gray-300 dark:border-gray-700">
                <h2 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('about.contact.title')}</h2>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    asChild
                    className="btn-primary"
                  >
                    <a href="https://twitter.com/toxsam" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      {t('about.contact.twitter')}
                    </a>
                  </Button>
                  <Button 
                    asChild
                    className="btn-primary"
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