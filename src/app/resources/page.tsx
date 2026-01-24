'use client';

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Github, Database, ExternalLink } from "lucide-react";
import { AvatarHeader } from "@/components/avatar/AvatarHeader";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";

interface CommunityCollection {
  id: string;
  name: string;
  description: string;
  license: string;
  source_type: string;
  source_network?: string | string[];
  storage_type: string;
  opensea_url?: string;
  avatar_data_file?: string;
}

export default function ResourcesPage() {
  const { t, isLoading } = useI18n();
  const [communityCollections, setCommunityCollections] = useState<CommunityCollection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  useEffect(() => {
    // Fetch community collections
    const fetchCollections = async () => {
      try {
        setCollectionsLoading(true);
        const response = await fetch('/api/collections');
        if (response.ok) {
          const data = await response.json();
          setCommunityCollections(data.collections || []);
        } else {
          console.error('Failed to fetch collections:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setCollectionsLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-cream dark:bg-gray-950 flex items-center justify-center">Loading...</div>;
  }

  const vrmReasons = t('resources.vrm.why.reasons', { returnObjects: true }) as any;
  const vrmReasonsList = Array.isArray(vrmReasons) ? vrmReasons : [];
  const vrmCompatible = t('resources.vrm.compatible.list', { returnObjects: true }) as any;
  const vrmCompatibleList = Array.isArray(vrmCompatible) ? vrmCompatible : [];
  const ardriveReasons = t('resources.ardrive.why.reasons', { returnObjects: true }) as any;
  const ardriveReasonsList = Array.isArray(ardriveReasons) ? ardriveReasons : [];
  const philosophyBenefits = t('resources.philosophy.benefits', { returnObjects: true }) as any;
  const philosophyBenefitsList = Array.isArray(philosophyBenefits) ? philosophyBenefits : [];
  const includesList = t('resources.developers.database.includesList', { returnObjects: true }) as any;
  const includesListArray = Array.isArray(includesList) ? includesList : [];

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-950 flex flex-col transition-colors">
      <AvatarHeader 
        title="Open Source Avatars"
        description="A collection of CC0 and open source avatars created by ToxSam"
        socialLink="https://x.com/toxsam"
      />

      <main className="flex-1 section-padding">
        <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
          <div className="space-y-16">
            <div>
              <h1 className="text-headline mb-12 text-gray-900 dark:text-gray-100">{t('resources.title')}</h1>
              
              {/* Avatar Collections */}
              <section className="mb-16">
                <h2 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('resources.collections.title')}</h2>
                <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-8">{t('resources.collections.description')}</p>
                
                {/* Original Avatars */}
                <div className="mb-8">
                  <h3 className="text-title mb-4 text-gray-900 dark:text-gray-100">{t('resources.collections.original.title')}</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg border border-gray-300 dark:border-gray-700 mb-6">
                    <p className="text-body font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('resources.collections.original.name')}</p>
                    <ul className="space-y-2 text-body text-gray-500 dark:text-gray-400 mb-4">
                      <li className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{t('resources.collections.original.license')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{t('resources.collections.original.storage')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{t('resources.collections.original.batchDownload')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{t('resources.collections.original.includes')}</span>
                      </li>
                    </ul>
                  </div>
                  <Button 
                    asChild
                    variant="outline"
                    className="h-auto py-6 w-full flex items-start justify-start text-left bg-cream dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 mb-8 border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-300 transition-all cursor-pointer group"
                  >
                    <a href="https://app.ardrive.io/#/drives/53bc4d95-d0e0-41b4-a750-7c722f346dd1?name=Open+Source+Avatars+by+ToxSam" target="_blank" rel="noopener noreferrer" className="w-full">
                      <div className="flex items-center w-full">
                        <div className="mr-4">
                          <Database className="h-12 w-12 text-gray-900 dark:text-gray-100" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            ArDrive Folder - Open Source Avatars by ToxSam
                            <ExternalLink className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </a>
                  </Button>
                </div>

                {/* Community Collections */}
                <div className="mb-8">
                  <h3 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('resources.collections.community.title')}</h3>
                  
                  {collectionsLoading ? (
                    <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg border border-gray-300 dark:border-gray-700 mb-6">
                      <p className="text-body text-gray-500 dark:text-gray-400">Loading collections...</p>
                    </div>
                  ) : communityCollections.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg border border-gray-300 dark:border-gray-700 mb-6">
                      <p className="text-body text-gray-500 dark:text-gray-400">No community collections found.</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg border border-gray-300 dark:border-gray-700 mb-6 space-y-6">
                      {communityCollections.map((collection, index) => {
                        const isLast = index === communityCollections.length - 1;
                        const network = Array.isArray(collection.source_network) 
                          ? collection.source_network.map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(', ') 
                          : collection.source_network 
                            ? collection.source_network.charAt(0).toUpperCase() + collection.source_network.slice(1)
                            : '';
                        const sourceUrl = collection.opensea_url || '#';
                        const sourceLabel = collection.opensea_url 
                          ? `OpenSea${network ? ` (${network})` : ''}`
                          : 'Website';
                        
                        // Format storage type
                        const storageLabel = collection.storage_type === 'ipfs' 
                          ? 'IPFS' 
                          : collection.storage_type.charAt(0).toUpperCase() + collection.storage_type.slice(1);
                        
                        // Format license
                        const licenseLabel = collection.license === 'CC0' 
                          ? 'CC0 (Public Domain) - use however you want, no attribution needed'
                          : collection.license === 'CC-BY'
                          ? 'CC-BY (attribution required)'
                          : collection.license;

                        return (
                          <div key={collection.id} className={!isLast ? 'pb-6 border-b border-gray-300 dark:border-gray-700' : ''}>
                            <p className="text-body font-semibold mb-3 text-gray-900 dark:text-gray-100">{collection.name}</p>
                            {collection.description && (
                              <p className="text-body text-gray-600 dark:text-gray-400 mb-3">{collection.description}</p>
                            )}
                            <ul className="space-y-2 text-body text-gray-500 dark:text-gray-400 ml-4">
                              <li className="flex items-start gap-3">
                                <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                                <span>License: {licenseLabel}</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                                <span>Storage: {storageLabel}</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                                <span>
                                  Source:{' '}
                                  <a 
                                    href={sourceUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 underline link-hover"
                                  >
                                    {sourceLabel}
                                  </a>
                                </span>
                              </li>
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-body text-gray-700 dark:text-gray-300">{t('resources.collections.licenseNote')}</p>
                </div>
              </section>

              {/* For Developers */}
              <section className="mb-16">
                <h2 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('resources.developers.title')}</h2>
                
                {/* Avatar Database */}
                <div className="mb-8">
                  <h3 className="text-title mb-4 text-gray-900 dark:text-gray-100">{t('resources.developers.database.title')}</h3>
                  <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-6">{t('resources.developers.database.description')}</p>
                  
                  <Button 
                    asChild
                    variant="outline"
                    className="h-auto py-6 w-full flex items-start justify-start text-left bg-cream dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-300 transition-all cursor-pointer group mb-6"
                  >
                    <a href="https://github.com/toxsam/open-source-avatars" target="_blank" rel="noopener noreferrer" className="w-full">
                      <div className="flex items-center w-full">
                        <div className="mr-4">
                          <Github className="h-12 w-12 text-gray-900 dark:text-gray-100" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            {t('resources.developers.database.link')}
                            <ExternalLink className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </a>
                  </Button>

                  <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg border border-gray-300 dark:border-gray-700 mb-6">
                    <p className="text-body font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('resources.developers.database.structure.title')}</p>
                    <pre className="bg-gray-900 dark:bg-gray-950 p-6 rounded-lg border border-gray-700 dark:border-gray-800 overflow-x-auto mb-6 shadow-inner">
                      <code className="text-sm text-gray-100 dark:text-gray-300 font-mono leading-relaxed block">
                        <span className="text-gray-400">/data/</span>{'\n'}
                        {'\n'}
                        <span className="text-blue-400">projects.json</span> <span className="text-gray-500">→</span> <span className="text-gray-400">All collections + license info</span>{'\n'}
                        <span className="text-gray-400">/avatars/</span>{'\n'}
                        <span className="text-green-400">  100avatars-r1.json</span> <span className="text-gray-500">→</span> <span className="text-gray-400">Individual avatar data</span>{'\n'}
                        <span className="text-green-400">  100avatars-r2.json</span>{'\n'}
                        <span className="text-green-400">  100avatars-r3.json</span>{'\n'}
                        {communityCollections.map((collection) => (
                          <span key={collection.id}>
                            <span className="text-green-400">  {collection.avatar_data_file?.replace('avatars/', '') || `${collection.id}.json`}</span>{'\n'}
                          </span>
                        ))}
                      </code>
                    </pre>
                    <p className="text-body font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('resources.developers.database.includes')}</p>
                    <ul className="space-y-2 text-body text-gray-500 dark:text-gray-400 ml-4">
                      {includesListArray.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Website Source Code */}
                <div>
                  <h3 className="text-title mb-4 text-gray-900 dark:text-gray-100">{t('resources.developers.website.title')}</h3>
                  <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-6">{t('resources.developers.website.description')}</p>
                  
                  <Button 
                    asChild
                    variant="outline"
                    className="h-auto py-6 w-full flex items-start justify-start text-left bg-cream dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-300 transition-all cursor-pointer group"
                  >
                    <a href="https://github.com/toxsam/osa-gallery" target="_blank" rel="noopener noreferrer" className="w-full">
                      <div className="flex items-center w-full">
                        <div className="mr-4">
                          <Github className="h-12 w-12 text-gray-900 dark:text-gray-100" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            {t('resources.developers.website.link')}
                            <ExternalLink className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </a>
                  </Button>
                </div>
              </section>

              {/* About VRM Format */}
              <section className="mb-16">
                <h2 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('resources.vrm.title')}</h2>
                <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-8">{t('resources.vrm.description')}</p>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg border border-gray-300 dark:border-gray-700 mb-6">
                  <h3 className="text-title mb-4 text-gray-900 dark:text-gray-100">{t('resources.vrm.why.title')}</h3>
                  <ul className="space-y-2 text-body text-gray-500 dark:text-gray-400 ml-4">
                    {vrmReasonsList.map((reason: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-title mb-4 text-gray-900 dark:text-gray-100">{t('resources.vrm.compatible.title')}</h3>
                  <ul className="space-y-2 text-body text-gray-500 dark:text-gray-400 ml-4">
                    {vrmCompatibleList.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-body">
                  <a 
                    href="https://vrm.dev/en/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 underline font-medium link-hover"
                  >
                    {t('resources.vrm.learnMore')}
                  </a>
                </p>
              </section>

              {/* What is ArDrive */}
              <section className="mb-16">
                <h2 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('resources.ardrive.title')}</h2>
                <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-8">{t('resources.ardrive.description')}</p>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg border border-gray-300 dark:border-gray-700 mb-6">
                  <h3 className="text-title mb-4 text-gray-900 dark:text-gray-100">{t('resources.ardrive.why.title')}</h3>
                  <ul className="space-y-2 text-body text-gray-500 dark:text-gray-400 ml-4">
                    {ardriveReasonsList.map((reason: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-body text-gray-500 dark:text-gray-400">{t('resources.ardrive.note')}</p>
              </section>

              {/* Open Source Philosophy */}
              <section className="mb-16">
                <h2 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('resources.philosophy.title')}</h2>
                <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-8">{t('resources.philosophy.description')}</p>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg border border-gray-300 dark:border-gray-700">
                  <p className="text-body font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('resources.philosophy.why')}</p>
                  <ul className="space-y-2 text-body text-gray-500 dark:text-gray-400 mb-4 ml-4">
                    {philosophyBenefitsList.map((benefit: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-body text-gray-500 dark:text-gray-400 mb-4">{t('resources.philosophy.note')}</p>
                  <p className="text-body text-gray-500 dark:text-gray-400">{t('resources.philosophy.conclusion')}</p>
                </div>
              </section>

              {/* Need Help */}
              <section>
                <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg border border-gray-300 dark:border-gray-700">
                  <h2 className="text-title mb-6 text-gray-900 dark:text-gray-100">{t('resources.help.title')}</h2>
                  <div className="space-y-3 text-body text-gray-500 dark:text-gray-400 mb-6">
                    <p>{t('resources.help.questions')}</p>
                    <p>{t('resources.help.building')}</p>
                    <p>
                      {(() => {
                        const contribute = t('resources.help.contribute');
                        const contributeText = typeof contribute === 'string' ? contribute : String(contribute);
                        const parts = contributeText.split('via');
                        return (
                          <>
                            {parts[0]}
                            <a 
                              href={t('resources.help.contributeLink') as string} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 underline link-hover ml-1"
                            >
                              via GitHub Discussions
                            </a>
                            .
                          </>
                        );
                      })()}
                    </p>
                  </div>
                  <p className="text-body font-semibold text-gray-900 dark:text-gray-100">
                    {(() => {
                      const contact = t('resources.help.contact');
                      const contactText = typeof contact === 'string' ? contact : String(contact);
                      const parts = contactText.split(':');
                      return (
                        <>
                          {parts[0]}:{' '}
                          <a 
                            href={t('resources.help.contactLink') as string} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 underline link-hover"
                          >
                            {parts[1]?.trim()}
                          </a>
                        </>
                      );
                    })()}
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
