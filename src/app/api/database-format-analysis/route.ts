import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Define a type-safe interface
interface Avatar {
  id: string;
  name: string;
  metadata: {
    alternateModels?: Record<string, string>;
    [key: string]: any;
  };
  [key: string]: any;
}

// Mark route as dynamic since it uses no-store fetch
export const dynamic = 'force-dynamic';

// Define expected standard format keys
const STANDARD_KEYS = ['voxel', 'voxel_vrm', 'fbx', 'voxel_fbx', 'voxel-fbx'];

// Function to get avatars directly from the JSON file
async function getAvatarsFromFile(): Promise<Avatar[]> {
  try {
    // First try the repository directory structure (local development)
    const filePath = path.resolve(process.cwd(), '..', 'open-source-avatars', 'data', 'avatars.json');
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    }
    
    // If that fails, try to fetch from GitHub API as fallback
    console.log('Local avatars.json not found, fetching from GitHub API...');
    const response = await fetch(
      'https://raw.githubusercontent.com/ToxSam/open-source-avatars/main/data/avatars.json',
      { cache: 'no-store' }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API responded with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error reading avatars file:', error);
    // Return empty array as fallback
    return [];
  }
}

export async function GET() {
  try {
    // Get all avatars directly from the file
    const avatars = await getAvatarsFromFile();
    
    // If no avatars found, return early with error
    if (avatars.length === 0) {
      return NextResponse.json({ 
        error: 'No avatars found',
        message: 'Could not retrieve avatar data from file or API'
      }, { status: 404 });
    }
    
    // Group avatars by their metadata patterns
    const patternGroups: Record<string, any> = {};
    const nonStandardAvatars: Avatar[] = [];
    
    // Track key variations for normalization planning
    const keyVariations: Record<string, Set<string>> = {
      'voxel_vrm': new Set(['voxel_vrm']),
      'fbx': new Set(['fbx']),
      'voxel_fbx': new Set(['voxel_fbx']),
    };
    
    // Analyze each avatar's metadata structure
    avatars.forEach(avatar => {
      if (!avatar.metadata?.alternateModels) return;
      
      const alternateModels = avatar.metadata.alternateModels;
      const keys = Object.keys(alternateModels).sort();
      const pattern = keys.join(',');
      
      // Track the pattern group
      if (!patternGroups[pattern]) {
        patternGroups[pattern] = {
          count: 0,
          keys,
          examples: []
        };
      }
      
      patternGroups[pattern].count++;
      
      // Add example if needed
      if (patternGroups[pattern].examples.length < 3) {
        patternGroups[pattern].examples.push({
          id: avatar.id,
          name: avatar.name
        });
      }
      
      // Check for non-standard keys
      const hasNonStandardKeys = keys.some(key => !STANDARD_KEYS.includes(key));
      if (hasNonStandardKeys) {
        nonStandardAvatars.push(avatar);
        
        // Track variations for standardization planning
        keys.forEach(key => {
          if (key.includes('voxel') && (key.includes('vrm') || (!key.includes('fbx') && !key.includes('FBX')))) {
            keyVariations['voxel_vrm'].add(key);
          } else if ((key.includes('fbx') || key.includes('FBX')) && !key.includes('voxel')) {
            keyVariations['fbx'].add(key);
          } else if ((key.includes('fbx') || key.includes('FBX')) && key.includes('voxel')) {
            keyVariations['voxel_fbx'].add(key);
          }
        });
      }
    });
    
    // Create a standardization mapping plan
    const standardizationPlan: Record<string, string> = {};
    
    for (const [standardKey, variations] of Object.entries(keyVariations)) {
      variations.forEach(variation => {
        if (variation !== standardKey) {
          standardizationPlan[variation] = standardKey;
        }
      });
    }
    
    // Generate database update statements for non-standard avatars
    const updateStatements: string[] = [];
    const sqlStatements: string[] = [];
    
    nonStandardAvatars.forEach(avatar => {
      const alternateModels = { ...avatar.metadata.alternateModels };
      let needsUpdate = false;
      const updatedModels: Record<string, string> = {};
      
      Object.entries(alternateModels).forEach(([key, value]) => {
        if (standardizationPlan[key]) {
          const standardKey = standardizationPlan[key];
          // Only create an update if we're not overwriting an existing key
          if (!alternateModels[standardKey]) {
            needsUpdate = true;
            updatedModels[standardKey] = value as string;
            updateStatements.push(
              `-- Update avatar ${avatar.name} (${avatar.id}): Rename key '${key}' to '${standardKey}'`
            );
            
            // Generate SQL update statement
            const sqlUpdate = `
-- Avatar: ${avatar.name} (${avatar.id})
-- Rename '${key}' to '${standardKey}'
UPDATE avatars 
SET metadata = jsonb_set(
  metadata, 
  '{alternateModels,${standardKey}}', 
  '"${value}"'::jsonb
) 
WHERE id = '${avatar.id}';

-- Then remove the old key
UPDATE avatars 
SET metadata = metadata #- '{alternateModels,${key}}' 
WHERE id = '${avatar.id}';
`;
            sqlStatements.push(sqlUpdate);
          } else {
            updateStatements.push(
              `-- Warning: Avatar ${avatar.name} (${avatar.id}) has both '${key}' and '${standardKey}' keys`
            );
          }
        }
      });
    });
    
    // Sort patterns by count (most common first)
    const sortedPatterns = Object.entries(patternGroups)
      .sort((a, b) => b[1].count - a[1].count)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as Record<string, any>);
    
    // Return the full analysis
    return NextResponse.json({
      totalAvatars: avatars.length,
      avatarsWithAlternateModels: avatars.filter(a => a.metadata?.alternateModels).length,
      nonStandardAvatarsCount: nonStandardAvatars.length,
      patterns: sortedPatterns,
      nonStandardAvatars: nonStandardAvatars.map(a => ({
        id: a.id,
        name: a.name,
        format: a.format,
        keys: Object.keys(a.metadata.alternateModels || {}),
      })),
      keyVariations: Object.fromEntries(
        Object.entries(keyVariations).map(([key, set]) => [key, Array.from(set)])
      ),
      standardizationPlan,
      updateStatements,
      sqlStatements
    });
  } catch (error) {
    console.error('Error analyzing avatar formats:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze avatar formats',
      message: (error as Error).message
    }, { status: 500 });
  }
} 