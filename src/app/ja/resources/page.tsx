'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Github, Database, ExternalLink } from "lucide-react";
import { AvatarHeader } from "@/components/avatar/AvatarHeader";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";

export default function ResourcesPage() {
  const { t, isLoading } = useI18n();

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
    <div className="min-h-screen bg-cream dark:bg-gray-950 flex flex-col">
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
                    className="h-auto py-6 w-full flex items-start justify-start text-left bg-cream dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-300 transition-all cursor-pointer group"
                  >
                    <a href="https://app.ardrive.io/#/drives/53bc4d95-d0e0-41b4-a750-7c722f346dd1?name=Open+Source+Avatars+by+ToxSam" target="_blank" rel="noopener noreferrer" className="w-full">
                      <div className="flex items-center w-full">
                        <div className="mr-4">
                          <Database className="h-12 w-12 text-gray-900 dark:text-gray-100" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            ArDriveフォルダ - ToxSamによるオープンソースアバター
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
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg border border-gray-300 dark:border-gray-700 mb-6">
                    <div className="mb-6">
                      <p className="text-body font-semibold mb-3 text-gray-900 dark:text-gray-100">{t('resources.collections.community.vipe.name')}</p>
                      <ul className="space-y-2 text-body text-gray-500 dark:text-gray-400 ml-4">
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                          <span>{t('resources.collections.community.vipe.license')}</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                          <span>{t('resources.collections.community.vipe.storage')}</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                          <span>
                            {(() => {
                              const source = t('resources.collections.community.vipe.source');
                              const sourceText = typeof source === 'string' ? source : String(source);
                              const parts = sourceText.split('：');
                              return (
                                <>
                                  {parts[0]}：{' '}
                                  <a 
                                    href={t('resources.collections.community.vipe.sourceLink') as string} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 underline link-hover"
                                  >
                                    {parts[1]?.trim()}
                                  </a>
                                </>
                              );
                            })()}
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <p className="text-body font-semibold mb-3 text-gray-900 dark:text-gray-100">{t('resources.collections.community.grifter.name')}</p>
                      <ul className="space-y-2 text-body text-gray-500 dark:text-gray-400 ml-4">
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                          <span>{t('resources.collections.community.grifter.license')}</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                          <span>{t('resources.collections.community.grifter.storage')}</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                          <span>
                            {(() => {
                              const source = t('resources.collections.community.grifter.source');
                              const sourceText = typeof source === 'string' ? source : String(source);
                              if (sourceText.includes('[')) {
                                return sourceText;
                              }
                              const parts = sourceText.split('：');
                              return (
                                <>
                                  {parts[0]}：{' '}
                                  <a 
                                    href={t('resources.collections.community.grifter.sourceLink') as string} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 underline link-hover"
                                  >
                                    {parts[1]?.trim()}
                                  </a>
                                </>
                              );
                            })()}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
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
                    className="h-auto py-6 w-full flex items-start justify-start text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-300 transition-all cursor-pointer group mb-6"
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
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 overflow-x-auto mb-6">
                      <code className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                        /data/{'\n'}
                        {'\n'}
                        projects.json → All collections + license info{'\n'}
                        /avatars/{'\n'}
                        100avatars-r1.json → Individual avatar data{'\n'}
                        100avatars-r2.json{'\n'}
                        100avatars-r3.json{'\n'}
                        vipe-heroes-genesis.json{'\n'}
                        grifters-squaddies.json
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
                    className="h-auto py-6 w-full flex items-start justify-start text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-300 transition-all cursor-pointer group"
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
                        const parts = contributeText.split('経由');
                        return (
                          <>
                            {parts[0]}
                            <a 
                              href={t('resources.help.contributeLink') as string} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 underline link-hover ml-1"
                            >
                              GitHub Discussions経由
                            </a>
                            でコレクションを提出してください。
                          </>
                        );
                      })()}
                    </p>
                  </div>
                  <p className="text-body font-semibold text-gray-900 dark:text-gray-100">
                    {(() => {
                      const contact = t('resources.help.contact');
                      const contactText = typeof contact === 'string' ? contact : String(contact);
                      const parts = contactText.split('：');
                      return (
                        <>
                          {parts[0]}：{' '}
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
