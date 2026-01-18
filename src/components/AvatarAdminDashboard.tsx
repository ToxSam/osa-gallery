"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AvatarUploadDialog from '@/components/avatar/AvatarUploadDialog';

interface Avatar {
  id: string;
  name: string;
  project: string;
  description: string;
  createdAt: string;
  thumbnailUrl: string | null;
  modelFileUrl: string | null;
  polygonCount: number;
  format: string;
  materialCount: number;
  isPublic: boolean;
  isDraft: boolean;
}

export default function AvatarAdminDashboard() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchAvatars = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/avatars', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch avatars: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data && Array.isArray(data.avatars)) {
        setAvatars(data.avatars);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch avatars');
      setAvatars([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvatars();
  }, []);

  const handleDelete = async (avatarId: string) => {
    if (!confirm('Are you sure you want to delete this avatar?')) return;
    
    try {
      const response = await fetch(`/api/avatars/${avatarId}`, {
        method: 'DELETE'
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete avatar' }));
        throw new Error(errorData.error || 'Failed to delete avatar');
      }
  
      // Refresh avatars list
      fetchAvatars();
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      // Show error to user (you can use your toast/alert system)
      alert(error instanceof Error ? error.message : 'Failed to delete avatar');
    }
  };

  const toggleVisibility = async (avatarId: string) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/avatars/${avatarId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update visibility' }));
        throw new Error(errorData.error || 'Failed to update visibility');
      }

      await fetchAvatars();
    } catch (error) {
      console.error('Visibility toggle error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update visibility');
    }
  };

  const filteredAvatars = avatars.filter(avatar =>
    avatar.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleUploadSuccess = async () => {
    await fetchAvatars();
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Avatar Management</h1>
          <Button 
            size="lg" 
            className="bg-gray-900 text-white hover:bg-gray-800"
            onClick={() => setIsDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload New Avatar
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Search */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <Input
              placeholder="Search avatars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md border-gray-200"
            />
          </CardContent>
        </Card>

        {/* Avatar List */}
        <Card className="overflow-hidden">
          <CardHeader className="px-6">
            <CardTitle>Avatars</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-4">Loading avatars...</div>
            ) : filteredAvatars.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchQuery ? 'No avatars found matching your search.' : 'No avatars available.'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAvatars.map(avatar => (
                  <Card key={avatar.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={avatar.thumbnailUrl || '/api/placeholder/100/100'}
                          alt={avatar.name}
                          className="w-24 h-24 rounded-lg object-cover bg-gray-100"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium text-lg text-gray-900">{avatar.name}</h3>
                              <p className="text-gray-500">{avatar.project}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleVisibility(avatar.id)}
                                title={avatar.isPublic ? 'Make private' : 'Make public'}
                              >
                                {avatar.isPublic ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(avatar.id)}
                                title="Delete avatar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-600 mt-2">{avatar.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">{avatar.format}</Badge>
                            <Badge variant="secondary">{avatar.polygonCount.toLocaleString()} polys</Badge>
                            <Badge variant="secondary">{avatar.materialCount} materials</Badge>
                            {!avatar.isPublic && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                Hidden
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AvatarUploadDialog 
        open={isDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}