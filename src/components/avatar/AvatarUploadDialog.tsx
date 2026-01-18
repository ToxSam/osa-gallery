// src/components/avatar/AvatarUploadDialog.tsx
import React from 'react';
import { Save, Loader2, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from "@/components/ui/button";
import { AvatarFormFields } from './AvatarFormFields';
import { useAvatarUpload } from '@/lib/hooks/useAvatarUpload';

interface AvatarUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AvatarUploadDialog({ open, onClose, onSuccess }: AvatarUploadDialogProps) {
  const {
    formData,
    setFormData,
    isSubmitting,
    error,
    uploadProgress,
    handleSubmit
  } = useAvatarUpload();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(onSuccess, onClose);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content 
  className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-2xl bg-cream rounded-lg shadow-lg focus:outline-none overflow-y-auto max-h-[90vh]"
  aria-describedby="dialog-description"
>
  <div className="p-6">
    <div className="relative mb-6">
      <Dialog.Title className="text-xl font-semibold text-gray-900">
        Upload New Avatar
      </Dialog.Title>
      <Dialog.Description id="dialog-description" className="mt-2 text-gray-600">
        Upload your avatar files and provide the necessary information. Supported formats are VRM and GLB.
      </Dialog.Description>
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 rounded-full p-2"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <AvatarFormFields
                formData={formData}
                uploadProgress={uploadProgress}
                onChange={setFormData}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gray-900 text-white hover:bg-gray-800"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Avatar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}