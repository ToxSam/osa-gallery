import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import * as Switch from '@radix-ui/react-switch';
import { AvatarFormData, UploadProgress } from '@/types/avatar';

interface AvatarFormFieldsProps {
  formData: AvatarFormData;
  uploadProgress: UploadProgress;
  onChange: (formData: AvatarFormData) => void;
}

export function AvatarFormFields({ formData, uploadProgress, onChange }: AvatarFormFieldsProps) {
  const updateField = (field: keyof AvatarFormData, value: any) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-900 font-medium">Name</Label>
          <Input
            required
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Avatar name"
            className="text-gray-900"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-900 font-medium">Project</Label>
          <Input
            required
            value={formData.project}
            onChange={(e) => updateField('project', e.target.value)}
            placeholder="Project name"
            className="text-gray-900"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-900 font-medium">Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Avatar description"
          className="text-gray-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-900 font-medium">Polygons</Label>
          <Input
            required
            value={formData.polygons}
            onChange={(e) => updateField('polygons', e.target.value)}
            placeholder="Polygon count"
            className="text-gray-900"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-900 font-medium">Materials</Label>
          <Input
            required
            type="number"
            value={formData.materials}
            onChange={(e) => updateField('materials', e.target.value)}
            placeholder="Material count"
            className="text-gray-900"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-900 font-medium">Model File</Label>
        <Input
          required
          type="file"
          accept=".vrm,.glb"
          onChange={(e) => updateField('modelFile', e.target.files?.[0] || null)}
          className="text-gray-900"
        />
        {uploadProgress.model > 0 && (
          <Progress value={uploadProgress.model} className="h-2" />
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-gray-900 font-medium">Thumbnail</Label>
        <Input
          required
          type="file"
          accept="image/*"
          onChange={(e) => updateField('thumbnail', e.target.files?.[0] || null)}
          className="text-gray-900"
        />
        {uploadProgress.thumbnail > 0 && (
          <Progress value={uploadProgress.thumbnail} className="h-2" />
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch.Root
          id="public-switch"
          checked={formData.isPublic}
          onCheckedChange={(checked) => updateField('isPublic', checked)}
          className="relative h-6 w-11 cursor-pointer rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 data-[state=checked]:bg-gray-900"
        >
          <Switch.Thumb className="block h-5 w-5 rounded-full bg-cream transition-transform data-[state=checked]:translate-x-5" />
        </Switch.Root>
        <Label htmlFor="public-switch" className="text-gray-900 font-medium">
          Make public immediately
        </Label>
      </div>
    </div>
  );
}