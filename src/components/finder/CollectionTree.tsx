'use client';

import React from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Project, Avatar } from '@/types/avatar';

interface GroupedCollection {
  id: string;
  name: string;
  projects: Project[];
  isExpanded: boolean;
}

interface CollectionTreeProps {
  collections: GroupedCollection[];
  selectedCollectionIds: Set<string>;
  onCollectionToggle: (collectionId: string) => void;
  onCollectionExpand: (collectionId: string) => void;
  avatars: Avatar[];
}

export default function CollectionTree({
  collections,
  selectedCollectionIds,
  onCollectionToggle,
  onCollectionExpand,
  avatars,
}: CollectionTreeProps) {
  const { t } = useI18n();

  // Get avatar count for a collection
  const getAvatarCount = (collection: GroupedCollection): number => {
    const projectIds = new Set(collection.projects.map((p) => p.id));
    return avatars.filter((a) => projectIds.has(a.projectId)).length;
  };

  // Get avatar count for a project
  const getProjectAvatarCount = (projectId: string): number => {
    return avatars.filter((a) => a.projectId === projectId).length;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none px-4 py-3 border-b border-gray-300 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
          {t('finder.collections.title')}
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
        {collections.map((collection) => {
          const isSelected = selectedCollectionIds.has(collection.id);
          const avatarCount = getAvatarCount(collection);
          const isGroup = collection.projects.length > 1;

          return (
            <div key={collection.id}>
              {/* Collection/Project Header */}
              <div
                className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium border-l-2 border-gray-900 dark:border-gray-100'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => {
                  if (isGroup) {
                    onCollectionExpand(collection.id);
                  }
                  onCollectionToggle(collection.id);
                }}
              >
                {isGroup && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCollectionExpand(collection.id);
                    }}
                    className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    {collection.isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}
                {!isGroup && <div className="w-5" />}
                
                {collection.isExpanded ? (
                  <FolderOpen className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <Folder className="h-4 w-4 flex-shrink-0" />
                )}
                
                <span className="flex-1 truncate text-sm font-medium">
                  {collection.name}
                </span>
                
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {avatarCount}
                </span>
              </div>

              {/* Nested Projects (if group is expanded) */}
              {isGroup && collection.isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {collection.projects.map((project) => {
                    const projectIsSelected = selectedCollectionIds.has(project.id);
                    const projectAvatarCount = getProjectAvatarCount(project.id);

                    return (
                      <div
                        key={project.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                          projectIsSelected
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium border-l-2 border-gray-900 dark:border-gray-100'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400'
                        }`}
                        onClick={() => onCollectionToggle(project.id)}
                      >
                        <div className="w-4" />
                        <Folder className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="flex-1 truncate text-xs">
                          {project.name}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {projectAvatarCount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
