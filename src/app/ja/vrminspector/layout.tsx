import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VRM Inspector - Open Source Avatars',
  description: 'Inspect and analyze VRM files - view metadata, textures, and 3D models'
};

export default function VRMInspectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-cream">
      {children}
    </div>
  );
} 