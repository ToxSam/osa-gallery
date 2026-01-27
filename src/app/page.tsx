// src/app/page.tsx
'use client';

import React, { useEffect, useState } from "react";
import { AvatarHeader } from '@/components/avatar/AvatarHeader';
import { HomeVRMViewer } from '@/components/VRMViewer/HomeVRMViewer';
import { Footer } from '@/components/Footer';
import { useI18n } from '@/lib/i18n';
import { Download, Palette, Search, Code, Box, GitBranch, Boxes, Microscope, ArrowRight } from "lucide-react";
import { Avatar } from '@/types/avatar';

// Allowed project IDs for home page viewer (100Avatars R1, R2, R3)
const ALLOWED_PROJECT_IDS = [
  '7dd289fc-c98a-4224-a5a7-74a9aef751a8', // 100Avatars R1
  'fed7b40b-088c-45aa-b833-2416ae32d2ee', // 100Avatars R2
  '4fd74d41-0828-417d-a005-de46c3bdf5b3', // 100Avatars R3
];

export default function Home() {
  const { t } = useI18n();
  const [randomAvatar, setRandomAvatar] = useState<Avatar | null>(null);
  
  const title = String(t('home.title'));
  const description = String(t('home.description'));

  // Fetch random avatar once for both viewer instances
  useEffect(() => {
    const fetchRandomAvatar = async () => {
      try {
        // Pass projectIds to API so it only fetches the projects we need
        const projectIdsParam = ALLOWED_PROJECT_IDS.join(',');
        const response = await fetch(`/api/avatars?projectIds=${encodeURIComponent(projectIdsParam)}`);
        const data = await response.json();
        
        if (data.avatars && data.avatars.length > 0) {
          // No need to filter again - API already filtered by projectIds
          const randomIndex = Math.floor(Math.random() * data.avatars.length);
          setRandomAvatar(data.avatars[randomIndex]);
        } else {
          console.warn('No avatars found in allowed projects');
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
      }
    };

    fetchRandomAvatar();
  }, []);

  return (
    <main className="min-h-screen bg-cream dark:bg-cream-dark transition-colors">
      <AvatarHeader 
        title={title} 
        description={description}
        socialLink="https://x.com/toxsam"
      />
      
      {/* Hero Section with Large Avatar Display */}
      <section className="relative overflow-hidden bg-cream dark:bg-cream-dark min-h-[600px] lg:min-h-0" style={{ marginTop: 'var(--osa-avatar-header-height)' }}>
        {/* 3D Viewer - behind text on mobile, positioned absolutely */}
        <div 
          className="absolute inset-0 pointer-events-none z-0 lg:hidden"
          style={{ 
            width: '100%', 
            height: '100%', 
            minHeight: '600px',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <div 
            className="absolute right-0 top-1/2 -translate-y-1/2"
            style={{ 
              width: '400px', 
              height: '400px',
              maxWidth: '80vw',
              maxHeight: '80vw'
            }}
          >
            <HomeVRMViewer 
              className="w-full h-full blur-2xl opacity-40"
              avatar={randomAvatar}
            />
          </div>
        </div>
        
        {/* Text content - on top with higher z-index */}
        <div className="container-custom section-padding relative z-10 bg-transparent">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            {/* Text content */}
            <div className="flex-1 max-w-2xl relative z-10">
              <h1 className="text-display mb-12 text-gray-900 dark:text-gray-100">
                {t('home.hero.title')} {t('home.hero.tagline')}
              </h1>
              <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-12">
                {t('home.hero.description')}
              </p>
              <div className="flex gap-4">
                <a
                  href="/gallery"
                  className="btn-primary"
                >
                  {t('home.hero.exploreButton')} <ArrowRight className="ml-2 h-5 w-5" />
                </a>
                <a
                  href="/vrminspector"
                  className="btn-outline"
                >
                  {t('home.hero.viewerButton')}
                </a>
              </div>
            </div>
            {/* 3D Viewer - normal on desktop */}
            <div className="flex-1 w-full lg:w-auto hidden lg:block">
              <HomeVRMViewer 
                className="w-full aspect-square max-w-2xl mx-auto"
                avatar={randomAvatar}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Project Overview */}
      <section className="section-padding bg-cream dark:bg-cream-dark">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700"></div>
              <span className="text-caption text-gray-500 dark:text-gray-400">{t('home.about.section_title')}</span>
              <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700"></div>
            </div>
            
            <h2 className="text-headline mb-12 text-center text-gray-900 dark:text-gray-100">{t('home.about.title')}</h2>
            
            <div className="space-y-8">
              <p className="text-body-lg text-gray-500 dark:text-gray-400 text-center">
                {t('home.about.description')}
              </p>
              
              <p className="text-body-lg text-gray-500 dark:text-gray-400 text-center">
                {t('home.about.description_2')}
              </p>
              
              <p className="text-body-lg text-gray-500 dark:text-gray-400 text-center">
                {t('home.about.github_description')} <a href="https://github.com/toxsam/open-source-avatars" className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 underline link-hover">{t('home.about.github_link')}</a> {t('home.about.github_description_2')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tools and Features */}
      <section className="section-padding bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700"></div>
              <span className="text-caption text-gray-500 dark:text-gray-400">{t('home.features.section_title')}</span>
              <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700"></div>
            </div>

            <h2 className="text-headline mb-20 text-center text-gray-900 dark:text-gray-100">{t('home.features.title')}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="border border-gray-300 dark:border-gray-700 p-12 rounded-lg hover:border-gray-900 dark:hover:border-gray-100 transition-colors duration-200 bg-cream dark:bg-gray-800">
                <div className="flex items-start gap-6">
                  <div className="bg-gray-900 dark:bg-gray-100 p-3 rounded-lg">
                    <Search className="h-8 w-8 text-white dark:text-gray-900" />
                  </div>
                  <div>
                    <h3 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('home.features.browse.title')}</h3>
                    <p className="text-body text-gray-500 dark:text-gray-400 mb-6">{t('home.features.browse.description')}</p>
                    <ul className="space-y-2 text-gray-500 dark:text-gray-400">
                      <li className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{t('home.features.browse.bulletPoints.preview')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{t('home.features.browse.bulletPoints.filter')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{t('home.features.browse.bulletPoints.download')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{t('home.features.browse.bulletPoints.updates')}</span>
                      </li>
                    </ul>
                    <a href="/gallery" className="inline-flex items-center text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 font-medium no-underline mt-6 link-hover">
                      {t('home.features.browse.cta')} <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="border border-gray-300 dark:border-gray-700 p-12 rounded-lg hover:border-gray-900 dark:hover:border-gray-100 transition-colors duration-200 bg-cream dark:bg-gray-800">
                <div className="flex items-start gap-6">
                  <div className="bg-gray-900 dark:bg-gray-100 p-3 rounded-lg">
                    <Microscope className="h-8 w-8 text-white dark:text-gray-900" />
                  </div>
                  <div>
                    <h3 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('home.features.inspector.title')}</h3>
                    <p className="text-body text-gray-500 dark:text-gray-400 mb-6">{t('home.features.inspector.description')}</p>
                    <ul className="space-y-2 text-gray-500 dark:text-gray-400">
                      <li className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{t('home.features.inspector.bulletPoints.metadata')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{t('home.features.inspector.bulletPoints.expressions')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{t('home.features.inspector.bulletPoints.materials')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{t('home.features.inspector.bulletPoints.validation')}</span>
                      </li>
                    </ul>
                    <a href="/vrminspector" className="inline-flex items-center text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 font-medium no-underline mt-6 link-hover">
                      {t('home.features.inspector.cta')} <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Deep Dive */}
      <section className="section-padding bg-cream dark:bg-cream-dark">
        <div className="container-custom">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700"></div>
              <span className="text-caption text-gray-500 dark:text-gray-400">{t('home.technical.section_title')}</span>
              <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700"></div>
            </div>

            <h2 className="text-headline mb-16 text-center text-gray-900 dark:text-gray-100">{t('home.technical.title')}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
              <div>
                <h3 className="text-title mb-8 flex items-center gap-3 text-gray-900 dark:text-gray-100">
                  <Box className="h-10 w-10 text-gray-900 dark:text-gray-100" />
                  {t('home.technical.vrm_title')}
                </h3>
                <p className="text-body text-gray-500 dark:text-gray-400 mb-8">{t('home.technical.vrm_description')}</p>
                <p className="font-semibold mb-6 text-gray-900 dark:text-gray-100">{t('home.technical.key_features')}</p>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-300 dark:border-gray-700">
                    <p className="mb-6 text-body text-gray-500 dark:text-gray-300">{t('home.technical.features_intro')}</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span className="text-body text-gray-500 dark:text-gray-300">{t('home.technical.vrm_features.skeleton')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span className="text-body text-gray-500 dark:text-gray-300">{t('home.technical.vrm_features.materials')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span className="text-body text-gray-500 dark:text-gray-300">{t('home.technical.vrm_features.expressions')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span className="text-body text-gray-500 dark:text-gray-300">{t('home.technical.vrm_features.eye_movement')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span className="text-body text-gray-500 dark:text-gray-300">{t('home.technical.vrm_features.vr')}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-title mb-8 flex items-center gap-3 text-gray-900 dark:text-gray-100">
                  <GitBranch className="h-10 w-10 text-gray-900 dark:text-gray-100" />
                  {t('home.technical.compatibility_title')}
                </h3>
                <p className="text-body text-gray-500 dark:text-gray-400 mb-8">{t('home.technical.compatibility_description')}</p>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-300 dark:border-gray-700">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span className="text-body text-gray-500 dark:text-gray-300">{t('home.technical.compatibility_items.threejs')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span className="text-body text-gray-500 dark:text-gray-300">{t('home.technical.compatibility_items.vrchat')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span className="text-body text-gray-500 dark:text-gray-300">{t('home.technical.compatibility_items.engines')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span className="text-body text-gray-500 dark:text-gray-300">{t('home.technical.compatibility_items.webgl')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span className="text-body text-gray-500 dark:text-gray-300">{t('home.technical.compatibility_items.webxr')}</span>
                    </li>
                  </ul>
                  <a href="https://vrm.dev" 
                     className="inline-flex items-center mt-8 text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 font-medium no-underline link-hover">
                    {t('home.technical.learn_more')} <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="section-padding bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700"></div>
              <span className="text-caption text-gray-500 dark:text-gray-400">{t('home.applications.section_title')}</span>
              <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700"></div>
            </div>

            <h2 className="text-headline mb-20 text-center text-gray-900 dark:text-gray-100">{t('home.applications.title')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 mb-16">
              <div>
                <Code className="h-12 w-12 text-gray-900 dark:text-white mb-8" strokeWidth={1.5} />
                <h3 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('home.applications.web.title')}</h3>
                <p className="text-body text-gray-500 dark:text-gray-400">{t('home.applications.web.description')}</p>
              </div>

              <div>
                <Boxes className="h-12 w-12 text-gray-900 dark:text-white mb-8" strokeWidth={1.5} />
                <h3 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('home.applications.vr.title')}</h3>
                <p className="text-body text-gray-500 dark:text-gray-400">{t('home.applications.vr.description')}</p>
              </div>

              <div>
                <Palette className="h-12 w-12 text-gray-900 dark:text-white mb-8" strokeWidth={1.5} />
                <h3 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('home.applications.creative.title')}</h3>
                <p className="text-body text-gray-500 dark:text-gray-400">{t('home.applications.creative.description')}</p>
              </div>
            </div>

            <div className="text-center mt-16">
              <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-8">
                {t('home.applications.showcase_description')}
              </p>
              <a 
                href="https://vrm.dev/en/showcase/" 
                className="inline-flex items-center text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 font-medium text-lg link-hover"
              >
                {t('home.applications.showcase_link')} <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-cream dark:bg-cream-dark">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-headline mb-8 text-gray-900 dark:text-gray-100">{t('home.cta.title')}</h2>
            <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-16 max-w-2xl mx-auto">
              {t('home.cta.description')}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/gallery"
                className="btn-primary"
              >
                {t('home.hero.exploreButton')} <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <a
                href="/resources"
                className="btn-outline"
              >
                {t('home.cta.documentation')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}