import { NextRequest, NextResponse } from 'next/server';

const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || 'ToxSam';
const GITHUB_REPO = process.env.GITHUB_REPO_NAME || 'open-source-avatars';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const RAW_CONTENT_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;

interface Project {
  id: string;
  name: string;
  creator_id: string;
  description: string;
  is_public: boolean;
  license: string;
  source_type: string;
  source_network?: string | string[];
  source_contract?: string | string[];
  storage_type: string;
  opensea_url?: string;
  avatar_data_file: string;
  created_at: string;
  updated_at: string;
}

export async function GET(req: NextRequest) {
  try {
    const url = `${RAW_CONTENT_BASE}/data/projects.json?timestamp=${Date.now()}`;
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
      },
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status}`);
    }

    const projects: Project[] = await response.json();

    // Filter for community collections (NFT collections, excluding original 100avatars)
    const communityCollections = projects.filter((project) => {
      return (
        project.is_public &&
        project.source_type === 'nft' &&
        !project.id.startsWith('100avatars')
      );
    });

    // Sort by updated_at (most recent first)
    communityCollections.sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return NextResponse.json({
      collections: communityCollections,
    });
  } catch (error) {
    console.error('Error fetching community collections:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch community collections',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
