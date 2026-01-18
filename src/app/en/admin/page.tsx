'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AvatarAdminDashboard from '@/components/AvatarAdminDashboard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Simplified admin page that doesn't check auth
  // We'll rely on the API calls to check auth

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      
      // Use the logout API endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to sign out');
      }
      
      router.replace('/');
      router.refresh(); // Force a refresh to clear state
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 flex justify-between items-center bg-cream border-b">
        <div className="text-sm text-gray-600">
          Admin Dashboard
        </div>
        <Button 
          onClick={handleSignOut}
          variant="destructive"
        >
          Sign Out
        </Button>
      </div>
      <AvatarAdminDashboard />
    </div>
  );
}