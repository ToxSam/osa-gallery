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

  // Helper function to convert markdown-style links [text](url) and plain URLs to links
  const renderTextWithLinks = (text: string) => {
    // First handle markdown-style links [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    const elements: React.ReactNode[] = [];
    let key = 0;
    
    let match;
    while ((match = markdownLinkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        elements.push(
          <React.Fragment key={key++}>
            {renderPlainUrls(text.substring(lastIndex, match.index))}
          </React.Fragment>
        );
      }
      // Add the link
      elements.push(
        <a
          key={key++}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {match[1]}
        </a>
      );
      lastIndex = markdownLinkRegex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <React.Fragment key={key++}>
          {renderPlainUrls(text.substring(lastIndex))}
        </React.Fragment>
      );
    }
    
    return elements.length > 0 ? elements : text;
  };

  // Helper function to convert plain URLs to links
  const renderPlainUrls = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {part}
          </a>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

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
  const howItWorksSteps = t('about.howItWorks.steps', { returnObjects: true });
  const originalCollectionDetails = t('about.collections.original.details', { returnObjects: true });
  const communityCollections = t('about.collections.community.collections', { returnObjects: true });
  const lateJanuaryUpdates = t('about.updates.lateJanuary.list', { returnObjects: true });
  const midJanuaryUpdates = t('about.updates.midJanuary.list', { returnObjects: true });
  const march2025Updates = t('about.updates.march2025.list', { returnObjects: true });
  const whatMakesUsDifferent = t('about.whatMakesUsDifferent.features', { returnObjects: true });
  const initialBuildList = t('about.development.tools.initialBuild.list', { returnObjects: true });
  const recentUpgradesList = t('about.development.tools.recentUpgrades.list', { returnObjects: true });
  const whatThisProvesRequirements = t('about.development.whatThisProves.requirements', { returnObjects: true });
  const submitCollectionRequirements = t('about.getInvolved.submitCollection.requirements.list', { returnObjects: true });
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
              
              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.whatWeDo.title')}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {t('about.whatWeDo.description1')}
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
                {t('about.whatWeDo.description2')}
              </p>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.howItWorks.title')}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed font-semibold">
                {t('about.howItWorks.subtitle')}
              </p>
              <ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-gray-300 mb-6 text-base">
                {Array.isArray(howItWorksSteps) && howItWorksSteps.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
                {t('about.howItWorks.description')}
              </p>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.status.title')}</h2>
              <div className="space-y-4 mb-12">
                <div className="flex items-center gap-3">
                  <span className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium">{t('about.status.badges.beta.label')}</span>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">{t('about.status.badges.beta.description')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium">{t('about.status.badges.avatars.label')}</span>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">{t('about.status.badges.avatars.description')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium">{t('about.status.badges.format.label')}</span>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">{t('about.status.badges.format.description')}</p>
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.collections.title')}</h2>
              
              <h3 className="text-xl md:text-2xl font-bold mb-4">{t('about.collections.original.title')}</h3>
              <p className="text-lg text-gray-900 dark:text-gray-100 mb-3 font-semibold">
                {t('about.collections.original.name')}
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                {t('about.collections.original.description')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-8 text-base">
                {Array.isArray(originalCollectionDetails) && originalCollectionDetails.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl md:text-2xl font-bold mb-4">{t('about.collections.community.title')}</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-4 text-base">
                {Array.isArray(communityCollections) && communityCollections.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
                {t('about.collections.community.description')}
              </p>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.whyThisExists.title')}</h2>
              
              <h3 className="text-xl md:text-2xl font-bold mb-4">{t('about.whyThisExists.problem.title')}</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {t('about.whyThisExists.problem.description')}
              </p>

              <h3 className="text-xl md:text-2xl font-bold mb-4">{t('about.whyThisExists.solution.title')}</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {t('about.whyThisExists.solution.description')}
              </p>

              <h3 className="text-xl md:text-2xl font-bold mb-4">{t('about.whyThisExists.mission.title')}</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
                {t('about.whyThisExists.mission.description')}
              </p>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.updates.title')}</h2>
              
              <h3 className="text-xl md:text-2xl font-bold mb-4">{t('about.updates.lateJanuary.title')}</h3>
              <ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-gray-300 mb-8 text-base">
                {Array.isArray(lateJanuaryUpdates) && lateJanuaryUpdates.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl md:text-2xl font-bold mb-4">{t('about.updates.midJanuary.title')}</h3>
              <ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-gray-300 mb-8 text-base">
                {Array.isArray(midJanuaryUpdates) && midJanuaryUpdates.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl md:text-2xl font-bold mb-4">{t('about.updates.march2025.title')}</h3>
              <ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-gray-300 mb-12 text-base">
                {Array.isArray(march2025Updates) && march2025Updates.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.whatMakesUsDifferent.title')}</h2>
              <ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-gray-300 mb-12 text-base">
                {Array.isArray(whatMakesUsDifferent) && whatMakesUsDifferent.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.development.title')}</h2>
              
              <h3 className="text-xl md:text-2xl font-bold mb-4">{t('about.development.builtWithAI.title')}</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                {t('about.development.builtWithAI.description')}
              </p>

              <h3 className="text-xl md:text-2xl font-bold mb-4">{t('about.development.tools.title')}</h3>
              
              <h4 className="text-lg md:text-xl font-semibold mb-3">{t('about.development.tools.initialBuild.title')}</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-6 text-base">
                {Array.isArray(initialBuildList) && initialBuildList.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              <h4 className="text-lg md:text-xl font-semibold mb-3">{t('about.development.tools.recentUpgrades.title')}</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-8 text-base">
                {Array.isArray(recentUpgradesList) && recentUpgradesList.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl md:text-2xl font-bold mb-4">{t('about.development.whatThisProves.title')}</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                {t('about.development.whatThisProves.description')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-4 text-base">
                {Array.isArray(whatThisProvesRequirements) && whatThisProvesRequirements.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                {t('about.development.whatThisProves.conclusion')}
              </p>

              <h3 className="text-xl md:text-2xl font-bold mb-4">{t('about.development.openSource.title')}</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                {t('about.development.openSource.description')}
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                {t('about.development.openSource.techStack')}
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                {t('about.development.openSource.aiAssistants')}
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
                {t('about.development.openSource.learnMore')}
              </p>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.future.title')}</h2>
              <ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-gray-300 mb-12 text-base">
                {Array.isArray(futureList) && futureList.map((item, index) => (
                  <li key={index}>{renderTextWithLinks(String(item))}</li>
                ))}
              </ul>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.getInvolved.title')}</h2>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg mb-8 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl md:text-2xl font-bold mb-4">{t('about.getInvolved.submitCollection.title')}</h3>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-4">
                  {t('about.getInvolved.submitCollection.description')}
                </p>
                <p className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                  {t('about.getInvolved.submitCollection.requirements.title')}
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-4 text-base">
                  {Array.isArray(submitCollectionRequirements) && submitCollectionRequirements.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <p className="text-base text-gray-600 dark:text-gray-300">
                  {renderTextWithLinks(String(t('about.getInvolved.submitCollection.submitVia')))}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg mb-8 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl md:text-2xl font-bold mb-4">{t('about.getInvolved.contributeCode.title')}</h3>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-4">
                  {t('about.getInvolved.contributeCode.description')}
                </p>
                <p className="text-base text-gray-600 dark:text-gray-300">
                  {renderTextWithLinks(String(t('about.getInvolved.contributeCode.link')))}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg mb-12 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl md:text-2xl font-bold mb-4">{t('about.getInvolved.giveFeedback.title')}</h3>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-4">
                  {t('about.getInvolved.giveFeedback.description')}
                </p>
                <p className="text-base text-gray-600 dark:text-gray-300">
                  {renderTextWithLinks(String(t('about.getInvolved.giveFeedback.link')))}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('about.connect.title')}</h2>
                <div className="flex items-center gap-4">
                  <a 
                    href={String(t('about.connect.websiteUrl'))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center gap-2"
                    aria-label="ToxSam website"
                  >
                    <svg className="w-[16px] h-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-base">{t('about.connect.website')}</span>
                  </a>
                  <a 
                    href={String(t('about.connect.twitterUrl'))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center gap-2"
                    aria-label="X/Twitter"
                  >
                    <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className="text-base">{t('about.connect.twitter')}</span>
                  </a>
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
