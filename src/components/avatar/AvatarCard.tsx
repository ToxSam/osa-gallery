///src/components/avatar/AvatarCard.tsx

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate, getPlaceholderImage } from '@/lib/utils/formatters';

interface AvatarCardProps {
  avatar: {
    id: string;
    name: string;
    project: string;
    createdAt: string;
    thumbnailUrl: string | null;
  };
  isSelected: boolean;
  isActive: boolean;
  onSelect: (id: string) => void;
  onClick: (avatar: any) => void;
}

export const AvatarCard: React.FC<AvatarCardProps> = ({
  avatar,
  isSelected,
  isActive,
  onSelect,
  onClick,
}) => {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(avatar.id);
  };

  return (
    <Card
      className={`cursor-pointer hover:border-gray-900 transition-all
        ${isActive ? 'border-black' : 'border-gray-200'}`}
      onClick={() => onClick(avatar)}
    >
      <CardContent className="flex items-center p-2 sm:p-3 gap-2 sm:gap-3">
        <div onClick={handleCheckboxClick}>
          <Checkbox
            checked={isSelected}
            className="h-3 w-3 sm:h-4 sm:w-4"
          />
        </div>
        <div className="h-12 w-12 sm:h-16 sm:w-16 relative flex-shrink-0">
          <img
            src={avatar.thumbnailUrl || getPlaceholderImage(100, 100)}
            alt={avatar.name}
            className="rounded-md object-contain w-full h-full bg-gray-50"
          />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
            {avatar.name}
          </h3>
          <p className="text-xs text-gray-500">{avatar.project}</p>
          <p className="text-xs text-gray-400">
            {formatDate(avatar.createdAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
