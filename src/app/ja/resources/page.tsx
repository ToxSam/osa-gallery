'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, Database, ExternalLink } from "lucide-react";
import { AvatarHeader } from "@/components/avatar/AvatarHeader";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";

export default function ResourcesPage() {
  const { t, isLoading } = useI18n();
  
  // Get the goals list with proper type casting
  const goals = t('resources.philosophy.goals.list', { returnObjects: true }) as any;
  const goalsList = Array.isArray(goals) ? goals : [];

  if (isLoading) {
    return <div className="min-h-screen bg-cream dark:bg-gray-950 flex items-center justify-center">Loading...</div>;
  }

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
              <h1 className="text-4xl md:text-5xl font-bold mb-12">{t('resources.title')}</h1>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('resources.batch.title')}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{t('resources.batch.description')}</p>
              
              <Button 
                asChild
                variant="outline"
                className="h-auto py-6 w-full flex items-start justify-start text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 mb-8 border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-300 transition-all cursor-pointer group"
              >
                <a href="https://app.ardrive.io/#/drives/53bc4d95-d0e0-41b4-a750-7c722f346dd1?name=Open+Source+Avatars+by+ToxSam" target="_blank" rel="noopener noreferrer" className="w-full">
                  <div className="flex items-center w-full">
                    <div className="mr-4">
                      <Database className="h-12 w-12 text-gray-900 dark:text-gray-100" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        {t('resources.batch.button.title')}
                        <ExternalLink className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="text-base text-gray-600 dark:text-gray-300 mt-1">{t('resources.batch.button.description')}</div>
                    </div>
                  </div>
                </a>
              </Button>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg mb-12 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg mb-4">{t('resources.ardrive.title')}</h3>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{t('resources.ardrive.description1')}</p>
                <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">{t('resources.ardrive.description2')}</p>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('resources.github.title')}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{t('resources.github.description')}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                <Button 
                  asChild
                  variant="outline"
                  className="h-auto py-6 flex items-start justify-start text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-300 transition-all cursor-pointer group"
                >
                  <a href="https://github.com/toxsam/open-source-avatars" target="_blank" rel="noopener noreferrer" className="w-full">
                    <div className="flex items-center w-full">
                      <div className="mr-4">
                        <Github className="h-12 w-12 text-gray-900 dark:text-gray-100" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          {t('resources.github.database.title')}
                          <ExternalLink className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{t('resources.github.database.description')}</div>
                      </div>
                    </div>
                  </a>
                </Button>
                
                <Button 
                  asChild
                  variant="outline"
                  className="h-auto py-6 flex items-start justify-start text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-300 transition-all cursor-pointer group"
                >
                  <a href="https://github.com/toxsam/osa-gallery" target="_blank" rel="noopener noreferrer" className="w-full">
                    <div className="flex items-center w-full">
                      <div className="mr-4">
                        <Github className="h-12 w-12 text-gray-900 dark:text-gray-100" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          {t('resources.github.website.title')}
                          <ExternalLink className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{t('resources.github.website.description')}</div>
                      </div>
                    </div>
                  </a>
                </Button>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('resources.vrm.title')}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{t('resources.vrm.description')}</p>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg mb-12 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg mb-4">{t('resources.vrm.what.title')}</h3>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{t('resources.vrm.what.description1')}</p>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{t('resources.vrm.what.description2')}</p>
                <p className="text-base">
                  <a 
                    href="https://vrm.dev/en/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-black dark:text-white hover:text-gray-600 dark:text-gray-300 underline font-medium"
                  >
                    {t('resources.vrm.what.learnMore')}
                  </a>
                </p>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('resources.philosophy.title')}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{t('resources.philosophy.description')}</p>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg mb-12 border border-gray-200 dark:border-gray-700">
                <p className="text-base text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{t('resources.philosophy.goals.intro')}</p>
                <ul className="list-disc text-base text-gray-600 dark:text-gray-300 ml-6 mb-4 space-y-2">
                  {goalsList.map((goal, index) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{t('resources.philosophy.description1')}</p>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{t('resources.philosophy.description2')}</p>
                <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">{t('resources.philosophy.description3')}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('resources.contact.title')}</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{t('resources.contact.description')}</p>
                <div className="flex gap-3">
                  <Button 
                    asChild
                    className="bg-black hover:bg-gray-800"
                  >
                    <a href="https://x.com/toxsam" target="_blank" rel="noopener noreferrer">
                      {t('resources.contact.button')}
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